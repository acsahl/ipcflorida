import "dotenv/config";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "bbr");

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/delete_test_user.mjs <email>");
  process.exit(1);
}

const user = await db.collection("users").findOne({ email });
if (!user) {
  console.log(`No user with email ${email}`);
} else {
  const c = await db.collection("completions").deleteMany({ userId: user._id });
  const i = await db.collection("insights").deleteMany({ userId: user._id });
  await db.collection("users").deleteOne({ _id: user._id });
  console.log(`Deleted ${email}: ${c.deletedCount} completions, ${i.deletedCount} insights`);
}
await client.close();
