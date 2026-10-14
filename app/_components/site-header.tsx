import Link from "next/link";
import type { ReactNode } from "react";
import { AccountButton } from "./account-button";
import { MehmanLogo } from "./mehman-logo";
import { NotificationBell } from "./notification-bell";

type Page =
  | "explore"
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
  // Host mode swaps the menu for the host's own sections.
  mode?: "guest" | "host";
};

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

const links: { page: Page; href: string; label: string }[] = [
  { page: "explore", href: "/explore", label: "Explore" },
  { page: "how-it-works", href: "/how-it-works", label: "How it works" },
  { page: "our-story", href: "/our-story", label: "Our story" },
  { page: "host", href: "/become-a-host", label: "Become a host" },
];

const hostLinks: { page: Page; href: string; label: string }[] = [
  { page: "today", href: "/host", label: "Today" },
  { page: "calendar", href: "/host/calendar", label: "Calendar" },
  { page: "requests", href: "/host/requests", label: "Requests" },
  { page: "table", href: "/host/table", label: "My table" },
  { page: "earnings", href: "/host/earnings", label: "Earnings" },
];

export function SiteHeader({ current, mode = "guest" }: SiteHeaderProps) {
  const menu = mode === "host" ? hostLinks : links;
  return (
    <header className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-ivory md:grid-cols-[1fr_auto_1fr] md:px-10 md:pt-7">
      <Link
        href="/"
        className={`flex items-center gap-2 justify-self-start font-serif text-2xl leading-none ${focusRing}`}
      >
        <MehmanLogo className="h-9 w-auto" />
        Mehman
        {mode === "host" && (
          <span className="rounded-full bg-[#e8c08f]/15 px-2.5 py-1 font-sans text-xs text-[#e8c08f]">
            Hosting
          </span>
        )}
      </Link>

      {/* Phones use the bottom tab bar instead. */}
      <nav aria-label="Main" className="hidden md:block">
        <ul className="flex items-center gap-7 text-sm">
          {menu.map((link) => (
            <li key={link.page}>
              <Link
                href={link.href}
                aria-current={current === link.page ? "page" : undefined}
                className={`${focusRing} ${
                  current === link.page
                    ? "text-ivory underline decoration-terracotta-soft decoration-2 underline-offset-8"
                    : "text-ivory/70 hover:text-ivory"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-1 justify-self-end">
        {mode === "host" && (
          <Link
            href="/explore"
            className={`mr-1 hidden text-sm text-ivory/75 underline-offset-4 hover:underline sm:inline ${focusRing}`}
          >
            Switch to travelling
          </Link>
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
