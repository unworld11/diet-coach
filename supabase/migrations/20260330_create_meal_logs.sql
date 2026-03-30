create table if not exists public.meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  meal_type text not null default 'snack',
  label text not null default '',
  items jsonb not null default '[]'::jsonb,
  calories integer not null default 0,
  protein real not null default 0,
  carbs real not null default 0,
  fat real not null default 0,
  image_url text,
  notes text,
  source text not null default 'manual',
  created_at timestamptz default now() not null
);

create index if not exists idx_meal_logs_user_date on public.meal_logs(user_id, logged_at);

alter table public.meal_logs enable row level security;

create policy "Users can view their own meal logs"
  on public.meal_logs for select using (auth.uid() = user_id);

create policy "Users can insert their own meal logs"
  on public.meal_logs for insert with check (auth.uid() = user_id);

create policy "Users can update their own meal logs"
  on public.meal_logs for update using (auth.uid() = user_id);

create policy "Users can delete their own meal logs"
  on public.meal_logs for delete using (auth.uid() = user_id);
