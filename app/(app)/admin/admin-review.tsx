"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import {
  cardClass,
  focusRing,
  formatPrice,
  formatWhen,
  PageTitle,
  RequireUser,
  SampleDataNote,
  secondaryButtonClass,
  StatusChip,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import { findExploreCity } from "@/data/experiences";
import { reviewHost, reviewTableChanges, upcomingSessions, useDemoState } from "@/lib/demo/store";
import type { DemoState, DiningTable, Host } from "@/lib/demo/types";

function Application({ state, host }: { state: DemoState; host: Host }) {
  const uid = useId();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const table = state.tables.find((t) => t.hostId === host.id);
  const applicant = state.profiles.find((p) => p.id === host.userId);
  const sessions = table ? upcomingSessions(state, table.id) : [];

  function decide(approve: boolean) {
    if (!approve && note.trim().length < 5) return setError("Add a short note so the host knows why.");
    const result = reviewHost(host.id, approve, note);
    if ("error" in result) setError(result.error);
  }

  return (
    <li className={`${cardClass} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl leading-snug">{host.displayName}</p>
          <p className="text-sm text-ivory/60">
            {findExploreCity(host.cityId)?.name} · applied by {applicant?.fullName || applicant?.email} · {formatWhen(host.createdAt)}
          </p>
        </div>
        <StatusChip status={host.status} />
      </div>

      {table && (
        <>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {table.photos.map((photo, index) => (
              <div key={index} className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-ivory/5">
                <Image src={photo} alt="" fill sizes="112px" className="object-cover" />
              </div>
            ))}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Meal", `${table.title} (${table.cuisine})`],
              ["Price", `${formatPrice(table.pricePerGuest)} per guest · up to ${table.maxGuests}`],
              ["About", host.bio],
              ["Story", table.story],
              ["Menu", table.menu],
              ["Languages", host.languages.join(", ")],
              ["Address", host.address],
              ["Phone", host.contactPhone],
              ["First dates", sessions.map((s) => formatWhen(s.startsAt)).join(" · ") || "None yet"],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="text-ivory/50">{term}</dt>
                <dd className="mt-0.5 text-ivory/85">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <div>
        <label htmlFor={`${uid}-note`} className="text-sm text-ivory/80">
          Note to the host <span className="text-ivory/50">(needed if you reject)</span>
        </label>
        <textarea id={`${uid}-note`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 block w-full rounded-xl border border-ivory/25 bg-transparent px-4 py-3 text-ivory focus-visible:outline-2 focus-visible:outline-ivory" />
      </div>
      {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => decide(true)} className={primaryButtonClass}>Approve and publish</button>
        <button type="button" onClick={() => decide(false)} className={secondaryButtonClass}>Reject</button>
      </div>
    </li>
  );
}

function TableChange({ state, table }: { state: DemoState; table: DiningTable }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const host = state.hosts.find((h) => h.id === table.hostId)!;
  function decide(approve: boolean) {
    if (!approve && note.trim().length < 5) return setError("Add a short note so the host knows why.");
    const result = reviewTableChanges(table.id, approve, note);
    if ("error" in result) setError(result.error);
  }
  return (
    <li className={`${cardClass} space-y-3`}>
      <div>
        <p className="font-serif text-xl">{host.displayName}</p>
        <p className="text-sm text-ivory/60">{table.title} · now {formatPrice(table.pricePerGuest)} per guest</p>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {table.photos.map((photo, index) => (
          <div key={index} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-ivory/5">
            <Image src={photo} alt="" fill sizes="96px" className="object-cover" />
          </div>
        ))}
      </div>
      <textarea aria-label="Note to the host" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (needed if you reject)" className="block w-full rounded-xl border border-ivory/25 bg-transparent px-4 py-3 text-ivory placeholder:text-ivory/35 focus-visible:outline-2 focus-visible:outline-ivory" />
      {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => decide(true)} className={primaryButtonClass}>Approve changes</button>
        <button type="button" onClick={() => decide(false)} className={secondaryButtonClass}>Reject</button>
        <Link href={`/tables/${table.id}`} className={`self-center rounded text-sm underline ${focusRing}`}>Preview</Link>
      </div>
    </li>
  );
}

export function AdminReview() {
  const state = useDemoState();

  return (
    <RequireUser role="admin">
      {() => {
        const pending = state.hosts.filter((h) => h.status === "pending");
        const reviewed = state.hosts.filter((h) => h.status !== "pending");
        return (
          <div className="space-y-8">
            <PageTitle kicker="Mehman team" title="Review new hosts">
              Check every home before it goes live. Approving publishes the host&rsquo;s table to their city page.
            </PageTitle>
            {pending.length === 0 ? (
              <p className={`${cardClass} text-ivory/70`}>No applications waiting. 🎉</p>
            ) : (
              <ul className="space-y-6">{pending.map((h) => <Application key={h.id} state={state} host={h} />)}</ul>
            )}
            {(() => {
              const changes = state.tables.filter(
                (t) => t.status === "pending" && state.hosts.find((h) => h.id === t.hostId)?.status === "approved",
              );
              return changes.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="font-serif text-2xl">Changes to check</h2>
                  <p className="text-sm text-ivory/60">Live hosts who changed their price or photos. Their table is hidden until you approve.</p>
                  <ul className="space-y-4">{changes.map((t) => <TableChange key={t.id} state={state} table={t} />)}</ul>
                </section>
              ) : null;
            })()}
            <section>
              <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase">All hosts</h2>
              <ul className="mt-3 divide-y divide-ivory/10">
                {reviewed.map((host) => {
                  const table = state.tables.find((t) => t.hostId === host.id);
                  return (
                    <li key={host.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0">
                        <span className="block truncate">{host.displayName}</span>
                        <span className="block text-xs text-ivory/55">{findExploreCity(host.cityId)?.name}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        {table && <StatusChip status={table.status} />}
                        {table && <Link href={`/tables/${table.id}`} className={`rounded text-sm underline ${focusRing}`}>View</Link>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <SampleDataNote />
          </div>
        );
      }}
    </RequireUser>
  );
}
