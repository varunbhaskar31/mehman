"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/explore", label: "Explore", match: ["/explore", "/experiences"] },
  { href: "/become-a-host", label: "Become a Host", match: ["/become-a-host"] },
];

// Phone navigation. On wider screens the header links take over.
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Keeps page content clear of the fixed bar. */}
      <div
        aria-hidden="true"
        className="h-[calc(3.5rem+env(safe-area-inset-bottom))] bg-pine md:hidden"
      />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ivory/10 bg-pine pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-2">
          {tabs.map((tab) => {
            const isCurrent = tab.match.some((path) =>
              pathname.startsWith(path),
            );
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex h-14 flex-col items-center justify-center gap-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ivory active:bg-ivory/5 ${
                    isCurrent ? "text-ivory" : "text-ivory/60"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-0.5 w-6 rounded-full ${isCurrent ? "bg-terracotta-soft" : "bg-transparent"}`}
                  />
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
