"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

const columns = [
  {
    title: "Mehman",
    links: [
      { href: "/explore", label: "Explore cities" },
      { href: "/how-it-works", label: "How Mehman works" },
      { href: "/our-story", label: "Our story" },
    ],
  },
  {
    title: "Hosting",
    links: [
      { href: "/become-a-host", label: "Become a host" },
      { href: "/host", label: "Your hosting" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "mailto:hello@mehman.in", label: "Get help" },
      { href: "mailto:hello@mehman.in?subject=Feedback", label: "Share feedback" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

// The website footer on wider screens, like Airbnb's. Hosting and team
// consoles, and the login screen, stay uncluttered.
export function SiteFooter() {
  const pathname = usePathname();
  const hidden = ["/host", "/admin", "/login"].some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hidden) return null;

  return (
    <footer className="hidden border-t border-ivory/10 bg-night text-ivory md:block">
      <div className="mx-auto max-w-7xl px-10 py-12">
        <div className="grid grid-cols-3 gap-10">
          {columns.map((column) => (
            <section key={column.title}>
              <h2 className="text-sm font-medium">{column.title}</h2>
              <ul className="mt-4 space-y-3 text-sm text-ivory/65">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={`hover:text-ivory hover:underline ${focusRing}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-ivory/10 pt-6 text-sm text-ivory/55">
          <p>© Mehman · Home-dining across India</p>
          <p>English (IN) · ₹ INR</p>
        </div>
      </div>
    </footer>
  );
}
