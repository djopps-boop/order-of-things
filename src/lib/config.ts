// The word count at which an expanded in-feed post gets cut off with a
// "continue reading" link out to its permalink (native post page, or the
// original Substack post for free aggregated posts).
export const WORD_CAP = 400;

export function truncateWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return { text, truncated: false };
  }
  return { text: words.slice(0, maxWords).join(" ") + "…", truncated: true };
}
