"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FeedCard from "@/components/FeedCard";
import { Post } from "@/lib/types";
import { filterPostsByQuery } from "@/lib/posts";

// Receives the full, already-fetched post list as a prop from the server
// component in search/page.tsx (static export means there's no server per
// request, so the actual query-string read + filtering happens here in the
// browser instead). useSearchParams requires a Suspense boundary, hence the
// wrapper component below.
function SearchResults({ posts }: { posts: Post[] }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const results = query ? filterPostsByQuery(posts, query) : [];

  return (
    <>
      <h1>Search{query ? `: "${query}"` : ""}</h1>
      {query && results.length === 0 && <p>No posts matched that search.</p>}
      {results.map((post) => (
        <FeedCard key={post.slug} post={post} />
      ))}
    </>
  );
}

export default function SearchClient({ posts }: { posts: Post[] }) {
  return (
    <Suspense fallback={null}>
      <SearchResults posts={posts} />
    </Suspense>
  );
}
