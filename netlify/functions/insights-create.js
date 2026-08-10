import { ObjectId } from "mongodb";
import { getDb } from "./_lib/db.js";
import { authenticate } from "./_lib/auth.js";
import { ok, bad } from "./_lib/response.js";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return bad(405, "Method not allowed");

  const session = authenticate(event);
  if (!session) return bad(401, "Not signed in");

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return bad(400, "Invalid JSON"); }

  const content = String(body.content || "").trim();
  const dateKey = String(body.dateKey || "").trim();
  if (!content) return bad(400, "Content required");
  if (content.length > 2000) return bad(400, "Content too long (2000 char max)");

  const db = await getDb();
  const insights = db.collection("insights");

  const doc = {
    userId: new ObjectId(session.sub),
    content,
    dateKey: dateKey || null,
    createdAt: new Date(),
  };
  const result = await insights.insertOne(doc);

  return ok({
    insight: { _id: result.insertedId, ...doc, userId: session.sub },
  });
};
