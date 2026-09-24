import { defineField, defineType } from "sanity";

// Matches src/lib/types.ts (Post). Two very different ways a document here
// gets created: (1) a contributor writes directly in Studio -- title
// through featuredImage below, origin left at its "native" default; (2) an
// aggregated (Substack) post gets lazily adopted the first time a Turn
// needs to point at it, via the write client in adoptedPosts.ts -- origin
// "aggregated" plus the four fields after featuredImage, which stay out of
// a contributor's way entirely otherwise (hidden unless origin is already
// "aggregated", which nothing in the Studio UI itself ever sets -- only
// the automated adoption process does). Content for an adopted post lives
// in bodyHtml/excerptHtml (plain sanitized HTML, exactly what rss.ts
// already produces) rather than the Portable Text body/excerpt fields
// below, deliberately -- converting Substack's HTML into Portable Text
// automatically is a real, separate piece of machinery this doesn't need,
// since it only ever gets redisplayed as HTML anyway.
export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      description: "Always shown in the feed — roughly 150 words",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if ((context.document as { origin?: string })?.origin === "aggregated") return true;
          return value ? true : "Required";
        }),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Left empty until the tag taxonomy is reverse-engineered from real posts",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "featuredImage",
      title: "Featured image",
      type: "image",
      options: { hotspot: true },
      description:
        "Optional. Only shown in the feed if present — not every post needs one",
    }),
    defineField({
      name: "origin",
      title: "Origin",
      type: "string",
      options: { list: ["native", "aggregated"] },
      initialValue: "native",
      readOnly: true,
      description:
        "Set automatically -- \"aggregated\" only ever comes from the lazy-adoption process, never from a human toggling this.",
    }),
    defineField({
      name: "sourceUrl",
      title: "Source URL (Substack)",
      type: "url",
      hidden: ({ document }) => (document as { origin?: string })?.origin !== "aggregated",
      readOnly: true,
      description: "The original Substack post this was adopted from -- the dedup key synced against on every build.",
    }),
    defineField({
      name: "newsletterName",
      title: "Newsletter name",
      type: "string",
      hidden: ({ document }) => (document as { origin?: string })?.origin !== "aggregated",
      readOnly: true,
    }),
    defineField({
      name: "access",
      title: "Access",
      type: "string",
      options: { list: ["free", "paid"] },
      hidden: ({ document }) => (document as { origin?: string })?.origin !== "aggregated",
      readOnly: true,
    }),
    defineField({
      name: "bodyHtml",
      title: "Body (HTML, synced)",
      type: "text",
      hidden: ({ document }) => (document as { origin?: string })?.origin !== "aggregated",
      readOnly: true,
      description:
        "Raw sanitized HTML, kept in sync with the live Substack source while it's still live -- see sourceUrl. Empty for a paid post (the site never fetches paid content in full).",
    }),
    defineField({
      name: "excerptHtml",
      title: "Excerpt (HTML, synced)",
      type: "text",
      hidden: ({ document }) => (document as { origin?: string })?.origin !== "aggregated",
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: "Published, newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", authorName: "author.name" },
    prepare({ title, authorName }) {
      return { title, subtitle: authorName };
    },
  },
});
