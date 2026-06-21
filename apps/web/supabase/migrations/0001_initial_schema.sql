create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  credits integer not null default 5 check (credits >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.generation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'minimax',
  model text not null default 'music-2.6',
  type text not null check (type in ('song', 'instrumental', 'bgm')),
  status text not null check (status in ('queued', 'processing', 'succeeded', 'failed')) default 'queued',
  prompt text not null,
  prompt_en text,
  lyrics text,
  lyrics_mode text not null check (lyrics_mode in ('ai', 'custom', 'instrumental')),
  genre text,
  mood text,
  vocal text,
  duration_preset text,
  output_format text not null default 'mp3',
  cost_credits integer not null default 1 check (cost_credits >= 0),
  provider_request jsonb,
  provider_response jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.generation_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  audio_url text not null,
  storage_path text,
  duration_ms integer,
  sample_rate integer,
  bitrate integer,
  format text,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, track_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text,
  amount integer,
  currency text,
  credits_added integer,
  status text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  task_id uuid,
  provider text,
  model text,
  estimated_cost_usd numeric,
  status text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists generation_tasks_user_created_idx on public.generation_tasks(user_id, created_at desc);
create index if not exists generation_tasks_status_idx on public.generation_tasks(status);
create index if not exists tracks_user_created_idx on public.tracks(user_id, created_at desc);
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists api_usage_task_idx on public.api_usage_logs(task_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists generation_tasks_touch_updated_at on public.generation_tasks;
create trigger generation_tasks_touch_updated_at
before update on public.generation_tasks
for each row execute function public.touch_updated_at();
