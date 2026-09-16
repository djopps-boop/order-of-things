import { ReactNode } from "react";
import Sidebar from "./Sidebar";

// Shared layout used by the homepage and the author/tag archives: a feed of
// FeedCards, blogroll + tags on the right. `leftColumn` is optional and only
// passed by the homepage (see ActiveThreadsColumn) — archive/tag/author
// pages stay two-column, unchanged.
export default function FeedLayout({
  children,
  leftColumn,
}: {
  children: ReactNode;
  leftColumn?: ReactNode;
}) {
  return (
    <div className={leftColumn ? "feed-layout feed-layout--with-left" : "feed-layout"}>
      {leftColumn}
      <main className="feed-main">{children}</main>
      <Sidebar />
    </div>
  );
}
