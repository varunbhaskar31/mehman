import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "guest" | "host" | "admin";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
};

// The signed-in visitor, or null. Reads the request's cookies, so callers
// must render inside a <Suspense> boundary.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url, role")
    .eq("id", auth.user.id)
    .single();
  if (error) {
    console.error("[auth] Couldn't load profile", error);
  }

  return {
    id: auth.user.id,
    email: auth.user.email ?? null,
    fullName: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    role: (profile?.role as Role | undefined) ?? "guest",
  };
}

// The signed-in visitor; sends anyone else to log in first.
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireRole(
  role: Exclude<Role, "guest">,
  next: string,
): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (user.role !== role && user.role !== "admin") redirect("/");
  return user;
}
