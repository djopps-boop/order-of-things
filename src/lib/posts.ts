import { Post } from "./types";

// PLACEHOLDER DATA LAYER.
// This will eventually be replaced by:
//   1. A Sanity query for native posts (Step 2 of the build plan)
//   2. A server-side RSS fetch + marker-filter + paywall-detection pass over
//      each Substack feed (Step 3), normalized into the Post shape below
//   3. A merge of both lists, sorted by date
// For now this returns static sample posts so the page shells can be built
// and handed off for visual design before the real data layer exists.

const samplePosts: Post[] = [
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
  },
  {
    slug: "aggregated-free-example",
    title: "An example free newsletter post",
    authorName: "Newsletter Writer",
    authorSlug: "newsletter-writer",
    date: "2026-08-28",
    excerpt:
      "A short summary of a free Substack post, pulled in because it carried the inclusion marker in its subtitle.",
    body:
      "The full text of a free Substack post comes through the RSS feed untruncated, so it can be expanded in-feed the same way a native post can, up to the site's word cap, before sending the reader on to the original for the rest.",
    tags: ["culture", "media"],
    source: "aggregated",
    newsletterName: "Example Newsletter",
    access: "free",
    thumbnailUrl: "https://placehold.co/600x400?text=Substack+thumbnail",
    sourceUrl: "https://example.substack.com/p/aggregated-free-example",
    permalink: "/read/aggregated-free-example",
  },
  {
    slug: "aggregated-paid-example",
    title: "An example paid-tier newsletter post",
    authorName: "Newsletter Writer",
    authorSlug: "newsletter-writer",
    date: "2026-08-20",
    excerpt:
      "Substack truncates paid posts in RSS regardless of feed settings, so only this short preview is available before the subscribe wall.",
    tags: ["politics"],
    source: "aggregated",
    newsletterName: "Example Newsletter",
    access: "paid",
    // no thumbnailUrl — demonstrates the "if there is one" fallback
    sourceUrl: "https://example.substack.com/p/aggregated-paid-example",
    permalink: "/read/aggregated-paid-example",
  },
];

export function getAllPosts(): Post[] {
  return [...samplePosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  return samplePosts.find((p) => p.slug === slug && p.source === "native");
}

export function getAggregatedPostBySlug(slug: string): Post | undefined {
  return samplePosts.find((p) => p.slug === slug && p.source === "aggregated");
}

export function getPostsByAuthor(authorSlug: string): Post[] {
  return getAllPosts().filter((p) => p.authorSlug === authorSlug);
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function getRecentPosts(limit = 5): Post[] {
  return getAllPosts().slice(0, limit);
}

export function searchPosts(query: string): Post[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllPosts().filter((p) => {
    const haystack = [p.title, p.excerpt, p.body ?? "", p.authorName, ...p.tags]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

// --- tag cloud ---

export function getTagCounts(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of samplePosts) {
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

export function getArchiveIndex(): ArchiveYear[] {
  const byYear = new Map<number, Map<number, number>>();

  for (const post of getAllPosts()) {
    const d = new Date(post.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
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

export function getPostsByMonth(year: number, month: number): Post[] {
  return getAllPosts().filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}
