import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

// Decorative shortcuts to a handful of tags — placeholders until a real tag
// taxonomy exists (see the design handoff: TV/Film/Music/Books were the
// mock's illustrative picks, not a finished scheme).
const tagShortcuts = [
  { emoji: "📺", name: "TV", slug: "tv" },
  { emoji: "🎬", name: "Film", slug: "film" },
  { emoji: "🎵", name: "Music", slug: "music" },
  { emoji: "📚", name: "Books", slug: "books" },
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
