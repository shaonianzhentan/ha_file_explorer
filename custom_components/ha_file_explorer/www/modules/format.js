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

/**
 * Image formats the panel previews in a dialog. Keep this in sync with
 * `IMAGE_TYPES` in http_api.py, which types the proxy response.
 *
 * This is the single source of truth for "is it an image": binary media cannot
 * be opened as text, so every key here is also listed as non-editable below.
 */
const IMAGE_MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  pjpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  heic: "image/heic",
  heif: "image/heif",
  apng: "image/apng",
};

/**
 * Video formats the preview dialog plays. Keep this in sync with `VIDEO_TYPES`
 * in http_api.py. Same rule as images: these are binary, never text-editable.
 *
 * Deliberately no "ogg"/"ogv"-only exotica beyond what browsers really decode,
 * and no ".ts" (that is TypeScript in this app, not a transport stream).
 */
const VIDEO_MIME = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  ogv: "video/ogg",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  flv: "video/x-flv",
  mpg: "video/mpeg",
  mpeg: "video/mpeg",
  wmv: "video/x-ms-wmv",
  "3gp": "video/3gpp",
};

/** Audio is not previewable (no player in the dialog) but it is still binary. */
const AUDIO_EXTENSIONS = [
  "mp3", "m4a", "m4b", "aac", "flac", "wav", "wave", "ogg", "oga", "opus",
  "wma", "aiff", "aif", "amr", "mid", "midi", "ape", "mka",
];

/** Anything a stream playlist: text inside, but the icon should read as media. */
const PLAYLIST_EXTENSIONS = ["m3u", "m3u8", "pls", "xspf"];

const ARCHIVE_EXTENSIONS = ["zip", "rar", "7z", "gz", "tgz", "tar", "tz", "bz2", "xz", "zst", "lz", "lz4", "cab"];

/** Database and bytecode-like blobs: never text, never previewable. */
const BINARY_EXTENSIONS = [
  "db", "db-shm", "db-wal", "sqlite", "sqlite3", "pyc", "pyo", "pkl", "pyd",
  "so", "dylib", "dll", "exe", "msi", "bin", "dat", "class", "jar", "war",
  "apk", "ipa", "deb", "rpm", "dmg", "iso", "img", "wasm", "ttc",
];

const OFFICE_EXTENSIONS = [
  "doc", "docx", "odt", "rtf", "pages",
  "xls", "xlsx", "xlsm", "ods", "numbers",
  "ppt", "pptx", "odp", "key",
  "epub", "mobi", "azw3",
];

const FONT_EXTENSIONS = ["woff", "woff2", "ttf", "otf", "eot"];

/**
 * Every format that must not be opened in the text editor. Media lists are
 * derived from the MIME maps, so "previewable" and "editable" can never drift
 * apart the way hand-written duplicates do.
 */
const NON_EDITABLE_EXTENSIONS = [
  ...Object.keys(IMAGE_MIME),
  ...Object.keys(VIDEO_MIME),
  ...AUDIO_EXTENSIONS,
  ...ARCHIVE_EXTENSIONS,
  ...BINARY_EXTENSIONS,
  ...OFFICE_EXTENSIONS,
  ...FONT_EXTENSIONS,
  "pdf",
];

const EXTENSION_ICONS = {
  // code and config
  code: "mdi:code-braces",
  text: "mdi:file-document-outline",
  py: "mdi:language-python",
  js: "mdi:nodejs",
  sh: "mdi:bash",
  console: "mdi:console",
  json: "mdi:code-json",
  md: "mdi:language-markdown",
  html: "mdi:language-html5",
  css: "mdi:language-css3",
  ts: "mdi:language-typescript",
  vue: "mdi:vuejs",
  xml: "mdi:xml",
  sql: "mdi:database",
  config: "mdi:cog-outline",
  delimited: "mdi:file-delimited-outline",
  // media
  img: "mdi:file-image",
  video: "mdi:file-video",
  audio: "mdi:file-music",
  playlist: "mdi:playlist-music-outline",
  // binaries
  db: "mdi:database",
  zip: "mdi:folder-zip",
  app: "mdi:application-cog",
  package: "mdi:package-variant",
  disk: "mdi:disk",
  font: "mdi:format-font",
  svg: "mdi:svg",
  pdf: "mdi:file-pdf-box",
  // documents
  word: "mdi:file-word",
  excel: "mdi:file-excel",
  powerpoint: "mdi:file-powerpoint",
  ebook: "mdi:book-open-page-variant",
  // Home Assistant config files
  homeassistant: "mdi:home-assistant",
  log: "mdi:math-log",
  yaml: "mdi:code-braces",
};

/** Extension -> icon key, for files that carry no extension of their own. */
const SPECIAL_EXTENSION_KEYS = {
  ds_store: "code",
  ha_version: "homeassistant",
  config_entries: "homeassistant",
  device_registry: "homeassistant",
  entity_registry: "homeassistant",
  area_registry: "homeassistant",
  restore_state: "homeassistant",
};

/** Dotfiles have no extension (see `extension()`), so match on the whole name. */
const SPECIAL_FILE_ICONS = {
  ".ds_store": "code",
  ".gitignore": "config",
  ".gitattributes": "config",
  ".gitmodules": "config",
  ".dockerignore": "config",
  ".editorconfig": "config",
  ".env": "config",
  ".env.local": "config",
  ".npmrc": "config",
  ".bashrc": "console",
  ".zshrc": "console",
  ".profile": "console",
};

const EXTENSION_KEY_BY_EXT = {
  // code
  js: "js", mjs: "js", cjs: "js", py: "py", sh: "sh", bash: "sh", zsh: "sh",
  console: "console", bat: "console", cmd: "console", ps1: "console",
  json: "json", jsonc: "json", json5: "json",
  md: "md", markdown: "md", mdx: "md",
  html: "html", htm: "html", xhtml: "html",
  css: "css", scss: "css", less: "css", sass: "css",
  ts: "ts", tsx: "ts", jsx: "js", vue: "vue", svelte: "vue",
  xml: "xml", xsl: "xml", plist: "xml", svg: "svg",
  sql: "sql",
  ini: "config", toml: "config", cfg: "config", conf: "config",
  env: "config", properties: "config", editorconfig: "config",
  csv: "delimited", tsv: "delimited",
  yml: "yaml", yaml: "yaml",
  txt: "text", log: "log", rst: "md", tex: "md",
  // documents
  doc: "word", docx: "word", odt: "word", rtf: "word", pages: "word",
  xls: "excel", xlsx: "excel", xlsm: "excel", ods: "excel", numbers: "excel",
  ppt: "powerpoint", pptx: "powerpoint", odp: "powerpoint", key: "powerpoint",
  epub: "ebook", mobi: "ebook", azw3: "ebook",
  pdf: "pdf",
  // binaries
  zip: "zip", rar: "zip", "7z": "zip", gz: "zip", tgz: "zip", tar: "zip",
  tz: "zip", bz2: "zip", xz: "zip", zst: "zip", lz: "zip", lz4: "zip", cab: "zip",
  exe: "app", dll: "app", so: "app", dylib: "app", msi: "app", deb: "app",
  rpm: "app", jar: "app", war: "app", wasm: "app", class: "app", pyc: "app",
  pyo: "app", pkl: "app", pyd: "app",
  apk: "package", ipa: "package",
  dmg: "disk", iso: "disk",
  db: "db", "db-shm": "db", "db-wal": "db", sqlite: "db", sqlite3: "db",
  woff: "font", woff2: "font", ttf: "font", otf: "font", eot: "font", ttc: "font",
  // media
  png: "img", jpg: "img", jpeg: "img", jfif: "img", pjpeg: "img", gif: "img",
  webp: "img", avif: "img", bmp: "img", ico: "img", tif: "img", tiff: "img",
  heic: "img", heif: "img", apng: "img",
  mp4: "video", m4v: "video", webm: "video", mov: "video", ogv: "video",
  mkv: "video", avi: "video", flv: "video", mpg: "video", mpeg: "video",
  wmv: "video", "3gp": "video",
  m3u: "playlist", m3u8: "playlist", pls: "playlist", xspf: "playlist",
  mp3: "audio", m4a: "audio", m4b: "audio", aac: "audio", flac: "audio",
  wav: "audio", wave: "audio", ogg: "audio", oga: "audio", opus: "audio",
  wma: "audio", aiff: "audio", aif: "audio", amr: "audio", mid: "audio",
  midi: "audio", ape: "audio", mka: "audio",
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

const MODE_NAMES = {
  js: "JavaScript", mjs: "JavaScript", cjs: "JavaScript", jsx: "JavaScript",
  ts: "TypeScript", tsx: "TypeScript",
  py: "Python", md: "Markdown", yml: "YAML", yaml: "YAML", json: "JSON",
  html: "HTML", htm: "HTML", css: "CSS", scss: "SCSS", less: "Less",
  sh: "Shell", bash: "Shell", ps1: "PowerShell", bat: "Batch",
  xml: "XML", sql: "SQL", ini: "INI", toml: "TOML", conf: "Config",
  txt: "Text", log: "Log", csv: "CSV", vue: "Vue", svg: "SVG",
};

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Last path segment: "a/b/c.yaml" -> "c.yaml". */
export function baseName(path) {
  const parts = String(path || "").split(/[\\/]/);
  return parts[parts.length - 1] || "";
}

/**
 * Lower-case extension without the dot. "" for names with no extension and
 * for dotfiles (".gitignore"), which are text but have no format.
 */
export function extension(name) {
  const base = baseName(name);
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function isEditable(name) {
  return !NON_EDITABLE_EXTENSIONS.includes(extension(name));
}

/** True for file names the preview dialog can display. */
export function isImage(name) {
  return Object.prototype.hasOwnProperty.call(IMAGE_MIME, extension(name));
}

/** MIME type of an image file name, guessed from its extension. */
export function imageMime(name) {
  return IMAGE_MIME[extension(name)] || "application/octet-stream";
}

/** True for file names the preview dialog can play. */
export function isVideo(name) {
  return Object.prototype.hasOwnProperty.call(VIDEO_MIME, extension(name));
}

/** MIME type of a video file name, guessed from its extension. */
export function videoMime(name) {
  return VIDEO_MIME[extension(name)] || "application/octet-stream";
}

/** True for anything the preview dialog can show (image or video). */
export function isMedia(name) {
  return isImage(name) || isVideo(name);
}

export function editorMode(name) {
  return MODE_NAMES[extension(name)] || "";
}

export function formatSize(size) {
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB", "PB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(2)} ${units[unit]}`;
}

/**
 * Format an epoch-seconds timestamp in the browser's own timezone.
 * Returns "" for a missing value so callers can print their own fallback.
 */
export function dateText(epoch) {
  const seconds = Number(epoch);
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

/** Split a config-relative path into clean segments. */
/**
 * Directories Home Assistant itself puts in the config root. The panel tints
 * them (and the files below) with HA's brand colour, so they read apart from
 * whatever the user created; nothing here implies write protection.
 */
const HA_SYSTEM_DIRS = new Set([
  ".storage",
  ".cloud",
  ".cache",
  "custom_components",
  "www",
  "themes",
  "deps",
  "tts",
  "backups",
  "blueprints",
  "media",
]);

/** Config files HA writes or expects at the root of its config directory. */
const HA_SYSTEM_FILES = new Set([
  "configuration.yaml",
  "automations.yaml",
  "scripts.yaml",
  "scenes.yaml",
  "secrets.yaml",
  "customize.yaml",
  "groups.yaml",
  "ui-lovelace.yaml",
  "ip_bans.yaml",
  "known_devices.yaml",
  ".HA_VERSION",
  ".uuid",
]);

const HA_LOG_FILE = /^home-assistant\.log(\.\d+)?$/;
const HA_DB_FILE = /^home-assistant_v2\.db(-wal|-shm)?$/;

/**
 * "dir" | "file" | "" - whether the entry is one of HA's own, looked up only in
 * the config root (a same-named folder deeper down is the user's business).
 */
export function haSystemKind(path, name, isDir) {
  if (splitPath(path).length) return "";
  if (isDir) return HA_SYSTEM_DIRS.has(name) ? "dir" : "";
  if (HA_SYSTEM_FILES.has(name)) return "file";
  return HA_LOG_FILE.test(name) || HA_DB_FILE.test(name) ? "file" : "";
}

export function splitPath(path) {
  return String(path || "")
    .split(/[\\/]/)
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

export function fileIcon(path, name) {
  const lower = baseName(name).toLowerCase();
  const special = SPECIAL_FILE_ICONS[lower];
  if (special) return EXTENSION_ICONS[special];
  if (!splitPath(path).length) {
    if (HA_ROOT_FILES.includes(name)) return EXTENSION_ICONS.homeassistant;
    if (name.startsWith("home-assistant.log")) return EXTENSION_ICONS.log;
    if (name.startsWith("home-assistant_v2.db")) return EXTENSION_ICONS.db;
  }
  const ext = extension(name);
  const key = SPECIAL_EXTENSION_KEYS[ext] || EXTENSION_KEY_BY_EXT[ext];
  return EXTENSION_ICONS[key] || "mdi:file";
}

export function folderIcon(name) {
  if (["deps", "__pycache__", "site-packages", "venv", ".venv", "dist-packages"].includes(name)) {
    return EXTENSION_ICONS.py;
  }
  if ([".git", ".github", ".gitlab"].includes(name)) return "mdi:git";
  if (["node_modules", ".npm", ".yarn"].includes(name)) return "mdi:npm";
  if (["images", "img", "photos", "pictures", "icons", "wallpapers"].includes(name)) {
    return "mdi:image-multiple-outline";
  }
  if (["fonts", "webfonts"].includes(name)) return EXTENSION_ICONS.font;
  if (["backup", "backups", "snapshots"].includes(name)) return "mdi:backup-restore";
  if (HA_FOLDERS.includes(name)) return EXTENSION_ICONS.homeassistant;
  return "mdi:folder";
}
