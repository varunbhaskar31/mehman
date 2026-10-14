"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentUser, hostForUser, useDemoState } from "@/lib/demo/store";
import { navIcons as icons } from "./nav-icons";

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
