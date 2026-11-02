"use client";

import { PageTitle } from "@/app/_components/app-ui";
import { bookingDetails, hasStarted } from "@/lib/data/store";
import { bookingsForTable, GuestBookingCard, HostGate } from "../host-shell";

export function HostRequests() {
  return (
    <HostGate>
      {({ table, state }) => {
        const bookings = bookingsForTable(state, table?.id);
        const requests = bookings.filter((b) => b.status === "requested");
        const upcoming = bookings.filter(
          (b) => b.status === "accepted" && !hasStarted(bookingDetails(state, b).session.startsAt),
        );
        return (
          <div className="space-y-8">
            <PageTitle kicker="Requests" title="Who's coming to dinner">
              Accept or decline each request. Guests see your address only after you accept.
            </PageTitle>
            <section className="space-y-3">
              <h2 className="font-serif text-2xl">Waiting for you ({requests.length})</h2>
              {requests.length === 0 ? (
                <p className="text-ivory/65">No new requests. We&rsquo;ll let you know when one comes in.</p>
              ) : (
                <ul className="space-y-3">{requests.map((b) => <GuestBookingCard key={b.id} state={state} booking={b} />)}</ul>
              )}
            </section>
            <section className="space-y-3">
              <h2 className="font-serif text-2xl">Confirmed guests</h2>
              {upcoming.length === 0 ? (
                <p className="text-ivory/65">No confirmed guests coming up.</p>
              ) : (
                <ul className="space-y-3">{upcoming.map((b) => <GuestBookingCard key={b.id} state={state} booking={b} />)}</ul>
              )}
            </section>
          </div>
        );
      }}
    </HostGate>
  );
}
