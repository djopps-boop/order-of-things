"use client";

import { useState } from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import { EXCERPT_WORD_CAP, WORD_CAP } from "@/lib/config";
import {
  htmlWordCount,
  truncateHtmlByWords,
  splitHtmlAfterParagraphs,
} from "@/lib/htmlText";
import { getSourceLabel } from "@/lib/posts";
import { newsletterSources } from "@/lib/sources";

// A simple, original three-bar mark evoking Substack's own icon shape --
// not a reproduction of their logo file -- rendered in the same warm
// brown as the button's text, since the button's background is now a
// light orange-to-yellow gradient rather than a solid dark fill.
function SubstackMark() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="4" rx="1" fill="#7A3B12" />
      <rect x="3" y="10" width="18" height="4" rx="1" fill="#7A3B12" />
      <rect x="3" y="17" width="12" height="4" rx="1" fill="#7A3B12" />
    </svg>
  );
}

export default function FeedCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const [faved, setFaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAggregated = post.source === "aggregated";
  const isPaid = isAggregated && post.access === "paid";
  const canExpand =
    !isPaid && !!post.body && htmlWordCount(post.body) > EXCERPT_WORD_CAP;
  // Every contributor has an entry in sources.ts (that's how the RSS
  // aggregation finds their feed in the first place), so this covers
  // native and aggregated posts alike -- the subscribe link always points
  // at the person's own Substack home, not the specific post's URL.
  const source = newsletterSources.find((s) => s.authorSlug === post.authorSlug);
  const substackUrl = source?.url;
  const pronoun = source?.pronoun ?? "his";
  // Re-slicing from word 0 (rather than stitching the excerpt together with
  // a separate word-150-to-600 fragment) means a paragraph that happens to
  // straddle word 150 stays one continuous <p> instead of getting an
  // artificial break where the two fragments were joined.
  const expandedText = post.body
    ? truncateHtmlByWords(post.body, WORD_CAP)
    : null;
  // The subscribe CTA sits inline between the 2nd and 3rd paragraphs of the
  // expanded post rather than at the bottom, so it's seen while attention
  // is still on the writing rather than after a reader's already decided
  // whether to keep reading. Posts with 2 or fewer paragraphs just get the
  // whole thing in `before` (see splitHtmlAfterParagraphs), so the CTA ends
  // up appended at the end for those rather than not appearing at all.
  const expandedSplit = expandedText
    ? splitHtmlAfterParagraphs(expandedText.html, 2)
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
        {isAggregated && substackUrl && (
          <a
            href={substackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-card-via"
          >
            via Substack
            <span className="feed-card-via-icon" aria-hidden="true">
              ↗
            </span>
          </a>
        )}
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
        {isAggregated ? (
          <em>{getSourceLabel(post)}</em>
        ) : (
          <span>{getSourceLabel(post)}</span>
        )}
        <span>·</span>
        <span>{post.date}</span>
      </div>

      {post.turns && post.turns.length > 0 && (
        <div className="feed-card-turns-indicator">
          <span className="turns-ribbon">
            ↩ {post.turns.length === 1 ? "1 Turn" : `${post.turns.length} Turns`}
          </span>
          <span className="feed-card-turns-meta">
            last from {post.turns[post.turns.length - 1].authorName},{" "}
            {post.turns[post.turns.length - 1].date.slice(0, 10)}
          </span>
        </div>
      )}

      {post.thumbnailUrl && (
        <img src={post.thumbnailUrl} alt="" className="feed-card-image" />
      )}

      {!expanded && (
        <div
          className="feed-card-excerpt rich-text"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />
      )}

      {expanded && expandedText && expandedSplit && (
        <>
          <div
            className="feed-card-excerpt feed-card-expanded-text rich-text"
            dangerouslySetInnerHTML={{ __html: expandedSplit.before }}
          />
          {substackUrl && (
            <div className="subscribe-break">
              <a
                href={substackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="subscribe-button subscribe-button-inline"
              >
                <SubstackMark />
                <span>
                  Subscribe to {post.authorName} at {pronoun} Substack
                </span>
              </a>
            </div>
          )}
          {expandedSplit.after && (
            <div
              className="feed-card-excerpt feed-card-expanded-text rich-text"
              dangerouslySetInnerHTML={{ __html: expandedSplit.after }}
            />
          )}
        </>
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
        {!isPaid &&
          canExpand &&
          expanded &&
          isAggregated &&
          expandedText?.truncated && (
            <Link href={post.permalink} className="read-more-link">
              Continue reading →
            </Link>
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
