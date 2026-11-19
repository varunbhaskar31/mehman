# Decisions for the demo MVP

Choices made while building the demo that the feature plan didn't spell
out. The plan's "Assumptions to confirm" defaults are treated as decided.

## Booking states and data

- **Old states.** `accepted` and `cancelled` stay in the enum (Postgres
  can't drop enum values), but a migration moves existing rows: `accepted`
  becomes `confirmed` (those guests already had the address) and
  `cancelled` becomes `guest_cancelled`. Old bookings get a ₹0 deposit so
  their money summary shows "pay at the meal".
- **Deposit amount.** ₹500 per booking, or the meal's total if that's less
  (a ₹100 meal for one can't take a ₹500 deposit). Stored on the booking.
- **Deposit status is its own field** (`none`, `claimed`, `received`,
  `refund_due`, `refunded`, `kept`), separate from the booking status, so a
  cancelled booking can still say whether money is owed back.
- **Seats held** by `requested`, `awaiting_deposit`, `deposit_claimed`,
  `confirmed` and `in_review`. A booking in team review keeps its seats
  until the team settles it.
- **Phone number at request time.** The WhatsApp group needs the guest's
  number, so the request form asks for it if the profile has none, and the
  database refuses a request without one. Hosts see it only after
  accepting.
- **UPI ID required to accept.** A host without a UPI ID can't accept (the
  guest would have nowhere to pay). The application form asks for it; old
  hosts are prompted on their requests and on My table.
- **UPI ID format** is checked loosely (`name@handle`) in the database.

## Timers

- One function, `run_booking_timers()`, does everything; pg_cron calls it
  every 5 minutes and the team can call it from the console. Deadlines are
  computed from timestamps (`created_at`, `accepted_at`, the slot's start
  and length) rather than stored, so changing a rule needs one function.
- **A claimed deposit the host never confirms** moves to `in_review` once
  the slot has ended, so it doesn't sit forever.
- **"Run as if it were later".** To show completion in a 10-minute demo,
  the team can run the timers with a clock up to a week ahead. This only
  works when `app_settings.demo_mode` is on, which only the service key can
  set; the seed script turns it on for the demo project. Production keeps
  it off. Skipped-ahead runs move bookings for real.
- Only the team or trusted server code (pg_cron, the secret key) can run
  the timers; visitors can't execute the function at all.

## Cancellations, no-shows and reviews

- **The 24-hour line** is measured from the slot's start time at the moment
  the guest cancels.
- **Host cancellation** is an admin action. When the team sets
  `host_cancelled`, the deposit becomes `refund_due` (if one was paid)
  unless they choose otherwise. The guest can then review, and the review
  appears on the table's public reviews.
- **Refunds** are confirmed by the guest ("I got my refund"); the team can
  also record them. Bookings with a refund due show under "Needs attention"
  in the team console.
- **No-shows** can be marked from the slot's start until 24 hours after it
  ends, on confirmed or completed bookings (the timer may already have
  completed it). Hosts can't complete a meal by hand any more; the timer
  does it.
- **Guest reviews** (host rates guest) are visible to the team and to any
  approved host, and not to the guest. Requests show the guest's average
  and no-show count.

## Privacy

- Before accepting, hosts get a guest's first name and track record from
  `booking_guests()`; the profile row (phone, email) is readable only
  after acceptance.
- The address and host phone are released at `confirmed` (and stay
  visible after the meal), not at acceptance.

## WhatsApp

- The suggested group name is the meal title (cut to 40 characters) and the
  date, like "Kacchi biryani Sunday dastarkhwan · 23 Nov".
- The numbers in the queue are wa.me links so the team can open each chat.
- Once a group is marked created, the in-app chat for that table and guest
  closes (a database trigger refuses new messages).

## Listings and discovery

- **Venue details and home photos live on the host**, not the table: they
  describe the home, which stays the same across meals.
- **Diet tags** live on the table, alongside the old veg/non-veg field
  (kept for older code). Existing tables get tags from that field.
- **Launch cities** are a database flag (`cities.accepting`) and a matching
  `open` flag in `data/experiences.ts`. Closed cities keep their pages but
  show "Coming soon" and links to the open cities.
- **Filters** (date, price, diet) are on-page state, not in the URL, to keep
  the change small. Several diet tags mean "all of these".
- **Verification files** go to a private `host-verification` bucket under
  the host's own folder; the team opens them with five-minute signed links.
  Hosts upload them from My table after applying (the host record has to
  exist first).
- **Upload checks**: both buckets now have a 5 MB limit and an image-only
  type list (PDF also allowed for verification), enforced by Supabase
  Storage on the server.

## PWA

- Icons are drawn from the gold doorway mark on the app's dark background
  (`npm run icons` regenerates them).
- The service worker uses network-first for pages (bookings must never be
  stale), cache-first for hashed static files, and stale-while-revalidate
  for resized photos. It never caches Supabase data.
- The install banner is dismissed for good once closed (per browser).

## Demo setup

- **Demo logins use email and password**, shown only when
  `NEXT_PUBLIC_DEMO_LOGIN=on`, so the presenter never waits for a code.
- Demo emails use the reserved `.test` domain, so nothing is ever sent.
- The seed uses Mehman's own artwork as placeholder home photos; real
  hosts upload their rooms.
- Local Supabase needs Docker, which this machine doesn't have, so
  development used the in-memory database tests and the demo project.
