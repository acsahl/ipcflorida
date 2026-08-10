import { getDb } from "./_lib/db.js";
import { ok, bad } from "./_lib/response.js";

export const handler = async () => {
  try {
    const db = await getDb();
    // Cheap round-trip to verify the connection works.
    await db.command({ ping: 1 });
    return ok({
      status: "ok",
      db: db.databaseName,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return bad(500, `DB ping failed: ${err.message}`);
  }
};
