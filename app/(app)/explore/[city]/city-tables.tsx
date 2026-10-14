"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cardClass, formatWhen } from "@/app/_components/app-ui";
import { TableCard } from "@/app/_components/table-card";
import { primaryButtonClass } from "@/app/_components/fields";
import {
  approvedTablesInCity,
  rememberCity,
  seatsLeft,
  upcomingSessions,
  useDemoReady,
  useDemoState,
} from "@/lib/demo/store";

// Real host tables in this city, ready to request a seat at.
export function CityTables({ cityId, cityName }: { cityId: string; cityName: string }) {
  const state = useDemoState();
  const ready = useDemoReady();
  // The Experiences tab reopens this city next time.
  useEffect(() => rememberCity(cityId), [cityId]);
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
      <ul className="grid gap-6 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
        {tables.map((table) => {
          const next = upcomingSessions(state, table.id).find((s) => seatsLeft(state, s) > 0);
          return (
            <TableCard
              key={table.id}
              table={table}
              host={state.hosts.find((h) => h.id === table.hostId)}
              footnote={next ? `Next: ${formatWhen(next.startsAt)}` : "No open dates right now"}
              highlight={Boolean(next)}
            />
          );
        })}
      </ul>
    </section>
  );
}
