/** Formatting, path and icon helpers for the File Explorer panel. */

const HA_ROOT_FILES = [
  ".shopping_list.json",
  "secrets.yaml",
  "scripts.yaml",
  "scenes.yaml",
  "groups.yaml",
  "customize.yaml",
  "configuration.yaml",
  "automations.yaml",
];

const EXTENSION_ICONS = {
  code: "mdi:code-braces",
  img: "mdi:file-image",
  py: "mdi:language-python",
  log: "mdi:math-log",
  db: "mdi:database",
  js: "mdi:nodejs",
  sh: "mdi:bash",
  homeassistant: "mdi:home-assistant",
  json: "mdi:code-json",
  md: "mdi:language-markdown",
  html: "mdi:language-html5",
  video: "mdi:file-video",
  audio: "mdi:file-music",
  zip: "mdi:folder-zip",
  svg: "mdi:svg",
  css: "mdi:language-css3",
  pdf: "mdi:file-pdf-box",
  ts: "mdi:language-typescript",
  vue: "mdi:vuejs",
  txt: "mdi:file-document-outline",
  font: "mdi:format-font",
};

const HA_FOLDERS = [
  "www",
  "tts",
  "themes",
  "media",
  "custom_components",
  "blueprints",
  ".storage",
  ".cloud",
  "script",
  "automation",
  "homeassistant",
  "python_scripts",
  "packages",
];

const NON_EDITABLE_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "bmp", "ico", "svg", "webp",
  "mp3", "m4a", "wav", "ogg", "flac",
  "mp4", "webm", "mov", "avi", "mkv", "flv",
  "db", "db-shm", "db-wal", "sqlite", "sqlite3",
  "zip", "rar", "gz", "7z", "tar", "tz",
  "pyc", "dll", "so", "exe", "bin",
  "woff", "woff2", "ttf", "otf", "eot",
  "pdf",
];

const MODE_NAMES = {
  js: "JavaScript", ts: "TypeScript", jsx: "JavaScript",
  py: "Python", md: "Markdown", yml: "YAML", yaml: "YAML",
  json: "JSON", html: "HTML", htm: "HTML", css: "CSS",
  sh: "Shell", xml: "XML", txt: "Text", conf: "Config",
};

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function extension(name) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function isEditable(name) {
  return !NON_EDITABLE_EXTENSIONS.includes(extension(name));
}

export function editorMode(name) {
  return MODE_NAMES[extension(name)] || "";
}

export function formatSize(size) {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(2)} MB`;
  return `${(size / 1024 ** 3).toFixed(2)} GB`;
}

/** Split a config-relative path into clean segments. */
export function splitPath(path) {
  return String(path || "")
    .split("/")
    .filter((part) => part && part !== ".");
}

/** Join path segments with an optional trailing name. */
export function joinPath(parts, name) {
  const segments = name ? [...parts, name] : parts;
  return segments.join("/");
}

export function parentPath(path) {
  return splitPath(path).slice(0, -1).join("/");
}

/** True when the current directory is (inside) the public /local www folder. */
export function isPublicPath(path) {
  const parts = splitPath(path);
  return parts[0] === "www";
}

/** URL of a file in the HA /local static directory. */
export function localUrl(path, name) {
  const parts = splitPath(path).slice(1);
  parts.push(name);
  return `/local/${parts.map(encodeURIComponent).join("/")}`;
}

export function fileIcon(path, name) {
  if (!splitPath(path).length) {
    if (HA_ROOT_FILES.includes(name)) return "mdi:home-assistant";
    if (name.startsWith("home-assistant.log")) return "mdi:math-log";
    if (name.startsWith("home-assistant_v2.db")) return "mdi:database";
  }
  let ext = extension(name);
  if (["jpg", "jpeg", "png", "gif", "bmp", "ico"].includes(ext)) ext = "img";
  else if (["yaml", "yml", "ds_store"].includes(ext)) ext = "code";
  else if (
    ["ha_version", "config_entries", "device_registry", "entity_registry", "area_registry", "restore_state"].includes(ext)
  ) ext = "homeassistant";
  else if (["m3u8", "mp4", "flv", "m3u"].includes(ext)) ext = "video";
  else if (["mp3", "m4a"].includes(ext)) ext = "audio";
  else if (["gz", "rar", "tz", "zip"].includes(ext)) ext = "zip";
  else if (["html", "htm"].includes(ext)) ext = "html";
  else if (["db-shm", "db-wal"].includes(ext)) ext = "db";
  else if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext)) ext = "font";
  return EXTENSION_ICONS[ext] || "mdi:file";
}

export function folderIcon(name) {
  if (["deps", "__pycache__"].includes(name)) return "mdi:language-python";
  if (HA_FOLDERS.includes(name)) return "mdi:home-assistant";
  return "mdi:folder";
}
