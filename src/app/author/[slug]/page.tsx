import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import { getPostsByAuthor } from "@/lib/posts";
import { getAuthorProfile } from "@/lib/authors";

export default async function AuthorArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = getPostsByAuthor(slug);
  const profile = getAuthorProfile(slug);
  const authorName = profile?.name ?? posts[0]?.authorName ?? slug;

  return (
    <FeedLayout>
      <h1>Posts by {authorName}</h1>

      {profile && (
        <div className="author-bio-card">
          <p className="author-bio-text">{profile.bio}</p>
          {profile.substackUrl && (
            <a
              href={profile.substackUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read {authorName} on Substack →
            </a>
          )}
        </div>
      )}

      {posts.map((post) => (
        <FeedCard key={post.slug} post={post} />
      ))}
    </FeedLayout>
  );
}
