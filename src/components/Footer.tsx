import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <span>© 2026 The Order of Things</span>
      <Link href="/comments-policy">Comments Policy</Link>
    </footer>
  );
}
