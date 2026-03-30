-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create conversations table
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New Plan',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Index for fast lookups by user
create index if not exists idx_conversations_user_id on public.conversations(user_id);

-- 3. Enable Row Level Security
alter table public.conversations enable row level security;

-- 4. RLS policies — users can only access their own conversations
create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);
