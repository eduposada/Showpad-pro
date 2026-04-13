-- =============================================================================
-- ShowPad Pro — setlists: ver os TEUS shows + shows das BANDAS em que és membro
-- =============================================================================
-- Quando usar: já tens coluna `band_id` em `setlists` e RLS ligado, mas só uma
-- política do tipo "cada um só vê os seus" — os MEMBROS não veem shows que outro
-- subiu com o mesmo `band_id`. Este script corrige isso.
--
-- Como aplicar: Supabase Dashboard → SQL Editor → colar tudo → Run (uma vez).
-- Se algum DROP POLICY não encontrar a política (nome diferente), ignora o aviso
-- e apaga essa política manualmente em Table editor → setlists → Policies.
-- =============================================================================

-- --- 1) Apagar a política ANTIGA que só deixa ver creator_id = eu -------------
-- (Nomes comuns; o teu pode estar ligeiramente diferente — vê em Policies.)
DROP POLICY IF EXISTS "Users can only see their own setlists" ON public.setlists;
DROP POLICY IF EXISTS "users can only see their own setlists" ON public.setlists;
DROP POLICY IF EXISTS "Users can only view their own setlists" ON public.setlists;
DROP POLICY IF EXISTS "setlists_select_own" ON public.setlists;

-- --- 2) SELECT novo: os MEUS registos OU linhas da MINHA banda (via band_members)
DROP POLICY IF EXISTS "setlists_select_own_or_band" ON public.setlists;

CREATE POLICY "setlists_select_own_or_band"
ON public.setlists
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid()
  OR (
    band_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.band_members bm
      WHERE bm.band_id = setlists.band_id
        AND bm.profile_id = auth.uid()
    )
  )
);

-- --- 3) Escrever na nuvem: só linhas em que EU sou o creator_id (como a app faz)
DROP POLICY IF EXISTS "setlists_insert_own" ON public.setlists;
CREATE POLICY "setlists_insert_own"
ON public.setlists
FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "setlists_update_own" ON public.setlists;
CREATE POLICY "setlists_update_own"
ON public.setlists
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "setlists_delete_own" ON public.setlists;
CREATE POLICY "setlists_delete_own"
ON public.setlists
FOR DELETE
TO authenticated
USING (creator_id = auth.uid());
