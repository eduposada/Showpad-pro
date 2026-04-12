-- Fase A — Plano bandas/repertório (ShowPad Pro)
-- Aplicar no Supabase: SQL Editor (todo o ficheiro) ou `supabase db push` se usar CLI.
-- Depois de aplicar: testar políticas com um user admin e um membro (ver supabase/README.md).

-- ---------------------------------------------------------------------------
-- Funções auxiliares (SECURITY DEFINER para usar em RLS sem recursão)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_band_member(_user uuid, _band uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.band_members m
    WHERE m.band_id = _band AND m.profile_id = _user
  );
$$;

CREATE OR REPLACE FUNCTION public.is_band_admin(_user uuid, _band uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.band_members m
    WHERE m.band_id = _band AND m.profile_id = _user AND m.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_band_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_band_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_band_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_band_admin(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Pedidos de entrada na banda (Fase B usará no app)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.band_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS band_join_requests_one_pending_per_user
  ON public.band_join_requests (band_id, profile_id)
  WHERE status = 'pending';

ALTER TABLE public.band_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "band_join_requests_select_own_or_admin"
  ON public.band_join_requests FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.is_band_admin(auth.uid(), band_id)
  );

CREATE POLICY "band_join_requests_insert_self"
  ON public.band_join_requests FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND NOT public.is_band_member(auth.uid(), band_id)
  );

CREATE POLICY "band_join_requests_update_admin"
  ON public.band_join_requests FOR UPDATE TO authenticated
  USING (public.is_band_admin(auth.uid(), band_id))
  WITH CHECK (public.is_band_admin(auth.uid(), band_id));

-- ---------------------------------------------------------------------------
-- Propostas de inclusão no repertório (Fases C–D usarão no app)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.band_repertoire_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  proposer_id uuid NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  content text NOT NULL DEFAULT '',
  bpm integer NOT NULL DEFAULT 120,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS band_repertoire_proposals_one_pending_per_song
  ON public.band_repertoire_proposals (band_id, title, artist)
  WHERE status = 'pending';

ALTER TABLE public.band_repertoire_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "band_repertoire_proposals_select_members"
  ON public.band_repertoire_proposals FOR SELECT TO authenticated
  USING (public.is_band_member(auth.uid(), band_id));

CREATE POLICY "band_repertoire_proposals_insert_members"
  ON public.band_repertoire_proposals FOR INSERT TO authenticated
  WITH CHECK (
    public.is_band_member(auth.uid(), band_id)
    AND proposer_id = auth.uid()
  );

CREATE POLICY "band_repertoire_proposals_update_admin"
  ON public.band_repertoire_proposals FOR UPDATE TO authenticated
  USING (public.is_band_admin(auth.uid(), band_id))
  WITH CHECK (public.is_band_admin(auth.uid(), band_id));

-- ---------------------------------------------------------------------------
-- band_broadcasts — tipo de sinal (indicadores no app nas fases seguintes)
-- ---------------------------------------------------------------------------
ALTER TABLE public.band_broadcasts
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'sync';

COMMENT ON COLUMN public.band_broadcasts.kind IS
  'sync = disseminação legada; proposals = há propostas pendentes; repertoire = repertório oficial atualizado';
