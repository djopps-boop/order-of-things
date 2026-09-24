import { Fragment } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

// Shortcuts to the site's four broad content categories -- replaces the
// original TV/Film/Music/Books placeholders (see the design handoff),
// which were illustrative picks rather than categories any actual post
// belonged to. These four were chosen by looking at the specific tags
// drafted for every post imported so far (see tagOverrides.ts) and
// grouping them into the themes that actually recur across contributors:
// literary/intellectual criticism ("Ideas") is by far the largest, with
// technology, politics, and the more art/lifestyle-adjacent pieces
// ("Culture") each well-represented too.
const tagShortcuts = [
  { name: "Ideas", slug: "ideas" },
  { name: "Politics", slug: "politics" },
  { name: "Technology", slug: "technology" },
  { name: "Culture", slug: "culture" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-left">
        <Link href="/" className="wordmark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/wordmark-light.webp"
            alt="The Order of Things"
            className="wordmark-image wordmark-image--light"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/wordmark-dark.webp"
            alt="The Order of Things"
            className="wordmark-image wordmark-image--dark"
          />
        </Link>
        <span className="header-divider" aria-hidden="true" />
      </div>

      <nav className="site-nav">
        <span className="header-divider" aria-hidden="true" />
        <Link href="/" className="nav-link">
          Home
        </Link>
        <Link href="/archive" className="nav-link">
          Archive
        </Link>
        <Link href="/about" className="nav-link">
          About
        </Link>
        <div className="tag-shortcuts">
          {tagShortcuts.map((t, i) => (
            <Fragment key={t.slug}>
              {i > 0 && (
                <span className="tag-shortcut-sep" aria-hidden="true">
                  ·
                </span>
              )}
              <Link href={`/tag/${t.slug}`} title={t.name} className="tag-shortcut">
                [ {t.name.toUpperCase()} ]
              </Link>
            </Fragment>
          ))}
        </div>
        <span className="header-divider" aria-hidden="true" />
        <ThemeToggle />
      </nav>
    </header>
  );
}
