"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
  bookingDetails,
  setBookingStatus,
  useDemoState,
} from "@/lib/demo/store";
import type { Booking, DemoState } from "@/lib/demo/types";

function TripCard({ state, booking }: { state: DemoState; booking: Booking }) {
  const { session, table, host } = bookingDetails(state, booking);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCancel = booking.status === "requested" || booking.status === "accepted";
  const hostPhone = host.contactPhone.replace(/\s+/g, "");

  return (
    <li className={`${cardClass} p-0`}>
      <Link href={`/tables/${table.id}`} className={`flex gap-4 rounded-2xl p-4 ${focusRing}`}>
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ivory/5">
          <Image src={table.photos[0]} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <StatusChip status={booking.status} />
          <p className="mt-1.5 font-serif text-xl leading-snug">{table.title}</p>
          <p className="text-sm text-ivory/60">
            {formatWhen(session.startsAt)} · {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"}
          </p>
        </div>
      </Link>

      <div className="space-y-3 border-t border-ivory/10 px-4 py-4 text-sm">
        {booking.status === "requested" && (
          <p className="text-ivory/70">Waiting for {host.displayName} to reply. The address appears here once they accept.</p>
        )}
        {booking.status === "accepted" && (
          <div className="space-y-2">
            <p className="text-ivory/80">
              <span className="text-ivory/55">Address · </span>
              {host.address}
            </p>
            <p className="text-ivory/80">
              <span className="text-ivory/55">Pay at the meal · </span>
              {formatPrice(table.pricePerGuest * booking.partySize)} (UPI or cash)
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a href={`tel:${hostPhone}`} className={secondaryButtonClass}>Call host</a>
              <a href={`https://wa.me/${hostPhone.replace("+", "")}`} target="_blank" rel="noreferrer" className={secondaryButtonClass}>WhatsApp</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(host.address)}`} target="_blank" rel="noreferrer" className={secondaryButtonClass}>Directions</a>
            </div>
          </div>
        )}
        {booking.status === "declined" && (
          <p className="text-ivory/70">{host.displayName} couldn&rsquo;t host you on this date. Try another date or table.</p>
        )}

        {canCancel &&
          (confirming ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-ivory/80">Cancel this {booking.status === "accepted" ? "booking" : "request"}?</p>
              <button
                type="button"
                onClick={() => {
                  const result = setBookingStatus(booking.id, "cancelled");
                  if ("error" in result) setError(result.error);
                  setConfirming(false);
                }}
                className={`rounded-full bg-terracotta px-4 py-2 text-ivory ${focusRing}`}
              >
                Yes, cancel
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`rounded px-2 py-2 text-ivory/70 ${focusRing}`}>
                Keep it
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className={`rounded text-ivory/60 underline underline-offset-4 ${focusRing}`}>
              Cancel {booking.status === "accepted" ? "booking" : "request"}
            </button>
          ))}
        {error && <p role="alert" className="text-terracotta-soft">{error}</p>}
      </div>
    </li>
  );
}

export function TripsScreen() {
  const state = useDemoState();

  return (
    <RequireUser>
      {(user) => {
        const mine = state.bookings
          .filter((b) => b.guestId === user.id)
          .map((b) => ({ booking: b, when: bookingDetails(state, b).session.startsAt }));
        const now = new Date().toISOString();
        const upcoming = mine
          .filter((x) => x.when > now && (x.booking.status === "requested" || x.booking.status === "accepted"))
          .sort((a, b) => a.when.localeCompare(b.when));
        const past = mine
          .filter((x) => !upcoming.includes(x))
          .sort((a, b) => b.when.localeCompare(a.when));

        return (
          <div className="space-y-8">
            <PageTitle kicker="My trips" title="Your seats at the table" />
            {mine.length === 0 ? (
              <EmptyState title="No trips yet" action={<Link href="/explore" className={primaryButtonClass}>Find a table</Link>}>
                When you request a seat at a family&rsquo;s table, it shows up here.
              </EmptyState>
            ) : (
              <>
                <section>
                  <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase">Upcoming</h2>
                  {upcoming.length === 0 ? (
                    <p className="mt-3 text-ivory/65">Nothing coming up.</p>
                  ) : (
                    <ul className="mt-3 space-y-4">
                      {upcoming.map(({ booking }) => <TripCard key={booking.id} state={state} booking={booking} />)}
                    </ul>
                  )}
                </section>
                {past.length > 0 && (
                  <section>
                    <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase">Past and cancelled</h2>
                    <ul className="mt-3 space-y-4">
                      {past.map(({ booking }) => <TripCard key={booking.id} state={state} booking={booking} />)}
                    </ul>
                  </section>
                )}
              </>
            )}
            <SampleDataNote />
          </div>
        );
      }}
    </RequireUser>
  );
}
