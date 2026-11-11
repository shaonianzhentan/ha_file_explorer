/** Panel styles. Every color comes from a HA theme variable, with light-mode fallbacks. */
export const styles = `
[hidden] { display: none !important; }

:host {
  display: block;
  height: 100%;
  min-height: calc(100vh - 64px);
  color: var(--primary-text-color, #212121);
  font-family: inherit;
  background: var(--primary-background-color, #fafafa);
  -webkit-font-smoothing: antialiased;
}

* { box-sizing: border-box; }

.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: inherit;
  position: relative;
}

ha-icon { --mdc-icon-size: 20px; width: 20px; height: 20px; flex: 0 0 auto; }

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 24px 8px;
}

.title-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 4px 0;
  font: inherit;
}
.title-button ha-icon { --mdc-icon-size: 28px; width: 28px; height: 28px; color: var(--primary-color, #03a9f4); }
.title-button .title { font-size: 22px; font-weight: 500; }
.title-button .version { font-size: 12px; color: var(--secondary-text-color, #727272); align-self: flex-end; padding-bottom: 3px; }
.toolbar > .title { display: inline-flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 500; min-width: 0; }
.toolbar > .title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toolbar > .title ha-icon { color: var(--primary-color, #03a9f4); }

.spacer { flex: 1 1 auto; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 18px;
  border: 1px solid var(--divider-color, rgba(0, 0, 0, .12));
  background: var(--card-background-color, var(--primary-background-color, #fff));
  color: var(--primary-text-color, #212121);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color .15s ease;
}
.btn:hover { background: var(--secondary-background-color, rgba(127, 127, 127, .12)); }
.btn:focus-visible, .crumb:focus-visible, .row-name:focus-visible {
  outline: 2px solid var(--primary-color, #03a9f4);
  outline-offset: 2px;
}
.btn.primary {
  background: var(--primary-color, #03a9f4);
  border-color: transparent;
  color: var(--text-primary-color, #fff);
}
.btn.primary:hover { filter: brightness(1.08); }
.btn.danger { color: var(--error-color, #db4437); }
.btn.icon { width: 36px; padding: 0; border-color: transparent; background: transparent; }
.btn.icon:hover { background: var(--secondary-background-color, rgba(127, 127, 127, .12)); }

.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 24px 12px;
}
.crumb {
  border: 0;
  background: transparent;
  color: var(--primary-color, #03a9f4);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 6px;
}
.crumb:hover { background: var(--secondary-background-color, rgba(127, 127, 127, .12)); }
.crumb.current { color: var(--primary-text-color, #212121); }
.sep { --mdc-icon-size: 16px; width: 16px; height: 16px; color: var(--secondary-text-color, #727272); }

.filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  min-height: 34px;
  border-radius: 18px;
  border: 1px solid var(--divider-color, rgba(0, 0, 0, .12));
  background: var(--card-background-color, transparent);
}
.filter ha-icon { --mdc-icon-size: 18px; width: 18px; height: 18px; color: var(--secondary-text-color, #727272); }
.filter input { border: 0; outline: 0; background: transparent; color: inherit; font: inherit; font-size: 13px; width: 160px; }

.content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 0 24px 24px;
  align-items: start;
}
@media (max-width: 900px) {
  .content { grid-template-columns: 1fr; }
}
:host(.narrow) .content { grid-template-columns: 1fr; }

.card {
  background: var(--card-background-color, var(--primary-background-color, #fff));
  border-radius: var(--ha-card-border-radius, 12px);
  box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, .14));
  border: 1px solid var(--ha-card-border-color, var(--divider-color, rgba(0, 0, 0, .1)));
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, .1));
}
.card-header h2 { font-size: 16px; font-weight: 500; margin: 0; }
.card-header .count {
  font-size: 12px;
  color: var(--secondary-text-color, #727272);
  background: var(--secondary-background-color, rgba(127, 127, 127, .12));
  border-radius: 10px;
  padding: 2px 8px;
}
.card-header ha-icon { color: var(--primary-color, #03a9f4); }

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 16px;
  border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, .08));
}
.row:last-child { border-bottom: 0; }
.row:hover { background: var(--secondary-background-color, rgba(127, 127, 127, .08)); }
.row-icon { color: var(--primary-color, #03a9f4); --mdc-icon-size: 24px; width: 24px; height: 24px; }
.row-main { flex: 1 1 auto; min-width: 0; }
.row-name { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.row-name:hover { color: var(--primary-color, #03a9f4); }
.row-meta { font-size: 12px; color: var(--secondary-text-color, #727272); margin-top: 2px; }
.row-actions { display: flex; gap: 2px; flex: 0 0 auto; opacity: .45; }
.row:hover .row-actions, .row:focus-within .row-actions { opacity: 1; }
.row-actions .btn.icon { width: 32px; min-height: 32px; }
.row-actions .btn.icon ha-icon { --mdc-icon-size: 18px; width: 18px; height: 18px; }
.row-actions .btn.danger { color: var(--error-color, #db4437); }

.empty { padding: 28px 16px; text-align: center; color: var(--secondary-text-color, #727272); font-size: 14px; }

.progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  overflow: hidden;
  background: var(--divider-color, rgba(0, 0, 0, .1));
  z-index: 2;
}
.progress::after {
  content: "";
  display: block;
  width: 35%;
  height: 100%;
  background: var(--primary-color, #03a9f4);
  animation: indeterminate 1.1s infinite linear;
}
@keyframes indeterminate {
  from { transform: translateX(-100%); }
  to { transform: translateX(320%); }
}

.editor { display: flex; flex-direction: column; height: 100%; min-height: inherit; padding: 0 24px 24px; }
.editor-surface {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  overflow: hidden;
  border-radius: var(--ha-card-border-radius, 12px);
  border: 1px solid var(--divider-color, rgba(0, 0, 0, .12));
  background: var(--card-background-color, var(--primary-background-color, #fff));
  box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, .14));
}
.gutter {
  margin: 0;
  padding: 12px 8px;
  text-align: right;
  user-select: none;
  font: 13px/20px ui-monospace, SFMono-Regular, Consolas, monospace;
  color: var(--disabled-text-color, var(--secondary-text-color, #9b9b9b));
  border-right: 1px solid var(--divider-color, rgba(0, 0, 0, .1));
  overflow: hidden;
  white-space: pre;
  min-width: 48px;
}
textarea[data-role="code"] {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  outline: 0;
  resize: none;
  padding: 12px;
  background: transparent;
  color: var(--primary-text-color, #212121);
  font: 13px/20px ui-monospace, SFMono-Regular, Consolas, monospace;
  white-space: pre;
  tab-size: 2;
  overflow: auto;
}
.badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  background: var(--secondary-background-color, rgba(127, 127, 127, .12));
  color: var(--secondary-text-color, #727272);
}

.backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, .5);
  z-index: 20;
}
.dialog {
  width: min(480px, 100%);
  max-height: calc(100vh - 32px);
  overflow: auto;
  background: var(--card-background-color, var(--primary-background-color, #fff));
  color: var(--primary-text-color, #212121);
  border-radius: var(--ha-card-border-radius, 12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .28);
}
.dialog h3 { margin: 0; padding: 16px 20px; font-size: 18px; font-weight: 500; border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, .1)); }
.dialog-body { padding: 20px; }
.dialog-body p { margin: 0 0 16px; font-size: 14px; }
.dialog-body .hint { color: var(--secondary-text-color, #727272); font-size: 13px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--divider-color, rgba(0, 0, 0, .1)); }
.field { display: block; margin-bottom: 14px; }
.field > span { display: block; font-size: 13px; color: var(--secondary-text-color, #727272); margin-bottom: 6px; }
.field input[type="text"], .field input[type="file"] {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--divider-color, rgba(0, 0, 0, .2));
  background: var(--primary-background-color, #fff);
  color: var(--primary-text-color, #212121);
  font: inherit;
  font-size: 14px;
}
.field input[type="file"] { padding: 8px; }
.file-list {
  max-height: 120px;
  overflow: auto;
  font-size: 12px;
  color: var(--secondary-text-color, #727272);
  border-top: 1px dashed var(--divider-color, rgba(0, 0, 0, .15));
  padding-top: 10px;
}
.info-list { display: flex; flex-direction: column; }
.info-item { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, .1)); font-size: 14px; }
.info-item:last-child { border-bottom: 0; }
.info-item span:first-child { font-weight: 500; }
.info-item a { color: var(--primary-color, #03a9f4); word-break: break-all; }

.toast-container {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 30;
  max-width: min(360px, calc(100vw - 48px));
}
.toast {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--primary-color, #03a9f4);
  color: var(--text-primary-color, #fff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .24);
  font-size: 14px;
  word-break: break-word;
}
.toast.error { background: var(--error-color, #db4437); }

@media (max-width: 600px) {
  .toolbar { padding: 12px 12px 8px; }
  .breadcrumbs { padding: 0 12px 12px; }
  .content { padding: 0 12px 16px; }
  .editor { padding: 0 12px 16px; }
  .btn .label { display: none; }
  .filter input { width: 110px; }
}
`;
