import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";

// Runs the migrations in an in-memory Postgres with small stand-ins for
// Supabase's auth and storage schemas, then checks who can do what.
// Run with: npm run test:db
const db = new PGlite();
const stub = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text, phone text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
grant usage on schema public, auth, storage to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
grant all on storage.objects to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
`;
await db.exec(stub);
const migrations = new URL("../migrations/", import.meta.url);
for (const file of readdirSync(migrations).filter((f) => f.endsWith(".sql")).sort()) {
  await db.exec(readFileSync(new URL(file, migrations), "utf8"));
}
console.log("migrations ok");

const A = "00000000-0000-0000-0000-00000000000a"; // host
const B = "00000000-0000-0000-0000-00000000000b"; // guest
const C = "00000000-0000-0000-0000-00000000000c"; // other guest
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
for (const [id, name] of [[A,"Asha"],[B,"Bilal"],[C,"Chitra"],[ADMIN,"Admin"]])
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, name+"@x.in", { full_name: name }]);
await db.exec(`update public.profiles set role='admin' where id='${ADMIN}'`);

let pass = 0, fail = 0;
async function as(uid, sql, params = []) {
  await db.exec(`reset role; select set_config('test.uid', '${uid ?? ""}', false);`);
  await db.exec(uid ? "set role authenticated" : "set role anon");
  try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
}
async function expectOk(label, fn) { try { const r = await fn(); pass++; return r; } catch (e) { fail++; console.log("FAIL (should work):", label, "-", e.message); } }
async function expectErr(label, fn) { try { await fn(); fail++; console.log("FAIL (should be blocked):", label); } catch { pass++; } }
async function expectRows(label, n, fn) { const r = await fn(); if (r.rows.length === n) pass++; else { fail++; console.log(`FAIL ${label}: got ${r.rows.length} rows, want ${n}`); } }

await expectRows("profile created by trigger", 1, () => as(A, "select * from profiles where full_name='Asha'"));
await expectErr("guest can't make self admin", () => as(B, `update profiles set role='admin' where id='${B}'`));
await expectOk("edit own name", () => as(B, `update profiles set full_name='Bilal K' where id='${B}'`));
await expectRows("can't see other profiles", 0, () => as(B, `select * from profiles where id='${A}'`));

const host = (await expectOk("apply as host", () => as(A, `insert into hosts (user_id, city_id, display_name, bio) values ('${A}','hyderabad','Asha','We cook') returning id`))).rows[0].id;
await expectErr("can't apply pre-approved", () => as(C, `insert into hosts (user_id, city_id, display_name, bio, status) values ('${C}','jaipur','C','x','approved')`));
await expectErr("host can't approve self", () => as(A, `update hosts set status='approved' where id='${host}'`));
await expectOk("host private details", () => as(A, `insert into host_private values ('${host}', '12 MI Road', '9999999999')`));
await expectRows("guest can't read address", 0, () => as(B, "select * from host_private"));
await expectRows("anon can't see pending host", 0, () => as(null, "select * from hosts"));

const table = (await expectOk("create draft table", () => as(A, `insert into tables (host_id,title,story,menu,cuisine,veg,price_per_guest_inr,max_guests) values ('${host}','Thali','s','m','Rajasthani','veg',800,6) returning id`))).rows[0].id;
await expectErr("host can't approve own table", () => as(A, `update tables set status='approved' where id='${table}'`));
await expectOk("submit for review", () => as(A, `update tables set status='pending' where id='${table}'`));
await expectRows("anon can't see pending table", 0, () => as(null, "select * from tables"));
await expectOk("add date", () => as(A, `select add_sessions('${table}', array[now() + interval '7 days'], 4)`));
const sess = (await as(A, "select id from sessions")).rows[0].id;
await expectErr("other user can't add date to table", () => as(C, `select add_sessions('${table}', array[now() + interval '8 days'], 4)`));
await expectErr("can't insert dates directly", () => as(A, `insert into sessions (table_id, starts_at, seats_total) values ('${table}', now() + interval '8 days', 4)`));
await expectErr("seats capped at table size", () => as(A, `select add_sessions('${table}', array[now() + interval '8 days'], 9)`));
await expectErr("no dates in the past", () => as(A, `select add_sessions('${table}', array[now() - interval '1 day'], 2)`));
await expectErr("can't book unapproved table", () => as(B, `select request_booking('${sess}', 2, 'hi')`));

// Admin approves (server uses the service key, which bypasses RLS).
await db.exec(`update hosts set status='approved' where id='${host}'; update tables set status='approved' where id='${table}';`);
await expectRows("anon sees approved table", 1, () => as(null, "select * from tables"));
await expectRows("anon sees its dates", 1, () => as(null, "select * from sessions"));
await expectRows("slots default to 3 hours", 1, () => as(null, "select * from sessions where duration_minutes = 180"));
await expectRows("anon can't see bookings", 0, () => as(null, "select * from bookings"));
await expectErr("host can't book own table", () => as(A, `select request_booking('${sess}', 1, '', '9876543210')`));
await expectErr("a WhatsApp number is needed", () => as(B, `select request_booking('${sess}', 3, 'veg please')`));
await expectErr("phone must look right", () => as(B, `select request_booking('${sess}', 3, 'veg please', '12ab')`));
const bk = (await expectOk("guest requests 3 seats", () => as(B, `select request_booking('${sess}', 3, 'veg please', '+91 98765 43210') as id`))).rows[0].id;
await expectRows("phone saved on profile", 1, () => as(B, `select * from profiles where id='${B}' and phone='+919876543210'`));
await expectRows("deposit is ₹500", 1, () => as(B, `select * from bookings where id='${bk}' and deposit_inr=500 and deposit_status='none'`));
await db.exec(`update profiles set phone='9876500000' where id='${C}'`);
await expectErr("overbooking blocked", () => as(C, `select request_booking('${sess}', 2, '')`));
await expectErr("guest can't insert booking directly", () => as(C, `insert into bookings (session_id, guest_id, party_size) values ('${sess}','${C}',1)`));
await expectRows("other guest can't see booking", 0, () => as(C, "select * from bookings"));
await expectRows("host sees request", 1, () => as(A, "select * from bookings"));
await expectRows("host can't load guest contact before accepting", 0, () => as(A, `select * from profiles where id='${B}'`));
await expectRows("host sees guest first name", 1, () => as(A, `select * from booking_guests(array['${bk}']::uuid[]) where first_name='Bilal'`));
await expectRows("others can't use booking_guests", 0, () => as(C, `select * from booking_guests(array['${bk}']::uuid[])`));
await expectRows("no address before acceptance", 0, () => as(B, `select * from booking_contact('${bk}')`));
await expectErr("guest can't accept own booking", () => as(B, `select set_booking_status('${bk}','awaiting_deposit')`));
await expectErr("guest can't edit booking directly", () => as(B, `update bookings set status='confirmed' where id='${bk}' returning id`).then(r => { if (!r.rows.length) throw new Error("no rows"); }));
await expectErr("old 'accepted' status is gone", () => as(A, `select set_booking_status('${bk}','accepted')`));
await expectErr("host needs a UPI ID to accept", () => as(A, `select set_booking_status('${bk}','awaiting_deposit')`));
await expectErr("UPI ID must look right", () => as(A, `update host_private set upi_id='not a upi' where host_id='${host}'`));
await expectOk("host adds UPI ID", () => as(A, `update host_private set upi_id='asha.k@okicici' where host_id='${host}'`));
await expectRows("no payment details before acceptance", 0, () => as(B, `select * from booking_payment('${bk}')`));
await expectOk("host accepts", () => as(A, `select set_booking_status('${bk}','awaiting_deposit')`));
await expectRows("host loads guest contact after accepting", 1, () => as(A, `select * from profiles where id='${B}' and phone is not null`));
await expectRows("guest sees UPI ID and amount", 1, () => as(B, `select * from booking_payment('${bk}') where upi_id='asha.k@okicici' and amount_inr=500`));
await expectRows("others can't see the UPI ID", 0, () => as(C, `select * from booking_payment('${bk}')`));
await expectRows("guest can't read host_private for UPI", 0, () => as(B, "select * from host_private"));
await expectRows("no address while deposit unpaid", 0, () => as(B, `select * from booking_contact('${bk}')`));
await expectErr("host can't confirm before guest pays", () => as(A, `select set_booking_status('${bk}','confirmed')`));
await expectErr("host can't claim the deposit for the guest", () => as(A, `select set_booking_status('${bk}','deposit_claimed')`));
await expectOk("guest says they've paid", () => as(B, `select set_booking_status('${bk}','deposit_claimed')`));
await expectRows("host told the guest paid", 1, () => as(A, "select * from notifications where title like '%paid the deposit%'"));
await expectErr("guest can't confirm own deposit", () => as(B, `select set_booking_status('${bk}','confirmed')`));
await expectOk("host: deposit received", () => as(A, `select set_booking_status('${bk}','confirmed')`));
await expectRows("deposit marked received", 1, () => as(B, `select * from bookings where id='${bk}' and status='confirmed' and deposit_status='received'`));
await expectRows("guest sees address once confirmed", 1, () => as(B, `select * from booking_contact('${bk}')`));
await expectRows("UPI no longer offered once confirmed", 0, () => as(B, `select * from booking_payment('${bk}')`));
await expectRows("other user can't use booking_contact", 0, () => as(C, `select * from booking_contact('${bk}')`));
await expectRows("team told to create a group", 1, () => as(ADMIN, "select * from notifications where title='WhatsApp group to create'"));
await expectErr("host can't cancel", () => as(A, `select set_booking_status('${bk}','host_cancelled')`));
await expectErr("host can't use the old cancel", () => as(A, `select set_booking_status('${bk}','cancelled')`));
await expectOk("guest cancels more than 24h before", () => as(B, `select set_booking_status('${bk}','guest_cancelled')`));
await expectRows("early cancel: deposit back", 1, () => as(B, `select * from bookings where id='${bk}' and deposit_status='refund_due'`));
await expectErr("other guest can't confirm a refund", () => as(C, `select confirm_refund('${bk}')`));
await expectOk("guest confirms refund", () => as(B, `select confirm_refund('${bk}')`));
await expectRows("refund recorded", 1, () => as(B, `select * from bookings where id='${bk}' and deposit_status='refunded'`));
await expectRows("cancelled guest sees no address", 0, () => as(B, `select * from booking_contact('${bk}')`));
const bkC = (await expectOk("seat freed after cancel", () => as(C, `select request_booking('${sess}', 4, '') as id`))).rows[0].id;
await expectErr("same guest can't ask twice", () => as(C, `select request_booking('${sess}', 1, '')`));
await expectRows("host told about requests", 2, () => as(A, "select * from notifications where href='/host/requests' and title like 'New request%'"));
await expectRows("guest told about acceptance", 1, () => as(B, "select * from notifications where title like '%accepted%'"));
await expectRows("can't read others' notifications", 0, () => as(C, `select * from notifications where user_id='${A}'`));
await expectErr("can't write notifications", () => as(C, `select notify('${A}', 'spam', '', '/')`));
await expectRows("price kept on booking", 1, () => as(C, "select * from bookings where price_per_guest_inr = 800"));
await expectRows("seat counts for anyone", 1, () => as(null, `select * from seats_taken(array['${sess}']::uuid[]) where taken = 4`));
await expectErr("can't remove a date with guests", () => as(A, `select remove_session('${sess}')`));
await expectErr("can't delete dates directly", () => as(A, `delete from sessions where id='${sess}' returning id`).then(r => { if (!r.rows.length) throw new Error("no rows"); }));
await expectOk("host accepts C", () => as(A, `select set_booking_status('${bkC}','awaiting_deposit')`));
await expectOk("C pays", () => as(C, `select set_booking_status('${bkC}','deposit_claimed')`));
await expectOk("host confirms C", () => as(A, `select set_booking_status('${bkC}','confirmed')`));
await expectErr("host can't complete by hand", () => as(A, `select set_booking_status('${bkC}','completed')`));
await expectErr("no-show only after the slot starts", () => as(A, `select set_booking_status('${bkC}','no_show')`));
await expectErr("guests can't run timers", () => as(C, "select * from run_booking_timers()"));
await expectErr("anon can't run timers", () => as(null, "select * from run_booking_timers()"));
await expectErr("no skipping ahead outside demo mode", () => as(ADMIN, "select * from run_booking_timers(24)"));
await expectRows("timers leave a future meal alone", 1, () => as(ADMIN, "select * from run_booking_timers() where completed = 0"));
await db.exec(`update sessions set starts_at = now() - interval '1 hour' where id='${sess}'`);
await expectErr("guest can't cancel after it started", () => as(C, `select set_booking_status('${bkC}','guest_cancelled')`));
await expectErr("can't review before completion", () => as(C, `select add_review('${bkC}', 5, 'lovely')`));
await expectRows("meal still running", 1, () => as(ADMIN, "select * from run_booking_timers() where completed = 0"));
await db.exec(`update sessions set starts_at = now() - interval '3 hours 1 minute' where id='${sess}'`);
await expectRows("team runs timers: meal completes when the slot ends", 1, () => as(ADMIN, "select * from run_booking_timers() where completed = 1"));
await expectRows("booking completed", 1, () => as(C, `select * from bookings where id='${bkC}' and status='completed'`));
await expectRows("both sides asked to review", 2, () => db.query(`select * from notifications where title in ('Rate your guest', 'How was Thali?')`));
await expectErr("other guest can't review", () => as(B, `select add_review('${bkC}', 1, 'bad')`));
await expectOk("guest reviews", () => as(C, `select add_review('${bkC}', 5, 'Best laal maas')`));
await expectErr("only one review", () => as(C, `select add_review('${bkC}', 4, 'again')`));
await expectRows("anyone reads reviews", 1, () => as(null, "select * from reviews"));
await expectRows("reviewer first name", 1, () => as(null, `select * from reviewer_names(array['${C}']::uuid[]) where first_name='Chitra'`));
await expectRows("non-reviewer name hidden", 0, () => as(null, `select * from reviewer_names(array['${B}']::uuid[])`));
const rv = (await as(null, "select id from reviews")).rows[0].id;
await expectErr("guest can't reply as host", () => as(C, `select reply_to_review('${rv}', 'thanks')`));
await expectOk("host replies", () => as(A, `select reply_to_review('${rv}', 'Come again!')`));
await expectOk("mark notifications read", () => as(A, "select mark_notifications_read()"));
await expectRows("all read", 0, () => as(A, "select * from notifications where not read"));
await expectOk("save a table", () => as(B, `insert into saved_tables (user_id, table_id) values ('${B}', '${table}')`));
await expectErr("can't save for someone else", () => as(B, `insert into saved_tables (user_id, table_id) values ('${C}', '${table}')`));
await expectRows("saved is private", 0, () => as(C, "select * from saved_tables"));
await expectOk("host pauses approved table", () => as(A, `update tables set status='paused' where id='${table}'`));
await expectRows("guest still sees a paused table they booked", 1, () => as(C, "select * from tables"));
await expectRows("guest still sees the address after the meal", 1, () => as(C, "select * from host_private"));
await expectRows("cancelled guest doesn't see the address", 0, () => as(B, "select * from host_private"));
await expectRows("anon doesn't see paused table", 0, () => as(null, "select * from tables"));
await expectOk("upload own photo", () => as(A, `insert into storage.objects (bucket_id, name) values ('table-photos', '${A}/1.jpg')`));
await expectErr("upload to other's folder", () => as(C, `insert into storage.objects (bucket_id, name) values ('table-photos', '${A}/2.jpg')`));
// Second host: applies in one go, and only the team can approve.
const D = "00000000-0000-0000-0000-00000000000d";
await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'd@x.in', '{"full_name":"Devi"}')`, [D]);
await expectRows("email kept on profile", 1, () => as(D, "select * from profiles where email='d@x.in'"));
const apply = (uid, h, t, d) => as(uid, "select apply_as_host($1, $2, $3) as id", [h, t, d]);
const devHost = { city_id: "bengaluru", display_name: "Devi's table", bio: "Fish", languages: ["Malayalam"], address: "1 MG Road", contact_phone: "+919999999999", locality: "Indiranagar", upi_id: "devi@oksbi", venue_floor: "2nd floor, lift", house_rules: "Shoes off" };
const devTable = { title: "Sadya", story: "s", menu: "m", cuisine: "Kerala", veg: "veg", price_per_guest_inr: 900, max_guests: 6, photo_paths: ["https://x/1.jpg"] };
const future = new Date(Date.now() + 9 * 864e5).toISOString();
await expectErr("dates must fit the table", () => apply(D, devHost, devTable, [{ starts_at: future, seats: 7 }]));
await expectErr("only launch cities take hosts", () => apply(D, { ...devHost, city_id: "kochi" }, devTable, []));
await expectErr("slots are 2 or 3 hours", () => apply(D, devHost, devTable, [{ starts_at: future, seats: 6, duration_minutes: 90 }]));
await expectErr("unknown diet tag", () => apply(D, devHost, { ...devTable, diet_tags: ["paleo"] }, []));
devTable.diet_tags = ["veg", "jain"];
const dHost = (await expectOk("apply as host in one go", () => apply(D, devHost, devTable, [{ starts_at: future, seats: 6 }]))).rows[0].id;
await expectErr("can't apply twice", () => apply(D, devHost, devTable, []));
await expectRows("team told about application", 1, () => as(ADMIN, "select * from notifications where title='New host application'"));
await expectErr("host can't approve self via rpc", () => as(D, `select review_host('${dHost}', true, '')`));
await expectOk("team approves", () => as(ADMIN, `select review_host('${dHost}', true, '')`));
await expectRows("approved host is a host", 1, () => as(D, `select * from profiles where id='${D}' and role='host'`));
await expectRows("table live", 1, () => as(null, `select * from tables where title='Sadya' and status='approved'`));
const dTable = (await as(D, "select id from tables")).rows[0].id;
await expectRows("wording edit stays live", 1, () => as(D, "select update_table($1, $2) as r", [dTable, { ...devTable, story: "new" }]).then(r => ({ rows: r.rows.filter(x => x.r === false) })));
await expectRows("price edit goes to review", 1, () => as(D, "select update_table($1, $2) as r", [dTable, { ...devTable, price_per_guest_inr: 1200 }]).then(r => ({ rows: r.rows.filter(x => x.r === true) })));
await expectErr("others can't edit", () => as(C, "select update_table($1, $2)", [dTable, devTable]));
await expectOk("team approves changes", () => as(ADMIN, `select review_table_changes('${dTable}', true, '')`));
await expectOk("team pauses table", () => as(ADMIN, `select admin_set_table_paused('${dTable}', true)`));
await expectErr("guest can't pause tables", () => as(C, `select admin_set_table_paused('${dTable}', false)`));
// Hosts pin a rough area; it's moved off the exact spot and kept in the city.
await expectErr("guest can't set an area", () => as(C, "select set_my_area(9.99, 76.29)"));
await expectErr("area must be in the host's city", () => as(D, "select set_my_area(26.91, 75.79)"));
await expectOk("host sets area", () => as(D, "select set_my_area(12.97, 77.6)"));
await expectRows("area is moved 250-500 m", 1, () => as(D, `select * from hosts where user_id='${D}'
  and sqrt(power((area_lat - 12.97) * 111320, 2) + power((area_lng - 77.6) * 111320 * cos(radians(12.97)), 2)) between 240 and 510`));
await expectErr("can't write area directly", () => as(D, `update hosts set area_lat = 10 where user_id='${D}' returning id`).then(r => { if (!r.rows.length) throw new Error("no rows"); }));

// Chat: guests message about a table; hosts reply.
await expectOk("team relaunches Sadya", () => as(ADMIN, `select admin_set_table_paused('${dTable}', false)`));
await expectErr("anon can't message", () => as(null, `select send_message('${dTable}', '${B}', 'hi')`));
await expectErr("can't message as someone else", () => as(C, `select send_message('${dTable}', '${B}', 'hi')`));
await expectErr("host can't message own table as a guest", () => as(D, `select send_message('${dTable}', '${D}', 'hi')`));
await expectErr("empty message", () => as(B, `select send_message('${dTable}', '${B}', '   ')`));
await expectErr("host can't start a chat with a stranger", () => as(D, `select send_message('${dTable}', '${C}', 'hello')`));
const conv = (await expectOk("guest messages host", () => as(B, `select send_message('${dTable}', '${B}', 'Is it very spicy?') as id`))).rows[0].id;
await expectOk("guest sends another", () => as(B, `select send_message('${dTable}', '${B}', 'Also, kids ok?')`));
await expectRows("host told once per unread stretch", 1, () => as(D, "select * from notifications where title like 'New message from Bilal%'"));
await expectRows("host sees unread chat", 1, () => as(D, "select * from my_conversations() where unread and as_host and other_name='Bilal'"));
await expectRows("guest's own messages aren't unread", 0, () => as(B, "select * from my_conversations() where unread"));
await expectRows("host reads messages", 2, () => as(D, `select * from messages where conversation_id='${conv}'`));
await expectRows("others can't read messages", 0, () => as(C, "select * from messages"));
await expectRows("others can't see the chat", 0, () => as(C, "select * from my_conversations()"));
await expectErr("can't insert messages directly", () => as(B, `insert into messages (conversation_id, sender_id, body) values ('${conv}', '${B}', 'x')`));
await expectRows("host still can't see guest's profile", 0, () => as(D, `select * from profiles where id='${B}'`));
await expectOk("host marks read", () => as(D, `select mark_conversation_read('${conv}')`));
await expectRows("now read", 0, () => as(D, "select * from my_conversations() where unread"));
await expectOk("host replies", () => as(D, `select send_message('${dTable}', '${B}', 'Mild! Kids welcome.')`));
await expectRows("guest told", 1, () => as(B, "select * from notifications where title like 'New message from Devi%'"));
await expectRows("guest sees unread reply", 1, () => as(B, "select * from my_conversations() where unread and not as_host and last_body like 'Mild%'"));
await expectRows("one conversation per guest per table", 1, () => as(B, "select * from conversations"));
await expectOk("host of an earlier booking can message that guest", () => as(A, `select send_message('${table}', '${C}', 'Thanks for coming!')`));
// ------------------------------------------------ demo MVP: deposit flow
// Devi's Sadya is live in Bengaluru with UPI set at application.
await expectRows("venue details saved and public", 1, () => as(null, `select * from hosts where id='${dHost}' and venue_floor='2nd floor, lift' and house_rules='Shoes off'`));
await expectRows("diet tags saved", 1, () => as(null, `select * from tables where id='${dTable}' and diet_tags @> array['jain']`));
await expectRows("only launch cities take bookings", 2, () => as(null, "select * from cities where accepting"));
await expectOk("host edits venue", () => as(D, `update hosts set venue_parking='Street parking', venue_pets='A friendly cat', venue_seating='Floor seating', home_photo_paths=array['https://x/home.jpg'] where id='${dHost}'`));
await expectErr("host can't edit someone else's venue", () => as(C, `update hosts set venue_pets='x' where id='${dHost}' returning id`).then(r => { if (!r.rows.length) throw new Error("no rows"); }));
await expectErr("other users can't add slots", () => as(C, `select add_slots('${dTable}', array[now() + interval '2 days'], 4, 120)`));
await expectErr("slot length 2 or 3 hours", () => as(D, `select add_slots('${dTable}', array[now() + interval '2 days'], 4, 60)`));
await expectOk("host adds 2-hour slots", () => as(D, `select add_slots('${dTable}', array[now() + interval '2 days', now() + interval '50 minutes', now() + interval '20 hours', now() + interval '3 days'], 6, 120)`));
const slot = async (expr) => (await db.query(`select id from sessions where table_id='${dTable}' and abs(extract(epoch from starts_at - (${expr}))) < 60`)).rows[0].id;
const s2d = await slot("now() + interval '2 days'"), sSoon = await slot("now() + interval '50 minutes'"), s20h = await slot("now() + interval '20 hours'"), s3d = await slot("now() + interval '3 days'");
await expectErr("requests close 1 hour before the start", () => as(B, `select request_booking('${sSoon}', 1, '')`));
await db.exec(`update hosts set city_id='kochi' where id='${dHost}'`);
await expectErr("no bookings in coming-soon cities", () => as(B, `select request_booking('${s2d}', 1, '')`));
await db.exec(`update hosts set city_id='bengaluru' where id='${dHost}'`);

// Not received: goes to the team, who settle it with a note.
const bR = (await expectOk("B requests Sadya", () => as(B, `select request_booking('${s2d}', 2, '') as id`))).rows[0].id;
await expectOk("Devi accepts", () => as(D, `select set_booking_status('${bR}','awaiting_deposit')`));
await expectRows("Devi sees B's contact after accepting", 1, () => as(D, `select * from profiles where id='${B}'`));
await expectOk("B says paid", () => as(B, `select set_booking_status('${bR}','deposit_claimed')`));
await expectOk("Devi: not received", () => as(D, `select set_booking_status('${bR}','in_review')`));
await expectRows("in review still holds the seats", 1, () => as(null, `select * from seats_taken(array['${s2d}']::uuid[]) where taken = 2`));
await expectRows("team told about dispute", 1, () => as(ADMIN, "select * from notifications where title='Deposit dispute to review'"));
await expectErr("host can't settle a dispute", () => as(D, `select admin_update_booking('${bR}', 'confirmed', 'received', 'ok')`));
await expectErr("guest can't settle a dispute", () => as(B, `select admin_update_booking('${bR}', 'confirmed', 'received', 'ok')`));
await expectErr("team must change something", () => as(ADMIN, `select admin_update_booking('${bR}', null, null, '  ')`));
await expectErr("deposit status must be known", () => as(ADMIN, `select admin_update_booking('${bR}', null, 'lost', '')`));
await expectOk("team confirms after checking", () => as(ADMIN, `select admin_update_booking('${bR}', 'confirmed', 'received', 'Guest sent UPI screenshot; Devi found it.')`));
await expectRows("team note kept with the change", 1, () => as(ADMIN, `select * from booking_notes where booking_id='${bR}' and body like 'Status: in_review → confirmed. Deposit: claimed → received. Guest sent%'`));
await expectRows("notes are team-only (host)", 0, () => as(D, "select * from booking_notes"));
await expectRows("notes are team-only (guest)", 0, () => as(B, "select * from booking_notes"));
await expectErr("can't write notes directly", () => as(ADMIN, `insert into booking_notes (booking_id, body) values ('${bR}', 'x')`));

// WhatsApp group queue.
await expectRows("confirmed booking queued for a group", 1, () => as(ADMIN, `select * from admin_whatsapp_queue() where booking_id='${bR}' and host_phone='+919999999999' and guest_phone='+919876543210' and group_name like 'Sadya · %'`));
await expectErr("hosts can't see the queue", () => as(D, "select * from admin_whatsapp_queue()"));
await expectErr("guests can't mark groups", () => as(B, `select mark_whatsapp_group_created('${bR}')`));
await expectOk("guest can still chat before the group", () => as(B, `select send_message('${dTable}', '${B}', 'See you soon')`));
await expectOk("team marks group created", () => as(ADMIN, `select mark_whatsapp_group_created('${bR}')`));
await expectErr("only once", () => as(ADMIN, `select mark_whatsapp_group_created('${bR}')`));
await expectRows("left the queue", 0, () => as(ADMIN, `select * from admin_whatsapp_queue() where booking_id='${bR}'`));
await expectRows("both sides told to check WhatsApp", 2, () => db.query("select * from notifications where title='Check WhatsApp for your group'"));
await expectErr("chat closes once the group exists", () => as(B, `select send_message('${dTable}', '${B}', 'One more thing')`));
await expectErr("host chat closes too", () => as(D, `select send_message('${dTable}', '${B}', 'Reply')`));

// Host cancellation goes through the team; the guest gets the deposit back and can rate the host.
await expectErr("host has no cancel", () => as(D, `select set_booking_status('${bR}','host_cancelled')`));
await expectOk("team cancels for host", () => as(ADMIN, `select admin_update_booking('${bR}', 'host_cancelled', null, 'Devi is unwell.')`));
await expectRows("refund owed to guest", 1, () => as(B, `select * from bookings where id='${bR}' and deposit_status='refund_due'`));
await expectOk("guest rates host after a host cancellation", () => as(B, `select add_review('${bR}', 2, 'Cancelled late')`));
await expectOk("team records the refund", () => as(ADMIN, `select admin_update_booking('${bR}', null, 'refunded', 'Devi refunded by UPI.')`));
await expectRows("seats freed", 0, () => as(null, `select * from seats_taken(array['${s2d}']::uuid[])`));

// Late guest cancellation: host keeps the deposit.
await db.exec(`update profiles set phone='9000000000' where id='${A}'`);
const bL = (await expectOk("A books the 20h slot", () => as(A, `select request_booking('${s20h}', 1, '') as id`))).rows[0].id;
await expectRows("deposit capped at the meal price", 1, () => as(A, `select * from bookings where id='${bL}' and deposit_inr = 500`));
await expectOk("accept", () => as(D, `select set_booking_status('${bL}','awaiting_deposit')`));
await expectOk("pay", () => as(A, `select set_booking_status('${bL}','deposit_claimed')`));
await expectOk("confirm", () => as(D, `select set_booking_status('${bL}','confirmed')`));
await expectOk("guest cancels within 24h", () => as(A, `select set_booking_status('${bL}','guest_cancelled')`));
await expectRows("host keeps it", 1, () => as(A, `select * from bookings where id='${bL}' and deposit_status='kept'`));
await expectErr("no refund to confirm", () => as(A, `select confirm_refund('${bL}')`));

// Timers: a request with no answer expires, an unpaid deposit cancels.
const bE = (await expectOk("C requests 3-day slot", () => as(C, `select request_booking('${s3d}', 1, '') as id`))).rows[0].id;
const bU = (await expectOk("B requests 3-day slot", () => as(B, `select request_booking('${s3d}', 1, '') as id`))).rows[0].id;
await expectOk("accept B", () => as(D, `select set_booking_status('${bU}','awaiting_deposit')`));
await expectRows("nothing due yet", 1, () => as(ADMIN, "select * from run_booking_timers() where expired = 0 and cancelled_unpaid = 0"));
await db.exec(`update bookings set created_at = now() - interval '6 hours 1 minute' where id='${bE}'`);
await expectRows("unanswered request expires after 6h", 1, () => as(ADMIN, "select * from run_booking_timers() where expired = 1 and cancelled_unpaid = 0"));
await expectRows("expired", 1, () => as(C, `select * from bookings where id='${bE}' and status='expired'`));
await expectErr("can't accept an expired request", () => as(D, `select set_booking_status('${bE}','awaiting_deposit')`));
await db.exec(`update bookings set accepted_at = now() - interval '12 hours 1 minute' where id='${bU}'`);
await expectRows("unpaid deposit cancels after 12h", 1, () => as(ADMIN, "select * from run_booking_timers() where cancelled_unpaid = 1"));
await expectErr("can't pay after it lapsed", () => as(B, `select set_booking_status('${bU}','deposit_claimed')`));
// Both timers also stop when bookings close for the slot (1 hour before).
const bE2 = (await expectOk("C requests 20h slot", () => as(C, `select request_booking('${s20h}', 1, '') as id`))).rows[0].id;
await db.exec(`update sessions set starts_at = now() + interval '59 minutes' where id='${s20h}'`);
await expectRows("request expires when the slot closes", 1, () => as(ADMIN, "select * from run_booking_timers() where expired = 1"));
await expectErr("host can't accept after the slot closes", () => as(D, `select set_booking_status('${bE2}','awaiting_deposit')`));

// Demo mode: the team can run the timers as if it were later.
await db.exec("update app_settings set demo_mode = true");
await expectErr("guests can't change settings", () => as(B, "update app_settings set demo_mode = false returning id").then(r => { if (!r.rows.length) throw new Error("no rows"); }));
await expectErr("skip ahead is capped", () => as(ADMIN, "select * from run_booking_timers(500)"));
const bN = (await expectOk("C books 3-day slot", () => as(C, `select request_booking('${s3d}', 2, '') as id`))).rows[0].id;
await expectOk("accept C", () => as(D, `select set_booking_status('${bN}','awaiting_deposit')`));
await expectOk("C pays", () => as(C, `select set_booking_status('${bN}','deposit_claimed')`));
await expectOk("Devi confirms", () => as(D, `select set_booking_status('${bN}','confirmed')`));
await expectRows("skip ahead 3 days completes the meal", 1, () => as(ADMIN, "select * from run_booking_timers(75) where completed = 1"));
await db.exec(`update app_settings set demo_mode = false; update sessions set starts_at = now() - interval '4 hours' where id='${s3d}'`);

// Host rates guest; other hosts and the team see it, the guest doesn't.
await expectErr("guest can't rate themselves", () => as(C, `select add_guest_review('${bN}', 5, 'me')`));
await expectErr("other hosts can't rate this guest", () => as(A, `select add_guest_review('${bN}', 5, 'x')`));
await expectErr("can't rate a cancelled booking", () => as(D, `select add_guest_review('${bR}', 5, 'x')`));
await expectOk("Devi rates C", () => as(D, `select add_guest_review('${bN}', 4, 'Lovely guests, a bit late')`));
await expectErr("only once per booking", () => as(D, `select add_guest_review('${bN}', 5, 'again')`));
await expectRows("other hosts see guest ratings", 1, () => as(A, `select * from guest_reviews where guest_id='${C}'`));
await expectRows("team sees guest ratings", 1, () => as(ADMIN, "select * from guest_reviews"));
await expectRows("guests don't see ratings of themselves", 0, () => as(C, "select * from guest_reviews"));
await expectErr("can't write guest reviews directly", () => as(D, `insert into guest_reviews (booking_id, guest_id, host_id, rating) values ('${bN}', '${C}', '${dHost}', 5)`));
await expectRows("rating shows on requests", 1, () => as(D, `select * from booking_guests(array['${bN}']::uuid[]) where rating = 4 and ratings = 1`));
await expectOk("guest reviews the meal", () => as(C, `select add_review('${bN}', 5, 'Best sadya')`));

// No-shows: the host, within 24 hours after the slot.
await expectErr("guest can't mark themselves no-show", () => as(C, `select set_booking_status('${bN}','no_show')`));
await expectOk("host marks no-show within 24h", () => as(D, `select set_booking_status('${bN}','no_show')`));
await expectRows("host keeps deposit on no-show", 1, () => as(D, `select * from bookings where id='${bN}' and deposit_status='kept'`));
await expectRows("no-show counted for hosts", 1, () => as(D, `select * from booking_guests(array['${bN}']::uuid[]) where no_shows = 1`));
await db.exec(`update bookings set status='completed' where id='${bN}'; update sessions set starts_at = now() - interval '28 hours' where id='${s3d}'`);
await expectErr("too late to mark no-show", () => as(D, `select set_booking_status('${bN}','no_show')`));

// Verification files: private bucket, team-only.
await expectOk("host uploads ID", () => as(D, `insert into storage.objects (bucket_id, name) values ('host-verification', '${D}/id.jpg')`));
await expectErr("not into another host's folder", () => as(C, `insert into storage.objects (bucket_id, name) values ('host-verification', '${D}/x.jpg')`));
await expectOk("host lists the document", () => as(D, `insert into host_documents (host_id, kind, path) values ('${dHost}', 'id', '${D}/id.jpg')`));
await expectErr("document path must be in own folder", () => as(D, `insert into host_documents (host_id, kind, path) values ('${dHost}', 'fssai', '${C}/f.pdf')`));
await expectErr("document kind is checked", () => as(D, `insert into host_documents (host_id, kind, path) values ('${dHost}', 'selfie', '${D}/s.jpg')`));
await expectRows("team can open verification files", 1, () => as(ADMIN, "select * from storage.objects where bucket_id='host-verification'"));
await expectRows("host can't open them back", 0, () => as(D, "select * from storage.objects where bucket_id='host-verification'"));
await expectRows("others can't open them", 0, () => as(C, "select * from storage.objects where bucket_id='host-verification'"));
await expectRows("others can't see document list", 0, () => as(C, "select * from host_documents"));
await expectRows("team sees document list", 1, () => as(ADMIN, "select * from host_documents"));
await expectRows("upload limits set", 2, () => db.query("select * from storage.buckets where file_size_limit = 5242880"));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
