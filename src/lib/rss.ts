import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";
import { Post } from "./types";
import { NewsletterSource } from "./sources";
import { escapeHtml, truncateHtmlByWords } from "./htmlText";
import { EXCERPT_WORD_CAP } from "./config";
import { TAG_OVERRIDES } from "./tagOverrides";

// --- the inclusion marker ------------------------------------------------
// Contributors flag a Substack post for inclusion in the group blog by
// putting this exact string in the post's subtitle field (Substack includes
// the subtitle in the RSS <description>). We check title + description +
// body, per the original build plan, then strip the marker out of whatever
// we display. Case-insensitive, tolerant of surrounding whitespace.
const INCLUSION_MARKER = "[[OOT]]";
const MARKER_RE = new RegExp(
  INCLUSION_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  "i"
);

function hasMarker(...fields: (string | undefined)[]): boolean {
  return fields.some((f) => f && MARKER_RE.test(f));
}

function stripMarker(text: string): string {
  return text.replace(new RegExp(MARKER_RE.source, "gi"), "").trim();
}

// --- bootstrap mode ---------------------------------------------------------
// Most contributors haven't started adding [[OOT]] to their subtitles yet, so
// a strict marker-only feed would launch nearly empty. While that's true, we
// backfill each newsletter with its most recent posts (marker or not) so the
// site launches with real content. Once a given contributor adds the marker
// to a post, that contributor's feed switches over to marker-only automatically
// (see the per-source logic below) — no code change needed as adoption grows.
//
// To turn this off everywhere at once (once you're happy with marker-only
// coverage sitewide), flip BOOTSTRAP_MODE to false.
const BOOTSTRAP_MODE = true;
const BOOTSTRAP_POSTS_PER_SOURCE = 2;

// --- paywall detection ----------------------------------------------------
// Substack's RSS feed doesn't expose a clean "this post is paid" flag, so
// this is a heuristic built from two signals: known boilerplate phrases
// Substack inserts at the paywall, and content:encoded being suspiciously
// short relative to the teaser.
const PAYWALL_PHRASES = [
  "this post is for paid subscribers",
  "this post is for paying subscribers",
  "this post is for subscribers only",
  "subscribe now to read",
  "keep reading with a 7-day free trial",
  "keep reading with a free trial",
];

function detectPaywall(contentText: string, hasContent: boolean): boolean {
  if (!hasContent) return true; // no content:encoded at all -> assume paid
  const lower = contentText.toLowerCase();
  if (PAYWALL_PHRASES.some((p) => lower.includes(p))) return true;
  // Very short body next to a real teaser is the other common paid-post shape.
  if (contentText.trim().split(/\s+/).length < 40) return true;
  return false;
}

// Finds where a paywall phrase starts (in the plain-text rendering of the
// post) and cuts the *HTML* body off at the equivalent word count, so the
// reader never sees Substack's "this post is for paid subscribers"
// boilerplate — while keeping the formatting of everything before it.
function stripPaywallBoilerplateHtml(html: string, plainText: string): string {
  const lower = plainText.toLowerCase();
  let cutIndex: number | null = null;
  for (const phrase of PAYWALL_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1 && (cutIndex === null || idx < cutIndex)) cutIndex = idx;
  }
  if (cutIndex === null) return html;
  const wordsBeforeCut = plainText
    .slice(0, cutIndex)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return truncateHtmlByWords(html, wordsBeforeCut).html;
}

// --- HTML sanitization -------------------------------------------------------
// Substack's content:encoded is real HTML (paragraphs, bold/italic, links,
// lists, inline images). We keep a sanitized subset of it — rather than
// flattening everything to plain text — so posts read the same way they do
// on Substack: same paragraph breaks, emphasis, and links.
// Images caused enough visual problems in practice (broken proportions,
// stray Substack promo/tracking images mixed into the body, etc.) that
// we've dropped image support entirely for now -- aggregated posts are
// text-only. If this changes, re-add "img", "figure", "figcaption" here
// and to allowedAttributes below.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "code",
  "pre",
];

// Tags whose content should be dropped entirely, not just unwrapped.
// sanitize-html's default behavior for a disallowed tag is to remove the
// tag but keep its inner text -- fine for e.g. a stray <span>, wrong for
// these, which only ever wrap boilerplate we don't want showing up as
// prose. Passing them in `allowedTags` (see sanitizeContentHtml below) is
// what makes sanitize-html hand them to exclusiveFilter instead of
// silently unwrapping them.
const DROP_ENTIRELY_TAGS = ["figcaption"];

// exclusiveFilter callback for sanitizeContentHtml: return true to drop an
// element (and everything inside it) outright.
// Normalizes trailing arrows/ellipses/dashes off link text so "Read more",
// "Read More →", "Read more..." etc. all compare equal.
function normalizeLinkText(text: string): string {
  return text
    .trim()
    .replace(/[\s→–—\->.…]+$/g, "")
    .trim()
    .toLowerCase();
}

function shouldExcludeFrame(frame: {
  tag: string;
  attribs: Record<string, string>;
  text?: string;
}): boolean {
  const { tag, attribs, text } = frame;

  // Photo captions from Substack's image embeds, e.g.
  //   <figcaption class="image-caption">...Photo by X/Getty Images</figcaption>
  // We already strip <img> itself; without this, the caption sentence
  // would leak into the post body looking like ordinary prose (this is
  // exactly the bug reported: a photo credit line showing up as body text).
  if (tag === "figcaption") return true;

  // Substack's "Subscribe now" / "Share" call-to-action buttons, e.g.
  //   <p class="button-wrapper" data-component-name="ButtonCreateButton">
  //     <a class="button primary" href="...">Subscribe now</a>
  //   </p>
  // Note: `class` only survives on frame.attribs here because `p` has no
  // explicit entry in allowedAttributes below -- for a tag like `a` that
  // does have one, its attributes are already filtered down to the
  // allowlist by the time exclusiveFilter runs, so `class` wouldn't be
  // visible there. Matching on the wrapping <p> instead removes the whole
  // subtree, <a> included.
  const cls = typeof attribs?.class === "string" ? attribs.class : "";
  if (tag === "p" && /\bbutton-wrapper\b/.test(cls)) return true;

  // Some authors manually truncate their own post with a "Read more" (or
  // "Read More →") link partway through, pointing back at the same
  // Substack post -- distinct from the button-wrapper CTA above (this is
  // a plain inline <a>, not a styled button). We already show our own
  // "Continue reading on Substack" link at the end of every aggregated
  // post, so a second, differently-worded jump link partway through the
  // body is redundant and confusing (reported: two competing links,
  // wanted only ours). Matched on link text only, not href, so it doesn't
  // touch ordinary inline links that happen to mention "read more" as
  // part of a longer sentence.
  if (tag === "a" && normalizeLinkText(text || "") === "read more") return true;

  return false;
}

function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...ALLOWED_TAGS, ...DROP_ENTIRELY_TAGS],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        { target: "_blank", rel: "noopener noreferrer" },
        true
      ),
    },
    exclusiveFilter: shouldExcludeFrame,
  }).trim();
}

// Stripping the [[OOT]] marker sometimes leaves behind an empty paragraph
// or list item (e.g. a post where the marker sat on its own line) -- clean
// those up so they don't render as stray blank gaps. Also cleans up empty
// <a> tags: Substack wraps its image embeds in a decorative <a> (restack/
// view-image chrome) that has no text of its own once the <img> inside it
// is stripped, so it would otherwise survive as an invisible, pointless
// empty link.
function removeEmptyBlocks(html: string): string {
  return html
    .replace(/<(p|li)>(?:\s|&nbsp;)*<\/\1>/gi, "")
    .replace(/<a(?:\s[^>]*)?>(?:\s|&nbsp;)*<\/a>/gi, "");
}

// --- HTML -> plain text ----------------------------------------------------
// Still needed for paywall detection (word count, phrase matching) even
// though display now uses the sanitized HTML above.
function htmlToPlainText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugFromLink(link: string): string {
  const match = link.match(/\/p\/([^/?#]+)/);
  if (match) return match[1];
  // Fallback: derive something stable-ish from the URL itself.
  return link
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toIsoDate(pubDate: string | undefined): string {
  if (!pubDate) return new Date().toISOString().slice(0, 10);
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// --- RSS parsing ------------------------------------------------------------

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#text",
});

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  "content:encoded"?: string;
  "dc:creator"?: string;
  category?: string | string[];
  enclosure?: { "@_url"?: string } | Array<{ "@_url"?: string }>;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

// fast-xml-parser represents CDATA-wrapped fields (which is how Substack
// writes title/description/content:encoded) as an ARRAY containing a single
// `{ "#text": "..." }` object, not the object directly — e.g.
// `<title><![CDATA[Hello]]></title>` parses to `[{ "#text": "Hello" }]`.
// A naive "#text" in value check misses the array wrapper and falls through
// to String(value), which stringifies the object as the literal text
// "[object Object]". This walks arrays/objects recursively so every shape
// fast-xml-parser can produce resolves to plain text instead.
function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(textOf).join("");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("#text" in obj) return textOf(obj["#text"]);
    // Unknown object shape: concatenate any nested text, skipping XML
    // attributes (prefixed "@_") rather than risk "[object Object]" again.
    return Object.entries(obj)
      .filter(([key]) => !key.startsWith("@_"))
      .map(([, v]) => textOf(v))
      .join("");
  }
  return "";
}

const FETCH_TIMEOUT_MS = 10_000;

async function fetchFeedXml(feedUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OrderOfThingsAggregator/1.0; +https://order-of-things.pages.dev)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) {
      throw new Error(`${feedUrl} responded ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

// Fetches, filters (marker), and normalizes a single newsletter's feed into
// our shared Post shape. Never throws — a source that's down or unreachable
// just contributes zero posts, logged as a warning, so one bad feed doesn't
// take down the whole build.
export async function fetchAggregatedPosts(
  source: NewsletterSource
): Promise<Post[]> {
  const feedUrl = `${source.url.replace(/\/$/, "")}/feed`;

  let xml: string;
  try {
    xml = await fetchFeedXml(feedUrl);
  } catch (err) {
    console.warn(
      `[rss] could not fetch ${source.newsletterName} (${feedUrl}): ${
        err instanceof Error ? err.message : err
      }`
    );
    return [];
  }

  let parsed: { rss?: { channel?: { item?: RssItem | RssItem[] } } };
  try {
    parsed = parser.parse(xml);
  } catch (err) {
    console.warn(
      `[rss] could not parse feed for ${source.newsletterName}: ${
        err instanceof Error ? err.message : err
      }`
    );
    return [];
  }

  const items = asArray(parsed?.rss?.channel?.item);
  const posts: Post[] = [];

  // Split into marker-tagged items and everything else, preserving the feed's
  // own order (Substack feeds are newest-first).
  const validItems = items.filter((item) => {
    const rawTitle = textOf(item.title);
    const link = textOf(item.link);
    return !!rawTitle && !!link;
  });
  const taggedItems = validItems.filter((item) =>
    hasMarker(
      textOf(item.title),
      textOf(item.description),
      textOf(item["content:encoded"])
    )
  );

  let selectedItems: RssItem[];
  if (taggedItems.length > 0) {
    // This contributor has started tagging posts — go marker-only for them,
    // even in bootstrap mode.
    selectedItems = taggedItems;
  } else if (BOOTSTRAP_MODE) {
    // No tagged posts yet from this contributor: backfill with their most
    // recent posts so the site isn't empty while adoption catches up.
    selectedItems = validItems.slice(0, BOOTSTRAP_POSTS_PER_SOURCE);
  } else {
    selectedItems = [];
  }

  for (const item of selectedItems) {
    const rawTitle = textOf(item.title);
    const rawDescription = textOf(item.description);
    const rawContent = textOf(item["content:encoded"]);
    const link = textOf(item.link);

    const title = stripMarker(rawTitle);
    const slug = slugFromLink(link);
    const date = toIsoDate(textOf(item.pubDate));
    const authorName = textOf(item["dc:creator"]) || source.authorName;

    // Plain text is still used for paywall detection and for finding
    // exactly where the paywall boilerplate starts.
    const bodyPlain = rawContent ? htmlToPlainText(rawContent) : "";
    const isPaid = detectPaywall(bodyPlain, !!rawContent);

    // Sanitized HTML is what actually gets displayed, so formatting from
    // the original post (paragraphs, bold/italic, links, lists) survives.
    // The [[OOT]] marker can appear anywhere a contributor puts it --
    // title, subtitle, or the post body itself -- so it needs stripping
    // from the raw content too, not just title/description, before it gets
    // sanitized and shown.
    const sanitizedHtml = rawContent
      ? removeEmptyBlocks(sanitizeContentHtml(stripMarker(rawContent)))
      : "";
    const cleanedHtml = sanitizedHtml
      ? stripPaywallBoilerplateHtml(sanitizedHtml, bodyPlain)
      : "";

    // Fallback for the rare case a feed has no content:encoded at all —
    // the subtitle/description is plain text, not HTML, so it just gets
    // escaped and wrapped rather than run through the HTML sanitizer.
    const teaserHtml = rawDescription
      ? `<p>${escapeHtml(stripMarker(rawDescription))}</p>`
      : "";

    const excerptSource = cleanedHtml || teaserHtml;
    const excerpt = truncateHtmlByWords(excerptSource, EXCERPT_WORD_CAP).html;

    // Substack's own <category> field (almost always empty in practice)
    // merged with any hand-picked tags for this post -- see tagOverrides.ts
    // for why the override list exists and what it does and doesn't cover.
    const rssTags = asArray(item.category)
      .map((c) => slugifyTag(textOf(c)))
      .filter(Boolean);
    const tags = Array.from(
      new Set([...rssTags, ...(TAG_OVERRIDES[slug] ?? [])])
    );

    posts.push({
      slug,
      title,
      authorName,
      authorSlug: source.authorSlug,
      date,
      excerpt,
      body: isPaid ? undefined : cleanedHtml || undefined,
      tags,
      source: "aggregated",
      newsletterName: source.newsletterName,
      access: isPaid ? "paid" : "free",
      sourceUrl: link,
      permalink: `/read/${slug}`,
    });
  }

  return posts;
}

// Fetches every confirmed newsletter source in parallel. Individual source
// failures are swallowed (see above) so a single down feed never fails the
// whole build.
export async function fetchAllAggregatedPosts(
  sources: NewsletterSource[]
): Promise<Post[]> {
  const results = await Promise.all(sources.map(fetchAggregatedPosts));
  return results.flat();
}
