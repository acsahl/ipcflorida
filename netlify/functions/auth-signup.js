import bcrypt from "bcryptjs";
import { getCollections } from "./_lib/db.js";
import { signToken } from "./_lib/auth.js";
import { ok, bad } from "./_lib/response.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^2026-\d{2}-\d{2}$/;
const SECTIONS = ["psalms", "pentateuch", "chronicles", "gospels"];

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return bad(405, "Method not allowed");

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return bad(400, "Invalid JSON");
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const displayName = String(body.displayName || "").trim();
  const caughtUpTo = body.caughtUpTo ? String(body.caughtUpTo) : null;

  if (!EMAIL_RE.test(email)) return bad(400, "Invalid email");
  if (password.length < 8) return bad(400, "Password must be 8+ characters");
  if (caughtUpTo && !DATE_RE.test(caughtUpTo))
    return bad(400, "caughtUpTo must be YYYY-MM-DD in 2026");

  const { users, completions } = await getCollections();

  const existing = await users.findOne({ email });
  if (existing) return bad(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  const result = await users.insertOne({
    email,
    passwordHash,
    displayName: displayName || email.split("@")[0],
    createdAt: now,
    caughtUpTo,
  });

  // Backfill: mark every reading complete from 2026-01-01 through caughtUpTo.
  if (caughtUpTo) {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date(`${caughtUpTo}T00:00:00Z`);
    const docs = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateKey = d.toISOString().slice(0, 10);
      for (const section of SECTIONS) {
        docs.push({
          userId: result.insertedId,
          dateKey,
          section,
          completedAt: now,
          backfilled: true,
        });
      }
    }
    if (docs.length) await completions.insertMany(docs);
  }

  const user = {
    _id: result.insertedId,
    email,
    displayName: displayName || email.split("@")[0],
    caughtUpTo,
  };
  const token = signToken(user);

  return ok({ token, user });
};
