-- Idempotente: reforço se 20260416220000 já foi aplicada noutro ambiente.
-- Ver também supabase/FIX_DATABASE_ERROR_GRANTING_USER.sql (copiar/colar no Dashboard).

drop trigger if exists on_auth_user_sync on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

drop function if exists public.handle_auth_user_sync() cascade;
drop function if exists public.handle_new_user() cascade;

drop policy if exists "profiles_auth_admin_maintain" on public.profiles;
