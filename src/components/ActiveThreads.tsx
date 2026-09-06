import Link from "next/link";
import { getActiveThreads } from "@/lib/comments";

// A kottke.org-style flourish: posts with recent comment activity, meant to
// sit inline in the main feed column, right after the newest post and
// before the rest of the feed continues.
export default function ActiveThreads() {
  const threads = getActiveThreads();

  if (threads.length === 0) return null;

  return (
    <section className="active-threads">
      <div className="active-threads-head">
        <span>🔥</span>
        <span>Active Threads</span>
      </div>
      <div className="active-threads-list">
        {threads.map((t) => (
          <Link key={t.postHref} href={t.postHref} className="active-threads-row">
            <span className="active-threads-title">{t.postTitle}</span>
            <span className="active-threads-count">{t.commentCount} replies</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
