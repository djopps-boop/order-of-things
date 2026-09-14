import { defineField, defineType } from "sanity";

// Matches src/lib/authors.ts (AuthorProfile): name, slug, bio, and a link to
// their own Substack. Every post's byline resolves to one of these.
//
// `email` (added for the Turns feature) is used only by the "Take a Turn"
// Studio document action (src/sanity/actions/takeATurn.ts) to map a logged-
// in Studio user to their author document -- not shown anywhere on the
// public site.
export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      description: "Shown at the top of this author's archive page",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      description:
        "Used to match this author to their Studio login for the 'Take a Turn' action -- not displayed publicly",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "substackUrl",
      title: "Substack URL",
      type: "url",
      description: "Optional — linked from the author archive page",
    }),
  ],
  preview: {
    select: { title: "name" },
  },
});
