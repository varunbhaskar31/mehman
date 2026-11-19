"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cardClass, formatPrice, formatWhen } from "@/app/_components/app-ui";
import { TableCard } from "@/app/_components/table-card";
import { primaryButtonClass } from "@/app/_components/fields";
import { localitySlug } from "@/data/city-map";
import { openCities } from "@/data/experiences";
import {
  approvedTablesInCity,
  rememberCity,
  seatsLeft,
  upcomingSessions,
  useAppReady,
  useAppState,
} from "@/lib/data/store";
import { DIET_TAGS, dietLabel, type DietTag } from "@/lib/data/types";

const chip = (active: boolean) =>
  `flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory ${
    active ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/20 text-ivory/75 hover:border-ivory/40 hover:text-ivory"
  }`;

const PRICE_CAPS = [800, 1200, 2000] as const;

// The date in India as yyyy-mm-dd, for comparing slots with the picker.
const istDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));

// Real host tables in this city, ready to request a seat at. ?near=<slug>
// (set when a neighbourhood is tapped on the Explore map) shows just that
// neighbourhood's tables. Guests can filter by date, price and diet.
export function CityTables({ cityId, cityName, open }: { cityId: string; cityName: string; open: boolean }) {
  const state = useAppState();
  const ready = useAppReady();
  const router = useRouter();
  const pathname = usePathname();
  const near = useSearchParams().get("near");
  const [date, setDate] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [diets, setDiets] = useState<DietTag[]>([]);
  // The Experiences tab reopens this city next time.
  useEffect(() => rememberCity(cityId), [cityId]);
  if (!ready) return <div className="mt-8 h-64" aria-hidden="true" />;

  if (!open) {
    return (
      <div className={`${cardClass} mt-8`}>
        <p className="font-serif text-2xl">Coming soon to {cityName}</p>
        <p className="mt-1 text-sm text-ivory/65">
          Mehman is starting in {openCities.map((c) => c.name).join(" and ")}. We&rsquo;ll open {cityName} next.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {openCities.map((c) => (
            <Link key={c.id} href={`/explore/${c.id}`} className={primaryButtonClass}>
              Eat in {c.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const allTables = approvedTablesInCity(state, cityId);
  const hostOf = (hostId: string) => state.hosts.find((h) => h.id === hostId);
  const localities = [...new Set(allTables.flatMap((t) => hostOf(t.hostId)?.locality ?? []))].sort();
  const current = localities.find((l) => localitySlug(l) === near) ?? null;

  const openSlots = (tableId: string) =>
    upcomingSessions(state, tableId).filter((s) => seatsLeft(state, s) > 0 && (!date || istDay(s.startsAt) === date));
  const tables = allTables.filter((t) => {
    if (current && hostOf(t.hostId)?.locality !== current) return false;
    if (maxPrice && t.pricePerGuest > maxPrice) return false;
    if (diets.length && !diets.every((d) => t.dietTags.includes(d))) return false;
    if (date && openSlots(t.id).length === 0) return false;
    return true;
  });
  const filtering = Boolean(date || maxPrice || diets.length);

  function pick(locality: string | null) {
    const href = locality ? `${pathname}?near=${localitySlug(locality)}` : pathname;
    router.replace(href, { scroll: false });
  }

  if (allTables.length === 0) {
    return (
      <div className={`${cardClass} mt-8`}>
        <p className="font-serif text-2xl">Hosts coming soon</p>
        <p className="mt-1 text-sm text-ivory/65">
          We&rsquo;re meeting families in {cityName} now. Does your family cook something {cityName} should taste?
        </p>
        <Link href="/become-a-host" className={`${primaryButtonClass} mt-5`}>
          Become a host
        </Link>
      </div>
    );
  }

  return (
    <section aria-label="Family tables" className="mt-8">
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-ivory/70">
            <span className="block">Date</span>
            <input
              type="date"
              value={date}
              min={istDay(new Date().toISOString())}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block min-h-11 rounded-full border border-ivory/20 bg-transparent px-4 text-ivory [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-ivory"
            />
          </label>
          <div role="group" aria-label="Price per guest" className="no-scrollbar flex gap-2 overflow-x-auto">
            {PRICE_CAPS.map((cap) => (
              <button key={cap} type="button" aria-pressed={maxPrice === cap} onClick={() => setMaxPrice(maxPrice === cap ? null : cap)} className={chip(maxPrice === cap)}>
                Up to {formatPrice(cap)}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Diet" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {DIET_TAGS.map((tag) => {
            const on = diets.includes(tag);
            return (
              <button key={tag} type="button" aria-pressed={on} onClick={() => setDiets(on ? diets.filter((d) => d !== tag) : [...diets, tag])} className={chip(on)}>
                {dietLabel[tag]}
              </button>
            );
          })}
          {filtering && (
            <button type="button" onClick={() => { setDate(""); setMaxPrice(null); setDiets([]); }} className="min-h-11 shrink-0 px-2 text-sm text-ivory/60 underline underline-offset-4">
              Clear
            </button>
          )}
        </div>
        {localities.length > 1 && (
          <div role="group" aria-label="Neighbourhood" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {[null, ...localities].map((locality) => (
              <button key={locality ?? "all"} type="button" aria-pressed={locality === current} onClick={() => pick(locality)} className={chip(locality === current)}>
                {locality ?? `All of ${cityName}`}
              </button>
            ))}
          </div>
        )}
      </div>
      {tables.length === 0 ? (
        <p className={`${cardClass} text-ivory/70`}>No tables match. Try another date or fewer filters.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
          {tables.map((table) => {
            const next = openSlots(table.id)[0];
            return (
              <TableCard
                key={table.id}
                table={table}
                host={hostOf(table.hostId)}
                kicker={hostOf(table.hostId)?.locality}
                footnote={next ? `${date ? "" : "Next: "}${formatWhen(next.startsAt)}` : "No open dates right now"}
                highlight={Boolean(next)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
