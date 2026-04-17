-- =============================================================================
-- ShowPad Pro — corrigir "Database error granting user" (registo e-mail/senha)
-- =============================================================================
-- Cola este ficheiro COMPLETO no Supabase Dashboard → SQL Editor → Run.
-- Não altera dados de músicas/bandas; remove apenas gatilhos/funções em conflito
-- com o GoTrue ao criar utilizador em auth.users.
--
-- Depois: Authentication → Users → tenta criar conta de teste de novo.
-- =============================================================================

-- Gatilhos frequentes (ShowPad + tutoriais Supabase "handle_new_user")
DROP TRIGGER IF EXISTS on_auth_user_sync ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Funções associadas (ordem: após triggers)
DROP FUNCTION IF EXISTS public.handle_auth_user_sync() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Política extra da tentativa de bypass RLS (pode existir ou não)
DROP POLICY IF EXISTS "profiles_auth_admin_maintain" ON public.profiles;

-- ---------------------------------------------------------------------------
-- Diagnóstico: se o erro CONTINUAR, copia o resultado desta query e envia.
-- Não apagues linhas que não reconheças sem consultar a documentação Supabase.
-- ---------------------------------------------------------------------------
SELECT
  tg.tgname AS trigger_name,
  pg_get_triggerdef(tg.oid) AS trigger_definition
FROM pg_trigger tg
JOIN pg_class c ON c.oid = tg.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND NOT tg.tgisinternal
ORDER BY tg.tgname;
