import Link from "next/link";
import { getTagCounts, getArchiveIndex, getRecentPosts } from "@/lib/posts";
import { getRecentComments } from "@/lib/comments";
import { newsletterSources } from "@/lib/sources";

// Blogroll is manually curated — not derived from the aggregation list.
// Colors are a small fixed palette, cycled, matching the design's
// favicon-style colored-initial chip treatment.
const BLOGROLL_COLORS = ["#B33F1E", "#1F5F5B", "#8A5A2B", "#6B4E9B", "#3D6EA5"];
const blogroll = [
  { name: "Site name", url: "https://example.com" },
  { name: "Site name", url: "https://example.com" },
  { name: "Site name", url: "https://example.com" },
].map((site, i) => ({ ...site, color: BLOGROLL_COLORS[i % BLOGROLL_COLORS.length] }));

const contributors = newsletterSources.map((s) => ({
  name: s.authorName,
  slug: s.authorSlug,
  initial: s.authorName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
}));

const MIN_TAG_SIZE = 12;
const MAX_TAG_SIZE = 24;

// Small inline line-icons, matching the design handoff's hand-drawn SVG set.
function DocumentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.2" className="search-icon">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

function SpeechBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
      <path d="M4 5h16v11H9l-4 4V5z" />
    </svg>
  );
}

function ChainLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
      <path d="M9 15l6-6M8 12l-2.5 2.5a3 3 0 104 4L12 16M16 12l2.5-2.5a3 3 0 10-4-4L12 8" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
      <path d="M11 3l9 9-8 8-9-9V4z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
      <rect x="4" y="5" width="16" height="15" rx="1" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </svg>
  );
}

export default function Sidebar() {
  const tagCounts = getTagCounts();
  const maxCount = Math.max(1, ...tagCounts.map((t) => t.count));
  const archive = getArchiveIndex();
  const recentPosts = getRecentPosts();
  const recentComments = getRecentComments();

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h3 className="sidebar-head">
          <DocumentIcon />
          Recent Posts
        </h3>
        <div className="recent-posts-list">
          {recentPosts.map((post) => (
            <Link key={post.slug} href={post.permalink} className="recent-post-link">
              {post.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <form action="/search" method="get" className="sidebar-search">
          <SearchIcon />
          <input
            type="search"
            name="q"
            placeholder="Search the archive…"
            aria-label="Search the archive"
          />
        </form>
      </section>

      <div className="sidebar-graphic-slot" aria-hidden="true">
        Graphic — TBD
      </div>

      <section className="sidebar-section">
        <h3 className="sidebar-head">
          <PersonIcon />
          Contributors
        </h3>
        <div className="contributor-list">
          {contributors.map((c) => (
            <Link key={c.slug} href={`/author/${c.slug}`} className="contributor-link">
              <span className="contributor-initial">{c.initial}</span>
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <h3 className="sidebar-head">
          <SpeechBubbleIcon />
          Recent Comments
        </h3>
        <div className="recent-comments-list">
          {recentComments.map((c, i) => (
            <p key={i} className="recent-comment">
              <span className="recent-comment-who">{c.authorName}</span> on{" "}
              <Link href={c.postHref} className="recent-comment-post">
                {c.postTitle}
              </Link>
              : &ldquo;{c.snippet}&rdquo;
            </p>
          ))}
        </div>
      </section>

      <div className="sidebar-graphic-slot" aria-hidden="true">
        Graphic — TBD
      </div>

      <section className="sidebar-section">
        <h3 className="sidebar-head">
          <ChainLinkIcon />
          Blogroll
        </h3>
        <div className="blogroll-list">
          {blogroll.map((site, i) => (
            <a
              key={i}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="blogroll-link"
            >
              <span className="blogroll-initial" style={{ background: site.color }}>
                {site.name[0]}
              </span>
              <span>{site.name}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="sidebar-graphic-slot" aria-hidden="true">
        Graphic — TBD
      </div>

      <section className="sidebar-section">
        <h3 className="sidebar-head">
          <TagIcon />
          Tag Cloud
        </h3>
        <div className="tag-cloud">
          {tagCounts.map(({ tag, count }) => {
            const size =
              MIN_TAG_SIZE + (count / maxCount) * (MAX_TAG_SIZE - MIN_TAG_SIZE);
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
        <h3 className="sidebar-head">
          <CalendarIcon />
          Date Archive
        </h3>
        <div className="archive-list">
          {archive.map((y, i) => (
            <details key={y.year} open={i === 0}>
              <summary>
                <span>{y.year}</span>
              </summary>
              <div className="archive-months">
                {y.months.map((m) => (
                  <Link
                    key={m.month}
                    href={`/archive/${m.year}/${String(m.month).padStart(2, "0")}`}
                    className="archive-month-link"
                  >
                    <span>{m.label}</span>
                    <span>{m.count}</span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </aside>
  );
}
