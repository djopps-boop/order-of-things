import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import ActiveThreads from "@/components/ActiveThreads";
import ActiveThreadsColumn from "@/components/ActiveThreadsColumn";
import { getAllPosts } from "@/lib/posts";
import { getActiveThreads } from "@/lib/comments";

export default async function HomePage() {
  const [posts, threads] = await Promise.all([getAllPosts(), getActiveThreads()]);

  return (
    <FeedLayout
      leftColumn={threads.length > 0 ? <ActiveThreadsColumn threads={threads} /> : undefined}
    >
      {posts.map((post, i) => (
        <div key={post.slug}>
          <FeedCard post={post} />
          {i === 0 && <ActiveThreads />}
        </div>
      ))}
    </FeedLayout>
  );
}
