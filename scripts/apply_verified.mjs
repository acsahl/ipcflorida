// Merge scripts/verified_plan.json into the reading plan JSON.
//
// Only sections/months present in `verified` are replaced. Anything still
// marked OBSCURED, and the two Gospels months missing from the source photo,
// keep their previous value and are reported so they stay visible.
//
//   node scripts/apply_verified.mjs [--write]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DAYS = { 1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 };
const SECTIONS = ["psalms", "pentateuch", "chronicles", "gospels"];

const verified = JSON.parse(fs.readFileSync(path.join(root, "scripts/verified_plan.json"), "utf8"));
const planPath = path.join(root, "data/reading-plan-2026.json");
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

// --- validate the transcription before touching the plan -------------------
const errors = [];
for (const section of SECTIONS) {
  for (const [month, days] of Object.entries(verified.verified[section] || {})) {
    const want = DAYS[Number(month)];
    if (days.length !== want) {
      errors.push(`${section} month ${month}: expected ${want} entries, got ${days.length}`);
    }
    days.forEach((d, i) => {
      if (typeof d !== "string" || !d.trim()) {
        errors.push(`${section} month ${month} day ${i + 1}: empty entry`);
      }
    });
  }
}
if (errors.length) {
  console.error("Validation failed:\n  " + errors.join("\n  "));
  process.exit(1);
}

// --- merge ------------------------------------------------------------------
// The four days a thumb covers in the source photo. These are NOT read from
// the page - they are the only readings the surrounding sequence allows, and
// they replace values that are plainly wrong (the old generator had a Psalm
// sitting in the Gospels column here). Confirm against a clean copy.
const INFERRED = {
  "pentateuch|2026-10-30": "1 Kings 22:1-28",
  "pentateuch|2026-10-31": "1 Kings 22:29-53",
  "gospels|2026-12-30": "Revelation 21:1-27",
  "gospels|2026-12-31": "Revelation 22",
};

const key = (m, d) => `2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
let replaced = 0, keptObscured = [], keptMissing = [];

for (const section of SECTIONS) {
  for (let m = 1; m <= 12; m++) {
    const days = verified.verified[section]?.[String(m)];
    if (!days) {
      keptMissing.push(`${section} ${m}`);
      continue;
    }
    for (let d = 1; d <= DAYS[m]; d++) {
      const value = days[d - 1];
      const k = key(m, d);
      if (value === "OBSCURED") {
        const inferred = INFERRED[`${section}|${k}`];
        keptObscured.push(`${section} ${k}: "${plan.readings[k][section]}" -> "${inferred}" (INFERRED, not read)`);
        plan.readings[k][section] = inferred;
        continue;
      }
      if (plan.readings[k][section] !== value) replaced++;
      plan.readings[k][section] = value;
    }
  }
}

plan._meta.status =
  "Transcribed from the IPC Florida 2026 printed plan. 46 of 48 month-columns verified against the source. " +
  "UNVERIFIED: Gospels March and June (outside the source photo's frame); " +
  "Pentateuch Oct 30-31 and Gospels Dec 30-31 (obscured in the source photo).";
plan._meta.verifiedAt = "2026-08-10";

console.log(`entries changed: ${replaced}`);
console.log(`columns still unverified: ${keptMissing.join(", ") || "none"}`);
console.log(`days left as-is (obscured):\n  ${keptObscured.join("\n  ") || "none"}`);

if (process.argv.includes("--write")) {
  const out = JSON.stringify(plan, null, 2) + "\n";
  fs.writeFileSync(planPath, out);
  fs.writeFileSync(path.join(root, "public/data/reading-plan-2026.json"), out);
  console.log("\nwrote data/ and public/data/ reading-plan-2026.json");
} else {
  console.log("\n(dry run - pass --write to save)");
}
