-- Corrige "Database error granting user" ao criar conta / OAuth:
-- o trigger `handle_auth_user_sync` faz INSERT/UPDATE em `public.profiles` com RLS.
-- Se o dono da função não for o dono da tabela (postgres), as políticas só para `authenticated`
-- bloqueiam o insert antes de existir JWT com auth.uid().

alter function public.handle_auth_user_sync() owner to postgres;

-- Defesa extra: o serviço Auth invoca o trigger como supabase_auth_admin.
drop policy if exists "profiles_auth_admin_maintain" on public.profiles;
create policy "profiles_auth_admin_maintain"
on public.profiles
for all
to supabase_auth_admin
using (true)
with check (true);
