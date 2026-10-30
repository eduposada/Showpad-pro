# Prompt Para Criar Regra de Release Versioning

```text
Atue como especialista em governança de releases e documentação de engenharia.

Sua tarefa é criar um arquivo de regra permanente de IA chamado:
- Caminho sugerido: .cursor/rules/release-versioning.mdc
- Formato: Markdown claro, objetivo e acionável.
- Idioma: Português (pt-BR).

Objetivo da regra:
Padronizar versionamento e fechamento de release para que TODA entrega mantenha coerência entre versão de código, versão exibida ao usuário, changelog, documentação e tag Git.

Contexto que você deve solicitar (antes de gerar a regra, se faltar):
- Nome do projeto
- Branch principal (ex.: main)
- Padrão de versão (semver completo ou semver simplificado)
- Política de deploy (ex.: push em main dispara Vercel)
- Arquivos que exibem versão para usuário (ex.: InfoModal, About screen)
- Arquivos de documentação obrigatórios do projeto

Estrutura obrigatória da regra (seções):

1) Escopo da regra
- Explicar que a regra cobre processo de release e versionamento em TODA entrega.
- Definir que objetivo é evitar divergência entre código, docs e UI.

2) Política de incremento de versão
- Definir critérios claros para:
  - Patch: correções pontuais, ajustes de UX, melhorias sem nova capacidade central.
  - Minor: nova funcionalidade, novo fluxo, expansão funcional.
  - Major: mudanças estruturais profundas, ruptura de compatibilidade, marco estável importante.
- Incluir exemplos reais no formato X.Y.Z -> X.Y.Z.

3) Checklist obrigatório antes de push da release
- Atualizar CHANGELOG com versão e data.
- Atualizar package/manifest de versão do projeto.
- Atualizar lockfile se aplicável.
- Atualizar versão visível na UI.
- Atualizar arquivo de instruções de IA (versão de referência).
- Atualizar README/ROADMAP/requisitos funcionais/conceito de operações quando necessário.
- Validar build/lint/testes mínimos definidos no projeto.

4) Política de tag
- Tag somente sob confirmação explícita do mantenedor.
- Formato obrigatório: vX.Y.Z.
- Tag anotada com mensagem de release.
- Ordem recomendada:
  1. Commit de release
  2. Push da branch principal
  3. Criação e push da tag

5) Consistência e auditoria
- Exigir consistência da versão em todos os arquivos-alvo.
- Exigir resumo de release com “o que mudou” e “por que mudou”.
- Exigir rastreabilidade (commit + tag + changelog alinhados).

6) Comportamentos proibidos
- Não criar tag sem pedido explícito.
- Não pular atualização de changelog/documentação.
- Não alterar versão apenas em parte dos artefatos.
- Não usar comandos destrutivos para “corrigir” release.

7) Template de fechamento de release (incluir no fim da regra)
- Versão: X.Y.Z
- Tipo: Patch/Minor/Major
- Arquivos atualizados:
  - CHANGELOG.md
  - package/manifest
  - UI de versão
  - docs de produto/operação
- Evidência de validação:
  - build: OK/FAIL
  - lint: OK/FAIL
  - testes: OK/FAIL
- Tag: vX.Y.Z (sim/não)

Requisitos de qualidade do texto gerado:
- Frases curtas e operacionais.
- Linguagem imperativa (“deve”, “obrigatório”, “não pode”).
- Sem ambiguidades.
- Reutilizável em qualquer projeto, com placeholders para paths específicos.

Saída esperada:
- Gerar o conteúdo completo pronto para colar no arquivo release-versioning.mdc.
- Incluir placeholders claros para customização por projeto.
```
