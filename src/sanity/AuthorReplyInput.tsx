import { useEffect, useState } from "react";
import { useClient, useCurrentUser, useFormValue } from "sanity";
import type { ArrayOfObjectsInputProps } from "sanity";
import { apiVersion } from "./env";

// Restricts the Turn schema's authorReply field so only the ORIGINAL
// POST's author (not the Turn's own author, not any other contributor) can
// see or edit it in Studio -- mirrors the author-matching pattern in
// actions/takeATurn.ts and ContributorSessionBridge.tsx, applied at the
// field level instead. Everyone else simply doesn't see this field in the
// form at all, rather than seeing it disabled/read-only -- keeps a
// contributor editing someone else's Turn from even noticing there's a
// reply slot they can't use.
//
// Deliberately its own small email->author lookup rather than sharing a
// hook with the other two consumers -- see ContributorSessionBridge's own
// comment on why: three call sites with three slightly different questions
// ("am I logged in at all", "am I this turn's author", "am I this turn's
// PARENT POST's author") isn't yet worth the coupling of one shared hook.
export function AuthorReplyInput(props: ArrayOfObjectsInputProps) {
  const client = useClient({ apiVersion });
  const currentUser = useCurrentUser();
  const postRef = useFormValue(["post", "_ref"]) as string | undefined;
  const [canEdit, setCanEdit] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const email = currentUser?.email;
      if (!email || !postRef) {
        if (!cancelled) setCanEdit(false);
        return;
      }
      try {
        const post = await client.fetch<{ postAuthorId: string | null } | null>(
          `*[_id == $postRef][0]{ "postAuthorId": author._ref }`,
          { postRef }
        );
        if (cancelled) return;
        if (!post?.postAuthorId) {
          setCanEdit(false);
          return;
        }
        const loggedInAuthor = await client.fetch<{ _id: string } | null>(
          `*[_type == "author" && email == $email][0]{ _id }`,
          { email }
        );
        if (!cancelled) setCanEdit(loggedInAuthor?._id === post.postAuthorId);
      } catch {
        if (!cancelled) setCanEdit(false);
      }
    }

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [client, currentUser?.email, postRef]);

  if (!canEdit) return null; // covers both "still checking" and "not this post's author"

  return props.renderDefault(props);
}
