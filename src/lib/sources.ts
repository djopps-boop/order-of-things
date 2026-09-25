// Confirmed list of Substack newsletters to aggregate from (Step 3 of the
// build plan). Each writer's own posts are pulled in only when tagged with
// the inclusion marker in the subtitle field — see the build plan for the
// marker-based filtering rule. Not yet wired up to an actual RSS fetch;
// this is the source-of-truth list for when that pipeline is built.
//
// Daniel Oppenheimer's own newsletter (Eminent Americans) is included here
// like everyone else's, rather than treated as a special "native" identity —
// the group blog itself is named The Order of Things, distinct from any
// single contributor's newsletter name.
//
// Ordered alphabetically by (last word of) authorName -- this is also the
// order the Contributors sidebar renders in, since Sidebar.tsx maps over
// this array directly without re-sorting.

export interface NewsletterSource {
  authorName: string;
  authorSlug: string;
  newsletterName: string;
  url: string;
  note?: string;
  // Used in the per-post "Subscribe to [name] at [pronoun] Substack" CTA.
  // Defaults to "his" when absent, since that covers most of the current
  // list -- only set explicitly for contributors who use "her".
  pronoun?: "his" | "her";
}

export const newsletterSources: NewsletterSource[] = [
  {
    authorName: "Gnocchic Apocryphon",
    authorSlug: "gnocchic-apocryphon",
    newsletterName: "Gnocchic Codices",
    url: "https://gnocchiccodices.substack.com",
    note: "Pen name — used as-is for the byline.",
  },
  {
    authorName: "Henry Begler",
    authorSlug: "henry-begler",
    newsletterName: "A Good Hard Stare",
    url: "https://agoodhardstare.substack.com",
  },
  {
    authorName: "William Deresiewicz",
    authorSlug: "william-deresiewicz",
    newsletterName: "Derisivist",
    url: "https://deresiewicz.substack.com",
  },
  {
    authorName: "John Encaustum",
    authorSlug: "john-encaustum",
    newsletterName: "The Blackthorn Hedge",
    url: "https://blackthornhedge.substack.com",
    note: "Pen name — used as-is for the byline.",
  },
  {
    authorName: "Mary Jane Eyre",
    authorSlug: "mary-jane-eyre",
    newsletterName: "The extremely difficult realisation",
    url: "https://maryjaneeyre.substack.com",
    note: "Pen name — used as-is for the byline.",
    pronoun: "her",
  },
  {
    authorName: "Paul Franz",
    authorSlug: "paul-franz",
    newsletterName: "ashes and sparks",
    url: "https://ashesandsparks.substack.com",
  },
  {
    authorName: "Sam Kahn",
    authorSlug: "sam-kahn",
    newsletterName: "Castalia",
    url: "https://samkahn.substack.com",
  },
  {
    authorName: "Naomi Kanakia",
    authorSlug: "naomi-kanakia",
    newsletterName: "Woman of Letters",
    url: "https://www.woman-of-letters.com",
    pronoun: "her",
  },
  {
    authorName: "Shreeharsh Kelkar",
    authorSlug: "shreeharsh-kelkar",
    newsletterName: "Technology and Society",
    url: "https://computingandsociety.substack.com",
  },
  {
    authorName: "Jeffrey Lawrence",
    authorSlug: "jeffrey-lawrence",
    newsletterName: "Avenues of the Americas",
    url: "https://avenuesofamericas.substack.com",
  },
  {
    authorName: "Daniel Oppenheimer",
    authorSlug: "daniel-oppenheimer",
    newsletterName: "Eminent Americans",
    url: "https://danieloppenheimer.substack.com",
  },
  {
    authorName: "Mark Oppenheimer",
    authorSlug: "mark-oppenheimer",
    newsletterName: "Oppenheimer",
    url: "https://markoppenheimer.substack.com",
  },
  {
    authorName: "John Pistelli",
    authorSlug: "john-pistelli",
    newsletterName: "Grand Hotel Abyss",
    url: "https://grandhotelabyss.substack.com",
  },
  {
    authorName: "Emmett Rensin",
    authorSlug: "emmett-rensin",
    newsletterName: "The Lunatic Fringe",
    url: "https://lunaticfringe.substack.com",
  },
  {
    authorName: "George Scialabba",
    authorSlug: "george-scialabba",
    newsletterName: "Lingua Franca",
    url: "https://georgescialabba594281.substack.com",
  },
  {
    authorName: "David Sessions",
    authorSlug: "david-sessions",
    newsletterName: "Listening Sessions",
    url: "https://www.hdavidsessions.com",
  },
  {
    authorName: "Blake Smith",
    authorSlug: "blake-smith",
    newsletterName: "Blake Smith",
    url: "https://blakeesmith.substack.com",
  },
  {
    authorName: "Julianne Werlin",
    authorSlug: "julianne-werlin",
    newsletterName: "Life and Letters",
    url: "https://lifeandletters.substack.com",
    pronoun: "her",
  },
  {
    authorName: "Daniel Wortel-London",
    authorSlug: "daniel-wortel-london",
    newsletterName: "The Economy of Community",
    url: "https://dlondon7.substack.com",
  },
];
