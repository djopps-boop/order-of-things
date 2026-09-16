// Real data source: Giscus stores every comment as a GitHub Discussion
// (mapping="pathname", category "Announcements" — see Comments.tsx) on
// this same repo. We read that back via GitHub's GraphQL API at build
// time, matched against our own post list by pathname, so both the
// homepage "Active Threads" column and the "Recent Comments" sidebar
// widget are driven by one shared fetch instead of two.
//
// Never throws — same policy as fetchAggregatedPosts() in rss.ts. A
// missing token, a rate limit, or GitHub being down just means these two
// widgets render empty for that build; it must not take the whole site
// down.

import { getAllPosts } from "./posts";

const REPO_OWNER = "djopps-boop";
const REPO_NAME = "order-of-things";
// Matches GISCUS_CONFIG.categoryId in Comments.tsx — the "Announcements"
// category Giscus is scoped to. Kept as a separate constant here (rather
// than imported) since Comments.tsx is a client component and this is a
// server-only data module.
const DISCUSSION_CATEGORY_ID = "DIC_kwDOUQeJVM4DFBv2";
const FETCH_TIMEOUT_MS = 10_000;

interface DiscussionCommentNode {
  bodyText: string;
  updatedAt: string;
  author: { login: string } | null;
}

interface DiscussionNode {
  title: string; // the post's pathname, per mapping="pathname"
  updatedAt: string;
  comments: {
    totalCount: number;
    nodes: DiscussionCommentNode[];
  };
}

interface DiscussionsResponse {
  data?: {
    repository?: {
      discussions?: {
        nodes: DiscussionNode[];
      };
    };
  };
  errors?: { message: string }[];
}

const DISCUSSIONS_QUERY = `
  query RepoDiscussions($owner: String!, $name: String!, $categoryId: ID) {
    repository(owner: $owner, name: $name) {
      discussions(first: 50, categoryId: $categoryId, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          title
          updatedAt
          comments(first: 20) {
            totalCount
            nodes {
              bodyText
              updatedAt
              author { login }
            }
          }
        }
      }
    }
  }
`;

let cachedDiscussions: DiscussionNode[] | null = null;

async function fetchDiscussions(): Promise<DiscussionNode[]> {
  if (cachedDiscussions) return cachedDiscussions;

  const token = process.env.GITHUB_DISCUSSIONS_TOKEN;
  if (!token) {
    console.warn(
      "[comments] GITHUB_DISCUSSIONS_TOKEN not set — Active Threads / Recent Comments will be empty for this build."
    );
    cachedDiscussions = [];
    return cachedDiscussions;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "OrderOfThingsAggregator/1.0",
      },
      body: JSON.stringify({
        query: DISCUSSIONS_QUERY,
        variables: { owner: REPO_OWNER, name: REPO_NAME, categoryId: DISCUSSION_CATEGORY_ID },
      }),
    });

    if (!res.ok) {
      throw new Error(`GitHub GraphQL responded ${res.status}`);
    }

    const json = (await res.json()) as DiscussionsResponse;
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }

    // Discussions with zero comments carry no signal for either widget —
    // Giscus creates the discussion lazily on first comment/reaction, so
    // in practice most posts simply won't have a discussion node at all
    // yet; this filter just also covers the rare zero-comment edge case.
    //
    // GitHub's API can sort discussions by updatedAt but not comments
    // within a discussion (no orderBy arg on that field), so newest-first
    // ordering of each discussion's own comments has to happen here
    // instead of in the query.
    cachedDiscussions = (json.data?.repository?.discussions?.nodes ?? [])
      .filter((d) => d.comments.totalCount > 0)
      .map((d) => ({
        ...d,
        comments: {
          ...d.comments,
          nodes: [...d.comments.nodes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
        },
      }));
  } catch (err) {
    console.warn(
      `[comments] could not fetch GitHub Discussions: ${
        err instanceof Error ? err.message : err
      }`
    );
    cachedDiscussions = [];
  } finally {
    clearTimeout(timeout);
  }

  return cachedDiscussions;
}

// Giscus discussion titles are the post's pathname per mapping="pathname",
// but without the leading slash our own permalinks use (confirmed against
// the real repo: discussion titles read "read/some-slug", not
// "/read/some-slug") -- normalize both sides so the lookup isn't silently
// order-of-things-repo-specific to whichever convention either side
// happens to use.
function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

async function buildPermalinkIndex(): Promise<Map<string, { title: string; permalink: string }>> {
  const posts = await getAllPosts();
  const index = new Map<string, { title: string; permalink: string }>();
  for (const post of posts) {
    index.set(normalizePath(post.permalink), { title: post.title, permalink: post.permalink });
  }
  return index;
}

export interface RecentComment {
  authorName: string;
  postTitle: string;
  postHref: string;
  snippet: string;
}

const SNIPPET_MAX_LENGTH = 140;

function toSnippet(bodyText: string): string {
  const trimmed = bodyText.trim().replace(/\s+/g, " ");
  if (trimmed.length <= SNIPPET_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, SNIPPET_MAX_LENGTH).trimEnd()}…`;
}

export async function getRecentComments(limit = 5): Promise<RecentComment[]> {
  const [discussions, permalinkIndex] = await Promise.all([
    fetchDiscussions(),
    buildPermalinkIndex(),
  ]);

  const flattened: (RecentComment & { updatedAt: string })[] = [];
  for (const discussion of discussions) {
    const post = permalinkIndex.get(normalizePath(discussion.title));
    if (!post) continue; // discussion doesn't map to a live post (e.g. removed contributor)
    for (const comment of discussion.comments.nodes) {
      if (!comment.author || !comment.bodyText.trim()) continue;
      flattened.push({
        authorName: comment.author.login,
        postTitle: post.title,
        postHref: post.permalink,
        snippet: toSnippet(comment.bodyText),
        updatedAt: comment.updatedAt,
      });
    }
  }

  flattened.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return flattened.slice(0, limit).map((c) => ({
    authorName: c.authorName,
    postTitle: c.postTitle,
    postHref: c.postHref,
    snippet: c.snippet,
  }));
}

// "Active Threads": posts ranked by how recently they got a comment (the
// clearer "come join in, it's live" signal vs. raw comment count), shown
// both inline in the homepage feed and in the persistent left sidebar
// column.

export interface ActiveThread {
  postTitle: string;
  postHref: string;
  commentCount: number;
  latestActivity: string; // ISO datetime of the most recent comment
}

export async function getActiveThreads(limit = 5): Promise<ActiveThread[]> {
  const [discussions, permalinkIndex] = await Promise.all([
    fetchDiscussions(),
    buildPermalinkIndex(),
  ]);

  const threads: ActiveThread[] = [];
  for (const discussion of discussions) {
    const post = permalinkIndex.get(normalizePath(discussion.title));
    if (!post) continue;
    const latestComment = discussion.comments.nodes[0]; // sorted newest-first above
    threads.push({
      postTitle: post.title,
      postHref: post.permalink,
      commentCount: discussion.comments.totalCount,
      latestActivity: latestComment?.updatedAt ?? discussion.updatedAt,
    });
  }

  threads.sort((a, b) => (a.latestActivity < b.latestActivity ? 1 : -1));
  return threads.slice(0, limit);
}
