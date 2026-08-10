import { ObjectId } from "mongodb";
import { getCollections } from "./_lib/db.js";
import { authenticate } from "./_lib/auth.js";
import { ok, bad } from "./_lib/response.js";

const SECTIONS = new Set(["psalms", "pentateuch", "chronicles", "gospels"]);
const DATE_RE = /^2026-\d{2}-\d{2}$/;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return bad(405, "Method not allowed");

  const session = authenticate(event);
  if (!session) return bad(401, "Not signed in");

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return bad(400, "Invalid JSON"); }

  const dateKey = String(body.dateKey || "");
  const section = String(body.section || "");
  if (!DATE_RE.test(dateKey)) return bad(400, "Invalid dateKey");
  if (!SECTIONS.has(section)) return bad(400, "Invalid section");

  const { completions } = await getCollections();
  const userId = new ObjectId(session.sub);
  const filter = { userId, dateKey, section };

  const existing = await completions.findOne(filter);
  if (existing) {
    await completions.deleteOne(filter);
    return ok({ dateKey, section, complete: false });
  }
  await completions.insertOne({ ...filter, completedAt: new Date() });
  return ok({ dateKey, section, complete: true });
};
