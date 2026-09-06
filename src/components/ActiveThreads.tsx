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
      <h3>Active threads</h3>
      <ul>
        {threads.map((t) => (
          <li key={t.postHref}>
            <Link href={t.postHref}>{t.postTitle}</Link>{" "}
            <span className="recent-date">
              {t.commentCount} comments · latest {t.latestActivity}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
