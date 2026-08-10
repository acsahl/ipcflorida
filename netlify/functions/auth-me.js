import { ObjectId } from "mongodb";
import { getCollections } from "./_lib/db.js";
import { authenticate } from "./_lib/auth.js";
import { ok, bad } from "./_lib/response.js";

export const handler = async (event) => {
  const session = authenticate(event);
  if (!session) return bad(401, "Not signed in");

  const { users } = await getCollections();
  const user = await users.findOne(
    { _id: new ObjectId(session.sub) },
    { projection: { passwordHash: 0 } }
  );
  if (!user) return bad(404, "User not found");

  return ok({ user });
};
