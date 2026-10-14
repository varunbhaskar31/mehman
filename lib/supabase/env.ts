// Public Supabase settings. Both are safe to expose to the browser; access
// is controlled by row-level security in the database.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);
