// Manual, hand-reviewed tags for posts already imported as of Sept 2026.
//
// Why this exists: each aggregated post's tags normally come straight from
// the RSS <category> element (see rss.ts), but almost no contributor
// actually sets categories on Substack, so the tag cloud/tag pages were
// nearly empty. These were drafted by reading each currently-imported
// post's actual content and picking specific, topical tags -- keyed by
// post slug so they attach to the right post regardless of which
// newsletter it came from.
//
// Each post also gets one or two broad category tags (ideas, politics,
// technology, culture) appended alongside its specific tags -- these are
// the four umbrella categories the site's top nav links to (see
// Header.tsx). Without them, the nav shortcuts would point at empty tag
// pages: a post's specific tags (e.g. "camille-paglia", "ai-safety") don't
// automatically belong to a broader category, so that categorization has
// to be assigned by hand here too.
//
// This is a one-time snapshot, not a live process: it won't cover posts
// imported after this was written. rss.ts merges these in alongside
// whatever (if any) RSS categories a post has, rather than replacing them.
// Revisit and extend this list periodically as new posts come in, or once
// contributors start using Substack's own category field.
export const TAG_OVERRIDES: Record<string, string[]> = {
  "the-puzzle-of-gender-identity": ["gender-identity", "rogers-brubaker", "trans-rights-backlash", "judith-butler", "sociology-of-categories", "politics", "ideas"],
  "testing": ["site-testing"],
  "paglias-exaggerations": ["camille-paglia", "sexual-personae", "judith-butler", "harvey-mansfield", "ideas"],
  "the-way-we-live-now": ["susan-sontag", "new-york-native", "andrew-holleran", "gay-press-history", "culture", "ideas"],
  "why-i-kicked-technology-out-of-my": ["classroom-technology-bans", "tech-free-teaching", "higher-education", "technology"],
  "from-outrage-to-disgust": ["donald-trump", "us-iran-war", "political-disgust", "politics"],
  "will-this-college-dropout-be-alaskas": ["jonathan-kreiss-tomkins", "alaska-politics", "alaska-governor-race", "politics"],
  "is-ai-good-for-religion": ["ai-and-religion", "andy-crouch", "leah-libresco-sargeant", "technology", "ideas"],
  "life-of-m": ["rachel-cusk", "natalie-portman", "autofiction", "ideas"],
  "manufacturedcharges": ["ross-barkan", "plagiarism-accusations", "ai-editorial-decisions", "ideas", "technology"],
  "look-on-my-outcomes-ye-mighty-and": ["learning-outcomes", "higher-ed-bureaucracy", "academic-hiring", "politics"],
  "two-new-ways-to-see-your-university": ["ai-in-higher-education", "ai-campus-index", "university-rankings", "technology"],
  "four-phases-of-culture": ["yanis-varoufakis-minotaur", "cultural-production", "publishing-industry", "ideas"],
  "what-is-the-ethics-of-our-society": ["neoliberalism", "alexandre-lefebvre", "post-liberalism", "john-rawls", "ideas", "politics"],
  "an-increase-of-comprehension": ["public-intellectuals", "heinrich-heine", "intellectual-history", "ideas"],
  "bankside-tate-modern-tracey-emin": ["tracey-emin", "tate-modern", "london-photo-essay", "culture"],
  "discourse": ["bob-dylan", "nobel-prize-in-literature", "literary-criticism", "ideas", "culture"],
  "at-the-foot-of-the-peak": ["leo-robson", "criticism-as-art-form", "ideas-letter-interview", "ideas"],
  "weekly-readings-238-083026-090626": ["books-i-wish-id-written", "simone-weil", "harold-bloom", "ai-and-culture", "ideas", "technology"],
  "the-invisible-college-roberto-bolanos": ["roberto-bolano", "savage-detectives", "invisible-college-series", "ideas"],
  "authorship-after-the-internet": ["aarthi-vadde", "digital-platforms", "authorship-history", "erasmus", "ideas", "technology"],
  "why-this-is-hell-the-faust-myth": ["faust-myth", "christopher-marlowe", "karl-ove-knausgaard", "ideas"],
  "andrew-holleran-gossip-dancer-from-the-dance": ["andrew-holleran", "dancer-from-the-dance", "fire-island", "culture"],
  "market-nights": ["chicago-nightlife", "gay-bar-culture", "circuit-parties", "culture"],
  "i-sat-down-to-write-about-love-but": ["true-crime-culture", "manson-murders", "joan-didion", "camille-paglia", "culture"],
  "10-best-rom-coms-that-might-not-be": ["romantic-comedies", "film-canon", "movie-nostalgia", "culture"],
  "ghost-stories-no-3": ["schizophrenia", "missing-persons-alerts", "psych-evaluation-podcast", "culture"],
  "lindsay-clancys-madness-and-ours": ["lindsay-clancy", "insanity-defense", "postpartum-psychosis", "culture", "politics"],
  "social-shadows-and-social-light": ["jungian-shadow", "ai-safety", "mass-psychology-of-fascism", "technology", "ideas"],
  "the-ages-of-schmeason": ["giambattista-vico", "barbarism-of-reflection", "volney", "ideas"],
  "anthropomorphism-is-built-into-the": ["ai-anthropomorphism", "phil-agre", "philosophy-of-ai", "technology", "ideas"],
  "what-is-public-opposition-to-data": ["data-center-backlash", "cambridge-analytica", "big-tech-backlash", "technology", "politics"],
  "these-fragments-zwei": ["reactionary-hipster", "david-foster-wallace", "john-pistelli", "ideas"],
  "some-great-books-of-the-20th-century": ["rene-girard", "mimetic-desire", "book-lists", "ideas"],
};
