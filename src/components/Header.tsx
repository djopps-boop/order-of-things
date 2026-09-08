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
  { emoji: "💡", name: "Ideas", slug: "ideas" },
  { emoji: "🏛️", name: "Politics", slug: "politics" },
  { emoji: "🤖", name: "Technology", slug: "technology" },
  { emoji: "🎭", name: "Culture", slug: "culture" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-left">
        <Link href="/" className="wordmark">
          <span className="wordmark-block">The</span>
          <span className="wordmark-accent">Order</span>
          <span className="wordmark-block">of Things</span>
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
          {tagShortcuts.map((t) => (
            <Link
              key={t.slug}
              href={`/tag/${t.slug}`}
              title={t.name}
              className="tag-shortcut"
            >
              <span>{t.emoji}</span>
              <span>{t.name}</span>
            </Link>
          ))}
        </div>
        <span className="header-divider" aria-hidden="true" />
        <ThemeToggle />
      </nav>
    </header>
  );
}
