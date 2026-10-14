-- Mehman: accounts, hosts, tables (dining experiences), dates and bookings.
-- Every table has row-level security. Signed-in users (Google, email or
-- phone) have the `authenticated` role; visitors have `anon`.

-- ---------------------------------------------------------------- types

create type public.user_role as enum ('guest', 'host', 'admin');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.table_status as enum ('draft', 'pending', 'approved', 'paused', 'rejected');
create type public.veg_type as enum ('veg', 'non_veg', 'both');
create type public.booking_status as enum ('requested', 'accepted', 'declined', 'cancelled', 'completed');

-- ------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'guest',
  created_at timestamptz not null default now()
);

-- A profile for every new account, filled from Google where available.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    new.phone
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- --------------------------------------------------------------- cities

create table public.cities (
  id text primary key,
  name text not null,
  greeting_local text not null,
  greeting_english text not null,
  lat double precision not null,
  lng double precision not null,
  sort_order int not null default 0
);

insert into public.cities (id, name, greeting_local, greeting_english, lat, lng, sort_order) values
  ('bengaluru', 'Bengaluru', 'Banni, oota maadi', 'Come, have a meal', 12.9716, 77.5946, 1),
  ('kochi', 'Kochi', 'Swagatham', 'Welcome', 9.9312, 76.2673, 2),
  ('lucknow', 'Lucknow', 'Tashreef laaiye', 'Please, come in', 26.8467, 80.9462, 3),
  ('jaipur', 'Jaipur', 'Padharo mhare des', 'Welcome to our land', 26.9124, 75.7873, 4),
  ('kolkata', 'Kolkata', 'Esho, kheye jao', 'Come, eat before you go', 22.5726, 88.3639, 5),
  ('hyderabad', 'Hyderabad', 'Khush aamdeed', 'Welcome', 17.385, 78.4867, 6);

-- ---------------------------------------------------------------- hosts

create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  city_id text not null references public.cities (id),
  display_name text not null,
  bio text not null,
  languages text[] not null default '{}',
  status public.review_status not null default 'pending',
  review_note text,
  created_at timestamptz not null default now()
);

-- Kept apart from `hosts` so the address can never leak through a public
-- read: only the host, admins and guests with an accepted booking see it.
create table public.host_private (
  host_id uuid primary key references public.hosts (id) on delete cascade,
  address text not null,
  contact_phone text not null
);

-- ----------------------------------------------------- tables & dates

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts (id) on delete cascade,
  title text not null,
  story text not null,
  menu text not null,
  cuisine text not null,
  veg public.veg_type not null,
  price_per_guest_inr int not null check (price_per_guest_inr between 100 and 50000),
  max_guests int not null check (max_guests between 1 and 20),
  photo_paths text[] not null default '{}',
  status public.table_status not null default 'draft',
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables (id) on delete cascade,
  starts_at timestamptz not null,
  seats_total int not null check (seats_total between 1 and 20),
  created_at timestamptz not null default now()
);

create index sessions_table_starts on public.sessions (table_id, starts_at);

-- -------------------------------------------------------------- bookings

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  party_size int not null check (party_size between 1 and 20),
  note text,
  status public.booking_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_guest on public.bookings (guest_id);
create index bookings_session on public.bookings (session_id);

-- ---------------------------------------------------------- helpers

create function public.my_host_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.hosts where user_id = (select auth.uid());
$$;

-- Seats still free on a date: accepted and pending requests both hold seats.
create function public.seats_left(p_session_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select s.seats_total - coalesce((
    select sum(b.party_size)::int from public.bookings b
    where b.session_id = s.id and b.status in ('requested', 'accepted')
  ), 0)
  from public.sessions s where s.id = p_session_id;
$$;

-- Requests a seat. Locks the date so two guests can't take the last seats
-- at the same moment.
create function public.request_booking(p_session_id uuid, p_party_size int, p_note text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest uuid := (select auth.uid());
  v_booking uuid;
begin
  if v_guest is null then
    raise exception 'Please log in to request a seat.';
  end if;

  perform 1 from public.sessions s
    join public.tables t on t.id = s.table_id
    where s.id = p_session_id and t.status = 'approved' and s.starts_at > now()
    for update of s;
  if not found then
    raise exception 'This date is no longer available.';
  end if;

  if exists (
    select 1 from public.sessions s
    join public.tables t on t.id = s.table_id
    join public.hosts h on h.id = t.host_id
    where s.id = p_session_id and h.user_id = v_guest
  ) then
    raise exception 'You can''t book your own table.';
  end if;

  if public.seats_left(p_session_id) < p_party_size then
    raise exception 'Not enough seats left on this date.';
  end if;

  insert into public.bookings (session_id, guest_id, party_size, note)
  values (p_session_id, v_guest, p_party_size, nullif(trim(p_note), ''))
  returning id into v_booking;
  return v_booking;
end;
$$;

-- Host and guest move a booking through its life; nobody else can.
create function public.set_booking_status(p_booking_id uuid, p_status public.booking_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_booking public.bookings;
  v_is_host boolean;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;

  select exists (
    select 1 from public.sessions s
    join public.tables t on t.id = s.table_id
    join public.hosts h on h.id = t.host_id
    where s.id = v_booking.session_id and h.user_id = v_user
  ) into v_is_host;

  if v_is_host and v_booking.status = 'requested' and p_status in ('accepted', 'declined') then
    null;
  elsif v_is_host and v_booking.status = 'accepted' and p_status in ('completed', 'cancelled') then
    null;
  elsif v_booking.guest_id = v_user and v_booking.status in ('requested', 'accepted') and p_status = 'cancelled' then
    null;
  else
    raise exception 'That change isn''t allowed.';
  end if;

  update public.bookings set status = p_status, updated_at = now() where id = p_booking_id;
end;
$$;

-- The host's address and phone, for a guest whose booking was accepted.
create function public.booking_contact(p_booking_id uuid)
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
    and b.status in ('accepted', 'completed');
$$;

-- --------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.hosts enable row level security;
alter table public.host_private enable row level security;
alter table public.tables enable row level security;
alter table public.sessions enable row level security;
alter table public.bookings enable row level security;

-- profiles: you see and edit yourself; hosts see their guests' names.
create policy "Read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "Hosts read their guests" on public.profiles
  for select to authenticated using (
    exists (
      select 1 from public.bookings b
      join public.sessions s on s.id = b.session_id
      join public.tables t on t.id = s.table_id
      where b.guest_id = profiles.id and t.host_id = public.my_host_id()
    )
  );
create policy "Update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Roles only change through admin approval, never from the browser.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- cities: public.
create policy "Anyone reads cities" on public.cities
  for select to anon, authenticated using (true);

-- hosts: approved hosts are public; you manage your own application.
create policy "Read approved or own host" on public.hosts
  for select to anon, authenticated using (
    status = 'approved' or user_id = (select auth.uid()) or public.is_admin()
  );
create policy "Apply as host" on public.hosts
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending');
create policy "Edit own host profile" on public.hosts
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- Review status is set by Mehman only.
revoke update on public.hosts from anon, authenticated;
grant update (city_id, display_name, bio, languages) on public.hosts to authenticated;

-- host_private: only the host and admins (guests use booking_contact()).
create policy "Host reads own private details" on public.host_private
  for select to authenticated using (host_id = public.my_host_id() or public.is_admin());
create policy "Host adds own private details" on public.host_private
  for insert to authenticated with check (host_id = public.my_host_id());
create policy "Host edits own private details" on public.host_private
  for update to authenticated using (host_id = public.my_host_id())
  with check (host_id = public.my_host_id());

-- tables: approved ones are public; hosts manage their own.
create policy "Read approved or own tables" on public.tables
  for select to anon, authenticated using (
    status = 'approved' or host_id = public.my_host_id() or public.is_admin()
  );
create policy "Host creates tables" on public.tables
  for insert to authenticated with check (
    host_id = public.my_host_id() and status in ('draft', 'pending')
  );
create policy "Host edits own tables" on public.tables
  for update to authenticated using (host_id = public.my_host_id())
  with check (host_id = public.my_host_id() and status in ('draft', 'pending', 'paused', 'approved'));
revoke update on public.tables from anon, authenticated;
grant update (title, story, menu, cuisine, veg, price_per_guest_inr, max_guests, photo_paths, status)
  on public.tables to authenticated;

-- A host can pause or resume an approved table, or submit a draft, but can't
-- approve their own table.
-- Runs as the caller (not security definer) so current_user tells signed-in
-- visitors apart from trusted server code using the secret key.
create function public.guard_table_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if new.status is distinct from old.status and not (
    (old.status = 'draft' and new.status = 'pending')
    or (old.status = 'rejected' and new.status = 'pending')
    or (old.status = 'approved' and new.status = 'paused')
    or (old.status = 'paused' and new.status = 'approved')
  ) then
    raise exception 'That status change needs Mehman''s review.';
  end if;
  return new;
end;
$$;

create trigger tables_guard_status
  before update on public.tables
  for each row execute function public.guard_table_status();

-- sessions: dates of approved tables are public; hosts manage their own.
create policy "Read sessions of visible tables" on public.sessions
  for select to anon, authenticated using (
    exists (select 1 from public.tables t where t.id = sessions.table_id)
  );
create policy "Host manages own sessions" on public.sessions
  for all to authenticated using (
    exists (select 1 from public.tables t where t.id = sessions.table_id and t.host_id = public.my_host_id())
  ) with check (
    exists (select 1 from public.tables t where t.id = sessions.table_id and t.host_id = public.my_host_id())
  );

-- bookings: guests see their own, hosts see requests for their tables.
-- Creating and changing bookings goes through the functions above.
create policy "Guest reads own bookings" on public.bookings
  for select to authenticated using (guest_id = (select auth.uid()) or public.is_admin());
create policy "Host reads bookings for own tables" on public.bookings
  for select to authenticated using (
    exists (
      select 1 from public.sessions s
      join public.tables t on t.id = s.table_id
      where s.id = bookings.session_id and t.host_id = public.my_host_id()
    )
  );

-- ------------------------------------------------------------ storage

insert into storage.buckets (id, name, public)
values ('table-photos', 'table-photos', true);

-- Photos live under <user id>/..., so each host writes only their folder.
create policy "Host uploads own photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'table-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Host deletes own photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'table-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
