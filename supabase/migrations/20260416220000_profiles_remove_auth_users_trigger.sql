-- GoTrue: "Database error granting user" — ver supabase/FIX_DATABASE_ERROR_GRANTING_USER.sql
-- (script completo + query de diagnóstico). Isto é o mínimo idempotente.

drop trigger if exists on_auth_user_sync on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;

drop function if exists public.handle_auth_user_sync() cascade;
drop function if exists public.handle_new_user() cascade;

drop policy if exists "profiles_auth_admin_maintain" on public.profiles;
