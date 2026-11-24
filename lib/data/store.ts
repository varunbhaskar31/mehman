"use client";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import type {
  AppNotification,
  AppState,
  Booking,
  ChatMessage,
  Conversation,
  BookingStatus,
  DepositStatus,
  DietTag,
  GuestReview,
  GuestSummary,
  DiningSession,
  DiningTable,
  Host,
  Profile,
  Review,
} from "./types";

// Everything the signed-in visitor may see, loaded from Supabase into one
// snapshot the screens read synchronously. Row-level security decides what
// comes back, and every change goes through a database function that
// checks the rules (supabase/migrations), then the snapshot reloads.

const emptyState: AppState = {
  currentUserId: null,
  profiles: [],
  hosts: [],
  tables: [],
  sessions: [],
  bookings: [],
  reviews: [],
  notifications: [],
  saved: [],
  conversations: [],
  guestSummaries: [],
  guestReviews: [],
  demoMode: false,
};

let state: AppState = emptyState;
let loaded = false;
let started = false;
const listeners = new Set<() => void>();

let client: SupabaseClient | null = null;
function db() {
  client ??= createClient();
  return client;
}

function emit() {
  listeners.forEach((listener) => listener());
}

// Connects once, on the first screen that reads data.
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!supabaseConfigured) {
    console.error("[data] Supabase isn't configured; set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    loaded = true;
    emit();
    return;
  }
  db().auth.onAuthStateChange((event) => {
    if (event === "TOKEN_REFRESHED") return;
    // Supabase asks that other calls wait until this callback returns.
    setTimeout(() => void refresh(), 0);
  });
  // New requests and replies show up when people come back to the tab,
  // and every minute while they're on it.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refresh();
  });
  setInterval(() => {
    if (document.visibilityState === "visible") void refresh();
  }, 60_000);
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => emptyState);
}

// False until the first load from the database has finished.
export function useAppReady(): boolean {
  return useSyncExternalStore(subscribe, () => loaded, () => false);
}

// ------------------------------------------------------------- loading

let inFlight: Promise<void> | null = null;
let again = false;

export function refresh(): Promise<void> {
  if (inFlight) {
    again = true;
    return inFlight;
  }
  inFlight = (async () => {
    do {
      again = false;
      try {
        state = await load();
      } catch (error) {
        console.error("[data] Couldn't load", error);
      }
    } while (again);
    loaded = true;
    inFlight = null;
    emit();
  })();
  return inFlight;
}

type Row = Record<string, unknown>;

function rows(result: { data: unknown; error: PostgrestError | null }, what: string): Row[] {
  if (result.error) {
    console.error(`[data] Couldn't load ${what}`, result.error);
    return [];
  }
  return (result.data as Row[] | null) ?? [];
}

const none = Promise.resolve({ data: [], error: null });

async function load(): Promise<AppState> {
  const supabase = db();
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id ?? null;

  const [profilesR, hostsR, privateR, tablesR, sessionsR, bookingsR, reviewsR, notesR, savedR, chatsR, guestReviewsR, settingsR] =
    await Promise.all([
      uid ? supabase.from("profiles").select("id, email, full_name, phone, role, created_at") : none,
      supabase.from("hosts").select("*"),
      uid ? supabase.from("host_private").select("*") : none,
      supabase.from("tables").select("*"),
      supabase.from("sessions").select("*"),
      uid ? supabase.from("bookings").select("*") : none,
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      uid
        ? supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100)
        : none,
      uid ? supabase.from("saved_tables").select("*") : none,
      uid ? supabase.rpc("my_conversations") : none,
      // Hosts and the team only; RLS returns nothing to guests.
      uid ? supabase.from("guest_reviews").select("*") : none,
      supabase.from("app_settings").select("demo_mode"),
    ]);

  const sessionRows = rows(sessionsR, "dates");
  const reviewRows = rows(reviewsR, "reviews");
  let profiles: Profile[] = rows(profilesR, "profiles").map((p) => ({
    id: p.id as string,
    email: (p.email as string | null) ?? "",
    fullName: (p.full_name as string | null) ?? "",
    phone: (p.phone as string | null) ?? "",
    role: p.role as Profile["role"],
    createdAt: p.created_at as string,
  }));

  // Seat counts and reviewers' first names come from functions, since
  // other guests' bookings and profiles are private.
  const known = new Set(profiles.map((p) => p.id));
  const reviewerIds = [...new Set(reviewRows.map((r) => r.guest_id as string))].filter((id) => !known.has(id));
  const bookingRows = rows(bookingsR, "bookings");
  const otherGuestBookings = bookingRows.filter((b) => b.guest_id !== uid).map((b) => b.id as string);
  const [takenR, namesR, guestsR] = await Promise.all([
    sessionRows.length
      ? supabase.rpc("seats_taken", { p_session_ids: sessionRows.map((s) => s.id) })
      : none,
    reviewerIds.length ? supabase.rpc("reviewer_names", { p_ids: reviewerIds }) : none,
    // First names and track records of guests on the host's requests;
    // contact details come only once the host accepts.
    otherGuestBookings.length ? supabase.rpc("booking_guests", { p_booking_ids: otherGuestBookings }) : none,
  ]);
  const guestSummaries: GuestSummary[] = rows(guestsR, "guests").map((g) => ({
    bookingId: g.booking_id as string,
    guestId: g.guest_id as string,
    firstName: g.first_name as string,
    rating: g.rating == null ? null : Number(g.rating),
    ratings: g.ratings as number,
    noShows: g.no_shows as number,
  }));
  const taken = new Map(rows(takenR, "seat counts").map((t) => [t.session_id as string, t.taken as number]));
  profiles = profiles.concat(
    rows(namesR, "reviewer names").map((n) => ({
      id: n.id as string,
      email: "",
      fullName: (n.first_name as string) ?? "",
      phone: "",
      role: "guest" as const,
      createdAt: "",
    })),
  );
  // Guests the host hasn't accepted yet appear by first name only.
  for (const g of guestSummaries) {
    if (profiles.some((p) => p.id === g.guestId)) continue;
    profiles.push({ id: g.guestId, email: "", fullName: g.firstName, phone: "", role: "guest", createdAt: "" });
  }

  const privateByHost = new Map(rows(privateR, "host contacts").map((p) => [p.host_id as string, p]));

  const hosts: Host[] = rows(hostsR, "hosts").map((h) => {
    const contact = privateByHost.get(h.id as string);
    return {
      id: h.id as string,
      userId: h.user_id as string,
      cityId: h.city_id as string,
      displayName: h.display_name as string,
      bio: h.bio as string,
      languages: (h.languages as string[]) ?? [],
      address: (contact?.address as string | undefined) ?? "",
      contactPhone: (contact?.contact_phone as string | undefined) ?? "",
      upiId: (contact?.upi_id as string | null | undefined) ?? "",
      venueFloor: (h.venue_floor as string | null) ?? "",
      venueParking: (h.venue_parking as string | null) ?? "",
      venuePets: (h.venue_pets as string | null) ?? "",
      venueSeating: (h.venue_seating as string | null) ?? "",
      houseRules: (h.house_rules as string | null) ?? "",
      homePhotos: (h.home_photo_paths as string[] | null) ?? [],
      locality: (h.locality as string | null) ?? undefined,
      area:
        h.area_lat != null && h.area_lng != null
          ? { lat: h.area_lat as number, lng: h.area_lng as number }
          : undefined,
      status: h.status as Host["status"],
      reviewNote: (h.review_note as string | null) ?? null,
      createdAt: h.created_at as string,
    };
  });

  const tables: DiningTable[] = rows(tablesR, "tables").map((t) => ({
    id: t.id as string,
    hostId: t.host_id as string,
    title: t.title as string,
    story: t.story as string,
    menu: t.menu as string,
    cuisine: t.cuisine as string,
    veg: t.veg as DiningTable["veg"],
    pricePerGuest: t.price_per_guest_inr as number,
    maxGuests: t.max_guests as number,
    photos: (t.photo_paths as string[]) ?? [],
    dietTags: (t.diet_tags as DietTag[] | null) ?? [],
    status: t.status as DiningTable["status"],
    reviewNote: (t.review_note as string | null) ?? null,
    createdAt: t.created_at as string,
  }));

  const sessions: DiningSession[] = sessionRows.map((s) => ({
    id: s.id as string,
    tableId: s.table_id as string,
    startsAt: s.starts_at as string,
    seatsTotal: s.seats_total as number,
    durationMinutes: (s.duration_minutes as number | null) ?? 180,
    seatsTaken: taken.get(s.id as string) ?? 0,
  }));

  const bookings: Booking[] = bookingRows.map((b) => ({
    id: b.id as string,
    sessionId: b.session_id as string,
    guestId: b.guest_id as string,
    partySize: b.party_size as number,
    pricePerGuest: b.price_per_guest_inr as number,
    note: (b.note as string | null) ?? "",
    status: b.status as BookingStatus,
    depositInr: (b.deposit_inr as number | null) ?? 0,
    depositStatus: ((b.deposit_status as string | null) ?? "none") as DepositStatus,
    acceptedAt: (b.accepted_at as string | null) ?? null,
    depositClaimedAt: (b.deposit_claimed_at as string | null) ?? null,
    confirmedAt: (b.confirmed_at as string | null) ?? null,
    whatsappGroupAt: (b.whatsapp_group_at as string | null) ?? null,
    createdAt: b.created_at as string,
  }));

  const guestReviews: GuestReview[] = rows(guestReviewsR, "guest reviews").map((g) => ({
    id: g.id as string,
    bookingId: g.booking_id as string,
    guestId: g.guest_id as string,
    hostId: g.host_id as string,
    rating: g.rating as number,
    text: g.body as string,
    createdAt: g.created_at as string,
  }));
  const demoMode = Boolean(rows(settingsR, "settings")[0]?.demo_mode);

  const reviews: Review[] = reviewRows.map((r) => ({
    id: r.id as string,
    bookingId: r.booking_id as string,
    tableId: r.table_id as string,
    guestId: r.guest_id as string,
    rating: r.rating as number,
    text: r.body as string,
    hostReply: (r.host_reply as string | null) ?? null,
    createdAt: r.created_at as string,
  }));

  const notifications: AppNotification[] = rows(notesR, "notifications").map((n) => ({
    id: n.id as string,
    userId: n.user_id as string,
    title: n.title as string,
    body: n.body as string,
    href: n.href as string,
    read: n.read as boolean,
    createdAt: n.created_at as string,
  }));

  const saved = rows(savedR, "saved tables").map((x) => ({
    userId: x.user_id as string,
    tableId: x.table_id as string,
    savedAt: x.saved_at as string,
  }));

  const conversations: Conversation[] = rows(chatsR, "messages").map((c) => ({
    id: c.id as string,
    tableId: c.table_id as string,
    guestId: c.guest_id as string,
    asHost: c.as_host as boolean,
    otherName: c.other_name as string,
    tableTitle: c.table_title as string,
    lastBody: (c.last_body as string | null) ?? "",
    lastSenderId: (c.last_sender as string | null) ?? null,
    lastMessageAt: c.last_message_at as string,
    unread: c.unread as boolean,
  }));

  return {
    currentUserId: uid, profiles, hosts, tables, sessions, bookings, reviews, notifications, saved, conversations,
    guestSummaries, guestReviews, demoMode,
  };
}

// ------------------------------------------------------------- changes

type Result<T = void> = { error: string } | { ok: true; value: T };

const fail = (error: string): { error: string } => ({ error });

// Messages raised by our database functions are written for people; any
// other failure gets a general one.
function friendly(error: { message: string; code?: string }) {
  if (error.code === "P0001") return error.message;
  console.error("[data]", error);
  return "Something went wrong. Please try again.";
}

async function rpc<T = void>(name: string, args: Record<string, unknown>): Promise<Result<T>> {
  const { data, error } = await db().rpc(name, args);
  if (error) return fail(friendly(error));
  await refresh();
  return { ok: true, value: data as T };
}

// ------------------------------------------------------------ selectors

export function currentUser(s: AppState): Profile | null {
  return s.profiles.find((profile) => profile.id === s.currentUserId) ?? null;
}

export function hostForUser(s: AppState, userId: string | null | undefined) {
  return s.hosts.find((host) => host.userId === userId) ?? null;
}

export function seatsLeft(_s: AppState, session: DiningSession) {
  return session.seatsTotal - session.seatsTaken;
}

// Milliseconds from now until a time; negative once it has passed.
export function msUntil(iso: string) {
  return new Date(iso).getTime() - Date.now();
}

export function nowMs() {
  return Date.now();
}

export function hasStarted(iso: string) {
  return new Date(iso).getTime() <= Date.now();
}

// Requests for a slot close 1 hour before it starts.
export const CLOSE_BEFORE_MS = 60 * 60 * 1000;

export function slotClosed(session: DiningSession) {
  return new Date(session.startsAt).getTime() - CLOSE_BEFORE_MS <= Date.now();
}

export function slotEnds(session: DiningSession) {
  return new Date(new Date(session.startsAt).getTime() + session.durationMinutes * 60_000);
}

// Slots a guest can still ask for.
export function upcomingSessions(s: AppState, tableId: string) {
  return s.sessions
    .filter((session) => session.tableId === tableId && !slotClosed(session))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function approvedTablesInCity(s: AppState, cityId: string) {
  return s.tables.filter((table) => {
    const host = s.hosts.find((h) => h.id === table.hostId);
    return (
      table.status === "approved" &&
      host?.status === "approved" &&
      host.cityId === cityId
    );
  });
}

export function tableRating(s: AppState, tableId: string) {
  const reviews = s.reviews.filter((r) => r.tableId === tableId);
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  return { average, count: reviews.length, reviews };
}

export function myNotifications(s: AppState) {
  return s.notifications.filter((n) => n.userId === s.currentUserId);
}

// Everything a booking screen needs, joined together.
export function bookingDetails(s: AppState, booking: Booking) {
  const session = s.sessions.find((x) => x.id === booking.sessionId)!;
  const table = s.tables.find((x) => x.id === session.tableId)!;
  const host = s.hosts.find((x) => x.id === table.hostId)!;
  const guest = s.profiles.find((x) => x.id === booking.guestId) ?? {
    id: booking.guestId, email: "", fullName: "Guest", phone: "", role: "guest" as const, createdAt: "",
  };
  const summary = s.guestSummaries.find((g) => g.bookingId === booking.id) ?? null;
  return { booking, session, table, host, guest, summary };
}

// Where each kind of person starts: hosts in hosting mode, the team in
// its console, everyone else on Explore.
export function homeFor(s: AppState, userId: string) {
  const profile = s.profiles.find((p) => p.id === userId);
  if (profile?.role === "admin") return "/admin";
  if (hostForUser(s, userId)) return "/host";
  return "/explore";
}

// ------------------------------------------------------------- account

export type Login = { email: string } | { phone: string };

export async function signInWithGoogle(next: string): Promise<Result> {
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await db().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  return error ? fail(friendly(error)) : { ok: true, value: undefined };
}

export async function sendLoginCode(login: Login): Promise<Result> {
  const { error } = await db().auth.signInWithOtp(login);
  if (!error) return { ok: true, value: undefined };
  if (error.status === 429) return fail("Too many codes asked for. Please wait a minute and try again.");
  if ("phone" in login) {
    console.error("[auth]", error);
    return fail("We couldn't text you a code. Please use your email for now.");
  }
  return fail(friendly(error));
}

// Returns the signed-in profile, so the login screen knows whether to
// ask for a name.
export async function verifyLoginCode(login: Login, token: string): Promise<Result<Profile>> {
  const { error } = await db().auth.verifyOtp(
    "email" in login
      ? { email: login.email, token, type: "email" }
      : { phone: login.phone, token, type: "sms" },
  );
  if (error) {
    return fail(
      error.status === 403 || error.status === 400
        ? "That code didn't work. Check it, or ask for a new one."
        : friendly(error),
    );
  }
  await refresh();
  const me = currentUser(state);
  return me ? { ok: true, value: me } : fail("Please log in again.");
}

// Demo accounts only: the demo database has email + password users so the
// presenter doesn't wait for codes. Shown when NEXT_PUBLIC_DEMO_LOGIN=on.
export async function signInWithPassword(email: string, password: string): Promise<Result<Profile>> {
  const { error } = await db().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) {
    return fail(error.status === 400 ? "That email and password don't match a demo account." : friendly(error));
  }
  await refresh();
  const me = currentUser(state);
  return me ? { ok: true, value: me } : fail("Please log in again.");
}

export async function signOut() {
  await db().auth.signOut();
  await refresh();
}

export async function updateProfile(fields: { fullName: string; phone: string }): Promise<Result> {
  const me = currentUser(state);
  if (!me) return fail("Please log in again.");
  const { error } = await db()
    .from("profiles")
    .update({ full_name: fields.fullName.trim(), phone: fields.phone.trim() || null })
    .eq("id", me.id);
  if (error) return fail(friendly(error));
  await refresh();
  return { ok: true, value: undefined };
}

// ------------------------------------------------------------- photos

// Photos picked on the phone arrive as resized data URLs; they go to the
// host's own folder in storage and are kept as public URLs. Photos that
// are already URLs are left as they are.
async function uploadPhotos(photos: string[]): Promise<Result<string[]>> {
  const me = state.currentUserId;
  if (!me) return fail("Please log in again.");
  const storage = db().storage.from("table-photos");
  const urls: string[] = [];
  for (const photo of photos) {
    if (!photo.startsWith("data:")) {
      urls.push(photo);
      continue;
    }
    const blob = await (await fetch(photo)).blob();
    const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${me}/${crypto.randomUUID()}.${extension}`;
    // Sent as raw bytes: storage-js 2.117 wraps a Blob in a form field with
    // no name, and the server then stores an empty text file.
    const { error } = await storage.upload(path, await blob.arrayBuffer(), { contentType: blob.type, cacheControl: "31536000" });
    if (error) {
      console.error("[photos]", error);
      return fail("A photo didn't upload. Check your connection and try again.");
    }
    urls.push(storage.getPublicUrl(path).data.publicUrl);
  }
  return { ok: true, value: urls };
}

// ------------------------------------------------------------- hosting

export type HostApplication = {
  host: Pick<Host, "cityId" | "displayName" | "bio" | "languages" | "address" | "contactPhone" | "locality" | "upiId"> &
    Partial<VenueDetails>;
  table: Pick<
    DiningTable,
    "title" | "story" | "menu" | "cuisine" | "veg" | "pricePerGuest" | "maxGuests" | "photos" | "dietTags"
  >;
  dates: { startsAt: string; seats: number; durationMinutes?: number }[];
};

// Pins the host's neighbourhood on the map. The database moves the point a
// few hundred metres before saving it, so it never marks the house.
export function setMyArea(area: { lat: number; lng: number }) {
  return rpc("set_my_area", { p_lat: area.lat, p_lng: area.lng });
}

// From My table: a new neighbourhood name and pin.
export async function updateMyNeighbourhood(hostId: string, locality: string, area: { lat: number; lng: number }): Promise<Result> {
  const { error } = await db().from("hosts").update({ locality: locality.trim() }).eq("id", hostId);
  if (error) return fail(friendly(error));
  return setMyArea(area);
}

export async function applyAsHost(
  application: HostApplication,
  area: { lat: number; lng: number } | null,
): Promise<Result> {
  if (!currentUser(state)) return fail("Please log in to apply.");
  if (hostForUser(state, state.currentUserId)) return fail("You've already applied to host.");
  const photos = await uploadPhotos(application.table.photos);
  if ("error" in photos) return photos;
  const homePhotos = await uploadPhotos(application.host.homePhotos ?? []);
  if ("error" in homePhotos) return homePhotos;
  const { host, table } = application;
  const result = await rpc<string>("apply_as_host", {
    p_host: {
      city_id: host.cityId,
      display_name: host.displayName,
      bio: host.bio,
      languages: host.languages,
      address: host.address,
      contact_phone: host.contactPhone,
      locality: host.locality ?? "",
      upi_id: host.upiId,
      venue_floor: host.venueFloor ?? "",
      venue_parking: host.venueParking ?? "",
      venue_pets: host.venuePets ?? "",
      venue_seating: host.venueSeating ?? "",
      house_rules: host.houseRules ?? "",
      home_photo_paths: homePhotos.value,
    },
    p_table: {
      title: table.title,
      story: table.story,
      menu: table.menu,
      cuisine: table.cuisine,
      veg: table.veg,
      price_per_guest_inr: table.pricePerGuest,
      max_guests: table.maxGuests,
      photo_paths: photos.value,
      diet_tags: table.dietTags,
    },
    p_dates: application.dates.map((d) => ({
      starts_at: d.startsAt,
      seats: d.seats,
      duration_minutes: d.durationMinutes ?? 180,
    })),
  });
  if ("error" in result) return result;
  // The application is in either way; a missing pin can be added from
  // My table.
  if (area) await setMyArea(area);
  return { ok: true, value: undefined };
}

export function addSessions(tableId: string, startsAts: string[], seats: number, minutes: 120 | 180 = 180) {
  return rpc<number>("add_slots", { p_table_id: tableId, p_starts: startsAts, p_seats: seats, p_minutes: minutes });
}

export function removeSession(sessionId: string) {
  return rpc("remove_session", { p_session_id: sessionId });
}

// A host may pause and resume their own approved table.
export async function setOwnTablePaused(tableId: string, paused: boolean): Promise<Result> {
  const { error } = await db()
    .from("tables")
    .update({ status: paused ? "paused" : "approved" })
    .eq("id", tableId);
  if (error) return fail(friendly(error));
  await refresh();
  return { ok: true, value: undefined };
}

export type TableEdits = Pick<
  DiningTable,
  "title" | "story" | "menu" | "cuisine" | "veg" | "pricePerGuest" | "maxGuests" | "photos" | "dietTags"
>;

// Wording changes go live straight away; a new price or new photos on a
// live table go back to Mehman for a quick look first.
export async function updateTable(
  tableId: string,
  edits: TableEdits,
): Promise<Result<{ needsReview: boolean; photos: string[] }>> {
  const photos = await uploadPhotos(edits.photos);
  if ("error" in photos) return photos;
  const result = await rpc<boolean>("update_table", {
    p_table_id: tableId,
    p_edits: {
      title: edits.title,
      story: edits.story,
      menu: edits.menu,
      cuisine: edits.cuisine,
      veg: edits.veg,
      price_per_guest_inr: edits.pricePerGuest,
      max_guests: edits.maxGuests,
      photo_paths: photos.value,
      diet_tags: edits.dietTags,
    },
  });
  return "error" in result
    ? result
    : { ok: true, value: { needsReview: result.value, photos: photos.value } };
}

// ---------------------------------------------------------------- admin

export function reviewHost(hostId: string, approve: boolean, note: string) {
  return rpc("review_host", { p_host_id: hostId, p_approve: approve, p_note: note });
}

// The Mehman team can take a live table off Explore (and put it back),
// for example after a complaint.
export function adminSetTablePaused(tableId: string, paused: boolean) {
  return rpc("admin_set_table_paused", { p_table_id: tableId, p_paused: paused });
}

// Re-checks a live host's table after they change its price or photos.
export function reviewTableChanges(tableId: string, approve: boolean, note: string) {
  return rpc("review_table_changes", { p_table_id: tableId, p_approve: approve, p_note: note });
}

// ------------------------------------------------------------ bookings

export async function requestBooking(
  sessionId: string,
  partySize: number,
  note: string,
  phone?: string,
): Promise<Result<Booking>> {
  if (!currentUser(state)) return fail("Please log in to request a seat.");
  const result = await rpc<string>("request_booking", {
    p_session_id: sessionId,
    p_party_size: partySize,
    p_note: note,
    p_phone: phone?.trim() || null,
  });
  if ("error" in result) return result;
  const booking = state.bookings.find((b) => b.id === result.value);
  return booking ? { ok: true, value: booking } : fail("Please refresh to see your request.");
}

export function setBookingStatus(bookingId: string, next: BookingStatus) {
  return rpc("set_booking_status", { p_booking_id: bookingId, p_status: next });
}

// Where the guest sends the deposit, once the host has accepted.
export async function loadBookingPayment(
  bookingId: string,
): Promise<{ upiId: string; payeeName: string; amount: number } | null> {
  const { data, error } = await db().rpc("booking_payment", { p_booking_id: bookingId });
  if (error) {
    console.error("[payment]", error);
    return null;
  }
  const row = (data as Row[] | null)?.[0];
  return row?.upi_id
    ? { upiId: row.upi_id as string, payeeName: row.payee_name as string, amount: row.amount_inr as number }
    : null;
}

export function confirmRefund(bookingId: string) {
  return rpc("confirm_refund", { p_booking_id: bookingId });
}

export async function addGuestReview(bookingId: string, rating: number, text: string): Promise<Result> {
  const result = await rpc<string>("add_guest_review", { p_booking_id: bookingId, p_rating: rating, p_text: text });
  return "error" in result ? result : { ok: true, value: undefined };
}

// The host's UPI ID, kept in their private details.
export async function updateMyUpi(hostId: string, upiId: string): Promise<Result> {
  const { error } = await db().from("host_private").update({ upi_id: upiId.trim() || null }).eq("host_id", hostId);
  if (error) {
    return fail(error.code === "23514" ? "That UPI ID doesn't look right. It looks like name@bank." : friendly(error));
  }
  await refresh();
  return { ok: true, value: undefined };
}

export type VenueDetails = Pick<
  Host,
  "venueFloor" | "venueParking" | "venuePets" | "venueSeating" | "houseRules" | "homePhotos"
>;

export async function updateMyVenue(hostId: string, venue: VenueDetails): Promise<Result> {
  const photos = await uploadPhotos(venue.homePhotos);
  if ("error" in photos) return photos;
  const { error } = await db()
    .from("hosts")
    .update({
      venue_floor: venue.venueFloor.trim() || null,
      venue_parking: venue.venueParking.trim() || null,
      venue_pets: venue.venuePets.trim() || null,
      venue_seating: venue.venueSeating.trim() || null,
      house_rules: venue.houseRules.trim() || null,
      home_photo_paths: photos.value,
    })
    .eq("id", hostId);
  if (error) return fail(friendly(error));
  await refresh();
  return { ok: true, value: undefined };
}

export type DocumentKind = "id" | "fssai" | "kitchen";

// Optional verification files go to a private bucket only the team can open.
export async function uploadVerification(hostId: string, kind: DocumentKind, file: File): Promise<Result> {
  const me = state.currentUserId;
  if (!me) return fail("Please log in again.");
  if (file.size > 5 * 1024 * 1024) return fail("Please pick a file under 5 MB.");
  const types: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  const extension = types[file.type];
  if (!extension) return fail("Please pick a photo or a PDF.");
  const path = `${me}/${kind}-${crypto.randomUUID()}.${extension}`;
  const { error } = await db()
    .storage.from("host-verification")
    .upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (error) {
    console.error("[verification]", error);
    return fail("That file didn't upload. Check your connection and try again.");
  }
  const { error: listError } = await db().from("host_documents").insert({ host_id: hostId, kind, path });
  if (listError) return fail(friendly(listError));
  return { ok: true, value: undefined };
}

export type HostDocument = { id: string; hostId: string; kind: DocumentKind; path: string; createdAt: string };

export async function loadHostDocuments(): Promise<HostDocument[]> {
  const { data, error } = await db().from("host_documents").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[verification]", error);
    return [];
  }
  return (data as Row[]).map((d) => ({
    id: d.id as string,
    hostId: d.host_id as string,
    kind: d.kind as DocumentKind,
    path: d.path as string,
    createdAt: d.created_at as string,
  }));
}

// A link that works for five minutes, for the team to open a private file.
export async function openVerificationFile(path: string): Promise<string | null> {
  const { data, error } = await db().storage.from("host-verification").createSignedUrl(path, 300);
  if (error) {
    console.error("[verification]", error);
    return null;
  }
  return data.signedUrl;
}

// ---------------------------------------------------------- team actions

export function adminUpdateBooking(
  bookingId: string,
  status: BookingStatus | null,
  depositStatus: DepositStatus | null,
  note: string,
) {
  return rpc("admin_update_booking", {
    p_booking_id: bookingId,
    p_status: status,
    p_deposit_status: depositStatus,
    p_note: note,
  });
}

export type BookingNote = { id: string; bookingId: string; body: string; createdAt: string };

export async function loadBookingNotes(): Promise<BookingNote[]> {
  const { data, error } = await db().from("booking_notes").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[notes]", error);
    return [];
  }
  return (data as Row[]).map((n) => ({
    id: n.id as string,
    bookingId: n.booking_id as string,
    body: n.body as string,
    createdAt: n.created_at as string,
  }));
}

export type GroupToCreate = {
  bookingId: string;
  groupName: string;
  tableTitle: string;
  startsAt: string;
  partySize: number;
  hostName: string;
  hostPhone: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
};

export async function loadWhatsappQueue(): Promise<GroupToCreate[]> {
  const { data, error } = await db().rpc("admin_whatsapp_queue");
  if (error) {
    console.error("[whatsapp]", error);
    return [];
  }
  return (data as Row[]).map((g) => ({
    bookingId: g.booking_id as string,
    groupName: g.group_name as string,
    tableTitle: g.table_title as string,
    startsAt: g.starts_at as string,
    partySize: g.party_size as number,
    hostName: g.host_name as string,
    hostPhone: (g.host_phone as string | null) ?? "",
    guestName: g.guest_name as string,
    guestPhone: (g.guest_phone as string | null) ?? "",
    guestEmail: (g.guest_email as string | null) ?? "",
  }));
}

export function markWhatsappGroupCreated(bookingId: string) {
  return rpc("mark_whatsapp_group_created", { p_booking_id: bookingId });
}

export type TimerRun = { expired: number; cancelledUnpaid: number; toReview: number; completed: number };

// Runs the booking timers now. In demo mode the team can run them as if it
// were some hours later.
export async function runTimers(hoursAhead = 0): Promise<Result<TimerRun>> {
  const result = await rpc<Row[]>("run_booking_timers", { p_hours_ahead: hoursAhead });
  if ("error" in result) return result;
  const row = result.value?.[0] ?? {};
  return {
    ok: true,
    value: {
      expired: (row.expired as number) ?? 0,
      cancelledUnpaid: (row.cancelled_unpaid as number) ?? 0,
      toReview: (row.to_review as number) ?? 0,
      completed: (row.completed as number) ?? 0,
    },
  };
}

export async function addReview(bookingId: string, rating: number, text: string): Promise<Result> {
  const result = await rpc<string>("add_review", { p_booking_id: bookingId, p_rating: rating, p_text: text });
  return "error" in result ? result : { ok: true, value: undefined };
}

export function replyToReview(reviewId: string, reply: string) {
  return rpc("reply_to_review", { p_review_id: reviewId, p_reply: reply });
}

export function markNotificationsRead() {
  return rpc("mark_notifications_read", {});
}

// ----------------------------------------------------------------- chat

// Conversations are keyed by table and guest, so a chat can open before
// its first message.
export function findConversation(s: AppState, tableId: string, guestId: string) {
  return s.conversations.find((c) => c.tableId === tableId && c.guestId === guestId) ?? null;
}

export function unreadChats(s: AppState, asHost: boolean) {
  return s.conversations.filter((c) => c.unread && c.asHost === asHost).length;
}

export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await db()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at");
  if (error) {
    console.error("[chat]", error);
    return [];
  }
  return (data as Row[]).map(toMessage);
}

function toMessage(m: Row): ChatMessage {
  return {
    id: m.id as string,
    conversationId: m.conversation_id as string,
    senderId: m.sender_id as string,
    body: m.body as string,
    createdAt: m.created_at as string,
  };
}

// Calls back with each new message in the conversation as it arrives.
export function watchMessages(conversationId: string, onMessage: (message: ChatMessage) => void) {
  const channel = db()
    .channel(`chat-${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => onMessage(toMessage(payload.new as Row)),
    )
    .subscribe();
  return () => {
    void db().removeChannel(channel);
  };
}

export function sendMessage(tableId: string, guestId: string, body: string) {
  return rpc<string>("send_message", { p_table_id: tableId, p_guest_id: guestId, p_body: body });
}

export async function markConversationRead(conversationId: string) {
  const { error } = await db().rpc("mark_conversation_read", { p_conversation_id: conversationId });
  if (error) console.error("[chat]", error);
  else await refresh();
}

// ---------------------------------------------------------------- saved

export function isSaved(s: AppState, tableId: string) {
  return s.saved.some((x) => x.userId === s.currentUserId && x.tableId === tableId);
}

export function mySavedTables(s: AppState) {
  return s.saved
    .filter((x) => x.userId === s.currentUserId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .flatMap((x) => s.tables.find((t) => t.id === x.tableId) ?? []);
}

export async function toggleSaved(tableId: string): Promise<Result<boolean>> {
  const me = currentUser(state);
  if (!me) return fail("Log in to save tables.");
  const saved = isSaved(state, tableId);
  const table = db().from("saved_tables");
  const { error } = saved
    ? await table.delete().eq("user_id", me.id).eq("table_id", tableId)
    : await table.insert({ user_id: me.id, table_id: tableId });
  if (error) return fail(friendly(error));
  await refresh();
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
