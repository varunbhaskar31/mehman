"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  cardClass,
  focusRing,
  formatPrice,
  PageTitle,
  RequireUser,
  secondaryButtonClass,
  Stars,
  StatusChip,
} from "@/app/_components/app-ui";
import { exploreCities, findExploreCity } from "@/data/experiences";
import { adminSetTablePaused, tableRating, useAppState } from "@/lib/data/store";

export function AdminHosts() {
  const state = useAppState();
  const [cityId, setCityId] = useState("all");
  const [error, setError] = useState<string | null>(null);

  return (
    <RequireUser role="admin">
      {() => {
        const hosts = state.hosts.filter((h) => cityId === "all" || h.cityId === cityId);
        return (
          <div className="space-y-6">
            <PageTitle kicker="Mehman team" title="Hosts">
              Every host and their table. Pause a live table to take it off Explore.
            </PageTitle>
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
              <div className="flex w-max gap-2">
                {[{ id: "all", name: "All cities" }, ...exploreCities].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={cityId === c.id}
                    onClick={() => setCityId(c.id)}
                    className={`h-10 rounded-full border px-4 text-sm ${focusRing} ${cityId === c.id ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/20 text-ivory/75"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
            {hosts.length === 0 ? (
              <p className={`${cardClass} text-ivory/70`}>No hosts in this city yet.</p>
            ) : (
              <ul className="space-y-3">
                {hosts.map((host) => {
                  const table = state.tables.find((t) => t.hostId === host.id);
                  const owner = state.profiles.find((p) => p.id === host.userId);
                  const rating = table ? tableRating(state, table.id) : null;
                  const hosted = table
                    ? state.bookings.filter((b) => b.status === "completed" && state.sessions.find((s) => s.id === b.sessionId)?.tableId === table.id).length
                    : 0;
                  return (
                    <li key={host.id} className={`${cardClass} flex gap-4`}>
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ivory/5">
                        {table?.photos[0] && <Image src={table.photos[0]} alt="" fill sizes="80px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-serif text-xl leading-snug">{host.displayName}</p>
                          {table && <StatusChip status={table.status} />}
                        </div>
                        <p className="text-sm text-ivory/60">
                          {findExploreCity(host.cityId)?.name} · {owner?.fullName} · {owner?.phone || owner?.email}
                        </p>
                        {table && (
                          <p className="text-sm text-ivory/60">
                            {table.title} · {formatPrice(table.pricePerGuest)} ·{" "}
                            {rating?.count ? <><Stars rating={rating.average} /> {rating.average.toFixed(1)}</> : "no reviews"} · {hosted} {hosted === 1 ? "meal" : "meals"} hosted
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                          {table && <Link href={`/tables/${table.id}`} className={`rounded underline underline-offset-4 ${focusRing}`}>View table</Link>}
                          {table && (table.status === "approved" || table.status === "paused") && (
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await adminSetTablePaused(table.id, table.status === "approved");
                                setError("error" in result ? result.error : null);
                              }}
                              className={secondaryButtonClass}
                            >
                              {table.status === "approved" ? "Pause table" : "Make live again"}
                            </button>
                          )}
                          {host.status === "pending" && <Link href="/admin" className={`rounded text-[#e8c08f] underline underline-offset-4 ${focusRing}`}>Review application</Link>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      }}
    </RequireUser>
  );
}
