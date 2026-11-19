"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  cardClass,
  focusRing,
  formatPrice,
  formatWhen,
  PageTitle,
  RequireUser,
  secondaryButtonClass,
  StatusChip,
} from "@/app/_components/app-ui";
import { MoneySummary } from "@/app/_components/booking-bits";
import { primaryButtonClass } from "@/app/_components/fields";
import { findExploreCity } from "@/data/experiences";
import {
  adminUpdateBooking,
  bookingDetails,
  loadBookingNotes,
  loadWhatsappQueue,
  markWhatsappGroupCreated,
  runTimers,
  useAppState,
  type BookingNote,
  type GroupToCreate,
  type TimerRun,
} from "@/lib/data/store";
import type { AppState, Booking, BookingStatus, DepositStatus } from "@/lib/data/types";

const statuses: { id: BookingStatus; label: string }[] = [
  { id: "requested", label: "Waiting for host" },
  { id: "awaiting_deposit", label: "Awaiting deposit" },
  { id: "deposit_claimed", label: "Deposit sent" },
  { id: "in_review", label: "In review" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Hosted" },
  { id: "host_cancelled", label: "Host cancelled" },
  { id: "guest_cancelled", label: "Guest cancelled" },
  { id: "no_show", label: "No-show" },
  { id: "declined", label: "Declined" },
  { id: "expired", label: "Expired" },
  { id: "cancelled_unpaid", label: "Cancelled · unpaid" },
];

const deposits: { id: DepositStatus; label: string }[] = [
  { id: "none", label: "Not paid" },
  { id: "claimed", label: "Guest says paid" },
  { id: "received", label: "Host received" },
  { id: "refund_due", label: "Refund due" },
  { id: "refunded", label: "Refunded" },
  { id: "kept", label: "Kept by host" },
];

const selectClass =
  "mt-1 block min-h-11 w-full rounded-lg border border-ivory/25 bg-transparent px-3 text-ivory [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-ivory";

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`;

// "Run timers now" for the demo and for support. In demo mode the team can
// also run them as if it were later.
function TimerPanel({ demoMode, onRan }: { demoMode: boolean; onRan: () => void }) {
  const uid = useId();
  const [hours, setHours] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  return (
    <section className={`${cardClass} space-y-3`}>
      <div>
        <h2 className="font-serif text-2xl">Booking timers</h2>
        <p className="mt-1 text-sm text-ivory/60">
          Run every 5 minutes on their own: unanswered requests expire after 6 hours, unpaid deposits cancel after 12, and
          confirmed meals complete when the slot ends.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {demoMode && (
          <label htmlFor={`${uid}-ahead`} className="text-sm text-ivory/70">
            Run as if it were
            <select id={`${uid}-ahead`} value={hours} onChange={(e) => setHours(Number(e.target.value))} className={selectClass}>
              <option value={0}>Now</option>
              <option value={7}>7 hours later</option>
              <option value={13}>13 hours later</option>
              <option value={24}>1 day later</option>
              <option value={72}>3 days later</option>
              <option value={168}>1 week later</option>
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const run = await runTimers(hours);
            setBusy(false);
            if ("error" in run) return setResult(run.error);
            const r: TimerRun = run.value;
            setResult(
              `Done: ${r.expired} expired, ${r.cancelledUnpaid} cancelled unpaid, ${r.toReview} sent to review, ${r.completed} completed.`,
            );
            onRan();
          }}
          className={primaryButtonClass}
        >
          {busy ? "Running…" : "Run timers now"}
        </button>
      </div>
      {demoMode && <p className="text-xs text-ivory/50">Demo database: skipping ahead is switched on.</p>}
      {result && <p role="status" className="text-sm text-[#a9d9b1]">{result}</p>}
    </section>
  );
}

function GroupQueue({ queue, onDone }: { queue: GroupToCreate[]; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl">WhatsApp groups to create ({queue.length})</h2>
      <p className="text-sm text-ivory/60">
        From the Mehman WhatsApp Business phone: create the group with this name, add host and guest, then tap Group
        created. Both sides are told to check WhatsApp.
      </p>
      {queue.length === 0 ? (
        <p className={`${cardClass} text-ivory/70`}>All caught up.</p>
      ) : (
        <ul className="space-y-3">
          {queue.map((g) => (
            <li key={g.bookingId} className={`${cardClass} space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-serif text-xl">{g.groupName}</p>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(g.groupName)}
                  className={`rounded text-sm underline underline-offset-4 ${focusRing}`}
                >
                  Copy name
                </button>
              </div>
              <p className="text-sm text-ivory/60">
                {formatWhen(g.startsAt)} · {g.partySize} {g.partySize === 1 ? "guest" : "guests"}
              </p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ivory/55">Host · {g.hostName}</dt>
                  <dd>
                    {g.hostPhone ? (
                      <a href={waLink(g.hostPhone)} target="_blank" rel="noreferrer" className={`rounded underline ${focusRing}`}>{g.hostPhone}</a>
                    ) : "No number"}
                  </dd>
                </div>
                <div>
                  <dt className="text-ivory/55">Guest · {g.guestName}</dt>
                  <dd>
                    {g.guestPhone ? (
                      <a href={waLink(g.guestPhone)} target="_blank" rel="noreferrer" className={`rounded underline ${focusRing}`}>{g.guestPhone}</a>
                    ) : `No number · ${g.guestEmail}`}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={async () => {
                  const result = await markWhatsappGroupCreated(g.bookingId);
                  if ("error" in result) return setError(result.error);
                  onDone();
                }}
                className={primaryButtonClass}
              >
                Group created
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-terracotta-soft">{error}</p>}
    </section>
  );
}

function BookingActions({ booking, notes, onSaved }: { booking: Booking; notes: BookingNote[]; onSaved: () => void }) {
  const uid = useId();
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [deposit, setDeposit] = useState<DepositStatus>(booking.depositStatus);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-ivory/[0.04] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={`${uid}-status`} className="text-sm text-ivory/70">
          Status
          <select id={`${uid}-status`} value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)} className={selectClass}>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label htmlFor={`${uid}-deposit`} className="text-sm text-ivory/70">
          Deposit
          <select id={`${uid}-deposit`} value={deposit} onChange={(e) => setDeposit(e.target.value as DepositStatus)} className={selectClass}>
            {deposits.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </label>
      </div>
      {status === "host_cancelled" && booking.status !== "host_cancelled" && (
        <p className="text-xs text-[#e8c08f]">
          Cancelling for the host: the guest is told, can rate the host, and the deposit is marked refund due unless you
          choose otherwise.
        </p>
      )}
      <label htmlFor={`${uid}-note`} className="block text-sm text-ivory/70">
        Note (refunds, disputes, calls)
        <textarea id={`${uid}-note`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block w-full rounded-lg border border-ivory/25 bg-transparent px-3 py-2 text-ivory focus-visible:outline-2 focus-visible:outline-ivory" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={async () => {
            const depositChanged = deposit !== booking.depositStatus;
            const result = await adminUpdateBooking(
              booking.id,
              status === booking.status ? null : status,
              depositChanged ? deposit : null,
              note,
            );
            if ("error" in result) return setMessage({ tone: "error", text: result.error });
            setNote("");
            setMessage({ tone: "ok", text: "Saved." });
            onSaved();
          }}
          className={secondaryButtonClass}
        >
          Save
        </button>
        {message && (
          <p role="status" className={`text-sm ${message.tone === "error" ? "text-terracotta-soft" : "text-[#a9d9b1]"}`}>{message.text}</p>
        )}
      </div>
      {notes.length > 0 && (
        <ul className="space-y-1 border-t border-ivory/10 pt-3 text-sm text-ivory/70">
          {notes.map((n) => (
            <li key={n.id}>
              <span className="text-ivory/45">{formatWhen(n.createdAt)} · </span>
              {n.body}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function guestRecord(state: AppState, guestId: string) {
  const ratings = state.guestReviews.filter((r) => r.guestId === guestId);
  const noShows = state.bookings.filter((b) => b.guestId === guestId && b.status === "no_show").length;
  const average = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null;
  return { ratings: ratings.length, average, noShows };
}

export function AdminBookings() {
  const state = useAppState();
  const [filter, setFilter] = useState<"all" | "attention" | BookingStatus>("attention");
  const [open, setOpen] = useState<string | null>(null);
  const [queue, setQueue] = useState<GroupToCreate[]>([]);
  const [notes, setNotes] = useState<BookingNote[]>([]);

  const reload = useCallback(() => {
    void loadWhatsappQueue().then(setQueue);
    void loadBookingNotes().then(setNotes);
  }, []);
  useEffect(() => {
    reload();
  }, [reload, state.bookings]);

  return (
    <RequireUser role="admin">
      {() => {
        const needsAttention = (b: Booking) => b.status === "in_review" || b.depositStatus === "refund_due";
        const count = (id: typeof filter) =>
          id === "all" ? state.bookings.length : id === "attention" ? state.bookings.filter(needsAttention).length : state.bookings.filter((b) => b.status === id).length;
        const rows = state.bookings
          .filter((b) => filter === "all" || (filter === "attention" ? needsAttention(b) : b.status === filter))
          .map((b) => bookingDetails(state, b))
          .sort((a, b) => b.session.startsAt.localeCompare(a.session.startsAt));
        const hostedValue = state.bookings
          .filter((b) => b.status === "completed")
          .reduce((sum, b) => sum + b.partySize * b.pricePerGuest, 0);
        return (
          <div className="space-y-8">
            <PageTitle kicker="Mehman team" title="Bookings">
              Every seat requested across Mehman. {formatPrice(hostedValue)} of meals hosted so far.
            </PageTitle>

            <GroupQueue queue={queue} onDone={reload} />
            <TimerPanel demoMode={state.demoMode} onRan={reload} />

            <section className="space-y-4">
              <h2 className="font-serif text-2xl">All bookings</h2>
              <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
                <div className="flex w-max gap-2">
                  {(["attention", "all", ...statuses.map((s) => s.id)] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={filter === id}
                      onClick={() => setFilter(id)}
                      className={`min-h-11 rounded-full border px-4 text-sm ${focusRing} ${filter === id ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/20 text-ivory/75"}`}
                    >
                      {id === "attention" ? "Needs attention" : id === "all" ? "All" : statuses.find((s) => s.id === id)?.label} ({count(id)})
                    </button>
                  ))}
                </div>
              </div>
              {rows.length === 0 ? (
                <p className={`${cardClass} text-ivory/70`}>No bookings here.</p>
              ) : (
                <ul className="divide-y divide-ivory/10">
                  {rows.map(({ booking, session, table, host, guest }) => {
                    const record = guestRecord(state, booking.guestId);
                    const isOpen = open === booking.id;
                    return (
                      <li key={booking.id} className="py-4">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpen(isOpen ? null : booking.id)}
                          className={`flex w-full items-start justify-between gap-3 rounded text-left ${focusRing}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{guest.fullName || guest.email} → {host.displayName}</p>
                            <p className="truncate text-sm text-ivory/60">
                              {table.title} · {findExploreCity(host.cityId)?.name}
                            </p>
                            <p className="text-sm text-ivory/60">
                              {formatWhen(session.startsAt)} · {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"} · {formatPrice(booking.partySize * booking.pricePerGuest)}
                            </p>
                            <p className="text-xs text-ivory/50">
                              Guest: {record.ratings ? `★ ${record.average!.toFixed(1)} (${record.ratings})` : "not rated yet"}
                              {record.noShows > 0 && ` · ${record.noShows} no-show${record.noShows === 1 ? "" : "s"}`}
                              {booking.depositStatus === "refund_due" && " · refund due"}
                            </p>
                          </div>
                          <StatusChip status={booking.status} />
                        </button>
                        {isOpen && (
                          <>
                            <div className="mt-3 text-sm">
                              <MoneySummary booking={booking} />
                            </div>
                            <BookingActions
                              key={`${booking.id}-${booking.status}-${booking.depositStatus}`}
                              booking={booking}
                              notes={notes.filter((n) => n.bookingId === booking.id)}
                              onSaved={reload}
                            />
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        );
      }}
    </RequireUser>
  );
}
