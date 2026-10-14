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
  hosting: (
    <svg {...iconProps}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  ),
  account: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
};

// Phone navigation. On wider screens the header links take over.
export function MobileTabBar() {
  const pathname = usePathname();
  const state = useDemoState();
  const user = currentUser(state);
  const isHost = Boolean(hostForUser(state, user?.id));

  // Explore carries the full menu in its own header.
  if (pathname === "/explore") return null;

  const tabs = [
    { key: "explore", href: "/explore", label: "Explore", match: ["/explore", "/experiences", "/tables"] },
    { key: "trips", href: "/trips", label: "Trips", match: ["/trips"] },
    { key: "hosting", href: isHost ? "/host" : "/become-a-host", label: "Hosting", match: ["/host", "/become-a-host"] },
    { key: "account", href: user ? "/account" : "/login", label: user ? "Account" : "Log in", match: ["/account", "/login", "/admin"] },
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
        <ul className="grid grid-cols-4">
          {tabs.map((tab) => {
            const isCurrent = tab.match.some(
              (path) => pathname === path || pathname.startsWith(`${path}/`),
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
                  {icons[tab.key]}
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
