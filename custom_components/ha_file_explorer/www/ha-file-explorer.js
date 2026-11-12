/**
 * File Explorer — a native Home Assistant custom panel.
 *
 * HA loads this file as an ES module (<script type="module">) and then creates
 * <ha-file-explorer-panel>, setting the hass / panel / narrow / route properties.
 * The layout follows Windows 11 Explorer: a compact command bar, an address
 * bar of breadcrumbs and one merged list where folders sit right above files.
 */
import { createApi } from "./modules/api.js";
import { createI18n } from "./modules/i18n.js";
import {
  MAX_HIGHLIGHT_CHARS,
  highlightToHTML,
  languageFor,
  loadPrism,
} from "./modules/highlight.js";
import { formatText, lintKind, lintText } from "./modules/lint.js";
import { styles } from "./modules/styles.js";
import {
  esc,
  editorMode,
  dateText,
  fileIcon,
  formatSize,
  haSystemKind,
  isEditable,
  isMedia,
  isVideo,
  joinPath,
  parentPath,
  splitPath,
} from "./modules/format.js";

const TAG = "ha-file-explorer-panel";

/**
 * Flatten a drop into `{ file, relative, folder }` tasks.
 *
 * Everything is read from the DataTransfer synchronously, before the first
 * `await`: Chrome puts the item list into protected mode as soon as the drop
 * handler yields, and an entry read after that point comes back empty.
 * `webkitGetAsEntry` is the usual way to see the folder structure; the File
 * System Access handle (`getAsFileSystemHandle`) is the fallback for engines
 * that never expose entries. Plain `files` come last.
 */
async function collectTransfer(transfer) {
  const out = [];
  const items = Array.from((transfer && transfer.items) || []);
  const files = Array.from((transfer && transfer.files) || []);
  const entries = [];
  const handles = [];
  const loose = [];
  const seen = new Set();

  for (const item of items) {
    if (item.kind !== "file") continue;
    let entry = null;
    try {
      entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    } catch (_err) {
      entry = null;
    }
    if (entry) {
      entries.push(entry);
      continue;
    }
    // Ask for a handle now, while the transfer is still alive; the promise is
    // awaited further down, but the request itself has to happen synchronously.
    let handle = null;
    try {
      handle = item.getAsFileSystemHandle ? item.getAsFileSystemHandle() : null;
    } catch (_err) {
      handle = null;
    }
    if (handle && typeof handle.then === "function") handles.push(handle);
    let file = null;
    try {
      file = item.getAsFile ? item.getAsFile() : null;
    } catch (_err) {
      file = null;
    }
    if (file) loose.push({ file, relative: file.webkitRelativePath || file.name, folder: null });
  }

  const push = (task) => {
    if (!task || !task.file || seen.has(task.relative)) return;
    seen.add(task.relative);
    out.push(task);
  };

  /** `folder` is the top-level dropped folder, or null for a loose file. */
  const walk = (entry, prefix, folder) =>
    new Promise((resolve) => {
      if (!entry) {
        resolve();
        return;
      }
      if (entry.isFile) {
        entry.file(
          (file) => {
            push({ file, relative: prefix + file.name, folder });
            resolve();
          },
          () => resolve()
        );
        return;
      }
      const reader = entry.createReader();
      const next = () => {
        reader.readEntries(
          (batch) => {
            if (!batch.length) {
              resolve();
              return;
            }
            Promise.all(
              batch.map((child) => walk(child, `${prefix}${entry.name}/`, folder || entry.name))
            ).then(next);
          },
          () => resolve()
        );
      };
      next();
    });

  const walkHandle = async (handle, prefix, folder) => {
    if (!handle || typeof handle.values !== "function" || handle.kind === "file") return;
    try {
      for await (const child of handle.values()) {
        if (child.kind === "file") {
          try {
            const file = await child.getFile();
            push({ file, relative: `${prefix}${handle.name}/${file.name}`, folder });
          } catch (_err) {
            /* skip an unreadable entry */
          }
        } else {
          await walkHandle(child, `${prefix}${handle.name}/`, folder);
        }
      }
    } catch (_err) {
      /* a directory that refuses to enumerate simply contributes nothing */
    }
  };

  if (entries.length) {
    await Promise.all(
      entries.map((entry) =>
        walk(entry, entry.isDirectory ? "" : "", entry.isDirectory ? entry.name : null)
      )
    );
  }

  for (const pending of handles) {
    let handle = null;
    try {
      handle = await pending;
    } catch (_err) {
      handle = null;
    }
    if (!handle) continue;
    if (handle.kind === "file") {
      try {
        const file = await handle.getFile();
        push({ file, relative: file.webkitRelativePath || file.name, folder: null });
      } catch (_err) {
        /* ignore */
      }
      continue;
    }
    await walkHandle(handle, "", handle.name);
  }

  for (const task of loose) push(task);
  if (!out.length) {
    for (const file of files) {
      push({ file, relative: file.webkitRelativePath || file.name, folder: null });
    }
  }

  // A folder an engine refuses to expand arrives as a zero-byte, type-less
  // "file" carrying nothing but the folder name — flag it so the UI can say so
  // instead of queueing a bogus row.
  for (const task of out) {
    if (task.folder) continue;
    const size = task.file ? task.file.size : 0;
    if (size === 0 && !(task.file && task.file.type) && !/\.\w{1,8}$/.test(task.relative)) {
      task.folderLike = true;
    }
  }
  return out;
}

class HaFileExplorerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = undefined;
    this._panel = undefined;
    this._api = undefined;
    this._i18n = undefined;
    this._path = "";
    this._items = [];
    this._view = "list";
    // null means "follow the screen width": tiles on desktop, rows on mobile.
    this._viewMode = null;
    this._lastMode = null;
    this._filter = "";
    this._editor = { path: "", name: "", value: "", dirty: false };
    this._dialog = null;
    this._preview = null;
    // Drop targets collect here; nothing is written until the queue is confirmed.
    this._queue = [];
    this._menu = false;
    this._rowMenu = null;
    this._bgMenu = null;
    this._viewMenu = null;
    // Display options: the date column is noise by default, so it is opt-in.
    this._showSize = this._pref("showSize", true);
    this._showTime = this._pref("showTime", false);
    this._loading = false;
    this._loadStarted = false;
    // The card paints an empty folder before the first listing arrives, which
    // reads as "nothing loaded"; a boot overlay covers that gap instead.
    this._booted = false;
    this._loadError = null;
    // Blob URLs for locally served brand art, revoked on the next render.
    this._brandUrls = [];
    this._ready = false;
  }

  /* Properties set by ha-panel-custom. */
  set hass(value) {
    const previousLanguage = this._hass && this._hass.language;
    const previousSidebar = this._sidebarState();
    this._hass = value;
    this._api = createApi(value);
    if (!this._ready) return;
    if (!this._loadStarted && value) this._load();
    if (previousSidebar !== this._sidebarState()) this._renderTopbar();
    if (previousLanguage === (value && value.language)) return;
    this._i18n = createI18n(value);
    this._renderTopbar();
    if (this._view !== "editor") {
      this._renderCrumbs();
      this._renderList();
    }
    this._renderDialog();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    this._panel = value;
    if (this._ready) this._renderTopbar();
  }

  get panel() {
    return this._panel;
  }

  set narrow(value) {
    const wasNarrow = this.classList.contains("narrow");
    this.classList.toggle("narrow", Boolean(value));
    if (!this._ready) return;
    // The default layout follows the viewport, so a width change can flip it.
    if (wasNarrow !== Boolean(value) && this._view !== "editor") {
      const mode = this._currentView();
      if (mode !== this._lastMode) this._renderList();
    }
    // The header hamburger only exists while the HA sidebar is hidden.
    if (wasNarrow !== Boolean(value)) this._renderTopbar();
  }

  set route(value) {
    this._route = value;
  }

  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this._i18n = createI18n(this._hass);
    if (!this._api) this._api = createApi(this._hass);
    this._buildShell();
    this._render();
    if (this._hass) this._load();
  }

  disconnectedCallback() {
    // The panel can be detached (partial-panel-resolver suspends hidden
    // panels), so release the preview's object URL instead of leaking it.
    if (this._preview && this._preview.revoke) this._preview.revoke();
    this._preview = null;
  }

  _t(key, ...args) {
    return this._i18n.t(key, ...args);
  }

  /**
   * Where the HA sidebar currently lives: "kiosk" (disabled), "hidden" (only
   * reachable through a modal drawer, i.e. narrow viewport or the "always
   * hidden" setting) or "visible" (docked or in the icon rail).
   *
   * The panel never relies on HA's own header: it draws its own toolbar and
   * only offers a hamburger when the sidebar is actually out of sight.
   */
  _sidebarState() {
    const hass = this._hass;
    if (hass && hass.kioskMode) return "kiosk";
    if (this.classList.contains("narrow")) return "hidden";
    if (hass && hass.dockedSidebar === "always_hidden") return "hidden";
    return "visible";
  }

  _sidebarHidden() {
    return this._sidebarState() === "hidden";
  }

  _buildShell() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="fe-app" id="app">
        <header class="fe-topbar" id="topbar"></header>
        <div class="fe-body">
          <main class="fe-main">
            <div class="fe-list" id="list"></div>
            <div class="fe-editor" id="editor-pane" hidden></div>
          </main>
        </div>
        <div class="fe-boot" id="boot"><span class="fe-spin" aria-hidden="true"></span><span class="fe-boot-text">${esc(this._t("loading"))}</span></div>
        <div class="fe-menu-layer" id="menu-layer" data-action="close-menu"></div>
        <div class="fe-dialog-layer" id="dialog-layer"></div>
        <div class="fe-toast-container" id="toast-root"></div>
        <div class="fe-progress" id="loading" hidden></div>
      </div>
    `;
    this.shadowRoot.addEventListener("click", (event) => this._onClick(event));
    this.shadowRoot.addEventListener("contextmenu", (event) => this._onContextMenu(event));
    this.shadowRoot.addEventListener("input", (event) => this._onInput(event));
    this.shadowRoot.addEventListener("change", (event) => this._onChange(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._onKeyDown(event));

    // A popover anchored to a row cannot follow the row once the list scrolls
    // or the panel is resized, so dismiss it instead of leaving it behind.
    const list = this.shadowRoot.querySelector("#list");
    list.addEventListener(
      "scroll",
      () => {
        if (this._rowMenu) this._closeRowMenu();
        if (this._bgMenu) this._closeBgMenu();
        if (this._viewMenu) this._closeViewMenu();
      },
      { passive: true }
    );
    // A right-click menu is dismissable even when focus never entered the
    // shadow root (the rows themselves are not focusable).
    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!this._menu && !this._rowMenu && !this._bgMenu && !this._viewMenu) return;
      event.preventDefault();
      if (this._rowMenu) this._closeRowMenu();
      if (this._bgMenu) this._closeBgMenu();
      if (this._viewMenu) this._closeViewMenu();
      if (this._menu) this._closeMenu();
    });
    window.addEventListener("resize", () => {
      if (this._rowMenu) this._closeRowMenu();
      if (this._viewMenu) this._closeViewMenu();
      // The default layout follows the width, so re-render when it flips.
      if (!this._ready || this._view === "editor") return;
      const mode = this._currentView();
      if (mode !== this._lastMode) this._renderList();
    });
    this._bindDropZone();
  }

  /**
   * Drag and drop anywhere on the panel uploads into the current folder, the
   * way Explorer accepts a drop on an open folder. Folders keep their shape
   * because `collectTransfer` reports each file's relative path.
   */
  _bindDropZone() {
    const app = this.shadowRoot.querySelector("#app");
    const hasFiles = (event) =>
      Boolean(event.dataTransfer) && Array.from(event.dataTransfer.types || []).includes("Files");
    let depth = 0;

    app.addEventListener("dragenter", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      if (this._canDrop()) this._showDropHint(true);
    });
    app.addEventListener("dragover", (event) => {
      if (!hasFiles(event)) return;
      // Without preventDefault the browser refuses the drop and opens the file.
      event.preventDefault();
      event.dataTransfer.dropEffect = this._canDrop() ? "copy" : "none";
    });
    app.addEventListener("dragleave", () => {
      // Do not filter on `types` here: Chrome reports an empty list once the
      // pointer leaves the element, which would leave the hint stuck on screen.
      depth = Math.max(0, depth - 1);
      if (depth === 0) this._showDropHint(false);
    });
    // A drop that lands outside the panel, or Esc, must clear the hint too.
    window.addEventListener("drop", () => {
      depth = 0;
      this._showDropHint(false);
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" || event.key === "Esc") {
        depth = 0;
        this._showDropHint(false);
      }
    });
    app.addEventListener("drop", async (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      this._showDropHint(false);
      if (!this._canDrop()) return;
      await this._uploadTransfer(event.dataTransfer);
    });
  }

  _canDrop() {
    // Adding to the upload queue while it is open is the expected behaviour.
    const queueOpen = Boolean(this._dialog && this._dialog.queue);
    return this._ready && this._view !== "editor" && !this._preview && (!this._dialog || queueOpen);
  }

  _showDropHint(on) {
    const app = this.shadowRoot.querySelector("#app");
    const existing = this.shadowRoot.querySelector("#drop-hint");
    if (!on) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    const hint = document.createElement("div");
    hint.id = "drop-hint";
    // Keep the header and the breadcrumbs readable: the hint covers the file area only.
    const topbar = this.shadowRoot.querySelector("#topbar");
    hint.style.top = `${((topbar && topbar.offsetHeight) || 0) + 8}px`;
    hint.className = "fe-drop";
    hint.innerHTML = `<ha-icon class="fe-ico" icon="mdi:cloud-upload-outline"></ha-icon><div>${esc(
      this._t("dropHint")
    )}</div>`;
    app.appendChild(hint);
  }

  /**
   * A drop only enqueues. Nothing is written until the queue is confirmed,
   * and every drop adds to the same queue instead of opening its own dialog.
   */
  async _uploadTransfer(transfer) {
    const all = await collectTransfer(transfer);
    // Folders this engine refused to expand: say so instead of queueing a row
    // that is nothing but the folder's own name.
    const blocked = all.filter((task) => task.folderLike).length;
    const tasks = all.filter((task) => !task.folderLike);
    if (!tasks.length) {
      const items = Array.from((transfer && transfer.items) || []);
      // eslint-disable-next-line no-console
      console.warn("[file-explorer] drop carried no readable files", {
        types: transfer ? Array.from(transfer.types || []) : [],
        items: items.map((item) => item.kind),
        files: transfer ? (transfer.files || []).length : 0,
        folderLike: blocked,
      });
      this._toast(this._t(blocked ? "folderUnreadable" : "noFiles"), "error");
      return;
    }
    if (blocked) this._toast(this._t("folderUnreadableSome", blocked), "error");
    const rows = this._queueItems(tasks);
    // One row per file, keyed by its full relative path, so a re-drop of the
    // same folder replaces the row instead of uploading it twice.
    for (const row of rows) {
      const same = this._queue.findIndex((item) => item.name === row.name);
      if (same >= 0) {
        this._queue[same] = row;
      } else {
        this._queue.push(row);
      }
    }
    this._renderQueue();
    this._toast(this._t("queueAdded", rows.length, this._queue.length));
  }

  /**
   * One queue row per file. A file from a dropped folder keeps its full
   * relative path (`folder/sub/file.png`), exactly as it will be written.
   */
  _queueItems(tasks) {
    return tasks.map((task) => ({
      name: task.relative,
      folder: task.folder || null,
      size: task.file ? task.file.size : 0,
      entries: [task],
    }));
  }

  _queueTasks() {
    return this._queue.reduce((all, row) => all.concat(row.entries), []);
  }

  /** Open the queue, or refresh it in place when a drop lands while it is open. */
  _renderQueue() {
    const rows = this._queue
      .map((row, index) => {
        // Every row is a file; a folder drop shows up as folder/sub/ + file.
        const cut = row.name.lastIndexOf("/") + 1;
        const dir = row.name.slice(0, cut);
        const base = row.name.slice(cut);
        return `<div class="fe-upload-item"><span class="fe-upload-kind">📄</span><span class="fe-upload-name" title="${esc(row.name)}"><span class="fe-upload-dir">${esc(
          dir
        )}</span>${esc(base)}</span><span class="fe-upload-size">${esc(
          formatSize(row.size)
        )}</span><button class="fe-upload-remove" data-action="queue-remove" data-index="${index}" title="${esc(
          this._t("remove")
        )}">&times;</button></div>`;
      })
      .join("");
    const content = `
      <p class="hint">${esc(this._t("uploadTarget"))} <code>${esc(
        this._path || this._t("haRoot")
      )}</code></p>
      <p class="hint">${esc(this._t("overwriteHint"))}</p>
      <div class="fe-upload-list">${rows}</div>
      <p class="hint">${esc(
        this._t("queueTotal", this._queue.length, formatSize(this._queue.reduce((sum, row) => sum + row.size, 0)))
      )}</p>
      ${this._queue.length > 1 ? `<button class="fe-btn" data-action="queue-clear">${esc(this._t("queueClear"))}</button>` : ""}`;
    const config = {
      queue: true,
      title: this._t("queueTitle", this._queue.length),
      content,
      confirmText: this._t("queueUpload"),
      onConfirm: async () => {
        await this._runQueue();
        return true;
      },
    };
    if (this._dialog && this._dialog.queue) {
      this._dialog = { ...config, value: "", files: [] };
      this._renderDialog();
      return;
    }
    this._showDialog(config);
  }

  /** Upload the queue one entry at a time, in order. */
  async _runQueue() {
    const tasks = this._queueTasks();
    const rows = this._queue.length;
    this._queue = [];
    if (!tasks.length) return;
    let success = 0;
    this._setLoading(true);
    for (const task of tasks) {
      try {
        const result = await this._api.upload(joinPath(splitPath(this._path), task.relative), task.file);
        if (result && result.code === 0) success += 1;
      } catch (_err) {
        /* keep going, report the failed count at the end */
      }
      this._setLoadingText(this._t("queueProgress", success, tasks.length));
    }
    this._setLoading(false);
    this._toast(
      this._t("uploadSuccess", tasks.length, success),
      success === tasks.length ? "info" : "error"
    );
    // eslint-disable-next-line no-console
    if (rows && tasks.length) console.info("[file-explorer] queue finished", { rows, files: tasks.length });
    await this._load();
  }

  /* ---------- rendering ---------- */

  _render() {
    if (!this._ready) return;
    const isEditor = this._view === "editor";
    this._renderTopbar();
    this.shadowRoot.querySelector("#list").hidden = isEditor;
    this.shadowRoot.querySelector("#editor-pane").hidden = !isEditor;
    if (isEditor) {
      this._renderEditor();
    } else {
      this._renderCrumbs();
      this._renderList();
    }
    this._renderDialog();
  }

  _iconButton(action, icon, title, extra = "", danger = false) {
    return `<button class="fe-icon-btn${danger ? " danger" : ""}" data-action="${esc(action)}" ${extra} title="${esc(title)}" aria-label="${esc(title)}"><ha-icon class="fe-ico fe-icon-btn-ico" icon="${esc(icon)}"></ha-icon></button>`;
  }

  _topButton(action, icon, label, cls = "") {
    return `<button class="fe-btn${cls ? ` ${cls}` : ""}" data-action="${esc(action)}" title="${esc(label)}"><ha-icon class="fe-ico" icon="${esc(icon)}"></ha-icon><span class="fe-btn-label">${esc(label)}</span></button>`;
  }

  /**
   * Height of the HA chrome the panel is mounted under, in whole pixels.
   * Measured rather than assumed: HA's app-header carries its own 1px divider,
   * so `--header-height` (56) and the real box (57) can differ by one pixel,
   * which is exactly what makes the two headers look mistuned.
   */
  _haHeaderHeight() {
    try {
      const header = document.querySelector("app-header");
      const rect = header && header.getBoundingClientRect();
      if (rect && rect.height) return Math.round(rect.height);
      const parsed = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height"));
      if (parsed) return Math.round(parsed);
    } catch (error) {
      /* Not running inside HA (static preview): fall through to the default. */
    }
    return 56;
  }

  /** Same breakpoint as the CSS, so markup and styling never disagree. */
  _isCompact() {
    try {
      return window.matchMedia("(max-width: 870px)").matches;
    } catch (error) {
      return false;
    }
  }

  _renderTopbar() {
    const topbar = this.shadowRoot.querySelector("#topbar");
    const app = this.shadowRoot.querySelector("#app");
    if (app) app.style.setProperty("--fe-header-h", `${this._haHeaderHeight()}px`);
    // The editor bar keeps its divider inside its own height (see .fe-topbar-editor),
    // so the 1px border can't push it 1px past HA's header.
    topbar.classList.toggle("fe-topbar-editor", this._view === "editor");
    if (this._view === "editor") {
      const mode = editorMode(this._editor.name) || this._t("readOnly");
      const formattable = lintKind(this._editor.name);
      // One row only, but stretched to HA's header height (--header-height, 56px)
      // so the panel's bar lines up with the sidebar's own header.
      topbar.innerHTML = `
        <div class="fe-commandbar fe-commandbar-editor">
          ${this._sidebarHidden() ? this._iconButton("ha-menu", "mdi:menu", this._t("showHideSidebar")) : ""}
          ${this._iconButton("back", "mdi:arrow-left", this._t("cancel"))}
          <div class="fe-brand"><strong id="editor-title">${esc(this._editor.name)}${this._editor.dirty ? " •" : ""}</strong></div>
          <span class="fe-badge">${esc(mode)}</span>
          <span class="fe-lint" id="lint" hidden></span>
          <span class="fe-spacer"></span>
          ${formattable ? this._topButton("format", "mdi:auto-fix", this._t("format")) : ""}
          <button class="fe-btn primary" data-action="save" title="${esc(this._t("save"))}"><ha-icon class="fe-ico" icon="mdi:content-save"></ha-icon><span class="fe-btn-label">${esc(this._t("save"))}</span></button>
        </div>`;
      return;
    }

    // The sidebar toggle is only useful while HA's sidebar is out of sight;
    // with a docked sidebar the header stays clean.
    const sidebarButton = this._sidebarHidden()
      ? this._iconButton("ha-menu", "mdi:menu", this._t("showHideSidebar"))
      : "";
    const hasPath = splitPath(this._path).length > 0;

    topbar.innerHTML = `
      <div class="fe-commandbar">
        ${sidebarButton}
        <div class="fe-page-title" id="page-title"></div>
        <span class="fe-divider"></span>
        ${this._topButton("new-file", "mdi:file-plus-outline", this._t("newFile"), "fe-cmd-create")}
        ${this._topButton("new-folder", "mdi:folder-plus-outline", this._t("newFolder"), "fe-cmd-create")}
        <span class="fe-spacer"></span>
        ${this._iconButton("view-options", "mdi:eye-outline", this._t("viewOptions"))}
        ${this._viewSwitch()}
        ${this._iconButton("refresh", "mdi:refresh", this._t("refresh"))}
        ${this._iconButton("more", "mdi:dots-horizontal", this._t("moreOptions"))}
      </div>
      <div class="fe-addressbar" id="addressbar">
        ${this._iconButton("up", "mdi:arrow-up", this._t("up"), hasPath ? "" : " disabled")}
        <div class="fe-crumbs" id="crumbs"></div>
        <div class="fe-search">
          <ha-icon class="fe-ico" icon="mdi:magnify"></ha-icon>
          <input class="fe-search-input" type="search" data-role="search" placeholder="${esc(this._t("searchPlaceholder"))}" value="${esc(this._filter)}" spellcheck="false">
          <button class="fe-search-clear" data-action="clear-search" title="${esc(this._t("clearSearch"))}"${this._filter ? "" : " hidden"}>&times;</button>
        </div>
      </div>`;
    this._renderCrumbs();
    this._renderPageTitle();
  }

  /** Folder name + item count, shown at the left of the command bar. */
  _renderPageTitle() {
    const title = this.shadowRoot.querySelector("#page-title");
    if (!title) return;
    const parts = splitPath(this._path);
    const name = parts.length ? parts[parts.length - 1] : this._t("haRoot");
    const count = this._visibleItems().length;
    title.innerHTML = `<h2>${esc(name)}</h2><span>${esc(this._t("items", count))}</span>`;
  }

  _renderCrumbs() {
    const parts = splitPath(this._path);
    const root = `<button class="fe-crumb ${parts.length ? "" : "current"}" data-action="crumb" data-index="0">${esc(this._t("haRoot"))}</button>`;
    const rest = parts
      .map(
        (part, index) =>
          `<span class="fe-crumb-sep">›</span>` +
          `<button class="fe-crumb ${index === parts.length - 1 ? "current" : ""}" data-action="crumb" data-index="${index + 1}">${esc(part)}</button>`
      )
      .join("");
    this.shadowRoot.querySelector("#crumbs").innerHTML = root + rest;
  }

  _visibleItems() {
    const query = this._filter.trim().toLowerCase();
    // Folders and files share one list: the backend already returns folders
    // first, so the merged view keeps the familiar top group.
    return this._items.filter(
      (item) => !query || item.name.toLowerCase().includes(query)
    );
  }

  /* ---------- view mode (Windows 11 style) ---------- */

  /** "grid" (tiles) on a wide screen, "list" (details rows) on a phone. */
  _autoView() {
    if (this.classList.contains("narrow")) return "list";
    const app = this.shadowRoot.querySelector("#app");
    const width = app ? app.clientWidth : 0;
    // 480 is below any desktop layout, so a real PC always gets tiles.
    return width && width < 480 ? "list" : "grid";
  }

  /** The mode actually used: an explicit pick wins over the screen width. */
  _currentView() {
    return this._viewMode || this._autoView();
  }

  _setView(mode) {
    if (this._viewMode === mode) return;
    this._viewMode = mode;
    if (this._rowMenu) this._closeRowMenu();
    this._renderList();
  }

  _viewSwitch() {
    const current = this._currentView();
    const option = (mode, icon, label) =>
      `<button class="fe-view-btn${current === mode ? " active" : ""}" data-action="set-view" data-mode="${mode}" title="${esc(label)}" aria-label="${esc(label)}" aria-pressed="${current === mode}"><ha-icon class="fe-ico" icon="${esc(icon)}"></ha-icon></button>`;
    return `<div class="fe-view-switch">${option("grid", "mdi:view-grid-outline", this._t("gridView"))}${option("list", "mdi:view-list", this._t("listView"))}</div>`;
  }

  _renderList() {
    if (
      this._rowMenu &&
      this._filter &&
      !this._visibleItems().some((it) => it.name === this._rowMenu.name)
    ) {
      this._rowMenu = null;
      this._syncMenuLayer();
    }
    const items = this._visibleItems();
    // The folder name and the item count live in the header command bar.
    this._renderPageTitle();
    const list = this.shadowRoot.querySelector("#list");
    const mode = this._currentView();
    this._lastMode = mode;
    list.classList.toggle("grid", mode === "grid");
    list.classList.toggle("rows", mode === "list");
    // Size and date are display options: the columns are built from them, so
    // a hidden column never leaves an empty track behind.
    list.classList.toggle("show-size", this._showSize);
    list.classList.toggle("show-time", this._showTime);
    list.style.setProperty("--fe-row-cols", this._rowColumns());
    list.innerHTML = items.length
      ? items.map((item) => (mode === "grid" ? this._fileTile(item) : this._fileRow(item))).join("")
      : this._loadError && !this._filter.trim()
        ? `<div class="fe-empty">
            <ha-icon class="fe-ico" icon="mdi:cloud-off-outline"></ha-icon>
            <div>${esc(this._t("loadFailed"))}</div>
            <div class="fe-empty-actions">${this._topButton("retry-load", "mdi:refresh", this._t("retry"))}</div>
          </div>`
      : this._filter.trim()
        ? `<div class="fe-empty">
            <ha-icon class="fe-ico" icon="mdi:file-search-outline"></ha-icon>
            <div>${esc(this._t("noResults"))}</div>
            <div class="fe-empty-actions">${this._topButton("clear-search", "mdi:close", this._t("clearSearch"))}</div>
          </div>`
        : `<div class="fe-empty">
            <ha-icon class="fe-ico" icon="mdi:folder-open-outline"></ha-icon>
            <div>${esc(this._t("emptyHint"))}</div>
            <div class="fe-empty-actions">
              ${this._topButton("new-file", "mdi:file-plus-outline", this._t("newFile"))}
              ${this._topButton("new-folder", "mdi:folder-plus-outline", this._t("newFolder"))}
              ${this._topButton("upload-files", "mdi:upload", this._t("uploadFiles"))}
            </div>
          </div>`;
    this._bindBrandIcons(list);
  }

  /**
   * Brand icon of a HA integration folder, else "". Only the folders directly
   * under `custom_components` are integrations; their name is the domain HA
   * itself uses to look the picture up.
   */
  _brandDomain(name) {
    const parts = splitPath(this._path);
    if (parts[parts.length - 1] !== "custom_components") return "";
    return /^[a-z0-9_]+$/.test(name) ? name : "";
  }

  /** Drop the object URLs of a previous render; the images using them are gone. */
  _releaseBrandUrls() {
    (this._brandUrls || []).forEach((entry) => entry.revoke());
    this._brandUrls = [];
  }

  /**
   * HA keeps brand art on a public CDN (no auth needed, and <img> does not hit
   * CORS), with a separate set for dark themes.
   */
  _brandUrl(domain, dark) {
    return `https://brands.home-assistant.io/${domain}/${dark ? "dark_icon" : "icon"}.png`;
  }

  /** Tint suffix (" is-ha-dir" / " is-ha-file") for HA's own entries, else "". */
  _haClass(item) {
    const kind = haSystemKind(this._path, item.name, item.type === "dir");
    return kind ? ` is-ha-${kind}` : "";
  }

  /** Icon markup for a row/tile: brand picture for integrations, else the glyph. */
  _rowIcon(item, cls) {
    const isDir = item.type === "dir";
    const domain = isDir ? this._brandDomain(item.name) : "";
    if (!domain) {
      return `<ha-icon class="${cls}" icon="${esc(
        isDir ? "mdi:folder" : fileIcon(this._path, item.name)
      )}"></ha-icon>`;
    }
    const dark = Boolean(this._hass && this._hass.themes && this._hass.themes.darkMode);
    // The folder glyph is drawn underneath at full size and the brand picture
    // fades in on top of it: a slow CDN request then just looks like the icon
    // "refining", never like an empty slot waiting for bytes. `decoding=async`
    // keeps the PNG decode off the main thread.
    return `<span class="${cls} fe-brand-slot">
        <ha-icon class="fe-brand-ghost" icon="mdi:folder"></ha-icon>
        <img class="fe-brand-ico" data-brand="${esc(domain)}" data-dark="${
          dark ? "1" : "0"
        }" src="${esc(
          this._brandUrl(domain, dark)
        )}" alt="" draggable="false" decoding="async">
      </span>`;
  }

  /**
   * A brand picture that 404s (integration without published art, or HA with
   * no internet) must not leave a broken-image box behind: fall back to the
   * light variant first, then to the folder glyph that is already drawn
   * underneath (dropping the picture is all it takes).
   */
  _bindBrandIcons(list) {
    // Object URLs from the previous render belong to nodes that are gone.
    this._releaseBrandUrls();
    list.querySelectorAll("img.fe-brand-ico").forEach((img) => {
      const slot = img.parentElement;
      const drop = () => img.remove();
      /**
       * Fallback ladder: dark CDN art -> light CDN art -> the integration's own
       * `brand/` folder served by the backend (works with no internet) -> plain
       * folder glyph.
       */
      const fail = () => {
        if (img.dataset.dark === "1") {
          img.dataset.dark = "0";
          img.src = this._brandUrl(img.dataset.brand, false);
          return;
        }
        if (img.dataset.local === "1") {
          drop();
          return;
        }
        img.dataset.local = "1";
        this._api
          .brand(img.dataset.brand, this._hass && this._hass.themes && this._hass.themes.darkMode)
          .then((local) => {
            if (!img.isConnected) {
              local.revoke();
              return;
            }
            this._brandUrls.push(local);
            img.src = local.url;
          })
          .catch(drop);
      };
      // Hidden until the picture is really there, so a failed request never
      // flashes the browser's broken-image glyph.
      img.addEventListener("load", () => {
        if (slot) slot.dataset.loaded = "1";
      });
      img.addEventListener("error", fail);
      // Cached results fire before these listeners exist.
      if (img.complete && img.naturalWidth > 0) {
        if (slot) slot.dataset.loaded = "1";
      } else if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  _fileRow(item) {
    const name = esc(item.name);
    const attr = `data-name="${name}"`;
    const open = this._rowMenu && this._rowMenu.name === item.name;
    const isDir = item.type === "dir";
    // A folder row navigates into the folder; files open the editor, while
    // images and videos open the preview dialog.
    const openAction = isDir ? "open-dir" : isMedia(item.name) ? "preview-item" : "edit-item";
    const ha = this._haClass(item);
    return `
      <div class="fe-row${isDir ? " is-dir" : ""}${open ? " menu-open" : ""}" ${attr}${isDir ? ` data-action="open-dir"` : ""}>
        ${this._rowIcon(item, `fe-row-ico${ha}`)}
        <div class="fe-row-name${ha}" data-action="${openAction}" ${attr}>${name}</div>
        <div class="fe-row-time">${esc(item.time)}</div>
        <div class="fe-row-size">${esc(this._sizeText(item))}</div>
        <div class="fe-row-menu">
          <button class="fe-icon-btn fe-row-menu-btn" data-action="row-menu" ${attr} title="${esc(this._t("moreOptions"))}" aria-label="${esc(this._t("moreOptions"))}"><ha-icon class="fe-ico" icon="mdi:dots-vertical"></ha-icon></button>
        </div>
      </div>`;
  }

  /** Windows 11 style tile: big icon, name, then size and date underneath. */
  _fileTile(item) {
    const name = esc(item.name);
    const attr = `data-name="${name}"`;
    const open = this._rowMenu && this._rowMenu.name === item.name;
    const isDir = item.type === "dir";
    const openAction = isDir ? "open-dir" : isMedia(item.name) ? "preview-item" : "edit-item";
    const ha = this._haClass(item);
    return `
      <div class="fe-tile${isDir ? " is-dir" : ""}${open ? " menu-open" : ""}" ${attr}${isDir ? ` data-action="open-dir"` : ""}>
        ${this._rowIcon(item, `fe-tile-ico${ha}`)}
        <div class="fe-tile-name${ha}" data-action="${openAction}" ${attr} title="${name}">${name}</div>
        <div class="fe-tile-meta"><span class="fe-tile-size">${esc(this._sizeText(item))}</span><span class="fe-tile-time">${esc(item.time)}</span></div>
        <div class="fe-tile-menu">
          <button class="fe-icon-btn fe-row-menu-btn" data-action="row-menu" ${attr} title="${esc(this._t("moreOptions"))}" aria-label="${esc(this._t("moreOptions"))}"><ha-icon class="fe-ico" icon="mdi:dots-vertical"></ha-icon></button>
        </div>
      </div>`;
  }

  /** Win11 leaves an empty folder's size blank instead of printing 0 B. */
  _sizeText(item) {
    if (item.type === "dir" && !item.size) return "";
    if (item.size_name) return item.size_name;
    return item.size ? formatSize(item.size) : "";
  }

  /**
   * Grid template for the details rows: built from the columns that are
   * actually visible, so a hidden one never leaves an empty track behind.
   */
  _rowColumns() {
    const app = this.shadowRoot.querySelector("#app");
    const width = app ? app.clientWidth : 0;
    const columns = ["22px", "minmax(0, 1fr)"];
    if (this._showTime) columns.push(width < 760 ? "112px" : "148px");
    if (this._showSize) columns.push(width < 520 ? "70px" : width < 760 ? "84px" : "110px");
    columns.push(width < 520 ? "28px" : width < 760 ? "30px" : "32px");
    return columns.join(" ");
  }

  _openRowMenu(name, rect, point = null) {
    this._closeMenu();
    this._closeBgMenu();
    // `point` is set when the menu comes from a right-click: Windows opens it
    // at the cursor, so the row button must not be used as the anchor.
    this._rowMenu = { name, rect, point };
    this._renderList();
    this._renderRowMenu();
  }

  /** The row's "more options" button, used as the popover anchor. */
  _rowMenuButton(name) {
    const buttons = this.shadowRoot.querySelectorAll(".fe-row-menu-btn");
    for (const button of buttons) {
      if (button.dataset.name === name) return button;
    }
    return null;
  }

  /**
   * Place `menu` next to `anchor` (a viewport DOMRect) inside the menu layer.
   *
   * The menu opens below the anchor, right-aligned to it, and is then flipped
   * above the anchor and clamped into the panel when it would otherwise run
   * past the bottom or the side. `.fe-app` clips its content, so without this
   * clamp a menu on the last row ends up half cut off.
   */
  _placeMenu(menu, anchor) {
    const app = this.shadowRoot.querySelector("#app");
    const bounds = app.getBoundingClientRect();
    const gap = 4;
    const pad = 8;

    const width = menu.offsetWidth;
    const height = menu.offsetHeight;

    // Layer coordinates start at the panel's top-left corner.
    const minLeft = pad;
    const maxLeft = Math.max(minLeft, bounds.width - width - pad);
    let left = anchor.right - bounds.left - width;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    const minTop = pad;
    const maxTop = Math.max(minTop, bounds.height - height - pad);
    // Below the anchor first, above it when there is no room left.
    let top = anchor.bottom - bounds.top + gap;
    if (top > maxTop) top = anchor.top - bounds.top - height - gap;
    top = Math.min(Math.max(top, minTop), maxTop);

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
  }

  /**
   * Place `menu` with its corner at the pointer, the way Windows opens a
   * context menu: down-right from the cursor, flipped when it would run past
   * the panel edge, then clamped so nothing gets clipped.
   */
  _placeMenuAt(menu, clientX, clientY) {
    const app = this.shadowRoot.querySelector("#app");
    const bounds = app.getBoundingClientRect();
    const pad = 8;
    const gap = 2;

    const width = menu.offsetWidth;
    const height = menu.offsetHeight;

    // Clamp to whatever is genuinely visible: the panel box, intersected with
    // the viewport (a preview host may scroll the panel out of view).
    const visibleTop = Math.max(bounds.top, 0);
    const visibleBottom = Math.min(bounds.bottom, window.innerHeight || bounds.bottom);
    const visibleLeft = Math.max(bounds.left, 0);
    const visibleRight = Math.min(bounds.right, window.innerWidth || bounds.right);
    const minLeft = pad;
    const maxLeft = Math.max(minLeft, visibleRight - bounds.left - width - pad);
    const minTop = Math.max(pad, visibleTop - bounds.top + pad);
    const maxTop = Math.max(minTop, visibleBottom - bounds.top - height - pad);

    let left = clientX - bounds.left;
    // Open to the right of the cursor, to its left when it would overflow.
    if (left + width > visibleRight - bounds.left - pad) left = clientX - bounds.left - width;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    let top = clientY - bounds.top + gap;
    if (top > maxTop) top = clientY - bounds.top - height - gap;
    top = Math.min(Math.max(top, minTop), maxTop);

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
  }

  _renderRowMenu() {
    const layer = this.shadowRoot.querySelector("#menu-layer");
    if (!this._rowMenu) {
      if (!this._menu) {
        layer.classList.remove("show");
        layer.innerHTML = "";
      }
      return;
    }
    const name = this._rowMenu.name;
    const item = this._items.find((it) => it.name === name);
    const isDir = Boolean(item && item.type === "dir");
    // Folders get folder actions on a full path; files keep the file actions
    // keyed by name inside the current directory.
    const path = joinPath(splitPath(this._path), name);
    const itemAttrs = isDir ? `data-path="${esc(path)}"` : `data-name="${esc(name)}"`;
    const actions = [];
    if (isDir) {
      actions.push(["download-folder", "mdi:download", this._t("download")]);
      actions.push(["rename-folder", "mdi:rename-box", this._t("rename")]);
      actions.push(["info-folder", "mdi:information-outline", this._t("info")]);
      actions.push(["delete-folder", "mdi:delete", this._t("delete")]);
    } else {
      if (isMedia(name)) {
        actions.push([
          "preview-item",
          isVideo(name) ? "mdi:play-box-outline" : "mdi:image-search",
          this._t("preview"),
        ]);
      }
      if (isEditable(name)) {
        actions.push(["edit-item", "mdi:file-edit-outline", this._t("edit")]);
      }
      actions.push(["download-item", "mdi:download", this._t("download")]);
      actions.push(["rename-item", "mdi:rename-box", this._t("rename")]);
      actions.push(["info-item", "mdi:information-outline", this._t("info")]);
      actions.push(["delete-item", "mdi:delete", this._t("delete")]);
    }
    // Show the layer before rendering: a `display: none` layer cannot be
    // measured, which is what used to throw the menu away from the row.
    layer.classList.add("show");
    layer.innerHTML = `
      <div class="fe-menu" style="visibility:hidden;top:0px;left:0px;min-width:176px">
        ${actions
          .map(
            ([act, icon, label]) =>
              `<button class="fe-menu-item${
                act === "delete-item" || act === "delete-folder" ? " danger" : ""
              }" data-action="${esc(act)}" ${itemAttrs}><ha-icon class="fe-ico" icon="${esc(icon)}"></ha-icon><span>${esc(label)}</span></button>`
          )
          .join("")}
      </div>`;
    const menu = layer.firstElementChild;
    if (this._rowMenu.point) {
      this._placeMenuAt(menu, this._rowMenu.point.x, this._rowMenu.point.y);
    } else {
      // Anchor on the live button rect so the popover stays glued to the row
      // even when the list was just re-rendered or scrolled.
      const button = this._rowMenuButton(this._rowMenu.name);
      this._placeMenu(menu, button ? button.getBoundingClientRect() : this._rowMenu.rect);
    }
    menu.style.visibility = "";
  }

  _closeRowMenu() {
    if (!this._rowMenu) return;
    this._rowMenu = null;
    this._renderList();
    this._syncMenuLayer();
  }

  /* ---------- folder background context menu ---------- */

  /** Right-click on the empty area of the list: create, upload, refresh. */
  _openBgMenu(x, y) {
    this._closeMenu();
    this._closeRowMenu();
    this._bgMenu = { x, y };
    this._renderBgMenu();
  }

  _renderBgMenu() {
    const layer = this.shadowRoot.querySelector("#menu-layer");
    if (!this._bgMenu) {
      this._syncMenuLayer();
      return;
    }
    const hasPath = splitPath(this._path).length > 0;
    layer.classList.add("show");
    layer.innerHTML = `
      <div class="fe-menu" style="visibility:hidden;top:0px;left:0px;min-width:190px">
        ${this._menuItem("new-file", "mdi:file-plus-outline", this._t("newFile"))}
        ${this._menuItem("new-folder", "mdi:folder-plus-outline", this._t("newFolder"))}
        ${this._isCompact()
          ? this._menuItem("new-file", "mdi:file-plus-outline", this._t("newFile")) +
            this._menuItem("new-folder", "mdi:folder-plus-outline", this._t("newFolder"))
          : ""}
        ${this._menuItem("upload-files", "mdi:upload", this._t("uploadFiles"))}
        ${this._menuItem("upload-folder", "mdi:folder-upload-outline", this._t("uploadFolder"))}
        ${this._menuItem("refresh", "mdi:refresh", this._t("refresh"))}
        ${this._menuItem("download-current", "mdi:folder-download-outline", this._t("downloadFolder"), false, !hasPath)}
      </div>`;
    const menu = layer.firstElementChild;
    this._placeMenuAt(menu, this._bgMenu.x, this._bgMenu.y);
    menu.style.visibility = "";
  }

  _closeBgMenu() {
    if (!this._bgMenu) return;
    this._bgMenu = null;
    this._syncMenuLayer();
  }

  /** Hide the shared popover layer only once no menu is using it. */
  _syncMenuLayer() {
    if (this._menu || this._rowMenu || this._bgMenu || this._viewMenu) return;
    const layer = this.shadowRoot.querySelector("#menu-layer");
    if (!layer) return;
    layer.classList.remove("show");
    layer.innerHTML = "";
  }

  /* ---------- display options ("view" menu) ---------- */

  /** Stored per browser; a failure (private mode, storage off) keeps the defaults. */
  _pref(name, fallback) {
    try {
      const value = window.localStorage.getItem(`ha-file-explorer:${name}`);
      return value === null ? fallback : value === "1";
    } catch (error) {
      return fallback;
    }
  }

  _setPref(name, value) {
    try {
      window.localStorage.setItem(`ha-file-explorer:${name}`, value ? "1" : "0");
    } catch (error) {
      /* storage unavailable: the choice still applies for this session */
    }
  }

  _openViewMenu(anchor) {
    this._closeMenu();
    this._closeRowMenu();
    this._closeBgMenu();
    this._viewMenu = { anchor };
    this._renderViewMenu();
  }

  _renderViewMenu() {
    const layer = this.shadowRoot.querySelector("#menu-layer");
    if (!this._viewMenu) {
      this._syncMenuLayer();
      return;
    }
    const item = (action, icon, label, on) =>
      `<button class="fe-menu-item" data-action="${action}"><ha-icon class="fe-ico" icon="${icon}"></ha-icon><span>${esc(label)}</span>${
        on ? `<ha-icon class="fe-ico fe-menu-check" icon="mdi:check"></ha-icon>` : ""
      }</button>`;
    layer.classList.add("show");
    layer.innerHTML = `
      <div class="fe-menu" style="visibility:hidden;top:0px;left:0px;min-width:212px">
        ${item("toggle-size", "mdi:arrow-expand-vertical", this._t("showSize"), this._showSize)}
        ${item("toggle-time", "mdi:clock-outline", this._t("showTime"), this._showTime)}
      </div>`;
    const menu = layer.firstElementChild;
    this._placeMenu(menu, this._viewMenu.anchor);
    menu.style.visibility = "";
  }

  _closeViewMenu() {
    if (!this._viewMenu) return;
    this._viewMenu = null;
    this._syncMenuLayer();
  }

  _rewritePath(oldPath, newPath) {
    if (this._path === oldPath) return newPath;
    if (this._path.startsWith(oldPath + "/")) {
      return newPath + this._path.slice(oldPath.length);
    }
    return this._path;
  }

  _showRenamePath(path, name) {
    const parent = parentPath(path);
    const label = this._t("newName", this._t("folder"));
    this._showDialog({
      title: this._t("renameFolder"),
      content: `<p class="hint">${esc(this._t("currentName"))}：${esc(name)}</p>`,
      input: { label, placeholder: label },
      value: name,
      confirmText: this._t("confirm"),
      onConfirm: async ({ value }) => {
        const newName = (value || "").trim();
        if (!newName || newName === name) return false;
        const newPath = joinPath(splitPath(parent), newName);
        const result = await this._api.rename(path, newPath);
        this._toast(result.msg || this._t("requestFailed"));
        if (result.code !== 0) return false;
        const nextPath = this._rewritePath(path, newPath);
        await this._load(nextPath);
        return true;
      },
    });
  }

  _confirmDeletePath(path, name) {
    this._showDialog({
      title: this._t("deleteFolder"),
      content: `<p>${esc(this._t("deleteConfirm", name))}</p>`,
      confirmText: this._t("delete"),
      danger: true,
      onConfirm: async () => {
        const result = await this._api.remove(path);
        this._toast(result.msg || this._t("requestFailed"));
        if (result.code !== 0) return false;
        const inside = this._path === path || this._path.startsWith(path + "/");
        await this._load(inside ? parentPath(path) : this._path);
        return true;
      },
    });
  }

  /* ---------- popup menu ---------- */

  _menuItem(action, icon, label, danger = false, disabled = false, path = null) {
    const pathAttr = path === null ? "" : ` data-path="${esc(path)}"`;
    return `<button class="fe-menu-item${danger ? " danger" : ""}" data-action="${esc(action)}"${pathAttr}${disabled ? " disabled" : ""}><ha-icon class="fe-ico" icon="${esc(icon)}"></ha-icon><span>${esc(label)}</span></button>`;
  }

  _openMenu() {
    this._closeRowMenu();
    const hasPath = splitPath(this._path).length > 0;
    const layer = this.shadowRoot.querySelector("#menu-layer");
    layer.innerHTML = `
      <div class="fe-menu" style="top:52px;right:16px">
        ${this._queue.length
          ? this._menuItem("queue-open", "mdi:cloud-upload-outline", this._t("queueOpen", this._queue.length))
          : ""}
        ${this._menuItem("upload-files", "mdi:upload", this._t("uploadFiles"))}
        ${this._menuItem("upload-folder", "mdi:folder-upload-outline", this._t("uploadFolder"))}
        ${this._menuItem("refresh", "mdi:refresh", this._t("refresh"))}
        ${this._menuItem("download-current", "mdi:folder-download-outline", this._t("downloadFolder"), false, !hasPath)}
        ${this._menuItem("rename-current", "mdi:rename-box", this._t("renameFolder"), false, !hasPath)}
        ${this._menuItem("delete-current", "mdi:folder-remove-outline", this._t("deleteFolder"), true, !hasPath)}
      </div>`;
    layer.classList.add("show");
    this._menu = true;
  }

  _closeMenu() {
    this._menu = false;
    this._syncMenuLayer();
  }

  /* ---------- editor ---------- */

  _renderEditor() {
    const view = this.shadowRoot.querySelector("#editor-pane");
    view.innerHTML = `
      <div class="fe-editor-surface">
        <pre class="fe-gutter" id="gutter" aria-hidden="true"></pre>
        <div class="fe-code-wrap">
          <pre class="fe-hl" id="hl" aria-hidden="true"><code id="hl-code"></code></pre>
          <textarea class="fe-code" data-role="code" id="code" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off">${esc(this._editor.value)}</textarea>
        </div>
      </div>`;
    this._updateGutter();
    const code = view.querySelector("#code");
    code.addEventListener("scroll", () => {
      const gutter = view.querySelector("#gutter");
      if (gutter) gutter.scrollTop = code.scrollTop;
      this._syncHighlightScroll();
    });
    this._paintHighlight();
    this._lintNow();
    loadPrism()
      .then(() => this._paintHighlight())
      .catch(() => {
        /* No highlight is fine: the plain textarea keeps working. */
      });
    code.focus();
    code.setSelectionRange(0, 0);
  }

  /**
   * Prism tokens go into a <pre> that sits underneath a transparent textarea,
   * so native input, undo and IME stay untouched while text looks highlighted.
   */
  _paintHighlight() {
    const target = this.shadowRoot.querySelector("#hl-code");
    if (!target) return;
    const text = this._editor.value || "";
    const language = text.length > MAX_HIGHLIGHT_CHARS ? "" : languageFor(this._editor.name);
    target.innerHTML = highlightToHTML(text, language);
    this._syncHighlightScroll();
  }

  _syncHighlightScroll() {
    const code = this.shadowRoot.querySelector("#code");
    const highlight = this.shadowRoot.querySelector("#hl");
    if (!code || !highlight) return;
    highlight.scrollTop = code.scrollTop;
    highlight.scrollLeft = code.scrollLeft;
  }

  /* ---------- editor: format & lint ---------- */

  /** Cheap well-formedness pass, debounced while typing. */
  _scheduleLint() {
    clearTimeout(this._lintTimer);
    this._lintTimer = setTimeout(() => this._lintNow(), 350);
  }

  _lintIssues() {
    try {
      return lintText(this._editor.name, this._editor.value || "");
    } catch (error) {
      return [];
    }
  }

  _issueText(issue) {
    if (!issue) return "";
    const text = this._t(issue.key, ...(issue.args || []));
    return issue.line ? this._t("lintLine", issue.line, text) : text;
  }

  /**
   * The chip is a hint only: nothing is rewritten and saving stays possible,
   * whatever the check says.
   */
  _lintNow() {
    const chip = this.shadowRoot.querySelector("#lint");
    if (!chip) return;
    const kind = lintKind(this._editor.name);
    if (!kind) {
      chip.hidden = true;
      return;
    }
    const issues = this._lintIssues();
    chip.hidden = false;
    chip.classList.toggle("warn", issues.length > 0);
    chip.classList.toggle("ok", issues.length === 0);
    chip.textContent = issues.length
      ? this._t("lintIssues", issues.length)
      : this._t(kind === "python" ? "lintPyOk" : "lintOk");
    chip.title = issues.length
      ? issues
          .slice(0, 8)
          .map((issue) => this._issueText(issue))
          .join("\n")
      : "";
  }

  /** Rewrite the buffer in place; a failed parse only reports, never edits. */
  _formatDoc() {
    const name = this._editor.name;
    if (!lintKind(name)) {
      this._toast(this._t("formatUnsupported"));
      return;
    }
    const result = formatText(name, this._editor.value || "");
    if (!result.ok) {
      this._toast(
        result.unsupported ? this._t("formatUnsupported") : this._issueText(result.issue),
        "error"
      );
      this._lintNow();
      return;
    }
    if (!result.changed) {
      this._toast(this._t("formatNoChange"));
      this._lintNow();
      return;
    }
    this._editor.value = result.text;
    this._editor.dirty = true;
    const code = this.shadowRoot.querySelector("#code");
    if (code) code.value = result.text;
    this._updateEditorTitle();
    this._updateGutter();
    this._paintHighlight();
    this._lintNow();
    this._toast(this._t("formatDone"));
  }

  _updateGutter() {
    const gutter = this.shadowRoot.querySelector("#gutter");
    if (!gutter) return;
    const lines = this._editor.value.split("\n").length;
    let text = "";
    for (let line = 1; line <= lines; line += 1) text += `${line}\n`;
    gutter.textContent = text;
  }

  _updateEditorTitle() {
    const title = this.shadowRoot.querySelector("#editor-title");
    if (title) {
      title.textContent = `${this._editor.name}${this._editor.dirty ? " •" : ""}`;
    }
  }

  /* ---------- dialogs & notifications ---------- */

  _showDialog(config) {
    this._dialog = { ...config, value: config.value || "", files: [] };
    this._renderDialog();
  }

  _renderDialog() {
    const root = this.shadowRoot.querySelector("#dialog-layer");
    const dialog = this._dialog;
    if (!dialog) {
      // The preview shares the dialog layer, so keep it alive underneath.
      if (this._preview) {
        this._renderPreview();
        return;
      }
      root.classList.remove("show");
      root.innerHTML = "";
      return;
    }
    const input = dialog.input
      ? `<label class="fe-field"><span>${esc(dialog.input.label)}</span><input type="text" data-role="dialog-input" value="${esc(dialog.value)}" placeholder="${esc(dialog.input.placeholder || "")}"></label>`
      : "";
    const selected =
      dialog.files && dialog.files.length
        ? dialog.files
            .map((file) => `<div>${esc(file.webkitRelativePath || file.name)}</div>`)
            .join("")
        : esc(this._t("noFiles"));
    const files = dialog.fileInput
      ? `<label class="fe-field"><span>${esc(dialog.fileInput.label)}</span><input type="file" data-role="dialog-files" ${dialog.fileInput.directory ? "webkitdirectory" : "multiple"}></label><div class="fe-file-list" id="selected-files">${selected}</div>`
      : "";
    const footer = dialog.onConfirm
      ? `<button class="fe-btn" data-action="dialog-cancel">${esc(this._t("cancel"))}</button><button class="fe-btn ${dialog.danger ? "danger" : "primary"}" data-action="dialog-confirm">${esc(dialog.confirmText || this._t("confirm"))}</button>`
      : `<button class="fe-btn primary" data-action="dialog-cancel">${esc(this._t("close"))}</button>`;
    root.innerHTML = `
      <div class="fe-backdrop" data-action="backdrop">
        <div class="fe-dialog" role="dialog" aria-modal="true">
          <h3>${esc(dialog.title)}</h3>
          <div class="fe-dialog-body">${dialog.content || ""}${input}${files}</div>
          <div class="fe-dialog-footer">${footer}</div>
        </div>
      </div>`;
    root.classList.add("show");
    const inputEl = root.querySelector('[data-role="dialog-input"]');
    if (inputEl) {
      inputEl.focus();
      inputEl.select();
    }
  }

  _closeDialog() {
    this._dialog = null;
    this._renderDialog();
  }

  /* ---------- item info ---------- */

  /** Show size / timestamps / permissions for a file or folder. */
  async _showInfo(path, label) {
    this._showDialog({
      title: `${this._t("infoTitle")} · ${label}`,
      infoFor: path,
      content: `<p class="hint">${esc(this._t("infoLoading"))}</p>`,
    });
    try {
      const result = await this._api.info(path);
      if (!result || result.code !== 0) {
        throw new Error((result && result.msg) || this._t("requestFailed"));
      }
      // The dialog may have been closed or replaced while the request ran.
      if (!this._dialog || this._dialog.infoFor !== path) return;
      this._showDialog({
        title: `${this._t("infoTitle")} · ${label}`,
        infoFor: path,
        content: this._infoContent(result.data),
      });
    } catch (err) {
      if (this._dialog && this._dialog.infoFor === path) this._closeDialog();
      this._toast(err.message || this._t("requestFailed"), "error");
    }
  }

  _infoContent(info) {
    const unknown = this._t("infoUnknown");
    const rows = [
      [this._t("infoType"), info.type === "dir" ? this._t("folder") : this._t("file")],
      [this._t("infoSize"), formatSize(info.size)],
    ];
    if (info.type === "dir") {
      rows.push([
        this._t("infoContents"),
        `${info.files} ${this._t("infoFiles")} · ${info.folders} ${this._t("infoFolders")}`,
      ]);
    }
    rows.push(
      [this._t("infoCreated"), dateText(info.created) || unknown],
      [this._t("infoModified"), dateText(info.modified) || unknown],
      [this._t("infoAccessed"), dateText(info.accessed) || unknown],
      [
        this._t("infoPermission"),
        `${info.mode || unknown} · ${
          info.writable ? this._t("readWrite") : this._t("readOnly")
        }`,
      ],
      [this._t("infoPath"), info.path || this._t("haRoot")]
    );
    return `<div class="fe-info-list">${rows
      .map(
        ([key, value]) =>
          `<div class="fe-info-item"><span>${esc(key)}</span><span class="fe-info-value">${esc(
            value
          )}</span></div>`
      )
      .join("")}</div>`;
  }

  /* ---------- media preview (images and videos) ---------- */

  /** Previewable media of the current folder, so the dialog can page through them. */
  _previewSiblings() {
    return this._visibleItems().filter((item) => isMedia(item.name));
  }

  /**
   * Load one image/video through the `preview` proxy endpoint and show it.
   *
   * HA auth is a bearer header, so `<img src="/api/...">` would come back 401
   * from HA's own auth layer: the bytes are fetched with `fetchWithAuth`
   * instead and shown through an object URL.
   */
  async _showPreviewAt(siblings, index) {
    const item = siblings[index];
    if (!item) return;
    const path = joinPath(splitPath(this._path), item.name);
    if (this._rowMenu) this._closeRowMenu();
    try {
      const media = await this._api.media(path);
      const previous = this._preview;
      if (previous && previous.revoke) previous.revoke();
      this._preview = {
        path,
        name: item.name,
        size: item.size,
        index,
        total: siblings.length,
        url: media.url,
        revoke: media.revoke,
        video: isVideo(item.name),
        // 1 = fitted into the stage. Wheel zoom multiplies this, and `base`
        // remembers the fitted pixel width so the math survives re-renders.
        scale: 1,
        base: null,
        // SVG in a top-level tab is scriptable, so it never gets "open in a
        // new tab" — only the raster formats do.
        svg: item.name.toLowerCase().endsWith(".svg"),
      };
      this._renderPreview();
    } catch (err) {
      this._toast(err.message || this._t("previewFailed"), "error");
    }
  }

  _openPreview(name) {
    const siblings = this._previewSiblings();
    const index = siblings.findIndex((item) => item.name === name);
    this._showPreviewAt(siblings, Math.max(index, 0));
  }

  _previewStep(delta) {
    const preview = this._preview;
    if (!preview || preview.total < 2) return;
    const index = preview.index + delta;
    if (index < 0 || index >= preview.total) return;
    this._showPreviewAt(this._previewSiblings(), index);
  }

  _closePreview() {
    if (!this._preview) return;
    if (this._preview.revoke) this._preview.revoke();
    this._preview = null;
    this._renderDialog();
  }

  _renderPreview() {
    const root = this.shadowRoot.querySelector("#dialog-layer");
    const preview = this._preview;
    if (!preview) {
      if (!this._dialog) {
        root.classList.remove("show");
        root.innerHTML = "";
      }
      return;
    }
    const hasNav = preview.total > 1;
    const nav = hasNav
      ? `<button class="fe-preview-nav prev" data-action="preview-prev" title="${esc(this._t("previewPrev"))}" aria-label="${esc(this._t("previewPrev"))}"${preview.index === 0 ? " disabled" : ""}><ha-icon class="fe-ico" icon="mdi:chevron-left"></ha-icon></button>
         <button class="fe-preview-nav next" data-action="preview-next" title="${esc(this._t("previewNext"))}" aria-label="${esc(this._t("previewNext"))}"${preview.index === preview.total - 1 ? " disabled" : ""}><ha-icon class="fe-ico" icon="mdi:chevron-right"></ha-icon></button>`
      : "";
    root.innerHTML = `
      <div class="fe-preview" data-action="close-preview" role="dialog" aria-modal="true" aria-label="${esc(preview.name)}">
        <div class="fe-preview-bar">
          <ha-icon class="fe-ico fe-preview-ico" icon="${esc(fileIcon(this._path, preview.name))}"></ha-icon>
          <strong class="fe-preview-name">${esc(preview.name)}</strong>
          <span class="fe-preview-meta">${esc(formatSize(preview.size))}${
            hasNav ? ` · ${preview.index + 1}/${preview.total}` : ""
          }</span>
          <span class="fe-spacer"></span>
          ${
            preview.video
              ? ""
              : this._iconButton(
                  "preview-zoom",
                  preview.scale !== 1 ? "mdi:fit-to-screen" : "mdi:magnify-plus-outline",
                  preview.scale !== 1 ? this._t("previewFit") : this._t("previewActual")
                )
          }
          ${
            preview.svg
              ? ""
              : this._iconButton(
                  "preview-open",
                  "mdi:open-in-new",
                  this._t("previewOpen")
                )
          }
          ${this._iconButton("preview-download", "mdi:download", this._t("download"))}
          ${this._iconButton("close-preview", "mdi:close", this._t("close"))}
        </div>
        <div class="fe-preview-stage${preview.video ? " is-video" : ""}">
          ${
            preview.video
              ? `<video class="fe-preview-video" src="${esc(
                  preview.url
                )}" controls playsinline preload="auto"></video>
                 <button class="fe-preview-play" data-action="preview-play" title="${esc(
                   this._t("previewPlay")
                 )}" aria-label="${esc(this._t("previewPlay"))}"><ha-icon class="fe-ico" icon="mdi:play"></ha-icon></button>`
              : `<img class="fe-preview-img${preview.scale !== 1 ? " zoomed" : ""}" data-action="preview-zoom" src="${esc(
                  preview.url
                )}" alt="${esc(preview.name)}">`
          }
        </div>
        ${nav}
      </div>`;
    root.classList.add("show");
    // Mouse wheel zooms the picture around the cursor, like Windows Photos.
    const stage = root.querySelector(".fe-preview-stage");
    if (stage && root.querySelector(".fe-preview-img")) {
      stage.addEventListener("wheel", (event) => this._onPreviewWheel(event), {
        passive: false,
      });
    }
    // A paused video shows a play badge on top; native controls stay available
    // for seek/volume, so the badge only ever starts playback.
    const video = root.querySelector(".fe-preview-video");
    if (video) {
      const stage = root.querySelector(".fe-preview-stage");
      const sync = () => stage.classList.toggle("playing", !video.paused);
      ["play", "pause", "ended", "seeking"].forEach((name) =>
        video.addEventListener(name, sync)
      );
      sync();
    }
    // HEIC / TIFF, or a codec the browser does not ship: say so instead of
    // leaving a broken element behind.
    const media = root.querySelector(".fe-preview-img, .fe-preview-video");
    if (media) {
      media.addEventListener("error", () => {
        const stage = root.querySelector(".fe-preview-stage");
        if (stage && !stage.querySelector(".fe-preview-err")) {
          const note = document.createElement("div");
          note.className = "fe-preview-err";
          note.textContent = this._t("previewFailed");
          stage.appendChild(note);
        }
      });
    }
  }

  /**
   * Scale the preview image. `scale` is relative to the fitted size (1 = fit),
   * so the same number means the same thing on every screen. When `point` is
   * given, the pixel under it stays under it - that is what makes wheel zoom
   * feel anchored instead of snapping back to the centre.
   */
  _applyPreviewScale(scale, point) {
    const root = this.shadowRoot.querySelector("#dialog-layer");
    const image = root && root.querySelector(".fe-preview-img");
    const stage = root && root.querySelector(".fe-preview-stage");
    const preview = this._preview;
    if (!image || !stage || !preview) return;

    // The fitted width is the zero point; measure it once, while unzoomed.
    if (!preview.base || !preview.base.width) {
      const fitted = image.getBoundingClientRect();
      if (!fitted.width) return; // not decoded yet
      preview.base = { width: fitted.width };
    }

    const before = image.getBoundingClientRect();
    const next = Math.min(8, Math.max(1, scale));
    preview.scale = next;

    if (next === 1) {
      image.classList.remove("zoomed");
      image.style.width = "";
      image.style.height = "";
    } else {
      image.classList.add("zoomed");
      image.style.width = `${Math.round(preview.base.width * next)}px`;
      image.style.height = "auto";
    }

    const button = root.querySelector('[data-action="preview-zoom"]');
    if (button) {
      const zoomed = next !== 1;
      const icon = button.querySelector("ha-icon");
      if (icon) icon.setAttribute("icon", zoomed ? "mdi:fit-to-screen" : "mdi:magnify-plus-outline");
      const label = zoomed ? this._t("previewFit") : this._t("previewActual");
      button.title = label;
      button.setAttribute("aria-label", label);
    }

    if (!point || next === 1) return;
    const after = image.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const fx = (point.x - before.left) / (before.width || 1);
    const fy = (point.y - before.top) / (before.height || 1);
    const leftInContent = after.left - stageRect.left + stage.scrollLeft;
    const topInContent = after.top - stageRect.top + stage.scrollTop;
    stage.scrollLeft = leftInContent + after.width * fx - (point.x - stageRect.left);
    stage.scrollTop = topInContent + after.height * fy - (point.y - stageRect.top);
  }

  _onPreviewWheel(event) {
    const preview = this._preview;
    if (!preview || preview.video || !event.deltaY) return;
    event.preventDefault();
    // Exponential so every notch feels the same at any zoom level.
    const factor = Math.exp(-event.deltaY * 0.0022);
    this._applyPreviewScale((preview.scale || 1) * factor, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  _togglePreviewZoom() {
    const preview = this._preview;
    if (!preview || preview.video) return;
    if (preview.scale !== 1) {
      this._applyPreviewScale(1);
      return;
    }
    // "Actual size" = one image pixel per screen pixel. A picture smaller than
    // the stage is already at that size, so zoom in twice instead of doing
    // nothing visible.
    const root = this.shadowRoot.querySelector("#dialog-layer");
    const image = root && root.querySelector(".fe-preview-img");
    if (!image) return;
    if (!preview.base || !preview.base.width) {
      const fitted = image.getBoundingClientRect();
      if (!fitted.width) return;
      preview.base = { width: fitted.width };
    }
    const natural = image.naturalWidth / preview.base.width;
    this._applyPreviewScale(natural > 1.02 ? natural : 2);
  }

  async _confirmDialog() {
    const dialog = this._dialog;
    if (!dialog || !dialog.onConfirm) return;
    const value = dialog.value;
    const files = dialog.files;
    this._closeDialog();
    try {
      const result = await dialog.onConfirm({ value, files });
      if (result === false) {
        this._dialog = { ...dialog, value, files };
        this._renderDialog();
      }
    } catch (err) {
      this._toast(err.message || this._t("requestFailed"), "error");
    }
  }

  _toast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `fe-toast${type === "error" ? " error" : ""}`;
    toast.textContent = message;
    this.shadowRoot.querySelector("#toast-root").appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  _setLoading(loading) {
    const bar = this.shadowRoot.querySelector("#loading");
    if (bar) bar.hidden = !loading;
    const label = this.shadowRoot.querySelector("#loading-text");
    if (!loading && label) label.remove();
  }

  /** Drop the boot overlay; the first listing has been handled either way. */
  _hideBoot() {
    this._booted = true;
    const boot = this.shadowRoot.querySelector("#boot");
    if (boot) boot.remove();
  }

  /** Progress line under the loading bar, used while the queue drains. */
  _setLoadingText(text) {
    const bar = this.shadowRoot.querySelector("#loading");
    if (!bar || bar.hidden) return;
    let label = this.shadowRoot.querySelector("#loading-text");
    if (!label) {
      label = document.createElement("div");
      label.id = "loading-text";
      label.className = "fe-loading-text";
      this.shadowRoot.querySelector("#app").appendChild(label);
    }
    label.textContent = text;
  }

  /* ---------- events ---------- */

  _actionNode(event) {
    for (const node of event.composedPath()) {
      if (node instanceof Element && node.hasAttribute("data-action")) return node;
    }
    return null;
  }

  _roleNode(event, role) {
    for (const node of event.composedPath()) {
      if (node instanceof Element && node.dataset && node.dataset.role === role) {
        return node;
      }
    }
    return null;
  }

  /**
   * Right-click behaviour, mirroring Windows: a hit on a file/folder opens
   * that item's context menu at the cursor, a hit on the empty area of the
   * list opens the folder-background menu.
   */
  _onContextMenu(event) {
    if (this._view === "editor" || this._dialog || this._preview) return;
    const origin = event.composedPath()[0];
    if (!(origin instanceof Element)) return;
    const row = origin.closest(".fe-row, .fe-tile");
    const list = this.shadowRoot.querySelector("#list");
    const inList = origin === list || (list && list.contains(origin));
    const inCrumbs = Boolean(origin.closest("#crumbs"));
    // Anything else (search box, dialog fields, editable text) keeps the
    // browser's own menu.
    if (!row && !inList && !inCrumbs) return;
    event.preventDefault();
    if (this._menu) this._closeMenu();
    if (this._viewMenu) this._closeViewMenu();

    if (row && row.dataset.name) {
      this._openRowMenu(row.dataset.name, row.getBoundingClientRect(), {
        x: event.clientX,
        y: event.clientY,
      });
      return;
    }
    this._openBgMenu(event.clientX, event.clientY);
  }

  async _onClick(event) {
    const node = this._actionNode(event);
    if (!node) {
      if (this._menu) this._closeMenu();
      if (this._rowMenu) this._closeRowMenu();
      if (this._bgMenu) this._closeBgMenu();
      if (this._viewMenu) this._closeViewMenu();
      return;
    }
    if (node.hasAttribute("disabled")) return;
    const action = node.dataset.action;
    const name = node.dataset.name;
    const parts = splitPath(this._path);

    // Close the row menu when the click lands outside of it.
    if (this._rowMenu && action !== "row-menu" && !node.closest(".fe-row-popover")) {
      this._closeRowMenu();
    }
    switch (action) {
      case "close-menu":
        this._closeMenu();
        this._closeRowMenu();
        this._closeBgMenu();
        return;
      case "backdrop":
        if (event.composedPath()[0] === node) this._closeDialog();
        break;
      case "dialog-cancel":
        this._closeDialog();
        break;
      case "dialog-confirm":
        this._confirmDialog();
        break;
      case "queue-remove": {
        const index = Number(node.dataset.index);
        if (Number.isInteger(index) && index >= 0 && index < this._queue.length) {
          this._queue.splice(index, 1);
          if (this._queue.length) this._renderQueue();
          else this._closeDialog();
        }
        break;
      }
      case "queue-clear":
        this._queue = [];
        this._closeDialog();
        break;
      case "queue-open":
        this._closeMenu();
        this._renderQueue();
        break;
      case "ha-menu":
        // Only rendered while the sidebar is hidden, so this opens it rather
        // than toggling: `home-assistant-main` reads `detail.open`.
        this.dispatchEvent(
          new CustomEvent("hass-toggle-menu", {
            bubbles: true,
            composed: true,
            detail: { open: true },
          })
        );
        break;
      case "clear-search": {
        this._filter = "";
        const input = this.shadowRoot.querySelector('[data-role="search"]');
        if (input) input.value = "";
        const clear = this.shadowRoot.querySelector('[data-action="clear-search"]');
        if (clear) clear.hidden = true;
        this._renderList();
        break;
      }
      case "more":
        if (this._menu) this._closeMenu();
        else this._openMenu();
        return;
      case "view-options":
        if (this._viewMenu) this._closeViewMenu();
        else this._openViewMenu(node.getBoundingClientRect());
        return;
      case "toggle-size":
        this._showSize = !this._showSize;
        this._setPref("showSize", this._showSize);
        this._renderList();
        this._renderViewMenu();
        return;
      case "toggle-time":
        this._showTime = !this._showTime;
        this._setPref("showTime", this._showTime);
        this._renderList();
        this._renderViewMenu();
        return;
      case "row-menu":
        if (this._rowMenu && this._rowMenu.name === name) this._closeRowMenu();
        else this._openRowMenu(name, node.getBoundingClientRect());
        return;
      case "set-view":
        this._setView(node.dataset.mode || "grid");
        break;
      case "refresh":
        this._load();
        break;
      case "home":
        this._navigate("");
        break;
      case "up":
        this._navigate(parentPath(this._path));
        break;
      case "crumb":
        this._navigate(parts.slice(0, Number(node.dataset.index)).join("/"));
        break;
      case "download-folder": {
        const path = node.dataset.path || "";
        if (path) {
          this._confirmDownload(path, splitPath(path).pop() || this._t("haRoot"));
        }
        break;
      }
      case "rename-folder": {
        const path = node.dataset.path || "";
        if (path) {
          this._showRenamePath(path, splitPath(path).pop() || this._t("haRoot"));
        }
        break;
      }
      case "info-folder": {
        const path = node.dataset.path || "";
        if (path) {
          this._showInfo(path, splitPath(path).pop() || this._t("haRoot"));
        }
        break;
      }
      case "delete-folder": {
        const path = node.dataset.path || "";
        if (path) {
          this._confirmDeletePath(path, splitPath(path).pop() || this._t("haRoot"));
        }
        break;
      }
      case "open-dir":
        this._navigate(joinPath(parts, name));
        break;
      case "edit-item":
        this._openEditor(name);
        break;
      case "info-item":
        this._showInfo(joinPath(parts, name), name);
        break;
      case "preview-item":
        this._openPreview(name);
        break;
      case "close-preview": {
        // The ✕ button closes; so does the backdrop, but a click on the media,
        // the top bar, the arrows or the play button must not.
        if (!node.classList.contains("fe-preview")) {
          this._closePreview();
          break;
        }
        const protectedArea = event
          .composedPath()
          .some(
            (el) =>
              el.nodeType === 1 &&
              (el.classList.contains("fe-preview-bar") ||
                el.classList.contains("fe-preview-img") ||
                el.classList.contains("fe-preview-video") ||
                el.classList.contains("fe-preview-nav") ||
                el.classList.contains("fe-preview-play"))
          );
        if (!protectedArea) this._closePreview();
        break;
      }
      case "preview-play":
        {
          const video = this.shadowRoot.querySelector(".fe-preview-video");
          if (video) video.play().catch(() => {});
        }
        break;
      case "preview-prev":
        this._previewStep(-1);
        break;
      case "preview-next":
        this._previewStep(1);
        break;
      case "preview-zoom": {
        this._togglePreviewZoom();
        break;
      }
      case "preview-open":
        // SVG stays in the dialog: a top-level svg tab is scriptable.
        if (this._preview && !this._preview.svg) {
          window.open(this._preview.url, "_blank", "noopener");
        }
        break;
      case "preview-download":
        if (this._preview) {
          const path = this._preview.path;
          this._api
            .download(path)
            .catch((err) =>
              this._toast(err.message || this._t("requestFailed"), "error")
            );
        }
        break;
      case "retry-load":
        this._load(this._path || "");
        break;
      case "new-file":
        this._showCreate("file");
        break;
      case "new-folder":
        this._showCreate("folder");
        break;
      case "upload-files":
        this._showUpload(false);
        break;
      case "upload-folder":
        this._showUpload(true);
        break;
      case "download-current":
        this._confirmDownload(this._path, parts[parts.length - 1] || this._t("haRoot"));
        break;
      case "rename-current":
        this._showRename(this._path, parts[parts.length - 1] || this._t("haRoot"), true);
        break;
      case "delete-current":
        this._confirmDelete(this._path, parts[parts.length - 1] || this._t("haRoot"), true);
        break;
      case "download-item":
        this._downloadItem(name, node.dataset.type);
        break;
      case "rename-item":
        this._showRename(joinPath(parts, name), name, false);
        break;
      case "delete-item":
        this._confirmDelete(joinPath(parts, name), name, false);
        break;
      case "back":
        this._closeEditor();
        break;
      case "save":
        this._save();
        break;
      case "format":
        this._formatDoc();
        break;
      default:
        break;
    }
    if (this._menu && action !== "more") this._closeMenu();
    if (
      this._rowMenu &&
      [
        "edit-item",
        "preview-item",
        "download-item",
        "rename-item",
        "delete-item",
        "info-item",
        "download-folder",
        "rename-folder",
        "info-folder",
        "delete-folder",
      ].includes(action)
    ) {
      this._closeRowMenu();
    }
    // Any background-menu action runs once and dismisses; triggers are exempt.
    if (this._bgMenu && ["more", "row-menu", "close-menu"].indexOf(action) === -1) {
      this._closeBgMenu();
    }
  }

  _onInput(event) {
    const search = this._roleNode(event, "search");
    if (search) {
      this._filter = search.value;
      const clear = this.shadowRoot.querySelector('[data-action="clear-search"]');
      if (clear) clear.hidden = !search.value;
      this._renderList();
      return;
    }
    const input = this._roleNode(event, "dialog-input");
    if (input && this._dialog) {
      this._dialog.value = input.value;
      return;
    }
    const code = this._roleNode(event, "code");
    if (code) {
      this._editor.value = code.value;
      this._editor.dirty = true;
      this._updateEditorTitle();
      this._updateGutter();
      this._paintHighlight();
      this._scheduleLint();
    }
  }

  _onChange(event) {
    const input = this._roleNode(event, "dialog-files");
    if (!input || !this._dialog) return;
    this._dialog.files = Array.from(input.files || []);
    const list = this.shadowRoot.querySelector("#selected-files");
    if (list) {
      list.innerHTML = this._dialog.files.length
        ? this._dialog.files
            .map((file) => `<div>${esc(file.webkitRelativePath || file.name)}</div>`)
            .join("")
        : esc(this._t("noFiles"));
    }
  }

  _onKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && (event.key || "").toLowerCase() === "s") {
      if (this._view === "editor") {
        event.preventDefault();
        this._save();
      }
      return;
    }
    // Arrow keys page through the folder's images while the preview is open.
    if (
      this._preview &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      !this._roleNode(event, "code")
    ) {
      event.preventDefault();
      this._previewStep(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (event.key === "Escape") {
      if (this._dialog) {
        event.preventDefault();
        this._closeDialog();
      } else if (this._preview) {
        event.preventDefault();
        this._closePreview();
      } else if (this._menu) {
        this._closeMenu();
      } else if (this._rowMenu) {
        this._closeRowMenu();
      } else if (this._bgMenu) {
        this._closeBgMenu();
      } else if (this._view === "editor") {
        this._closeEditor();
      }
      return;
    }
    if (event.key === "Enter" && this._dialog && this._dialog.input) {
      if (this._roleNode(event, "dialog-input")) {
        event.preventDefault();
        this._confirmDialog();
      }
      return;
    }
    if (event.key === "Tab" && this._view === "editor") {
      const code = this._roleNode(event, "code");
      if (code instanceof HTMLTextAreaElement) {
        event.preventDefault();
        code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end");
        this._editor.value = code.value;
        this._editor.dirty = true;
        this._updateEditorTitle();
        this._updateGutter();
        this._paintHighlight();
      }
    }
  }

  /* ---------- data ---------- */

  async _load(path = this._path) {
    if (this._loading) return;
    this._loadStarted = true;
    this._loading = true;
    this._setLoading(true);
    try {
      const items = await this._api.list(path);
      if (!Array.isArray(items)) {
        throw new Error((items && items.msg) || this._t("requestFailed"));
      }
      this._loadError = null;
      this._path = path;
      this._items = items;
      this._view = "list";
      this._render();
    } catch (err) {
      // A slow HA host can time out on the first call; keep the reason on
      // screen with a retry instead of an empty folder that looks broken.
      this._loadError = err;
      if (this._ready && this._view !== "editor") this._renderList();
      this._toast(err.message || this._t("requestFailed"), "error");
    } finally {
      this._loading = false;
      this._setLoading(false);
      if (!this._booted) this._hideBoot();
    }
  }

  _navigate(path) {
    this._filter = "";
    // A preview belongs to the folder it was opened in.
    if (this._preview) this._closePreview();
    this._load(path);
  }

  async _openEditor(name) {
    if (!name) return;
    if (!isEditable(name)) {
      this._toast(this._t("unsupportedEdit"), "error");
      return;
    }
    try {
      const result = await this._api.content(joinPath(splitPath(this._path), name));
      if (result.code !== 0) {
        this._toast(result.msg || this._t("requestFailed"), "error");
        return;
      }
      this._editor = {
        path: joinPath(splitPath(this._path), name),
        name,
        value: result.data || "",
        dirty: false,
      };
      this._view = "editor";
      this._render();
    } catch (err) {
      this._toast(err.message || this._t("requestFailed"), "error");
    }
  }

  async _save() {
    try {
      const result = await this._api.save(this._editor.path, this._editor.value);
      if (result.code !== 0) {
        this._toast(result.msg || this._t("savedError"), "error");
        return;
      }
      this._editor.dirty = false;
      this._updateEditorTitle();
      this._toast(this._t("saved"));
    } catch (err) {
      this._toast(err.message || this._t("savedError"), "error");
    }
  }

  _closeEditor() {
    if (this._editor.dirty) {
      this._showDialog({
        title: this._t("title"),
        content: `<p>${esc(this._t("unsaved"))}</p>`,
        confirmText: this._t("confirm"),
        danger: true,
        onConfirm: () => {
          this._view = "list";
          this._render();
        },
      });
      return;
    }
    this._view = "list";
    this._render();
  }

  _showCreate(act) {
    const typeLabel = this._t(act === "file" ? "file" : "folder");
    this._showDialog({
      title: act === "file" ? this._t("newFile") : this._t("newFolder"),
      input: {
        label: this._t("newName", typeLabel),
        placeholder: this._t("newName", typeLabel),
      },
      confirmText: this._t("confirm"),
      onConfirm: async ({ value }) => {
        const name = (value || "").trim();
        if (!name) return false;
        const result = await this._api.create(
          act,
          joinPath(splitPath(this._path), name)
        );
        this._toast(result.msg || this._t("requestFailed"));
        if (result.code !== 0) return false;
        await this._load();
        return true;
      },
    });
  }

  _showRename(path, name, isCurrent) {
    const parent = isCurrent ? parentPath(this._path) : this._path;
    const typeLabel = this._t(isCurrent ? "folder" : "file");
    this._showDialog({
      title: this._t("rename"),
      content: `<p class="hint">${esc(this._t("currentName"))}：${esc(name)}</p>`,
      input: {
        label: this._t("newName", typeLabel),
        placeholder: this._t("newName", typeLabel),
      },
      value: name,
      confirmText: this._t("confirm"),
      onConfirm: async ({ value }) => {
        const newName = (value || "").trim();
        if (!newName || newName === name) return false;
        const newPath = joinPath(splitPath(parent), newName);
        const result = await this._api.rename(path, newPath);
        this._toast(result.msg || this._t("requestFailed"));
        if (result.code !== 0) return false;
        await this._load(isCurrent ? newPath : this._path);
        return true;
      },
    });
  }

  _confirmDelete(path, name, isCurrent) {
    this._showDialog({
      title: this._t("delete"),
      content: `<p>${esc(this._t("deleteConfirm", name))}</p>`,
      confirmText: this._t("delete"),
      danger: true,
      onConfirm: async () => {
        const result = await this._api.remove(path);
        this._toast(result.msg || this._t("requestFailed"));
        if (result.code !== 0) return false;
        await this._load(isCurrent ? parentPath(this._path) : this._path);
        return true;
      },
    });
  }

  async _download(path) {
    try {
      await this._api.download(path);
    } catch (err) {
      this._toast(err.message || this._t("requestFailed"), "error");
    }
  }

  _confirmDownload(path, name) {
    this._showDialog({
      title: this._t("download"),
      content: `<p>${esc(this._t("downloadConfirm", name))}</p>`,
      confirmText: this._t("download"),
      onConfirm: async () => {
        await this._download(path);
      },
    });
  }

  _downloadItem(name, type) {
    const path = joinPath(splitPath(this._path), name);
    if (type === "dir") this._confirmDownload(path, name);
    else this._download(path);
  }

  _showUpload(directory) {
    this._showDialog({
      title: directory ? this._t("uploadFolder") : this._t("uploadFiles"),
      content: `<p class="hint">${esc(this._t("overwriteHint"))}</p>`,
      fileInput: {
        label: directory ? this._t("uploadFolder") : this._t("uploadFiles"),
        directory,
      },
      confirmText: this._t("confirm"),
      onConfirm: async ({ files }) => {
        if (!files || !files.length) {
          this._toast(this._t("noFiles"), "error");
          return false;
        }
        let success = 0;
        this._setLoading(true);
        for (const file of files) {
          const relative = directory
            ? file.webkitRelativePath || file.name
            : file.name;
          try {
            const result = await this._api.upload(
              joinPath(splitPath(this._path), relative),
              file
            );
            if (result && result.code === 0) success += 1;
          } catch (_err) {
            /* keep going, report the failed count at the end */
          }
        }
        this._setLoading(false);
        this._toast(
          this._t("uploadSuccess", files.length, success),
          success === files.length ? "info" : "error"
        );
        await this._load();
        return true;
      },
    });
  }
}

if (!customElements.get(TAG)) {
  customElements.define(TAG, HaFileExplorerPanel);
}
