"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { cardClass, formatWhen } from "@/app/_components/app-ui";
import { TableCard } from "@/app/_components/table-card";
import { primaryButtonClass } from "@/app/_components/fields";
import { localitySlug } from "@/data/city-map";
import {
  approvedTablesInCity,
  rememberCity,
  seatsLeft,
  upcomingSessions,
  useDemoReady,
  useDemoState,
} from "@/lib/demo/store";

// Real host tables in this city, ready to request a seat at. ?near=<slug>
// (set when a neighbourhood is tapped on the Explore map) shows just that
// neighbourhood's tables.
export function CityTables({ cityId, cityName }: { cityId: string; cityName: string }) {
  const state = useDemoState();
  const ready = useDemoReady();
  const router = useRouter();
  const pathname = usePathname();
  const near = useSearchParams().get("near");
  // The Experiences tab reopens this city next time.
  useEffect(() => rememberCity(cityId), [cityId]);
  if (!ready) return <div className="mt-8 h-64" aria-hidden="true" />;

  const allTables = approvedTablesInCity(state, cityId);
  const hostOf = (hostId: string) => state.hosts.find((h) => h.id === hostId);
  const localities = [
    ...new Set(allTables.flatMap((t) => hostOf(t.hostId)?.locality ?? [])),
  ].sort();
  const current = localities.find((l) => localitySlug(l) === near) ?? null;
  const tables = current
    ? allTables.filter((t) => hostOf(t.hostId)?.locality === current)
    : allTables;

  function pick(locality: string | null) {
    const href = locality ? `${pathname}?near=${localitySlug(locality)}` : pathname;
    router.replace(href, { scroll: false });
  }

  if (allTables.length === 0) {
    return (
      <div className={`${cardClass} mt-8`}>
        <p className="font-serif text-2xl">Hosts coming soon</p>
        <p className="mt-1 text-sm text-ivory/65">
          We&rsquo;re meeting families in {cityName} now. Does your family cook
          something {cityName} should taste?
        </p>
        <Link href="/become-a-host" className={`${primaryButtonClass} mt-5`}>
          Become a host
        </Link>
      </div>
    );
  }

  return (
    <section aria-label="Family tables" className="mt-8">
      {localities.length > 1 && (
        <div role="group" aria-label="Neighbourhood" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {[null, ...localities].map((locality) => {
            const active = locality === current;
            return (
              <button
                key={locality ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => pick(locality)}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory ${
                  active
                    ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]"
                    : "border-ivory/20 text-ivory/75 hover:border-ivory/40 hover:text-ivory"
                }`}
              >
                {locality ?? `All of ${cityName}`}
              </button>
            );
          })}
        </div>
      )}
      <ul className="grid gap-6 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
        {tables.map((table) => {
          const next = upcomingSessions(state, table.id).find((s) => seatsLeft(state, s) > 0);
          return (
            <TableCard
              key={table.id}
              table={table}
              host={hostOf(table.hostId)}
              kicker={hostOf(table.hostId)?.locality}
              footnote={next ? `Next: ${formatWhen(next.startsAt)}` : "No open dates right now"}
              highlight={Boolean(next)}
            />
          );
        })}
      </ul>
    </section>
  );
}
