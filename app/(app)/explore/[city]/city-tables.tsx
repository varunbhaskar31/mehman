"use client";

import Image from "next/image";
import Link from "next/link";
import { cardClass, focusRing, formatPrice, formatWhen } from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import {
  approvedTablesInCity,
  seatsLeft,
  upcomingSessions,
  useDemoReady,
  useDemoState,
} from "@/lib/demo/store";

const vegLabel = { veg: "Vegetarian", non_veg: "Non-vegetarian", both: "Veg & non-veg" };

// Real host tables in this city, ready to request a seat at.
export function CityTables({ cityId, cityName }: { cityId: string; cityName: string }) {
  const state = useDemoState();
  const ready = useDemoReady();
  if (!ready) return <div className="mt-8 h-64" aria-hidden="true" />;

  const tables = approvedTablesInCity(state, cityId);

  if (tables.length === 0) {
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
      <ul className="grid gap-6 md:grid-cols-2">
        {tables.map((table) => {
          const host = state.hosts.find((h) => h.id === table.hostId)!;
          const next = upcomingSessions(state, table.id).find((s) => seatsLeft(state, s) > 0);
          return (
            <li key={table.id}>
              <Link href={`/tables/${table.id}`} className={`group block rounded-2xl ${focusRing}`}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ivory/5">
                  <Image src={table.photos[0]} alt="" fill sizes="(min-width: 768px) 420px, 92vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute top-3 left-3 rounded-full bg-pine/85 px-3 py-1 text-xs backdrop-blur">
                    {vegLabel[table.veg]}
                  </span>
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl leading-snug">{table.title}</h3>
                    <p className="truncate text-sm text-ivory/60">{host.displayName}</p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block font-medium">{formatPrice(table.pricePerGuest)}</span>
                    <span className="block text-xs text-ivory/55">per guest</span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-[#e8c08f]">
                  {next ? `Next: ${formatWhen(next.startsAt)}` : "No open dates right now"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
