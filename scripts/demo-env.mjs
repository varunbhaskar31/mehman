// Reads .env.demo.local: the separate demo Supabase project's keys. Refuses
// to run against the production project.
import { existsSync, readFileSync } from "node:fs";

export const PRODUCTION_REF = "rlopcnjufynbqdutzstt";

export function demoEnv(required) {
  const file = ".env.demo.local";
  if (!existsSync(file)) {
    throw new Error(`${file} is missing. Copy .env.demo.example to ${file} and fill in the demo project's keys.`);
  }
  const env = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  for (const key of required) {
    if (!env[key]) throw new Error(`${key} is missing from ${file}.`);
  }
  const all = JSON.stringify(env);
  if (all.includes(PRODUCTION_REF)) {
    throw new Error(`${file} points at the production project (${PRODUCTION_REF}). Use the demo project.`);
  }
  return env;
}
