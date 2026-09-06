"use client";

import { useState } from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import { WORD_CAP, truncateWords } from "@/lib/config";

export default function FeedCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const isPaid = post.source === "aggregated" && post.access === "paid";
  const canExpand = !isPaid && !!post.body;

  const truncated = post.body ? truncateWords(post.body, WORD_CAP) : null;

  // Fave/Share are lightweight, unpersisted UI for now — a real
  // implementation needs a backend the same way comments do (see
  // Comments.tsx). Reply doesn't need one: it just jumps to wherever this
  // post's comments live (its own page, or the /read preview for
  // aggregated posts).
  const [faves, setFaves] = useState(0);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.origin + post.permalink
        : post.permalink;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: post.title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <article className="feed-card">
      <div className="feed-card-meta">
        <span className="feed-card-kind">
          {post.source === "native"
            ? "native post"
            : `aggregated · ${post.access}`}
        </span>
        {post.newsletterName && (
          <span className="feed-card-source-badge">
            via {post.newsletterName}
          </span>
        )}
      </div>

      <h2 className="feed-card-title">{post.title}</h2>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      {post.thumbnailUrl && (
        <img
          src={post.thumbnailUrl}
          alt=""
          className="feed-card-image"
        />
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

      <p className="feed-card-excerpt">{post.excerpt}</p>

      {!expanded && canExpand && (
        <button onClick={() => setExpanded(true)}>Read more</button>
      )}

      {expanded && truncated && (
        <div className="feed-card-expanded">
          <p>{truncated.text}</p>
          {truncated.truncated && (
            <Link href={post.permalink}>Continue reading →</Link>
          )}
        </div>
      )}

      {isPaid && (
        <Link href={post.permalink} className="paid-button">
          For paid subscribers
        </Link>
      )}

      <div className="post-actions">
        <button
          className="post-action"
          onClick={() => setFaves((f) => f + 1)}
        >
          ♥ Fave{faves > 0 ? ` · ${faves}` : ""}
        </button>
        <Link href={`${post.permalink}#comments`} className="post-action">
          💬 Reply
        </Link>
        <button className="post-action" onClick={handleShare}>
          ↗ {copied ? "Link copied" : "Share"}
        </button>
      </div>
    </article>
  );
}
