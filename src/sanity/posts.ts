import { client } from "./client";
import { Post, Turn } from "@/lib/types";
import {
  toParagraphHtml,
  portableTextToHtml,
  PortableTextBlock,
} from "@/lib/htmlText";

interface SanityTurnDoc {
  _id: string;
  authorName?: string;
  authorSlug?: string;
  isGuest?: boolean;
  guestName?: string;
  guestCommentUrl?: string;
  body?: PortableTextBlock[];
  authorReply?: PortableTextBlock[];
  publishedAt: string;
}

interface SanityPostDoc {
  _id: string;
  slug: string | null;
  title: string;
  excerpt?: string; // Portable-Text-backed plain text -- native posts only
  body?: PortableTextBlock[]; // native posts only
  origin?: "native" | "aggregated";
  sourceUrl?: string;
  newsletterName?: string;
  access?: "free" | "paid";
  bodyHtml?: string; // aggregated posts only -- already-sanitized HTML, see adoptedPosts.ts
  excerptHtml?: string; // aggregated posts only
  tags?: string[];
  publishedAt: string;
  authorName?: string;
  authorSlug?: string;
  thumbnailUrl?: string;
  turns?: SanityTurnDoc[];
}

// Turns are ordered oldest-first (matches how they render on the post
// page), and pulled inline with each post rather than queried separately
// per page -- one round trip covers everything loadAllPosts() needs.
const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc) {
  _id,
  "slug": slug.current,
  title,
  excerpt,
  body,
  origin,
  sourceUrl,
  newsletterName,
  access,
  bodyHtml,
  excerptHtml,
  tags,
  publishedAt,
  "authorName": author->name,
  "authorSlug": author->slug.current,
  "thumbnailUrl": featuredImage.asset->url,
  "turns": *[_type == "turn" && references(^._id) && publishedAt <= now()] | order(publishedAt asc) {
    _id,
    body,
    authorReply,
    isGuest,
    guestName,
    guestCommentUrl,
    publishedAt,
    "authorName": author->name,
    "authorSlug": author->slug.current
  }
}`;

// Fetches every post that lives in Sanity -- which, since the lazy-
// adoption feature, now means two genuinely different things under one
// document type: posts a contributor wrote directly in Studio (origin
// "native", the original and still most common case), and aggregated
// (Substack) posts that got a permanent identity here the first time a
// Turn needed to point at one (origin "aggregated" -- see
// adoptedPosts.ts). Both need this same read: turns reference a post
// document regardless of which kind it is, so both need their turns
// resolved and their Sanity _id exposed as Post.sanityId.
//
// Mirrors fetchAggregatedPosts' error handling in rss.ts: a misconfigured
// project, a network blip, or simply zero published posts yet should never
// fail the build -- just contribute zero posts from Sanity for that build.
export async function getPostsFromSanity(): Promise<Post[]> {
  let docs: SanityPostDoc[];
  try {
    docs = await client.fetch<SanityPostDoc[]>(POSTS_QUERY);
  } catch (err) {
    console.warn(
      `[sanity] could not fetch posts: ${
        err instanceof Error ? err.message : err
      }`
    );
    return [];
  }

  return docs
    .filter((doc): doc is SanityPostDoc & { slug: string } => !!doc.slug)
    .map((doc): Post => {
      const turns: Turn[] = (doc.turns ?? []).map((t) => ({
        id: t._id,
        authorName: t.isGuest ? t.guestName ?? "A reader" : t.authorName ?? "Unknown author",
        authorSlug: t.authorSlug ?? "unknown", // meaningful only when !isGuest
        isGuest: !!t.isGuest,
        guestCommentUrl: t.guestCommentUrl,
        body: t.body ? portableTextToHtml(t.body) : "",
        authorReply: t.authorReply ? portableTextToHtml(t.authorReply) : undefined,
        date: t.publishedAt,
      }));

      // A post's own publish date, bumped forward by its most recent
      // turn's date (turns are pre-sorted oldest-first, so the last one is
      // the most recent) -- see Post.lastActivity.
      const lastActivity =
        turns.length > 0 ? turns[turns.length - 1].date : doc.publishedAt;

      const isAggregated = doc.origin === "aggregated";

      return {
        sanityId: doc._id,
        slug: doc.slug,
        title: doc.title,
        authorName: doc.authorName ?? "Unknown author",
        authorSlug: doc.authorSlug ?? "unknown",
        date: doc.publishedAt,
        excerpt: isAggregated ? doc.excerptHtml ?? "" : toParagraphHtml(doc.excerpt ?? ""),
        body: isAggregated
          ? doc.bodyHtml || undefined
          : doc.body
            ? portableTextToHtml(doc.body)
            : undefined,
        tags: doc.tags ?? [],
        source: isAggregated ? "aggregated" : "native",
        newsletterName: isAggregated ? doc.newsletterName : undefined,
        access: isAggregated ? doc.access ?? "free" : undefined,
        sourceUrl: isAggregated ? doc.sourceUrl : undefined,
        thumbnailUrl: doc.thumbnailUrl,
        permalink: isAggregated ? `/read/${doc.slug}` : `/post/${doc.slug}`,
        turns: turns.length > 0 ? turns : undefined,
        lastActivity,
      };
    });
}
