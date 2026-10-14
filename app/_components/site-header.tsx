import Link from "next/link";
import type { ReactNode } from "react";

type SiteHeaderProps = {
  current?: "explore" | "host";
  exploreHref?: string;
  // Optional control on the right, such as the dining-city selector.
  children?: ReactNode;
};

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

export function SiteHeader({
  current,
  exploreHref = "/explore",
  children,
}: SiteHeaderProps) {
  const linkClass = (page: SiteHeaderProps["current"]) =>
    `${focusRing} ${
      current === page
        ? "text-ivory underline decoration-terracotta-soft decoration-2 underline-offset-8"
        : "text-ivory/70 hover:text-ivory"
    }`;

  return (
    <header className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] text-ivory md:grid-cols-[1fr_auto_1fr] md:px-10 md:pt-8">
      <Link
        href="/"
        className={`justify-self-start font-serif text-3xl leading-none ${focusRing}`}
      >
        Mehman
      </Link>

      <nav
        aria-label="Main"
        // Phones use the bottom tab bar instead.
        className={
          children
            ? "hidden md:col-start-2 md:row-start-1 md:block"
            : "hidden md:col-start-2 md:block md:justify-self-center"
        }
      >
        <ul className="flex items-center gap-6 text-sm md:gap-7">
          <li>
            <Link
              href={exploreHref}
              aria-current={current === "explore" ? "page" : undefined}
              className={linkClass("explore")}
            >
              Explore
            </Link>
          </li>
          <li>
            <Link
              href="/become-a-host"
              aria-current={current === "host" ? "page" : undefined}
              className={linkClass("host")}
            >
              Become a Host
            </Link>
          </li>
        </ul>
      </nav>

      {children && (
        <div className="justify-self-end md:col-start-3">{children}</div>
      )}
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
