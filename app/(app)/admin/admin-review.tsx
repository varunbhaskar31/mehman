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
  secondaryButtonClass,
  StatusChip,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import { findExploreCity } from "@/data/experiences";
import { reviewHost, reviewTableChanges, upcomingSessions, useAppState } from "@/lib/data/store";
import type { AppState, DiningTable, Host } from "@/lib/data/types";

function Application({ state, host }: { state: AppState; host: Host }) {
  const uid = useId();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const table = state.tables.find((t) => t.hostId === host.id);
  const applicant = state.profiles.find((p) => p.id === host.userId);
  const sessions = table ? upcomingSessions(state, table.id) : [];

  async function decide(approve: boolean) {
    if (!approve && note.trim().length < 5) return setError("Add a short note so the host knows why.");
    const result = await reviewHost(host.id, approve, note);
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

function TableChange({ state, table }: { state: AppState; table: DiningTable }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const host = state.hosts.find((h) => h.id === table.hostId)!;
  async function decide(approve: boolean) {
    if (!approve && note.trim().length < 5) return setError("Add a short note so the host knows why.");
    const result = await reviewTableChanges(table.id, approve, note);
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
  const state = useAppState();

  return (
    <RequireUser role="admin">
      {() => {
        const pending = state.hosts.filter((h) => h.status === "pending");
        const changes = state.tables.filter(
          (t) => t.status === "pending" && state.hosts.find((h) => h.id === t.hostId)?.status === "approved",
        );
        const live = state.tables.filter((t) => t.status === "approved").length;
        const waitingBookings = state.bookings.filter((b) => b.status === "requested").length;
        const stats = [
          { label: "new hosts", value: pending.length },
          { label: "changes", value: changes.length },
          { label: "live tables", value: live },
          { label: "awaiting hosts", value: waitingBookings },
        ];
        return (
          <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
              <PageTitle kicker="Mehman team" title="Review">
                Check every home before it goes live, and every price or photo change after.
              </PageTitle>
              <Link href="/explore" className={`mt-1 shrink-0 rounded text-sm text-ivory/70 underline underline-offset-4 md:hidden ${focusRing}`}>
                Switch to travelling
              </Link>
            </div>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className={`${cardClass} px-3 py-4 text-center`}>
                  <p className="font-serif text-3xl">{stat.value}</p>
                  <p className="text-xs text-ivory/55">{stat.label}</p>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl">New host applications</h2>
              {pending.length === 0 ? (
                <p className={`${cardClass} text-ivory/70`}>No applications waiting.</p>
              ) : (
                <ul className="space-y-6">{pending.map((h) => <Application key={h.id} state={state} host={h} />)}</ul>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl">Changes to check</h2>
              <p className="text-sm text-ivory/60">Live hosts who changed their price or photos. Their table is hidden until you approve.</p>
              {changes.length === 0 ? (
                <p className={`${cardClass} text-ivory/70`}>Nothing to check.</p>
              ) : (
                <ul className="space-y-4">{changes.map((t) => <TableChange key={t.id} state={state} table={t} />)}</ul>
              )}
            </section>
          </div>
        );
      }}
    </RequireUser>
  );
}
