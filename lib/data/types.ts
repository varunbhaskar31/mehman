// The shapes the app works with, mapped from the Supabase schema in
// supabase/migrations by lib/data/store.ts.

export type Role = "guest" | "host" | "admin";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type TableStatus = "draft" | "pending" | "approved" | "paused" | "rejected";
export type VegType = "veg" | "non_veg" | "both";
// The deposit flow: requested -> awaiting_deposit -> deposit_claimed ->
// confirmed -> completed, with early exits. "accepted" and "cancelled" are
// only on bookings made before the deposit step.
export type BookingStatus =
  | "requested"
  | "awaiting_deposit"
  | "deposit_claimed"
  | "confirmed"
  | "completed"
  | "declined"
  | "expired"
  | "cancelled_unpaid"
  | "in_review"
  | "host_cancelled"
  | "guest_cancelled"
  | "no_show"
  | "accepted"
  | "cancelled";

// Where the ₹500 deposit stands. Mehman never holds it; this records what
// guest and host said happened.
export type DepositStatus = "none" | "claimed" | "received" | "refund_due" | "refunded" | "kept";

export const DIET_TAGS = ["veg", "non_veg", "jain", "vegan", "halal", "gluten_free"] as const;
export type DietTag = (typeof DIET_TAGS)[number];
export const dietLabel: Record<DietTag, string> = {
  veg: "Veg",
  non_veg: "Non-veg",
  jain: "Jain",
  vegan: "Vegan",
  halal: "Halal",
  gluten_free: "Gluten-free",
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  createdAt: string;
};

export type Host = {
  id: string;
  userId: string;
  cityId: string;
  displayName: string;
  bio: string;
  languages: string[];
  // Private: shown to a guest only once their booking is accepted.
  address: string;
  // Public: the neighbourhood and a rough centre point for the map. Never
  // the exact house; that stays in address.
  locality?: string;
  area?: { lat: number; lng: number };
  contactPhone: string;
  // Private: the host and the team only. Guests get it through
  // booking_payment() once accepted.
  upiId: string;
  // The home, public.
  venueFloor: string;
  venueParking: string;
  venuePets: string;
  venueSeating: string;
  houseRules: string;
  homePhotos: string[];
  status: ReviewStatus;
  reviewNote: string | null;
  createdAt: string;
};

export type DiningTable = {
  id: string;
  hostId: string;
  title: string;
  story: string;
  menu: string;
  cuisine: string;
  veg: VegType;
  pricePerGuest: number;
  maxGuests: number;
  photos: string[];
  dietTags: DietTag[];
  status: TableStatus;
  reviewNote: string | null;
  createdAt: string;
};

export type DiningSession = {
  id: string;
  tableId: string;
  startsAt: string;
  seatsTotal: number;
  // Each slot lasts 2 or 3 hours; requests close 1 hour before the start.
  durationMinutes: number;
  // Seats held by requested and accepted bookings, counted by the
  // database since guests can't see each other's bookings.
  seatsTaken: number;
};

export type Booking = {
  id: string;
  sessionId: string;
  guestId: string;
  partySize: number;
  // The price when the seat was requested; later price changes don't
  // affect it.
  pricePerGuest: number;
  note: string;
  status: BookingStatus;
  depositInr: number;
  depositStatus: DepositStatus;
  acceptedAt: string | null;
  depositClaimedAt: string | null;
  confirmedAt: string | null;
  whatsappGroupAt: string | null;
  createdAt: string;
};

// What a host sees about a guest on a request before accepting: first
// name and track record, no contact details.
export type GuestSummary = {
  bookingId: string;
  guestId: string;
  firstName: string;
  rating: number | null;
  ratings: number;
  noShows: number;
};

export type GuestReview = {
  id: string;
  bookingId: string;
  guestId: string;
  hostId: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type Review = {
  id: string;
  bookingId: string;
  tableId: string;
  guestId: string;
  rating: number;
  text: string;
  hostReply: string | null;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

export type SavedTable = {
  userId: string;
  tableId: string;
  savedAt: string;
};

// Everything the signed-in visitor is allowed to see.
// A chat between a guest and a host about one table, as one side sees it.
export type Conversation = {
  id: string;
  tableId: string;
  guestId: string;
  asHost: boolean;
  otherName: string;
  tableTitle: string;
  lastBody: string;
  lastSenderId: string | null;
  lastMessageAt: string;
  unread: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type AppState = {
  currentUserId: string | null;
  profiles: Profile[];
  hosts: Host[];
  tables: DiningTable[];
  sessions: DiningSession[];
  bookings: Booking[];
  reviews: Review[];
  notifications: AppNotification[];
  saved: SavedTable[];
  conversations: Conversation[];
  guestSummaries: GuestSummary[];
  guestReviews: GuestReview[];
  demoMode: boolean;
};
