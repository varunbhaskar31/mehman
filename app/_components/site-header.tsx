import Link from "next/link";
import type { ReactNode } from "react";
import { AccountButton } from "./account-button";
import { MehmanLogo } from "./mehman-logo";

type Page = "explore" | "how-it-works" | "our-story" | "host";

type SiteHeaderProps = {
  current?: Page;
};

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

const links: { page: Page; href: string; label: string }[] = [
  { page: "explore", href: "/explore", label: "Explore" },
  { page: "how-it-works", href: "/how-it-works", label: "How it works" },
  { page: "our-story", href: "/our-story", label: "Our story" },
  { page: "host", href: "/become-a-host", label: "Become a host" },
];

export function SiteHeader({ current }: SiteHeaderProps) {
  return (
    <header className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-ivory md:grid-cols-[1fr_auto_1fr] md:px-10 md:pt-7">
      <Link
        href="/"
        className={`flex items-center gap-2 justify-self-start font-serif text-2xl leading-none ${focusRing}`}
      >
        <MehmanLogo className="h-9 w-auto" />
        Mehman
      </Link>

      {/* Phones use the bottom tab bar instead. */}
      <nav aria-label="Main" className="hidden md:block">
        <ul className="flex items-center gap-7 text-sm">
          {links.map((link) => (
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

      <div className="justify-self-end">
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
