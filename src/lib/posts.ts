import { Post, Turn } from "./types";
import { newsletterSources } from "./sources";
import { fetchAllAggregatedPosts } from "./rss";
import { toParagraphHtml } from "./htmlText";
import { getPostsFromSanity } from "@/sanity/posts";
import { syncOrAdoptAggregatedPost } from "@/sanity/adoptedPosts";

// Native posts now come from Sanity Studio (/studio) via
// getNativePostsFromSanity() -- see src/sanity/posts.ts. This single post is
// kept only as a build-safety fallback, the same role
// FALLBACK_AGGREGATED_POST plays below: right after the Sanity project was
// created there are zero published posts yet, and /post/[slug] (see
// generateStaticParams there) still needs at least one native post so the
// native-post template and styling stay visible/buildable. The moment a
// real post is published in Studio, this stops appearing automatically.
const FALLBACK_NATIVE_POST: Post = {
  slug: "reading-history-sideways",
  title: "Reading history sideways",
  authorName: "Author Name",
  authorSlug: "author-name",
  date: "2026-09-01",
  excerpt: toParagraphHtml(
    "There is a peculiar comfort in reading history sideways — not for the verdict it renders on the present, but for the sense that the present, too, will eventually be read this way: strange, contingent, already receding."
  ),
  body: toParagraphHtml(
    "There is a peculiar comfort in reading history sideways — not for the verdict it renders on the present, but for the sense that the present, too, will eventually be read this way: strange, contingent, already receding. The instinct to treat our own moment as uniquely urgent is not wrong exactly, but it obscures how ordinary the feeling is. Every generation has believed itself to be living through the hinge point, and most of them were, in some modest sense, correct — history has no shortage of hinges.\n\nWhat's harder to hold onto is the humility that comes from knowing you can't yet tell which kind of hinge this one is. That uncertainty isn't a failure of analysis. It's the actual condition of being inside events rather than looking back at them, and pretending otherwise is its own kind of vanity."
  ),
  tags: ["culture", "history"],
  source: "native",
  thumbnailUrl: "https://placehold.co/600x400?text=Featured+image",
  permalink: "/post/reading-history-sideways",
  featured: true,
  commentCount: 4,
};

// A static export ("output: export") requires every dynamic route to
// prerender at least one path — /read/[slug] would have zero if literally
// no contributor has used the [[OOT]] or #oot marker yet (a very real state right
// after launch), which fails the build outright. This single seed post
// keeps that route buildable until real aggregated posts start flowing in;
// it disappears automatically the moment fetchAllAggregatedPosts() returns
// anything real.
const FALLBACK_AGGREGATED_POST: Post = {
  slug: "example-newsletter-post",
  title: "Aggregated posts will appear here",
  authorName: "The Order of Things",
  authorSlug: "author-name",
  date: "2026-01-01",
  excerpt: toParagraphHtml(
    "Once a contributor adds [[OOT]] or #oot to a Substack post's subtitle, it'll show up in this feed automatically — this placeholder just keeps the site buildable until then."
  ),
  tags: [],
  source: "aggregated",
  newsletterName: "Example Newsletter",
  access: "free",
  sourceUrl: "https://example.substack.com",
  permalink: "/read/example-newsletter-post",
};

// Aggregated posts now come from a real RSS fetch + marker-filter pass over
// each confirmed newsletter (src/lib/rss.ts), run once per build and reused
// by every page that needs the combined feed. If a newsletter is
// unreachable or nobody has used either marker yet, it just
// contributes zero posts -- see rss.ts for the per-source error handling.
//
// Since lazy adoption (see adoptedPosts.ts), some aggregated posts also
// have a permanent Sanity identity -- getPostsFromSanity() returns those
// alongside native posts, distinguished by Post.source. This function is
// where the two get reconciled every build: an already-adopted post whose
// source is still live gets resynced (regardless of whether any turn
// activity touches it this build); a [[TURN:slug]] pointing at a
// not-yet-adopted post gets it adopted right now if that post is still
// live in this build's RSS fetch; and every resolved attachment becomes a
// real (if still build-computed, not Sanity-stored) Turn merged onto its
// target. An attachment that resolves to nothing -- the target doesn't
// exist as a native post, an adopted post, or a live RSS item -- gets
// dropped with a console warning rather than failing the build.
let cachedAllPosts: Promise<Post[]> | null = null;

function loadAllPosts(): Promise<Post[]> {
  if (!cachedAllPosts) {
    cachedAllPosts = (async () => {
      const [sanityPosts, aggregatedFetch] = await Promise.all([
        getPostsFromSanity(),
        fetchAllAggregatedPosts(newsletterSources),
      ]);

      const nativePosts = sanityPosts.filter((p) => p.source === "native");
      const adoptedPosts = sanityPosts.filter((p) => p.source === "aggregated");

      // Every RSS item still being scanned this build -- OOT-tagged,
      // turn-tagged, or both -- keyed by its stable Substack URL and by
      // slug. An item present under both markers is the same computed
      // Post either way, so whichever sets the map entry last is fine.
      const liveBySourceUrl = new Map<string, Post>();
      for (const p of aggregatedFetch.posts) {
        if (p.sourceUrl) liveBySourceUrl.set(p.sourceUrl, p);
      }
      for (const a of aggregatedFetch.turnAttachments) {
        if (a.sourcePost.sourceUrl) liveBySourceUrl.set(a.sourcePost.sourceUrl, a.sourcePost);
      }
      const liveBySlug = new Map<string, Post>();
      for (const p of liveBySourceUrl.values()) liveBySlug.set(p.slug, p);

      // Resync every already-adopted post that's still live -- every
      // build, independent of any turn activity, so an edit on Substack
      // shows up here without needing a fresh turn to trigger it. Falls
      // back to the frozen persisted copy if the write client isn't
      // configured yet, the sync fails, or the source is no longer live.
      const resolvedAdopted: Post[] = [];
      for (const adopted of adoptedPosts) {
        const fresh = adopted.sourceUrl ? liveBySourceUrl.get(adopted.sourceUrl) : undefined;
        const synced = fresh ? await syncOrAdoptAggregatedPost(fresh) : null;
        resolvedAdopted.push(
          synced
            ? { ...synced, turns: adopted.turns, lastActivity: adopted.lastActivity }
            : adopted
        );
      }

      // Resolve every [[TURN:slug]] attachment against: a native post, an
      // already-(re)synced adopted post, or -- first-time adoption -- a
      // post that's still live in this build's RSS fetch but has no
      // Sanity identity yet.
      const nativeBySlug = new Map(nativePosts.map((p) => [p.slug, p]));
      const adoptedBySlug = new Map(resolvedAdopted.map((p) => [p.slug, p]));
      const newlyAdopted: Post[] = [];
      const virtualTurnsBySanityId = new Map<string, Turn[]>();

      for (const attachment of aggregatedFetch.turnAttachments) {
        let target =
          nativeBySlug.get(attachment.targetSlug) ?? adoptedBySlug.get(attachment.targetSlug);

        if (!target) {
          const candidate = liveBySlug.get(attachment.targetSlug);
          if (candidate) {
            const created = await syncOrAdoptAggregatedPost(candidate);
            if (created) {
              target = created;
              newlyAdopted.push(created);
              adoptedBySlug.set(created.slug, created);
            }
          }
        }

        if (!target?.sanityId) {
          console.warn(
            `[rss-turns] could not attach "${attachment.sourcePost.title}" as a turn -- no resolvable post for slug "${attachment.targetSlug}"`
          );
          continue;
        }

        const list = virtualTurnsBySanityId.get(target.sanityId) ?? [];
        list.push({
          id: `rss-${attachment.sourcePost.slug}`,
          authorName: attachment.sourcePost.authorName,
          authorSlug: attachment.sourcePost.authorSlug,
          body: attachment.sourcePost.body || attachment.sourcePost.excerpt,
          date: attachment.sourcePost.date,
        });
        virtualTurnsBySanityId.set(target.sanityId, list);
      }

      function withVirtualTurns(post: Post): Post {
        const extra = post.sanityId ? virtualTurnsBySanityId.get(post.sanityId) : undefined;
        if (!extra?.length) return post;
        const merged = [...(post.turns ?? []), ...extra].sort((a, b) =>
          a.date < b.date ? -1 : 1
        );
        return {
          ...post,
          turns: merged,
          lastActivity: merged[merged.length - 1]?.date ?? post.lastActivity,
        };
      }

      const finalNative = nativePosts.map(withVirtualTurns);
      const finalAdopted = [...resolvedAdopted, ...newlyAdopted].map(withVirtualTurns);

      // A regular feed candidate that's now backed by an adopted Sanity
      // doc is represented by that doc instead -- otherwise it'd show up
      // twice (once ephemeral, once persisted) for the same content.
      const adoptedSourceUrls = new Set(
        finalAdopted.map((p) => p.sourceUrl).filter((u): u is string => !!u)
      );
      const remainingEphemeral = aggregatedFetch.posts.filter(
        (p) => !p.sourceUrl || !adoptedSourceUrls.has(p.sourceUrl)
      );

      const resolvedNative = finalNative.length > 0 ? finalNative : [FALLBACK_NATIVE_POST];
      const combinedAggregated = [...finalAdopted, ...remainingEphemeral];
      const resolvedAggregated =
        combinedAggregated.length > 0 ? combinedAggregated : [FALLBACK_AGGREGATED_POST];

      // Sort by lastActivity (a post's own date, bumped forward by its
      // most recent turn -- see Post.lastActivity) rather than plain
      // publish date, so a post that gets a new turn rises back toward
      // the top of the feed. Aggregated/fallback posts with no turns just
      // sort by their own date, same as before.
      return [...resolvedNative, ...resolvedAggregated].sort(
        (a, b) =>
          new Date(b.lastActivity ?? b.date).getTime() -
          new Date(a.lastActivity ?? a.date).getTime()
      );
    })();
  }
  return cachedAllPosts;
}

// Unified "source" attribution for the feed card meta row (author · source · date).
// Native posts attribute to the site itself; aggregated posts attribute to the
// originating newsletter, since that's where the post actually lives.
export function getSourceLabel(post: Post): string {
  if (post.source === "native") return "The Order of Things";
  return post.newsletterName ?? "Substack";
}

export async function getAllPosts(): Promise<Post[]> {
  return loadAllPosts();
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await loadAllPosts();
  return posts.find((p) => p.slug === slug && p.source === "native");
}

export async function getAggregatedPostBySlug(
  slug: string
): Promise<Post | undefined> {
  const posts = await loadAllPosts();
  return posts.find((p) => p.slug === slug && p.source === "aggregated");
}

export async function getPostsByAuthor(authorSlug: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.authorSlug === authorSlug);
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.tags.includes(tag));
}

export async function getRecentPosts(limit = 5): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.slice(0, limit);
}

// Pure, synchronous filter — shared by the async server-side searchPosts()
// below and by SearchClient.tsx, which does the same filtering client-side
// over a pre-fetched post list (search runs in the browser under static
// export, since there's no server per request to read the query string).
export function filterPostsByQuery(posts: Post[], query: string): Post[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const stripTags = (html: string) => html.replace(/<[^>]+>/g, " ");
  return posts.filter((p) => {
    const haystack = [
      p.title,
      stripTags(p.excerpt),
      stripTags(p.body ?? ""),
      p.authorName,
      ...p.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export async function searchPosts(query: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return filterPostsByQuery(posts, query);
}

// --- tag cloud ---

export async function getTagCounts(): Promise<{ tag: string; count: number }[]> {
  const posts = await loadAllPosts();
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([tag, count]) => ({ tag, count }));
}

// --- date archive (year > month, like a classic blog's sidebar archive) ---

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface ArchiveMonth {
  year: number;
  month: number; // 1-12
  label: string;
  count: number;
}

export interface ArchiveYear {
  year: number;
  count: number;
  months: ArchiveMonth[];
}

export async function getArchiveIndex(): Promise<ArchiveYear[]> {
  const posts = await getAllPosts();
  const byYear = new Map<number, Map<number, number>>();

  for (const post of posts) {
    // Post dates are stored as plain "YYYY-MM-DD" strings, which Date
    // parses as UTC midnight. Using local getters (getFullYear/getMonth)
    // instead of UTC ones shifts the date backward whenever the build
    // machine's timezone is behind UTC — read the UTC fields instead so a
    // Sep 1 post doesn't end up filed under August.
    const d = new Date(post.date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    if (!byYear.has(year)) byYear.set(year, new Map());
    const byMonth = byYear.get(year)!;
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }

  return Array.from(byYear.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, byMonth]) => {
      const months = Array.from(byMonth.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, count]) => ({
          year,
          month,
          label: MONTH_NAMES[month - 1],
          count,
        }));
      const count = months.reduce((sum, m) => sum + m.count, 0);
      return { year, count, months };
    });
}

export async function getPostsByMonth(
  year: number,
  month: number
): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => {
    const d = new Date(p.date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  });
}
