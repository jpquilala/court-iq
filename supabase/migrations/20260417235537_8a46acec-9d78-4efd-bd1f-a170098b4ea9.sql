-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  nickname text,
  position text,
  dominant_hand text,
  age int,
  height_cm numeric,
  weight_kg numeric,
  city text,
  bio text,
  avatar_url text,
  preferred_courts text[] default '{}',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by anyone"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'nickname', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_date date not null,
  game_time time,
  location text,
  court_name text,
  opponent_name text,
  game_type text not null default 'pickup',
  minutes_played int,
  points int not null default 0,
  rebounds int not null default 0,
  steals int not null default 0,
  blocks int not null default 0,
  turnovers int not null default 0,
  shots_taken int not null default 0,
  shots_made int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index games_user_date_idx on public.games (user_id, game_date desc);
create index games_user_court_idx on public.games (user_id, court_name);

alter table public.games enable row level security;

create policy "Users can view own games"
  on public.games for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own games"
  on public.games for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own games"
  on public.games for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own games"
  on public.games for delete to authenticated
  using (auth.uid() = user_id);

create trigger games_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

create table public.game_summaries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null unique references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  overview text,
  strengths text[] default '{}',
  improvements text[] default '{}',
  next_focus text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create index game_summaries_user_idx on public.game_summaries (user_id);

alter table public.game_summaries enable row level security;

create policy "Users can view own summaries"
  on public.game_summaries for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own summaries"
  on public.game_summaries for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own summaries"
  on public.game_summaries for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own summaries"
  on public.game_summaries for delete to authenticated
  using (auth.uid() = user_id);