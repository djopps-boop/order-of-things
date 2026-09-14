import { useEffect, useState } from "react";
import {
  DocumentActionComponent,
  DocumentActionProps,
  useClient,
  useCurrentUser,
} from "sanity";
import { useRouter } from "sanity/router";
import { apiVersion } from "../env";

// "Take a Turn" -- lets a logged-in contributor add an elevated, attributed
// response to the post they're viewing (see the Turns feature handoff doc,
// §2). Only shown once the logged-in Studio user's email has been matched
// to an `author` document (see the `email` field added to author.ts) --
// there's no author to attach the turn to otherwise. Registered on every
// document type in sanity.config.ts; this component itself is what
// restricts it to `post` documents, so it degrades gracefully (renders
// nothing) anywhere else rather than needing a separate resolver-side type
// check.
//
// Guest turns (handoff doc §3/§6 -- guestPerson, guestToken, the public
// submission endpoint) are a separate, not-yet-built path and don't go
// through this action at all.
export const TakeATurnAction: DocumentActionComponent = (
  props: DocumentActionProps
) => {
  const { id, type } = props;
  const client = useClient({ apiVersion });
  const currentUser = useCurrentUser();
  const router = useRouter();
  // undefined = still checking; null = no matching author (or not
  // applicable); string = the matched author document's _id.
  const [authorId, setAuthorId] = useState<string | null | undefined>(
    undefined
  );
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (type !== "post") return;
    const email = currentUser?.email;
    if (!email) {
      setAuthorId(null);
      return;
    }
    let cancelled = false;
    client
      .fetch<{ _id: string } | null>(
        `*[_type == "author" && email == $email][0]{ _id }`,
        { email }
      )
      .then((author) => {
        if (!cancelled) setAuthorId(author?._id ?? null);
      })
      .catch(() => {
        if (!cancelled) setAuthorId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [client, currentUser?.email, type]);

  if (type !== "post") return null;
  if (!authorId) return null; // still checking, or no author match for this login

  return {
    label: isCreating ? "Creating turn…" : "Take a Turn",
    onHandle: async () => {
      setIsCreating(true);
      try {
        const created = await client.create({
          _type: "turn",
          post: { _type: "reference", _ref: id },
          author: { _type: "reference", _ref: authorId },
          publishedAt: new Date().toISOString(),
        });
        props.onComplete();
        router.navigateIntent("edit", { id: created._id, type: "turn" });
      } finally {
        setIsCreating(false);
      }
    },
  };
};
