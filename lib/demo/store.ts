"use client";

import { useSyncExternalStore } from "react";
import { createSeed } from "./seed";
import type {
  AppNotification,
  Booking,
  BookingStatus,
  DemoState,
  DiningSession,
  DiningTable,
  Host,
  Profile,
  Review,
  TableStatus,
} from "./types";

// A stand-in for the database while the journeys are being designed. It
// keeps everything in this browser and applies the same rules as the
// Supabase functions (seat limits, who may change a booking, review).

const STORAGE_KEY = "mehman-demo-v1";

// Nothing is known on the server, so pages render their signed-out,
// empty shell first and fill in once the browser has loaded the data.
const serverState: DemoState = {
  version: 4,
  currentUserId: null,
  profiles: [],
  hosts: [],
  tables: [],
  sessions: [],
  bookings: [],
  reviews: [],
  notifications: [],
  saved: [],
};

let state: DemoState | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      // Older preview data is simply replaced with fresh samples.
      if (parsed.version === 4) return parsed;
    }
  } catch (error) {
    console.error("[demo] Couldn't read saved data", error);
  }
  return createSeed();
}

function getState(): DemoState {
  if (!state) {
    state = load();
    loaded = true;
  }
  return state;
}

function setState(update: (current: DemoState) => DemoState) {
  state = update(getState());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("[demo] Couldn't save data", error);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      state = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getState, () => serverState);
}

// False during the first render on the client, while saved data loads.
export function useDemoReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      getState();
      return loaded;
    },
    () => false,
  );
}

const id = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

type Result<T = void> = { error: string } | { ok: true; value: T };

const fail = (error: string): { error: string } => ({ error });

// In-app notifications. WhatsApp, SMS and email will hang off the same
// events once a messaging service is connected.
function notify(
  s: DemoState,
  userId: string,
  title: string,
  body: string,
  href: string,
): DemoState {
  const notification: AppNotification = {
    id: id("note"),
    userId,
    title,
    body,
    href,
    read: false,
    createdAt: new Date().toISOString(),
  };
  return { ...s, notifications: [notification, ...s.notifications] };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ------------------------------------------------------------ selectors

export function currentUser(s: DemoState): Profile | null {
  return s.profiles.find((profile) => profile.id === s.currentUserId) ?? null;
}

export function hostForUser(s: DemoState, userId: string | null | undefined) {
  return s.hosts.find((host) => host.userId === userId) ?? null;
}

export function seatsLeft(s: DemoState, session: DiningSession) {
  const taken = s.bookings
    .filter(
      (booking) =>
        booking.sessionId === session.id &&
        (booking.status === "requested" || booking.status === "accepted"),
    )
    .reduce((sum, booking) => sum + booking.partySize, 0);
  return session.seatsTotal - taken;
}

export function hasStarted(iso: string) {
  return new Date(iso).getTime() <= Date.now();
}

export function upcomingSessions(s: DemoState, tableId: string) {
  const now = Date.now();
  return s.sessions
    .filter(
      (session) =>
        session.tableId === tableId && new Date(session.startsAt).getTime() > now,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function approvedTablesInCity(s: DemoState, cityId: string) {
  return s.tables.filter((table) => {
    const host = s.hosts.find((h) => h.id === table.hostId);
    return (
      table.status === "approved" &&
      host?.status === "approved" &&
      host.cityId === cityId
    );
  });
}

export function tableRating(s: DemoState, tableId: string) {
  const reviews = s.reviews.filter((r) => r.tableId === tableId);
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  return { average, count: reviews.length, reviews };
}

export function myNotifications(s: DemoState) {
  return s.notifications.filter((n) => n.userId === s.currentUserId);
}

// Everything a booking screen needs, joined together.
export function bookingDetails(s: DemoState, booking: Booking) {
  const session = s.sessions.find((x) => x.id === booking.sessionId)!;
  const table = s.tables.find((x) => x.id === session.tableId)!;
  const host = s.hosts.find((x) => x.id === table.hostId)!;
  const guest = s.profiles.find((x) => x.id === booking.guestId)!;
  return { booking, session, table, host, guest };
}

// ------------------------------------------------------------- account

// Email or phone, whichever the visitor logged in with.
export function signIn(
  login: { email: string } | { phone: string },
  fullName = "",
): Result<Profile> {
  const email = "email" in login ? login.email.trim().toLowerCase() : "";
  const phone = "phone" in login ? login.phone.replace(/\s+/g, "") : "";
  const existing = getState().profiles.find((p) =>
    email ? p.email === email : p.phone.replace(/\s+/g, "") === phone,
  );
  const profile: Profile = existing ?? {
    id: id("user"),
    email,
    fullName,
    phone,
    role: "guest",
    createdAt: new Date().toISOString(),
  };
  setState((s) => ({
    ...s,
    currentUserId: profile.id,
    profiles: existing ? s.profiles : [...s.profiles, profile],
  }));
  return { ok: true, value: profile };
}

export function switchUser(userId: string) {
  setState((s) => ({ ...s, currentUserId: userId }));
}

export function signOut() {
  setState((s) => ({ ...s, currentUserId: null }));
}

export function updateProfile(fields: { fullName: string; phone: string }): Result {
  const me = currentUser(getState());
  if (!me) return fail("Please log in again.");
  setState((s) => ({
    ...s,
    profiles: s.profiles.map((p) =>
      p.id === me.id
        ? { ...p, fullName: fields.fullName.trim(), phone: fields.phone.trim() }
        : p,
    ),
  }));
  return { ok: true, value: undefined };
}

export function resetDemo() {
  const keepUser = getState().currentUserId;
  setState(() => {
    const fresh = createSeed();
    return fresh.profiles.some((p) => p.id === keepUser)
      ? { ...fresh, currentUserId: keepUser }
      : fresh;
  });
}

// ------------------------------------------------------------- hosting

export type HostApplication = {
  host: Pick<Host, "cityId" | "displayName" | "bio" | "languages" | "address" | "contactPhone">;
  table: Pick<
    DiningTable,
    "title" | "story" | "menu" | "cuisine" | "veg" | "pricePerGuest" | "maxGuests" | "photos"
  >;
  dates: { startsAt: string; seats: number }[];
};

export function applyAsHost(application: HostApplication): Result {
  const s = getState();
  const me = currentUser(s);
  if (!me) return fail("Please log in to apply.");
  if (hostForUser(s, me.id)) return fail("You've already applied to host.");

  const now = new Date().toISOString();
  const host: Host = {
    id: id("host"),
    userId: me.id,
    ...application.host,
    status: "pending",
    reviewNote: null,
    createdAt: now,
  };
  const table: DiningTable = {
    id: id("table"),
    hostId: host.id,
    ...application.table,
    status: "pending",
    reviewNote: null,
    createdAt: now,
  };
  const sessions: DiningSession[] = application.dates.map((date) => ({
    id: id("session"),
    tableId: table.id,
    startsAt: date.startsAt,
    seatsTotal: date.seats,
  }));

  setState((current) => ({
    ...current,
    hosts: [...current.hosts, host],
    tables: [...current.tables, table],
    sessions: [...current.sessions, ...sessions],
  }));
  return { ok: true, value: undefined };
}

export function addSession(tableId: string, startsAt: string, seats: number): Result {
  const s = getState();
  const myHost = hostForUser(s, s.currentUserId);
  const table = s.tables.find((t) => t.id === tableId);
  if (!myHost || table?.hostId !== myHost.id) return fail("You can only add dates to your own table.");
  if (new Date(startsAt).getTime() <= Date.now()) return fail("Please pick a date in the future.");
  if (seats < 1 || seats > table.maxGuests) return fail(`Seats must be between 1 and ${table.maxGuests}.`);
  setState((current) => ({
    ...current,
    sessions: [...current.sessions, { id: id("session"), tableId, startsAt, seatsTotal: seats }],
  }));
  return { ok: true, value: undefined };
}

export function removeSession(sessionId: string): Result {
  const s = getState();
  const active = s.bookings.some(
    (b) => b.sessionId === sessionId && (b.status === "requested" || b.status === "accepted"),
  );
  if (active) return fail("Guests have asked for this date. Decline or cancel them first.");
  setState((current) => ({
    ...current,
    sessions: current.sessions.filter((x) => x.id !== sessionId),
  }));
  return { ok: true, value: undefined };
}

// A host may pause and resume their own approved table.
export function setOwnTablePaused(tableId: string, paused: boolean): Result {
  const s = getState();
  const table = s.tables.find((t) => t.id === tableId);
  const myHost = hostForUser(s, s.currentUserId);
  if (!table || table.hostId !== myHost?.id) return fail("This isn't your table.");
  const allowed = paused ? table.status === "approved" : table.status === "paused";
  if (!allowed) return fail("That change needs Mehman's review.");
  setState((current) => ({
    ...current,
    tables: current.tables.map((t) =>
      t.id === tableId ? { ...t, status: paused ? "paused" : "approved" } : t,
    ),
  }));
  return { ok: true, value: undefined };
}

// ---------------------------------------------------------------- admin

export function reviewHost(hostId: string, approve: boolean, note: string): Result {
  const s = getState();
  if (currentUser(s)?.role !== "admin") return fail("Only the Mehman team can review hosts.");
  const host = s.hosts.find((h) => h.id === hostId);
  if (!host) return fail("Host not found.");
  const tableStatus: TableStatus = approve ? "approved" : "rejected";
  setState((current) => ({
    ...current,
    hosts: current.hosts.map((h) =>
      h.id === hostId
        ? { ...h, status: approve ? "approved" : "rejected", reviewNote: note.trim() || null }
        : h,
    ),
    tables: current.tables.map((t) =>
      t.hostId === hostId && t.status === "pending"
        ? { ...t, status: tableStatus, reviewNote: note.trim() || null }
        : t,
    ),
    profiles: current.profiles.map((p) =>
      p.id === host.userId && approve && p.role === "guest" ? { ...p, role: "host" } : p,
    ),
  }));
  setState((current) =>
    notify(
      current,
      host.userId,
      approve ? "Your table is live!" : "Your table wasn't approved",
      approve ? "Guests can now find and book it." : note.trim(),
      "/host",
    ),
  );
  return { ok: true, value: undefined };
}

// Re-checks a live host's table after they change its price or photos.
export function reviewTableChanges(tableId: string, approve: boolean, note: string): Result {
  const s = getState();
  if (currentUser(s)?.role !== "admin") return fail("Only the Mehman team can review tables.");
  const table = s.tables.find((t) => t.id === tableId);
  const host = s.hosts.find((h) => h.id === table?.hostId);
  if (!table || !host || table.status !== "pending") return fail("Nothing to review here.");
  setState((current) =>
    notify(
      {
        ...current,
        tables: current.tables.map((t) =>
          t.id === tableId
            ? { ...t, status: approve ? "approved" : "rejected", reviewNote: note.trim() || null }
            : t,
        ),
      },
      host.userId,
      approve ? "Your changes are live" : "Your changes weren't approved",
      approve ? `${table.title} is bookable again.` : note.trim(),
      "/host/table",
    ),
  );
  return { ok: true, value: undefined };
}

// ------------------------------------------------------------ bookings

export function requestBooking(sessionId: string, partySize: number, note: string): Result<Booking> {
  const s = getState();
  const me = currentUser(s);
  if (!me) return fail("Please log in to request a seat.");
  const session = s.sessions.find((x) => x.id === sessionId);
  const table = s.tables.find((t) => t.id === session?.tableId);
  if (!session || table?.status !== "approved" || new Date(session.startsAt).getTime() <= Date.now()) {
    return fail("This date is no longer available.");
  }
  if (hostForUser(s, me.id)?.id === table.hostId) return fail("You can't book your own table.");
  if (s.bookings.some((b) => b.sessionId === sessionId && b.guestId === me.id && (b.status === "requested" || b.status === "accepted"))) {
    return fail("You've already asked for this date.");
  }
  if (seatsLeft(s, session) < partySize) return fail("Not enough seats left on this date.");

  const booking: Booking = {
    id: id("booking"),
    sessionId,
    guestId: me.id,
    partySize,
    pricePerGuest: table.pricePerGuest,
    note: note.trim(),
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  const host = s.hosts.find((h) => h.id === table.hostId)!;
  setState((current) =>
    notify(
      { ...current, bookings: [...current.bookings, booking] },
      host.userId,
      `New request from ${me.fullName || "a guest"}`,
      `${plural(partySize, "guest")} · ${new Date(session.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
      "/host/requests",
    ),
  );
  return { ok: true, value: booking };
}

export function setBookingStatus(bookingId: string, next: BookingStatus): Result {
  const s = getState();
  const me = currentUser(s);
  const booking = s.bookings.find((b) => b.id === bookingId);
  if (!me || !booking) return fail("Booking not found.");
  const { host, table, session, guest } = bookingDetails(s, booking);
  const isHost = host.userId === me.id;
  const isGuest = booking.guestId === me.id;
  const started = hasStarted(session.startsAt);

  const allowed =
    (isHost && booking.status === "requested" && (next === "accepted" || next === "declined")) ||
    (isHost && booking.status === "accepted" && started && (next === "completed" || next === "no_show")) ||
    (isHost && booking.status === "accepted" && !started && next === "cancelled") ||
    (isGuest && (booking.status === "requested" || booking.status === "accepted") && !started && next === "cancelled");
  if (!allowed) return fail("That change isn't allowed.");

  setState((current) => {
    let updated: DemoState = {
      ...current,
      bookings: current.bookings.map((b) => (b.id === bookingId ? { ...b, status: next } : b)),
    };
    if (next === "accepted") {
      updated = notify(updated, guest.id, `${host.displayName} accepted your request`, `${table.title} · the address is now in your trip`, "/bookings");
    } else if (next === "declined") {
      updated = notify(updated, guest.id, `${host.displayName} can't host you on this date`, "Try another date or table.", "/bookings");
    } else if (next === "cancelled" && isGuest) {
      updated = notify(updated, host.userId, `${guest.fullName || "A guest"} cancelled`, plural(booking.partySize, "seat") + " freed up", "/host/requests");
    } else if (next === "cancelled" && isHost) {
      updated = notify(updated, guest.id, `${host.displayName} had to cancel`, "We're sorry. Try another date or table.", "/bookings");
    } else if (next === "completed") {
      updated = notify(updated, guest.id, `How was ${table.title}?`, `Leave a review for ${host.displayName}`, "/bookings");
    }
    return updated;
  });
  return { ok: true, value: undefined };
}

export function addSessions(tableId: string, startsAts: string[], seats: number): Result<number> {
  let added = 0;
  for (const startsAt of startsAts) {
    const result = addSession(tableId, startsAt, seats);
    if ("error" in result) return added ? { ok: true, value: added } : result;
    added += 1;
  }
  return { ok: true, value: added };
}

export type TableEdits = Pick<
  DiningTable,
  "title" | "story" | "menu" | "cuisine" | "veg" | "pricePerGuest" | "maxGuests" | "photos"
>;

// Wording changes go live straight away; a new price or new photos on a
// live table go back to Mehman for a quick look first.
export function updateTable(tableId: string, edits: TableEdits): Result<{ needsReview: boolean }> {
  const s = getState();
  const table = s.tables.find((t) => t.id === tableId);
  const myHost = hostForUser(s, s.currentUserId);
  if (!table || table.hostId !== myHost?.id) return fail("This isn't your table.");
  const photosChanged = edits.photos.join("|") !== table.photos.join("|");
  const priceChanged = edits.pricePerGuest !== table.pricePerGuest;
  const needsReview = (table.status === "approved" || table.status === "paused") && (photosChanged || priceChanged);
  setState((current) => ({
    ...current,
    tables: current.tables.map((t) =>
      t.id === tableId
        ? { ...t, ...edits, status: needsReview || t.status === "rejected" ? "pending" : t.status }
        : t,
    ),
  }));
  return { ok: true, value: { needsReview } };
}

export function addReview(bookingId: string, rating: number, text: string): Result {
  const s = getState();
  const me = currentUser(s);
  const booking = s.bookings.find((b) => b.id === bookingId);
  if (!me || booking?.guestId !== me.id) return fail("Booking not found.");
  if (booking.status !== "completed") return fail("You can review a meal once it has happened.");
  if (s.reviews.some((r) => r.bookingId === bookingId)) return fail("You've already reviewed this meal.");
  if (rating < 1 || rating > 5) return fail("Please choose 1 to 5 stars.");
  const { table, host } = bookingDetails(s, booking);
  const review: Review = {
    id: id("review"),
    bookingId,
    tableId: table.id,
    guestId: me.id,
    rating,
    text: text.trim(),
    hostReply: null,
    createdAt: new Date().toISOString(),
  };
  setState((current) =>
    notify(
      { ...current, reviews: [review, ...current.reviews] },
      host.userId,
      `${me.fullName || "A guest"} left you a review`,
      `${"★".repeat(rating)}${text.trim() ? ` “${text.trim().slice(0, 60)}”` : ""}`,
      "/host/earnings",
    ),
  );
  return { ok: true, value: undefined };
}

export function replyToReview(reviewId: string, reply: string): Result {
  const s = getState();
  const review = s.reviews.find((r) => r.id === reviewId);
  const table = s.tables.find((t) => t.id === review?.tableId);
  if (!review || !table || table.hostId !== hostForUser(s, s.currentUserId)?.id) {
    return fail("You can only reply to reviews of your own table.");
  }
  if (reply.trim().length < 2) return fail("Write a short reply.");
  setState((current) => ({
    ...current,
    reviews: current.reviews.map((r) => (r.id === reviewId ? { ...r, hostReply: reply.trim() } : r)),
  }));
  return { ok: true, value: undefined };
}

export function markNotificationsRead() {
  const userId = getState().currentUserId;
  setState((current) => ({
    ...current,
    notifications: current.notifications.map((n) =>
      n.userId === userId && !n.read ? { ...n, read: true } : n,
    ),
  }));
}

// ---------------------------------------------------------------- saved

export function isSaved(s: DemoState, tableId: string) {
  return s.saved.some((x) => x.userId === s.currentUserId && x.tableId === tableId);
}

export function mySavedTables(s: DemoState) {
  return s.saved
    .filter((x) => x.userId === s.currentUserId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .flatMap((x) => s.tables.find((t) => t.id === x.tableId) ?? []);
}

export function toggleSaved(tableId: string): Result<boolean> {
  const s = getState();
  const me = currentUser(s);
  if (!me) return fail("Log in to save tables.");
  const saved = isSaved(s, tableId);
  setState((current) => ({
    ...current,
    saved: saved
      ? current.saved.filter((x) => !(x.userId === me.id && x.tableId === tableId))
      : [...current.saved, { userId: me.id, tableId, savedAt: new Date().toISOString() }],
  }));
  return { ok: true, value: !saved };
}

// The city a visitor last chose on Explore, so Experiences opens there.
const CITY_KEY = "mehman-city";

export function rememberCity(cityId: string) {
  try {
    window.localStorage.setItem(CITY_KEY, cityId);
  } catch {
    // Private browsing: Experiences falls back to the first city.
  }
}

export function lastCity(): string | null {
  try {
    return window.localStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}
