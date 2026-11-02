"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  cardClass,
  focusRing,
  formatPrice,
  formatWhen,
  PageTitle,
  Stars,
  StatusChip,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import {
  bookingDetails,
  hasStarted,
  tableRating,
  upcomingSessions,
} from "@/lib/data/store";
import { bookingsForTable, HostGate } from "./host-shell";

export function HostToday() {
  const justSubmitted = useSearchParams().get("submitted") === "1";

  return (
    <HostGate>
      {({ user, host, table, state }) => {
        const bookings = bookingsForTable(state, table?.id);
        const requests = bookings.filter((b) => b.status === "requested");
        const toUpdate = bookings.filter(
          (b) => b.status === "accepted" && hasStarted(bookingDetails(state, b).session.startsAt),
        );
        const nextSession = table
          ? upcomingSessions(state, table.id).find((s) =>
              bookings.some((b) => b.sessionId === s.id && b.status === "accepted"),
            )
          : undefined;
        const nextGuests = bookings.filter((b) => b.sessionId === nextSession?.id && b.status === "accepted");
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const completed = bookings.filter((b) => b.status === "completed");
        const thisMonth = completed
          .filter((b) => new Date(bookingDetails(state, b).session.startsAt) >= monthStart)
          .reduce((sum, b) => sum + b.partySize * b.pricePerGuest, 0);
        const rating = table ? tableRating(state, table.id) : null;
        const latestReview = rating?.reviews[0];

        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <PageTitle kicker="Today" title={`Namaste, ${user.fullName.split(" ")[0] || "host"}`} />
              <Link href="/explore" className={`mt-1 shrink-0 rounded text-sm text-ivory/70 underline underline-offset-4 sm:hidden ${focusRing}`}>
                Switch to travelling
              </Link>
            </div>

            {justSubmitted && host.status === "pending" && (
              <div className="rounded-2xl bg-[#8fc79a]/15 px-5 py-4 text-[#cfe9d4]">
                <p className="font-medium">Thank you! Your application is in.</p>
                <p className="mt-1 text-sm">We&rsquo;ll call you within a few days to arrange a short visit. Meanwhile you can add dates and polish your table.</p>
              </div>
            )}
            {host.status === "pending" && !justSubmitted && (
              <p className="rounded-2xl bg-[#e8c08f]/12 px-5 py-4 text-[#e8c08f]">
                Your table is under review. Guests can&rsquo;t see it yet.
              </p>
            )}
            {(host.status === "rejected" || table?.status === "rejected") && (
              <p className="rounded-2xl bg-terracotta/20 px-5 py-4 text-terracotta-soft">
                Your table wasn&rsquo;t approved.{(table?.reviewNote ?? host.reviewNote) ? ` Note from Mehman: ${table?.reviewNote ?? host.reviewNote}` : ""} Update it under My table and it goes back for review.
              </p>
            )}
            {table?.status === "pending" && host.status === "approved" && (
              <p className="rounded-2xl bg-[#e8c08f]/12 px-5 py-4 text-[#e8c08f]">
                Mehman is checking your new price or photos, usually within a day. Your table is hidden from guests until then.
              </p>
            )}

            {requests.length > 0 && (
              <Link href="/host/requests" className={`flex items-center justify-between rounded-2xl bg-terracotta px-5 py-4 text-ivory ${focusRing}`}>
                <span>
                  <span className="block font-medium">
                    {requests.length} {requests.length === 1 ? "guest is" : "guests are"} waiting for your reply
                  </span>
                  <span className="block text-sm text-ivory/85">Reply within a day to keep your table high in search.</span>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            )}

            {toUpdate.length > 0 && (
              <Link href="/host/earnings" className={`block rounded-2xl border border-[#e8c08f]/40 px-5 py-4 ${focusRing}`}>
                <span className="block font-medium text-[#e8c08f]">Did your guests come?</span>
                <span className="block text-sm text-ivory/70">
                  Mark {toUpdate.length} past {toUpdate.length === 1 ? "booking" : "bookings"} as hosted or no-show.
                </span>
              </Link>
            )}

            <section className={cardClass}>
              <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase">Next meal</h2>
              {nextSession ? (
                <>
                  <p className="mt-2 font-serif text-2xl">{formatWhen(nextSession.startsAt)}</p>
                  <p className="text-sm text-ivory/60">
                    {(() => {
                      const count = nextGuests.reduce((sum, b) => sum + b.partySize, 0);
                      return `${count} ${count === 1 ? "guest" : "guests"} confirmed`;
                    })()} · {table?.title}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {nextGuests.map((b) => {
                      const guest = state.profiles.find((p) => p.id === b.guestId);
                      return (
                        <li key={b.id} className="rounded-xl bg-ivory/[0.05] px-4 py-3 text-sm">
                          <span className="font-medium">{guest?.fullName}</span> · {b.partySize} {b.partySize === 1 ? "guest" : "guests"}
                          {b.note && <span className="mt-1 block text-ivory/65">&ldquo;{b.note}&rdquo;</span>}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="mt-2 text-ivory/70">
                  No confirmed guests yet.{" "}
                  <Link href="/host/calendar" className={`rounded underline underline-offset-4 ${focusRing}`}>Add dates</Link> so travellers can book.
                </p>
              )}
            </section>

            <section className="grid grid-cols-3 gap-3 text-center">
              <div className={`${cardClass} px-2 py-4`}>
                <p className="font-serif text-2xl">{formatPrice(thisMonth)}</p>
                <p className="text-xs text-ivory/55">this month</p>
              </div>
              <div className={`${cardClass} px-2 py-4`}>
                <p className="font-serif text-2xl">{rating?.count ? rating.average.toFixed(1) : "–"}</p>
                <p className="text-xs text-ivory/55">{rating?.count ? `${rating.count} reviews` : "no reviews yet"}</p>
              </div>
              <div className={`${cardClass} px-2 py-4`}>
                <p className="font-serif text-2xl">{completed.reduce((sum, b) => sum + b.partySize, 0)}</p>
                <p className="text-xs text-ivory/55">guests hosted</p>
              </div>
            </section>

            {latestReview && (
              <section className={cardClass}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase">Latest review</h2>
                  <Stars rating={latestReview.rating} />
                </div>
                <p className="mt-2 leading-relaxed text-ivory/85">&ldquo;{latestReview.text}&rdquo;</p>
                <p className="mt-1 text-sm text-ivory/55">— {state.profiles.find((p) => p.id === latestReview.guestId)?.fullName}</p>
                {!latestReview.hostReply && (
                  <Link href="/host/earnings#reviews" className={`mt-3 inline-block rounded text-sm underline underline-offset-4 ${focusRing}`}>Reply</Link>
                )}
              </section>
            )}

            {table && (
              <section className={`${cardClass} flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <StatusChip status={table.status} />
                  <p className="mt-1.5 truncate font-serif text-xl">{table.title}</p>
                </div>
                <Link href="/host/table" className={primaryButtonClass}>Edit</Link>
              </section>
            )}

          </div>
        );
      }}
    </HostGate>
  );
}
