-- ShowPad Pro: permitir que o utilizador apague as próprias músicas na nuvem (exclusão local + DELETE).
-- Sem esta política, o cliente recebe erro RLS ao tentar remover de `public.songs` após apagar na app.

drop policy if exists "songs_delete_own" on public.songs;

create policy "songs_delete_own"
  on public.songs
  for delete
  to authenticated
  using (creator_id = auth.uid());
