// The shapes the app works with. They mirror the Supabase schema in
// supabase/migrations, so swapping the demo store for the database later
// changes where data comes from, not what the screens expect.

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

export type DemoState = {
  version: 4;
  currentUserId: string | null;
  profiles: Profile[];
  hosts: Host[];
  tables: DiningTable[];
  sessions: DiningSession[];
  bookings: Booking[];
  reviews: Review[];
  notifications: AppNotification[];
  saved: SavedTable[];
};
