import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends people back here with a one-time code, which becomes their
// session cookie. Then on to where they were going.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  // Only same-site paths, so a crafted link can't send people elsewhere.
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/explore";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth] Couldn't finish Google sign-in", error);
  }
  return NextResponse.redirect(`${origin}/login?error=google&next=${encodeURIComponent(next)}`);
}
