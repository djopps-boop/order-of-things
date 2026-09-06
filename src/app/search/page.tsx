"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import { searchPosts } from "@/lib/posts";

// Client-side so this works under static export: there's no server per
// request to read the query string from, so the search itself (a plain
// synchronous filter over the placeholder post list) runs in the browser
// instead. useSearchParams requires a Suspense boundary, hence the wrapper
// below.
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const results = query ? searchPosts(query) : [];

  return (
    <FeedLayout>
      <h1>Search{query ? `: "${query}"` : ""}</h1>
      {query && results.length === 0 && <p>No posts matched that search.</p>}
      {results.map((post) => (
        <FeedCard key={post.slug} post={post} />
      ))}
    </FeedLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
