"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import {
  cardClass,
  EmptyState,
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
import {
  addSession,
  bookingDetails,
  hasStarted,
  hostForUser,
  removeSession,
  seatsLeft,
  setBookingStatus,
  setOwnTablePaused,
  upcomingSessions,
  useDemoState,
} from "@/lib/demo/store";
import type { Booking, DemoState, DiningTable } from "@/lib/demo/types";

function RequestCard({ state, booking }: { state: DemoState; booking: Booking }) {
  const { session, guest } = bookingDetails(state, booking);
  const [error, setError] = useState<string | null>(null);
  const act = (next: "accepted" | "declined" | "completed" | "cancelled") => {
    const result = setBookingStatus(booking.id, next);
    if ("error" in result) setError(result.error);
  };
  const past = hasStarted(session.startsAt);

  return (
    <li className={`${cardClass} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-xl">{guest.fullName || "A guest"}</p>
          <p className="text-sm text-ivory/60">
            {formatWhen(session.startsAt)} · {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"}
          </p>
        </div>
        <StatusChip status={booking.status} />
      </div>
      {booking.note && <p className="rounded-xl bg-ivory/[0.05] px-4 py-3 text-sm text-ivory/80">&ldquo;{booking.note}&rdquo;</p>}
      {booking.status === "accepted" && guest.phone && (
        <p className="text-sm text-ivory/70">
          Guest&rsquo;s number: <a href={`tel:${guest.phone.replace(/\s+/g, "")}`} className={`rounded underline ${focusRing}`}>{guest.phone}</a>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {booking.status === "requested" && (
          <>
            <button type="button" onClick={() => act("accepted")} className={primaryButtonClass}>Accept</button>
            <button type="button" onClick={() => act("declined")} className={secondaryButtonClass}>Decline</button>
          </>
        )}
        {booking.status === "accepted" && past && (
          <button type="button" onClick={() => act("completed")} className={secondaryButtonClass}>Mark as hosted</button>
        )}
        {booking.status === "accepted" && !past && (
          <button type="button" onClick={() => act("cancelled")} className={`rounded px-1 text-sm text-ivory/60 underline underline-offset-4 ${focusRing}`}>Cancel this booking</button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
    </li>
  );
}

function DatesManager({ state, table }: { state: DemoState; table: DiningTable }) {
  const uid = useId();
  const [when, setWhen] = useState("");
  const [seats, setSeats] = useState(table.maxGuests);
  const [error, setError] = useState<string | null>(null);
  const sessions = upcomingSessions(state, table.id);

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl">Your dates</h2>
      {sessions.length === 0 ? (
        <p className="text-ivory/65">No upcoming dates. Add one so guests can book.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => {
            const booked = session.seatsTotal - seatsLeft(state, session);
            return (
              <li key={session.id} className="flex items-center justify-between gap-3 rounded-xl border border-ivory/15 px-4 py-3">
                <span>
                  {formatWhen(session.startsAt)}
                  <span className="block text-xs text-ivory/55">{booked} of {session.seatsTotal} seats taken or requested</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const result = removeSession(session.id);
                    setError("error" in result ? result.error : null);
                  }}
                  className={`rounded text-sm text-ivory/60 underline ${focusRing}`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className={`${cardClass} flex flex-wrap items-end gap-3`}>
        <div className="min-w-0 flex-1">
          <label htmlFor={`${uid}-when`} className="text-sm text-ivory/80">New date</label>
          <input id={`${uid}-when`} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-2 block w-full rounded-lg border border-ivory/25 bg-transparent px-3 py-2.5 text-ivory [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-ivory" />
        </div>
        <div>
          <label htmlFor={`${uid}-seats`} className="text-sm text-ivory/80">Seats</label>
          <input id={`${uid}-seats`} type="number" min={1} max={table.maxGuests} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="mt-2 block w-20 rounded-lg border border-ivory/25 bg-transparent px-3 py-2.5 text-ivory focus-visible:outline-2 focus-visible:outline-ivory" />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!when) return setError("Pick a date and time.");
            const result = addSession(table.id, new Date(when).toISOString(), seats);
            if ("error" in result) return setError(result.error);
            setError(null);
            setWhen("");
          }}
          className={secondaryButtonClass}
        >
          Add
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
    </section>
  );
}

export function HostDashboard() {
  const state = useDemoState();
  const justSubmitted = useSearchParams().get("submitted") === "1";

  return (
    <RequireUser>
      {(user) => {
        const host = hostForUser(state, user.id);
        if (!host) {
          return (
            <EmptyState title="You're not hosting yet" action={<Link href="/become-a-host" className={primaryButtonClass}>Become a host</Link>}>
              Open your table to travellers who want to taste your city the way your family cooks it.
            </EmptyState>
          );
        }
        const table = state.tables.find((t) => t.hostId === host.id);
        const myBookings = state.bookings.filter((b) => {
          const session = state.sessions.find((s) => s.id === b.sessionId);
          return session && session.tableId === table?.id;
        });
        const byDate = (a: Booking, b: Booking) =>
          bookingDetails(state, a).session.startsAt.localeCompare(bookingDetails(state, b).session.startsAt);
        const requests = myBookings.filter((b) => b.status === "requested").sort(byDate);
        const confirmed = myBookings.filter((b) => b.status === "accepted").sort(byDate);

        return (
          <div className="space-y-8">
            <PageTitle kicker="Hosting" title={host.displayName} />

            {justSubmitted && host.status === "pending" && (
              <div className="rounded-2xl bg-[#8fc79a]/15 px-5 py-4 text-[#cfe9d4]">
                <p className="font-medium">Thank you! Your application is in.</p>
                <p className="mt-1 text-sm">We&rsquo;ll call you within a few days to arrange a short visit.</p>
              </div>
            )}

            {table && (
              <section className={`${cardClass} flex gap-4`}>
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-ivory/5">
                  {table.photos[0] && <Image src={table.photos[0]} alt="" fill sizes="96px" className="object-cover" unoptimized={table.photos[0].startsWith("data:")} />}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <StatusChip status={table.status} />
                  <p className="font-serif text-xl leading-snug">{table.title}</p>
                  <p className="text-sm text-ivory/60">{formatPrice(table.pricePerGuest)} per guest · up to {table.maxGuests}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
                    <Link href={`/tables/${table.id}`} className={`rounded underline underline-offset-4 ${focusRing}`}>View as a guest</Link>
                    {(table.status === "approved" || table.status === "paused") && (
                      <button type="button" onClick={() => setOwnTablePaused(table.id, table.status === "approved")} className={`rounded underline underline-offset-4 ${focusRing}`}>
                        {table.status === "approved" ? "Pause bookings" : "Resume bookings"}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {host.status === "pending" && (
              <p className="text-ivory/70">
                Your table is <strong className="text-[#e8c08f]">under review</strong>. Guests can&rsquo;t see it yet. You can still add dates below.
              </p>
            )}
            {host.status === "rejected" && (
              <p className="rounded-2xl bg-terracotta/20 px-5 py-4 text-terracotta-soft">
                Your table wasn&rsquo;t approved this time.{host.reviewNote ? ` Note from Mehman: ${host.reviewNote}` : ""}
              </p>
            )}

            <section className="space-y-4">
              <h2 className="font-serif text-2xl">
                Requests {requests.length > 0 && <span className="ml-1 rounded-full bg-terracotta px-2.5 py-0.5 align-middle font-sans text-sm">{requests.length}</span>}
              </h2>
              {requests.length === 0 ? (
                <p className="text-ivory/65">No new requests.</p>
              ) : (
                <ul className="space-y-3">{requests.map((b) => <RequestCard key={b.id} state={state} booking={b} />)}</ul>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl">Confirmed guests</h2>
              {confirmed.length === 0 ? (
                <p className="text-ivory/65">No confirmed guests yet.</p>
              ) : (
                <ul className="space-y-3">{confirmed.map((b) => <RequestCard key={b.id} state={state} booking={b} />)}</ul>
              )}
            </section>

            {table && <DatesManager state={state} table={table} />}

            <SampleDataNote />
          </div>
        );
      }}
    </RequireUser>
  );
}
