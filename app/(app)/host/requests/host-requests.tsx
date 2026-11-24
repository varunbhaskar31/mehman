"use client";

import { PageTitle } from "@/app/_components/app-ui";
import { bookingDetails, slotEnds } from "@/lib/data/store";
import type { Booking } from "@/lib/data/types";
import { bookingsForTable, GuestBookingCard, HostGate, needsGuestRating, noShowOpen } from "../host-shell";

function Section({ title, empty, items, state }: { title: string; empty: string; items: Booking[]; state: Parameters<typeof GuestBookingCard>[0]["state"] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl">
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="text-ivory/65">{empty}</p>
      ) : (
        <ul className="space-y-3">{items.map((b) => <GuestBookingCard key={b.id} state={state} booking={b} />)}</ul>
      )}
    </section>
  );
}

export function HostRequests() {
  return (
    <HostGate>
      {({ table, state }) => {
        const bookings = bookingsForTable(state, table?.id);
        const ended = (b: Booking) => slotEnds(bookingDetails(state, b).session).getTime() <= Date.now();
        const toAct = bookings.filter((b) => b.status === "requested" || b.status === "deposit_claimed");
        const awaiting = bookings.filter((b) => b.status === "awaiting_deposit" || b.status === "in_review");
        const confirmed = bookings.filter((b) => (b.status === "confirmed" || b.status === "accepted") && !ended(b));
        const afterMeal = bookings
          .filter((b) => needsGuestRating(state, b) || (noShowOpen(state, b) && ended(b)))
          .reverse();
        const refunds = bookings.filter((b) => b.depositStatus === "refund_due");
        return (
          <div className="space-y-8">
            <PageTitle kicker="Requests" title="Who's coming to dinner">
              Accept or decline each request. The guest then pays you a ₹500 deposit by UPI; once you confirm it arrived,
              they get your address and the Mehman team sets up a WhatsApp group.
            </PageTitle>
            <Section title="Waiting for you" empty="Nothing needs you right now." items={toAct} state={state} />
            <Section title="Waiting for the deposit" empty="No deposits pending." items={awaiting} state={state} />
            <Section title="Confirmed guests" empty="No confirmed guests coming up." items={confirmed} state={state} />
            {afterMeal.length > 0 && <Section title="After the meal" empty="" items={afterMeal} state={state} />}
            {refunds.length > 0 && <Section title="Refunds to send" empty="" items={refunds} state={state} />}
          </div>
        );
      }}
    </HostGate>
  );
}
