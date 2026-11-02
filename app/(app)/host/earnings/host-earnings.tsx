"use client";

import { useId, useState } from "react";
import {
  cardClass,
  formatPrice,
  formatWhen,
  PageTitle,
  Stars,
  StatusChip,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import { bookingDetails, hasStarted, replyToReview, tableRating } from "@/lib/data/store";
import type { AppState, Review } from "@/lib/data/types";
import { bookingsForTable, GuestBookingCard, HostGate } from "../host-shell";

const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

function ReviewCard({ state, review }: { state: AppState; review: Review }) {
  const uid = useId();
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const guest = state.profiles.find((p) => p.id === review.guestId);

  return (
    <li className={`${cardClass} space-y-2`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{guest?.fullName}</p>
        <Stars rating={review.rating} />
      </div>
      <p className="leading-relaxed text-ivory/85">&ldquo;{review.text}&rdquo;</p>
      <p className="text-xs text-ivory/50">{formatWhen(review.createdAt)}</p>
      {review.hostReply ? (
        <p className="rounded-xl bg-ivory/[0.05] px-4 py-3 text-sm text-ivory/80">
          <span className="text-ivory/55">Your reply · </span>
          {review.hostReply}
        </p>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await replyToReview(review.id, reply);
            setError("error" in result ? result.error : null);
          }}
          className="space-y-2 pt-1"
        >
          <label htmlFor={`${uid}-reply`} className="text-sm text-ivory/70">Reply publicly</label>
          <textarea id={`${uid}-reply`} rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank them, invite them back…" className="block w-full rounded-xl border border-ivory/25 bg-transparent px-4 py-3 text-ivory placeholder:text-ivory/35 focus-visible:outline-2 focus-visible:outline-ivory" />
          {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
          <button type="submit" className={primaryButtonClass}>Post reply</button>
        </form>
      )}
    </li>
  );
}

export function HostEarnings() {
  return (
    <HostGate>
      {({ table, state }) => {
        const bookings = bookingsForTable(state, table?.id);
        const toUpdate = bookings.filter(
          (b) => b.status === "accepted" && hasStarted(bookingDetails(state, b).session.startsAt),
        );
        const past = bookings
          .filter((b) => b.status === "completed" || b.status === "no_show")
          .sort((a, b) => bookingDetails(state, b).session.startsAt.localeCompare(bookingDetails(state, a).session.startsAt));
        const hosted = past.filter((b) => b.status === "completed");
        const total = hosted.reduce((sum, b) => sum + b.partySize * b.pricePerGuest, 0);

        // Totals by month, newest first.
        const months = new Map<string, { label: string; amount: number; guests: number }>();
        for (const b of hosted) {
          const when = new Date(bookingDetails(state, b).session.startsAt);
          const key = `${when.getFullYear()}-${String(when.getMonth()).padStart(2, "0")}`;
          const entry = months.get(key) ?? { label: monthLabel.format(when), amount: 0, guests: 0 };
          entry.amount += b.partySize * b.pricePerGuest;
          entry.guests += b.partySize;
          months.set(key, entry);
        }
        const rating = table ? tableRating(state, table.id) : null;

        return (
          <div className="space-y-8">
            <PageTitle kicker="Earnings" title={formatPrice(total)}>
              Earned from {hosted.length} {hosted.length === 1 ? "booking" : "bookings"}. Guests pay you directly at the meal; Mehman doesn&rsquo;t take payments yet.
            </PageTitle>

            {toUpdate.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-serif text-2xl">Did your guests come?</h2>
                <ul className="space-y-3">{toUpdate.map((b) => <GuestBookingCard key={b.id} state={state} booking={b} />)}</ul>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="font-serif text-2xl">By month</h2>
              {months.size === 0 ? (
                <p className="text-ivory/65">Your earnings will show here after your first meal.</p>
              ) : (
                <ul className={`${cardClass} divide-y divide-ivory/10 py-1`}>
                  {[...months.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([key, m]) => (
                    <li key={key} className="flex items-center justify-between py-3">
                      <span>
                        {m.label}
                        <span className="block text-xs text-ivory/55">{m.guests} guests</span>
                      </span>
                      <span className="font-serif text-xl">{formatPrice(m.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl">Guest history</h2>
              {past.length === 0 ? (
                <p className="text-ivory/65">No past meals yet.</p>
              ) : (
                <ul className="divide-y divide-ivory/10">
                  {past.map((b) => {
                    const { session, guest } = bookingDetails(state, b);
                    return (
                      <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                        <span className="min-w-0">
                          <span className="block truncate">{guest.fullName}</span>
                          <span className="block text-xs text-ivory/55">{formatWhen(session.startsAt)} · {b.partySize} {b.partySize === 1 ? "guest" : "guests"}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <StatusChip status={b.status} />
                          <span className="w-16 text-right">{b.status === "completed" ? formatPrice(b.partySize * b.pricePerGuest) : "–"}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section id="reviews" className="scroll-mt-24 space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-2xl">Reviews</h2>
                {rating?.count ? (
                  <p className="text-sm text-ivory/70">
                    <Stars rating={rating.average} /> {rating.average.toFixed(1)} · {rating.count}
                  </p>
                ) : null}
              </div>
              {!rating?.count ? (
                <p className="text-ivory/65">Guests can review your table after their meal.</p>
              ) : (
                <ul className="space-y-3">{rating.reviews.map((r) => <ReviewCard key={r.id} state={state} review={r} />)}</ul>
              )}
            </section>

          </div>
        );
      }}
    </HostGate>
  );
}
