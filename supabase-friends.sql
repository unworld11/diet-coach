-- Run this in Supabase SQL Editor after the meal_logs migration

-- 1. User profiles with unique share codes
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text not null default '',
  share_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_at timestamptz default now() not null
);

create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);
create index if not exists idx_user_profiles_share_code on public.user_profiles(share_code);

alter table public.user_profiles enable row level security;

create policy "Users can view any profile"
  on public.user_profiles for select using (true);

create policy "Users can insert their own profile"
  on public.user_profiles for insert with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update using (auth.uid() = user_id);

-- 2. Friendships (directional: user_id added friend_id)
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  friend_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, friend_id)
);

create index if not exists idx_friendships_user_id on public.friendships(user_id);

alter table public.friendships enable row level security;

create policy "Users can view their own friendships"
  on public.friendships for select using (auth.uid() = user_id);

create policy "Users can insert their own friendships"
  on public.friendships for insert with check (auth.uid() = user_id);

create policy "Users can delete their own friendships"
  on public.friendships for delete using (auth.uid() = user_id);

-- 3. Allow friends to read each other's meal_logs
create policy "Friends can view meal logs"
  on public.meal_logs for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships
      where friendships.user_id = auth.uid()
        and friendships.friend_id = meal_logs.user_id
    )
  );

-- Drop the old self-only select policy so the new one takes effect
drop policy if exists "Users can view their own meal logs" on public.meal_logs;
