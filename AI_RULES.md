# AI_RULES.md – Regras para Assistentes de IA neste Projeto

## 1. Objetivo

Este documento define como qualquer assistente de IA deve atuar ao modificar o código do projeto **ShowPad Pro**.  
Priorize sempre: estabilidade de sync, preservação de dados musicais e código legível.

---

## 2. Princípios Gerais

- Leia sempre o `CONTEXT.md` antes de propor mudanças.
- Trabalhe de forma incremental: pequenas mudanças, bem isoladas, com explicação clara.
- Nunca reescreva o projeto inteiro ou arquivos enormes se não for estritamente necessário.
- Quando tiver dúvida sobre uma regra de negócio, **pergunte antes** de assumir.

---

## 3. Limites Técnicos

- Evite criar arquivos com mais de ~250–300 linhas.
- Mantenha funções com responsabilidade única.
- Não introduza novas dependências sem justificar:
  - por que é necessária
  - se existe alternativa com libs já usadas

---

## 4. Arquitetura e Organização

- **State e lógica de sync:** manter centralizados em `ShowPadCore.js` (ou outros arquivos core indicados).
- **Estilos:** usar apenas o objeto `styles` em `Styles.js`. Não adicionar CSS externo sem alinhamento.
- **Features:** preferir organização por funcionalidade (auth, garimpo, bandas, shows) dentro de `src/features/` em vez de espalhar lógica em componentes genéricos.

---

## 5. Regras Específicas de Negócio

- **Banda Solo:**
  - Nunca criar mais de uma banda solo por usuário.
  - Em operações de sync, preservar sempre a banda solo local se houver conflito.
- **Case Sensitivity em músicas:**
  - Nunca normalizar títulos/artistas para caixa alta/baixa automaticamente.
  - Preservar sempre a grafia original do usuário.
- **Transposição:**
  - Qualquer mudança deve continuar usando `chordRegex` e a `scale` de 12 semitons.
  - Não misturar lógica de transposição com renderização de UI.

---

## 6. Processo de Trabalho com IA

Quando for pedir ajuda à IA:

1. Informar a tarefa de forma clara (ex.: “ajustar sync de setlists ao puxar da nuvem”).
2. Colar:
   - `CONTEXT.md`
   - Este `AI_RULES.md`
   - Os arquivos diretamente relevantes para a tarefa.
3. Pedir sempre:
   - Diff textual claro das mudanças sugeridas.
   - Explicação de impacto (sync, dados, UX).
4. Ao finalizar alterações importantes:
   - Atualizar `CONTEXT.md` e, se necessário, este `AI_RULES.md`.

---

## 7. Coisas que a IA NÃO deve fazer sem autorização explícita

- Mudar o fluxo principal de sincronização Dexie ↔ Supabase.
- Alterar o modelo de dados no Supabase (tabelas/colunas) sem planejamento.
- Remover campos relacionados a banda solo, sync ou transposição.
- Introduzir autenticação ou fluxos de usuário completamente novos sem discussão prévia.