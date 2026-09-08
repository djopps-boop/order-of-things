"use client";

import { useState } from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import { EXCERPT_WORD_CAP, WORD_CAP } from "@/lib/config";
import { htmlWordCount, sliceHtmlByWords } from "@/lib/htmlText";
import { getSourceLabel } from "@/lib/posts";

export default function FeedCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const [faved, setFaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAggregated = post.source === "aggregated";
  const isPaid = isAggregated && post.access === "paid";
  const canExpand =
    !isPaid && !!post.body && htmlWordCount(post.body) > EXCERPT_WORD_CAP;
  const continuation = post.body
    ? sliceHtmlByWords(post.body, EXCERPT_WORD_CAP, WORD_CAP)
    : null;

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.origin + post.permalink
        : post.permalink;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
        return;
      } catch {
        // fall through to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <article className="feed-card">
      <div className="feed-card-tags">
        {post.tags.map((tag) => (
          <Link key={tag} href={`/tag/${tag}`} className="feed-card-tag">
            {tag}
          </Link>
        ))}
        {isAggregated && <span className="feed-card-via">via Substack</span>}
      </div>

      <h2
        className={
          post.featured ? "feed-card-title feed-card-title-big" : "feed-card-title"
        }
      >
        <Link href={post.permalink}>{post.title}</Link>
      </h2>

      <div className="feed-card-meta">
        <Link href={`/author/${post.authorSlug}`}>{post.authorName}</Link>
        <span>·</span>
        <span>{getSourceLabel(post)}</span>
        <span>·</span>
        <span>{post.date}</span>
      </div>

      {post.thumbnailUrl && (
        <img src={post.thumbnailUrl} alt="" className="feed-card-image" />
      )}

      <div
        className="feed-card-excerpt rich-text"
        dangerouslySetInnerHTML={{ __html: post.excerpt }}
      />

      {expanded && continuation && (
        <div
          className="feed-card-excerpt feed-card-expanded-text rich-text"
          dangerouslySetInnerHTML={{ __html: continuation.html }}
        />
      )}

      <div className="feed-card-action-row">
        {isPaid && (
          <Link href={post.permalink} className="paid-button">
            <span>🔒</span>
            <span>For paid subscribers</span>
          </Link>
        )}
        {!isPaid && canExpand && !expanded && (
          <button className="read-more-link" onClick={() => setExpanded(true)}>
            Read more
          </button>
        )}
        {!isPaid && canExpand && expanded && isAggregated && post.sourceUrl && (
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="read-more-link"
          >
            Continue reading on Substack →
          </a>
        )}
        {!isPaid && canExpand && expanded && !isAggregated && (
          <Link href={post.permalink} className="read-more-link">
            Continue reading →
          </Link>
        )}
      </div>

      <div className="post-actions">
        <button
          className={
            faved ? "post-action post-action-faved" : "post-action"
          }
          onClick={() => setFaved((f) => !f)}
        >
          <span>{faved ? "★" : "☆"}</span>
          <span>Fave</span>
        </button>
        <Link href={`${post.permalink}#comments`} className="post-action">
          <span>💬</span>
          <span>Reply · {post.commentCount ?? 0}</span>
        </Link>
        <button className="post-action" onClick={handleShare}>
          <span>↗</span>
          <span>{copied ? "Link copied" : "Share"}</span>
        </button>
      </div>
    </article>
  );
}
