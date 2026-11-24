"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  cardClass,
  EmptyState,
  focusRing,
  formatPrice,
  formatWhen,
  RequireUser,
  secondaryButtonClass,
  StatusChip,
} from "@/app/_components/app-ui";
import { formatDeadline, MoneySummary, payBy, respondBy, WhatsappNotice } from "@/app/_components/booking-bits";
import { primaryButtonClass } from "@/app/_components/fields";
import {
  addGuestReview,
  bookingDetails,
  hostForUser,
  setBookingStatus,
  slotEnds,
  useAppState,
} from "@/lib/data/store";
import type { Booking, AppState, DiningTable, Host, Profile } from "@/lib/data/types";

// Every host page: signed in, and has applied to host.
export function HostGate({
  children,
}: {
  children: (context: { user: Profile; host: Host; table: DiningTable | null; state: AppState }) => ReactNode;
}) {
  const state = useAppState();
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
export function bookingsForTable(state: AppState, tableId: string | undefined) {
  return state.bookings
    .filter((b) => state.sessions.find((s) => s.id === b.sessionId)?.tableId === tableId)
    .sort((a, b) =>
      bookingDetails(state, a).session.startsAt.localeCompare(bookingDetails(state, b).session.startsAt),
    );
}

const DAY = 24 * 60 * 60 * 1000;

// A host can mark a no-show from the start of the slot until 24 hours after
// it ends.
export function noShowOpen(state: AppState, booking: Booking) {
  if (!["confirmed", "completed", "accepted"].includes(booking.status)) return false;
  const { session } = bookingDetails(state, booking);
  const now = Date.now();
  return now >= new Date(session.startsAt).getTime() && now <= slotEnds(session).getTime() + DAY;
}

// Completed meals whose guest the host hasn't rated yet.
export function needsGuestRating(state: AppState, booking: Booking) {
  return booking.status === "completed" && !state.guestReviews.some((r) => r.bookingId === booking.id);
}

function RateGuest({ booking, name }: { booking: Booking; name: string }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!rating) return setError("Tap the stars to rate your guest.");
        const result = await addGuestReview(booking.id, rating, text);
        setError("error" in result ? result.error : null);
      }}
      className="space-y-2 rounded-xl bg-ivory/[0.04] p-4"
    >
      <p className="text-sm text-ivory/80">How was hosting {name}? Other hosts and the Mehman team see this; {name} doesn&rsquo;t.</p>
      <div role="radiogroup" aria-label="Guest rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
            onClick={() => setRating(star)}
            className={`grid size-11 place-items-center rounded-full text-3xl leading-none ${focusRing} ${star <= rating ? "text-[#e8c08f]" : "text-ivory/25"}`}
          >
            ★
          </button>
        ))}
      </div>
      <input value={text} onChange={(e) => setText(e.target.value)} aria-label="A short note" placeholder="A short note (optional)" className="block min-h-11 w-full rounded-xl border border-ivory/25 bg-transparent px-4 text-ivory placeholder:text-ivory/35 focus-visible:outline-2 focus-visible:outline-ivory" />
      {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
      <button type="submit" className={primaryButtonClass}>Rate guest</button>
    </form>
  );
}

export function GuestBookingCard({ state, booking }: { state: AppState; booking: Booking }) {
  const { session, guest, host, summary } = bookingDetails(state, booking);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const act = async (next: Booking["status"]) => {
    setBusy(true);
    const result = await setBookingStatus(booking.id, next);
    setBusy(false);
    setError("error" in result ? result.error : null);
  };
  const name = (summary?.firstName ?? guest.fullName.split(" ")[0]) || "Your guest";
  const contactShown = Boolean(guest.phone || guest.email);
  const guestRated = state.guestReviews.find((r) => r.bookingId === booking.id);

  return (
    <li className={`${cardClass} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-xl">{contactShown ? guest.fullName || name : name}</p>
          <p className="text-sm text-ivory/60">
            {formatWhen(session.startsAt)} · {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"} ·{" "}
            {formatPrice(booking.partySize * booking.pricePerGuest)}
          </p>
          {summary && (
            <p className="mt-0.5 text-xs text-ivory/55">
              {summary.ratings > 0 ? `★ ${summary.rating?.toFixed(1)} from ${summary.ratings} ${summary.ratings === 1 ? "host" : "hosts"}` : "New guest"}
              {summary.noShows > 0 && ` · ${summary.noShows} no-show${summary.noShows === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
        <StatusChip status={booking.status} />
      </div>
      {booking.note && <p className="rounded-xl bg-ivory/[0.05] px-4 py-3 text-sm text-ivory/80">&ldquo;{booking.note}&rdquo;</p>}

      {contactShown && booking.status !== "requested" && (
        <p className="text-sm text-ivory/70">
          {guest.phone && (
            <a href={`tel:${guest.phone.replace(/\s+/g, "")}`} className={`rounded underline ${focusRing}`}>{guest.phone}</a>
          )}
          {guest.phone && guest.email && " · "}
          {guest.email && <a href={`mailto:${guest.email}`} className={`rounded underline ${focusRing}`}>{guest.email}</a>}
        </p>
      )}

      {booking.status === "requested" && (
        <>
          <p className="text-sm text-ivory/65">
            Reply within {formatDeadline(respondBy(booking, session))}. You&rsquo;ll see {name}&rsquo;s phone and email once you accept.
          </p>
          {!host.upiId && (
            <p className="rounded-xl bg-[#e8c08f]/12 px-4 py-3 text-sm text-[#e8c08f]">
              Add your UPI ID under{" "}
              <Link href="/host/table#upi" className={`rounded underline ${focusRing}`}>My table</Link> before accepting, so{" "}
              {name} can pay the {formatPrice(booking.depositInr)} deposit.
            </p>
          )}
        </>
      )}
      {booking.status === "awaiting_deposit" && (
        <p className="text-sm text-ivory/70">
          Waiting for {name} to pay the {formatPrice(booking.depositInr)} deposit to {host.upiId || "your UPI ID"}, within{" "}
          {formatDeadline(payBy(booking, session))}.
        </p>
      )}
      {booking.status === "deposit_claimed" && (
        <p className="rounded-xl bg-terracotta/15 px-4 py-3 text-sm">
          {name} says they&rsquo;ve paid {formatPrice(booking.depositInr)}. Check your UPI app, then confirm. Your address
          is shared once you do.
        </p>
      )}
      {booking.status === "in_review" && (
        <p className="text-sm text-ivory/70">The Mehman team is checking the deposit with you and {name}.</p>
      )}
      {(booking.status === "confirmed" || booking.status === "accepted") && <WhatsappNotice booking={booking} other="guest" />}
      {booking.depositStatus === "refund_due" && (
        <p className="rounded-xl bg-[#e8c08f]/12 px-4 py-3 text-sm text-[#e8c08f]">
          Please refund the {formatPrice(booking.depositInr)} deposit to {name} by UPI within 48 hours.
        </p>
      )}
      {booking.depositInr > 0 && ["confirmed", "completed"].includes(booking.status) && <MoneySummary booking={booking} />}

      <div className="flex flex-wrap items-center gap-2">
        {booking.status === "requested" && (
          <>
            <button type="button" disabled={busy || !host.upiId} onClick={() => act("awaiting_deposit")} className={`${primaryButtonClass} disabled:opacity-50`}>Accept</button>
            <button type="button" disabled={busy} onClick={() => act("declined")} className={secondaryButtonClass}>Decline</button>
          </>
        )}
        {booking.status === "deposit_claimed" && (
          <>
            <button type="button" disabled={busy} onClick={() => act("confirmed")} className={primaryButtonClass}>Deposit received</button>
            <button type="button" disabled={busy} onClick={() => act("in_review")} className={secondaryButtonClass}>Not received</button>
          </>
        )}
        {["requested", "awaiting_deposit", "deposit_claimed"].includes(booking.status) ||
        ((booking.status === "confirmed" || booking.status === "accepted") && !booking.whatsappGroupAt) ? (
          <Link href={`/host/messages?table=${session.tableId}&guest=${booking.guestId}`} className={secondaryButtonClass}>Message</Link>
        ) : null}
        {noShowOpen(state, booking) && (
          <button type="button" disabled={busy} onClick={() => act("no_show")} className={secondaryButtonClass}>Mark no-show</button>
        )}
      </div>
      {needsGuestRating(state, booking) && <RateGuest booking={booking} name={name} />}
      {guestRated && <p className="text-sm text-ivory/60">You rated {name} {"★".repeat(guestRated.rating)}.</p>}
      {(booking.status === "confirmed" || booking.status === "accepted") && (
        <p className="text-xs text-ivory/50">Need to cancel? Call the Mehman team; we&rsquo;ll tell the guest and arrange the refund.</p>
      )}
      {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
    </li>
  );
}
