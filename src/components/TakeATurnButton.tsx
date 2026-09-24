"use client";

import { useSyncExternalStore } from "react";
import { CONTRIBUTOR_SESSION_KEY } from "@/sanity/ContributorSessionBridge";

// Refreshed every time a contributor opens Studio (see
// ContributorSessionBridge) -- 24h is long enough that a contributor
// browsing the site the same day they last opened Studio still sees the
// button, short enough that someone who's stopped contributing doesn't see
// a stale "yes" indefinitely.
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

// useSyncExternalStore rather than a plain effect+setState: localStorage is
// exactly the "external, non-React data source" this hook exists for, and
// unlike a lazy useState initializer, getServerSnapshot keeps the static
// build's server-rendered HTML (which never has a contributor session)
// from mismatching the client's real value during hydration. The "storage"
// subscription is only a nice-to-have for two tabs open side by side --
// the core case (visit Studio, then later navigate to a post page) is
// already a fresh mount, so it re-reads regardless.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readIsContributor(): boolean {
  try {
    const raw = window.localStorage.getItem(CONTRIBUTOR_SESSION_KEY);
    if (!raw) return false;
    const { checkedAt } = JSON.parse(raw) as { checkedAt?: number };
    if (typeof checkedAt === "number" && Date.now() - checkedAt < MAX_SESSION_AGE_MS) {
      return true;
    }
    window.localStorage.removeItem(CONTRIBUTOR_SESSION_KEY);
    return false;
  } catch {
    // Malformed value, or storage unavailable -- either way, just don't
    // show the button rather than risk showing it wrongly.
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false; // the static build never has a contributor session
}

// Invisible to ordinary readers. Only ever renders for someone who is both
// a matched contributor (per author.email) and has opened /studio recently
// enough in this same browser for the flag ContributorSessionBridge writes
// to still be fresh. Routes into the existing "Take a Turn" Studio action
// rather than any new composer, via Sanity's own intent-link format.
export default function TakeATurnButton({ postId }: { postId?: string }) {
  const isContributor = useSyncExternalStore(subscribe, readIsContributor, getServerSnapshot);

  if (!isContributor || !postId) return null;

  return (
    <a
      href={`/studio/intent/edit/id=${postId};type=post`}
      className="take-a-turn-button"
    >
      ✎ Take a Turn on this
    </a>
  );
}
