# Changelog

Todas as alterações relevantes do projeto serão documentadas neste arquivo.

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
