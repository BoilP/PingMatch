-- ============================================================
-- PingMatch Database Schema
-- Run this in Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------
-- PROFILES
-- -------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  age integer check (age >= 10 and age <= 100),
  city text not null default 'София',
  bio text,
  skill_level text not null default 'Начинаещ'
    check (skill_level in ('Начинаещ','Аматьор','Средно ниво','Напреднал','Професионалист')),
  rank_points integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------------------------------------
-- TABLE LOCATIONS
-- -------------------------------------------------------
create table public.table_locations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text,
  lat decimal(10, 8) not null,
  lng decimal(11, 8) not null,
  tables_count integer not null default 1,
  is_available boolean not null default true,
  opening_hours text,
  price_per_hour decimal(10, 2),
  created_at timestamptz not null default now()
);

alter table public.table_locations enable row level security;

create policy "Locations are viewable by authenticated users"
  on public.table_locations for select to authenticated using (true);

-- Seed locations in Sofia
insert into public.table_locations (name, address, lat, lng, tables_count, is_available, opening_hours, price_per_hour) values
  ('Национална спортна зала', 'бул. Васил Левски 75, София', 42.6970, 23.3247, 8, true, '08:00 - 22:00', 5.00),
  ('Зала "Пинг-Понг" Студентски град', 'Студентски град, бл. 56А', 42.6490, 23.3560, 4, true, '10:00 - 20:00', 4.00),
  ('СК Левски', 'ул. Тодорини Кукли 47', 42.7004, 23.3311, 6, true, '09:00 - 21:00', 6.00),
  ('Зала "Арена"', 'бул. Черни връх 51Б', 42.6719, 23.3197, 3, false, '10:00 - 22:00', 5.00),
  ('Тенис клуб Витоша', 'ул. Рилски езера 20', 42.6543, 23.2987, 2, true, '08:00 - 20:00', 7.00),
  ('Зала "Спорт Палас"', 'бул. Г.М. Димитров 42', 42.7089, 23.3456, 5, true, '10:00 - 21:00', 4.50),
  ('НСА Васил Левски', 'Студентски град', 42.6521, 23.3601, 10, true, '08:00 - 22:00', 3.00);

-- -------------------------------------------------------
-- MATCHES (swipes)
-- -------------------------------------------------------
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  user1_action text check (user1_action in ('like', 'pass')),
  user2_action text check (user2_action in ('like', 'pass')),
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_match check (user1_id != user2_id),
  unique (user1_id, user2_id)
);

alter table public.matches enable row level security;

create policy "Users can view their own matches"
  on public.matches for select to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can insert swipes"
  on public.matches for insert to authenticated
  with check (auth.uid() = user1_id);

create policy "Users can update swipes they are part of"
  on public.matches for update to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- -------------------------------------------------------
-- MESSAGES
-- -------------------------------------------------------
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Match participants can view messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

create policy "Match participants can send messages"
  on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.status = 'matched'
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- -------------------------------------------------------
-- GAME RESULTS
-- -------------------------------------------------------
create table public.game_results (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  winner_id uuid references public.profiles(id) not null,
  loser_id uuid references public.profiles(id) not null,
  winner_score integer,
  loser_score integer,
  created_at timestamptz not null default now()
);

alter table public.game_results enable row level security;

create policy "Game results viewable by authenticated users"
  on public.game_results for select to authenticated using (true);

create policy "Match participants can insert game results"
  on public.game_results for insert to authenticated
  with check (auth.uid() = winner_id or auth.uid() = loser_id);

-- -------------------------------------------------------
-- HANDLE SWIPE FUNCTION
-- Returns: {matched: boolean, match_id: uuid|null}
-- -------------------------------------------------------
create or replace function public.handle_swipe(
  p_user_id uuid,
  p_target_id uuid,
  p_action text
) returns json language plpgsql security definer as $$
declare
  v_existing record;
  v_new_id uuid;
begin
  -- Check if target already liked this user
  select * into v_existing
  from public.matches
  where user1_id = p_target_id
    and user2_id = p_user_id
    and user1_action = 'like';

  if found and p_action = 'like' then
    -- Mutual like → match!
    update public.matches
    set user2_action = 'like',
        status = 'matched',
        updated_at = now()
    where id = v_existing.id;

    return json_build_object('matched', true, 'match_id', v_existing.id);
  else
    -- Record the swipe
    insert into public.matches (user1_id, user2_id, user1_action, status)
    values (
      p_user_id,
      p_target_id,
      p_action,
      case when p_action = 'pass' then 'rejected' else 'pending' end
    )
    on conflict (user1_id, user2_id) do update
      set user1_action = p_action,
          updated_at = now();

    return json_build_object('matched', false, 'match_id', null);
  end if;
end;
$$;

-- -------------------------------------------------------
-- RECORD GAME RESULT FUNCTION (updates rank_points)
-- -------------------------------------------------------
create or replace function public.record_game_result(
  p_match_id uuid,
  p_winner_id uuid,
  p_loser_id uuid,
  p_winner_score integer default null,
  p_loser_score integer default null
) returns void language plpgsql security definer as $$
begin
  insert into public.game_results (match_id, winner_id, loser_id, winner_score, loser_score)
  values (p_match_id, p_winner_id, p_loser_id, p_winner_score, p_loser_score);

  -- Update winner stats
  update public.profiles
  set wins = wins + 1,
      rank_points = rank_points + 25,
      updated_at = now()
  where id = p_winner_id;

  -- Update loser stats (floor at 0)
  update public.profiles
  set losses = losses + 1,
      rank_points = greatest(0, rank_points - 15),
      updated_at = now()
  where id = p_loser_id;
end;
$$;

-- -------------------------------------------------------
-- Enable Realtime for messages
-- -------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
