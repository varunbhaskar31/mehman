-- Mehman for real people: reviews, notifications and saved tables, and
-- every change the app makes going through functions that check the rules
-- here, in the database, rather than in the browser.

-- ------------------------------------------------------------- profiles

-- The login email, so the team can reach hosts and guests.
alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    new.phone,
    new.email
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------- hosts

-- The neighbourhood and a rough centre point for the map. Public, so never
-- the house itself; that stays in host_private.
alter table public.hosts
  add column locality text,
  add column area_lat double precision,
  add column area_lng double precision;

grant update (city_id, display_name, bio, languages, locality) on public.hosts to authenticated;

-- ------------------------------------------------------------- bookings

-- The price when the seat was requested; later price changes don't touch it.
alter table public.bookings add column price_per_guest_inr int not null default 0;

-- --------------------------------------------------------- new tables

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  table_id uuid not null references public.tables (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null default '',
  host_reply text,
  created_at timestamptz not null default now()
);

create index reviews_table on public.reviews (table_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  href text not null default '/',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user on public.notifications (user_id, created_at desc);

create table public.saved_tables (
  user_id uuid not null references public.profiles (id) on delete cascade,
  table_id uuid not null references public.tables (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, table_id)
);

-- ---------------------------------------------------------- helpers

-- In-app notifications. WhatsApp, SMS and email can hang off this table
-- later (a database webhook on insert).
create function public.notify(p_user uuid, p_title text, p_body text, p_href text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, title, body, href)
  values (p_user, p_title, coalesce(p_body, ''), p_href);
$$;

create function public.notify_admins(p_title text, p_body text, p_href text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, title, body, href)
  select id, p_title, coalesce(p_body, ''), p_href from public.profiles where role = 'admin';
$$;

-- Only the functions below may send notifications.
revoke execute on function public.notify(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_admins(text, text, text) from public, anon, authenticated;

create function public.plural(n int, word text)
returns text
language sql
immutable
set search_path = ''
as $$ select n || ' ' || word || case when n = 1 then '' else 's' end; $$;

create function public.short_date(t timestamptz)
returns text
language sql
immutable
set search_path = ''
as $$ select to_char(t at time zone 'Asia/Kolkata', 'FMDD Mon'); $$;

-- A guest keeps seeing the table, host and dates they booked, even after
-- the table is paused. Security definer so the check doesn't loop back
-- through the bookings policies.
create function public.has_booked_table(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings b
    join public.sessions s on s.id = b.session_id
    where s.table_id = p_table_id and b.guest_id = (select auth.uid())
  );
$$;

create function public.has_booked_host(p_host_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings b
    join public.sessions s on s.id = b.session_id
    join public.tables t on t.id = s.table_id
    where t.host_id = p_host_id and b.guest_id = (select auth.uid())
  );
$$;

-- The address is shared only once the host has said yes.
create function public.can_see_host_contact(p_host_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings b
    join public.sessions s on s.id = b.session_id
    join public.tables t on t.id = s.table_id
    where t.host_id = p_host_id
      and b.guest_id = (select auth.uid())
      and b.status in ('accepted', 'completed')
  );
$$;

-- Seats held on each date. Guests can't see each other's bookings, so the
-- count comes from here.
create function public.seats_taken(p_session_ids uuid[])
returns table (session_id uuid, taken int)
language sql
stable
security definer
set search_path = ''
as $$
  select b.session_id, sum(b.party_size)::int
  from public.bookings b
  where b.session_id = any (p_session_ids) and b.status in ('requested', 'accepted')
  group by b.session_id;
$$;

-- First names of people who wrote reviews, for the table page.
create function public.reviewer_names(p_ids uuid[])
returns table (id uuid, first_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, split_part(coalesce(p.full_name, ''), ' ', 1)
  from public.profiles p
  where p.id = any (p_ids)
    and exists (select 1 from public.reviews r where r.guest_id = p.id);
$$;

-- ------------------------------------------------------------- RLS

alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_tables enable row level security;

create policy "Guests read tables they booked" on public.tables
  for select to authenticated using (public.has_booked_table(id));
create policy "Guests read hosts they booked" on public.hosts
  for select to authenticated using (public.has_booked_host(id));
create policy "Guests read contact after acceptance" on public.host_private
  for select to authenticated using (public.can_see_host_contact(host_id));

create policy "Anyone reads reviews of visible tables" on public.reviews
  for select to anon, authenticated using (
    exists (select 1 from public.tables t where t.id = reviews.table_id)
  );
-- Reviews are written through add_review() and reply_to_review().
revoke insert, update, delete on public.reviews from anon, authenticated;

create policy "Read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.notifications from anon, authenticated;

create policy "Read own saved tables" on public.saved_tables
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Save tables" on public.saved_tables
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Unsave tables" on public.saved_tables
  for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.saved_tables from anon, authenticated;

-- Dates change only through add_sessions() and remove_session(), so a date
-- with guests on it can't be deleted from under them.
revoke insert, update, delete on public.sessions from anon, authenticated;

-- ----------------------------------------------------------- hosting

-- A whole host application at once: profile, private details, the first
-- table and its dates. Everything waits for Mehman's review.
create function public.apply_as_host(p_host jsonb, p_table jsonb, p_dates jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_host uuid;
  v_table uuid;
  v_max int := (p_table ->> 'max_guests')::int;
  v_date jsonb;
begin
  if v_user is null then
    raise exception 'Please log in to apply.';
  end if;
  if exists (select 1 from public.hosts where user_id = v_user) then
    raise exception 'You''ve already applied to host.';
  end if;

  insert into public.hosts (user_id, city_id, display_name, bio, languages, locality)
  values (
    v_user,
    p_host ->> 'city_id',
    trim(p_host ->> 'display_name'),
    trim(p_host ->> 'bio'),
    coalesce(array(select jsonb_array_elements_text(p_host -> 'languages')), '{}'),
    nullif(trim(p_host ->> 'locality'), '')
  )
  returning id into v_host;

  insert into public.host_private (host_id, address, contact_phone)
  values (v_host, trim(p_host ->> 'address'), trim(p_host ->> 'contact_phone'));

  insert into public.tables (host_id, title, story, menu, cuisine, veg, price_per_guest_inr, max_guests, photo_paths, status)
  values (
    v_host,
    trim(p_table ->> 'title'),
    trim(p_table ->> 'story'),
    trim(p_table ->> 'menu'),
    trim(p_table ->> 'cuisine'),
    (p_table ->> 'veg')::public.veg_type,
    (p_table ->> 'price_per_guest_inr')::int,
    v_max,
    coalesce(array(select jsonb_array_elements_text(p_table -> 'photo_paths')), '{}'),
    'pending'
  )
  returning id into v_table;

  for v_date in select * from jsonb_array_elements(coalesce(p_dates, '[]'))
  loop
    if (v_date ->> 'starts_at')::timestamptz <= now() then
      raise exception 'Please pick dates in the future.';
    end if;
    if (v_date ->> 'seats')::int not between 1 and v_max then
      raise exception 'Seats must be between 1 and %.', v_max;
    end if;
    insert into public.sessions (table_id, starts_at, seats_total)
    values (v_table, (v_date ->> 'starts_at')::timestamptz, (v_date ->> 'seats')::int);
  end loop;

  perform public.notify_admins('New host application', trim(p_host ->> 'display_name'), '/admin');
  return v_host;
end;
$$;

-- Adds dates to the host's own table. Returns how many were added.
create function public.add_sessions(p_table_id uuid, p_starts timestamptz[], p_seats int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max int;
  v_start timestamptz;
begin
  select max_guests into v_max from public.tables
  where id = p_table_id and host_id = public.my_host_id();
  if not found then
    raise exception 'You can only add dates to your own table.';
  end if;
  if p_seats not between 1 and v_max then
    raise exception 'Seats must be between 1 and %.', v_max;
  end if;
  foreach v_start in array p_starts loop
    if v_start <= now() then
      raise exception 'Please pick a date in the future.';
    end if;
  end loop;
  insert into public.sessions (table_id, starts_at, seats_total)
  select p_table_id, unnest(p_starts), p_seats;
  return coalesce(array_length(p_starts, 1), 0);
end;
$$;

create function public.remove_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.sessions s
  join public.tables t on t.id = s.table_id
  where s.id = p_session_id and t.host_id = public.my_host_id()
  for update of s;
  if not found then
    raise exception 'You can only remove dates from your own table.';
  end if;
  if exists (
    select 1 from public.bookings
    where session_id = p_session_id and status in ('requested', 'accepted')
  ) then
    raise exception 'Guests have asked for this date. Decline or cancel them first.';
  end if;
  delete from public.sessions where id = p_session_id;
end;
$$;

-- Wording changes go live straight away; a new price or new photos on a
-- live table go back to Mehman for a quick look first. Returns whether the
-- table now waits for review.
create function public.update_table(p_table_id uuid, p_edits jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table public.tables;
  v_photos text[] := coalesce(array(select jsonb_array_elements_text(p_edits -> 'photo_paths')), '{}');
  v_price int := (p_edits ->> 'price_per_guest_inr')::int;
  v_needs_review boolean;
begin
  select * into v_table from public.tables
  where id = p_table_id and host_id = public.my_host_id()
  for update;
  if not found then
    raise exception 'This isn''t your table.';
  end if;

  v_needs_review := v_table.status in ('approved', 'paused')
    and (v_price is distinct from v_table.price_per_guest_inr or v_photos is distinct from v_table.photo_paths);

  update public.tables set
    title = trim(p_edits ->> 'title'),
    story = trim(p_edits ->> 'story'),
    menu = trim(p_edits ->> 'menu'),
    cuisine = trim(p_edits ->> 'cuisine'),
    veg = (p_edits ->> 'veg')::public.veg_type,
    price_per_guest_inr = v_price,
    max_guests = (p_edits ->> 'max_guests')::int,
    photo_paths = v_photos,
    status = case when v_needs_review or v_table.status = 'rejected' then 'pending' else v_table.status end,
    updated_at = now()
  where id = p_table_id;

  if v_needs_review then
    perform public.notify_admins('A live table changed', trim(p_edits ->> 'title'), '/admin');
  end if;
  return v_needs_review;
end;
$$;

-- ------------------------------------------------------------- admin

create function public.review_host(p_host_id uuid, p_approve boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host public.hosts;
  v_note text := nullif(trim(p_note), '');
begin
  if not public.is_admin() then
    raise exception 'Only the Mehman team can review hosts.';
  end if;
  select * into v_host from public.hosts where id = p_host_id for update;
  if not found then
    raise exception 'Host not found.';
  end if;

  update public.hosts
  set status = case when p_approve then 'approved' else 'rejected' end::public.review_status,
      review_note = v_note
  where id = p_host_id;

  update public.tables
  set status = case when p_approve then 'approved' else 'rejected' end::public.table_status,
      review_note = v_note, updated_at = now()
  where host_id = p_host_id and status = 'pending';

  if p_approve then
    update public.profiles set role = 'host' where id = v_host.user_id and role = 'guest';
  end if;

  perform public.notify(
    v_host.user_id,
    case when p_approve then 'Your table is live!' else 'Your table wasn''t approved' end,
    case when p_approve then 'Guests can now find and book it.' else coalesce(v_note, '') end,
    '/host'
  );
end;
$$;

-- Re-checks a live host's table after they change its price or photos.
create function public.review_table_changes(p_table_id uuid, p_approve boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table public.tables;
  v_user uuid;
  v_note text := nullif(trim(p_note), '');
begin
  if not public.is_admin() then
    raise exception 'Only the Mehman team can review tables.';
  end if;
  select * into v_table from public.tables where id = p_table_id and status = 'pending' for update;
  if not found then
    raise exception 'Nothing to review here.';
  end if;
  select user_id into v_user from public.hosts where id = v_table.host_id;

  update public.tables
  set status = case when p_approve then 'approved' else 'rejected' end::public.table_status,
      review_note = v_note, updated_at = now()
  where id = p_table_id;

  perform public.notify(
    v_user,
    case when p_approve then 'Your changes are live' else 'Your changes weren''t approved' end,
    case when p_approve then v_table.title || ' is bookable again.' else coalesce(v_note, '') end,
    '/host/table'
  );
end;
$$;

-- The team can take a live table off Explore (and put it back), for
-- example after a complaint.
create function public.admin_set_table_paused(p_table_id uuid, p_paused boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Only the Mehman team can do this.';
  end if;
  update public.tables
  set status = case when p_paused then 'paused' else 'approved' end::public.table_status, updated_at = now()
  where id = p_table_id
    and status = case when p_paused then 'approved' else 'paused' end::public.table_status;
  if not found then
    raise exception 'That table can''t be changed right now.';
  end if;
  select h.user_id into v_user from public.tables t join public.hosts h on h.id = t.host_id where t.id = p_table_id;
  perform public.notify(
    v_user,
    case when p_paused then 'Mehman paused your table' else 'Your table is live again' end,
    case when p_paused then 'We''ll be in touch about why.' else 'Guests can book it again.' end,
    '/host/table'
  );
end;
$$;

-- ---------------------------------------------------------- bookings

create or replace function public.request_booking(p_session_id uuid, p_party_size int, p_note text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest uuid := (select auth.uid());
  v_session public.sessions;
  v_table public.tables;
  v_host public.hosts;
  v_name text;
  v_booking uuid;
begin
  if v_guest is null then
    raise exception 'Please log in to request a seat.';
  end if;

  select s.* into v_session from public.sessions s
  join public.tables t on t.id = s.table_id
  where s.id = p_session_id and t.status = 'approved' and s.starts_at > now()
  for update of s;
  if not found then
    raise exception 'This date is no longer available.';
  end if;
  select * into v_table from public.tables where id = v_session.table_id;
  select * into v_host from public.hosts where id = v_table.host_id;

  if v_host.user_id = v_guest then
    raise exception 'You can''t book your own table.';
  end if;
  if exists (
    select 1 from public.bookings
    where session_id = p_session_id and guest_id = v_guest and status in ('requested', 'accepted')
  ) then
    raise exception 'You''ve already asked for this date.';
  end if;
  if p_party_size < 1 or public.seats_left(p_session_id) < p_party_size then
    raise exception 'Not enough seats left on this date.';
  end if;

  insert into public.bookings (session_id, guest_id, party_size, note, price_per_guest_inr)
  values (p_session_id, v_guest, p_party_size, nullif(trim(p_note), ''), v_table.price_per_guest_inr)
  returning id into v_booking;

  select nullif(trim(full_name), '') into v_name from public.profiles where id = v_guest;
  perform public.notify(
    v_host.user_id,
    'New request from ' || coalesce(v_name, 'a guest'),
    public.plural(p_party_size, 'guest') || ' · ' || public.short_date(v_session.starts_at),
    '/host/requests'
  );
  return v_booking;
end;
$$;

-- Host and guest move a booking through its life; nobody else can.
create or replace function public.set_booking_status(p_booking_id uuid, p_status public.booking_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_booking public.bookings;
  v_session public.sessions;
  v_table public.tables;
  v_host public.hosts;
  v_guest_name text;
  v_is_host boolean;
  v_is_guest boolean;
  v_started boolean;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;
  select * into v_session from public.sessions where id = v_booking.session_id;
  select * into v_table from public.tables where id = v_session.table_id;
  select * into v_host from public.hosts where id = v_table.host_id;
  select coalesce(nullif(trim(full_name), ''), 'A guest') into v_guest_name from public.profiles where id = v_booking.guest_id;

  v_is_host := v_host.user_id = v_user;
  v_is_guest := v_booking.guest_id = v_user;
  v_started := v_session.starts_at <= now();

  if not (
    (v_is_host and v_booking.status = 'requested' and p_status in ('accepted', 'declined'))
    or (v_is_host and v_booking.status = 'accepted' and v_started and p_status in ('completed', 'no_show'))
    or (v_is_host and v_booking.status = 'accepted' and not v_started and p_status = 'cancelled')
    or (v_is_guest and v_booking.status in ('requested', 'accepted') and not v_started and p_status = 'cancelled')
  ) then
    raise exception 'That change isn''t allowed.';
  end if;

  update public.bookings set status = p_status, updated_at = now() where id = p_booking_id;

  if p_status = 'accepted' then
    perform public.notify(v_booking.guest_id, v_host.display_name || ' accepted your request',
      v_table.title || ' · the address is now in your booking', '/bookings');
  elsif p_status = 'declined' then
    perform public.notify(v_booking.guest_id, v_host.display_name || ' can''t host you on this date',
      'Try another date or table.', '/bookings');
  elsif p_status = 'cancelled' and v_is_guest then
    perform public.notify(v_host.user_id, v_guest_name || ' cancelled',
      public.plural(v_booking.party_size, 'seat') || ' freed up', '/host/requests');
  elsif p_status = 'cancelled' and v_is_host then
    perform public.notify(v_booking.guest_id, v_host.display_name || ' had to cancel',
      'We''re sorry. Try another date or table.', '/bookings');
  elsif p_status = 'completed' then
    perform public.notify(v_booking.guest_id, 'How was ' || v_table.title || '?',
      'Leave a review for ' || v_host.display_name, '/bookings');
  end if;
end;
$$;

-- ----------------------------------------------------------- reviews

create function public.add_review(p_booking_id uuid, p_rating int, p_text text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_booking public.bookings;
  v_table public.tables;
  v_host_user uuid;
  v_name text;
  v_review uuid;
begin
  select * into v_booking from public.bookings where id = p_booking_id and guest_id = v_user;
  if not found then
    raise exception 'Booking not found.';
  end if;
  if v_booking.status <> 'completed' then
    raise exception 'You can review a meal once it has happened.';
  end if;
  if exists (select 1 from public.reviews where booking_id = p_booking_id) then
    raise exception 'You''ve already reviewed this meal.';
  end if;
  if p_rating not between 1 and 5 then
    raise exception 'Please choose 1 to 5 stars.';
  end if;

  select t.* into v_table from public.sessions s join public.tables t on t.id = s.table_id
  where s.id = v_booking.session_id;
  select user_id into v_host_user from public.hosts where id = v_table.host_id;

  insert into public.reviews (booking_id, table_id, guest_id, rating, body)
  values (p_booking_id, v_table.id, v_user, p_rating, trim(coalesce(p_text, '')))
  returning id into v_review;

  select coalesce(nullif(trim(full_name), ''), 'A guest') into v_name from public.profiles where id = v_user;
  perform public.notify(
    v_host_user,
    v_name || ' left you a review',
    repeat('★', p_rating) || case when trim(coalesce(p_text, '')) <> ''
      then ' “' || left(trim(p_text), 60) || '”' else '' end,
    '/host/earnings'
  );
  return v_review;
end;
$$;

create function public.reply_to_review(p_review_id uuid, p_reply text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(trim(coalesce(p_reply, ''))) < 2 then
    raise exception 'Write a short reply.';
  end if;
  update public.reviews r set host_reply = trim(p_reply)
  from public.tables t
  where r.id = p_review_id and t.id = r.table_id and t.host_id = public.my_host_id();
  if not found then
    raise exception 'You can only reply to reviews of your own table.';
  end if;
end;
$$;

create function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications set read = true
  where user_id = (select auth.uid()) and not read;
$$;

-- Internal helpers stay internal.
revoke execute on function public.plural(int, text) from anon;
revoke execute on function public.short_date(timestamptz) from anon;
