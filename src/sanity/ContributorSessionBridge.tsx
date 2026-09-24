import { useEffect } from "react";
import { useClient, useCurrentUser } from "sanity";
import { apiVersion } from "./env";

// Mounted globally via studio.components.layout in sanity.config.ts (not
// gated to `post` documents, unlike the "Take a Turn" action itself) so it
// runs no matter what a contributor has open in Studio. Its only job is
// to mirror "is this a matched contributor" into localStorage on the
// site's shared origin, so the public-facing TakeATurnButton
// (src/components/TakeATurnButton.tsx) can check it without any
// cross-origin auth request of its own -- Sanity's own login session is
// checked via a cookie scoped to Sanity's domain, which is a third-party
// cookie from the public site's point of view and can't be relied on
// (Safari blocks these by default). Checking here, first-party, inside
// Studio, sidesteps that entirely.
//
// Deliberately duplicates the small email->author GROQ lookup in
// actions/takeATurn.ts rather than sharing a hook: that action is gated to
// `type === "post"` and skips the fetch entirely for every other document
// type, while this one has to run unconditionally regardless of what's
// open. Worth factoring into one shared hook if a third consumer ever
// needs this same check -- not worth the coupling for two.
export const CONTRIBUTOR_SESSION_KEY = "oot_contributor_session";

export function ContributorSessionBridge() {
  const client = useClient({ apiVersion });
  const currentUser = useCurrentUser();

  useEffect(() => {
    const email = currentUser?.email;
    if (!email) {
      window.localStorage.removeItem(CONTRIBUTOR_SESSION_KEY);
      return;
    }
    let cancelled = false;
    client
      .fetch<{ _id: string } | null>(
        `*[_type == "author" && email == $email][0]{ _id }`,
        { email }
      )
      .then((author) => {
        if (cancelled) return;
        if (author?._id) {
          window.localStorage.setItem(
            CONTRIBUTOR_SESSION_KEY,
            JSON.stringify({ authorId: author._id, checkedAt: Date.now() })
          );
        } else {
          window.localStorage.removeItem(CONTRIBUTOR_SESSION_KEY);
        }
      })
      .catch(() => {
        // A failed lookup shouldn't leave a stale "yes" flag sitting
        // around from a previous, possibly different login.
        if (!cancelled) window.localStorage.removeItem(CONTRIBUTOR_SESSION_KEY);
      });
    return () => {
      cancelled = true;
    };
  }, [client, currentUser?.email]);

  return null;
}
