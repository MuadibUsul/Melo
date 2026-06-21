create or replace function public.debit_credits(target_user_id uuid, amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if amount <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  update public.profiles
  set credits = credits - amount
  where id = target_user_id
    and credits >= amount
  returning credits into new_balance;

  if new_balance is null then
    raise exception 'insufficient_credits';
  end if;

  return new_balance;
end;
$$;

create or replace function public.refund_credits(target_user_id uuid, amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if amount <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  update public.profiles
  set credits = credits + amount
  where id = target_user_id
  returning credits into new_balance;

  if new_balance is null then
    raise exception 'profile_not_found';
  end if;

  return new_balance;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
