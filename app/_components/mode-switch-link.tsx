"use client";

import Link from "next/link";
import { currentUser, hostForUser, useDemoState } from "@/lib/demo/store";

// "Switch to hosting" for anyone who has applied to host, otherwise an
// invitation to become one.
export function ModeSwitchLink({ className }: { className: string }) {
  const state = useDemoState();
  const isHost = Boolean(hostForUser(state, currentUser(state)?.id));
  return (
    <Link href={isHost ? "/host" : "/become-a-host"} className={className}>
      {isHost ? "Switch to hosting" : "Become a host"}
    </Link>
  );
}
