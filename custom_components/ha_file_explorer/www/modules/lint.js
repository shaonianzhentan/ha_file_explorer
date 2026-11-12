/**
 * Formatting + well-formedness checks for the text editor.
 *
 * Deliberately dependency-free: YAML is never re-parsed (a round trip through a
 * YAML library would drop comments, anchors and block-scalar layout), so the
 * formatter only rewrites leading indentation, trailing spaces and blank runs.
 * JSON is the one format we can validate for real, with JSON.parse.
 *
 * Issues are `{ line, key, args }` so the panel can translate them itself.
 */
import { extension } from "./format.js";

const KINDS = { json: "json", yml: "yaml", yaml: "yaml", py: "python" };
const INDENT = 2;
const PY_INDENT = 4;
/** A "block scalar" body (`key: |`) keeps whatever relative indentation it has. */
const BLOCK_SCALAR = /(?:^|\s)[|>][-+]?\d*\s*(?:#.*)?$/;

/** "json" | "yaml" | "python" | "" for a given file name. */
export function lintKind(name) {
  return KINDS[extension(name || "")] || "";
}

function withoutBom(text) {
  return String(text || "").replace(/^\uFEFF/, "");
}

function lineOf(text, index) {
  const upto = text.slice(0, index).split("\n");
  return { line: upto.length, column: upto[upto.length - 1].length + 1 };
}

/* --------------------------------------------------------------- JSON */

/**
 * Line of the first structural JSON problem, or 0 when the scanner sees none.
 * JSON.parse only tells us "not valid"; this finds *where* for the hint.
 */
function jsonProblemLine(text) {
  const source = withoutBom(text);
  const stack = [];
  let line = 1;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "\n") {
      line += 1;
    } else if (ch === '"') {
      let j = i + 1;
      let closed = false;
      while (j < source.length) {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === '"') {
          closed = true;
          break;
        }
        if (source[j] === "\n") return line; // a string cannot span a line
        j += 1;
      }
      if (!closed) return line;
      i = j;
    } else if (ch === "{" || ch === "[") {
      stack.push(ch === "{" ? "}" : "]");
    } else if (ch === "}" || ch === "]") {
      if (stack.pop() !== ch) return line;
    } else if (ch === "'") {
      return line;
    } else if (ch === ",") {
      const next = source.slice(i + 1).replace(/^[\s]+/, "")[0];
      if (stack.length && next === stack[stack.length - 1]) return line;
    }
  }
  return 0;
}

export function checkJson(text) {
  try {
    JSON.parse(withoutBom(text));
    return [];
  } catch (error) {
    const message = String((error && error.message) || error);
    const at = /position (\d+)/.exec(message);
    const atLine = /line (\d+) column (\d+)/.exec(message);
    // V8 dropped the position in newer messages and quotes the source instead:
    // "... \"b\": [1,2,] ... is not valid JSON". Locate that excerpt to get a line.
    const excerpt = /\.{3}([\s\S]*?)\.{3}/.exec(message);
    let line = 0;
    if (atLine) {
      line = Number(atLine[1]);
    } else if (at) {
      line = lineOf(withoutBom(text), Number(at[1])).line;
    }
    if (!line) line = jsonProblemLine(text);
    if (!line && excerpt && excerpt[1]) {
      const at2 = withoutBom(text).indexOf(excerpt[1]);
      if (at2 >= 0) line = lineOf(withoutBom(text), at2).line;
    }
    return [{ line: line || 1, key: "lintSyntax", args: [message] }];
  }
}

export function formatJson(text) {
  const clean = withoutBom(text);
  const value = JSON.parse(clean);
  return `${JSON.stringify(value, null, 2)}\n`;
}

/* --------------------------------------------------------------- YAML */

function stripComment(line) {
  const hash = line.indexOf("#");
  return hash < 0 ? line : line.slice(0, hash);
}

function indentOf(line) {
  return line.length - line.replace(/^[ \t]*/, "").length;
}

/** Count unescaped `"` and odd `'` occurrences so an unbalanced quote is visible. */
function unbalancedQuote(body) {
  let doubles = 0;
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] === "\\") {
      i += 1;
    } else if (body[i] === '"') {
      doubles += 1;
    }
  }
  const singles = body.replace(/\\'/g, "").match(/'/g);
  return doubles % 2 === 1 || ((singles ? singles.length : 0) % 2 === 1);
}

export function checkYaml(text) {
  const issues = [];
  const lines = withoutBom(text).split("\n");
  const topKeys = new Map();
  let unit = 0;

  lines.forEach((line, index) => {
    const number = index + 1;
    if (!line.trim()) return;
    const body = stripComment(line);
    const trimmed = body.trim();

    if (/^[ \t]*\t/.test(line)) {
      issues.push({ line: number, key: "lintTabIndent" });
      return;
    }
    if (/\s$/.test(line)) issues.push({ line: number, key: "lintTrailingSpace" });
    if (unbalancedQuote(trimmed)) issues.push({ line: number, key: "lintQuote" });

    const indent = indentOf(body);
    if (indent > 0 && !unit && indent % INDENT === 0) unit = INDENT;
    if (indent > 0 && indent % INDENT !== 0) {
      issues.push({ line: number, key: "lintOddIndent", args: [indent] });
    }

    const key = /^([^\s:#-][^:#]*?):(?!\/\/)(?:\s|$)/.exec(trimmed);
    if (key && indent === 0) {
      const name = key[1].trim();
      if (topKeys.has(name)) {
        issues.push({ line: number, key: "lintDuplicateKey", args: [name, topKeys.get(name)] });
      } else {
        topKeys.set(name, number);
      }
    }
    const noColonSpace = /^([A-Za-z0-9_.-]+):([^\s/].*)$/.exec(trimmed);
    if (noColonSpace) issues.push({ line: number, key: "lintNoColonSpace", args: [noColonSpace[1]] });
  });

  if (!text.endsWith("\n")) issues.push({ line: lines.length, key: "lintFinalNewline" });
  return issues;
}

/**
 * Re-indent YAML to a 2-space stair step. Only leading whitespace of structural
 * lines changes; comments, keys, values and block-scalar bodies keep their text.
 */
export function formatYaml(text) {
  const lines = withoutBom(text).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const levels = [0];
  let blockIndent = -1; // >0 while inside `key: |` style content

  for (const line of lines) {
    if (!line.trim()) {
      out.push("");
      continue;
    }
    const indent = indentOf(line);
    const body = line.slice(indent);

    if (blockIndent >= 0) {
      // Still inside a block scalar: keep the original relative offset.
      if (indent > blockIndent || (indent === blockIndent && !blockIndent)) {
        out.push(`${" ".repeat(blockIndent)}${line.slice(blockIndent)}`);
        continue;
      }
      blockIndent = -1;
    }

    while (levels.length > 1 && indent < levels[levels.length - 1]) levels.pop();
    if (indent > levels[levels.length - 1]) levels.push(indent);
    const level = levels.length - 1;

    out.push(`${" ".repeat(level * INDENT)}${body.replace(/\s+$/, "")}`);
    if (BLOCK_SCALAR.test(body)) blockIndent = indent;
  }

  const joined = out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\n+$/, "");
  return `${joined}\n`;
}

/* ------------------------------------------------------------- Python */

export function checkPython(text) {
  const issues = [];
  const lines = withoutBom(text).split("\n");
  let sawTab = false;
  let sawSpace = false;

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const indent = line.slice(0, indentOf(line));
    if (indent.includes("\t")) sawTab = true;
    if (/ /.test(indent)) sawSpace = true;
    if (/\s$/.test(line)) issues.push({ line: index + 1, key: "lintTrailingSpace" });
  });

  if (sawTab && sawSpace) issues.push({ line: 1, key: "lintMixedIndent" });
  if (sawTab && !sawSpace) issues.push({ line: 1, key: "lintTabIndent" });
  if (!text.endsWith("\n")) issues.push({ line: lines.length, key: "lintFinalNewline" });
  return issues;
}

/**
 * Whitespace-only clean-up: tabs become spaces *only* when the file indents with
 * tabs consistently. A tab/space mix keeps its indentation untouched, because
 * re-indenting without a real Python parser could change the block structure.
 */
export function formatPython(text) {
  const source = withoutBom(text).replace(/\r\n/g, "\n");
  const indents = source
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => line.slice(0, indentOf(line)));
  const hasTab = indents.some((indent) => indent.includes("\t"));
  const hasSpace = indents.some((indent) => indent.includes(" "));
  const expandTabs = hasTab && !hasSpace;

  const body = source
    .split("\n")
    .map((line) => {
      const indent = line.slice(0, indentOf(line));
      const rest = line.slice(indent.length).replace(/\s+$/, "");
      const prefix = expandTabs ? indent.replace(/\t/g, " ".repeat(PY_INDENT)) : indent;
      return `${prefix}${rest}`;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n+$/, "");
  return `${body}\n`;
}

/* ------------------------------------------------------------- entry */

/** Issues for this file; empty array when the type has no checks or is clean. */
export function lintText(name, text) {
  const kind = lintKind(name);
  const source = String(text || "");
  if (!source.trim()) return [];
  if (kind === "json") return checkJson(source);
  if (kind === "yaml") return checkYaml(source);
  if (kind === "python") return checkPython(source);
  return [];
}

/**
 * Format result: `{ ok, text?, changed?, issue? }`. On a failed parse of JSON
 * the text is left untouched, so the caller can just report the issue.
 */
export function formatText(name, text) {
  const kind = lintKind(name);
  const source = String(text || "");
  try {
    if (kind === "json") {
      const formatted = formatJson(source);
      return { ok: true, text: formatted, changed: formatted !== withoutBom(source) };
    }
    if (kind === "yaml") {
      const formatted = formatYaml(source);
      return { ok: true, text: formatted, changed: formatted !== withoutBom(source).replace(/\r\n/g, "\n") };
    }
    if (kind === "python") {
      const formatted = formatPython(source);
      return { ok: true, text: formatted, changed: formatted !== withoutBom(source).replace(/\r\n/g, "\n") };
    }
    return { ok: false, unsupported: true };
  } catch (error) {
    return { ok: false, issue: { line: 1, key: "lintSyntax", args: [String((error && error.message) || error)] } };
  }
}
