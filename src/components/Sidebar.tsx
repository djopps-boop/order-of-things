import Link from "next/link";
import { getTagCounts, getArchiveIndex, getRecentPosts } from "@/lib/posts";
import { getRecentComments } from "@/lib/comments";

// Blogroll is manually curated — not derived from the aggregation list.
const blogroll = [
  { name: "Site name", url: "https://example.com" },
  { name: "Site name", url: "https://example.com" },
  { name: "Site name", url: "https://example.com" },
];

const MIN_TAG_SIZE = 12;
const MAX_TAG_SIZE = 24;

export default function Sidebar() {
  const tagCounts = getTagCounts();
  const maxCount = Math.max(1, ...tagCounts.map((t) => t.count));
  const archive = getArchiveIndex();
  const recentPosts = getRecentPosts();
  const recentComments = getRecentComments();

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h3>Blogroll</h3>
        <ul>
          {blogroll.map((site) => (
            <li key={site.name}>
              <a href={site.url} target="_blank" rel="noopener noreferrer">
                {site.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="sidebar-section">
        <h3>Recent posts</h3>
        <ul>
          {recentPosts.map((post) => (
            <li key={post.slug}>
              <Link href={post.permalink}>{post.title}</Link>{" "}
              <span className="recent-date">{post.date}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sidebar-section">
        <h3>Recent comments</h3>
        <ul>
          {recentComments.map((c, i) => (
            <li key={i}>
              {c.authorName} on{" "}
              <Link href={c.postHref}>{c.postTitle}</Link>
            </li>
          ))}
        </ul>
        <p className="sidebar-note">
          [depends on the comment platform chosen — placeholder data]
        </p>
      </section>

      <section className="sidebar-section">
        <h3>Tags</h3>
        <div className="tag-cloud">
          {tagCounts.map(({ tag, count }) => {
            const size =
              MIN_TAG_SIZE +
              (count / maxCount) * (MAX_TAG_SIZE - MIN_TAG_SIZE);
            return (
              <Link
                key={tag}
                href={`/tag/${tag}`}
                className="tag-cloud-item"
                style={{ fontSize: `${size}px` }}
              >
                {tag}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="sidebar-section">
        <h3>Archive</h3>
        <div className="archive-list">
          {archive.map((y, i) => (
            <details key={y.year} open={i === 0}>
              <summary>
                {y.year} ({y.count})
              </summary>
              <ul>
                {y.months.map((m) => (
                  <li key={m.month}>
                    <Link
                      href={`/archive/${m.year}/${String(m.month).padStart(2, "0")}`}
                    >
                      {m.label}
                    </Link>{" "}
                    ({m.count})
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </aside>
  );
}
