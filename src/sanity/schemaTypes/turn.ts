import { defineField, defineType } from "sanity";
import { AuthorReplyInput } from "../AuthorReplyInput";

// A "Turn" is an elevated, attributed response to a post -- visually
// distinct from ordinary Giscus comments. Two ways one gets created:
// (1) a contributing author uses the "Take a Turn" Studio action (the
// common case -- author + body below); (2) an editor or the post's own
// author manually promotes an exceptional reader comment into Turn-space
// for that post (isGuest + guestName/guestCommentUrl below, body
// transcribed from the comment being promoted). Self-service guest
// submission via an invite token is a separate, still-deferred phase --
// see the Turns feature handoff doc; nothing here builds toward that.
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
      name: "isGuest",
      title: "Guest Turn (promoted from a comment)",
      description:
        "On for a reader comment an editor is promoting into Turn-space rather than something a contributor wrote. Swaps the Author reference below for the guest fields.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      hidden: ({ parent }) => !!(parent as { isGuest?: boolean })?.isGuest,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if ((context.parent as { isGuest?: boolean })?.isGuest) return true;
          return value ? true : "Required unless this is a guest turn";
        }),
    }),
    defineField({
      name: "guestName",
      title: "Guest name",
      type: "string",
      hidden: ({ parent }) => !(parent as { isGuest?: boolean })?.isGuest,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!(context.parent as { isGuest?: boolean })?.isGuest) return true;
          return value ? true : "Required for a guest turn";
        }),
    }),
    defineField({
      name: "guestCommentUrl",
      title: "Original comment link",
      description:
        "The GitHub Discussion comment being promoted (use the copy-link icon next to it in Recent Comments) -- credited in place of an author bio link on the public site, since guests don't have one.",
      type: "url",
      hidden: ({ parent }) => !(parent as { isGuest?: boolean })?.isGuest,
      validation: (Rule) =>
        Rule.uri({ scheme: ["http", "https"] }).custom((value, context) => {
          if (!(context.parent as { isGuest?: boolean })?.isGuest) return true;
          return value ? true : "Required for a guest turn";
        }),
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
    defineField({
      name: "authorReply",
      title: "Author Reply",
      description:
        "Only ever visible here to the original post's author, not this Turn's own author or any other contributor -- everyone else won't see this field in the form at all. Renders on the public site nested inside this Turn, visually set apart from the Turn's own text.",
      type: "array",
      of: [{ type: "block" }],
      components: { input: AuthorReplyInput },
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
      guestName: "guestName",
      isGuest: "isGuest",
      postTitle: "post.title",
      publishedAt: "publishedAt",
    },
    prepare({ authorName, guestName, isGuest, postTitle, publishedAt }) {
      const who = isGuest ? `${guestName ?? "Unnamed guest"} (guest)` : authorName ?? "Unknown";
      return {
        title: `${who} on "${postTitle ?? "unknown post"}"`,
        subtitle: publishedAt,
      };
    },
  },
});
