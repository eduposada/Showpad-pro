# ShowPad Pro — Requisitos Funcionais (RF)

Versão de referência: **8.10.0**  
Última revisão: **2026-04-25**

## Escopo

Este documento descreve os requisitos funcionais atualmente suportados e validados para operação do ShowPad Pro em navegador, com foco em uso musical ao vivo e colaboração básica.

## RF-01 — Autenticação e sessão

- O sistema deve permitir login por e-mail/senha e por conta Google.
- O sistema deve manter sessão autenticada e permitir logout explícito.
- O sistema deve exigir onboarding de perfil quando campos mínimos estiverem ausentes.

## RF-02 — Perfil de usuário

- O usuário deve poder editar nome, foto/avatar, bio, cidade e instrumentos.
- O sistema deve salvar ao menos campos nucleares de perfil quando houver limitação temporária de schema remoto.

## RF-03 — Biblioteca de músicas

- O usuário deve poder criar, editar, excluir e listar músicas.
- O sistema deve permitir ordenação por título ou artista.
- O sistema deve permitir filtro por artista.
- O sistema deve permitir exportação/importação individual em `.showpad` (JSON).

## RF-04 — Shows e setlists

- O usuário deve poder criar, editar, excluir e listar shows.
- O sistema deve permitir abrir show no Modo Show.
- O sistema deve permitir ordenação de shows por título ou data.

## RF-05 — Modo Show (execução ao vivo)

- O sistema deve exibir cifra formatada com fonte ajustável.
- O sistema deve permitir transposição temporária por semitons durante execução.
- O sistema deve permitir navegação entre músicas (anterior/próxima).
- O sistema deve oferecer botão de acesso às configurações diretamente na toolbar do Modo Show.

## RF-06 — Controles de palco por entradas múltiplas

- O sistema deve aceitar comandos por toque, pedal HID, gestos de câmera ou modo combinado.
- O sistema deve mapear comandos para:
  - subir página (`scroll_up`)
  - descer página (`scroll_down`)
  - música anterior (`prev_song`)
  - próxima música (`next_song`)

## RF-07 — Gestos por câmera

- O sistema deve detectar gestos localmente no dispositivo (sem envio de frames para nuvem).
- O sistema deve permitir configurar sensibilidade de detecção.
- O sistema deve permitir configurar gesto por ação em um único modal de configuração/teste.
- O modal deve exibir último gesto detectado para treinamento do usuário.
- O sistema deve exibir estado de inicialização/erro e oferecer ação de tentar novamente.

## RF-08 — Presets e defaults de gestos

- O sistema deve oferecer presets de gesto.
- O default operacional da versão 8.10.0 deve ser:
  - `scroll_up` -> `closed_fist`
  - `scroll_down` -> `open_palm`
  - `next_song` -> `rock_sign`
  - `prev_song` -> `swipe_right`

## RF-09 — Sincronização com nuvem

- O sistema deve permitir envio de dados locais para nuvem (upload).
- O sistema deve permitir download/atualização local a partir da nuvem (pull/sync).
- O sistema deve manter uso local com Dexie mesmo sem sincronização imediata.

## RF-10 — Bandas e repertório colaborativo

- O sistema deve permitir gestão básica de bandas e repertório conforme regras atuais do produto.
- O sistema deve manter os fluxos de governança e disseminação já definidos no roadmap de bandas.

## RF-11 — PWA e operação em iPad

- O sistema deve ser instalável na tela inicial (PWA).
- O sistema deve suportar uso em iPad com interface otimizada para execução em palco.

