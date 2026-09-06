import FeedLayout from "@/components/FeedLayout";
import FeedCard from "@/components/FeedCard";
import { getAllPosts, getPostsByAuthor } from "@/lib/posts";
import { newsletterSources } from "@/lib/sources";
import { getAuthorProfile } from "@/lib/authors";

// Static export needs every dynamic segment enumerated at build time.
// Union of confirmed contributors (so profile pages exist even before they
// have a post yet) and any author slug that already appears on a post.
export async function generateStaticParams() {
  const slugs = new Set<string>(newsletterSources.map((s) => s.authorSlug));
  const posts = await getAllPosts();
  for (const post of posts) slugs.add(post.authorSlug);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export default async function AuthorArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getPostsByAuthor(slug);
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
