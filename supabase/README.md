# Supabase — migrações (ShowPad Pro)

**Referência de release na app:** v8.8.1 (ver `CHANGELOG.md` na raiz do repositório).

## Músicas — DELETE na nuvem (RLS)

**Ficheiro:** [migrations/20260418120000_songs_delete_own_rls.sql](migrations/20260418120000_songs_delete_own_rls.sql)

Política **`songs_delete_own`**: utilizador autenticado pode apagar linhas em `public.songs` com `creator_id = auth.uid()`. Necessária para a app remover da nuvem ao excluir da biblioteca (evita que a música reapareça no pull).

## Fase A — `band_join_requests`, `band_repertoire_proposals`, RLS

**Ficheiro:** [migrations/20260412120000_phase_a_join_requests_and_proposals.sql](migrations/20260412120000_phase_a_join_requests_and_proposals.sql)

### Como aplicar

1. Abre o **Supabase Dashboard** do projeto → **SQL Editor**.
2. Cola o conteúdo completo do ficheiro SQL e executa **uma vez**.
3. Se aparecer erro em `ALTER TABLE ... band_broadcasts` (tabela inexistente), remove temporariamente esse bloco do script ou cria a tabela `band_broadcasts` como já usas na app; o restante pode aplicar-se na mesma.

### O que esta fase cria

| Objeto | Função |
|--------|--------|
| `is_band_member(uuid, uuid)` | RLS: utilizador é membro da banda |
| `is_band_admin(uuid, uuid)` | RLS: utilizador é **admin** da banda |
| `band_join_requests` | Pedidos de entrada (pending / accepted / rejected) |
| `band_repertoire_proposals` | Propostas de música para o repertório oficial |
| `band_broadcasts.kind` | Texto opcional: `sync` (legado), `proposals`, `repertoire` |

**Nota:** A Fase A **não** altera ainda as políticas RLS da tabela `band_repertoire`. O fluxo atual (DISSEMINAR / CAPTURAR) continua igual até implementarmos as fases seguintes no código.

### Checklist rápido (ratificação antes da Fase B)

- [ ] Script executou sem erros.
- [ ] Como **utilizador autenticado**, consegues `SELECT` em `band_join_requests` / `band_repertoire_proposals` só nas bandas em que és membro (ou o teu pedido).
- [ ] Um **admin** consegue `UPDATE` em pedidos/propostas (quando testares com o cliente SQL ou com a app na Fase B).

Quando isto estiver ok, avisa para avançarmos com a **Fase B** (app: pedido de entrada + aprovação do admin).

---

## Fase B — App: pedido de entrada e aprovação do admin

**Código:** [src/BandView.jsx](../src/BandView.jsx) — botão **PEDIR ENTRADA**, secção **PEDIDOS DE ENTRADA** nas configurações (ícone de engrenagem), badge vermelho com contagem no ícone quando há pendentes.

### Opcional — FK para `profiles` (nome/e-mail no painel)

Se a query com `profiles(full_name, email)` falhar no log, executa também:

[migrations/20260412130000_band_join_requests_profile_fk.sql](migrations/20260412130000_band_join_requests_profile_fk.sql)

(Isto exige tabela `public.profiles` com `id` alinhado ao utilizador.)

### Testar

1. Utilizador A cria banda (admin). Utilizador B pede entrada com o código — deve ver mensagem de aguardar aprovação.
2. A abre **Configurações** da banda → vê o pedido → **ACEITAR** ou **RECUSAR**.
3. Após aceitar, B atualiza a lista de bandas (**ATUALIZAR**) e deve ver a banda.

---

## Fase Perfis — `profiles` + onboarding obrigatório

**Ficheiro:** [migrations/20260415090000_profiles_onboarding_base.sql](migrations/20260415090000_profiles_onboarding_base.sql)

### O que esta fase cria

- Tabela `public.profiles` (com `id = auth.users.id`) para dados do utilizador.
- Campos de perfil: `full_name`, `main_instrument`, `instruments`, `city`, `bio`, `avatar_url`.
- Trigger de `updated_at`.
- RLS:
  - utilizador lê/escreve o próprio profile;
  - leitura entre membros da mesma banda (para lista de membros na aba Bandas).
- Backfill inicial para utilizadores já existentes no `auth.users`.

### Ordem recomendada de deploy (sem regressão)

1. **Aplicar SQL no Supabase** (migration acima).
2. **Deploy da UI com onboarding** (gate no primeiro login para `full_name` + `main_instrument`).
3. **Validar aba Bandas** (lista de membros com `profiles.full_name/email/avatar_url` e fallback).
4. Só depois remover fallbacks legados, se desejado.

### Checklist rápido

- [ ] Cada utilizador antigo tem linha em `public.profiles`.
- [ ] Novo login sem profile abre onboarding e salva com sucesso.
- [ ] Lista de membros nas bandas mostra nome/e-mail/avatar quando existir.

### Atualização — e-mail em `profiles` + sync com Google / auth

**Ficheiro:** [migrations/20260416180000_profiles_email_auth_sync.sql](migrations/20260416180000_profiles_email_auth_sync.sql)

- Coluna `email` em `public.profiles` (preenchida a partir de `auth.users` e mantida por trigger em `INSERT`/`UPDATE` em `auth.users`).
- Backfill de `email`, `full_name` e `avatar_url` (metadados OAuth: `picture`, `name`, etc.).
- **Aplica este SQL no Dashboard** depois da migration base de perfis; sem isto, a app continua a funcionar, mas o embed `profiles(..., email)` pode não devolver e-mail até a coluna existir.

**Erro "Database error granting user" ao registar/login:** quase sempre é um **trigger** (ou função) em `auth.users` a falhar ao escrever em `public.profiles`. **Copia e executa no SQL Editor** o ficheiro único [FIX_DATABASE_ERROR_GRANTING_USER.sql](FIX_DATABASE_ERROR_GRANTING_USER.sql) (remove vários triggers/funções comuns e inclui um `SELECT` de diagnóstico no fim). Equivalente em migrações: [migrations/20260416220000_profiles_remove_auth_users_trigger.sql](migrations/20260416220000_profiles_remove_auth_users_trigger.sql) + [migrations/20260417120000_auth_users_drop_profile_triggers.sql](migrations/20260417120000_auth_users_drop_profile_triggers.sql).

**Google com várias contas no mesmo PC:** o cliente usa `prompt=select_account` no OAuth para forçar o ecrã de escolha de conta; se ainda entrar a conta “errada”, em `chrome://settings/content/cookies` ou em janela anónima testa só uma sessão Google.


---

## Shows da banda (`setlists.band_id`) e SYNC

### Membro vê o show mas a lista “Músicas no Show” vem vazia

1. No **Table Editor** → `setlists` → confirma se existe a coluna **`songs`** (tipo **jsonb**). A app grava aí o array de músicas escolhidas para aquele show.
2. Se **não** existir, executa no **SQL Editor** o ficheiro  
   **[migrations/20260414193000_setlists_songs_jsonb.sql](migrations/20260414193000_setlists_songs_jsonb.sql)**  
   Depois o **admin** faz de novo **UPLOAD** do show (para gravar as faixas na nuvem) e o **membro** faz **SYNC**.

A partir da **v8.5.7**, o cliente também: normaliza `songs` se vier como texto JSON; no pull, se a **nuvem tiver mais músicas** que a cópia local, **atualiza** a lista (útil quando o membro tinha uma cópia antiga vazia).

### Se já tens `band_id` e só uma política “cada um vê os seus” — faz isto

1. Abre o **Supabase** do projeto → menu **SQL Editor** (ícone de base de dados / “SQL”).
2. Abre no repositório o ficheiro  
   **[migrations/20260414120000_setlists_rls_own_and_band.sql](migrations/20260414120000_setlists_rls_own_and_band.sql)**  
   copia **todo** o conteúdo e cola no SQL Editor.
3. Clica **Run** (executar). Se aparecer erro do tipo *policy does not exist* no `DROP`, é normal — significa que o nome da política antiga é outro. Nesse caso: **Table Editor** → tabela **`setlists`** → separador **Policies** → apaga manualmente a política que diz “own setlists” / “only see their own” → volta a correr o script (ou apaga só as linhas `DROP POLICY` que falharam e corre o resto).

**O que o script faz, em linguagem simples**

- **Antes:** a regra dizia “só vejo linhas em que eu sou o `creator_id`”. Quem subiu o show da banda foi outro utilizador → tu **não** vias essa linha.
- **Depois:** continuas a ver as tuas linhas **e** passas a ver linhas com **`band_id`** de qualquer banda em que estás em **`band_members`** (a mesma banda do ShowPad).
- **Escrever / apagar:** continua a ser só nas linhas em que **tu** és o `creator_id` (como a app já envia no upload).

---

A app (**v8.5.3+**) faz:

- **UPLOAD:** `upsert` em `setlists` com `creator_id = auth.uid()` (quem está logado) e, para shows da banda, **`band_id`** preenchido com o uuid da banda.
- **SYNC (pull):** além dos teus shows pessoais (`creator_id = auth.uid()`), pede à API todas as linhas em que **`band_id`** é uma banda em que existes em **`band_members`**.

Para isto funcionar no Supabase, trata de **coluna + políticas RLS**. Segue a ordem recomendada.

### 1) Coluna `band_id` na tabela `setlists`

No Dashboard: **Table Editor** → `setlists` → confirma se existe a coluna **`band_id`** (tipo **uuid**, nullable).

Se **não** existir, no **SQL Editor** (uma vez):

```sql
alter table public.setlists
  add column if not exists band_id uuid references public.bands (id) on delete set null;

create index if not exists setlists_band_id_idx on public.setlists (band_id)
  where band_id is not null;
```

(A FK para `bands` é opcional mas ajuda à integridade; `on delete set null` evita apagar linhas se apagares uma banda.)

### 2) RLS ligado em `setlists`

Em **Authentication** → não; em **Table Editor** → `setlists` → verifica se **RLS** está **Enabled**.

Se estiver desligado e quiseres RLS só a partir deste guia: **Enable RLS**. Se já tens políticas antigas, **não dupliques** políticas com o mesmo efeito — ajusta ou substitui conforme o passo 3.

### 3) Políticas RLS recomendadas (copiar para o SQL Editor)

Ideia: **lês** as tuas linhas (`creator_id = auth.uid()`) **ou** linhas de show de banda em que és **membro**; **escreves** só onde `creator_id = auth.uid()` (como a app já faz no upload).

**3a — SELECT (leitura: pessoal + shows da banda)**

```sql
drop policy if exists "setlists_select_own_or_band" on public.setlists;

create policy "setlists_select_own_or_band"
on public.setlists
for select
to authenticated
using (
  creator_id = auth.uid()
  or (
    band_id is not null
    and exists (
      select 1 from public.band_members bm
      where bm.band_id = setlists.band_id
        and bm.profile_id = auth.uid()
    )
  )
);
```

Se já tinhas uma política só com `creator_id = auth.uid()`, os **membros deixavam de ver** os shows que outro membro subiu com o mesmo `band_id` — por isso esta política **OR** com `band_members` é importante.

**3b — INSERT**

```sql
drop policy if exists "setlists_insert_own" on public.setlists;

create policy "setlists_insert_own"
on public.setlists
for insert
to authenticated
with check (creator_id = auth.uid());
```

**3c — UPDATE** (o cliente usa `upsert`, que pode fazer update)

```sql
drop policy if exists "setlists_update_own" on public.setlists;

create policy "setlists_update_own"
on public.setlists
for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());
```

**DELETE (admin apaga show da banda na app)** — A app chama `delete` em `setlists` com `band_id` + `title`. A política RLS tem de permitir que o **administrador da banda** apague linhas dessa banda; se só existir `DELETE` com `creator_id = auth.uid()`, falha quando o `creator_id` na linha for outro utilizador. Script opcional: [migrations/20260414200000_setlists_delete_band_admin.sql](migrations/20260414200000_setlists_delete_band_admin.sql).

**3d — DELETE** (só se a app ou o Dashboard apagarem linhas; opcional mas coerente)

```sql
drop policy if exists "setlists_delete_own" on public.setlists;

create policy "setlists_delete_own"
on public.setlists
for delete
to authenticated
using (creator_id = auth.uid());
```

**Nota:** Com isto, **só quem gravou a linha na nuvem** (`creator_id`) pode alterá-la ou apagá-la. Membros veem cópias via **SELECT** por `band_id`, mas não editam o registo do outro na nuvem — alinha com o uso actual da app (cada um faz upload das suas alterações; conflitos de título são outro tema).

### 4) Testar no Dashboard

1. Utilizador **A** (admin da banda): cria show com `band_id` preenchido → **UPLOAD** na app.
2. Utilizador **B** (membro da mesma banda): **SYNC** ou **SINCRONIZAR AGORA** na aba Bandas.
3. **B** deve passar a ver o show na lista **SHOWS** (Dexie) após o sync.

Se **B** não receber nada: abre **Logs** do Supabase ou a consola do browser — erros `42501` ou respostas vazias indicam política ou coluna em falta.

### 5) `band_members.profile_id` vs `auth.uid()`

As políticas acima assumem que **`band_members.profile_id`** é o mesmo uuid que **`auth.users.id`** (o que a app já usa). Se no teu projecto o membro for outro tipo de id, as políticas têm de ser ajustadas a esse modelo.
