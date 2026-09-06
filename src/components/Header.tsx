import Link from "next/link";

// Working name only — swap once the final name is agreed on.
const SITE_NAME = "The Order of Things";

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-title">
        {SITE_NAME}
      </Link>
      <nav className="site-nav">
        <Link href="/">Home</Link>
        <form action="/search" method="get" className="search-form">
          <input
            type="search"
            name="q"
            placeholder="Search"
            aria-label="Search posts"
          />
          <button type="submit">Search</button>
        </form>
      </nav>
    </header>
  );
}
