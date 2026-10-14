import Link from "next/link";
import type { ReactNode } from "react";
import { AccountButton } from "./account-button";
import { MehmanLogo } from "./mehman-logo";
import { ModeSwitchLink } from "./mode-switch-link";
import { NotificationBell } from "./notification-bell";

type Page =
  | "explore"
  | "experiences"
  | "how-it-works"
  | "our-story"
  | "host"
  | "today"
  | "calendar"
  | "requests"
  | "table"
  | "earnings";

type SiteHeaderProps = {
  current?: Page;
  // Hosting mode swaps the menu for the host's own sections.
  mode?: "travelling" | "host";
};

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

const travellingLinks: { page: Page; href: string; label: string }[] = [
  { page: "explore", href: "/explore", label: "Explore" },
  { page: "experiences", href: "/experiences", label: "Experiences" },
  { page: "how-it-works", href: "/how-it-works", label: "How it works" },
  { page: "our-story", href: "/our-story", label: "Our story" },
];

const hostLinks: { page: Page; href: string; label: string }[] = [
  { page: "today", href: "/host", label: "Today" },
  { page: "calendar", href: "/host/calendar", label: "Calendar" },
  { page: "requests", href: "/host/requests", label: "Requests" },
  { page: "table", href: "/host/table", label: "My table" },
  { page: "earnings", href: "/host/earnings", label: "Earnings" },
];

const linkClass = (isCurrent: boolean) =>
  `${focusRing} ${
    isCurrent
      ? "text-ivory underline decoration-terracotta-soft decoration-2 underline-offset-8"
      : "text-ivory/70 hover:text-ivory"
  }`;

// Phones show just the logo; the bottom tabs do the navigating. Wider
// screens get the full website menu.
export function SiteHeader({ current, mode = "travelling" }: SiteHeaderProps) {
  const menu = mode === "host" ? hostLinks : travellingLinks;

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-ivory md:px-10 md:pt-7">
      <Link
        href={mode === "host" ? "/host" : "/explore"}
        className={`flex items-center gap-2 font-serif text-2xl leading-none ${focusRing}`}
      >
        <MehmanLogo className="h-9 w-auto" />
        Mehman
        {mode === "host" && (
          <span className="rounded-full bg-[#e8c08f]/15 px-2.5 py-1 font-sans text-xs text-[#e8c08f]">
            Hosting
          </span>
        )}
      </Link>

      <nav aria-label="Main" className="hidden md:block">
        <ul className="flex items-center gap-7 text-sm">
          {menu.map((link) => (
            <li key={link.page}>
              <Link
                href={link.href}
                aria-current={current === link.page ? "page" : undefined}
                className={linkClass(current === link.page)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Phones: just the updates bell; the tabs do the rest. */}
      <div className="md:hidden">
        <NotificationBell />
      </div>

      <div className="hidden items-center gap-2 md:flex">
        {mode === "host" ? (
          <Link href="/explore" className={`mr-2 text-sm ${linkClass(false)}`}>
            Switch to travelling
          </Link>
        ) : (
          <ModeSwitchLink className={`mr-2 text-sm ${linkClass(current === "host")}`} />
        )}
        <NotificationBell />
        <AccountButton />
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
