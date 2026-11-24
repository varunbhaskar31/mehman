// Applies supabase/migrations to a project's database.
//   npm run db:push        the live project in .env.local
//   npm run db:push:demo   a demo project in .env.demo.local
import { spawnSync } from "node:child_process";
import { loadEnv } from "./demo-env.mjs";

const file = process.argv.includes("--demo") ? ".env.demo.local" : ".env.local";
const env = loadEnv(file, ["SUPABASE_DB_URL"]);
console.log(`Applying migrations from ${file}…`);
// Extra flags (like --yes) pass through to supabase db push.
const extra = process.argv.slice(2).filter((arg) => arg !== "--demo");
const result = spawnSync("npx", ["supabase", "db", "push", "--db-url", env.SUPABASE_DB_URL, "--include-all", ...extra], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
