-- Opcional (Fase B): permite embed `profiles(...)` em consultas a `band_join_requests`.
-- Se o Dashboard já expõe `profiles` com `id` = `auth.users.id`, execute este ficheiro.
-- Se der erro de duplicata de constraint, a FK já existe.

ALTER TABLE public.band_join_requests
  DROP CONSTRAINT IF EXISTS band_join_requests_profile_id_fkey;

ALTER TABLE public.band_join_requests
  ADD CONSTRAINT band_join_requests_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
