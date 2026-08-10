import { getCollections, getDb } from "./_lib/db.js";
import { ok } from "./_lib/response.js";

const YEAR_START = new Date("2026-01-01T00:00:00Z");
const YEAR_END = new Date("2026-12-31T00:00:00Z");

function dayOfYear(d) {
  const diff = d - YEAR_START;
  return Math.floor(diff / 86400000) + 1;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function utcTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export const handler = async (event) => {
  // Client passes its local date so timezones don't shift "today" forward.
  const clientDate = event.queryStringParameters?.dateKey;
  const dateKey = clientDate && DATE_RE.test(clientDate) ? clientDate : utcTodayKey();
  const { users, completions } = await getCollections();

  // Per-user count of days where all 4 sections are complete.
  const perUserDays = await completions.aggregate([
    {
      $group: {
        _id: { userId: "$userId", dateKey: "$dateKey" },
        sections: { $addToSet: "$section" },
      },
    },
    { $match: { "sections.3": { $exists: true } } },
    {
      $group: {
        _id: "$_id.userId",
        daysComplete: { $sum: 1 },
      },
    },
  ]).toArray();

  const daysByUser = new Map(perUserDays.map((u) => [u._id.toString(), u.daysComplete]));

  // Users who completed all 4 sections of TODAY (client-local).
  const caughtUpToday = await completions.aggregate([
    { $match: { dateKey } },
    { $group: { _id: "$userId", sections: { $addToSet: "$section" } } },
    { $match: { "sections.3": { $exists: true } } },
    { $count: "n" },
  ]).toArray();
  const usersCaughtUp = caughtUpToday[0]?.n || 0;

  const totalUsers = await users.countDocuments();
  const allUsers = await users
    .find({}, { projection: { displayName: 1, email: 1 } })
    .toArray();

  // Most recent insight per user (single aggregation)
  const db = await getDb();
  const latestInsights = await db
    .collection("insights")
    .aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$userId", content: { $first: "$content" }, createdAt: { $first: "$createdAt" } } },
    ])
    .toArray();
  const insightByUser = new Map(
    latestInsights.map((i) => [i._id.toString(), { content: i.content, createdAt: i.createdAt }])
  );

  // Compute day-of-year from the client-local date so the progress bar
  // doesn't shift to tomorrow late at night.
  const todayParsed = new Date(`${dateKey}T00:00:00Z`);
  const clampedToday = todayParsed < YEAR_START ? YEAR_START : todayParsed > YEAR_END ? YEAR_END : todayParsed;
  const todayDOY = dayOfYear(clampedToday);

  const communityProgress = totalUsers > 0 ? usersCaughtUp / totalUsers : 0;

  const leaderboard = allUsers
    .map((u) => {
      const id = u._id.toString();
      return {
        userId: id,
        displayName: u.displayName || u.email.split("@")[0],
        daysComplete: daysByUser.get(id) || 0,
        latestInsight: insightByUser.get(id) || null,
      };
    })
    .sort((a, b) => b.daysComplete - a.daysComplete)
    .slice(0, 20);

  return ok({
    totalUsers,
    todayDOY,
    totalDaysInYear: 365,
    yearProgress: todayDOY / 365,
    communityProgress,
    usersCaughtUp,
    leaderboard,
  });
};
