import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./env";

// A Supabase client for Client Components, sharing the session cookie.
export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
