// Reads Supabase settings from an env file and refuses the old project
// (rlopcnjufynbqdutzstt), which Mehman no longer uses.
//   .env.local       the live project (npm run db:push)
//   .env.demo.local  a separate demo project (npm run db:push:demo, seed:demo)
import { existsSync, readFileSync } from "node:fs";

export const OLD_PROJECT_REF = "rlopcnjufynbqdutzstt";

export function loadEnv(file, required) {
  if (!existsSync(file)) {
    throw new Error(`${file} is missing. See .env.example (live) or .env.demo.example (demo).`);
  }
  const env = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  for (const key of required) {
    if (!env[key]) throw new Error(`${key} is missing from ${file}.`);
  }
  if (JSON.stringify(env).includes(OLD_PROJECT_REF)) {
    throw new Error(`${file} points at the old project (${OLD_PROJECT_REF}). Use the new one.`);
  }
  return env;
}

export function demoEnv(required) {
  return loadEnv(".env.demo.local", required);
}
