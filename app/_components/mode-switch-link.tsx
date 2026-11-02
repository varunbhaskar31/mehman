"use client";

import Link from "next/link";
import { currentUser, hostForUser, useAppState } from "@/lib/data/store";

// "Switch to hosting" for anyone who has applied to host, otherwise an
// invitation to become one.
export function ModeSwitchLink({ className }: { className: string }) {
  const state = useAppState();
  const user = currentUser(state);
  if (user?.role === "admin") {
    return (
      <Link href="/admin" className={className}>
        Team console
      </Link>
    );
  }
  const isHost = Boolean(hostForUser(state, user?.id));
  return (
    <Link href={isHost ? "/host" : "/become-a-host"} className={className}>
      {isHost ? "Switch to hosting" : "Become a host"}
    </Link>
  );
}
