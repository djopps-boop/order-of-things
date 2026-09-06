"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// Giscus: comments backed by GitHub Discussions. Chosen deliberately for the
// friction of requiring commenters to have a GitHub account — a light
// barrier against bad-faith actors, without taking on custom moderation
// infrastructure ourselves.
//
// These four values are placeholders. Giscus requires a real, public GitHub
// repo with Discussions enabled and the giscus app installed (Step 6 of the
// build plan creates that repo). Once it exists, generate the real values at
// https://giscus.app and swap them in here.
const GISCUS_CONFIG = {
  repo: "[github-owner]/[repo-name]",
  repoId: "[REPO_ID_FROM_GISCUS_APP]",
  category: "Comments",
  categoryId: "[CATEGORY_ID_FROM_GISCUS_APP]",
};

export default function Comments() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", GISCUS_CONFIG.repo);
    script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
    script.setAttribute("data-category", GISCUS_CONFIG.category);
    script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "en");

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <section id="comments" className="comments-section">
      <h2>Comments</h2>
      <p className="comments-note">
        Signing in with a GitHub account is required to comment.
      </p>
      <div ref={containerRef} className="giscus-container" />
      <p className="comments-policy-link">
        <Link href="/comments-policy">Read the comments policy</Link>
      </p>
    </section>
  );
}
