"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  currentUser,
  hostForUser,
  myNotifications,
  signOut,
  useAppReady,
  useAppState,
} from "@/lib/data/store";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

type MenuItem = { href: string; label: string; strong?: boolean };

// Desktop only, like Airbnb's: a rounded ☰ + avatar button that opens
// everything personal. (Phones use the bottom tabs instead.)
export function AccountButton() {
  const ready = useAppReady();
  const state = useAppState();
  const user = currentUser(state);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  if (!ready) return <span aria-hidden="true" className="block h-12 w-20" />;

  const isHost = Boolean(user && hostForUser(state, user.id));
  const unread = user ? myNotifications(state).filter((n) => !n.read).length : 0;
  const about: MenuItem[] = [
    { href: "/how-it-works", label: "How Mehman works" },
    { href: "/our-story", label: "Our story" },
    { href: "mailto:hello@mehman.in", label: "Get help" },
  ];
  const groups: MenuItem[][] = user
    ? [
        [
          { href: "/bookings", label: "My bookings", strong: true },
          { href: "/saved", label: "Saved", strong: true },
          { href: "/updates", label: unread ? `Updates (${unread} new)` : "Updates", strong: true },
          { href: "/profile", label: "Profile", strong: true },
        ],
        [
          user.role === "admin"
            ? { href: "/admin", label: "Open team console" }
            : { href: isHost ? "/host" : "/become-a-host", label: isHost ? "Switch to hosting" : "Become a host" },
        ],
        about,
      ]
    : [
        [{ href: "/login", label: "Log in or sign up", strong: true }],
        [{ href: "/become-a-host", label: "Become a host" }],
        about,
      ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? `Menu for ${user.fullName || user.email}` : "Menu"}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-12 items-center gap-3 rounded-full border border-ivory/20 py-1 pr-1 pl-3.5 transition-shadow hover:shadow-[0_2px_10px_rgb(0_0_0/0.45)] ${focusRing} ${open ? "shadow-[0_2px_10px_rgb(0_0_0/0.45)]" : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="size-4 text-ivory">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        {user ? (
          <span className="grid size-9 place-items-center rounded-full bg-[#e8c08f] text-sm font-medium text-pine">
            {initials(user.fullName, user.email)}
          </span>
        ) : (
          <svg viewBox="0 0 32 32" aria-hidden="true" className="size-9 text-ivory/60">
            <circle cx="16" cy="16" r="16" fill="currentColor" />
            <circle cx="16" cy="12.5" r="5" fill="var(--color-pine)" />
            <path d="M6.5 26.5c2-4.5 5.5-6.5 9.5-6.5s7.5 2 9.5 6.5" fill="var(--color-pine)" />
          </svg>
        )}
        {unread > 0 && <span aria-hidden="true" className="absolute top-1 right-1 size-2.5 rounded-full border-2 border-pine bg-terracotta" />}
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-ivory/10 bg-forest-deep py-2 shadow-[0_8px_28px_rgb(0_0_0/0.55)]">
          {groups.map((items, index) => (
            <div key={index} className={index > 0 ? "mt-2 border-t border-ivory/10 pt-2" : ""}>
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 text-sm hover:bg-ivory/10 focus-visible:bg-ivory/10 focus-visible:outline-none ${item.strong ? "font-medium text-ivory" : "text-ivory/80"}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          {user && (
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.replace("/explore");
              }}
              className="mt-2 block w-full border-t border-ivory/10 px-4 pt-3 pb-2.5 text-left text-sm text-ivory/80 hover:bg-ivory/10 focus-visible:bg-ivory/10 focus-visible:outline-none"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
