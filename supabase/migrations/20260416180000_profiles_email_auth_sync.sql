-- Perfis: coluna `email` + sincronização com auth (Google / e-mail)
-- Corrige embeds `profiles(full_name, email, ...)` na app e lista de membros na aba Bandas.

alter table public.profiles add column if not exists email text;

-- Preencher email e reforçar nome/avatar a partir de auth.users (metadados OAuth).
update public.profiles p
set
  email = coalesce(nullif(trim(p.email), ''), u.email),
  full_name = case
    when p.full_name is not null and trim(p.full_name) <> '' then p.full_name
    else nullif(trim(coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'given_name',
      split_part(u.email, '@', 1)
    )), '')
  end,
  avatar_url = case
    when p.avatar_url is not null and trim(p.avatar_url) <> '' then p.avatar_url
    else nullif(trim(coalesce(
      u.raw_user_meta_data->>'avatar_url',
      u.raw_user_meta_data->>'picture'
    )), '')
  end,
  updated_at = now()
from auth.users u
where u.id = p.id;

-- Sincronização Auth → profiles em tempo real: não usar trigger em `auth.users` (GoTrue:
-- "Database error granting user"). O cliente faz upsert após login; ver README Supabase.
