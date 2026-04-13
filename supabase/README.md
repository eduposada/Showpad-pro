# Supabase — migrações (ShowPad Pro)

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
