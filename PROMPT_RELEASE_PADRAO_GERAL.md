# Prompt Padrão de Release (Geral)

```text
Atue como Release Manager + Product Documentation Lead.

Contexto:
- Projeto: <NOME_DO_PROJETO>
- Plataforma: <WEB | MOBILE | DESKTOP | BACKEND | OUTRA>
- Stack principal: <STACK>
- Versão atual: <VERSAO_ATUAL>
- Nova versão alvo: <X.Y.Z>
- Tipo de release: <PATCH | MINOR | MAJOR>
- Data da release: <AAAA-MM-DD>
- Idioma: Português (pt-BR)

Objetivo:
Preparar uma release estável completa, com consistência entre versão técnica, versão exibida ao usuário, changelog e documentos de produto/operação.

Arquivos e responsabilidades:
1. package.json (ou equivalente)
- Atualizar versão para <X.Y.Z>.
- Manter consistência com lockfile.

2. Lockfile (package-lock/yarn.lock/pnpm-lock/etc.)
- Refletir nova versão sem alterar dependências sem necessidade.

3. Tela “Sobre”/Info (ex.: src/InfoModal.jsx)
- Atualizar versão visível: v<X.Y.Z>.

4. CHANGELOG.md
- Inserir no topo:
  ## [X.Y.Z] - <AAAA-MM-DD>
- Seções: Adicionado / Alterado / Corrigido.
- Descrever impacto real para usuário e operação.

5. AGENTS.md (ou guia interno de IA)
- Atualizar versão de referência.
- Preservar políticas de versionamento e release.

6. README.md
- Atualizar “Versão atual”.
- Garantir links para CHANGELOG, ROADMAP, requisitos funcionais e ConOps.

7. ROADMAP.md
- Registrar baseline estável atual <X.Y.Z>.
- Ajustar prioridades futuras sem virar changelog.

8. REQUISITOS_FUNCIONAIS.md (criar se não existir)
- Definir RF-01, RF-02...
- Escopo funcional validado da versão.

9. CONCEITO_DE_OPERACOES.md (criar se não existir)
- Objetivo operacional, perfis de usuário, fluxo operacional, limites, fallback e KPIs operacionais.

Critérios de qualidade:
- Versão consistente em todos os arquivos.
- Texto claro, auditável e sem contradições.
- Foco em impacto para usuário + segurança operacional.

Saída esperada:
1) Lista de arquivos alterados/criados.
2) Resumo por arquivo.
3) Checklist final de consistência.
4) Mensagem de commit sugerida.
5) Tag sugerida: v<X.Y.Z>.
```
