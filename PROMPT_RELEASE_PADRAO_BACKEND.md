# Prompt Padrão de Release (Backend/API)

```text
Atue como Backend Release Manager + Ops Documentation Lead.

Contexto:
- Serviço: <NOME_SERVICO>
- Stack: <Node/Go/Java/Python/etc.>
- Versão atual: <VERSAO_ATUAL>
- Nova versão: <X.Y.Z>
- Ambiente: <dev/staging/prod>
- Data: <AAAA-MM-DD>
- Idioma: pt-BR

Objetivo:
Preparar release estável de backend com documentação funcional, operacional e de deploy, mantendo rastreabilidade total.

Arquivos e entregas:
1. Manifesto de versão (package.json/pyproject/pom/go module/etc.)
- Atualizar versão para <X.Y.Z>.

2. CHANGELOG.md
- Nova seção no topo:
  ## [X.Y.Z] - <AAAA-MM-DD>
- Adicionado / Alterado / Corrigido.
- Incluir impacto em API, contratos, compatibilidade e migrações.

3. README.md
- Versão atual.
- Como rodar localmente.
- Variáveis de ambiente.
- Fluxo de deploy.

4. Documento de contratos de API (OpenAPI/Swagger ou equivalente)
- Atualizar endpoints, payloads, erros e exemplos.
- Sinalizar breaking changes.

5. REQUISITOS_FUNCIONAIS.md
- RFs da versão (casos de uso de negócio suportados).

6. CONCEITO_DE_OPERACOES.md
- ConOps para backend:
  - arquitetura operacional
  - fluxo de requisição
  - observabilidade (logs, métricas, tracing)
  - fallback/degradação
  - runbooks de incidente.

7. ROADMAP.md
- Baseline estável <X.Y.Z>.
- Próximas prioridades técnicas e de produto.

8. Migrações de banco (se houver)
- Descrever pré-requisitos, ordem e rollback seguro.
- Registrar no changelog e no documento operacional.

9. Checklist de release
- Compatibilidade backward/forward.
- Smoke tests pós-deploy.
- Monitoramento e plano de rollback.

Critérios:
- Versão consistente em código, docs e artefatos operacionais.
- Contrato de API atualizado e auditável.
- Plano operacional claro para suporte pós-release.

Saída:
1) Arquivos alterados/criados.
2) Resumo por arquivo.
3) Checklist final de release + rollback.
4) Commit message sugerida.
5) Tag sugerida: v<X.Y.Z>.
```
