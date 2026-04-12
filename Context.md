# CONTEXT.md – Visão do Projeto

## 1. Visão Geral

**Nome do projeto:** ShowPad Pro  
**Objetivo:** Uma aplicação web robusta para músicos gerenciarem repertórios, cifras e setlists em tempo real. O app resolve o problema de sincronização entre dispositivos e oferece ferramentas de transposição musical e automação MIDI para performance ao vivo.  
**Público-alvo:** Músicos solo, bandas e diretores musicais.

O app é uma aplicação de alta performance focada em estabilidade de dados e fidelidade visual das cifras. O foco atual do desenvolvimento é a sincronização estável entre banco local (Dexie) e nuvem (Supabase), além de captura automatizada de repertório via motor de "Garimpo".

---

## 2. Principais Funcionalidades

1. **Autenticação (Supabase Auth):**
   - Login via Email/Senha.
   - Login via Google OAuth (conta Google).
2. **Gestão de Repertório:** Edição de cifras com transposição tonal dinâmica e detecção automática de acordes. Na aba **Biblioteca (MÚSICAS)**, a lista lateral oferece ordenação alfabética **A–Z por título** ou **A–Z por artista** e um **filtro por artista** (seletor com artistas únicos derivados das músicas, ordenados alfabeticamente, ignorando valores vazios). Com filtro ativo, o seletor fica destacado em verde; ao trocar a ordenação, o filtro é limpo. A lista lateral mostra só as músicas que passam pelo filtro; o editor e demais fluxos que dependem do array completo de músicas continuam a usar a lista integral.
3. **Shows (Setlists):** Criação de listas de músicas para apresentações com campos de notas, local e hora.
4. **Gestão de Bandas:** Sistema de bandas para compartilhamento de repertório. Inclui suporte a uma "Banda Solo" automática por usuário.
5. **Garimpo:** Captura de músicas de fontes externas (URLs) mantendo a grafia original (Case Sensitive).
6. **Sincronização Híbrida (Push/Pull):** Backup total em JSON e sincronização bidirecional blindada contra duplicidade de registros.
7. **Interface MIDI:** Navegação de página e sinalização visual via WebMidi.

**Backlog (features planejadas):**
- Permissões granulares por membro de banda.
- Exportação de cifras em PDF.
- Integração com plataformas externas de cifras além do Garimpo.

---

## 3. Arquitetura e Stack

- **Frontend:** React + Vite (SPA) hospedado na Vercel.
- **Backend:** Supabase (Auth + PostgreSQL).
- **Banco Local:** Dexie.js (IndexedDB) para latência zero e uso offline.
- **Comunicação:** Supabase Client direto no frontend (sem camada de API intermediária).
- **Estilização:** CSS-in-JS via objeto centralizado no `Styles.js`.
- **Hospedagem:** Vercel ligada ao GitHub (CI/CD automático a cada push).
- **Principais dependências:**
  - `@supabase/supabase-js`
  - `dexie`
  - `react` + `vite`
  - WebMidi API (nativa do browser)

---

## 4. Modelo de Dados (Supabase)

### Tabela `songs`
- `id` (uuid, PK) – gerado pelo Supabase; nunca usar o ID numérico do Dexie como PK na nuvem
- `title` (text) – nome da música
- `artist` (text)
- `content` (text) – cifra completa em texto puro
- `bpm` (integer, opcional)
- `creator_id` (uuid, FK → users.id)

### Tabela `setlists`
- `id` (uuid, PK)
- `title` (text)
- `location` (text)
- `time` (text) – horário do show (confirmar se timestamptz ou text)
- `notes` (text)
- `songs` (jsonb) – array de objetos com metadados das músicas e ordem de execução
- `creator_id` (uuid, FK → users.id)
- `band_id` (uuid, FK → bands.id)

### Tabela `bands`
- `id` (uuid, PK)
- `name` (text)
- `invite_code` (text, único – ex.: SOLO_V3)
- `owner_id` (uuid, FK → users.id)
- `is_solo` (boolean) – indica se é a banda solo automática do usuário
- `logo_url` (text, opcional)
- `description` (text, opcional)

*(Demais tabelas do Supabase podem ser adicionadas aqui conforme forem estabilizadas.)*

---

## 5. Estrutura de Pastas

```txt
/ (root)
  ├── CONTEXT.md           # Este arquivo – colar no início de qualquer chat de IA
  ├── AI_RULES.md          # Regras de trabalho para assistentes de IA
  ├── src/
  │   ├── App.jsx          # Orquestrador principal e gerenciamento de estado global
  │   ├── ShowPadCore.js   # Lógica de banco (Dexie), sincronização e lógica musical
  │   ├── Styles.js        # Objeto central de estilos (única fonte de estilos)
  │   ├── features/        # Componentes de página por funcionalidade
  │   │   ├── auth/        # Login (Email/Senha + Google), cadastro, logout
  │   │   ├── garimpo/     # Captura de músicas via URL
  │   │   ├── bandas/      # Gestão de bandas, membros e banda solo
  │   │   └── shows/       # Criação e gerenciamento de setlists
  │   └── components/      # Componentes reutilizáveis de UI (Editor, ShowMode, etc.)
```

---

## 6. Decisões Técnicas e Regras de Negócio

### 6.1 Autenticação e Criação de Banda Solo

- **Métodos ativos:**
  - Email/Senha via Supabase Auth.
  - Google OAuth via Supabase Auth (conta Google).
- **Primeiro login (Email ou Google):**
  - Ao primeiro login de um usuário (independente do provedor), o sistema cria automaticamente uma **Banda Solo** associada ao seu `user.id` com `is_solo: true`.
- **Logins subsequentes:**
  - Antes de criar uma banda solo, o sistema verifica se já existe uma banda solo para aquele usuário.
  - Se já existir, **não criar** outra (garantir uma única banda solo por usuário).
  - Essa regra vale tanto para login via Email/Senha quanto via Google.
- **Associação de dados:**
  - Todos os dados de repertório e setlists são associados ao usuário autenticado (`creator_id`) e, quando relevante, à banda correspondente (`band_id`).

### 6.2 Autorização

- Acesso a dados é filtrado via RLS (Row Level Security) no Supabase, com base em `creator_id` e `band_id`.
- Regras básicas:
  - Usuário só pode acessar músicas, setlists e bandas onde ele é `creator_id`, membro ou `owner_id` (conforme regras específicas de cada tabela).
- Toda leitura e escrita no Supabase deve respeitar esses vínculos.

### 6.3 Regras Gerais de Negócio

- **Case Sensitivity:** O motor de Garimpo preserva rigorosamente a grafia original do usuário (ex.: "Pink Floyd" não pode virar "PINK FLOYD" nem "pink floyd").
- **Transposição:** Utiliza `chordRegex` e `scale` (array de 12 semitons) para shift de notas. Não misturar lógica de transposição com renderização de UI.
- **Banda Solo:** O sistema garante exatamente uma banda solo por usuário (`is_solo: true`). Esta banda é criada automaticamente no primeiro login e nunca pode ser removida ou duplicada.

### 6.4 Regras de Sincronização Dexie ↔ Supabase

- Dexie usa IDs numéricos locais apenas como chave interna de IndexedDB. Antes de enviar qualquer registro ao Supabase, o ID local é **removido** para permitir que o Supabase gere o UUID, evitando conflitos de chave primária.
- A sincronização é bidirecional (Push/Pull), mas deve garantir:
  - Nenhum registro duplicado (especialmente bandas solo).
  - Dados mais recentes nunca serem sobrescritos por dados mais antigos.
- Regras de conflito:
  - Preferir o registro com `updated_at` mais recente quando disponível.
  - Em caso de conflito na banda solo: **sempre preservar a banda solo local existente** e ignorar a versão da nuvem.
- No `pullFromCloud`: se já houver uma banda solo local, a versão da nuvem é descartada silenciosamente.

---

## 7. Convenções de Código

- **Linguagem:** JavaScript (JSX). Sem TypeScript por ora.
- **Estilos:** Usar sempre o objeto `styles` importado de `Styles.js`. Não criar CSS externo ou inline avulso.
- **Arquivos:** Manter arquivos com no máximo ~250–300 linhas. Dividir em módulos menores se necessário.
- **Funções:** Responsabilidade única por função. Evitar funções que fazem sync E atualizam UI ao mesmo tempo.
- **Commits de trabalho:** `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`, `docs: ...`
- **Commits de release (tags de versão):**
  - `v8.1` – Estabilidade de Sync e Garimpo
  - `v8.2` – Versão estável pura (sem duplicidade de bandas)

---

## 8. Como usar este CONTEXT em chats de IA

1. Cole este arquivo **inteiro** no início de qualquer nova sessão de IA.
2. Cole também o `AI_RULES.md` para orientar o comportamento do assistente.
3. Informe a tarefa atual de forma clara (ex.: "Refatorar o componente de notas no editor").
4. Cole **apenas** os arquivos diretamente relevantes para a tarefa — não o projeto inteiro.
5. Ao finalizar alterações importantes, peça para a IA:
   - Atualizar as tags de versão na seção 7.
   - Atualizar qualquer decisão técnica nova na seção 6.
   - Devolver o `CONTEXT.md` completo e revisado para você salvar no repositório.