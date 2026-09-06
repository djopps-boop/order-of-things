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

export interface NewsletterSource {
  authorName: string;
  authorSlug: string;
  newsletterName: string;
  url: string;
  note?: string;
}

export const newsletterSources: NewsletterSource[] = [
  {
    authorName: "Daniel Oppenheimer",
    authorSlug: "daniel-oppenheimer",
    newsletterName: "Eminent Americans",
    url: "https://danieloppenheimer.substack.com",
  },
  {
    authorName: "Blake Smith",
    authorSlug: "blake-smith",
    newsletterName: "Blake Smith",
    url: "https://blakeesmith.substack.com",
  },
  {
    authorName: "Damon Linker",
    authorSlug: "damon-linker",
    newsletterName: "Notes from the Middleground",
    url: "https://damonlinker.substack.com",
  },
  {
    authorName: "Mark Oppenheimer",
    authorSlug: "mark-oppenheimer",
    newsletterName: "Oppenheimer",
    url: "https://markoppenheimer.substack.com",
  },
  {
    authorName: "Naomi Kanakia",
    authorSlug: "naomi-kanakia",
    newsletterName: "Woman of Letters",
    url: "https://www.woman-of-letters.com",
  },
  {
    authorName: "Hollis Robbins",
    authorSlug: "hollis-robbins",
    newsletterName: "Anecdotal Value",
    url: "https://hollisrobbinsanecdotal.substack.com",
  },
  {
    authorName: "Sam Kahn",
    authorSlug: "sam-kahn",
    newsletterName: "Castalia",
    url: "https://samkahn.substack.com",
  },
  {
    authorName: "Mary Jane Eyre",
    authorSlug: "mary-jane-eyre",
    newsletterName: "The extremely difficult realisation",
    url: "https://maryjaneeyre.substack.com",
    note: "Pen name — used as-is for the byline.",
  },
  {
    authorName: "George Scialabba",
    authorSlug: "george-scialabba",
    newsletterName: "George Scialabba",
    url: "https://georgescialabba594281.substack.com",
    note: "Newsletter title unconfirmed — page requires JS to render, title not yet verified.",
  },
  {
    authorName: "Henry Begler",
    authorSlug: "henry-begler",
    newsletterName: "A Good Hard Stare",
    url: "https://agoodhardstare.substack.com",
  },
  {
    authorName: "John Pistelli",
    authorSlug: "john-pistelli",
    newsletterName: "Grand Hotel Abyss",
    url: "https://grandhotelabyss.substack.com",
  },
  {
    authorName: "Julianne Werlin",
    authorSlug: "julianne-werlin",
    newsletterName: "Life and Letters",
    url: "https://lifeandletters.substack.com",
  },
  {
    authorName: "David Sessions",
    authorSlug: "david-sessions",
    newsletterName: "Listening Sessions",
    url: "https://www.hdavidsessions.com",
  },
  {
    authorName: "Sarah Hepola",
    authorSlug: "sarah-hepola",
    newsletterName: "Love Anyway",
    url: "https://sarahhepola.substack.com",
  },
  {
    authorName: "Emmett Rensin",
    authorSlug: "emmett-rensin",
    newsletterName: "The Lunatic Fringe",
    url: "https://lunaticfringe.substack.com",
  },
  {
    authorName: "John Encaustum",
    authorSlug: "john-encaustum",
    newsletterName: "The Blackthorn Hedge",
    url: "https://blackthornhedge.substack.com",
    note: "Pen name — used as-is for the byline.",
  },
  {
    authorName: "Shreeharsh Kelkar",
    authorSlug: "shreeharsh-kelkar",
    newsletterName: "Technology and Society",
    url: "https://computingandsociety.substack.com",
  },
  {
    authorName: "Gnocchic Apocryphon",
    authorSlug: "gnocchic-apocryphon",
    newsletterName: "Gnocchic Codices",
    url: "https://gnocchiccodices.substack.com",
    note: "Pen name — used as-is for the byline.",
  },
];
