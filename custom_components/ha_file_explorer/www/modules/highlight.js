/**
 * Lazy Prism loader for the editor's highlight overlay.
 *
 * Prism is vendored under ./vendor/ (MIT, prismjs.com) because an HA custom
 * panel must work offline — a CDN <script> is not an option. Loading is lazy:
 * the editor opens fine without it, and the first render paints plain text.
 */
import { esc, extension } from "./format.js";

const CORE = "prism.min.js";
/* Load order matters: markdown reads languages.yaml, typescript/jsx read
   languages.javascript (shipped inside the core bundle). */
const COMPONENTS = [
  "prism-yaml.min.js",
  "prism-json.min.js",
  "prism-python.min.js",
  "prism-bash.min.js",
  "prism-markdown.min.js",
  "prism-typescript.min.js",
  "prism-jsx.min.js",
];

const LANGUAGE_MAP = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  jsx: "jsx",
  py: "python",
  md: "markdown",
  markdown: "markdown",
  yml: "yaml",
  yaml: "yaml",
  json: "json",
  html: "markup",
  htm: "markup",
  xml: "markup",
  svg: "markup",
  css: "css",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
};

/** Above this size the overlay is skipped and the editor stays plain text. */
export const MAX_HIGHLIGHT_CHARS = 200000;

let pending = null;

function vendorUrl(file) {
  return new URL(`./vendor/${file}`, import.meta.url).href;
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`无法加载 ${url}`));
    document.head.appendChild(script);
  });
}

/** Resolves once every needed grammar is registered; safe to call repeatedly. */
export function loadPrism() {
  if (window.Prism && window.Prism.languages && window.Prism.languages.yaml) {
    return Promise.resolve(window.Prism);
  }
  if (pending) return pending;
  pending = (async () => {
    // `manual` keeps the core bundle from tokenizing the surrounding HA page.
    if (!window.Prism || typeof window.Prism !== "object") {
      window.Prism = { manual: true };
    }
    window.Prism.manual = true;
    await loadScript(vendorUrl(CORE));
    for (const file of COMPONENTS) await loadScript(vendorUrl(file));
    return window.Prism;
  })().catch((error) => {
    pending = null;
    throw error;
  });
  return pending;
}

/** Prism grammar name for a file name, or "" when it is not highlighted. */
export function languageFor(name) {
  return LANGUAGE_MAP[extension(name || "")] || "";
}

/** Escaped HTML with Prism tokens; falls back to plain escaped text. */
export function highlightToHTML(text, language) {
  const prism = window.Prism;
  const grammar = language && prism && prism.languages ? prism.languages[language] : null;
  if (!grammar) return esc(text);
  try {
    return prism.highlight(text, grammar, language);
  } catch (error) {
    return esc(text);
  }
}
