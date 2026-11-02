"use client";

import Link from "next/link";
import { currentUser, myNotifications, useAppState } from "@/lib/data/store";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

export function NotificationBell() {
  const state = useAppState();
  if (!currentUser(state)) return null;
  const unread = myNotifications(state).filter((n) => !n.read).length;

  return (
    <Link
      href="/updates"
      aria-label={unread ? `Updates, ${unread} new` : "Updates"}
      className={`relative grid size-11 place-items-center rounded-full text-ivory/85 hover:bg-ivory/10 ${focusRing}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-6">
        <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[10px] leading-4 text-ivory">
          {unread}
        </span>
      )}
    </Link>
  );
}
