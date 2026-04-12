# Changelog

Todas as alterações relevantes do projeto serão documentadas neste arquivo.

## [8.4.2] - 2026-04-12

### Corrigido

- Garimpo no Vercel: extração passa a usar a função serverless `POST /api/scrape` (axios + cheerio), evitando depender do browser → corsproxy.io (comportamento diferente por `Origin` em produção).
- Feedback do Garimpo: só indica sucesso quando há músicas gravadas no Dexie; falhas listam motivo; fila mantém apenas URLs que falharam.

### Adicionado

- `vercel.json` com `maxDuration` de 30s para `api/scrape.js`.
- Fallback para corsproxy + regex quando a API não está disponível (ex.: `vite` sem proxy).

## [8.3.1] - 2026-04-12

### Corrigido

- Bug no Garimpo: URL do corsproxy.io estava sem o parâmetro `url=`, causando falha no scraping do Cifra Club no ambiente Vercel.
