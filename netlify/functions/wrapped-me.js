import { ObjectId } from "mongodb";
import { getDb, getCollections } from "./_lib/db.js";
import { authenticate } from "./_lib/auth.js";
import { ok, bad } from "./_lib/response.js";

const YEAR_START = new Date("2026-01-01T00:00:00Z");
const SECTIONS = ["psalms", "pentateuch", "chronicles", "gospels"];

function dayOfYear(d) {
  return Math.floor((d - YEAR_START) / 86400000) + 1;
}

function utcTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

// dateKey (YYYY-MM-DD) -> day-of-year int, without timezone drift.
function keyToDOY(key) {
  return dayOfYear(new Date(`${key}T00:00:00Z`));
}

export const handler = async (event) => {
  const session = authenticate(event);
  if (!session) return bad(401, "Not signed in");

  const userId = new ObjectId(session.sub);
  const { users, completions } = await getCollections();
  const db = await getDb();

  const user = await users.findOne(
    { _id: userId },
    { projection: { displayName: 1, email: 1, createdAt: 1 } }
  );
  if (!user) return bad(404, "User not found");

  const myCompletions = await completions
    .find({ userId }, { projection: { dateKey: 1, section: 1, _id: 0 } })
    .toArray();

  const sectionsByDate = new Map();
  const countBySection = { psalms: 0, pentateuch: 0, chronicles: 0, gospels: 0 };
  for (const c of myCompletions) {
    if (!sectionsByDate.has(c.dateKey)) sectionsByDate.set(c.dateKey, new Set());
    sectionsByDate.get(c.dateKey).add(c.section);
    if (countBySection[c.section] !== undefined) countBySection[c.section] += 1;
  }

  const fullDays = [...sectionsByDate.entries()]
    .filter(([, secs]) => secs.size >= 4)
    .map(([dateKey]) => dateKey)
    .sort();
  const daysComplete = fullDays.length;

  // Streaks, computed over day-of-year integers so gaps are unambiguous.
  const doys = fullDays.map(keyToDOY).sort((a, b) => a - b);
  let longestStreak = 0;
  let running = 0;
  let prev = null;
  for (const d of doys) {
    running = prev !== null && d === prev + 1 ? running + 1 : 1;
    longestStreak = Math.max(longestStreak, running);
    prev = d;
  }

  const todayKey = utcTodayKey();
  const todayDOY = keyToDOY(todayKey);
  let currentStreak = 0;
  {
    const doySet = new Set(doys);
    // A streak is still "current" if today or yesterday was completed.
    let cursor = doySet.has(todayDOY) ? todayDOY : todayDOY - 1;
    while (doySet.has(cursor)) {
      currentStreak += 1;
      cursor -= 1;
    }
  }

  const insightsCount = await db.collection("insights").countDocuments({ userId });

  // Rank + percentile among all readers, same "days with all 4 sections" metric as the leaderboard.
  const perUserDays = await completions
    .aggregate([
      { $group: { _id: { userId: "$userId", dateKey: "$dateKey" }, sections: { $addToSet: "$section" } } },
      { $match: { "sections.3": { $exists: true } } },
      { $group: { _id: "$_id.userId", daysComplete: { $sum: 1 } } },
    ])
    .toArray();
  const totalUsers = await users.countDocuments();
  const better = perUserDays.filter((u) => u.daysComplete > daysComplete).length;
  const rank = better + 1;
  const percentile = totalUsers > 0 ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100) : 0;

  const favoriteSection = Object.entries(countBySection).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return ok({
    displayName: user.displayName || user.email.split("@")[0],
    joinedAt: user.createdAt || null,
    daysComplete,
    totalSections: myCompletions.length,
    currentStreak,
    longestStreak,
    insightsCount,
    todayDOY,
    totalDaysInYear: 365,
    paceVsElapsed: todayDOY > 0 ? Math.round((daysComplete / todayDOY) * 100) : 0,
    totalUsers,
    rank,
    percentile,
    favoriteSection,
    sectionLabels: {
      psalms: "Psalms & Wisdom",
      pentateuch: "Pentateuch & History",
      chronicles: "Chronicles & Prophets",
      gospels: "Gospels & Epistles",
    },
  });
};
