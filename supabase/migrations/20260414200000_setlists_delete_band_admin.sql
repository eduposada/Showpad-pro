-- Opcional (ShowPad v8.5.8+): permitir que **admin da banda** apague na nuvem qualquer `setlists`
-- com aquele `band_id` (a app usa DELETE com band_id + title).
-- Complementa a política "só apago o meu creator_id" quando o show foi gravado por outro membro.

drop policy if exists "setlists_delete_band_admin" on public.setlists;

create policy "setlists_delete_band_admin"
on public.setlists
for delete
to authenticated
using (
  exists (
    select 1 from public.band_members bm
    where bm.band_id = setlists.band_id
      and bm.profile_id = auth.uid()
      and bm.role = 'admin'
  )
);
