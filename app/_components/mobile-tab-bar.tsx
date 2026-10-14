"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { currentUser, hostForUser, useDemoState } from "@/lib/demo/store";

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
  experiences: (
    <svg {...iconProps}>
      <path d="M3 13h18" />
      <path d="M5 13a7 7 0 0 1 14 0" />
      <path d="M12 6V4.5M4 17h16" />
    </svg>
  ),
  review: (
    <svg {...iconProps}>
      <path d="M9 11l2 2 4-4" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  ),
  hosts: (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.8-3 3.2-5 6-5s5.2 2 6 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M18 14c1.5.7 2.6 2.5 3 5" />
    </svg>
  ),
  saved: (
    <svg {...iconProps}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
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

  const hostMode = pathname === "/host" || pathname.startsWith("/host/");
  const adminMode = pathname === "/admin" || pathname.startsWith("/admin/");
  const toReview =
    state.hosts.filter((h) => h.status === "pending").length +
    state.tables.filter((t) => t.status === "pending" && state.hosts.find((h) => h.id === t.hostId)?.status === "approved").length;
  const pendingRequests = host
    ? state.bookings.filter(
        (b) =>
          b.status === "requested" &&
          state.tables.some(
            (t) => t.hostId === host.id && state.sessions.some((x) => x.id === b.sessionId && x.tableId === t.id),
          ),
      ).length
    : 0;

  const under = (...paths: string[]) => paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const tabs: { key: string; icon: string; href: string; label: string; current: boolean; badge?: number }[] = adminMode
    ? [
        { key: "review", icon: "review", href: "/admin", label: "Review", current: pathname === "/admin", badge: toReview },
        { key: "hosts", icon: "hosts", href: "/admin/hosts", label: "Hosts", current: under("/admin/hosts") },
        { key: "bookings", icon: "trips", href: "/admin/bookings", label: "Bookings", current: under("/admin/bookings") },
        { key: "profile", icon: "account", href: "/profile", label: "Profile", current: false },
      ]
    : hostMode
    ? [
        { key: "today", icon: "today", href: "/host", label: "Today", current: pathname === "/host" },
        { key: "calendar", icon: "trips", href: "/host/calendar", label: "Calendar", current: under("/host/calendar") },
        { key: "requests", icon: "requests", href: "/host/requests", label: "Requests", current: under("/host/requests"), badge: pendingRequests },
        { key: "table", icon: "table", href: "/host/table", label: "My table", current: under("/host/table") },
        { key: "earnings", icon: "earnings", href: "/host/earnings", label: "Earnings", current: under("/host/earnings") },
      ]
    : [
        { key: "explore", icon: "explore", href: "/explore", label: "Explore", current: pathname === "/explore" },
        // Opens the city chosen last on Explore.
        { key: "experiences", icon: "experiences", href: "/experiences", label: "Experiences", current: pathname.startsWith("/explore/") || under("/experiences", "/tables") },
        { key: "saved", icon: "saved", href: "/saved", label: "Saved", current: under("/saved") },
        { key: "profile", icon: "account", href: "/profile", label: "Profile", current: under("/profile", "/login", "/become-a-host", "/how-it-works", "/our-story", "/bookings", "/updates") },
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
            const isCurrent = tab.current;
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
                    {icons[tab.icon]}
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
