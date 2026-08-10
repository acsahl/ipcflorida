import { ObjectId } from "mongodb";
import { getCollections } from "./_lib/db.js";
import { authenticate } from "./_lib/auth.js";
import { ok, bad } from "./_lib/response.js";

export const handler = async (event) => {
  const session = authenticate(event);
  if (!session) return bad(401, "Not signed in");

  const { completions } = await getCollections();
  const docs = await completions
    .find({ userId: new ObjectId(session.sub) }, { projection: { dateKey: 1, section: 1, _id: 0 } })
    .toArray();

  return ok({ completions: docs });
};
