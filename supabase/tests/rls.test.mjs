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
create table storage.buckets (id text primary key, name text, public boolean);
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

const host = (await expectOk("apply as host", () => as(A, `insert into hosts (user_id, city_id, display_name, bio) values ('${A}','jaipur','Asha','We cook') returning id`))).rows[0].id;
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
await expectRows("anon can't see bookings", 0, () => as(null, "select * from bookings"));
await expectErr("host can't book own table", () => as(A, `select request_booking('${sess}', 1, '')`));
const bk = (await expectOk("guest requests 3 seats", () => as(B, `select request_booking('${sess}', 3, 'veg please') as id`))).rows[0].id;
await expectErr("overbooking blocked", () => as(C, `select request_booking('${sess}', 2, '')`));
await expectErr("guest can't insert booking directly", () => as(C, `insert into bookings (session_id, guest_id, party_size) values ('${sess}','${C}',1)`));
await expectRows("other guest can't see booking", 0, () => as(C, "select * from bookings"));
await expectRows("host sees request", 1, () => as(A, "select * from bookings"));
await expectRows("host sees guest name", 1, () => as(A, `select * from profiles where id='${B}'`));
await expectRows("no address before acceptance", 0, () => as(B, `select * from booking_contact('${bk}')`));
await expectErr("guest can't accept own booking", () => as(B, `select set_booking_status('${bk}','accepted')`));
await expectErr("guest can't edit booking directly", () => as(B, `update bookings set status='accepted' where id='${bk}' returning id`).then(r => { if (!r.rows.length) throw new Error("no rows"); }));
await expectOk("host accepts", () => as(A, `select set_booking_status('${bk}','accepted')`));
await expectRows("guest sees address after acceptance", 1, () => as(B, `select * from booking_contact('${bk}')`));
await expectRows("other user can't use booking_contact", 0, () => as(C, `select * from booking_contact('${bk}')`));
await expectOk("guest cancels", () => as(B, `select set_booking_status('${bk}','cancelled')`));
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
await expectOk("host accepts C", () => as(A, `select set_booking_status('${bkC}','accepted')`));
await expectErr("can't complete before the meal", () => as(A, `select set_booking_status('${bkC}','completed')`));
await db.exec(`update sessions set starts_at = now() - interval '1 hour' where id='${sess}'`);
await expectErr("guest can't cancel after it started", () => as(C, `select set_booking_status('${bkC}','cancelled')`));
await expectErr("can't review before completion", () => as(C, `select add_review('${bkC}', 5, 'lovely')`));
await expectOk("host completes", () => as(A, `select set_booking_status('${bkC}','completed')`));
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
const devHost = { city_id: "kochi", display_name: "Devi's table", bio: "Fish", languages: ["Malayalam"], address: "1 MG Road", contact_phone: "+919999999999", locality: "Kaloor" };
const devTable = { title: "Sadya", story: "s", menu: "m", cuisine: "Kerala", veg: "veg", price_per_guest_inr: 900, max_guests: 6, photo_paths: ["https://x/1.jpg"] };
const future = new Date(Date.now() + 9 * 864e5).toISOString();
await expectErr("dates must fit the table", () => apply(D, devHost, devTable, [{ starts_at: future, seats: 7 }]));
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
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
