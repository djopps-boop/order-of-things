import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import { searchPosts } from "@/lib/posts";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
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
