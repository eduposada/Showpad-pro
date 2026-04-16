-- Fase Profiles (onboarding): base de perfis de utilizador
-- Objetivo: criar/normalizar `public.profiles` para suportar onboarding e exibição de membros.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  main_instrument text,
  instruments jsonb not null default '[]'::jsonb,
  city text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists main_instrument text;
alter table public.profiles add column if not exists instruments jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_band_member" on public.profiles;
create policy "profiles_select_self_or_band_member"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.band_members mine
    join public.band_members other on other.band_id = mine.band_id
    where mine.profile_id = auth.uid()
      and other.profile_id = profiles.id
  )
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Backfill inicial para utilizadores já existentes no auth.
insert into public.profiles (
  id,
  full_name,
  created_at,
  updated_at
)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    nullif(trim(split_part(u.email, '@', 1)), '')
  ) as full_name,
  now(),
  now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

