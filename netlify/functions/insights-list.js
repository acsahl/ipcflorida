import { ObjectId } from "mongodb";
import { getDb } from "./_lib/db.js";
import { ok, bad } from "./_lib/response.js";

export const handler = async (event) => {
  const userId = event.queryStringParameters?.userId;
  if (!userId) return bad(400, "userId required");

  let oid;
  try { oid = new ObjectId(userId); } catch { return bad(400, "Invalid userId"); }

  const db = await getDb();
  const insights = await db
    .collection("insights")
    .find({ userId: oid })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  const user = await db.collection("users").findOne(
    { _id: oid },
    { projection: { displayName: 1, email: 1 } }
  );

  return ok({
    user: user
      ? { _id: user._id, displayName: user.displayName || user.email.split("@")[0] }
      : null,
    insights: insights.map((i) => ({
      _id: i._id,
      content: i.content,
      dateKey: i.dateKey,
      createdAt: i.createdAt,
    })),
  });
};
