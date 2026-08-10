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

  const id = String(body.id || "");
  const content = String(body.content || "").trim();
  if (!id) return bad(400, "id required");
  if (!content) return bad(400, "Content required");
  if (content.length > 2000) return bad(400, "Content too long (2000 char max)");

  let oid;
  try { oid = new ObjectId(id); } catch { return bad(400, "Invalid id"); }

  const db = await getDb();
  const userId = new ObjectId(session.sub);

  const result = await db.collection("insights").updateOne(
    { _id: oid, userId },
    { $set: { content, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) return bad(404, "Insight not found");
  return ok({ id, content });
};
