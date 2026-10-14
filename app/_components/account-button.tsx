"use client";

import Link from "next/link";
import { currentUser, useDemoReady, useDemoState } from "@/lib/demo/store";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// "Log in" for visitors; the visitor's initials, linking to their account,
// once signed in.
export function AccountButton() {
  const ready = useDemoReady();
  const user = currentUser(useDemoState());

  if (!ready) return <span aria-hidden="true" className="block size-11" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className={`inline-flex h-11 items-center whitespace-nowrap rounded-full border border-ivory/75 px-4 text-sm text-ivory transition-colors hover:bg-ivory/10 ${focusRing}`}
      >
        Log in
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      aria-label={`Your profile (${user.fullName || user.email})`}
      className={`grid size-11 place-items-center rounded-full bg-[#e8c08f] font-medium text-pine ${focusRing}`}
    >
      {initials(user.fullName, user.email)}
    </Link>
  );
}
