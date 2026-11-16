/**
 * Panel styles, aligned with the HA custom panel layout used by `bookmark`:
 * a 56px top toolbar, a collapsible folder tree on the left and a single
 * ha-card-like list on the right. Only HA theme variables are used for colors.
 */
export const styles = `
:host {
  /* Fallbacks are used only outside HA (e.g. the standalone preview page). */
  --fe-f-text: #212121;
  --fe-f-sub: #727272;
  --fe-f-bg: #fafafa;
  --fe-f-surface: #ffffff;
  --fe-f-line: #e0e0e0;
  --fe-f-primary: #03a9f4;
  --fe-f-danger: #db4437;
  --fe-f-hover: rgba(0, 0, 0, .06);
  --fe-f-scrim: rgba(0, 0, 0, .32);

  /* Theme aliases: HA variables win, fallbacks keep the preview usable. */
  --fe-text: var(--primary-text-color, var(--fe-f-text));
  --fe-sub: var(--secondary-text-color, var(--fe-f-sub));
  --fe-bg: var(--primary-background-color, var(--fe-f-bg));
  --fe-surface: var(--ha-card-background, var(--card-background-color, var(--fe-f-surface)));
  --fe-line: var(--divider-color, var(--fe-f-line));
  --fe-accent: var(--primary-color, var(--fe-f-primary));
  --fe-on-accent: var(--text-primary-color, #ffffff);
  --fe-danger: var(--error-color, var(--fe-f-danger));
  --fe-icon: var(--state-icon-color, var(--sidebar-icon-color, var(--fe-sub)));
  /* HA's own config dirs/files, tinted with HA's brand cyan. */
  --fe-ha-dir: color-mix(in srgb, #41bdf5 74%, var(--fe-icon));
  --fe-ha-file: color-mix(in srgb, #41bdf5 48%, var(--fe-icon));
  --fe-hover: var(--secondary-background-color, var(--fe-f-hover));
  --fe-hover: color-mix(in srgb, var(--fe-text) 9%, transparent);
  --fe-selected: rgba(var(--rgb-primary-color, 3, 169, 244), .14);
  --fe-selected: color-mix(in srgb, var(--fe-accent) 14%, transparent);

  /* Windows 11 shell: Segoe UI Variable first, with HA's stack as fallback. */
  --fe-font: "Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", var(--ha-font-family-body, "Roboto", "Microsoft YaHei", system-ui, sans-serif);
  --fe-font-m: max(15px, var(--ha-font-size-m, 14px));
  --fe-font-s: max(14px, var(--ha-font-size-s, 13px));
  --fe-font-xs: max(13px, var(--ha-font-size-xs, 12px));
  --fe-font-xl: var(--ha-font-size-xl, 20px);
  --fe-radius-card: 8px;
  --fe-radius-control: 4px;
  --fe-radius-dialog: 8px;
  --fe-scrollbar: var(--scrollbar-thumb-color, var(--fe-line));
  /* Windows 11 surfaces: a hairline border, no drop shadow on the content pane. */
  --fe-card-border: 1px solid var(--fe-line);
  --fe-card-shadow: none;
  --fe-elevation: 0 8px 24px rgba(0, 0, 0, .18), 0 2px 6px rgba(0, 0, 0, .10);
  /* Mica-ish translucent chrome derived from the active HA theme. */
  --fe-chrome: color-mix(in srgb, var(--fe-surface) 72%, var(--fe-bg));
  --fe-chrome-low: color-mix(in srgb, var(--fe-surface) 88%, var(--fe-bg));

  display: block;
  height: 100%;
  min-height: 360px;
  color: var(--fe-text);
  font-family: var(--fe-font);
  font-size: var(--fe-font-m);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  color-scheme: light dark;
  accent-color: var(--fe-accent);
}

@media (prefers-color-scheme: dark) {
  :host {
    --fe-f-text: #e1e1e1;
    --fe-f-sub: #9b9b9b;
    --fe-f-bg: #111111;
    --fe-f-surface: #1c1c1c;
    --fe-f-line: rgba(255, 255, 255, .14);
    --fe-f-danger: #ef5350;
    --fe-f-hover: rgba(255, 255, 255, .08);
    --fe-f-scrim: rgba(0, 0, 0, .58);
  }
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }
button, input, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }

.fe-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; flex: none;
}
ha-icon.fe-ico { --mdc-icon-size: 18px; }

.fe-list {
  scrollbar-width: thin;
  scrollbar-color: var(--fe-scrollbar) transparent;
  overscroll-behavior: contain;
}
.fe-list::-webkit-scrollbar { width: 8px; height: 8px; }
.fe-list::-webkit-scrollbar-track { background: transparent; }
.fe-list::-webkit-scrollbar-thumb {
  background: var(--fe-scrollbar); border-radius: 4px;
}

/* ------------------------------------------------------------- app shell */
.fe-app {
  position: relative;
  display: flex; flex-direction: column;
  height: 100vh; height: 100dvh;
  min-height: max(360px, 100%);
  max-height: 100%;
  background: var(--fe-bg);
  overflow: hidden;
}
@supports (overflow: clip) { .fe-app { overflow: clip; } }

/* --------------------------------------------------------------- topbar */
/* Windows 11 header: a command bar row on top, an address bar row below it
   (path in the middle, search box on the right). */
.fe-topbar {
  display: flex; flex-direction: column;
  flex: none;
  background: var(--fe-chrome);
  color: var(--fe-text);
  border-bottom: 1px solid var(--fe-line);
  position: sticky; top: 0; z-index: 15;
}
@supports (backdrop-filter: blur(1px)) {
  .fe-topbar { backdrop-filter: blur(24px) saturate(1.4); }
}
/* The command bar is the panel's header, so it is exactly as tall as HA's own
   chrome (--fe-header-h, measured at runtime) in every view. Its divider sits
   on the bottom edge, which separates the header from the path/search row. */
.fe-commandbar {
  display: flex; align-items: center; gap: 4px;
  height: var(--fe-header-h, var(--header-height, 56px));
  padding: 0 12px; flex: none;
  border-bottom: 1px solid var(--fe-line);
}
.fe-commandbar-editor { padding: 0 16px; border-bottom: 0; }
/* Editor view: the divider is drawn *inside* the bar, so the 1px line can never
   push the bar past --header-height and leave the two headers out of step. */
.fe-topbar-editor { border-bottom: 0; box-shadow: inset 0 -1px 0 var(--fe-line); }
.fe-addressbar {
  display: flex; align-items: center; gap: 6px;
  padding: 0 12px; flex: none;
}
.fe-brand { display: flex; align-items: center; flex: none; }

.fe-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  min-height: 30px; padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--fe-radius-control);
  background: transparent; color: var(--fe-text);
  font-size: var(--fe-font-s); font-weight: 400; white-space: nowrap;
  transition: background .1s, border-color .1s, color .1s;
}
.fe-btn:hover { background: var(--fe-hover); }
.fe-btn:active { background: color-mix(in srgb, var(--fe-text) 14%, transparent); }
.fe-btn.primary { background: var(--fe-accent); border-color: transparent; color: var(--fe-on-accent); }
.fe-btn.primary:hover { filter: brightness(1.08); }
.fe-btn.danger { background: var(--fe-danger); border-color: transparent; color: #fff; }
.fe-btn .fe-ico { width: 16px; height: 16px; }
ha-icon.fe-btn-ico { --mdc-icon-size: 16px; }

.fe-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex: none;
  border: 0; border-radius: var(--fe-radius-control); background: transparent; color: var(--fe-text);
  transition: background .1s;
}
.fe-icon-btn:hover, .fe-icon-btn:active { background: var(--fe-hover); }
.fe-icon-btn .fe-ico { width: 20px; height: 20px; }
ha-icon.fe-icon-btn-ico { --mdc-icon-size: 20px; }

/* Windows 11 search box: hairline border, accent underline when focused.
   It sits at the far right of the address bar, so it never grows. */
/* The address bar is one strip split in three - parent | path | search -
   divided by hairlines instead of three separate input boxes. */
.fe-search {
  position: relative; display: flex; align-items: center;
  flex: 0 0 var(--fe-search-w, 132px); min-width: 96px; max-width: 320px;
  height: 34px; padding: 0 12px; gap: 8px;
  border: 0; border-radius: 0; background: transparent;
  transition: flex-basis 200ms cubic-bezier(.2, .7, .3, 1), background-color 160ms ease;
}
.fe-search::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 1px; height: 22px; background: var(--fe-line);
}
/* Compact until it has focus, then it stretches over the path segment. */
.fe-search:focus-within {
  flex-basis: var(--fe-search-w-focus, 280px);
  background: var(--fe-hover);
  border-radius: var(--fe-radius-control);
}
.fe-search:focus-within::before { opacity: 0; }
.fe-search > .fe-ico { width: 15px; height: 15px; color: var(--fe-sub); opacity: .8; }
.fe-search-input {
  flex: 1; min-width: 0; border: 0; outline: 0; background: transparent;
  font-size: var(--fe-font-s); color: var(--fe-text);
}
.fe-search-input::placeholder { color: var(--fe-sub); }
.fe-search-input::-webkit-search-cancel-button { display: none; }
.fe-search-clear {
  border: 0; background: transparent; color: var(--fe-sub);
  font-size: 18px; line-height: 1; padding: 0 2px;
}
.fe-spacer { flex: 1 1 auto; }

/* ----------------------------------------------------------------- body */
/* One merged pane: folders and files live in the same list, so there is no
   navigation sidebar to give width to. */
.fe-body { display: flex; flex: 1; min-height: 0; }
/* ------------------------------------------------------------ main pane */
.fe-main { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; container-type: inline-size; }
/* Breadcrumb bar, styled like the Win11 address bar; it takes all the middle
   space between the "up" button and the search box. */
.fe-crumbs {
  position: relative;
  display: flex; align-items: center; gap: 0; flex-wrap: nowrap;
  flex: 1 1 auto; min-width: 0;
  height: 34px; padding: 0 10px;
  overflow: hidden;
  border: 0; border-radius: 0; background: transparent;
  color: var(--fe-sub); font-size: var(--fe-font-xs);
}
.fe-crumbs::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 1px; height: 22px; background: var(--fe-line);
}
.fe-crumb {
  border: 0; background: transparent; color: var(--fe-sub);
  padding: 4px 6px; border-radius: 3px; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fe-crumb:hover { background: var(--fe-hover); color: var(--fe-text); }
.fe-crumb.current { color: var(--fe-text); font-weight: 600; }
.fe-crumb-sep { color: var(--fe-sub); opacity: .55; font-size: 11px; flex: none; }

/* Current folder name + item count, sitting at the left of the command bar. */
/* Files listed in the upload queue. */
.fe-upload-list {
  display: flex; flex-direction: column; gap: 4px; margin: 8px 0; padding: 6px 8px;
  max-height: 190px; overflow: auto;
  border: 1px solid var(--fe-border); border-radius: 6px;
  font-size: var(--fe-font-s);
}
.fe-upload-item { display: flex; align-items: center; gap: 8px; }
.fe-upload-kind { flex: none; width: 16px; text-align: center; }
.fe-upload-name { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fe-upload-dir { color: var(--fe-sub); }
.fe-upload-size { flex: none; color: var(--fe-sub); }
.fe-upload-remove {
  flex: none; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 50%;
  background: transparent; color: var(--fe-sub); font-size: 15px; line-height: 1; cursor: pointer;
}
.fe-upload-remove:hover { background: var(--fe-danger-soft, var(--fe-line)); color: var(--fe-danger); }
.fe-upload-more { color: var(--fe-sub); }

/* Drop target hint while a drag hovers the panel. */
.fe-drop {
  position: absolute; inset: 10px; z-index: 24; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  border: 2px dashed var(--fe-accent); border-radius: 12px;
  background: color-mix(in srgb, var(--fe-surface) 84%, transparent);
  color: var(--fe-text); font-size: var(--fe-font-m); font-weight: 600;
  backdrop-filter: blur(8px);
}
.fe-drop .fe-ico { width: 34px; height: 34px; color: var(--fe-accent); }
ha-icon.fe-drop .fe-ico, .fe-drop ha-icon { --mdc-icon-size: 34px; }

.fe-page-title { display: flex; align-items: baseline; gap: 8px; min-width: 0; flex: 0 1 auto; }
.fe-page-title h2 {
  margin: 0; font-size: var(--fe-font-m); font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;
}
.fe-page-title span { color: var(--fe-sub); font-size: var(--fe-font-xs); white-space: nowrap; flex: none; }
.fe-divider { width: 1px; height: 22px; flex: none; background: var(--fe-line); margin: 0 4px; }

/* Segmented grid / list switch (Win11 "视图" control). */
.fe-view-switch {
  display: flex; align-items: center; flex: none;
  border: 1px solid var(--fe-line); border-radius: var(--fe-radius-control); overflow: hidden;
}
.fe-view-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 28px; border: 0; background: transparent; color: var(--fe-sub);
  transition: background .1s, color .1s;
}
.fe-view-btn + .fe-view-btn { border-left: 1px solid var(--fe-line); }
.fe-view-btn:hover { background: var(--fe-hover); color: var(--fe-text); }
.fe-view-btn.active { background: color-mix(in srgb, var(--fe-accent) 14%, transparent); color: var(--fe-accent); }
.fe-view-btn .fe-ico { width: 16px; height: 16px; }
ha-icon.fe-view-btn .fe-ico, .fe-view-btn ha-icon { --mdc-icon-size: 16px; }

/* Full-bleed: the list is the content area itself, so it carries no outer
   margin, no card frame and no radius - rows reach the panel edges. */
.fe-list {
  flex: 1; min-height: 0; overflow: auto;
  margin: 0; padding: 0;
  background: var(--fe-surface);
  border: 0; border-radius: 0;
}
/* Tiles: auto-filled cells, Win11 "large icons" layout. */
.fe-list.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 2px; align-content: start;
}
.fe-list.rows { display: block; }

/* ------------------------------------------------------------- tiles */
.fe-tile {
  position: relative; display: flex; flex-direction: column; align-items: center;
  gap: 6px; padding: 14px 8px 10px; min-height: 116px; min-width: 0;
  border-radius: var(--fe-radius-control); user-select: none; text-align: center;
}
.fe-tile:hover { background: var(--fe-hover); }
.fe-tile:active { background: color-mix(in srgb, var(--fe-text) 12%, transparent); }
.fe-tile.menu-open { background: var(--fe-hover); }
.fe-tile-ico { color: var(--fe-icon); flex: none; width: 46px; height: 46px; }
ha-icon.fe-tile-ico { --mdc-icon-size: 46px; }
.fe-tile-ico .fe-ico { width: 46px; height: 46px; }
.fe-tile-name {
  flex: none; font-size: var(--fe-font-s); line-height: 1.3; max-width: 100%; cursor: pointer; word-break: break-all;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.fe-tile-name:hover { color: var(--fe-accent); }
.fe-tile-meta {
  flex: none; display: flex; flex-direction: column; align-items: center; gap: 0;
  font-size: var(--fe-font-xs); line-height: 1.35; max-width: 100%; min-width: 0;
}
.fe-tile-size { color: var(--fe-text); opacity: .62; font-variant-numeric: tabular-nums; }
.fe-tile-time { color: var(--fe-sub); opacity: .85; font-variant-numeric: tabular-nums; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fe-tile-menu { position: absolute; top: 3px; right: 3px; opacity: 0; transition: opacity .1s; }
.fe-tile:hover .fe-tile-menu, .fe-tile.menu-open .fe-tile-menu { opacity: 1; }
@media (hover: none) { .fe-tile-menu { opacity: 1; } }
.fe-tile-menu .fe-row-menu-btn { width: 26px; height: 26px; }
.fe-tile-menu .fe-row-menu-btn .fe-ico { width: 16px; height: 16px; }
ha-icon.fe-wrap-ico { --mdc-icon-size: 16px; }

/* Details rows: fixed columns like the Win11 details view. */
.fe-row {
  display: grid;
  grid-template-columns: var(--fe-row-cols, 22px minmax(0, 1fr) 110px 32px);
  align-items: center; gap: 10px;
  height: 40px; padding: 0 6px;
  border-radius: var(--fe-radius-control); user-select: none;
}
.fe-row:hover { background: var(--fe-hover); }
.fe-row:active { background: color-mix(in srgb, var(--fe-text) 12%, transparent); }
.fe-row-ico { color: var(--fe-icon); flex: none; }

/* HA's built-in entries (config root only) read in HA cyan, user content stays
   in the theme's neutral icon colour. */
.fe-row-ico.is-ha-dir, .fe-tile-ico.is-ha-dir { color: var(--fe-ha-dir); }
.fe-row-ico.is-ha-file, .fe-tile-ico.is-ha-file { color: var(--fe-ha-file); }
.fe-row-ico.is-ha-dir .fe-ico, .fe-tile-ico.is-ha-dir .fe-ico,
.fe-row-ico.is-ha-file .fe-ico, .fe-tile-ico.is-ha-file .fe-ico { color: inherit; }

/* HA's own entries also tint their label a touch, so the cue survives anywhere
   the glyph itself is not recolourable. */
.fe-row-name.is-ha-dir, .fe-tile-name.is-ha-dir,
.fe-row-name.is-ha-file, .fe-tile-name.is-ha-file {
  color: color-mix(in srgb, #41bdf5 52%, var(--fe-text));
}
/* Brand art of a HA integration takes the same slot as the folder glyph. */
.fe-brand-ico { object-fit: contain; border-radius: 4px; opacity: 0; transition: opacity 120ms ease; }
.fe-brand-slot[data-loaded="1"] .fe-brand-ico { opacity: 1; }
/* Brand art sits on top of a folder glyph of the same size, so the slot is
   never empty while the picture is in flight. */
.fe-brand-slot { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; }
.fe-tile-ico.fe-brand-slot { width: 46px; height: 46px; }
.fe-brand-ghost { color: var(--fe-icon); --mdc-icon-size: 22px; }
.fe-tile-ico .fe-brand-ghost { --mdc-icon-size: 46px; }
.fe-brand-slot img.fe-brand-ico { width: 100%; height: 100%; object-fit: contain; border-radius: 4px; }
.fe-brand-slot[data-loaded="1"] .fe-brand-ghost { display: none; }
.fe-row-ico .fe-ico { width: 22px; height: 22px; }
ha-icon.fe-row-ico { --mdc-icon-size: 22px; }
.fe-row-name {
  font-size: var(--fe-font-m); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  min-width: 0; cursor: pointer;
}
.fe-row-name:hover { color: var(--fe-accent); }
.fe-row-time, .fe-row-size {
  font-size: var(--fe-font-xs); color: var(--fe-sub);
  font-variant-numeric: tabular-nums;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fe-row-size { text-align: right; color: var(--fe-text); opacity: .72; }
.fe-row-menu { position: relative; display: flex; align-items: center; justify-content: flex-end; }
.fe-row-menu-btn { width: 28px; height: 28px; color: var(--fe-sub); }
.fe-row-menu-btn .fe-ico { width: 16px; height: 16px; }
.fe-row.menu-open { background: var(--fe-hover); }
/* Column widths follow the display options, so the template is set per render. */
@container (max-width: 520px) {
  .fe-row { gap: 8px; }
}

/* Hidden columns leave no track and no placeholder behind. */
.fe-list:not(.show-size) .fe-row-size,
.fe-list:not(.show-time) .fe-row-time { display: none; }
.fe-list:not(.show-size) .fe-tile-size,
.fe-list:not(.show-time) .fe-tile-time { display: none; }
.fe-list:not(.show-size):not(.show-time) .fe-tile-meta { display: none; }
.fe-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; min-height: 240px; width: 100%; grid-column: 1 / -1;
  color: var(--fe-sub); text-align: center; font-size: var(--fe-font-s);
}
.fe-empty .fe-ico { width: 40px; height: 40px; opacity: .45; }
/* An empty folder still needs a way in: creation actions sit right here. */
.fe-empty-actions {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px;
}

/* --------------------------------------------------------------- editor */
.fe-editor { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.fe-editor-bar {
  display: flex; align-items: center; gap: 10px; flex: none;
  padding: 10px 24px;
}
.fe-editor-bar .name { font-size: 16px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fe-badge {
  font-size: var(--fe-font-xs); padding: 3px 10px; border-radius: 12px;
  background: var(--fe-hover); color: var(--fe-sub);
}
/* Non-blocking check result in the editor bar: a quiet pill, never a dialog. */
.fe-lint {
  display: inline-flex; align-items: center; max-width: 46%;
  padding: 3px 10px; border-radius: 12px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
  font-size: var(--fe-font-xs); color: var(--fe-sub);
  background: var(--fe-hover); border: 1px solid transparent;
}
.fe-lint.ok { color: color-mix(in srgb, #16a34a, var(--fe-text) 40%); }
.fe-lint.warn {
  color: color-mix(in srgb, #d97706, var(--fe-text) 35%);
  border-color: color-mix(in srgb, #d97706 28%, transparent);
}
.fe-lint[hidden] { display: none; }
/* The editor is a full-bleed surface: no card margins, border or radius, so the
   code area touches the panel edges instead of sitting in a floating box. */
.fe-editor-surface {
  flex: 1; min-height: 0; display: flex; overflow: hidden;
  margin: 0; border: 0; border-radius: 0;
  background: var(--fe-surface);
}
.fe-gutter {
  margin: 0; padding: 12px 8px; text-align: right; user-select: none;
  font: 13px/20px ui-monospace, SFMono-Regular, Consolas, monospace;
  color: var(--disabled-text-color, var(--fe-sub));
  border-right: 1px solid var(--fe-line);
  overflow: hidden; white-space: pre; min-width: 48px;
}
/* Prism overlay: the <pre> paints the tokens, the textarea on top keeps native
   editing (caret, undo, IME, selection) with transparent text. Both share one
   font/padding/scroll box so the two layers never drift apart. */
.fe-code-wrap { position: relative; flex: 1; min-width: 0; overflow: hidden; }
.fe-hl, textarea.fe-code {
  position: absolute; inset: 0; margin: 0; padding: 12px 24px 12px 20px; border: 0;
  font: 13px/20px ui-monospace, SFMono-Regular, Consolas, monospace;
  white-space: pre; tab-size: 2; overflow: hidden;
}
.fe-hl { color: var(--fe-text); pointer-events: none; }
.fe-hl code { font: inherit; display: block; }
textarea.fe-code {
  background: transparent; color: transparent; caret-color: var(--fe-text);
  resize: none; outline: 0; overflow: auto;
}
textarea.fe-code::selection { color: transparent; background: color-mix(in srgb, var(--fe-accent) 34%, transparent); }
/* Token palette: each hue is mixed toward the theme's text color, so it stays
   readable on both a light and a dark HA theme without a second stylesheet. */
.fe-hl .token.comment, .fe-hl .token.prolog, .fe-hl .token.cdata { color: var(--fe-sub); font-style: italic; }
.fe-hl .token.punctuation { color: var(--fe-sub); }
.fe-hl .token.keyword, .fe-hl .token.atrule, .fe-hl .token.selector, .fe-hl .token.doctype { color: color-mix(in srgb, #8b5cf6 72%, var(--fe-text)); }
.fe-hl .token.string, .fe-hl .token.char, .fe-hl .token.scalar, .fe-hl .token.attr-value { color: color-mix(in srgb, #16a34a 78%, var(--fe-text)); }
.fe-hl .token.number, .fe-hl .token.boolean, .fe-hl .token.constant, .fe-hl .token.null, .fe-hl .token.important { color: color-mix(in srgb, #d97706 80%, var(--fe-text)); }
.fe-hl .token.function, .fe-hl .token.function-name, .fe-hl .token.builtin { color: color-mix(in srgb, #2563eb 74%, var(--fe-text)); }
.fe-hl .token.property, .fe-hl .token.key, .fe-hl .token.attr-name, .fe-hl .token.tag, .fe-hl .token.class-name { color: color-mix(in srgb, #0891b2 76%, var(--fe-text)); }
.fe-hl .token.variable, .fe-hl .token.environment, .fe-hl .token.parameter, .fe-hl .token.symbol { color: color-mix(in srgb, #dc2626 68%, var(--fe-text)); }
.fe-hl .token.operator { color: var(--fe-sub); }

/* --------------------------------------------------------- popup layers */
.fe-menu-layer, .fe-dialog-layer { position: absolute; inset: 0; pointer-events: none; display: none; }
.fe-menu-layer.show, .fe-dialog-layer.show { display: block; }
.fe-menu-layer { z-index: 20; }
.fe-dialog-layer { z-index: 30; }
.fe-menu {
  position: absolute; min-width: 210px; padding: 5px; white-space: nowrap;
  max-height: calc(100% - 16px); overflow: auto; overscroll-behavior: contain;
  background: var(--fe-surface); color: var(--fe-text);
  border: var(--fe-card-border); border-radius: 8px;
  box-shadow: var(--fe-elevation); pointer-events: auto;
}
.fe-menu-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  min-height: 32px; padding: 0 10px;
  border: 0; border-radius: var(--fe-radius-control); background: transparent;
  text-align: left; font-size: var(--fe-font-s);
}
.fe-menu-item:hover { background: var(--fe-hover); }
.fe-menu-check { margin-left: auto; color: var(--fe-accent); opacity: .9; }
.fe-menu-item.danger { color: var(--fe-danger); }

.fe-backdrop {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  padding: 16px; background: var(--fe-f-scrim); pointer-events: auto;
}
.fe-dialog {
  width: min(480px, 100%); max-height: calc(100% - 32px); overflow: auto;
  background: var(--fe-surface); color: var(--fe-text);
  border: var(--fe-card-border); border-radius: var(--fe-radius-dialog);
  box-shadow: var(--fe-elevation);
}
.fe-dialog h3 { margin: 0; padding: 16px 20px; font-size: 18px; font-weight: 600; border-bottom: 1px solid var(--fe-line); }
.fe-dialog-body { padding: 20px; }
.fe-dialog-body p { margin: 0 0 16px; font-size: var(--fe-font-m); }
.fe-dialog-body .hint { color: var(--fe-sub); font-size: var(--fe-font-s); }
.fe-dialog-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--fe-line); }
.fe-field { display: block; margin-bottom: 14px; }
.fe-field > span { display: block; font-size: var(--fe-font-s); color: var(--fe-sub); margin-bottom: 6px; }
.fe-field input[type="text"], .fe-field input[type="file"] {
  width: 100%; padding: 9px 11px; border-radius: var(--fe-radius-control);
  border: 1px solid var(--fe-line); border-bottom-color: color-mix(in srgb, var(--fe-text) 26%, var(--fe-line));
  background: var(--fe-chrome-low);
  color: var(--fe-text); font-size: var(--fe-font-m);
}
.fe-field input[type="text"]:focus { outline: 0; border-bottom: 2px solid var(--fe-accent); }
.fe-field input[type="file"] { padding: 8px; }
.fe-file-list { max-height: 120px; overflow: auto; font-size: var(--fe-font-xs); color: var(--fe-sub); border-top: 1px dashed var(--fe-line); padding-top: 10px; }
.fe-info-list { display: flex; flex-direction: column; }
.fe-info-item { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--fe-line); font-size: var(--fe-font-m); }
.fe-info-item:last-child { border-bottom: 0; }
.fe-info-item > span:first-child { color: var(--fe-sub); flex: 0 0 auto; }
.fe-info-value { text-align: right; word-break: break-all; }
.fe-info-item a { color: var(--fe-accent); word-break: break-all; }

.fe-toast-container {
  position: absolute; right: 24px; bottom: 24px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 40; max-width: min(360px, calc(100vw - 48px));
}
/* Win11 info bar: light surface plus a colored status edge, not a solid pill. */
.fe-toast {
  padding: 11px 14px 11px 16px; border-radius: var(--fe-radius-control);
  background: var(--fe-surface); color: var(--fe-text);
  border: 1px solid var(--fe-line); border-left: 3px solid var(--fe-accent);
  box-shadow: var(--fe-elevation); font-size: var(--fe-font-s); word-break: break-word;
}
.fe-toast.error { border-left-color: var(--fe-danger); }

.fe-progress {
  position: absolute; top: 0; left: 0; right: 0; height: 3px; overflow: hidden;
  background: var(--fe-line); z-index: 25;
}
/* Boot overlay: shown from the moment the element upgrades until the first
   listing lands, so a cold start never looks like an empty card. */
.fe-boot {
  position: absolute; inset: 0; z-index: 30;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; background: var(--fe-bg); color: var(--fe-sub);
  font-size: var(--fe-font-s);
}
.fe-spin {
  width: 34px; height: 34px; border-radius: 50%;
  border: 3px solid var(--fe-line); border-top-color: var(--fe-accent);
  animation: fe-spin 0.9s linear infinite;
}
@keyframes fe-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .fe-spin { animation-duration: 2.4s; }
}
.fe-loading-text {
  position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%);
  z-index: 26; padding: 6px 14px; border-radius: 14px;
  background: var(--fe-elevation); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
  color: var(--fe-text); font-size: var(--fe-font-s);
}
.fe-progress::after {
  content: ""; display: block; width: 35%; height: 100%;
  background: var(--fe-accent); animation: fe-indeterminate 1.1s infinite linear;
}
@keyframes fe-indeterminate { from { transform: translateX(-100%); } to { transform: translateX(320%); } }

/* ------------------------------------------------------------- preview */
.fe-preview {
  position: absolute; inset: 0; pointer-events: auto;
  display: flex; flex-direction: column;
  background: rgba(12, 14, 18, 0.82);
}
.fe-preview-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: nowrap;
  padding: 8px 8px 8px 14px; color: #f2f4f8;
  background: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.fe-preview-ico { color: #c9d2e0; }
.fe-preview-name {
  font-size: var(--fe-font-m); font-weight: 600; max-width: 46%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fe-preview-meta { font-size: var(--fe-font-xs); opacity: 0.72; white-space: nowrap; }
.fe-preview-bar .fe-spacer { flex: 1; }
.fe-preview-bar .fe-icon-btn { color: #f2f4f8; }
.fe-preview-bar .fe-icon-btn:hover,
.fe-preview-bar .fe-icon-btn:active { background: rgba(255, 255, 255, 0.16); }
.fe-preview-stage {
  position: relative; flex: 1; min-height: 0; overflow: auto;
  /* safe centring keeps the start edge reachable once the picture is bigger
     than the stage: plain centring clips it and scrollLeft can never get back. */
  display: flex; align-items: safe center; justify-content: safe center;
  padding: 16px;
  /* checkerboard so transparent PNGs read against something neutral */
  background-image:
    linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
}
.fe-preview-img {
  display: block; flex: none; max-width: 100%; max-height: 100%;
  object-fit: contain; cursor: zoom-in;
  border-radius: 6px; box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
}
/* Wheel-zoomed: the explicit pixel width replaces the fit constraints. */
.fe-preview-img.zoomed { max-width: none; max-height: none; cursor: zoom-out; }
.fe-preview-video {
  display: block; flex: none; max-width: 100%; max-height: 100%; background: #000;
  border-radius: 6px; box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
}
.fe-preview-play {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 68px; height: 68px; border: 0; border-radius: 50%; cursor: pointer;
  display: grid; place-items: center; color: #fff; background: rgba(0, 0, 0, 0.55);
  transition: background 0.15s ease;
}
.fe-preview-play .fe-ico { width: 34px; height: 34px; }
.fe-preview-play:hover { background: rgba(0, 0, 0, 0.78); }
/* display 而不是 opacity 渐变：标签页没在绘制时 opacity 过渡可能停在起始值，按钮会一直压在画面上 */
.fe-preview-stage.playing .fe-preview-play { display: none; }
.fe-preview-err {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  padding: 10px 16px; border-radius: 8px; font-size: var(--fe-font-m);
  color: #f2f4f8; background: rgba(0, 0, 0, 0.55); pointer-events: none;
}
.fe-preview-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 40px; height: 64px; display: grid; place-items: center;
  border: 0; border-radius: 8px; cursor: pointer;
  color: #fff; background: rgba(0, 0, 0, 0.42);
}
.fe-preview-nav.prev { left: 12px; }
.fe-preview-nav.next { right: 12px; }
.fe-preview-nav:hover { background: rgba(0, 0, 0, 0.66); }
.fe-preview-nav:disabled { opacity: 0.28; cursor: default; }
.fe-preview-nav .fe-ico { width: 22px; height: 22px; }

/* ----------------------------------------------------------- responsive */
@media (max-width: 870px) {
  .fe-commandbar { padding: 0 8px; gap: 2px; }
  /* Narrow phones: creating a file/folder is not a frequent action and the
     header has no room for it - it lives in the overflow menu instead. */
  .fe-topbar .fe-cmd-create { display: none; }
  .fe-addressbar { padding: 0 8px; gap: 4px; }
  .fe-topbar .fe-btn .fe-btn-label { display: none; }
  .fe-search { flex: 0 0 40%; max-width: 320px; }
  .fe-search:focus-within { flex-basis: 64%; }
  .fe-page-title h2 { max-width: 110px; }
  .fe-divider { display: none; }
  .fe-editor-bar { padding: 10px 12px; }
}
`;
