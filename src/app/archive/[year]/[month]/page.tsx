import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import { getPostsByMonth, MONTH_NAMES } from "@/lib/posts";

export default async function ArchiveMonthPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year, month } = await params;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const posts = getPostsByMonth(y, m);
  const label = MONTH_NAMES[m - 1] ?? month;

  return (
    <FeedLayout>
      <h1>
        {label} {y}
      </h1>
      {posts.map((post) => (
        <FeedCard key={post.slug} post={post} />
      ))}
    </FeedLayout>
  );
}
