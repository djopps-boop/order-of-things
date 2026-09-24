import { createHash } from "crypto";
import { client } from "./client";
import { writeClient } from "./writeClient";
import { Post } from "@/lib/types";

// Stable across builds -- the whole point of keying by this instead of a
// fresh ID each time is that createIfNotExists below is a genuine no-op on
// every build after the first for the same source post, not a chance to
// create a duplicate. Hashed rather than slugified directly: a raw
// Substack URL isn't a safe or length-bounded Sanity document ID on its
// own, and this only ever needs to be stable and collision-resistant, not
// human-readable.
export function idForSourceUrl(sourceUrl: string): string {
  return `aggregated-${createHash("sha1").update(sourceUrl).digest("hex").slice(0, 16)}`;
}

async function findAuthorIdBySlug(authorSlug: string): Promise<string | null> {
  const result = await client.fetch<{ _id: string } | null>(
    `*[_type == "author" && slug.current == $authorSlug][0]{ _id }`,
    { authorSlug }
  );
  return result?._id ?? null;
}

// Gives an aggregated post a permanent Sanity identity the first time
// something needs to point at it (so far: a Turn) -- see the "lazy
// persistence" design in the session notes. Safe to call every build for
// an already-adopted post too: createIfNotExists is a genuine no-op once
// the document exists, and the patch that follows it keeps the persisted
// copy synced against the still-live Substack source. Content goes into
// bodyHtml/excerptHtml (see post.ts), not the Portable Text body/excerpt
// fields real Studio-authored posts use -- sourcePost.body/excerpt are
// already sanitized HTML from rss.ts, so this is a direct copy, not a
// conversion.
//
// Returns null (never throws) if the write token isn't configured yet, if
// sourcePost has no sourceUrl (shouldn't happen for anything actually
// aggregated, but the type allows it), if no author document matches the
// contributor's slug, or if anything about the write itself fails -- every
// caller treats null as "keep treating this as ephemeral RSS content for
// this build," exactly how it behaved before this feature existed.
export async function syncOrAdoptAggregatedPost(sourcePost: Post): Promise<Post | null> {
  if (!writeClient || !sourcePost.sourceUrl) return null;

  const id = idForSourceUrl(sourcePost.sourceUrl);

  try {
    const authorId = await findAuthorIdBySlug(sourcePost.authorSlug);
    if (!authorId) {
      console.warn(
        `[adopt] no author document matches slug "${sourcePost.authorSlug}" -- skipping adoption for "${sourcePost.title}"`
      );
      return null;
    }

    // Only ever sets fields needed to satisfy required validation on
    // first creation (slug, author, publishedAt, origin, sourceUrl) --
    // everything that should track the live source is set by the patch
    // below instead, every time, so an existing adoption stays fresh too.
    await writeClient.createIfNotExists({
      _id: id,
      _type: "post",
      origin: "aggregated",
      sourceUrl: sourcePost.sourceUrl,
      slug: { _type: "slug", current: sourcePost.slug },
      author: { _type: "reference", _ref: authorId },
      publishedAt: new Date(sourcePost.date).toISOString(),
    });

    await writeClient
      .patch(id)
      .set({
        title: sourcePost.title,
        newsletterName: sourcePost.newsletterName ?? "",
        access: sourcePost.access ?? "free",
        excerptHtml: sourcePost.excerpt,
        bodyHtml: sourcePost.body ?? "",
        tags: sourcePost.tags,
      })
      .commit();

    return { ...sourcePost, sanityId: id };
  } catch (err) {
    console.warn(
      `[adopt] could not sync/adopt "${sourcePost.title}" (${sourcePost.sourceUrl}): ${
        err instanceof Error ? err.message : err
      }`
    );
    return null;
  }
}
