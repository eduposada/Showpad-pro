-- Fix: FK band_members.profile_id → profiles.id + backfill de profiles ausentes
-- Corrige: membros da banda aparecem como "Membro (id…)" em vez de nome/e-mail.
-- Causa 1: sem FK, PostgREST não resolve o embed profiles() na query fetchMembers.
-- Causa 2: utilizadores sem linha em profiles (criados antes da migration de perfis).
-- Nota: escrito de forma defensiva — detecta quais colunas existem antes de as usar.

-- ---------------------------------------------------------------------------
-- 1. Backfill: inserir linhas mínimas para utilizadores sem perfil
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  has_email      boolean;
  has_created_at boolean;
  has_updated_at boolean;
  insert_sql     text;
  select_sql     text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) INTO has_email;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
  ) INTO has_created_at;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) INTO has_updated_at;

  -- Montar INSERT dinamicamente com as colunas que existem
  insert_sql := 'INSERT INTO public.profiles (id, full_name';
  select_sql := 'SELECT u.id, coalesce('
    || 'nullif(trim(u.raw_user_meta_data->>''full_name''), ''''),'
    || 'nullif(trim(u.raw_user_meta_data->>''name''), ''''),'
    || 'nullif(trim(u.raw_user_meta_data->>''given_name''), ''''),'
    || 'nullif(trim(split_part(u.email, ''@'', 1)), '''')'
    || ')';

  IF has_email THEN
    insert_sql := insert_sql || ', email';
    select_sql := select_sql || ', u.email';
  END IF;
  IF has_created_at THEN
    insert_sql := insert_sql || ', created_at';
    select_sql := select_sql || ', now()';
  END IF;
  IF has_updated_at THEN
    insert_sql := insert_sql || ', updated_at';
    select_sql := select_sql || ', now()';
  END IF;

  insert_sql := insert_sql || ') '
    || select_sql
    || ' FROM auth.users u'
    || ' LEFT JOIN public.profiles p ON p.id = u.id'
    || ' WHERE p.id IS NULL'
    || ' ON CONFLICT (id) DO NOTHING';

  EXECUTE insert_sql;
  RAISE NOTICE 'Backfill de profiles concluído (email=%, created_at=%, updated_at=%)',
    has_email, has_created_at, has_updated_at;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Update: preencher full_name e email em linhas já existentes vazias
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  has_email      boolean;
  has_updated_at boolean;
  has_avatar_url boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) INTO has_email;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) INTO has_updated_at;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) INTO has_avatar_url;

  IF has_email AND has_updated_at AND has_avatar_url THEN
    UPDATE public.profiles p
    SET
      email      = coalesce(nullif(trim(p.email), ''), u.email),
      avatar_url = coalesce(
                     nullif(trim(p.avatar_url), ''),
                     nullif(trim(u.raw_user_meta_data->>'avatar_url'), ''),
                     nullif(trim(u.raw_user_meta_data->>'picture'), '')
                   ),
      full_name  = coalesce(
                     nullif(trim(p.full_name), ''),
                     nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
                     nullif(trim(u.raw_user_meta_data->>'name'), ''),
                     nullif(trim(split_part(u.email, '@', 1)), '')
                   ),
      updated_at = now()
    FROM auth.users u
    WHERE u.id = p.id
      AND (p.email IS NULL OR trim(p.email) = ''
           OR p.full_name IS NULL OR trim(p.full_name) = '');

  ELSIF has_email THEN
    UPDATE public.profiles p
    SET
      email     = coalesce(nullif(trim(p.email), ''), u.email),
      full_name = coalesce(
                    nullif(trim(p.full_name), ''),
                    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
                    nullif(trim(u.raw_user_meta_data->>'name'), ''),
                    nullif(trim(split_part(u.email, '@', 1)), '')
                  )
    FROM auth.users u
    WHERE u.id = p.id
      AND (p.email IS NULL OR trim(p.email) = ''
           OR p.full_name IS NULL OR trim(p.full_name) = '');

  ELSE
    UPDATE public.profiles p
    SET
      full_name = coalesce(
                    nullif(trim(p.full_name), ''),
                    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
                    nullif(trim(u.raw_user_meta_data->>'name'), ''),
                    nullif(trim(split_part(u.email, '@', 1)), '')
                  )
    FROM auth.users u
    WHERE u.id = p.id
      AND (p.full_name IS NULL OR trim(p.full_name) = '');
  END IF;

  RAISE NOTICE 'Update de profiles concluído';
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. FK: band_members.profile_id → profiles.id
-- ---------------------------------------------------------------------------
ALTER TABLE public.band_members
  DROP CONSTRAINT IF EXISTS band_members_profile_id_fkey;

ALTER TABLE public.band_members
  ADD CONSTRAINT band_members_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
