"use client";

import Image from "next/image";
import Link from "next/link";
import {
  EmptyState,
  focusRing,
  formatPrice,
  formatWhen,
  PageTitle,
  RequireUser,
  SampleDataNote,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import { SaveButton } from "@/app/_components/save-button";
import { findExploreCity } from "@/data/experiences";
import { mySavedTables, seatsLeft, upcomingSessions, useDemoState } from "@/lib/demo/store";

export function SavedScreen() {
  const state = useDemoState();

  return (
    <RequireUser>
      {() => {
        const tables = mySavedTables(state);
        return (
          <div className="space-y-6">
            <PageTitle kicker="Saved" title="Tables you'd love to sit at">
              Tap ♡ on any family table to keep it here, then come back to book.
            </PageTitle>
            {tables.length === 0 ? (
              <EmptyState title="Nothing saved yet" action={<Link href="/experiences" className={primaryButtonClass}>Browse experiences</Link>}>
                Save the meals that catch your eye while you explore.
              </EmptyState>
            ) : (
              <ul className="grid gap-6 md:grid-cols-2">
                {tables.map((table) => {
                  const host = state.hosts.find((h) => h.id === table.hostId);
                  const city = findExploreCity(host?.cityId);
                  const open = table.status === "approved";
                  const next = upcomingSessions(state, table.id).find((s) => seatsLeft(state, s) > 0);
                  return (
                    <li key={table.id} className="relative">
                      <Link href={`/tables/${table.id}`} className={`group block rounded-2xl ${focusRing}`}>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ivory/5">
                          <Image src={table.photos[0]} alt="" fill sizes="(min-width: 768px) 420px, 92vw" className={`object-cover ${open ? "" : "opacity-50 grayscale"}`} />
                        </div>
                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs tracking-[0.15em] text-terracotta-soft uppercase">{city?.name}</p>
                            <h2 className="font-serif text-xl leading-snug">{table.title}</h2>
                            <p className="truncate text-sm text-ivory/60">{host?.displayName}</p>
                          </div>
                          <p className="shrink-0 text-right">
                            <span className="block font-medium">{formatPrice(table.pricePerGuest)}</span>
                            <span className="block text-xs text-ivory/55">per guest</span>
                          </p>
                        </div>
                        <p className={`mt-1 text-sm ${open && next ? "text-[#e8c08f]" : "text-ivory/55"}`}>
                          {!open ? "Not taking bookings right now" : next ? `Next: ${formatWhen(next.startsAt)} · Book now` : "No open dates yet"}
                        </p>
                      </Link>
                      <div className="absolute top-3 right-3">
                        <SaveButton tableId={table.id} title={table.title} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <SampleDataNote />
          </div>
        );
      }}
    </RequireUser>
  );
}
