import type { ReactNode } from "react";
import { SiteHeader } from "@/app/_components/site-header";

export type LegalSection = { heading: string; body: ReactNode };

// Terms and Privacy share one plain, readable layout.
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-pine text-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">Mehman</p>
        <h1 className="mt-1 font-serif text-4xl leading-tight">{title}</h1>
        <p className="mt-2 text-sm text-ivory/55">Last updated {updated}</p>
        <div className="mt-6 text-base leading-relaxed text-ivory/80">{intro}</div>
        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl">
                {index + 1}. {section.heading}
              </h2>
              <div className="mt-2 space-y-3 leading-relaxed text-ivory/75">{section.body}</div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
