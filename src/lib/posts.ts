import { Post } from "./types";
import { newsletterSources } from "./sources";
import { fetchAllAggregatedPosts } from "./rss";

// Native posts (written directly for the site) are still placeholder data —
// that's Sanity's job (Step 2 of the build plan), not yet connected. Once
// NEXT_PUBLIC_SANITY_PROJECT_ID is set, this should become a Sanity query.
const nativePosts: Post[] = [
  {
    slug: "reading-history-sideways",
    title: "Reading history sideways",
    authorName: "Author Name",
    authorSlug: "author-name",
    date: "2026-09-01",
    excerpt:
      "There is a peculiar comfort in reading history sideways — not for the verdict it renders on the present, but for the sense that the present, too, will eventually be read this way: strange, contingent, already receding.",
    body:
      "There is a peculiar comfort in reading history sideways — not for the verdict it renders on the present, but for the sense that the present, too, will eventually be read this way: strange, contingent, already receding. The instinct to treat our own moment as uniquely urgent is not wrong exactly, but it obscures how ordinary the feeling is. Every generation has believed itself to be living through the hinge point, and most of them were, in some modest sense, correct — history has no shortage of hinges. What's harder to hold onto is the humility that comes from knowing you can't yet tell which kind of hinge this one is. That uncertainty isn't a failure of analysis. It's the actual condition of being inside events rather than looking back at them, and pretending otherwise is its own kind of vanity.",
    tags: ["culture", "history"],
    source: "native",
    thumbnailUrl: "https://placehold.co/600x400?text=Featured+image",
    permalink: "/post/reading-history-sideways",
    featured: true,
    commentCount: 4,
  },
];

// A static export ("output: export") requires every dynamic route to
// prerender at least one path — /read/[slug] would have zero if literally
// no contributor has used the [[OOT]] marker yet (a very real state right
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
  excerpt:
    "Once a contributor adds the [[OOT]] marker to a Substack post's subtitle, it'll show up in this feed automatically — this placeholder just keeps the site buildable until then.",
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
// unreachable or nobody has used the [[OOT]] marker yet, it just
// contributes zero posts — see rss.ts for the per-source error handling.
let cachedAllPosts: Promise<Post[]> | null = null;

function loadAllPosts(): Promise<Post[]> {
  if (!cachedAllPosts) {
    cachedAllPosts = fetchAllAggregatedPosts(newsletterSources).then(
      (aggregated) => {
        const resolvedAggregated =
          aggregated.length > 0 ? aggregated : [FALLBACK_AGGREGATED_POST];
        const all = [...nativePosts, ...resolvedAggregated];
        return all.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }
    );
  }
  return cachedAllPosts;
}

// Unified "source" attribution for the feed card meta row (author · source · date).
// Native posts attribute to the site itself; aggregated posts attribute to the
// originating newsletter, since that's where the post actually lives.
export function getSourceLabel(post: Post): string {
  if (post.source === "native") return "The Order of Things";
  return `${post.newsletterName ?? "Substack"} (Substack)`;
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
  return posts.filter((p) => {
    const haystack = [p.title, p.excerpt, p.body ?? "", p.authorName, ...p.tags]
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
