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
  body?: PortableTextBlock[];
  publishedAt: string;
}

interface SanityPostDoc {
  slug: string | null;
  title: string;
  excerpt?: string;
  body?: PortableTextBlock[];
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
  "slug": slug.current,
  title,
  excerpt,
  body,
  tags,
  publishedAt,
  "authorName": author->name,
  "authorSlug": author->slug.current,
  "thumbnailUrl": featuredImage.asset->url,
  "turns": *[_type == "turn" && references(^._id) && publishedAt <= now()] | order(publishedAt asc) {
    _id,
    body,
    publishedAt,
    "authorName": author->name,
    "authorSlug": author->slug.current
  }
}`;

// Fetches native posts authored directly in Sanity Studio (/studio) -- the
// counterpart to the [[OOT]]-marker RSS pipeline in rss.ts, not a
// replacement for it. Mirrors fetchAggregatedPosts' error handling there: a
// misconfigured project, a network blip, or (very likely right after
// launch, or before CORS/env vars are set) simply zero published posts yet
// should never fail the build -- just contribute zero native posts, same as
// an unreachable newsletter contributes zero aggregated ones.
export async function getNativePostsFromSanity(): Promise<Post[]> {
  let docs: SanityPostDoc[];
  try {
    docs = await client.fetch<SanityPostDoc[]>(POSTS_QUERY);
  } catch (err) {
    console.warn(
      `[sanity] could not fetch native posts: ${
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
        authorName: t.authorName ?? "Unknown author",
        authorSlug: t.authorSlug ?? "unknown",
        body: t.body ? portableTextToHtml(t.body) : "",
        date: t.publishedAt,
      }));

      // A post's own publish date, bumped forward by its most recent
      // turn's date (turns are pre-sorted oldest-first, so the last one is
      // the most recent) -- see Post.lastActivity.
      const lastActivity =
        turns.length > 0 ? turns[turns.length - 1].date : doc.publishedAt;

      return {
        slug: doc.slug,
        title: doc.title,
        authorName: doc.authorName ?? "Unknown author",
        authorSlug: doc.authorSlug ?? "unknown",
        date: doc.publishedAt,
        excerpt: toParagraphHtml(doc.excerpt ?? ""),
        body: doc.body ? portableTextToHtml(doc.body) : undefined,
        tags: doc.tags ?? [],
        source: "native",
        thumbnailUrl: doc.thumbnailUrl,
        permalink: `/post/${doc.slug}`,
        turns: turns.length > 0 ? turns : undefined,
        lastActivity,
      };
    });
}
