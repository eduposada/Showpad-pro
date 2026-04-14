# Changelog

Todas as alterações relevantes do projeto serão documentadas neste arquivo.

## [8.6.0] - 2026-04-14

### Adicionado

- **Fase E — Repertório oficial → biblioteca pessoal:** no modal **Repertório** da banda, cada música oficial tem o ícone **download** para copiar para `db.songs` (aba MÚSICAS). Não cria duplicata se já existir o mesmo par **título + artista** na biblioteca local (comparação com a mesma chave que o resto do modal); `creator_id` = utilizador atual. Atualiza a lista local do modal e chama `refreshData` quando existir.

## [8.5.9] - 2026-04-14

### Corrigido

- **UPLOAD:** `await db.setlists.toArray().filter` era inválido (`toArray()` devolve Promise) — corrigido para `(await db.setlists.toArray()).filter(...)`.
- **SYNC shows da banda:** deduplicação na leitura da nuvem por `band_id` + `title` (mantém a linha com `updated_at` mais recente) e fusão no Dexie de cópias locais duplicadas do mesmo show, para deixar de aparecerem dois com o mesmo nome após sync.

## [8.5.8] - 2026-04-14

### Adicionado

- **Agenda de shows da banda:** ao apagar como **admin**, o show é removido também no **Supabase** (além do Dexie). No **SYNC**, cópias locais que já tinham vindo da nuvem (`from_band_sync`) e cujo título **já não existe** na nuvem passam a `revoked_by_admin`: aparecem **a cinza**, com selo **«Fora da agenda oficial»** e texto explicativo; o membro pode **remover da lista** ou abrir o editor (aviso no topo). Membro **não-admin** ao apagar só remove **neste aparelho**. Shows revogados **não** entram no UPLOAD.

### Documentação

- Nota em `supabase/README.md` sobre política **DELETE** em `setlists` para o admin conseguir apagar na nuvem.

## [8.5.7] - 2026-04-14

### Corrigido

- **Pull de shows da banda:** merge Dexie passa a comparar `songs` normalizado (ex.: jsonb como string) e a **atualizar quando a nuvem tem mais faixas** que a cópia local — cenário típico: membro com lista vazia antiga e admin já com o set montado na nuvem.
- **Hidratação:** normaliza `songs` para array antes de preencher `content` (evita lista tratada como vazia por formato).

### Documentação

- Migração opcional `20260414193000_setlists_songs_jsonb.sql` e nota no README se a tabela `setlists` **não tiver coluna `songs`** (sem ela, o Postgres não guarda o set e o membro vê o show sem músicas).

## [8.5.6] - 2026-04-14

### Corrigido

- **Shows da banda no outro membro:** as entradas em `setlist.songs` podiam chegar só com título/`id` (sem `content`), porque vinham da biblioteca local de outro utilizador. A app passa a **hidratar** a partir de `band_repertoire` no **SYNC** (pull) e ao **UPLOAD** (antes do upsert), e ao abrir o **editor** do show. Ao adicionar música ao show da banda, grava-se **snapshot** (`title`, `artist`, `content`, `bpm`) para a nuvem levar a cifra.

## [8.5.5] - 2026-04-13

### Alterado

- Mensagem após **SINCRONIZAR AGORA** na aba Bandas: texto em linguagem natural para o utilizador, sem referência a RLS ou documentação técnica.

## [8.5.4] - 2026-04-13

### Corrigido

- **UPLOAD / `setlists`:** o envio voltou a gravar `creator_id` como o utilizador autenticado na nuvem. A tentativa anterior (manter o dono local na coluna `creator_id` em shows com `band_id`) fazia o Postgres rejeitar linhas com política RLS típica (`creator_id = auth.uid()`). Os shows da banda seguem identificados por **`band_id`** no pull; o Dexie local continua com o `creator_id` que já tinhas ao criar o show.

## [8.5.3] - 2026-04-13

### Corrigido

- **Editor de show da banda:** lista “Repertório” voltou a encher-se usando `band_repertoire` no Supabase (o pull da Fase D deixou de popular `band_songs`; o editor ainda filtrava só por Dexie).
- **SYNC shows da banda:** no **SYNC**, após carregar bandas, o cliente também descarrega `setlists` com `band_id` nas bandas não solo em que o utilizador é membro (requer RLS no Supabase — ver `supabase/README.md`).

### Alterado

- **Bandas:** aviso laranja passa a dizer **NOVIDADES!**; área dos cards com rolagem quando há muitas bandas; pedidos de entrada mostram **foto** (`profiles.avatar_url`, se existir) e nome; badges de pedidos/propostas **abaixo** do ícone de configurações, alinhados.
- **SINCRONIZAR AGORA** (aba Bandas): passa a chamar `pullFromCloud` + `refreshData`, alinhado ao botão **SYNC** do cabeçalho, para refletir shows e o restante na UI.

## [8.5.2] - 2026-04-12

### Alterado

- **Fase D (governança de repertório):** admin passa a editar o repertório oficial **diretamente** (adicionar/remover), com aprovação/reprovação item a item das propostas pendentes; membros continuam por proposta. Ajustado posicionamento do badge de pedidos no botão de configurações (mais abaixo).
- `pullBandChanges` não sobrescreve mais a biblioteca pessoal (`db.songs`), apenas lê `band_repertoire` para sincronização do contexto da banda.

## [8.5.1] - 2026-04-12

### Adicionado

- **Fase C (repertório):** modal da aba Bandas com ordenação da biblioteca local por título/artista, exibição de título+artista, fila de propostas pendentes em cinza, repertório oficial em amarelo, botão **ENVIAR PROPOSTAS** para `band_repertoire_proposals` e badge de pendências no card da banda.

## [8.5.0] - 2026-04-12

### Adicionado

- **Fase B (bandas):** entrada na banda via **pedido** (`band_join_requests`); administrador aprova ou recusa em **Configurações** da banda; badge com número de pedidos pendentes no ícone de engrenagem; texto de ajuda no formulário de código. Migração opcional de FK para `profiles` em `supabase/migrations/20260412130000_band_join_requests_profile_fk.sql`.

## [8.4.9] - 2026-04-12

### Adicionado

- **Fase A (plano bandas/repertório):** migração SQL em `supabase/migrations/` — tabelas `band_join_requests` e `band_repertoire_proposals`, funções `is_band_member` / `is_band_admin`, RLS, coluna opcional `band_broadcasts.kind`; instruções em `supabase/README.md`. O código da app ainda **não** usa estas tabelas (Fase B em diante).

## [8.4.8] - 2026-04-11

### Release estável

Aba **Bandas** **estabilizada** e **ratificada** pelo mantenedor: uma banda solo por utilizador (correção boolean/`sortBy`); verificação manual (ordenar biblioteca repetidas vezes sem criar SOLO novas); opcionalmente limpeza de duplicatas antigas no Supabase. **Tag `v8.4.8`.**

### Corrigido

- **Bandas solo duplicadas (Dexie):** a checagem usava `where('is_solo').equals(1)`, mas o registro grava `is_solo: true` — no Dexie isso não casa, então a app achava que não havia solo e criava outra a cada execução. O `useEffect` ainda dependia de **`sortBy`**, então cada troca de ordenação na biblioteca disparava de novo → dezenas de SOLO no localhost (IndexedDB da origem `localhost` é separado da produção). Corrigido com filtro por boolean, efeito só em **`session`**, limpeza de duplicatas ao detectar várias solo do mesmo `owner_id`, e ajuste no download (`pullFromCloud`).

## [8.4.7] - 2026-04-11

### Release estável

Versão **ratificada** pelo mantenedor em 2026-04-11. **Verificado:** importação **Garimpo** (Cifra Club) em **localhost** (`npm run dev` com `/api/scrape`) e em **produção na Vercel**; **backup**, **restauração** e **sync** com Supabase (envio e download) nos dois ambientes.

### Corrigido

- Sync: `invite_code` é **único** na tabela `bands`. A banda solo usava `SOLO_V3` igual para todos → *duplicate key … bands_invite_code_key*. Agora solo usa `SOLO_<id da banda>` (único); no envio, códigos solo antigos são normalizados e o Dexie é atualizado.

## [8.4.6] - 2026-04-11

### Corrigido

- Sync com a nuvem: **`my_bands` só existe no Dexie local**, não no Supabase. O envio passa a usar as tabelas **`bands`** e **`band_members`** (só bandas em que o utilizador é `owner_id`); o download de bandas usa o mesmo critério que o ecrã Bandas (`band_members` + `bands`). Corrige *«Could not find the table public.my_bands»*.

## [8.4.5] - 2026-04-11

### Corrigido

- Sync para a nuvem (`pushToCloud`): **deduplicação** antes do `upsert` de músicas, shows e bandas, evitando o erro do Postgres *«ON CONFLICT DO UPDATE command cannot affect row a second time»* quando o Dexie tem mais de uma linha com a mesma chave de conflito (ex.: mesmo título e artista).
- Deploy na Vercel: removido `runtime: "nodejs20.x"` de `vercel.json` — a plataforma passou a exigir o formato de *runtime* como pacote npm (`…@versão`); para funções Node em `/api` o runtime padrão basta. Mantido `maxDuration`; `package.json` ganha `engines.node: "20.x"` para alinhar a versão Node do build e das funções.

## [8.4.4] - 2026-04-11

### Corrigido

- Garimpo no `npm run dev`: rota **POST /api/scrape** servida no próprio Vite (plugin + `api/scrapeCore.js`), mesma lógica que `api/scrape.js` na Vercel — deixa de depender de proxy/`VITE_API_SCRAPE_URL`.

### Alterado

- `api/scrape.js` passa a delegar a `scrapeCore.js`; `.env.example` e mensagens do Garimpo atualizados.
- Processo de release: regras em `.cursor/rules/release-versioning.mdc`, `.cursorrules`, `GIT_WORKFLOW.md` e `AGENTS.md` — em cada tag, alinhar `CHANGELOG`, `package.json`, lockfile e versão na UI (`InfoModal`).

## [8.4.3] - 2026-04-12

### Corrigido

- Sync Supabase: `pushToCloud` / `pullFromCloud` verificam `error` nas respostas e **lançam exceção** (o alerta do app reflete falhas reais; Supabase ausente também erro explícito).
- Garimpo: não conta importação com **cifra vazia**; detecta resposta **HTML** no lugar de JSON no dev (sem proxy); mensagem orientando `VITE_API_SCRAPE_URL`; aviso no console ao subir o Vite sem proxy.

### Adicionado

- `vite.config.js`: proxy de `POST /api/scrape` para `VITE_API_SCRAPE_URL` no `npm run dev`, igual ao fluxo da Vercel (reiniciar o Vite após criar/editar o `.env`).
- `.env.example` com variável documentada.

### Corrigido

- Garimpo: `api/scrape` agora lê o corpo JSON de forma robusta (objeto, string, buffer ou stream), evitando `url` vazia na Vercel.
- Runtime explícito `nodejs20.x` para a função serverless; Cheerio via `import { load }`.
- Cliente: `scrapeViaApi` e proxy com `try/catch` para o fallback ao corsproxy sempre correr; mensagens quando o proxy devolve JSON de erro (ex.: 403 plano corsproxy.io).
- Desenvolvimento local: variável opcional `VITE_API_SCRAPE_URL` (base do deploy) para o Garimpo usar `POST /api/scrape` na Vercel enquanto o Vite não expõe essa rota.

## [8.4.2] - 2026-04-12

### Corrigido

- Garimpo no Vercel: extração passa a usar a função serverless `POST /api/scrape` (axios + cheerio), evitando depender do browser → corsproxy.io (comportamento diferente por `Origin` em produção).
- Feedback do Garimpo: só indica sucesso quando há músicas gravadas no Dexie; falhas listam motivo; fila mantém apenas URLs que falharam.

### Adicionado

- `vercel.json` com `maxDuration` de 10s para `api/scrape.js` (limite típico do plano Hobby na Vercel).
- Fallback para corsproxy + regex quando a API não está disponível (ex.: `vite` sem proxy).

## [8.3.1] - 2026-04-12

### Corrigido

- Bug no Garimpo: URL do corsproxy.io estava sem o parâmetro `url=`, causando falha no scraping do Cifra Club no ambiente Vercel.
