// Placeholder — a "recent comments" module needs an actual comment platform
// behind it (see the open decision on Comments.tsx: embedded third-party vs.
// custom Sanity-backed). Once that's chosen, this gets replaced by a real
// query against whatever store/API that platform exposes, ordered by date.

export interface RecentComment {
  authorName: string;
  postTitle: string;
  postHref: string;
}

const sampleRecentComments: RecentComment[] = [
  {
    authorName: "[Commenter name]",
    postTitle: "Reading history sideways",
    postHref: "/post/reading-history-sideways",
  },
  {
    authorName: "[Commenter name]",
    postTitle: "An example free newsletter post",
    postHref: "/post/reading-history-sideways",
  },
];

export function getRecentComments(limit = 5): RecentComment[] {
  return sampleRecentComments.slice(0, limit);
}

// "Active Threads" (a kottke.org flourish): posts with recent comment
// activity, shown just below the newest post on the homepage. Same
// placeholder caveat as getRecentComments — needs the real Giscus/GitHub
// Discussions data once the repo exists.

export interface ActiveThread {
  postTitle: string;
  postHref: string;
  commentCount: number;
  latestActivity: string; // display string, e.g. a relative or ISO date
}

const sampleActiveThreads: ActiveThread[] = [
  {
    postTitle: "Reading history sideways",
    postHref: "/post/reading-history-sideways",
    commentCount: 6,
    latestActivity: "2026-09-02",
  },
  {
    postTitle: "An example free newsletter post",
    postHref: "/read/aggregated-free-example",
    commentCount: 2,
    latestActivity: "2026-08-29",
  },
];

export function getActiveThreads(limit = 5): ActiveThread[] {
  return sampleActiveThreads.slice(0, limit);
}
