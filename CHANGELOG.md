# Changelog

Todas as alterações relevantes do projeto serão documentadas neste arquivo.

## [8.9.11] - 2026-04-25

### Alterado

- **Gestos padrão de palco (novo default):** `scroll_up` agora usa **mão espalmada**, `scroll_down` usa **punho fechado**, `next_song` usa **sinal de rock** e `prev_song` usa **swipe para direita**.
- **Catálogo simplificado de palma aberta:** removidas as variações direcionais (`open_palm_up` / `open_palm_down`), mantendo apenas o token único `open_palm` em presets, validação e labels de UI.
- **Detecção de swipe mais confiável:** heurística atualizada com limiar dedicado por sensibilidade, dominância horizontal e janela curta de acumulação para melhorar principalmente o reconhecimento de `swipe_left`.
- **Configurações de palco mais diretas:** o fluxo de seleção + teste foi unificado no modal **Configurar gestos**, com dropdown de gesto abaixo de cada ação (`PAG ↑`, `PAG ↓`, `PRÓX MÚSICA`, `MÚSICA ANT`).
- **Treino no próprio modal:** painel de status agora mostra o **último gesto detectado** em tempo real e inclui ajuda prática com lista de gestos disponíveis e dicas rápidas de execução.

## [8.9.9] - 2026-04-25

### Corrigido

- **Robustez da câmera no teste/calibração (iPad/Safari):** `useHandGestures` agora expõe fases explícitas de inicialização, timeout de arranque, retry automático para falhas transitórias e mensagens diagnósticas amigáveis (permissão negada, câmera ocupada/indisponível, timeout, runtime de gestos).
- **Inicialização do runtime de gestos:** adicionada estratégia de preferência local (`/mediapipe/hands`) com fallback para CDN (`jsdelivr`) e cache de construtor para evitar recarregamentos desnecessários durante a sessão.

### Adicionado

- **UX de mapeamento visível no modal de teste:** cada quadrante (`PAG ↑`, `PAG ↓`, `PRÓX MÚSICA`, `MÚSICA ANT`) agora exibe o gesto atualmente mapeado em texto humano.
- **Diagnóstico no modal de teste:** alerta de conflito de bindings, aviso quando gestos estão desativados no modo de entrada atual e botão **Tentar novamente** quando ocorrer erro de inicialização.
- **Helper de rótulo de gestos:** `getGestureTokenLabel()` em `stageControls` para reutilizar labels consistentes no UI de teste/calibração.

## [8.9.8] - 2026-04-25

### Corrigido

- **Configurações no iPad:** modal reorganizado com `maxHeight` por viewport, área interna com scroll real (`flex` + `minHeight: 0`) e botão de concluir fixado no rodapé, evitando seções ocultas sem rolagem.
- **Fluxo de teste/calibração:** removidos os quatro botões de teste inline; o painel agora abre por um único botão dedicado.

### Adicionado

- **Janela dedicada de teste/calibração:** novo modal interno com 4 subdivisões (`PAG ↑`, `PAG ↓`, `PRÓX MÚSICA`, `MÚSICA ANT`) que acendem em verde quando o comando é reconhecido por toque, pedal HID ou gesto.
- **Preview da câmera no teste:** a câmera frontal e sua imagem ficam visíveis durante a calibração, com status de gestos em tempo real.
- **Mapeamento de gesto para música anterior:** inclusão de `prev_song` em presets, bindings, dropdown de mapeamento e resolução de comandos no hook de gestos.

## [8.9.7] - 2026-04-25

### Corrigido

- **Modo Show — semântica dos botões de palco:** o botão de câmera agora controla apenas a exibição do preview da câmera (mostrar/ocultar imagem), sem interferir em outros controles.
- **Controle de tablaturas no toolbar:** substituição do antigo botão de olho por botão dedicado de tablaturas (`FileMusic`), com toggle de exibição apenas quando a música contém linhas de tablatura.

### Adicionado

- **Modo teste/calibração:** novo toggle em Configurações (Controles de Palco), com painel visual no Modo Show que acende por comando recebido (`PAG ↑`, `PAG ↓`, `PRÓX MÚSICA`, `MÚSICA ANT`).
- **Forçar câmera temporária na calibração:** ao ativar calibração, a câmera é ligada automaticamente; ao sair, o estado anterior da câmera é restaurado.
- **Novos gestos configuráveis:** `one_finger_up`, `one_finger_down`, `open_palm`, `closed_fist` no catálogo de mapeamento e no detector de gestos.

## [8.9.6] - 2026-04-25

### Adicionado

- **Modo Show — preview da câmera frontal:** mini-janela no canto superior direito quando gestos estão ativos e a câmera está ligada, com espelhamento visual para facilitar uso no palco.
- **Controle de visibilidade do preview:** novo botão no toolbar do show para mostrar/ocultar a mini-janela sem desligar os gestos.
- **Mapeamento avançado de gestos:** presets (`default`, `palm`, `swipe`), bindings por ação (`scroll_up`, `scroll_down`, `next_song`) e validação centralizada no perfil de controles de palco.
- **Modo aprender (MVP):** configuração no Settings para aprender o próximo gesto válido por ação, com alerta de conflitos quando duas ações usam o mesmo gesto.

### Alterado

- **Hook de gestos:** `useHandGestures` passa a respeitar `cameraEnabled` (estado pausado sem interromper toque/pedal) e a mapear comandos com base em `gestureBindings` configuráveis.
- **Orquestração de palco no App:** inclusão de handlers para toggle de câmera, toggle de preview e fluxo de aprendizado com persistência no `localStorage` (`stage-controls-profile`).

## [8.9.5] - 2026-04-25

### Corrigido

- **Gestos no Modo Show (iPad):** correção do carregamento da biblioteca `@mediapipe/hands` para garantir disponibilidade de `window.Hands` no runtime; elimina erro “Biblioteca de gestos não carregada”.

## [8.9.4] - 2026-04-24

### Adicionado

- **Controles de palco por pedal HID:** suporte a teclas de page-turner no Modo Show (`Arrow/PageUp/PageDown/Space/Left/Right`) com debounce para evitar múltiplos disparos.
- **Gestos por câmera (MVP local):** novo hook `useHandGestures` com MediaPipe Hands para rolagem e navegação de músicas sem backend externo.
- **Configuração de palco:** novo painel em `SettingsView` para método de entrada (`Toque`, `Pedal`, `Gestos`, `Pedal+Gestos`), inversão de rolagem e sensibilidade dos gestos.
- **Roadmap nativo:** documento `docs/NATIVE_STAGE_CONTROLS_ROADMAP.md` com plano de migração para iOS/Android mantendo contrato de comandos unificado.

### Alterado

- **ShowMode:** centralização dos comandos de palco (`scroll_up`, `scroll_down`, `prev_song`, `next_song`) para reuso por toque, pedal e gestos.

## [8.9.3] - 2026-04-24

### Adicionado

- **PWA completo:** configuração de instalação com `manifest.json` enriquecido, ícones PNG (`192`, `512` e `maskable`) e metas Apple para melhor suporte de “Adicionar à Tela de Início” no iPad.
- **Service Worker:** registro automático em `src/main.jsx` via `virtual:pwa-register`.

### Corrigido

- **Offline básico:** adicionado Service Worker em `public/sw.js` com cache da app shell (`/`, `index.html`, `manifest`, ícones) e estratégia de cache para CSS/JS, com fallback SPA (`index.html`) sem rede.
- **Recursos PWA:** `index.html` agora referencia um favicon real (`/pwa-192.png`) em vez de `/favicon.svg` inexistente.

## [8.9.2] - 2026-04-23

### Corrigido

- **Mobile (somente celular):** novo `phoneLayout` para telas pequenas (`max-width: 500px` ou `max-width: 900px` com `max-height: 440px`), reduzindo altura dos menus sem alterar o iPad.
- **Header no celular:** remoção do badge MIDI, perfil sem texto e botões de nuvem em modo compacto (somente ícones), evitando sumiço das ações de sincronização em portrait.
- **Sidebar no celular:** tabs, filtros/ordenação e rodapé com paddings e botões menores, liberando mais área para lista de músicas/shows.
- **Editor no celular:** cabeçalho e botões (`TOM`, `BPM`, `SHOW`, `CONCLUIR`) com espaçamento menor para aumentar a área visível de observações e letra.
- **Aba Bandas/Garimpo no celular:** redução de padding, margens e tamanhos de título/botões para evitar que o topo ocupe espaço excessivo.

## [8.9.1] - 2026-04-23

### Corrigido

- **Edição de perfil — schema cache:** quando colunas como `bio`, `city`, `avatar_url` ainda não existem no banco remoto (migration pendente), o save não bloqueia o usuário — salva os campos nucleares (`id`, `full_name`) e exibe mensagem clara instruindo a aplicar as migrations pendentes no painel do Supabase.

## [8.9.0] - 2026-04-23

### Adicionado

- **Perfil do utilizador (header):** clicar no nome no topo agora abre um modal de edição de perfil; o fluxo reutiliza o formulário de onboarding com modo de edição (`Editar perfil`), permite atualizar nome artístico (`full_name`), foto/avatar, bio e instrumentos, com ações `SALVAR` e `CANCELAR`.

### Corrigido

- **Bandas — nomes dos membros:** migração `20260422120000_band_members_profile_fk_and_backfill.sql` resolve dois problemas combinados que faziam os membros aparecerem como "Membro (id…)" em vez do nome/e-mail:
  1. **FK ausente** — adicionada `band_members_profile_id_fkey` (`band_members.profile_id → profiles.id`), necessária para o PostgREST resolver o embed `profiles(full_name, email, …)` na query `fetchMembers`.
  2. **Linhas em falta em `profiles`** — backfill de utilizadores criados antes da migration de perfis, preenchendo `full_name` (a partir de metadados OAuth ou parte local do e-mail) e `email`; também preenche campos vazios em linhas já existentes.
- **Edição de perfil — feedback de erro:** `ProfileOnboardingView.handleSubmit` passou a ter bloco `catch` explícito; erros de rede ou Supabase agora aparecem numa faixa vermelha no formulário em vez de serem engolidos silenciosamente. `handleSaveProfileEdit` em `App.jsx` também faz `console.error` antes de relançar a exceção.

## [8.8.1] - 2026-04-18

### Adicionado

- **Shows:** ordenação na lista lateral — **A–Z SHOW** (título) ou **DATA** (campo `time` do `datetime-local`; shows sem data no fim), preferência em `localStorage` (`setlistSortBy`).
- **Mobile (retrato / viewport estreito):** lista Músicas/Shows como **gaveta** recolhível (`max-width: 900px`), botão **Abrir lista** no header, toque fora ou **X** para fechar; ao escolher item ou criar novo, a gaveta fecha para maximizar o editor.
- **Sync — músicas:** ao excluir na biblioteca (lista ou editor), tentativa de **`DELETE` em `public.songs`** na nuvem para a música não voltar no próximo pull; migração **`20260418120000_songs_delete_own_rls.sql`** (política RLS `songs_delete_own`).

### Notas

- Outro aparelho com cópia local antiga ainda pode **recriar** a música na nuvem no próximo upload; convergência total entre dispositivos exigiria soft delete ou tombstones (fora desta entrega).

## [8.8.0] - 2026-04-18

### Resumo da release

- **Baseline estável** para produção (Vercel) e desenvolvimento local: perfis em `public.profiles`, onboarding obrigatório, auth (e-mail + Google com seletor de conta), coluna `email` em perfis e script **`supabase/FIX_DATABASE_ERROR_GRANTING_USER.sql`** para o erro GoTrue «Database error granting user» (remoção de triggers problemáticos em `auth.users`).
- **Dexie (`ShowPadProWeb`):** ao mudar de utilizador na mesma origem, limpeza de dados locais e listagens / push só com `creator_id` (e setlists coerentes com bandas locais) — evita misturar biblioteca entre contas.
- **Bandas:** «SALVAR E DISSEMINAR» no modal Repertório; lista de membros com nome/e-mail/instrumentos; lixeira na UI.
- **Músicas / Shows:** exclusão na lista lateral fiável (`confirm` síncrono, `await refreshData()`); ícone de lixeira **`#ff3b30`** alinhado às Bandas.
- **Documentação:** `README.md` na raiz descreve o produto (stack, links, deploy); `AGENTS.md`, `GIT_WORKFLOW.md`, `supabase/README.md` e `.cursorrules` com referência a **v8.8.0**; backup JSON (`runFullBackup`) com `version: "8.8.0"`.

### Notas de release

- **Tag `v8.8.0`:** marco estável; acumula as alterações documentadas em **8.7.0**–**8.7.8** neste ficheiro. Para novos ambientes Supabase, seguir **`supabase/README.md`** (ordem de migrações e troubleshooting).

## [8.7.8] - 2026-04-17

### Corrigido

- **Lista lateral (Músicas / Shows):** exclusão deixou de depender de `async` no primeiro handler do clique — `confirm` corre síncrono no gesto do utilizador e o apagar chama `await refreshData()` com `try/catch` e validação de `id`; ícone de lixo passou a `<button type="button">` (melhor em touch e acessibilidade).
- **Editor de música:** botão EXCLUIR no modal usa `await refresh()` e `try/catch`.

### Alterado

- **UI — Músicas / Shows:** ícone de lixeira na lista lateral na cor **`#ff3b30`**, igual às ações de remover na aba Bandas.

## [8.7.7] - 2026-04-17

### Adicionado (Supabase)

- **`supabase/FIX_DATABASE_ERROR_GRANTING_USER.sql`:** script único para colar no SQL Editor (vários `DROP TRIGGER` / `DROP FUNCTION` + `SELECT` de diagnóstico no fim). Migração `20260417120000_auth_users_drop_profile_triggers.sql`; `20260416220000_profiles_remove_auth_users_trigger.sql` alinhada aos mesmos drops.

### Alterado

- **Auth:** alerta «Database error granting user» referencia `FIX_DATABASE_ERROR_GRANTING_USER.sql` e o resultado do `SELECT` se o erro continuar.

## [8.7.6] - 2026-04-16

### Alterado

- **Auth Google:** `signInWithOAuth` passa a usar `queryParams.prompt=select_account` e `redirectTo` com origem + pathname, para o Google **mostrar o seletor de conta** em vez de reutilizar silenciosamente outra sessão já aberta no browser.
- **Auth e-mail/senha:** `signUp` com `emailRedirectTo`; mensagem distinta se a conta fica a aguardar confirmação por e-mail; alerta orientado ao SQL de remoção do trigger se a mensagem for «Database error granting user».

## [8.7.5] - 2026-04-16

### Alterado (Supabase + app)

- **Auth "Database error granting user":** migration `20260416220000_profiles_remove_auth_users_trigger.sql` remove o trigger `on_auth_user_sync` e a função (causa típica de falha no GoTrue). A migration `20260416180000_profiles_email_auth_sync.sql` no repositório fica **só** com coluna `email` + backfill SQL (sem trigger).
- **App:** após carregar `profiles`, faz `update` de `email` alinhado ao utilizador autenticado (com JWT), já com RLS permissiva para o próprio.

### Corrigido (Supabase)

- **Hotfix documentação:** prioridade à remoção do trigger em `supabase/README.md`.

## [8.7.4] - 2026-04-16

### Corrigido (Supabase)

- **Auth "Database error granting user":** nova migration `20260416210000_profiles_trigger_bypass_rls.sql` — `ALTER FUNCTION handle_auth_user_sync() OWNER TO postgres` e política RLS `profiles_auth_admin_maintain` para `supabase_auth_admin`, para o trigger de sync `auth.users` → `profiles` não falhar no registo/OAuth.

## [8.7.3] - 2026-04-16

### Corrigido

- **Contas no mesmo navegador:** o Dexie (`ShowPadProWeb`) é **um IndexedDB por origem**, não por utilizador. Ao criar ou entrar com **outra conta** na mesma máquina/navegador, a biblioteca local do utilizador anterior aparecia porque `refreshData` carregava **todas** as linhas de `db.songs` / `db.setlists` sem filtrar por `creator_id`. Agora: (1) ao detetar mudança de `auth.uid` (via `sessionStorage`), **limpa** músicas, shows, bandas e `band_songs` locais; (2) a UI e o **push para a nuvem** só consideram músicas do utilizador atual e setlists coerentes com as bandas locais; (3) o modal Repertório e a cópia para biblioteca pessoal usam só músicas do `creator_id` atual.

## [8.7.2] - 2026-04-16

### Adicionado

- **Supabase — `profiles.email` + trigger `on_auth_user_sync`:** migration `20260416180000_profiles_email_auth_sync.sql` para guardar e-mail na tabela pública, backfill a partir de `auth.users` e sincronizar nome/avatar dos metadados OAuth (ex.: Google `picture`, `name`) em cada insert/update de utilizador.
- **Onboarding:** pré-preenchimento a partir de `user_metadata` (Google); botão **Escolher foto…** com recorte quadrado e compressão JPEG (além do campo URL).
- **App:** `ensureProfileRowFromAuth` + `upsert` tolerante se a coluna `email` ainda não existir; leitura de perfil com fallback de `select` sem `email`.

### Alterado

- **Bandas — lista de membros:** removido o rótulo em caixa alta que parecia dado em falta; linha principal com nome ou e-mail; instrumentos quando existirem; texto de ajuda se não houver nome nem e-mail na linha `profiles`.
- **Auth (e-mail):** no primeiro `signUp`, envia `user_metadata` mínimo (`full_name` / `name` a partir da parte local do e-mail) para alinhar com o trigger/backfill.

## [8.7.1] - 2026-04-16

### Alterado

- **Bandas — modal Repertório (admin):** o botão de disseminação chama-se **SALVAR E DISSEMINAR**, fica cinza e desativado ao abrir o modal e só passa a verde e clicável depois de uma alteração nesta sessão (adicionar/remover oficial, aprovar ou recusar proposta). Ao fechar no X sem mudanças, não fica “pendente” de disseminar; após disseminar com sucesso, o estado repõe-se.

### Notas de release

- **Tag `v8.7.1`:** ponto marcado como **estável** para testes local e Vercel. Inclui o conjunto **8.7.0** (migration `20260415090000_profiles_onboarding_base.sql`, onboarding `ProfileOnboardingView`, `getUserDisplayName()` com `profiles.full_name`, `supabase/README.md` perfis) e **8.7.1** (UX «Salvar e disseminar» no modal Repertório).

## [8.7.0] - 2026-04-15

### Adicionado

- **Perfis de utilizador (base Supabase):** nova migration `20260415090000_profiles_onboarding_base.sql` para criar/normalizar `public.profiles` (`full_name`, `main_instrument`, `instruments`, `city`, `bio`, `avatar_url`), trigger de `updated_at`, RLS (self-service + leitura entre membros da mesma banda) e backfill inicial a partir de `auth.users`.
- **Onboarding obrigatório no primeiro login:** novo fluxo de perfil no cliente (`ProfileOnboardingView`) quando `full_name` ou `main_instrument` estiverem em falta; grava com `upsert` em `profiles` antes de liberar uso completo do app.

### Alterado

- **App (nome do utilizador):** `getUserDisplayName()` passa a priorizar `profiles.full_name` (com fallback para `user_metadata` e e-mail durante transição).
- **Documentação Supabase:** `supabase/README.md` inclui secção de perfis com ordem de deploy segura (DB -> UI onboarding -> validação Bandas).

## [8.6.4] - 2026-04-14

### Alterado

- **Bandas — Disseminar (admin):** removido o botão dos cartões na grelha de bandas. A disseminação (`broadcastBandChanges` + `band_broadcasts`) passa a ser **só no rodapé do modal Repertório**, com texto de ajuda. Edições ao repertório oficial **deixam de inserir** `band_broadcasts` em cada add/remove/aprovação; membros são avisados quando o admin clica em **Disseminar**. Removidos o estado verde/cinza, `sessionStorage` e `bandHasDexieRepertoireDiffersFromCloud` (evita comportamento errático).

## [8.6.3] - 2026-04-14

### Alterado

- **Bandas (admin):** o botão **DISSEMINAR** só fica verde e clicável quando há alterações pendentes neste aparelho: diferença entre o repertório em `band_songs` + `db.songs` e o `band_repertoire` na nuvem (`bandHasDexieRepertoireDiffersFromCloud` em `ShowPadCore.jsx`), ou repertório oficial editado na Fase D sem ter sido disseminado depois (marca em `sessionStorage`). Após disseminar com sucesso, a marca é limpa e o estado recalculado.

## [8.6.2] - 2026-04-14

### Documentação

- **ROADMAP.md:** incluído no repositório com prioridade explícita para o próximo ciclo — botão **Disseminar** só verde quando houver alterações pendentes a disseminar; caso contrário, cinza (desabilitado).

### Notas de release

- Tag **v8.6.2** marca este ponto como **baseline estável** para retomar o desenvolvimento; código da aplicação inalterado face à v8.6.1.

## [8.6.1] - 2026-04-14

### Alterado

- **Repertório da banda:** o ícone de **copiar para a biblioteca pessoal** só aparece nas músicas oficiais que **ainda não existem** na biblioteca local com o mesmo par **título + artista**; texto de ajuda da coluna atualizado.

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
