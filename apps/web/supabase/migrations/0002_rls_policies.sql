alter table public.profiles enable row level security;
alter table public.generation_tasks enable row level security;
alter table public.tracks enable row level security;
alter table public.favorites enable row level security;
alter table public.payments enable row level security;
alter table public.api_usage_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create policy "profiles select own or admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "profiles update own basic fields"
on public.profiles for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "tasks select own or admin"
on public.generation_tasks for select
using (auth.uid() = user_id or public.is_admin());

create policy "tasks insert own"
on public.generation_tasks for insert
with check (auth.uid() = user_id);

create policy "tasks update admin only"
on public.generation_tasks for update
using (public.is_admin())
with check (public.is_admin());

create policy "tracks select own or admin"
on public.tracks for select
using (auth.uid() = user_id or public.is_admin());

create policy "tracks update admin only"
on public.tracks for update
using (public.is_admin())
with check (public.is_admin());

create policy "tracks delete own or admin"
on public.tracks for delete
using (auth.uid() = user_id or public.is_admin());

create policy "favorites select own or admin"
on public.favorites for select
using (auth.uid() = user_id or public.is_admin());

create policy "favorites insert own"
on public.favorites for insert
with check (auth.uid() = user_id);

create policy "favorites delete own or admin"
on public.favorites for delete
using (auth.uid() = user_id or public.is_admin());

create policy "payments select own or admin"
on public.payments for select
using (auth.uid() = user_id or public.is_admin());

create policy "usage select admin only"
on public.api_usage_logs for select
using (public.is_admin());
