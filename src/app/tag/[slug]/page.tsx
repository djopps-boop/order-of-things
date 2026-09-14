import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import { getPostsByTag, getTagCounts } from "@/lib/posts";

// Header tag-emoji shortcuts (see Header.tsx) — the four broad nav
// categories (ideas/politics/technology/culture). Included here so those
// links always resolve to a real page even in the unlikely event a category
// has zero tagged posts at build time, instead of 404ing.
const HEADER_SHORTCUT_SLUGS = ["ideas", "politics", "technology", "culture"];

export async function generateStaticParams() {
  const slugs = new Set<string>(HEADER_SHORTCUT_SLUGS);
  const tagCounts = await getTagCounts();
  for (const { tag } of tagCounts) slugs.add(tag);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getPostsByTag(slug);

  return (
    <FeedLayout>
      <h1>Tagged: {slug}</h1>
      {posts.map((post) => (
        <FeedCard key={post.slug} post={post} />
      ))}
    </FeedLayout>
  );
}
