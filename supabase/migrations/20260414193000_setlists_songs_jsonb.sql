-- ShowPad Pro: garantir coluna `songs` em `public.setlists` (lista de músicas do show em JSON).
-- Sem isto, o cliente envia `songs` no upsert mas o Postgres ignora o campo → membro vê show sem faixas.
-- Executar no SQL Editor do Supabase se a tabela ainda não tiver esta coluna.

alter table public.setlists
  add column if not exists songs jsonb not null default '[]'::jsonb;

comment on column public.setlists.songs is 'Ordem e dados das músicas do show (array JSON; a app grava snapshots com title, artist, content, bpm).';
