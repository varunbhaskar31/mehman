-- The demo MVP: a ₹500 deposit paid by UPI straight to the host, fixed time
-- slots, timers, team-run cancellations, a WhatsApp group queue, venue
-- details, diet tags, guest reviews and two launch cities.
--
-- Mehman never touches money. The app only records what the guest and the
-- host say happened, and the team settles disagreements.

-- ------------------------------------------------------------ settings

-- One row of app-wide switches. demo_mode lets admins run the timers as if
-- it were later (for a live demo); it is off unless the demo seed turns it
-- on, and only the service role can change it.
create table public.app_settings (
  id boolean primary key default true check (id),
  demo_mode boolean not null default false
);
insert into public.app_settings (id) values (true);
alter table public.app_settings enable row level security;
create policy "Anyone reads settings" on public.app_settings
  for select to anon, authenticated using (true);
revoke insert, update, delete on public.app_settings from anon, authenticated;

-- ---------------------------------------------------------------- cities

-- Only these cities take bookings and host applications; the rest show
-- "coming soon".
alter table public.cities add column accepting boolean not null default false;
update public.cities set accepting = true where id in ('bengaluru', 'hyderabad');

-- ----------------------------------------------------------------- hosts

-- The home itself: public, and kept apart from meal photos.
alter table public.hosts
  add column venue_floor text,
  add column venue_parking text,
  add column venue_pets text,
  add column venue_seating text,
  add column house_rules text,
  add column home_photo_paths text[] not null default '{}';

grant update (city_id, display_name, bio, languages, locality,
  venue_floor, venue_parking, venue_pets, venue_seating, house_rules, home_photo_paths)
  on public.hosts to authenticated;

-- The UPI ID the deposit goes to. Private: a guest sees it only through
-- booking_payment() once the host has accepted them.
alter table public.host_private
  add column upi_id text check (upi_id is null or upi_id ~ '^[A-Za-z0-9._-]{2,255}@[A-Za-z][A-Za-z0-9.]{1,63}$');

-- ---------------------------------------------------------------- tables

-- Diet tags shown on the meal and used by the city filters.
alter table public.tables
  add column diet_tags text[] not null default '{}'
  check (diet_tags <@ array['veg', 'non_veg', 'jain', 'vegan', 'halal', 'gluten_free']);

update public.tables set diet_tags = case veg
  when 'veg' then array['veg']
  when 'non_veg' then array['non_veg']
  else array['veg', 'non_veg'] end;

grant update (title, story, menu, cuisine, veg, price_per_guest_inr, max_guests, photo_paths, status, diet_tags)
  on public.tables to authenticated;

-- -------------------------------------------------------------- sessions

-- Every date is a fixed slot: a start time and a length of 2 or 3 hours.
-- Requests close 1 hour before the start.
alter table public.sessions
  add column duration_minutes int not null default 180 check (duration_minutes in (120, 180));

create function public.slot_closes_at(p_starts timestamptz)
returns timestamptz
language sql
immutable
set search_path = ''
as $$ select p_starts - interval '1 hour' $$;

create function public.slot_ends_at(p_starts timestamptz, p_minutes int)
returns timestamptz
language sql
immutable
set search_path = ''
as $$ select p_starts + make_interval(mins => p_minutes) $$;

-- -------------------------------------------------------------- bookings

alter table public.bookings
  add column deposit_inr int not null default 500 check (deposit_inr between 0 and 500),
  -- Where the deposit stands: none (not paid), claimed (guest says paid),
  -- received (host confirmed), refund_due (host or team owes it back),
  -- refunded (guest confirmed the refund) or kept (host keeps it).
  add column deposit_status text not null default 'none'
    check (deposit_status in ('none', 'claimed', 'received', 'refund_due', 'refunded', 'kept')),
  add column accepted_at timestamptz,
  add column deposit_claimed_at timestamptz,
  add column confirmed_at timestamptz,
  add column closed_at timestamptz,
  add column whatsapp_group_at timestamptz;

-- Old rows: an accepted booking had already been shared the address, so it
-- counts as confirmed; old cancellations become guest cancellations.
update public.bookings set status = 'confirmed', accepted_at = updated_at, confirmed_at = updated_at,
  deposit_inr = 0 where status = 'accepted';
update public.bookings set status = 'guest_cancelled', deposit_inr = 0 where status = 'cancelled';
update public.bookings set deposit_inr = 0 where status in ('declined', 'completed', 'no_show');

create index bookings_status on public.bookings (status);

-- Bookings that hold seats on a date.
create function public.holds_seat(p_status public.booking_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_status in ('requested', 'accepted', 'awaiting_deposit', 'deposit_claimed', 'confirmed', 'in_review')
$$;

-- Team notes on a booking: refunds, disputes, calls made.
create table public.booking_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index booking_notes_booking on public.booking_notes (booking_id, created_at);

-- Hosts rate their guests after the meal. Seen by the team and other hosts,
-- not by the guest.
create table public.guest_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  host_id uuid not null references public.hosts (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);
create index guest_reviews_guest on public.guest_reviews (guest_id);

-- Optional verification files (ID, FSSAI registration, kitchen photos).
-- The files live in the private host-verification bucket; this lists them.
create table public.host_documents (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts (id) on delete cascade,
  kind text not null check (kind in ('id', 'fssai', 'kitchen')),
  path text not null,
  created_at timestamptz not null default now()
);
create index host_documents_host on public.host_documents (host_id);

-- ------------------------------------------------------------ helpers

create function public.is_approved_host()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.hosts where user_id = (select auth.uid()) and status = 'approved');
$$;

create function public.is_booking_host(p_booking_id uuid)
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
    join public.hosts h on h.id = t.host_id
    where b.id = p_booking_id and h.user_id = (select auth.uid())
  );
$$;

-- A host sees a guest's profile (phone, email) only once they've accepted
-- one of that guest's requests. Before that, booking_guests() gives the
-- first name and track record.
create function public.host_accepted_guest(p_guest_id uuid)
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
    where b.guest_id = p_guest_id
      and t.host_id = public.my_host_id()
      and b.accepted_at is not null
  );
$$;

-- The address and host phone are shared only once the deposit is received.
create or replace function public.can_see_host_contact(p_host_id uuid)
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
      and b.status in ('accepted', 'confirmed', 'completed')
  );
$$;

create or replace function public.booking_contact(p_booking_id uuid)
returns table (address text, contact_phone text)
language sql
stable
security definer
set search_path = ''
as $$
  select hp.address, hp.contact_phone
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  join public.tables t on t.id = s.table_id
  join public.host_private hp on hp.host_id = t.host_id
  where b.id = p_booking_id
    and b.guest_id = (select auth.uid())
    and b.status in ('accepted', 'confirmed', 'completed');
$$;

create or replace function public.seats_left(p_session_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select s.seats_total - coalesce((
    select sum(b.party_size)::int from public.bookings b
    where b.session_id = s.id and public.holds_seat(b.status)
  ), 0)
  from public.sessions s where s.id = p_session_id;
$$;

create or replace function public.seats_taken(p_session_ids uuid[])
returns table (session_id uuid, taken int)
language sql
stable
security definer
set search_path = ''
as $$
  select b.session_id, sum(b.party_size)::int
  from public.bookings b
  where b.session_id = any (p_session_ids) and public.holds_seat(b.status)
  group by b.session_id;
$$;

-- What to pay and where, for a guest the host has accepted.
create function public.booking_payment(p_booking_id uuid)
returns table (upi_id text, payee_name text, amount_inr int)
language sql
stable
security definer
set search_path = ''
as $$
  select hp.upi_id, h.display_name, b.deposit_inr
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  join public.tables t on t.id = s.table_id
  join public.hosts h on h.id = t.host_id
  join public.host_private hp on hp.host_id = h.id
  where b.id = p_booking_id
    and b.guest_id = (select auth.uid())
    and b.status in ('awaiting_deposit', 'deposit_claimed');
$$;

-- First name and track record of the guests on a host's bookings: what a
-- host needs to decide on a request without seeing contact details.
create function public.booking_guests(p_booking_ids uuid[])
returns table (booking_id uuid, guest_id uuid, first_name text, rating numeric, ratings int, no_shows int)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.guest_id,
    split_part(coalesce(nullif(trim(p.full_name), ''), 'Guest'), ' ', 1),
    (select round(avg(g.rating), 1) from public.guest_reviews g where g.guest_id = b.guest_id),
    (select count(*)::int from public.guest_reviews g where g.guest_id = b.guest_id),
    (select count(*)::int from public.bookings x where x.guest_id = b.guest_id and x.status = 'no_show')
  from public.bookings b
  join public.profiles p on p.id = b.guest_id
  where b.id = any (p_booking_ids)
    and (public.is_booking_host(b.id) or public.is_admin());
$$;

-- ------------------------------------------------------------------ RLS

alter table public.booking_notes enable row level security;
alter table public.guest_reviews enable row level security;
alter table public.host_documents enable row level security;

drop policy "Hosts read their guests" on public.profiles;
create policy "Hosts read guests they accepted" on public.profiles
  for select to authenticated using (public.host_accepted_guest(id));

create policy "Team reads booking notes" on public.booking_notes
  for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.booking_notes from anon, authenticated;

create policy "Team and hosts read guest reviews" on public.guest_reviews
  for select to authenticated using (public.is_admin() or public.is_approved_host());
revoke insert, update, delete on public.guest_reviews from anon, authenticated;

create policy "Host and team read documents" on public.host_documents
  for select to authenticated using (host_id = public.my_host_id() or public.is_admin());
create policy "Host adds own documents" on public.host_documents
  for insert to authenticated with check (
    host_id = public.my_host_id()
    and (storage.foldername(path))[1] = (select auth.uid())::text
  );
revoke update, delete on public.host_documents from anon, authenticated;

-- ------------------------------------------------------------- storage

-- Uploads are checked on the server: images only, 5 MB at most (PDF also
-- allowed for documents).
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'table-photos';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('host-verification', 'host-verification', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Hosts upload into their own folder; only the team can open the files.
create policy "Host uploads own verification files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'host-verification' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Team reads verification files" on storage.objects
  for select to authenticated using (bucket_id = 'host-verification' and public.is_admin());

-- -------------------------------------------------------------- hosting

-- The whole application at once, now with venue details, UPI ID and diet
-- tags. Only launch cities take applications.
create or replace function public.apply_as_host(p_host jsonb, p_table jsonb, p_dates jsonb)
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
  v_minutes int;
begin
  if v_user is null then
    raise exception 'Please log in to apply.';
  end if;
  if exists (select 1 from public.hosts where user_id = v_user) then
    raise exception 'You''ve already applied to host.';
  end if;
  if not exists (select 1 from public.cities where id = p_host ->> 'city_id' and accepting) then
    raise exception 'Mehman is only taking hosts in Bengaluru and Hyderabad for now.';
  end if;

  insert into public.hosts (user_id, city_id, display_name, bio, languages, locality,
    venue_floor, venue_parking, venue_pets, venue_seating, house_rules, home_photo_paths)
  values (
    v_user,
    p_host ->> 'city_id',
    trim(p_host ->> 'display_name'),
    trim(p_host ->> 'bio'),
    coalesce(array(select jsonb_array_elements_text(p_host -> 'languages')), '{}'),
    nullif(trim(p_host ->> 'locality'), ''),
    nullif(trim(p_host ->> 'venue_floor'), ''),
    nullif(trim(p_host ->> 'venue_parking'), ''),
    nullif(trim(p_host ->> 'venue_pets'), ''),
    nullif(trim(p_host ->> 'venue_seating'), ''),
    nullif(trim(p_host ->> 'house_rules'), ''),
    coalesce(array(select jsonb_array_elements_text(p_host -> 'home_photo_paths')), '{}')
  )
  returning id into v_host;

  insert into public.host_private (host_id, address, contact_phone, upi_id)
  values (v_host, trim(p_host ->> 'address'), trim(p_host ->> 'contact_phone'),
    nullif(trim(p_host ->> 'upi_id'), ''));

  insert into public.tables (host_id, title, story, menu, cuisine, veg, price_per_guest_inr, max_guests,
    photo_paths, diet_tags, status)
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
    coalesce(array(select jsonb_array_elements_text(p_table -> 'diet_tags')), '{}'),
    'pending'
  )
  returning id into v_table;

  for v_date in select * from jsonb_array_elements(coalesce(p_dates, '[]'))
  loop
    v_minutes := coalesce((v_date ->> 'duration_minutes')::int, 180);
    if (v_date ->> 'starts_at')::timestamptz <= now() then
      raise exception 'Please pick dates in the future.';
    end if;
    if (v_date ->> 'seats')::int not between 1 and v_max then
      raise exception 'Seats must be between 1 and %.', v_max;
    end if;
    if v_minutes not in (120, 180) then
      raise exception 'A meal lasts 2 or 3 hours.';
    end if;
    insert into public.sessions (table_id, starts_at, seats_total, duration_minutes)
    values (v_table, (v_date ->> 'starts_at')::timestamptz, (v_date ->> 'seats')::int, v_minutes);
  end loop;

  perform public.notify_admins('New host application', trim(p_host ->> 'display_name'), '/admin');
  return v_host;
end;
$$;

-- Adds slots to the host's own table: start times plus a length of 2 or 3
-- hours. Returns how many were added.
create function public.add_slots(p_table_id uuid, p_starts timestamptz[], p_seats int, p_minutes int)
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
  if p_minutes not in (120, 180) then
    raise exception 'A meal lasts 2 or 3 hours.';
  end if;
  foreach v_start in array p_starts loop
    if v_start <= now() then
      raise exception 'Please pick a date in the future.';
    end if;
  end loop;
  insert into public.sessions (table_id, starts_at, seats_total, duration_minutes)
  select p_table_id, unnest(p_starts), p_seats, p_minutes;
  return coalesce(array_length(p_starts, 1), 0);
end;
$$;

create or replace function public.remove_session(p_session_id uuid)
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
    where session_id = p_session_id and public.holds_seat(status)
  ) then
    raise exception 'Guests have asked for this date. Ask the Mehman team to move them first.';
  end if;
  delete from public.sessions where id = p_session_id;
end;
$$;

-- Same as before, plus diet tags.
create or replace function public.update_table(p_table_id uuid, p_edits jsonb)
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
    diet_tags = case when p_edits ? 'diet_tags'
      then coalesce(array(select jsonb_array_elements_text(p_edits -> 'diet_tags')), '{}')
      else v_table.diet_tags end,
    status = case when v_needs_review or v_table.status = 'rejected' then 'pending' else v_table.status end,
    updated_at = now()
  where id = p_table_id;

  if v_needs_review then
    perform public.notify_admins('A live table changed', trim(p_edits ->> 'title'), '/admin');
  end if;
  return v_needs_review;
end;
$$;

-- ------------------------------------------------------------- bookings

-- Requests a seat on a slot. Requests close 1 hour before the start, and
-- only launch cities take bookings. A phone number is needed for the
-- WhatsApp group; it's saved on the guest's profile.
drop function public.request_booking(uuid, int, text);
create function public.request_booking(p_session_id uuid, p_party_size int, p_note text, p_phone text default null)
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
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), '');
  v_booking uuid;
begin
  if v_guest is null then
    raise exception 'Please log in to request a seat.';
  end if;

  select s.* into v_session from public.sessions s
  join public.tables t on t.id = s.table_id
  where s.id = p_session_id and t.status = 'approved' and public.slot_closes_at(s.starts_at) > now()
  for update of s;
  if not found then
    raise exception 'Requests for this date have closed.';
  end if;
  select * into v_table from public.tables where id = v_session.table_id;
  select * into v_host from public.hosts where id = v_table.host_id;

  if not exists (select 1 from public.cities where id = v_host.city_id and accepting) then
    raise exception 'Bookings in this city open soon.';
  end if;
  if v_host.user_id = v_guest then
    raise exception 'You can''t book your own table.';
  end if;
  if exists (
    select 1 from public.bookings
    where session_id = p_session_id and guest_id = v_guest and public.holds_seat(status)
  ) then
    raise exception 'You''ve already asked for this date.';
  end if;
  if p_party_size < 1 or public.seats_left(p_session_id) < p_party_size then
    raise exception 'Not enough seats left on this date.';
  end if;

  if v_phone is not null then
    if v_phone !~ '^\+?[0-9]{10,13}$' then
      raise exception 'That phone number doesn''t look right.';
    end if;
    update public.profiles set phone = v_phone where id = v_guest;
  end if;
  if not exists (select 1 from public.profiles where id = v_guest and nullif(trim(phone), '') is not null) then
    raise exception 'Please add a WhatsApp number so we can set up your group.';
  end if;

  insert into public.bookings (session_id, guest_id, party_size, note, price_per_guest_inr, deposit_inr)
  values (p_session_id, v_guest, p_party_size, nullif(trim(p_note), ''), v_table.price_per_guest_inr,
    least(500, p_party_size * v_table.price_per_guest_inr))
  returning id into v_booking;

  select nullif(trim(full_name), '') into v_name from public.profiles where id = v_guest;
  perform public.notify(
    v_host.user_id,
    'New request from ' || coalesce(split_part(v_name, ' ', 1), 'a guest'),
    public.plural(p_party_size, 'guest') || ' · ' || public.short_date(v_session.starts_at)
      || ' · answer within 6 hours',
    '/host/requests'
  );
  return v_booking;
end;
$$;

-- Host and guest move a booking along the deposit flow:
--   host:  requested -> awaiting_deposit (accept) or declined
--   guest: awaiting_deposit -> deposit_claimed ("I've paid")
--   host:  deposit_claimed -> confirmed ("Deposit received")
--          or in_review ("Not received", the team settles it)
--   guest: cancel before the slot -> guest_cancelled (more than 24 hours
--          before: deposit back; within 24 hours: host keeps it)
--   host:  confirmed or completed -> no_show, from the start of the slot
--          until 24 hours after it ends; host keeps the deposit
-- Hosts have no cancel: the team does it with admin_update_booking().
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
  v_upi text;
  v_guest_name text;
  v_is_host boolean;
  v_is_guest boolean;
  v_ends timestamptz;
  v_deposit text;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;
  select * into v_session from public.sessions where id = v_booking.session_id;
  select * into v_table from public.tables where id = v_session.table_id;
  select * into v_host from public.hosts where id = v_table.host_id;
  select upi_id into v_upi from public.host_private where host_id = v_host.id;
  select split_part(coalesce(nullif(trim(full_name), ''), 'A guest'), ' ', 1) into v_guest_name
  from public.profiles where id = v_booking.guest_id;

  v_is_host := v_host.user_id = v_user;
  v_is_guest := v_booking.guest_id = v_user;
  v_ends := public.slot_ends_at(v_session.starts_at, v_session.duration_minutes);
  v_deposit := v_booking.deposit_status;

  if v_is_host and v_booking.status = 'requested' and p_status = 'awaiting_deposit' then
    if v_upi is null then
      raise exception 'Add your UPI ID under My table before accepting, so the guest can pay the deposit.';
    end if;
    if public.slot_closes_at(v_session.starts_at) <= now() then
      raise exception 'Bookings for this slot have closed.';
    end if;
  elsif v_is_host and v_booking.status = 'requested' and p_status = 'declined' then
    null;
  elsif v_is_guest and v_booking.status = 'awaiting_deposit' and p_status = 'deposit_claimed' then
    v_deposit := 'claimed';
  elsif v_is_host and v_booking.status = 'deposit_claimed' and p_status = 'confirmed' then
    v_deposit := 'received';
  elsif v_is_host and v_booking.status = 'deposit_claimed' and p_status = 'in_review' then
    null;
  elsif v_is_guest and p_status = 'guest_cancelled'
    and v_booking.status in ('requested', 'awaiting_deposit', 'deposit_claimed', 'confirmed', 'accepted')
    and v_session.starts_at > now() then
    if v_booking.status in ('deposit_claimed', 'confirmed') then
      v_deposit := case when v_session.starts_at - now() > interval '24 hours' then 'refund_due' else 'kept' end;
    end if;
  elsif v_is_host and p_status = 'no_show'
    and v_booking.status in ('confirmed', 'completed', 'accepted')
    and now() >= v_session.starts_at and now() <= v_ends + interval '24 hours' then
    v_deposit := case when v_booking.deposit_inr > 0 then 'kept' else 'none' end;
  else
    raise exception 'That change isn''t allowed.';
  end if;

  update public.bookings set
    status = p_status,
    deposit_status = v_deposit,
    accepted_at = case when p_status = 'awaiting_deposit' then now() else accepted_at end,
    deposit_claimed_at = case when p_status = 'deposit_claimed' then now() else deposit_claimed_at end,
    confirmed_at = case when p_status = 'confirmed' then now() else confirmed_at end,
    closed_at = case when p_status in ('declined', 'guest_cancelled', 'no_show') then now() else closed_at end,
    updated_at = now()
  where id = p_booking_id;

  if p_status = 'awaiting_deposit' then
    perform public.notify(v_booking.guest_id, v_host.display_name || ' accepted your request',
      'Pay the ₹' || v_booking.deposit_inr || ' deposit by UPI within 12 hours to confirm your seats.', '/bookings');
  elsif p_status = 'declined' then
    perform public.notify(v_booking.guest_id, v_host.display_name || ' can''t host you on this date',
      'Try another date or table.', '/bookings');
  elsif p_status = 'deposit_claimed' then
    perform public.notify(v_host.user_id, v_guest_name || ' says they''ve paid the deposit',
      'Check your UPI app for ₹' || v_booking.deposit_inr || ', then confirm.', '/host/requests');
  elsif p_status = 'confirmed' then
    perform public.notify(v_booking.guest_id, 'You''re confirmed for ' || v_table.title,
      'The address is in your booking. We''ll set up a WhatsApp group with ' || v_host.display_name || '.', '/bookings');
    perform public.notify_admins('WhatsApp group to create',
      v_table.title || ' · ' || public.short_date(v_session.starts_at), '/admin/bookings');
  elsif p_status = 'in_review' then
    perform public.notify(v_booking.guest_id, v_host.display_name || ' hasn''t received your deposit yet',
      'The Mehman team will be in touch to sort it out.', '/bookings');
    perform public.notify_admins('Deposit dispute to review',
      v_table.title || ' · ' || public.short_date(v_session.starts_at), '/admin/bookings');
  elsif p_status = 'guest_cancelled' then
    perform public.notify(v_host.user_id, v_guest_name || ' cancelled',
      public.plural(v_booking.party_size, 'seat') || ' freed up'
        || case v_deposit when 'refund_due' then '. Please refund the ₹' || v_booking.deposit_inr || ' deposit within 48 hours.'
                          when 'kept' then '. You keep the deposit (cancelled within 24 hours).' else '' end,
      '/host/requests');
  elsif p_status = 'no_show' then
    perform public.notify(v_booking.guest_id, v_host.display_name || ' marked you as a no-show',
      'If that''s wrong, tell the Mehman team.', '/bookings');
  end if;
end;
$$;

-- The guest confirms a refund reached them.
create function public.confirm_refund(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bookings set deposit_status = 'refunded', updated_at = now()
  where id = p_booking_id and guest_id = (select auth.uid()) and deposit_status = 'refund_due';
  if not found then
    raise exception 'There''s no refund to confirm on this booking.';
  end if;
end;
$$;

-- ---------------------------------------------------------------- timers

-- Moves bookings on when time runs out:
--   a request with no answer expires after 6 hours, or when requests for
--     the slot close (1 hour before), whichever is first
--   an unpaid deposit cancels the booking 12 hours after acceptance, or
--     when requests for the slot close, whichever is first
--   a claimed deposit the host never confirmed goes to the team once the
--     slot has ended
--   a confirmed booking is completed when its slot ends
-- Runs every 5 minutes from pg_cron, and the team can run it now from the
-- admin console. In demo mode the team can run it as if it were later.
create function public.run_booking_timers(p_hours_ahead int default 0)
returns table (expired int, cancelled_unpaid int, to_review int, completed int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_row record;
  v_expired int := 0;
  v_unpaid int := 0;
  v_review int := 0;
  v_completed int := 0;
begin
  -- Signed-in visitors must be admins. pg_cron and server code using the
  -- secret key have no signed-in user. Visitors (anon) can't execute it.
  if (select auth.uid()) is not null and not public.is_admin() then
    raise exception 'Only the Mehman team can run the timers.';
  end if;
  if coalesce(p_hours_ahead, 0) <> 0 then
    if not (select demo_mode from public.app_settings) then
      raise exception 'Skipping ahead only works on the demo database.';
    end if;
    if p_hours_ahead not between 0 and 168 then
      raise exception 'Skip ahead between 0 and 168 hours.';
    end if;
    v_now := v_now + make_interval(hours => p_hours_ahead);
  end if;

  for v_row in
    update public.bookings b set status = 'expired', closed_at = now(), updated_at = now()
    from public.sessions s
    where s.id = b.session_id and b.status = 'requested'
      and v_now >= least(b.created_at + interval '6 hours', public.slot_closes_at(s.starts_at))
    returning b.guest_id, s.table_id
  loop
    v_expired := v_expired + 1;
    perform public.notify(v_row.guest_id, 'Your request expired',
      'The host didn''t answer in time. Try another date or table.', '/bookings');
  end loop;

  for v_row in
    update public.bookings b set status = 'cancelled_unpaid', closed_at = now(), updated_at = now()
    from public.sessions s
    where s.id = b.session_id and b.status = 'awaiting_deposit'
      and v_now >= least(coalesce(b.accepted_at, b.updated_at) + interval '12 hours', public.slot_closes_at(s.starts_at))
    returning b.guest_id, s.table_id
  loop
    v_unpaid := v_unpaid + 1;
    perform public.notify(v_row.guest_id, 'Your booking was cancelled',
      'The deposit wasn''t paid in time, so the seats were released.', '/bookings');
  end loop;

  for v_row in
    update public.bookings b set status = 'in_review', updated_at = now()
    from public.sessions s
    where s.id = b.session_id and b.status = 'deposit_claimed'
      and v_now >= public.slot_ends_at(s.starts_at, s.duration_minutes)
    returning b.id
  loop
    v_review := v_review + 1;
  end loop;
  if v_review > 0 then
    perform public.notify_admins('Unconfirmed deposits to review', public.plural(v_review, 'booking'), '/admin/bookings');
  end if;

  for v_row in
    update public.bookings b set status = 'completed', closed_at = now(), updated_at = now()
    from public.sessions s, public.tables t, public.hosts h
    where s.id = b.session_id and t.id = s.table_id and h.id = t.host_id
      and b.status in ('confirmed', 'accepted')
      and v_now >= public.slot_ends_at(s.starts_at, s.duration_minutes)
    returning b.guest_id, t.title, h.user_id as host_user, h.display_name
  loop
    v_completed := v_completed + 1;
    perform public.notify(v_row.guest_id, 'How was ' || v_row.title || '?',
      'Leave a review for ' || v_row.display_name, '/bookings');
    perform public.notify(v_row.host_user, 'Rate your guest',
      'How was hosting for ' || v_row.title || '?', '/host/requests');
  end loop;

  return query select v_expired, v_unpaid, v_review, v_completed;
end;
$$;

revoke execute on function public.run_booking_timers(int) from public, anon;

-- Every 5 minutes, where pg_cron is available (it is on Supabase).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('mehman-booking-timers', '*/5 * * * *', 'select public.run_booking_timers()');
  end if;
exception when others then
  raise notice 'pg_cron not set up: %', sqlerrm;
end;
$$;

-- ----------------------------------------------------------------- admin

-- The team can put any booking in any state, record what happened to the
-- deposit, and leave a note (refunds, disputes, calls made).
create function public.admin_update_booking(
  p_booking_id uuid,
  p_status public.booking_status,
  p_deposit_status text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_table public.tables;
  v_host public.hosts;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_status public.booking_status;
  v_deposit text;
begin
  if not public.is_admin() then
    raise exception 'Only the Mehman team can change bookings.';
  end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;
  select t.* into v_table from public.sessions s join public.tables t on t.id = s.table_id
  where s.id = v_booking.session_id;
  select * into v_host from public.hosts where id = v_table.host_id;

  v_status := coalesce(p_status, v_booking.status);
  v_deposit := coalesce(nullif(p_deposit_status, ''), v_booking.deposit_status);
  -- A host cancellation owes the guest their deposit back, unless the team
  -- says otherwise.
  if v_status = 'host_cancelled' and v_booking.status <> 'host_cancelled' and nullif(p_deposit_status, '') is null
    and v_booking.deposit_status in ('claimed', 'received') then
    v_deposit := 'refund_due';
  end if;
  if v_status = v_booking.status and v_deposit = v_booking.deposit_status and v_note is null then
    raise exception 'Nothing to change.';
  end if;

  update public.bookings set
    status = v_status,
    deposit_status = v_deposit,
    confirmed_at = case when v_status = 'confirmed' then coalesce(confirmed_at, now()) else confirmed_at end,
    closed_at = case when v_status in ('completed', 'declined', 'expired', 'cancelled_unpaid',
      'host_cancelled', 'guest_cancelled', 'no_show') then coalesce(closed_at, now()) else closed_at end,
    updated_at = now()
  where id = p_booking_id;

  if v_status <> v_booking.status or v_deposit <> v_booking.deposit_status or v_note is not null then
    insert into public.booking_notes (booking_id, author_id, body)
    values (p_booking_id, (select auth.uid()),
      case when v_status <> v_booking.status then 'Status: ' || v_booking.status || ' → ' || v_status || '. ' else '' end
      || case when v_deposit <> v_booking.deposit_status then 'Deposit: ' || v_booking.deposit_status || ' → ' || v_deposit || '. ' else '' end
      || coalesce(v_note, ''));
  end if;

  if v_status = 'host_cancelled' and v_booking.status <> 'host_cancelled' then
    perform public.notify(v_booking.guest_id, v_host.display_name || ' had to cancel',
      case when v_deposit = 'refund_due' then 'Your ₹' || v_booking.deposit_inr || ' deposit will be refunded by UPI within 48 hours. '
        else '' end || 'You can rate the host from your booking.', '/bookings');
    perform public.notify(v_host.user_id, 'Mehman cancelled a booking for you',
      case when v_deposit = 'refund_due' then 'Please refund the ₹' || v_booking.deposit_inr || ' deposit by UPI within 48 hours.'
        else 'The guest has been told.' end, '/host/requests');
  elsif v_status <> v_booking.status then
    perform public.notify(v_booking.guest_id, 'Your booking was updated',
      v_table.title || ' is now ' || replace(v_status::text, '_', ' ') || '.', '/bookings');
  end if;
end;
$$;

-- Confirmed bookings that still need a WhatsApp group: both numbers and a
-- suggested group name.
create function public.admin_whatsapp_queue()
returns table (
  booking_id uuid,
  group_name text,
  table_title text,
  starts_at timestamptz,
  party_size int,
  host_name text,
  host_phone text,
  guest_name text,
  guest_phone text,
  guest_email text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only the Mehman team can see this.';
  end if;
  return query
  select b.id,
    left(t.title, 40) || ' · ' || to_char(s.starts_at at time zone 'Asia/Kolkata', 'FMDD Mon'),
    t.title, s.starts_at, b.party_size, h.display_name, hp.contact_phone,
    coalesce(nullif(trim(p.full_name), ''), 'Guest'), p.phone, p.email
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  join public.tables t on t.id = s.table_id
  join public.hosts h on h.id = t.host_id
  left join public.host_private hp on hp.host_id = h.id
  join public.profiles p on p.id = b.guest_id
  where b.status = 'confirmed' and b.whatsapp_group_at is null
  order by s.starts_at;
end;
$$;

create function public.mark_whatsapp_group_created(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_host_user uuid;
  v_title text;
begin
  if not public.is_admin() then
    raise exception 'Only the Mehman team can do this.';
  end if;
  update public.bookings set whatsapp_group_at = now(), updated_at = now()
  where id = p_booking_id and status = 'confirmed' and whatsapp_group_at is null
  returning * into v_booking;
  if v_booking.id is null then
    raise exception 'That booking doesn''t need a group.';
  end if;
  select h.user_id, t.title into v_host_user, v_title
  from public.sessions s join public.tables t on t.id = s.table_id join public.hosts h on h.id = t.host_id
  where s.id = v_booking.session_id;
  perform public.notify(v_booking.guest_id, 'Check WhatsApp for your group',
    'We''ve added you and your host for ' || v_title || '.', '/bookings');
  perform public.notify(v_host_user, 'Check WhatsApp for your group',
    'We''ve added you and your guest for ' || v_title || '.', '/host/requests');
end;
$$;

-- In-app chat closes once the WhatsApp group exists; that's where the
-- conversation continues.
create function public.guard_chat_after_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.conversations c
    join public.sessions s on s.table_id = c.table_id
    join public.bookings b on b.session_id = s.id and b.guest_id = c.guest_id
    where c.id = new.conversation_id and b.status = 'confirmed' and b.whatsapp_group_at is not null
  ) then
    raise exception 'This chat has moved to your WhatsApp group.';
  end if;
  return new;
end;
$$;

create trigger messages_guard_group
  before insert on public.messages
  for each row execute function public.guard_chat_after_group();

-- --------------------------------------------------------------- reviews

-- Guests review a meal once it's happened, or rate the host after the
-- host cancelled on them.
create or replace function public.add_review(p_booking_id uuid, p_rating int, p_text text)
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
  if v_booking.status not in ('completed', 'host_cancelled') then
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

-- Hosts rate the guest after a completed meal.
create function public.add_guest_review(p_booking_id uuid, p_rating int, p_text text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_host uuid := public.my_host_id();
  v_review uuid;
begin
  if not public.is_booking_host(p_booking_id) then
    raise exception 'You can only rate guests at your own table.';
  end if;
  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking.status <> 'completed' then
    raise exception 'You can rate a guest once the meal has happened.';
  end if;
  if exists (select 1 from public.guest_reviews where booking_id = p_booking_id) then
    raise exception 'You''ve already rated this guest.';
  end if;
  if p_rating not between 1 and 5 then
    raise exception 'Please choose 1 to 5 stars.';
  end if;
  insert into public.guest_reviews (booking_id, guest_id, host_id, rating, body)
  values (p_booking_id, v_booking.guest_id, v_host, p_rating, trim(coalesce(p_text, '')))
  returning id into v_review;
  return v_review;
end;
$$;

-- ----------------------------------------------------- internal helpers

revoke execute on function public.holds_seat(public.booking_status) from anon;
revoke execute on function public.booking_payment(uuid) from anon;
revoke execute on function public.booking_guests(uuid[]) from anon;
revoke execute on function public.confirm_refund(uuid) from anon;
revoke execute on function public.add_slots(uuid, timestamptz[], int, int) from anon;
revoke execute on function public.admin_update_booking(uuid, public.booking_status, text, text) from anon;
revoke execute on function public.admin_whatsapp_queue() from anon;
revoke execute on function public.mark_whatsapp_group_created(uuid) from anon;
revoke execute on function public.add_guest_review(uuid, int, text) from anon;
revoke execute on function public.request_booking(uuid, int, text, text) from anon;
