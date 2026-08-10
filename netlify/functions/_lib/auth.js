import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "30d";

export function signToken(user) {
  if (!SECRET) throw new Error("JWT_SECRET not set");
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

export function verifyToken(token) {
  if (!SECRET) throw new Error("JWT_SECRET not set");
  return jwt.verify(token, SECRET);
}

// Pull bearer token from event headers; returns decoded payload or null.
export function authenticate(event) {
  const header =
    event.headers?.authorization || event.headers?.Authorization || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    return verifyToken(m[1]);
  } catch {
    return null;
  }
}
