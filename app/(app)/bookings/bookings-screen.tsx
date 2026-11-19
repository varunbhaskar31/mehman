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
  secondaryButtonClass,
  StatusChip,
} from "@/app/_components/app-ui";
import {
  DepositPanel,
  formatDeadline,
  MoneySummary,
  respondBy,
  WhatsappNotice,
} from "@/app/_components/booking-bits";
import { primaryButtonClass } from "@/app/_components/fields";
import {
  addReview,
  bookingDetails,
  confirmRefund,
  setBookingStatus,
  slotEnds,
  useAppState,
} from "@/lib/data/store";
import type { Booking, AppState } from "@/lib/data/types";

function ReviewForm({ booking, prompt }: { booking: Booking; prompt: string }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!rating) return setError("Tap the stars to choose a rating.");
        const result = await addReview(booking.id, rating, text);
        setError("error" in result ? result.error : null);
      }}
      className="space-y-3"
    >
      <p className="text-ivory/80">{prompt}</p>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
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
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} aria-label="Your review" placeholder="What will you remember?" className="block w-full rounded-xl border border-ivory/25 bg-transparent px-4 py-3 text-ivory placeholder:text-ivory/35 focus-visible:outline-2 focus-visible:outline-ivory" />
      {error && <p role="alert" className="text-terracotta-soft">{error}</p>}
      <button type="submit" className={primaryButtonClass}>Post review</button>
    </form>
  );
}

function RefundReceived({ booking }: { booking: Booking }) {
  const [error, setError] = useState<string | null>(null);
  if (booking.depositStatus === "refunded") {
    return <p className="text-ivory/70">Your {formatPrice(booking.depositInr)} deposit was refunded.</p>;
  }
  if (booking.depositStatus !== "refund_due") return null;
  return (
    <div className="space-y-2">
      <p className="text-ivory/80">
        Your {formatPrice(booking.depositInr)} deposit is being refunded by UPI within 48 hours. Tell us when it arrives;
        the Mehman team follows up if it doesn&rsquo;t.
      </p>
      <button
        type="button"
        onClick={async () => {
          const result = await confirmRefund(booking.id);
          setError("error" in result ? result.error : null);
        }}
        className={secondaryButtonClass}
      >
        I got my refund
      </button>
      {error && <p role="alert" className="text-terracotta-soft">{error}</p>}
    </div>
  );
}

const cancellable: Booking["status"][] = ["requested", "awaiting_deposit", "deposit_claimed", "confirmed", "accepted"];

function TripCard({ state, booking }: { state: AppState; booking: Booking }) {
  const { session, table, host } = bookingDetails(state, booking);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = new Date(session.startsAt).getTime() <= Date.now();
  const canCancel = cancellable.includes(booking.status) && !started;
  const depositAtStake = booking.status === "deposit_claimed" || booking.status === "confirmed";
  const moreThanADay = new Date(session.startsAt).getTime() - Date.now() > 24 * 60 * 60 * 1000;
  const review = state.reviews.find((r) => r.bookingId === booking.id);
  const chatHref = `/messages?table=${table.id}&guest=${booking.guestId}`;
  const hostPhone = host.contactPhone.replace(/\s+/g, "");

  return (
    <li className={`${cardClass} p-0`}>
      <Link href={`/tables/${table.id}`} className={`flex gap-4 rounded-2xl p-4 md:flex-col ${focusRing}`}>
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ivory/5 md:aspect-[16/9] md:size-auto md:w-full">
          {table.photos[0] && <Image src={table.photos[0]} alt="" fill sizes="(min-width: 768px) 480px, 80px" className="object-cover" />}
        </div>
        <div className="min-w-0">
          <StatusChip status={booking.status} />
          <p className="mt-1.5 font-serif text-xl leading-snug">{table.title}</p>
          <p className="text-sm text-ivory/60">
            {formatWhen(session.startsAt)} · {session.durationMinutes / 60} hours · {booking.partySize}{" "}
            {booking.partySize === 1 ? "guest" : "guests"}
          </p>
        </div>
      </Link>

      <div className="space-y-3 border-t border-ivory/10 px-4 py-4 text-sm">
        {booking.status === "requested" && (
          <div className="space-y-2">
            <p className="text-ivory/70">
              Waiting for {host.displayName} to reply, within {formatDeadline(respondBy(booking, session))}. If they
              accept, you&rsquo;ll pay a {formatPrice(booking.depositInr)} deposit to confirm.
            </p>
            <Link href={chatHref} className={secondaryButtonClass}>Message host</Link>
          </div>
        )}

        {booking.status === "awaiting_deposit" && <DepositPanel booking={booking} session={session} />}

        {booking.status === "deposit_claimed" && (
          <p className="text-ivory/75">
            Thanks! {host.displayName} will confirm once the deposit shows in their UPI app. The address appears here then.
          </p>
        )}

        {booking.status === "in_review" && (
          <p className="text-ivory/75">
            {host.displayName} hasn&rsquo;t received the deposit yet. The Mehman team will call you to sort it out; keep
            your UPI receipt handy.
          </p>
        )}

        {(booking.status === "confirmed" || booking.status === "accepted") && (
          <div className="space-y-3">
            <WhatsappNotice booking={booking} other="host" />
            <p className="text-ivory/80">
              <span className="text-ivory/55">Address · </span>
              {host.address}
            </p>
            <div className="flex flex-wrap gap-2">
              {hostPhone && <a href={`tel:${hostPhone}`} className={secondaryButtonClass}>Call host</a>}
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(host.address)}`} target="_blank" rel="noreferrer" className={secondaryButtonClass}>Directions</a>
              {!booking.whatsappGroupAt && <Link href={chatHref} className={secondaryButtonClass}>Message</Link>}
            </div>
          </div>
        )}

        {booking.status === "completed" &&
          (review ? (
            <p className="text-ivory/70">You rated this meal {"★".repeat(review.rating)}. Thank you!</p>
          ) : (
            <ReviewForm booking={booking} prompt={`How was your meal with ${host.displayName}?`} />
          ))}

        {booking.status === "host_cancelled" && (
          <div className="space-y-3">
            <p className="text-ivory/75">{host.displayName} had to cancel. We&rsquo;re sorry.</p>
            <RefundReceived booking={booking} />
            {review ? (
              <p className="text-ivory/70">You rated {host.displayName} {"★".repeat(review.rating)}.</p>
            ) : (
              <ReviewForm booking={booking} prompt={`How did ${host.displayName} handle the cancellation?`} />
            )}
          </div>
        )}

        {booking.status === "guest_cancelled" && (
          <div className="space-y-2">
            <p className="text-ivory/70">You cancelled this booking.</p>
            {booking.depositStatus === "kept" && (
              <p className="text-ivory/70">It was within 24 hours of the meal, so {host.displayName} keeps the deposit.</p>
            )}
            <RefundReceived booking={booking} />
          </div>
        )}

        {booking.status === "declined" && (
          <p className="text-ivory/70">{host.displayName} couldn&rsquo;t host you on this date. Try another date or table.</p>
        )}
        {booking.status === "expired" && (
          <p className="text-ivory/70">{host.displayName} didn&rsquo;t reply in time, so the request expired. Try another date or table.</p>
        )}
        {booking.status === "cancelled_unpaid" && (
          <p className="text-ivory/70">The deposit wasn&rsquo;t paid in time, so the seats were released.</p>
        )}
        {booking.status === "no_show" && (
          <p className="text-ivory/70">
            {host.displayName} marked this booking as a no-show, so they keep the deposit. If that&rsquo;s wrong, write to
            the Mehman team from your profile.
          </p>
        )}

        {booking.depositInr > 0 && !["declined", "expired", "requested"].includes(booking.status) && (
          <MoneySummary booking={booking} />
        )}

        {canCancel &&
          (confirming ? (
            <div className="space-y-2">
              <p className="text-ivory/80">
                Cancel this {booking.status === "requested" ? "request" : "booking"}?
                {depositAtStake &&
                  (moreThanADay
                    ? ` It's more than 24 hours away, so ${host.displayName} refunds your ${formatPrice(booking.depositInr)} deposit.`
                    : ` It's within 24 hours, so ${host.displayName} keeps the ${formatPrice(booking.depositInr)} deposit.`)}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const result = await setBookingStatus(booking.id, "guest_cancelled");
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
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className={`rounded text-ivory/60 underline underline-offset-4 ${focusRing}`}>
              Cancel {booking.status === "requested" ? "request" : "booking"}
            </button>
          ))}
        {error && <p role="alert" className="text-terracotta-soft">{error}</p>}
      </div>
    </li>
  );
}

const live: Booking["status"][] = ["requested", "awaiting_deposit", "deposit_claimed", "confirmed", "accepted", "in_review"];

export function BookingsScreen() {
  const state = useAppState();

  return (
    <RequireUser>
      {(user) => {
        const mine = state.bookings
          .filter((b) => b.guestId === user.id)
          .map((b) => {
            const { session } = bookingDetails(state, b);
            return { booking: b, when: session.startsAt, ends: slotEnds(session).getTime() };
          });
        const now = Date.now();
        const upcoming = mine
          .filter((x) => x.ends > now && live.includes(x.booking.status))
          .sort((a, b) => a.when.localeCompare(b.when));
        const past = mine
          .filter((x) => !upcoming.includes(x))
          .sort((a, b) => b.when.localeCompare(a.when));

        return (
          <div className="space-y-8">
            <PageTitle kicker="My bookings" title="Your seats at the table" />
            {mine.length === 0 ? (
              <EmptyState title="No bookings yet" action={<Link href="/explore" className={primaryButtonClass}>Find a table</Link>}>
                When you request a seat at a family&rsquo;s table, it shows up here.
              </EmptyState>
            ) : (
              <>
                <section>
                  <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase">Upcoming</h2>
                  {upcoming.length === 0 ? (
                    <p className="mt-3 text-ivory/65">Nothing coming up.</p>
                  ) : (
                    <ul className="mt-3 space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0">
                      {upcoming.map(({ booking }) => <TripCard key={booking.id} state={state} booking={booking} />)}
                    </ul>
                  )}
                </section>
                {past.length > 0 && (
                  <section>
                    <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase">Past and cancelled</h2>
                    <ul className="mt-3 space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0">
                      {past.map(({ booking }) => <TripCard key={booking.id} state={state} booking={booking} />)}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        );
      }}
    </RequireUser>
  );
}
