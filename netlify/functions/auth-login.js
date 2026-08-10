import bcrypt from "bcryptjs";
import { getCollections } from "./_lib/db.js";
import { signToken } from "./_lib/auth.js";
import { ok, bad } from "./_lib/response.js";

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

  if (!email || !password) return bad(400, "Email and password required");

  const { users } = await getCollections();
  const user = await users.findOne({ email });
  if (!user) return bad(401, "Invalid email or password");

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return bad(401, "Invalid email or password");

  const token = signToken(user);
  return ok({
    token,
    user: {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      caughtUpTo: user.caughtUpTo,
    },
  });
};
