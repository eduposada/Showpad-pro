# Instruções para assistentes de IA (ShowPad Pro)

Este ficheiro resume regras que também estão em `.cursorrules`, `.cursor/rules/` e `GIT_WORKFLOW.md`. Serve para qualquer ferramenta de IA que trabalhe neste repositório.

## Git e tags

- Branch de trabalho: **`main`**.
- **Não** criar nem enviar tags sem o mantenedor pedir **explicitamente**.
- **Não** recomendar `git checkout <tag>` para desenvolver (risco de *detached HEAD*). Preferir branch criada a partir da tag.

## Cada release com tag `vX.Y.Z`

Antes ou no mesmo commit da tag:

1. **`CHANGELOG.md`:** secção `## [X.Y.Z] - data` com o que entra nessa release.
2. **`package.json`:** `"version": "X.Y.Z"` (sem prefixo `v`); alinhar `package-lock.json` se o projeto mantiver versão lá.
3. **UI:** atualizar a versão mostrada ao utilizador (ex.: `src/InfoModal.jsx`).
4. Depois: `git tag -a vX.Y.Z -m "…"` e, quando combinado, push da branch e da tag.

## Projeto

React + Vite, Dexie local, Supabase na nuvem. Convenções detalhadas de código e negócio: **`.cursorrules`**.

## Estabilidade

Se uma alteração **puder afetar** recursos, menus ou fluxos **já estáveis**, a IA deve **consultar o mantenedor**, pedir **ratificação** e explicar **em detalhe** as **consequências** antes de implementar. Sem esse ok, não avançar.
