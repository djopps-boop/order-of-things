import { newsletterSources } from "./sources";

export interface AuthorProfile {
  slug: string;
  name: string;
  bio: string;
  substackUrl?: string;
}

// Derived from the confirmed source list. Bios are placeholders until real
// ones are written; every confirmed contributor gets a link to their own
// Substack. Guest contributors without a newsletter (see the Sanity
// Contributor-role workflow discussed for occasional guest posts) simply
// won't appear here, and the author archive page falls back gracefully.
export function getAuthorProfile(slug: string): AuthorProfile | undefined {
  const source = newsletterSources.find((s) => s.authorSlug === slug);
  if (!source) return undefined;
  return {
    slug: source.authorSlug,
    name: source.authorName,
    bio: `[Short bio for ${source.authorName} — to be written]`,
    substackUrl: source.url,
  };
}
