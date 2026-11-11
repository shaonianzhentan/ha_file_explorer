/**
 * File Explorer — a native Home Assistant custom panel.
 *
 * HA loads this file as an ES module (<script type="module">) and then creates
 * <ha-file-explorer-panel>, setting the hass / panel / narrow / route properties.
 * Everything renders in the main HA document, so the active theme applies.
 */
import { createApi } from "./modules/api.js";
import { createI18n } from "./modules/i18n.js";
import { styles } from "./modules/styles.js";
import {
  esc,
  editorMode,
  fileIcon,
  folderIcon,
  formatSize,
  isEditable,
  isPublicPath,
  joinPath,
  localUrl,
  parentPath,
  splitPath,
} from "./modules/format.js";

const TAG = "ha-file-explorer-panel";
const DOCUMENTATION = "https://github.com/shaonianzhentan/ha_file_explorer";

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
    this._filter = "";
    this._editor = { path: "", name: "", value: "", dirty: false };
    this._dialog = null;
    this._loading = false;
    this._loadStarted = false;
    this._ready = false;
  }

  /* Properties set by ha-panel-custom. */
  set hass(value) {
    const previousLanguage = this._hass && this._hass.language;
    this._hass = value;
    this._api = createApi(value);
    if (!this._ready) return;
    if (!this._loadStarted && value) this._load();
    if (previousLanguage === (value && value.language)) return;
    this._i18n = createI18n(value);
    this._renderToolbar();
    this._renderBreadcrumbs();
    if (this._view !== "editor") this._renderLists();
    this._renderDialog();
  }

  get hass() {
    return this._hass;
  }

  set panel(value) {
    this._panel = value;
    if (this._ready) this._renderToolbar();
  }

  get panel() {
    return this._panel;
  }

  set narrow(value) {
    this.classList.toggle("narrow", Boolean(value));
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

  _t(key, ...args) {
    return this._i18n.t(key, ...args);
  }

  _version() {
    const config = this._panel && this._panel.config;
    if (config && config.version) return config.version;
    try {
      return new URL(import.meta.url).searchParams.get("v") || "dev";
    } catch (_err) {
      return "dev";
    }
  }

  _buildShell() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="panel">
        <div id="toolbar"></div>
        <div id="breadcrumbs"></div>
        <div id="list-view"></div>
        <div id="editor-view" hidden></div>
        <div id="loading" class="progress" hidden></div>
      </div>
      <div id="dialog-root"></div>
      <div id="toast-root" class="toast-container"></div>
    `;
    this.shadowRoot.addEventListener("click", (event) => this._onClick(event));
    this.shadowRoot.addEventListener("input", (event) => this._onInput(event));
    this.shadowRoot.addEventListener("change", (event) => this._onChange(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._onKeyDown(event));
  }

  /* ---------- rendering ---------- */

  _render() {
    if (!this._ready) return;
    this._renderToolbar();
    this._renderBreadcrumbs();
    this.shadowRoot.querySelector("#breadcrumbs").hidden = this._view === "editor";
    this.shadowRoot.querySelector("#list-view").hidden = this._view === "editor";
    this.shadowRoot.querySelector("#editor-view").hidden = this._view !== "editor";
    if (this._view === "editor") this._renderEditor();
    else this._renderLists();
  }

  _iconButton(action, icon, title, extra = "", danger = false) {
    const className = `btn icon${danger ? " danger" : ""}`;
    return `<button class="${className}" data-action="${esc(action)}" ${extra} title="${esc(title)}" aria-label="${esc(title)}"><ha-icon icon="${esc(icon)}"></ha-icon></button>`;
  }

  _renderToolbar() {
    const toolbar = this.shadowRoot.querySelector("#toolbar");
    if (this._view === "editor") {
      const mode = editorMode(this._editor.name) || this._t("readOnly");
      toolbar.innerHTML = `
        <div class="toolbar">
          <button class="btn" data-action="back" title="${esc(this._t("cancel"))}">
            <ha-icon icon="mdi:arrow-left"></ha-icon><span class="label">${esc(this._t("cancel"))}</span>
          </button>
          <div class="title">
            <ha-icon icon="mdi:file-edit-outline"></ha-icon>
            <span id="editor-title">${esc(this._editor.name)}${this._editor.dirty ? " •" : ""}</span>
          </div>
          <span class="badge">${esc(mode)}</span>
          <span class="spacer"></span>
          <button class="btn primary" data-action="save" title="${esc(this._t("save"))}">
            <ha-icon icon="mdi:content-save"></ha-icon><span class="label">${esc(this._t("save"))}</span>
          </button>
        </div>`;
      return;
    }

    toolbar.innerHTML = `
      <div class="toolbar">
        <button class="title-button" data-action="version" title="${esc(this._t("title"))}">
          <ha-icon icon="mdi:folder-outline"></ha-icon>
          <span class="title">${esc(this._t("title"))}</span>
          <span class="version">${esc(this._version())}</span>
        </button>
        <span class="spacer"></span>
        <button class="btn" data-action="home" title="${esc(this._t("home"))}">
          <ha-icon icon="mdi:home"></ha-icon><span class="label">${esc(this._t("home"))}</span>
        </button>
        <button class="btn" data-action="up" title="${esc(this._t("up"))}">
          <ha-icon icon="mdi:arrow-up"></ha-icon><span class="label">${esc(this._t("up"))}</span>
        </button>
        <button class="btn" data-action="refresh" title="${esc(this._t("refresh"))}">
          <ha-icon icon="mdi:refresh"></ha-icon><span class="label">${esc(this._t("refresh"))}</span>
        </button>
      </div>`;
  }

  _renderBreadcrumbs() {
    const parts = splitPath(this._path);
    const crumbs = [
      `<button class="crumb ${parts.length ? "" : "current"}" data-action="crumb" data-index="0">HA</button>`,
      ...parts.map(
        (part, index) =>
          `<ha-icon class="sep" icon="mdi:chevron-right"></ha-icon>` +
          `<button class="crumb ${index === parts.length - 1 ? "current" : ""}" data-action="crumb" data-index="${index + 1}">${esc(part)}</button>`
      ),
    ].join("");
    this.shadowRoot.querySelector("#breadcrumbs").innerHTML = `
      <div class="breadcrumbs">
        ${crumbs}
        <span class="spacer"></span>
        <label class="filter">
          <ha-icon icon="mdi:magnify"></ha-icon>
          <input type="search" data-role="filter" placeholder="${esc(this._t("filterPlaceholder"))}" value="${esc(this._filter)}">
        </label>
      </div>`;
  }

  _renderLists() {
    const query = this._filter.trim().toLowerCase();
    const visible = (item) => !query || item.name.toLowerCase().includes(query);
    const folders = this._items.filter((item) => item.type === "dir" && visible(item));
    const files = this._items.filter((item) => item.type === "file" && visible(item));
    const parts = splitPath(this._path);
    const inWww = isPublicPath(this._path);
    const currentActions = parts.length
      ? this._iconButton("download-current", "mdi:folder-download-outline", this._t("downloadFolder")) +
        this._iconButton("rename-current", "mdi:folder-edit-outline", this._t("renameFolder")) +
        this._iconButton("delete-current", "mdi:folder-remove-outline", this._t("deleteFolder"), "", true)
      : "";

    this.shadowRoot.querySelector("#list-view").innerHTML = `
      <div class="content">
        <section class="card">
          <div class="card-header">
            <ha-icon icon="mdi:folder"></ha-icon>
            <h2>${esc(this._t("folders"))}</h2>
            <span class="count">${folders.length}</span>
            <span class="spacer"></span>
            ${this._iconButton("new-folder", "mdi:folder-plus-outline", this._t("newFolder"))}
            ${this._iconButton("upload-folder", "mdi:folder-upload-outline", this._t("uploadFolder"))}
            ${currentActions}
          </div>
          <div class="list">
            ${folders.length ? folders.map((item) => this._folderRow(item)).join("") : `<div class="empty">${esc(this._t("emptyFolders"))}</div>`}
          </div>
        </section>
        <section class="card">
          <div class="card-header">
            <ha-icon icon="mdi:file-multiple"></ha-icon>
            <h2>${esc(this._t("files"))}</h2>
            <span class="count">${files.length}</span>
            <span class="spacer"></span>
            ${this._iconButton("new-file", "mdi:file-plus-outline", this._t("newFile"))}
            ${this._iconButton("upload-files", "mdi:upload", this._t("uploadFiles"))}
          </div>
          <div class="list">
            ${files.length ? files.map((item) => this._fileRow(item, inWww)).join("") : `<div class="empty">${esc(this._t("emptyFiles"))}</div>`}
          </div>
        </section>
      </div>`;
  }

  _folderRow(item) {
    const name = esc(item.name);
    const attr = `data-name="${name}"`;
    const meta = `${esc(item.time)} · ${esc(item.size_name || formatSize(item.size))}`;
    return `
      <div class="row">
        <ha-icon class="row-icon" icon="${esc(folderIcon(item.name))}"></ha-icon>
        <div class="row-main">
          <div class="row-name" data-action="open-dir" ${attr}>${name}</div>
          <div class="row-meta">${meta}</div>
        </div>
        <div class="row-actions">
          ${this._iconButton("open-dir", "mdi:folder-open-outline", this._t("open"), attr)}
          ${this._iconButton("download-item", "mdi:download", this._t("download"), `data-type="dir" ${attr}`)}
          ${this._iconButton("rename-item", "mdi:pencil", this._t("rename"), `data-type="dir" ${attr}`)}
          ${this._iconButton("delete-item", "mdi:delete", this._t("delete"), `data-type="dir" ${attr}`, true)}
        </div>
      </div>`;
  }

  _fileRow(item, inWww) {
    const name = esc(item.name);
    const attr = `data-name="${name}"`;
    const meta = `${esc(item.time)} · ${esc(item.size_name || formatSize(item.size))}`;
    const edit = isEditable(item.name)
      ? this._iconButton("edit-item", "mdi:file-edit-outline", this._t("edit"), attr)
      : "";
    const browse = inWww
      ? this._iconButton("browse-item", "mdi:open-in-new", this._t("browse"), attr)
      : "";
    return `
      <div class="row">
        <ha-icon class="row-icon" icon="${esc(fileIcon(this._path, item.name))}"></ha-icon>
        <div class="row-main">
          <div class="row-name" data-action="edit-item" ${attr}>${name}</div>
          <div class="row-meta">${meta}</div>
        </div>
        <div class="row-actions">
          ${edit}
          ${browse}
          ${this._iconButton("download-item", "mdi:download", this._t("download"), `data-type="file" ${attr}`)}
          ${this._iconButton("rename-item", "mdi:pencil", this._t("rename"), `data-type="file" ${attr}`)}
          ${this._iconButton("delete-item", "mdi:delete", this._t("delete"), `data-type="file" ${attr}`, true)}
        </div>
      </div>`;
  }

  _renderEditor() {
    const view = this.shadowRoot.querySelector("#editor-view");
    view.innerHTML = `
      <div class="editor">
        <div class="editor-surface">
          <pre class="gutter" id="gutter" aria-hidden="true"></pre>
          <textarea data-role="code" id="code" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off">${esc(this._editor.value)}</textarea>
        </div>
      </div>`;
    this._updateGutter();
    const code = view.querySelector("#code");
    code.addEventListener("scroll", () => {
      const gutter = view.querySelector("#gutter");
      if (gutter) gutter.scrollTop = code.scrollTop;
    });
    code.focus();
    code.setSelectionRange(0, 0);
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
    const root = this.shadowRoot.querySelector("#dialog-root");
    const dialog = this._dialog;
    if (!dialog) {
      root.innerHTML = "";
      return;
    }
    const input = dialog.input
      ? `<label class="field"><span>${esc(dialog.input.label)}</span><input type="text" data-role="dialog-input" value="${esc(dialog.value)}" placeholder="${esc(dialog.input.placeholder || "")}"></label>`
      : "";
    const selected =
      dialog.files && dialog.files.length
        ? dialog.files
            .map((file) => `<div>${esc(file.webkitRelativePath || file.name)}</div>`)
            .join("")
        : esc(this._t("noFiles"));
    const files = dialog.fileInput
      ? `<label class="field"><span>${esc(dialog.fileInput.label)}</span><input type="file" data-role="dialog-files" ${dialog.fileInput.directory ? "webkitdirectory" : "multiple"}></label><div class="file-list" id="selected-files">${selected}</div>`
      : "";
    const footer = dialog.onConfirm
      ? `<button class="btn" data-action="dialog-cancel">${esc(this._t("cancel"))}</button><button class="btn primary ${dialog.danger ? "danger" : ""}" data-action="dialog-confirm">${esc(dialog.confirmText || this._t("confirm"))}</button>`
      : `<button class="btn primary" data-action="dialog-cancel">${esc(this._t("close"))}</button>`;
    root.innerHTML = `
      <div class="backdrop" data-action="backdrop">
        <div class="dialog" role="dialog" aria-modal="true">
          <h3>${esc(dialog.title)}</h3>
          <div class="dialog-body">${dialog.content || ""}${input}${files}</div>
          <div class="dialog-footer">${footer}</div>
        </div>
      </div>`;
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
    toast.className = `toast${type === "error" ? " error" : ""}`;
    toast.textContent = message;
    this.shadowRoot.querySelector("#toast-root").appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  _setLoading(loading) {
    const bar = this.shadowRoot.querySelector("#loading");
    if (bar) bar.hidden = !loading;
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

  _onClick(event) {
    const node = this._actionNode(event);
    if (!node) return;
    const action = node.dataset.action;
    const name = node.dataset.name;
    const parts = splitPath(this._path);

    switch (action) {
      case "backdrop":
        if (event.composedPath()[0] === node) this._closeDialog();
        break;
      case "dialog-cancel":
        this._closeDialog();
        break;
      case "dialog-confirm":
        this._confirmDialog();
        break;
      case "version":
        this._showVersion();
        break;
      case "home":
        this._navigate("");
        break;
      case "up":
        this._navigate(parentPath(this._path));
        break;
      case "refresh":
        this._load();
        break;
      case "crumb":
        this._navigate(parts.slice(0, Number(node.dataset.index)).join("/"));
        break;
      case "open-dir":
        this._navigate(joinPath(parts, name));
        break;
      case "edit-item":
        this._openEditor(name);
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
        this._confirmDownload(this._path, parts[parts.length - 1] || "HA");
        break;
      case "rename-current":
        this._showRename(this._path, parts[parts.length - 1] || "HA", true);
        break;
      case "delete-current":
        this._confirmDelete(this._path, parts[parts.length - 1] || "HA", true);
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
      case "browse-item":
        window.open(localUrl(this._path, name), "_blank", "noopener");
        break;
      case "back":
        this._closeEditor();
        break;
      case "save":
        this._save();
        break;
      default:
        break;
    }
  }

  _onInput(event) {
    const filter = this._roleNode(event, "filter");
    if (filter) {
      this._filter = filter.value;
      this._renderLists();
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
    if (event.key === "Escape") {
      if (this._dialog) {
        event.preventDefault();
        this._closeDialog();
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
      this._path = path;
      this._items = items;
      this._view = "list";
      this._render();
    } catch (err) {
      this._toast(err.message || this._t("requestFailed"), "error");
    } finally {
      this._loading = false;
      this._setLoading(false);
    }
  }

  _navigate(path) {
    this._filter = "";
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

  _showVersion() {
    const config = (this._panel && this._panel.config) || {};
    const link = config.documentation || DOCUMENTATION;
    this._showDialog({
      title: this._t("title"),
      content: `
        <div class="info-list">
          <div class="info-item"><span>${esc(this._t("version"))}</span><span>${esc(this._version())}</span></div>
          <div class="info-item"><span>${esc(this._t("author"))}</span><span>shaonianzhentan</span></div>
          <div class="info-item"><span>UI</span><span>Home Assistant custom panel (ES module)</span></div>
          <div class="info-item"><span>${esc(this._t("link"))}</span><a href="${esc(link)}" target="_blank" rel="noopener">${esc(link)}</a></div>
        </div>`,
    });
  }
}

if (!customElements.get(TAG)) {
  customElements.define(TAG, HaFileExplorerPanel);
}
