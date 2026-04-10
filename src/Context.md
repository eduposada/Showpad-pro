# CONTEXT.md – Visão do Projeto

## 1. Visão Geral

**Nome do projeto:** ShowPad Pro  
**Objetivo:** Uma aplicação web robusta para músicos gerenciarem repertórios, cifras e setlists em tempo real. O app resolve o problema de sincronização entre dispositivos e oferece ferramentas de transposição musical e automação MIDI para performance ao vivo.  
**Público-alvo:** Músicos solo, bandas e diretores musicais.

O app é uma aplicação de alta performance focada em estabilidade de dados e fidelidade visual das cifras. O foco atual do desenvolvimento é a sincronização estável entre banco local (Dexie) e nuvem (Supabase), além de captura automatizada de repertório via motor de "Garimpo".

---

## 2. Principais Funcionalidades

1. **Autenticação:** Login via Supabase Auth (Email/Senha).
2. **Gestão de Repertório:** Edição de cifras com transposição tonal dinâmica e detecção automática de acordes.
3. **Shows (Setlists):** Criação de listas de músicas para apresentações com campos de notas, local e hora.
4. **Gestão de Bandas:** Sistema de bandas para compartilhamento de repertório. Inclui suporte a uma "Banda Solo" automática por usuário.
5. **Garimpo:** Captura de músicas de fontes externas (URLs) mantendo a grafia original (Case Sensitive).
6. **Sincronização Híbrida (Push/Pull):** Backup total em JSON e sincronização bidirecional blindada contra duplicidade de registros.
7. **Interface MIDI:** Navegação de página e sinalização visual via WebMidi.

---

## 3. Arquitetura e Stack

- **Frontend:** React + Vite (SPA) hospedado na Vercel.
- **Backend:** Supabase (Auth + PostgreSQL).
- **Banco Local:** Dexie.js (IndexedDB) para latência zero e uso offline.
- **Comunicação:** Supabase Client direto no frontend.
- **Estilização:** CSS-in-JS via objeto centralizado no `Styles.js`.
- **Hospedagem:** Vercel ligada ao GitHub.

---

## 4. Modelo de Dados (Supabase)

### Tabela `songs`
- `id` (uuid, PK)
- `title` (text) – nome da música
- `artist` (text)
- `content` (text) – cifra completa em texto
- `bpm` (integer, opcional)
- `creator_id` (uuid, FK → users.id)

### Tabela `setlists`
- `id` (uuid, PK)
- `title` (text)
- `location` (text)
- `time` (timestamptz ou text) – horário do show (confirmar tipo)
- `notes` (text)
- `songs` (jsonb) – array de objetos com metadados das músicas e ordem
- `creator_id` (uuid, FK → users.id)
- `band_id` (uuid, FK → bands.id)

### Tabela `bands`
- `id` (uuid, PK)
- `name` (text)
- `invite_code` (text, único, ex.: SOLO_V3)
- `owner_id` (uuid, FK → users.id)
- `is_solo` (boolean)
- `logo_url` (text, opcional)
- `description` (text, opcional)

---

## 5. Estrutura de Pastas

```txt
/ (root)
  ├── CONTEXT.md        # Este arquivo
  ├── src/
  │   ├── App.jsx       # Orquestrador e Gerenciamento de Estado
  │   ├── ShowPadCore.js # Lógica de Banco (Dexie), Sync e Música
  │   ├── Styles.js     # Objeto central de estilos
  │   ├── features/     # Componentes de página (Garimpo, Bandas, Auth)
  │   └── components/   # Componentes de UI (Editor, ShowMode)
```

---

## 6. Decisões Técnicas e Regras de Negócio

- **Sincronização (Push):** Os registros locais perdem o `id` numérico do Dexie antes do upload para permitir que o Supabase gere o UUID, evitando erros de chave primária.
- **Banda Solo:** O sistema garante apenas uma banda solo por usuário (`is_solo: true`). No `pullFromCloud`, se já houver uma banda solo local, a da nuvem é ignorada para evitar duplicidade.
- **Case Sensitivity:** O motor de Garimpo preserva a grafia original do usuário (ex: "Pink Floyd" não vira "PINK FLOYD").
- **Transposição:** Utiliza `chordRegex` e `scale` (12 semitons) para shift de notas sem corromper a estrutura do texto.

---

## 7. Convenções de Código

- **Linguagem:** JavaScript (JSX).
- **Estilos:** Usar sempre o objeto `styles` do `Styles.js`. Evitar CSS externo.
- **Tags de Versão:** - `v8.1`: Estabilidade de Sync e Garimpo.
  - `v8.2`: Versão estável pura (Sem duplicidade de bandas).
- **Commits:** Seguir o padrão `vX.X: Descrição`.

---

## 8. Como usar este CONTEXT em chats de IA

1. Cole este arquivo inteiro no início de qualquer nova sessão.
2. Informe a tarefa atual (ex: "Refatorar o componente de notas no editor").
3. Cole apenas os arquivos necessários para a tarefa.
4. Ao finalizar, peça para a IA atualizar as definições de versão (item 7) deste arquivo.