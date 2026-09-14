import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import Comments from "@/components/Comments";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts
    .filter((p) => p.source === "native")
    .map((p) => ({ slug: p.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="post-page">
      <h1>{post.title}</h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      {post.thumbnailUrl && (
        <img src={post.thumbnailUrl} alt="" className="read-thumbnail" />
      )}

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
        className="post-body rich-text"
        dangerouslySetInnerHTML={{ __html: post.body ?? "" }}
      />

      {post.turns && post.turns.length > 0 && (
        <section className="turns-section" aria-label="Turns">
          <div className="turns-head">
            <span>↩</span>
            <span>{post.turns.length === 1 ? "1 Turn" : `${post.turns.length} Turns`}</span>
          </div>
          {post.turns.map((turn) => (
            <div key={turn.id} className="turn">
              <div className="turn-byline">
                <Link href={`/author/${turn.authorSlug}`}>{turn.authorName}</Link>
                <span>·</span>
                <span>{turn.date.slice(0, 10)}</span>
              </div>
              <div
                className="turn-body rich-text"
                dangerouslySetInnerHTML={{ __html: turn.body }}
              />
            </div>
          ))}
        </section>
      )}

      <footer className="post-footer">
        <Link href={`/author/${post.authorSlug}`}>
          more from {post.authorName}
        </Link>
      </footer>

      <Comments />
    </article>
  );
}
