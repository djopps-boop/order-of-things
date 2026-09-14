import Link from "next/link";
import { notFound } from "next/navigation";
import { getAggregatedPostBySlug, getAllPosts } from "@/lib/posts";
import Comments from "@/components/Comments";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts
    .filter((p) => p.source === "aggregated")
    .map((p) => ({ slug: p.slug }));
}

// Standalone page for aggregated (Substack) posts. Free posts render in
// full here -- not the 600-word feed-card preview -- so a reader never has
// to leave the site to finish a free piece; the original Substack post is
// linked at the bottom as a secondary "here's where this lives" reference,
// not a "continue reading" CTA, since there's nothing left to continue to.
// Paid posts still only have the free teaser (rss.ts never fetches a paid
// post's full body), so for those the Substack link remains the one way to
// read the rest and stays styled as the primary action. Native posts don't
// use this page at all -- they have their own full page at /post/[slug].
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

  const isPaid = post.access === "paid";

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
        dangerouslySetInnerHTML={{
          __html: post.body && !isPaid ? post.body : post.excerpt,
        }}
      />

      {isPaid ? (
        <a
          href={post.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="paid-button"
        >
          For paid subscribers — continue on Substack →
        </a>
      ) : (
        <p className="original-source-link">
          Originally published on{" "}
          <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
            {post.newsletterName ?? "Substack"}
          </a>
        </p>
      )}

      <Comments />
    </article>
  );
}
