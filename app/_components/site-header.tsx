import Link from "next/link";
import type { ReactNode } from "react";
import { AccountButton } from "./account-button";
import { MehmanLogo } from "./mehman-logo";
import { ModeSwitchLink } from "./mode-switch-link";
import { navIcons } from "./nav-icons";
import { MessagesButton, NotificationBell } from "./notification-bell";

type Page =
  | "explore"
  | "experiences"
  | "saved"
  | "how-it-works"
  | "our-story"
  | "host"
  | "today"
  | "calendar"
  | "requests"
  | "table"
  | "earnings"
  | "messages"
  | "updates"
  | "admin-review"
  | "admin-hosts"
  | "admin-bookings";

type SiteHeaderProps = {
  current?: Page;
  // Hosting mode and the Mehman team console swap in their own menus.
  mode?: "travelling" | "host" | "admin";
};

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

type NavLink = { page: Page; href: string; label: string; icon?: string };

// The same three places as the phone tabs; Profile is the avatar menu.
const travellingLinks: NavLink[] = [
  { page: "explore", href: "/explore", label: "Explore", icon: "explore" },
  { page: "experiences", href: "/experiences", label: "Experiences", icon: "experiences" },
  { page: "saved", href: "/saved", label: "Saved", icon: "saved" },
];

const hostLinks: NavLink[] = [
  { page: "today", href: "/host", label: "Today" },
  { page: "calendar", href: "/host/calendar", label: "Calendar" },
  { page: "requests", href: "/host/requests", label: "Requests" },
  { page: "table", href: "/host/table", label: "My table" },
  { page: "earnings", href: "/host/earnings", label: "Earnings" },
];

const adminLinks: NavLink[] = [
  { page: "admin-review", href: "/admin", label: "Review" },
  { page: "admin-hosts", href: "/admin/hosts", label: "Hosts" },
  { page: "admin-bookings", href: "/admin/bookings", label: "Bookings" },
];

const modeHome = { travelling: "/explore", host: "/host", admin: "/admin" };
const modeBadge = { travelling: null, host: "Hosting", admin: "Mehman team" };

const pillLinkClass = `flex h-11 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap text-ivory transition-colors hover:bg-ivory/10 ${focusRing}`;

// Phones show just the logo, messages and bell; the bottom tabs do the navigating.
// Wider screens get an Airbnb-style bar: logo, tabs in the middle, and
// the mode switch, bell and account menu on the right.
export function SiteHeader({ current, mode = "travelling" }: SiteHeaderProps) {
  const menu = mode === "host" ? hostLinks : mode === "admin" ? adminLinks : travellingLinks;
  const badge = modeBadge[mode];

  return (
    <header className="text-ivory md:border-b md:border-ivory/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:grid md:max-w-7xl md:grid-cols-[1fr_auto_1fr] md:px-10 md:py-3">
        <Link
          href={modeHome[mode]}
          className={`flex items-center gap-2 justify-self-start font-serif text-2xl leading-none ${focusRing}`}
        >
          <MehmanLogo className="h-9 w-auto" />
          Mehman
          {badge && (
            <span className="rounded-full bg-[#e8c08f]/15 px-2.5 py-1 font-sans text-xs whitespace-nowrap text-[#e8c08f]">
              {badge}
            </span>
          )}
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-2 lg:gap-4">
            {menu.map((link) => {
              const isCurrent = current === link.page;
              return (
                <li key={link.page}>
                  <Link
                    href={link.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex h-14 items-center gap-2 border-b-2 px-3 text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ivory ${
                      isCurrent
                        ? "border-ivory font-medium text-ivory"
                        : "border-transparent text-ivory/60 hover:border-ivory/25 hover:text-ivory"
                    }`}
                  >
                    {link.icon && <span className={isCurrent ? "text-[#e8c08f]" : ""}>{navIcons[link.icon]}</span>}
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Phones: messages and the updates bell; the tabs do the rest. */}
        <div className="flex md:hidden">
          <MessagesButton mode={mode} />
          <NotificationBell mode={mode} />
        </div>

        <div className="hidden items-center gap-1 justify-self-end md:flex">
          {mode !== "travelling" ? (
            <Link href="/explore" className={pillLinkClass}>
              Switch to travelling
            </Link>
          ) : (
            <ModeSwitchLink className={pillLinkClass} />
          )}
          <MessagesButton mode={mode} />
          <NotificationBell mode={mode} />
          <span className="ml-1">
            <AccountButton mode={mode} />
          </span>
        </div>
      </div>
    </header>
  );
}

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center text-sm text-ivory/70 hover:text-ivory ${focusRing}`}
    >
      <span aria-hidden="true" className="mr-2">
        ←
      </span>
      {children}
    </Link>
  );
}
