import { XMLParser } from "fast-xml-parser";
import { Post } from "./types";
import { NewsletterSource } from "./sources";
import { truncateWords } from "./config";

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
// short relative to the teaser. Worth revisiting once we can see real feed
// output from each of the 18 newsletters — this sandbox can't reach
// substack.com directly, so this hasn't been tested against live data yet.
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

function stripPaywallBoilerplate(text: string): string {
  let result = text;
  for (const phrase of PAYWALL_PHRASES) {
    const idx = result.toLowerCase().indexOf(phrase);
    if (idx !== -1) {
      result = result.slice(0, idx).trim();
    }
  }
  return result;
}

// --- HTML -> plain text ----------------------------------------------------
// FeedCard/read-page rendering expects plain prose (see truncateWords), not
// HTML, so content:encoded gets flattened here. This loses inline
// links/formatting from the original post — an acceptable simplification
// for now, matching how native placeholder posts are stored.
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

function firstImageSrc(html: string): string | undefined {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
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

    const bodyPlain = rawContent ? htmlToPlainText(rawContent) : "";
    const isPaid = detectPaywall(bodyPlain, !!rawContent);

    const teaser = stripMarker(rawDescription);
    const excerptSource = teaser || bodyPlain;
    const excerpt = truncateWords(excerptSource, 150).text;

    const enclosures = asArray(item.enclosure);
    const enclosureUrl = enclosures
      .map((e) => e?.["@_url"])
      .find((u): u is string => !!u);
    const thumbnailUrl =
      enclosureUrl || (rawContent ? firstImageSrc(rawContent) : undefined);

    const tags = asArray(item.category)
      .map((c) => slugifyTag(textOf(c)))
      .filter(Boolean);

    posts.push({
      slug,
      title,
      authorName,
      authorSlug: source.authorSlug,
      date,
      excerpt,
      body: isPaid ? undefined : stripPaywallBoilerplate(bodyPlain) || undefined,
      tags,
      source: "aggregated",
      newsletterName: source.newsletterName,
      access: isPaid ? "paid" : "free",
      thumbnailUrl,
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
