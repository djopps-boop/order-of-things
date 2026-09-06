import FeedLayout from "@/components/FeedLayout";
import SearchClient from "@/components/SearchClient";
import { getAllPosts } from "@/lib/posts";

// Server component: fetches the full post list once at build time (static
// export has no server per request), then hands it to the client component
// that actually reads the ?q= query string and filters, in the browser.
// FeedLayout renders the (async, server-only) Sidebar, so it has to stay
// outside the "use client" boundary — see SearchClient.tsx.
export default async function SearchPage() {
  const posts = await getAllPosts();

  return (
    <FeedLayout>
      <SearchClient posts={posts} />
    </FeedLayout>
  );
}
