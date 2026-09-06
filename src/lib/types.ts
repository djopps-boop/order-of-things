// Shared content model, matching the agreed structure:
// native posts come from Sanity; aggregated posts come from Substack RSS feeds
// tagged with the inclusion marker. Both are normalized into this shape and
// merged into a single combined, sorted feed.

export type PostSource = "native" | "aggregated";
export type AccessLevel = "free" | "paid";

export interface Post {
  slug: string;
  title: string;
  authorName: string;
  authorSlug: string;
  date: string; // ISO date string
  excerpt: string; // always shown
  body?: string; // full text, available for native posts and free aggregated posts
  tags: string[]; // LLM-assigned once a tag taxonomy exists; empty for now
  source: PostSource;
  newsletterName?: string; // aggregated posts only, e.g. "Some Newsletter"
  access?: AccessLevel; // aggregated posts only: free posts expand in-feed, paid posts bounce out
  // Shown in the feed card and on the post's own page only when present —
  // not every post has one. Native posts: the Sanity featured image, if the
  // author added one. Aggregated posts: pulled from Substack's og:image, if
  // that post has one. Posts without an image just stay plain text, same as
  // before — this isn't a fixed thumbnail slot on every card.
  thumbnailUrl?: string;
  sourceUrl?: string; // aggregated posts only: the actual external Substack URL
  // Where "read more" sends the reader: for native posts, the post's own
  // page ("/post/slug"). For aggregated posts, an internal preview page
  // ("/read/slug") showing the thumbnail + excerpt before linking out to
  // sourceUrl — deliberately not the raw external URL, so the main feed can
  // stay image-free by default while a post's own page can still show one.
  permalink: string;
  // From the Claude Design homepage pass: some posts render with a larger
  // title (30px vs 23px) for visual rhythm in the feed. Which posts get
  // this is still an open editorial question — mechanism only for now.
  featured?: boolean;
  // Placeholder until Giscus is actually connected (needs the real GitHub
  // repo) — real counts come from GitHub Discussions once that's wired up.
  commentCount?: number;
}
