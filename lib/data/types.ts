// The shapes the app works with, mapped from the Supabase schema in
// supabase/migrations by lib/data/store.ts.

export type Role = "guest" | "host" | "admin";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type TableStatus = "draft" | "pending" | "approved" | "paused" | "rejected";
export type VegType = "veg" | "non_veg" | "both";
export type BookingStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed"
  | "no_show";

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
  status: TableStatus;
  reviewNote: string | null;
  createdAt: string;
};

export type DiningSession = {
  id: string;
  tableId: string;
  startsAt: string;
  seatsTotal: number;
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
};
