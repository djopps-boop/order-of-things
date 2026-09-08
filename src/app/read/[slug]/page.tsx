import Link from "next/link";
import { notFound } from "next/navigation";
import { getAggregatedPostBySlug, getAllPosts } from "@/lib/posts";
import { EXCERPT_WORD_CAP, WORD_CAP } from "@/lib/config";
import { sliceHtmlByWords } from "@/lib/htmlText";
import Comments from "@/components/Comments";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts
    .filter((p) => p.source === "aggregated")
    .map((p) => ({ slug: p.slug }));
}

// Internal preview page for aggregated (Substack) posts. This exists so the
// main feed can stay image-free while a post still gets a place to show its
// thumbnail (if the source post has one) before sending the reader out to
// the actual Substack article. Native posts don't use this — they have
// their own full page at /post/[slug].
export default async function ReadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getAggregatedPostBySlug(slug);

  if (!post || !post.sourceUrl) {
    notFound();
  }

  const continuation = post.body
    ? sliceHtmlByWords(post.body, EXCERPT_WORD_CAP, WORD_CAP)
    : null;

  return (
    <article className="read-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {post.thumbnailUrl && (
        <img src={post.thumbnailUrl} alt="" className="read-thumbnail" />
      )}

      <div className="feed-card-meta">
        <span className="feed-card-kind">aggregated · {post.access}</span>
        {post.newsletterName && (
          <span className="feed-card-source-badge">
            via {post.newsletterName}
          </span>
        )}
      </div>

      <h1>{post.title}</h1>

      <p className="feed-card-byline">
        by{" "}
        <Link href={`/author/${post.authorSlug}`}>{post.authorName}</Link> ·{" "}
        {post.date}
      </p>

      {post.tags.length > 0 && (
        <div className="feed-card-tags">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/tag/${tag}`} className="tag-pill">
              {tag}
            </Link>
          ))}
        </div>
      )}

      <div
        className="feed-card-excerpt rich-text"
        dangerouslySetInnerHTML={{ __html: post.excerpt }}
      />

      {continuation && (
        <div
          className="feed-card-excerpt rich-text"
          dangerouslySetInnerHTML={{ __html: continuation.html }}
        />
      )}

      <a
        href={post.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="paid-button"
      >
        {post.access === "paid"
          ? "For paid subscribers — continue on Substack →"
          : "Continue reading on Substack →"}
      </a>

      <Comments />
    </article>
  );
}
