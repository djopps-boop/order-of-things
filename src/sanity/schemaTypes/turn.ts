import { defineField, defineType } from "sanity";

// A "Turn" is an elevated, attributed response to a post -- visually
// distinct from ordinary Giscus comments, added by a contributing author
// (or, in a later phase, an invited guest) rather than any reader. See the
// Turns feature handoff doc for the full design; this schema covers only
// the core, always-on-author case (§1/§2 of that doc) -- guest turns need
// the not-yet-built guestPerson/guestToken types and submission endpoint.
export const turn = defineType({
  name: "turn",
  title: "Turn",
  type: "document",
  fields: [
    defineField({
      name: "post",
      title: "Post",
      type: "reference",
      to: [{ type: "post" }],
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
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    {
      title: "Published, oldest first",
      name: "publishedAtAsc",
      by: [{ field: "publishedAt", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      authorName: "author.name",
      postTitle: "post.title",
      publishedAt: "publishedAt",
    },
    prepare({ authorName, postTitle, publishedAt }) {
      return {
        title: `${authorName ?? "Unknown"} on "${postTitle ?? "unknown post"}"`,
        subtitle: publishedAt,
      };
    },
  },
});
