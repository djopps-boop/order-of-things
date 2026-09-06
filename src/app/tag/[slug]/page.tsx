import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import { getPostsByTag, getTagCounts } from "@/lib/posts";

// Header tag-emoji shortcuts (see Header.tsx) link to slugs that don't exist
// in the placeholder taxonomy yet — included here so those links resolve to
// a (currently empty) page instead of a 404 until a real taxonomy exists.
const HEADER_SHORTCUT_SLUGS = ["tv", "film", "music", "books"];

export function generateStaticParams() {
  const slugs = new Set<string>(HEADER_SHORTCUT_SLUGS);
  for (const { tag } of getTagCounts()) slugs.add(tag);
  return Array.from(slugs).map((slug) => ({ slug }));
}

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
