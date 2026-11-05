-- Hosts pin their own neighbourhood on the map, and guests and hosts can
-- message each other about a table.

-- ------------------------------------------------------------ host area

-- Saves where a host roughly is. The point is moved 250-500 m in a random
-- direction before it's stored, so even a "use my current location" pin
-- shows the neighbourhood and never the house. It must be within 60 km of
-- the host's city.
create function public.set_my_area(p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host public.hosts;
  v_city public.cities;
  v_angle double precision := random() * 2 * pi();
  v_metres double precision := 250 + random() * 250;
begin
  select * into v_host from public.hosts where user_id = (select auth.uid());
  if v_host.id is null then
    raise exception 'Only hosts can set a neighbourhood.';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'That location doesn''t look right.';
  end if;
  select * into v_city from public.cities where id = v_host.city_id;
  -- Rough distance in km; plenty for "is this the right city".
  if sqrt(power((p_lat - v_city.lat) * 111, 2) + power((p_lng - v_city.lng) * 111 * cos(radians(v_city.lat)), 2)) > 60 then
    raise exception 'That spot is outside %. Pick a place in your city.', v_city.name;
  end if;
  update public.hosts set
    area_lat = p_lat + (v_metres * cos(v_angle)) / 111320,
    area_lng = p_lng + (v_metres * sin(v_angle)) / (111320 * cos(radians(p_lat)))
  where id = v_host.id;
end;
$$;

-- ----------------------------------------------------------------- chat

-- One conversation per guest per table, started by the guest (or by the
-- host once that guest has asked for a seat).
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  guest_read_at timestamptz not null default now(),
  host_read_at timestamptz not null default 'epoch',
  created_at timestamptz not null default now(),
  unique (table_id, guest_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation on public.messages (conversation_id, created_at);
create index conversations_guest on public.conversations (guest_id);
create index conversations_table on public.conversations (table_id);

create function public.is_in_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    join public.tables t on t.id = c.table_id
    join public.hosts h on h.id = t.host_id
    where c.id = p_conversation_id
      and (c.guest_id = (select auth.uid()) or h.user_id = (select auth.uid()))
  );
$$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Only the two people in a conversation read it; writes go through the
-- functions below.
create policy "Members read conversations" on public.conversations
  for select to authenticated using (public.is_in_conversation(id));
create policy "Members read messages" on public.messages
  for select to authenticated using (public.is_in_conversation(conversation_id));

revoke insert, update, delete on public.conversations, public.messages from anon, authenticated;

-- Sends a message about a table. A guest writes as themselves; the host
-- writes to a guest who has already messaged or asked for a seat.
create function public.send_message(p_table_id uuid, p_guest_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_body text := trim(p_body);
  v_table public.tables;
  v_host public.hosts;
  v_conv public.conversations;
  v_from_guest boolean;
  v_to uuid;
  v_to_read_at timestamptz;
  v_name text;
  v_href text;
  v_new boolean := false;
begin
  if v_user is null then
    raise exception 'Please log in to send a message.';
  end if;
  if v_body is null or v_body = '' then
    raise exception 'Write a message first.';
  end if;
  if char_length(v_body) > 2000 then
    raise exception 'That message is too long. Please keep it under 2000 characters.';
  end if;
  select * into v_table from public.tables where id = p_table_id;
  select * into v_host from public.hosts where id = v_table.host_id;
  if v_table.id is null then
    raise exception 'That table isn''t available.';
  end if;

  v_from_guest := v_user = p_guest_id;
  if v_from_guest then
    if v_host.user_id = v_user then
      raise exception 'This is your own table.';
    end if;
  elsif v_host.user_id <> v_user then
    raise exception 'You can''t message about this table.';
  end if;

  select * into v_conv from public.conversations where table_id = p_table_id and guest_id = p_guest_id;
  if v_conv.id is null then
    if v_from_guest then
      if v_table.status <> 'approved' and not public.has_booked_table(p_table_id) then
        raise exception 'That table isn''t taking guests right now.';
      end if;
    elsif not exists (
      select 1 from public.bookings b
      join public.sessions s on s.id = b.session_id
      where s.table_id = p_table_id and b.guest_id = p_guest_id
    ) then
      raise exception 'You can message guests once they''ve messaged you or asked for a seat.';
    end if;
    insert into public.conversations (table_id, guest_id) values (p_table_id, p_guest_id)
    returning * into v_conv;
    v_new := true;
  end if;

  insert into public.messages (conversation_id, sender_id, body) values (v_conv.id, v_user, v_body);

  -- The other person hears about it once per unread stretch, not per message.
  if v_from_guest then
    v_to := v_host.user_id;
    v_to_read_at := v_conv.host_read_at;
    v_href := '/host/messages?table=' || p_table_id || '&guest=' || p_guest_id;
    select split_part(coalesce(nullif(trim(full_name), ''), 'A guest'), ' ', 1) into v_name
    from public.profiles where id = v_user;
    update public.conversations set last_message_at = now(), guest_read_at = now() where id = v_conv.id;
  else
    v_to := p_guest_id;
    v_to_read_at := v_conv.guest_read_at;
    v_href := '/messages?table=' || p_table_id || '&guest=' || p_guest_id;
    v_name := v_host.display_name;
    update public.conversations set last_message_at = now(), host_read_at = now() where id = v_conv.id;
  end if;

  if v_new or v_to_read_at >= v_conv.last_message_at then
    perform public.notify(v_to, 'New message from ' || v_name, left(v_body, 120), v_href);
  end if;
  return v_conv.id;
end;
$$;

create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  update public.conversations set guest_read_at = now()
  where id = p_conversation_id and guest_id = v_user;
  update public.conversations c set host_read_at = now()
  from public.tables t, public.hosts h
  where c.id = p_conversation_id and t.id = c.table_id and h.id = t.host_id and h.user_id = v_user;
end;
$$;

-- Everyone's inbox, both sides: who it's with, the table, the last message
-- and whether it's unread. Guests appear to hosts by first name only.
create function public.my_conversations()
returns table (
  id uuid,
  table_id uuid,
  guest_id uuid,
  as_host boolean,
  other_name text,
  table_title text,
  last_body text,
  last_sender uuid,
  last_message_at timestamptz,
  unread boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.table_id,
    c.guest_id,
    h.user_id = (select auth.uid()) as as_host,
    case when h.user_id = (select auth.uid())
      then split_part(coalesce(nullif(trim(p.full_name), ''), 'Guest'), ' ', 1)
      else h.display_name end,
    t.title,
    m.body,
    m.sender_id,
    c.last_message_at,
    c.last_message_at > case when h.user_id = (select auth.uid()) then c.host_read_at else c.guest_read_at end
      and m.sender_id <> (select auth.uid())
  from public.conversations c
  join public.tables t on t.id = c.table_id
  join public.hosts h on h.id = t.host_id
  join public.profiles p on p.id = c.guest_id
  left join lateral (
    select body, sender_id from public.messages
    where conversation_id = c.id order by created_at desc limit 1
  ) m on true
  where c.guest_id = (select auth.uid()) or h.user_id = (select auth.uid())
  order by c.last_message_at desc;
$$;

revoke execute on function public.set_my_area(double precision, double precision) from anon;
revoke execute on function public.send_message(uuid, uuid, text) from anon;
revoke execute on function public.mark_conversation_read(uuid) from anon;
revoke execute on function public.my_conversations() from anon;

-- New messages arrive live in an open chat.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
