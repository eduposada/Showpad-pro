# Instruções para assistentes de IA (ShowPad Pro)

Este arquivo resume regras que também estão em `.cursorrules`, `.cursor/rules/` e `GIT_WORKFLOW.md`. Serve para qualquer ferramenta de IA que trabalhe neste repositório.

## Idioma

Comunicação com o mantenedor: **sempre em português do Brasil (pt-BR)**, salvo pedido explícito em contrário.

## Git e tags

- Branch de trabalho: **`main`**.
- **Não** criar nem enviar tags sem o mantenedor pedir **explicitamente**.
- **Não** recomendar `git checkout <tag>` para desenvolver (risco de *detached HEAD*). Preferir branch criada a partir da tag.

## Versão e entrega

### Critério de incremento (semver simplificado)

| Tipo | Dígito | Exemplo |
|---|---|---|
| Fix pontual, ajuste de UI, melhoria de feedback | Patch (3.º) | 8.9.0 → 8.9.1 |
| Nova funcionalidade, nova tela, novo fluxo | Minor (2.º) | 8.9.0 → 8.10.0 |
| Refatoração profunda, quebra de compatibilidade, marco de estabilidade | Major (1.º) | 8.9.0 → 9.0.0 |

### Fluxo por entrega (não só em tags)

Antes de cada `git push origin main`:

1. **`CHANGELOG.md`:** fechar `[Unreleased]` com versão e data real.
2. **`package.json`:** `"version": "X.Y.Z"` (sem prefixo `v`).
3. **UI:** `src/InfoModal.jsx` — «Versão atual: vX.Y.Z».
4. **`AGENTS.md`:** linha «Versão de referência» abaixo.
5. Push → Vercel faz deploy automático de `main`.
6. **Tag** (`git tag -a vX.Y.Z …`): **só** quando o mantenedor confirmar explicitamente.

## Projeto

React + Vite, Dexie local, Supabase na nuvem. Convenções detalhadas de código e negócio: **`.cursorrules`**.

Versão de referência publicada na UI e nos metadados de backup: **8.9.3**; pormenores em **`CHANGELOG.md`**.

## Estabilidade

Se uma alteração **puder afetar** recursos, menus ou fluxos **já estáveis**, a IA deve **consultar o mantenedor**, pedir **ratificação** e explicar **em detalhe** as **consequências** antes de implementar. Sem esse ok, não avançar.
