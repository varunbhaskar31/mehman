"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  cardClass,
  EmptyState,
  focusRing,
  formatWhen,
  RequireUser,
  secondaryButtonClass,
  StatusChip,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import {
  bookingDetails,
  hasStarted,
  hostForUser,
  setBookingStatus,
  useDemoState,
} from "@/lib/demo/store";
import type { Booking, DemoState, DiningTable, Host, Profile } from "@/lib/demo/types";

// Every host page: signed in, and has applied to host.
export function HostGate({
  children,
}: {
  children: (context: { user: Profile; host: Host; table: DiningTable | null; state: DemoState }) => ReactNode;
}) {
  const state = useDemoState();
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
        const table = state.tables.find((t) => t.hostId === host.id) ?? null;
        return <>{children({ user, host, table, state })}</>;
      }}
    </RequireUser>
  );
}

// All bookings for a host's table, in date order.
export function bookingsForTable(state: DemoState, tableId: string | undefined) {
  return state.bookings
    .filter((b) => state.sessions.find((s) => s.id === b.sessionId)?.tableId === tableId)
    .sort((a, b) =>
      bookingDetails(state, a).session.startsAt.localeCompare(bookingDetails(state, b).session.startsAt),
    );
}

export function GuestBookingCard({ state, booking }: { state: DemoState; booking: Booking }) {
  const { session, guest } = bookingDetails(state, booking);
  const [error, setError] = useState<string | null>(null);
  const act = (next: Booking["status"]) => {
    const result = setBookingStatus(booking.id, next);
    if ("error" in result) setError(result.error);
  };
  const started = hasStarted(session.startsAt);

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
          Guest&rsquo;s number:{" "}
          <a href={`tel:${guest.phone.replace(/\s+/g, "")}`} className={`rounded underline ${focusRing}`}>{guest.phone}</a>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {booking.status === "requested" && (
          <>
            <button type="button" onClick={() => act("accepted")} className={primaryButtonClass}>Accept</button>
            <button type="button" onClick={() => act("declined")} className={secondaryButtonClass}>Decline</button>
          </>
        )}
        {booking.status === "accepted" && started && (
          <>
            <button type="button" onClick={() => act("completed")} className={primaryButtonClass}>They came</button>
            <button type="button" onClick={() => act("no_show")} className={secondaryButtonClass}>No-show</button>
          </>
        )}
        {booking.status === "accepted" && !started && (
          <button type="button" onClick={() => act("cancelled")} className={`rounded px-1 text-sm text-ivory/60 underline underline-offset-4 ${focusRing}`}>Cancel this booking</button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
    </li>
  );
}
