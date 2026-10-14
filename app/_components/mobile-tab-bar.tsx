"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { currentUser, hostForUser, myNotifications, useDemoState } from "@/lib/demo/store";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-6",
};

const icons: Record<string, ReactNode> = {
  explore: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  ),
  trips: (
    <svg {...iconProps}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  ),
  inbox: (
    <svg {...iconProps}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  account: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  today: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  requests: (
    <svg {...iconProps}>
      <path d="M4 13h4l1.5 2.5h5L16 13h4" />
      <path d="M6 5h12l2 8v6H4v-6z" />
    </svg>
  ),
  table: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M2 5v6M2 8h1.5M22 5v14" />
    </svg>
  ),
  earnings: (
    <svg {...iconProps}>
      <path d="M7 5h10M7 9h10M9 5c4 0 5 2 5 4s-2 4-6 4l7 6" />
    </svg>
  ),
};

// Phone navigation, Airbnb-style: travelling tabs everywhere, and the
// host's own tabs inside hosting mode. Wider screens use the header.
export function MobileTabBar() {
  const pathname = usePathname();
  const state = useDemoState();
  const user = currentUser(state);
  const host = hostForUser(state, user?.id);
  const unread = myNotifications(state).filter((n) => !n.read).length;

  const hostMode = pathname === "/host" || pathname.startsWith("/host/");
  const pendingRequests = host
    ? state.bookings.filter(
        (b) =>
          b.status === "requested" &&
          state.tables.some(
            (t) => t.hostId === host.id && state.sessions.some((x) => x.id === b.sessionId && x.tableId === t.id),
          ),
      ).length
    : 0;

  const tabs: { key: string; href: string; label: string; match: string[]; badge?: number }[] = hostMode
    ? [
        { key: "today", href: "/host", label: "Today", match: ["/host"] },
        { key: "trips", href: "/host/calendar", label: "Calendar", match: ["/host/calendar"] },
        { key: "requests", href: "/host/requests", label: "Requests", match: ["/host/requests"], badge: pendingRequests },
        { key: "table", href: "/host/table", label: "My table", match: ["/host/table"] },
        { key: "earnings", href: "/host/earnings", label: "Earnings", match: ["/host/earnings"] },
      ]
    : [
        { key: "explore", href: "/explore", label: "Explore", match: ["/explore", "/tables"] },
        { key: "trips", href: "/trips", label: "Trips", match: ["/trips"] },
        { key: "inbox", href: "/inbox", label: "Inbox", match: ["/inbox"], badge: unread },
        { key: "account", href: "/profile", label: "Profile", match: ["/profile", "/login", "/admin", "/become-a-host", "/how-it-works", "/our-story"] },
      ];

  return (
    <>
      {/* Keeps page content clear of the fixed bar. */}
      <div
        aria-hidden="true"
        className="h-[calc(4rem+env(safe-area-inset-bottom))] bg-pine md:hidden"
      />
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ivory/10 bg-pine/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className={`grid ${hostMode ? "grid-cols-5" : "grid-cols-4"}`}>
          {tabs.map((tab) => {
            // "/host" (Today) matches exactly; other tabs match their section.
            const isCurrent = tab.match.some((path) =>
              path === "/host" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`),
            );
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ivory active:bg-ivory/5 ${
                    isCurrent ? "text-[#e8c08f]" : "text-ivory/60"
                  }`}
                >
                  <span className="relative">
                    {icons[tab.key]}
                    {tab.badge ? (
                      <span className="absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[10px] leading-4 text-ivory">
                        {tab.badge}
                      </span>
                    ) : null}
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
