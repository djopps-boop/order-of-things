import Link from "next/link";
import type { ActiveThread } from "@/lib/comments";

// Persistent left-column counterpart to the inline <ActiveThreads /> flourish
// in the feed itself: same underlying data (getActiveThreads, backed by the
// GitHub Discussions fetch in lib/comments.ts), but always visible in the
// scan path rather than tied to a single position in the feed. Homepage
// only — see FeedLayout's optional leftColumn prop.
//
// Takes `threads` as a prop rather than fetching internally: the caller
// (page.tsx) needs to know *before* deciding whether to pass a leftColumn
// to FeedLayout at all, since FeedLayout picks its grid (2-column vs.
// 3-column) based on whether leftColumn is present — a component that
// fetches its own data and might render null internally can't inform
// that decision in time, and previously caused the whole layout to
// collapse by one grid track whenever there were no active threads.
export default function ActiveThreadsColumn({ threads }: { threads: ActiveThread[] }) {
  return (
    <aside className="active-threads-column">
      <h3 className="sidebar-head">
        <span aria-hidden="true">🔥</span> Active Threads
      </h3>
      <div className="active-threads-column-list">
        {threads.map((t) => (
          <Link key={t.postHref} href={t.postHref} className="active-threads-column-row">
            <span className="active-threads-column-title">{t.postTitle}</span>
            <span className="active-threads-column-meta">
              {t.commentCount} {t.commentCount === 1 ? "reply" : "replies"} ·{" "}
              {formatRelativeTime(t.latestActivity)}
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
