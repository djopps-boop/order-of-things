// Manual, hand-reviewed tags for posts already imported as of Sept 2026.
//
// Why this exists: each aggregated post's tags normally come straight from
// the RSS <category> element (see rss.ts), but almost no contributor
// actually sets categories on Substack, so the tag cloud/tag pages were
// nearly empty. These were drafted by reading each currently-imported
// post's actual content.
//
// Two layers of tags, deliberately kept separate:
//  1. Four broad nav categories (ideas, politics, technology, culture) --
//     what the site's top nav links to (see Header.tsx).
//  2. A condensed, reusable topic vocabulary (18 tags below, e.g.
//     "literary-criticism", "higher-education", "queer-culture") -- more
//     specific than the four nav categories, but deliberately NOT the
//     hyper-specific one-off tags an earlier draft used (individual
//     people's names, book titles, etc.), which almost never recur across
//     posts and wouldn't generalize to future ones either. Picking from a
//     fixed, shared vocabulary instead means the tag cloud stays coherent
//     and useful as more posts get added, rather than accumulating
//     hundreds of tags each used exactly once.
//
// This is a one-time snapshot, not a live process: it won't cover posts
// imported after this was written. rss.ts merges these in alongside
// whatever (if any) RSS categories a post has, rather than replacing them.
// Revisit and extend this list periodically as new posts come in, or once
// contributors start using Substack's own category field -- and when you
// do, prefer reusing one of the 18 topic tags above over inventing a new
// one-off tag, unless a genuinely new recurring theme has emerged.
export const TAG_OVERRIDES: Record<string, string[]> = {
  "the-puzzle-of-gender-identity": ["gender-and-sexuality", "social-theory", "politics", "ideas"],
  "testing": ["site-testing"],
  "paglias-exaggerations": ["literary-criticism", "gender-and-sexuality", "ideas"],
  "the-way-we-live-now": ["literary-criticism", "queer-culture", "culture", "ideas"],
  "why-i-kicked-technology-out-of-my": ["higher-education", "technology-and-society", "technology"],
  "from-outrage-to-disgust": ["politics"],
  "will-this-college-dropout-be-alaskas": ["politics"],
  "is-ai-good-for-religion": ["artificial-intelligence", "religion", "technology", "ideas"],
  "life-of-m": ["fiction-and-the-novel", "literary-criticism", "ideas"],
  "manufacturedcharges": ["media-and-publishing", "artificial-intelligence", "ideas", "technology"],
  "look-on-my-outcomes-ye-mighty-and": ["higher-education", "politics"],
  "two-new-ways-to-see-your-university": ["higher-education", "artificial-intelligence", "technology"],
  "four-phases-of-culture": ["social-theory", "media-and-publishing", "ideas"],
  "what-is-the-ethics-of-our-society": ["political-philosophy", "ideas", "politics"],
  "an-increase-of-comprehension": ["intellectual-history", "literary-criticism", "ideas"],
  "bankside-tate-modern-tracey-emin": ["visual-art", "culture"],
  "discourse": ["literary-criticism", "film-and-pop-culture", "ideas", "culture"],
  "at-the-foot-of-the-peak": ["literary-criticism", "ideas"],
  "weekly-readings-238-083026-090626": ["literary-criticism", "artificial-intelligence", "ideas", "technology"],
  "the-invisible-college-roberto-bolanos": ["literary-criticism", "ideas"],
  "authorship-after-the-internet": ["media-and-publishing", "intellectual-history", "ideas", "technology"],
  "why-this-is-hell-the-faust-myth": ["literary-criticism", "fiction-and-the-novel", "ideas"],
  "andrew-holleran-gossip-dancer-from-the-dance": ["queer-culture", "culture"],
  "market-nights": ["queer-culture", "culture"],
  "i-sat-down-to-write-about-love-but": ["true-crime", "literary-criticism", "culture"],
  "10-best-rom-coms-that-might-not-be": ["film-and-pop-culture", "culture"],
  "ghost-stories-no-3": ["true-crime", "mental-health", "culture"],
  "lindsay-clancys-madness-and-ours": ["true-crime", "mental-health", "culture", "politics"],
  "social-shadows-and-social-light": ["social-theory", "artificial-intelligence", "technology", "ideas"],
  "the-ages-of-schmeason": ["intellectual-history", "philosophy", "ideas"],
  "anthropomorphism-is-built-into-the": ["artificial-intelligence", "philosophy", "technology", "ideas"],
  "what-is-public-opposition-to-data": ["technology-and-society", "politics", "technology"],
  "these-fragments-zwei": ["literary-criticism", "ideas"],
  "some-great-books-of-the-20th-century": ["literary-criticism", "philosophy", "ideas"],
};
