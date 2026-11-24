# Mehman demo

A 10-minute click-through of the booking flow on a phone-sized screen
(375 px). Everything runs on the separate demo Supabase project, never
production.

## Before the demo (once)

1. Create a **separate** demo Supabase project (Mumbai region; never the
   live project in `.env.local`) and copy
   `.env.demo.example` to `.env.demo.local`. Fill in the URL, publishable
   key, secret key, database URL and a `DEMO_PASSWORD`.
2. Apply the migrations and seed:

   ```bash
   npm run db:push:demo
   npm run seed:demo
   ```

3. In the demo project, under **Database → Extensions**, check that
   `pg_cron` is on and that **Integrations → Cron** lists
   `mehman-booking-timers` (every 5 minutes). If the migration couldn't
   create it, run in the SQL editor:

   ```sql
   create extension if not exists pg_cron with schema pg_catalog;
   select cron.schedule('mehman-booking-timers', '*/5 * * * *', 'select public.run_booking_timers()');
   ```

4. Deploy the preview with `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (both from the demo project) and
   `NEXT_PUBLIC_DEMO_LOGIN=on`. In the demo project's **Authentication → URL
   configuration**, add the preview URL to the redirect URLs.

## On the day

Run `npm run seed:demo` within an hour of the demo. It resets every demo
row, so the waiting request doesn't expire (requests expire after 6 hours)
and the "last night" meal is still inside its 24-hour no-show window.

Open three browser profiles side by side, each at 375 px wide, and sign in
from the login page's **Demo account** box with the shared demo password:

| Who | Email | Lands on |
| --- | --- | --- |
| Guest (Priya) | `guest@demo.mehman.test` | Explore |
| Host (Farhana, Hyderabad) | `host@demo.mehman.test` | Hosting |
| Mehman team | `team@demo.mehman.test` | Team console |

## Script (10 minutes)

### 1. Find a Hyderabadi meal (1 min) · guest

1. Explore shows six cities. Point out that Kochi, Lucknow, Jaipur and
   Kolkata say **Coming soon**; only Bengaluru and Hyderabad take bookings.
2. Open **Hyderabad**. Tap the **Halal** diet filter and **Up to ₹2,000**.
   Pick a date with the date filter to show slots narrowing, then clear it.
3. Open **Kacchi biryani Sunday dastarkhwan** (Farhana's Dastarkhwan).
   Scroll: diet tags, the menu, **The home** (floor, parking, pets, seating,
   house rules, home photos kept apart from the meal photos), and reviews.

### 2. Request (1 min) · guest

1. Choose the lunch slot **two days from today at 1 pm** (step 7 relies on
   it). Each slot shows its length (2 or 3 hours); slots starting within
   the hour aren't offered.
2. Two guests, a note ("Mild spice please"), **Request a seat**.
3. The confirmation says Farhana has 6 hours to reply and that a ₹500
   deposit confirms the seat. **My bookings** shows "Waiting for host" with
   the countdown.

### 3. Host accepts (1 min) · host

1. Farhana's **Today** shows the waiting request. Open **Requests**.
2. Priya appears by first name with her track record ("★ 5.0 from 1 host"),
   and no phone or email: contact details load only after accepting.
3. Tap **Accept**. Priya's phone and email now show on the card, with
   "Waiting for Priya to pay the ₹500 deposit".

### 4. Guest pays by UPI (1 min) · guest

1. Refresh **My bookings**: **Pay deposit**. The card shows the ₹500
   deposit, Farhana's UPI ID, a **Pay with UPI** button (opens any UPI app
   on a phone), a QR code of the same link, and the 12-hour deadline.
2. Show the total, the deposit and the balance due at the meal.
3. Tap **I've paid**. Status: "Deposit sent". The address is still hidden.

### 5. Host confirms (30 s) · host

1. Today shows "1 deposit to check". On the request, tap **Deposit
   received**. (Mention **Not received** sends it to the team instead.)
2. The guest's card now shows the address, Call host and Directions, and
   "The Mehman team will add you to a WhatsApp group shortly".

### 6. Team creates the WhatsApp group (1 min) · team

1. Team console → **Bookings**. **WhatsApp groups to create** lists the
   booking with a suggested group name (meal and date), both numbers as
   wa.me links, and **Copy name**.
2. Tap **Group created**. Both the guest's and the host's cards now say
   **Check WhatsApp for your group**, and the in-app chat for this booking
   closes.

### 7. Timers complete the meal (1 min) · team

1. In **Booking timers**, explain they run every 5 minutes on their own.
2. Pick **3 days later** (demo mode only) and **Run timers now**. The result
   line counts what moved, including "1 completed" for Priya's meal.
   (Skipping ahead also expires or cancels other demo bookings whose
   deadlines fall in that window; that's the timers working. Run the demo
   before 9:30 pm so Divya's booking in step 9 is still upcoming.)

### 8. Both leave reviews (1 min) · guest and host

1. Guest: **My bookings → Past**: the meal is **Hosted**, with the money
   summary. Rate it 5 stars with a note.
2. Host: **Requests → After the meal**: **Rate guest** (stars and a note).
   Point out that other hosts and the team see guest ratings, the guest
   doesn't.

### 9. A host cancellation (1 min) · team, then guest

1. Hosts have no cancel button; the card says to call the team.
2. Team console → **All bookings → Confirmed**: open Divya's Palakkad
   sadya booking. Set status **Host cancelled**, add a note ("Anjali's
   mother is unwell; refund by UPI tonight"), **Save**. The deposit moves to
   **Refund due** automatically and the note appears in the history.
3. (Optional) The guest view of a host cancellation: the guest can rate the
   host and tap **I got my refund**.

### 10. A no-show (30 s) · host

1. Farhana's **Requests → After the meal** shows Karan's meal from last
   night. Tap **Mark no-show** (allowed until 24 hours after the slot).
2. The deposit is marked **kept by host**, and the no-show count now shows
   to hosts and the team on Karan's requests.

### Also worth showing if there's time

- **Install**: on Android Chrome the install banner appears; on iPhone
  Safari, Share → Add to Home Screen steps. Turn on airplane mode and
  reload to show the offline page.
- **Team review**: Kavitha's Chettinad application (Bengaluru) with venue,
  UPI and a private kitchen photo only the team can open. **Approve and
  publish**; it appears on the Bengaluru page.

## Next

Out of scope for the demo, in rough order:

- **WhatsApp Business API alerts**: new request, accepted, deposit
  reminder, confirmed, day-before reminder, from an official number
  (Supabase Edge Function on new notifications, approved templates).
- **WhatsApp / phone sign-in codes** alongside Google and email.
- **Automatic WhatsApp groups** through the Groups API once Mehman is a
  verified business (phase 3).
- **Move hosting to DigitalOcean** and update Supabase redirect URLs.
- **A real domain and Resend** for sign-in email instead of a personal
  Gmail.
- **Link previews**: meal pages rendered on the server with their own name
  and photo.
- **CI**: lint, type checks and `npm run test:db` on every push; a real
  README.
- **Lighter data loading**: only upcoming dates in the chosen city.
- **Next.js security upgrade**: `next build` reports a known advisory for
  16.4.3; upgrade in its own PR.
