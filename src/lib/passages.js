// Parsing for the plan's scripture references, e.g. "Judges 20",
// "Genesis 8:20-9:19", "Joshua 11-12", "Psalm 42-43", "Obadiah 1-14", "Jude".

export const BOOKS = [
  // Old Testament
  ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36],
  ["Deuteronomy", 34], ["Joshua", 24], ["Judges", 21], ["Ruth", 4],
  ["1 Samuel", 31], ["2 Samuel", 24], ["1 Kings", 22], ["2 Kings", 25],
  ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10], ["Nehemiah", 13],
  ["Esther", 10], ["Job", 42], ["Psalms", 150], ["Proverbs", 31],
  ["Ecclesiastes", 12], ["Song of Solomon", 8], ["Isaiah", 66], ["Jeremiah", 52],
  ["Lamentations", 5], ["Ezekiel", 48], ["Daniel", 12], ["Hosea", 14],
  ["Joel", 3], ["Amos", 9], ["Obadiah", 1], ["Jonah", 4], ["Micah", 7],
  ["Nahum", 3], ["Habakkuk", 3], ["Zephaniah", 3], ["Haggai", 2],
  ["Zechariah", 14], ["Malachi", 4],
  // New Testament
  ["Matthew", 28], ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28],
  ["Romans", 16], ["1 Corinthians", 16], ["2 Corinthians", 13], ["Galatians", 6],
  ["Ephesians", 6], ["Philippians", 4], ["Colossians", 4],
  ["1 Thessalonians", 5], ["2 Thessalonians", 3], ["1 Timothy", 6],
  ["2 Timothy", 4], ["Titus", 3], ["Philemon", 1], ["Hebrews", 13],
  ["James", 5], ["1 Peter", 5], ["2 Peter", 3], ["1 John", 5], ["2 John", 1],
  ["3 John", 1], ["Jude", 1], ["Revelation", 22],
];

export const CHAPTERS = Object.fromEntries(BOOKS);
export const OT_COUNT = 39;

// The plan writes "Psalm 8"; the book is "Psalms".
const ALIASES = { Psalm: "Psalms", Song: "Song of Solomon" };

// Longest name first so "1 John" wins over "John" and
// "Song of Solomon" over any shorter prefix.
const NAMES = [...BOOKS.map(([n]) => n), ...Object.keys(ALIASES)]
  .sort((a, b) => b.length - a.length);

/**
 * "Genesis 8:20-9:19" -> { book: "Genesis", chapters: [8, 9] }
 * Returns null if the reference doesn't name a known book.
 */
export function parsePassage(ref) {
  if (!ref || typeof ref !== "string") return null;
  const text = ref.trim();

  const match = NAMES.find(
    (n) => text === n || text.startsWith(n + " ") || text.startsWith(n + ".")
  );
  if (!match) return null;

  const book = ALIASES[match] || match;
  const total = CHAPTERS[book];
  const rest = text.slice(match.length).replace(/^[.\s]+/, "");

  // Single-chapter books: any range here is verses, so it's always chapter 1.
  if (total === 1) return { book, chapters: [1] };
  if (!rest) return { book, chapters: [1] };

  const [startPart, endPart] = rest.split(/\s*[-–]\s*/, 2);
  const startCh = parseInt(startPart, 10);
  if (Number.isNaN(startCh)) return { book, chapters: [] };

  const startHasVerse = startPart.includes(":");
  let endCh = startCh;

  if (endPart) {
    if (endPart.includes(":")) {
      endCh = parseInt(endPart, 10);
    } else if (!startHasVerse) {
      // "Joshua 11-12" — a chapter range.
      endCh = parseInt(endPart, 10);
    }
    // else "Genesis 8:1-19" — the tail is a verse, so it stays within startCh.
  }

  if (Number.isNaN(endCh) || endCh < startCh) endCh = startCh;
  endCh = Math.min(endCh, total);

  const chapters = [];
  for (let c = Math.max(startCh, 1); c <= endCh; c++) chapters.push(c);
  return { book, chapters };
}

const SECTIONS = ["psalms", "pentateuch", "chronicles", "gospels"];

/**
 * Walks the plan once and returns, per book, which chapters are scheduled and
 * on what (dateKey, section) — so completion can be resolved per chapter.
 */
export function buildBookIndex(plan) {
  const index = {};
  const ensure = (book) => {
    if (!index[book]) {
      index[book] = { book, total: CHAPTERS[book], chapters: new Map() };
    }
    return index[book];
  };

  for (const [dateKey, day] of Object.entries(plan?.readings || {})) {
    for (const section of SECTIONS) {
      const parsed = parsePassage(day[section]);
      if (!parsed) continue;
      const entry = ensure(parsed.book);
      for (const ch of parsed.chapters) {
        if (!entry.chapters.has(ch)) entry.chapters.set(ch, []);
        entry.chapters.get(ch).push({ dateKey, section });
      }
    }
  }
  return index;
}
