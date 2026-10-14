"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  cardClass,
  focusRing,
  formatWhen,
  PageTitle,
  RequireUser,
  SampleDataNote,
} from "@/app/_components/app-ui";
import {
  bookingDetails,
  currentUser,
  hasStarted,
  markNotificationsRead,
  myNotifications,
  useDemoState,
} from "@/lib/demo/store";
import type { DemoState } from "@/lib/demo/types";

const DAY = 24 * 60 * 60 * 1000;

// Meals in the next day, for the signed-in guest or host. Real reminders
// will go out by WhatsApp or SMS the day before.
function upcomingReminders(state: DemoState) {
  const me = currentUser(state);
  if (!me) return [];
  return state.bookings
    .filter((b) => b.status === "accepted")
    .map((b) => bookingDetails(state, b))
    .filter(({ session, booking, host }) => {
      const until = new Date(session.startsAt).getTime() - new Date().getTime();
      return !hasStarted(session.startsAt) && until < DAY && (booking.guestId === me.id || host.userId === me.id);
    })
    .map(({ session, booking, table, host, guest }) =>
      booking.guestId === me.id
        ? { id: booking.id, title: `Tomorrow: ${table.title}`, body: `${formatWhen(session.startsAt)} at ${host.displayName}`, href: "/trips" }
        : { id: booking.id, title: `Guests tomorrow: ${guest.fullName}`, body: `${booking.partySize} guests · ${formatWhen(session.startsAt)}`, href: "/host" },
    );
}

export function InboxScreen() {
  const state = useDemoState();
  const notifications = myNotifications(state);
  const hasUnread = notifications.some((n) => !n.read);

  // Opening the list marks everything as seen (after it has been shown).
  useEffect(() => {
    if (!hasUnread) return;
    const timer = setTimeout(markNotificationsRead, 1500);
    return () => clearTimeout(timer);
  }, [hasUnread]);

  return (
    <RequireUser>
      {() => {
        const reminders = upcomingReminders(state);
        return (
          <div className="space-y-6">
            <PageTitle kicker="Inbox" title="What's new" />
            {reminders.length > 0 && (
              <ul className="space-y-2">
                {reminders.map((r) => (
                  <li key={r.id}>
                    <Link href={r.href} className={`block rounded-2xl border border-[#e8c08f]/40 px-5 py-4 ${focusRing}`}>
                      <span className="block font-medium text-[#e8c08f]">{r.title}</span>
                      <span className="block text-sm text-ivory/70">{r.body}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {notifications.length === 0 ? (
              <p className={`${cardClass} text-ivory/70`}>Nothing yet. Requests, replies and reviews will show up here.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href} className={`flex gap-3 rounded-2xl px-5 py-4 ${n.read ? "bg-ivory/[0.03]" : "bg-ivory/[0.08]"} ${focusRing}`}>
                      <span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-terracotta-soft"}`} />
                      <span className="min-w-0">
                        <span className="block font-medium">{n.title}</span>
                        {n.body && <span className="block text-sm text-ivory/70">{n.body}</span>}
                        <span className="mt-1 block text-xs text-ivory/45">{formatWhen(n.createdAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-ivory/50">
              Once Mehman is live, these also arrive on WhatsApp or SMS, with a reminder the day before each meal.
            </p>
            <SampleDataNote />
          </div>
        );
      }}
    </RequireUser>
  );
}
