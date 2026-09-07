// Pure, dependency-free HTML text helpers. No Node-only APIs here (no
// sanitize-html, no filesystem, etc.) — this file is imported by both
// server code (rss.ts, at build time) and client components (FeedCard.tsx),
// so it has to run in the browser bundle too.

const VOID_TAGS = new Set([
  "br",
  "img",
  "hr",
  "input",
  "meta",
  "link",
  "area",
  "base",
  "col",
  "embed",
  "source",
  "track",
  "wbr",
]);

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Native placeholder posts are stored as plain sentences (no HTML), but
// every render path (FeedCard, post page, read page) now expects HTML —
// this wraps them in escaped <p> tags so they display the same way real
// (sanitized) Substack HTML does, without introducing an XSS surface.
export function toParagraphHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .filter((para) => para.trim().length > 0)
    .map((para) => `<p>${escapeHtml(para.trim())}</p>`)
    .join("");
}

export function htmlWordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Cuts sanitized/well-formed HTML off at maxWords, closing any tags left
// open at the cut point so the result is always valid HTML. Assumes the
// input is already well-formed (e.g. run through sanitize-html first) —
// it doesn't try to repair broken markup, just track open/close tags.
export function truncateHtmlByWords(
  html: string,
  maxWords: number
): { html: string; truncated: boolean } {
  if (!html) return { html: "", truncated: false };

  const tokens = html.match(/<[^>]+>|[^<]+/g) || [];
  let wordCount = 0;
  let result = "";
  const stack: string[] = [];
  let truncated = false;

  for (const token of tokens) {
    if (token.startsWith("<")) {
      const isClosing = /^<\//.test(token);
      const tagMatch = token.match(/^<\/?([a-zA-Z0-9]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : "";

      if (isClosing) {
        result += token;
        const idx = stack.lastIndexOf(tagName);
        if (idx !== -1) stack.splice(idx, 1);
      } else {
        const isSelfClosing = /\/>\s*$/.test(token) || VOID_TAGS.has(tagName);
        result += token;
        if (!isSelfClosing && tagName) stack.push(tagName);
      }
      continue;
    }

    if (wordCount >= maxWords) {
      truncated = true;
      break;
    }

    const pieces = token.split(/(\s+)/);
    let piece = "";
    for (const w of pieces) {
      if (w === "" || /^\s+$/.test(w)) {
        piece += w;
        continue;
      }
      if (wordCount >= maxWords) {
        truncated = true;
        break;
      }
      piece += w;
      wordCount++;
    }
    result += piece;
    if (truncated) break;
  }

  if (truncated) {
    result = result.replace(/\s+$/, "") + "…";
    for (let i = stack.length - 1; i >= 0; i--) {
      result += `</${stack[i]}>`;
    }
  }

  return { html: result, truncated };
}
