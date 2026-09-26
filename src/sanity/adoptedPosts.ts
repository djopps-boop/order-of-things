import { createHash } from "crypto";
import { client } from "./client";
import { writeClient } from "./writeClient";
import { Post } from "@/lib/types";
import { newsletterSources } from "@/lib/sources";

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

// Stable across builds for the same reason idForSourceUrl above is --
// createIfNotExists below only stays a genuine no-op if this doesn't
// change from one build to the next.
function idForAuthorSlug(authorSlug: string): string {
  return `author-${authorSlug}`;
}

// A post can only be adopted once it has an author document to reference
// (see the required `author` field on creation below) -- originally this
// just looked one up and gave up if none existed yet, which meant a
// contributor's posts silently never adopted (no "Take a Turn" button
// anywhere, on the feed or their own post page) until someone went into
// Studio and hand-created an Author document for them first. Every
// contributor already has a name/slug/Substack URL in sources.ts (that's
// how the RSS aggregator finds their feed in the first place), so this
// auto-creates a minimal Author document from that instead of requiring
// the manual step -- the same "lazily persist the first time something
// needs it" pattern syncOrAdoptAggregatedPost below already uses for the
// post itself. A contributor's own `email` field (used only by the "Take
// a Turn" Studio action to match a logged-in user to their author doc --
// see author.ts) is left unset either way; nothing here needs it, and
// they can add it themselves in Studio whenever they want that action to
// recognize their own login.
async function findOrCreateAuthorIdBySlug(authorSlug: string): Promise<string | null> {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "author" && slug.current == $authorSlug][0]{ _id }`,
    { authorSlug }
  );
  if (existing?._id) return existing._id;

  if (!writeClient) return null;
  const source = newsletterSources.find((s) => s.authorSlug === authorSlug);
  if (!source) return null;

  const id = idForAuthorSlug(authorSlug);
  await writeClient.createIfNotExists({
    _id: id,
    _type: "author",
    name: source.authorName,
    slug: { _type: "slug", current: source.authorSlug },
    substackUrl: source.url,
  });
  return id;
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
// aggregated, but the type allows it), if the contributor's slug matches
// no entry in sources.ts at all (shouldn't happen either, for the same
// reason), or if anything about the write itself fails -- every caller
// treats null as "keep treating this as ephemeral RSS content for this
// build," exactly how it behaved before this feature existed.
export async function syncOrAdoptAggregatedPost(sourcePost: Post): Promise<Post | null> {
  if (!writeClient || !sourcePost.sourceUrl) return null;

  const id = idForSourceUrl(sourcePost.sourceUrl);

  try {
    const authorId = await findOrCreateAuthorIdBySlug(sourcePost.authorSlug);
    if (!authorId) {
      console.warn(
        `[adopt] no author document (and no matching sources.ts entry to create one from) for slug "${sourcePost.authorSlug}" -- skipping adoption for "${sourcePost.title}"`
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
