import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import ActiveThreads from "@/components/ActiveThreads";
import { getAllPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <FeedLayout>
      {posts.map((post, i) => (
        <div key={post.slug}>
          <FeedCard post={post} />
          {i === 0 && <ActiveThreads />}
        </div>
      ))}
    </FeedLayout>
  );
}
