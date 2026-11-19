// Applies supabase/migrations to the demo database (never production).
// Run with: npm run db:push:demo
import { spawnSync } from "node:child_process";
import { demoEnv } from "./demo-env.mjs";

const env = demoEnv(["SUPABASE_DB_URL"]);
const result = spawnSync("npx", ["supabase", "db", "push", "--db-url", env.SUPABASE_DB_URL, "--include-all"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
