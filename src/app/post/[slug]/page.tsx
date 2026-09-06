import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import Comments from "@/components/Comments";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

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

      <div className="post-body">
        <p>{post.body}</p>
      </div>

      <footer className="post-footer">
        <Link href={`/author/${post.authorSlug}`}>
          more from {post.authorName}
        </Link>
      </footer>

      <Comments />
    </article>
  );
}
