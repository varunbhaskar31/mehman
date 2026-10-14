"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  currentUser,
  hostForUser,
  myNotifications,
  signOut,
  useDemoReady,
  useDemoState,
} from "@/lib/demo/store";
import type { Profile } from "@/lib/demo/types";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// "Log in" for visitors; once signed in, the visitor's initials open a
// menu with bookings, saved tables, updates, profile and hosting.
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

  return <AccountMenu user={user} />;
}

// Desktop: the avatar opens a menu with everything personal, like
// Airbnb's. (Phones use the bottom tabs and don't show this button.)
function AccountMenu({ user }: { user: Profile }) {
  const state = useDemoState();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isHost = Boolean(hostForUser(state, user.id));
  const unread = myNotifications(state).filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const items = [
    { href: "/bookings", label: "My bookings" },
    { href: "/saved", label: "Saved" },
    { href: "/updates", label: unread ? `Updates (${unread} new)` : "Updates" },
    { href: "/profile", label: "Profile" },
    { href: isHost ? "/host" : "/become-a-host", label: isHost ? "Switch to hosting" : "Become a host" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Review hosts" }] : []),
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu for ${user.fullName || user.email}`}
        onClick={() => setOpen((o) => !o)}
        className={`grid size-11 place-items-center rounded-full bg-[#e8c08f] font-medium text-pine ${focusRing}`}
      >
        {initials(user.fullName, user.email)}
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-ivory/10 bg-[#1b2a1c] py-2 shadow-2xl">
          <p className="truncate px-4 pt-1 pb-2 text-xs text-ivory/50">{user.fullName || user.email}</p>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ivory hover:bg-ivory/10 focus-visible:bg-ivory/10 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
              router.replace("/explore");
            }}
            className="mt-1 block w-full border-t border-ivory/10 px-4 py-2.5 text-left text-sm text-ivory/75 hover:bg-ivory/10 focus-visible:bg-ivory/10 focus-visible:outline-none"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
