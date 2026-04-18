# ShowPad Pro

Aplicação web para músicos: **repertórios**, **cifras**, **setlists**, **transposição**, **bandas** e **sincronização** entre o dispositivo e a nuvem (Dexie + Supabase).

## Versão atual

**8.8.1** — ver [`CHANGELOG.md`](CHANGELOG.md); a tag Git de release segue o número indicado no changelog (ex.: **`v8.8.1`**).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React + Vite (SPA) |
| Dados locais | Dexie (IndexedDB) |
| Backend | Supabase (Auth + PostgreSQL) |
| Deploy | Vercel (CI a partir de `main`) |

## Documentação do software

| Documento | Conteúdo |
|-----------|-----------|
| [`CHANGELOG.md`](CHANGELOG.md) | Histórico de versões e alterações por release |
| [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md) | Branches, tags, releases e boas práticas Git |
| [`supabase/README.md`](supabase/README.md) | Migrações SQL, ordem de deploy e troubleshooting |
| [`AGENTS.md`](AGENTS.md) | Orientação para assistentes de IA no repositório |
| [`.cursorrules`](.cursorrules) | Regras de negócio, código e limites do projeto |

## Desenvolvimento local

Requer **Node.js 20.x** (ver `engines` em `package.json`).

```bash
npm install
npm run dev
```

## Variáveis de ambiente

Para Supabase no cliente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Definir em `.env` local e no painel da **Vercel** para produção.

## Deploy (Vercel)

Push na branch **`main`** dispara build e deploy. Garantir que as variáveis `VITE_*` estão configuradas no projeto Vercel.

## Backup local

Na app: fluxo de backup exporta JSON com metadados de versão (campo `version` alinhado à release). Ver `runFullBackup` em `src/ShowPadCore.jsx`.
