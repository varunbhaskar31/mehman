"use client";

import { useState } from "react";
import {
  cardClass,
  focusRing,
  formatPrice,
  formatWhen,
  PageTitle,
  RequireUser,
  StatusChip,
} from "@/app/_components/app-ui";
import { findExploreCity } from "@/data/experiences";
import { bookingDetails, useAppState } from "@/lib/data/store";
import type { BookingStatus } from "@/lib/data/types";

const filters: { id: "all" | BookingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "requested", label: "Waiting for host" },
  { id: "accepted", label: "Confirmed" },
  { id: "completed", label: "Hosted" },
  { id: "cancelled", label: "Cancelled" },
  { id: "declined", label: "Declined" },
  { id: "no_show", label: "No-show" },
];

export function AdminBookings() {
  const state = useAppState();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  return (
    <RequireUser role="admin">
      {() => {
        const rows = state.bookings
          .filter((b) => filter === "all" || b.status === filter)
          .map((b) => bookingDetails(state, b))
          .sort((a, b) => b.session.startsAt.localeCompare(a.session.startsAt));
        const hostedValue = state.bookings
          .filter((b) => b.status === "completed")
          .reduce((sum, b) => sum + b.partySize * b.pricePerGuest, 0);
        return (
          <div className="space-y-6">
            <PageTitle kicker="Mehman team" title="Bookings">
              Every seat requested across Mehman. {formatPrice(hostedValue)} of meals hosted so far.
            </PageTitle>
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
              <div className="flex w-max gap-2">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={`h-10 rounded-full border px-4 text-sm ${focusRing} ${filter === f.id ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/20 text-ivory/75"}`}
                  >
                    {f.label} ({f.id === "all" ? state.bookings.length : state.bookings.filter((b) => b.status === f.id).length})
                  </button>
                ))}
              </div>
            </div>
            {rows.length === 0 ? (
              <p className={`${cardClass} text-ivory/70`}>No bookings here.</p>
            ) : (
              <ul className="divide-y divide-ivory/10">
                {rows.map(({ booking, session, table, host, guest }) => (
                  <li key={booking.id} className="flex items-start justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{guest.fullName || guest.email} → {host.displayName}</p>
                      <p className="truncate text-sm text-ivory/60">
                        {table.title} · {findExploreCity(host.cityId)?.name}
                      </p>
                      <p className="text-sm text-ivory/60">
                        {formatWhen(session.startsAt)} · {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"} · {formatPrice(booking.partySize * booking.pricePerGuest)}
                      </p>
                    </div>
                    <StatusChip status={booking.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }}
    </RequireUser>
  );
}
