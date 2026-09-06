import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import { getPostsByTag } from "@/lib/posts";

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = getPostsByTag(slug);

  return (
    <FeedLayout>
      <h1>Tagged: {slug}</h1>
      {posts.map((post) => (
        <FeedCard key={post.slug} post={post} />
      ))}
    </FeedLayout>
  );
}
