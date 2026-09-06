import { ReactNode } from "react";
import Sidebar from "./Sidebar";

// Shared two-column shape used by the homepage and the author/tag archives:
// a feed of FeedCards on the left, blogroll + tags on the right.
export default function FeedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="feed-layout">
      <main className="feed-main">{children}</main>
      <Sidebar />
    </div>
  );
}
