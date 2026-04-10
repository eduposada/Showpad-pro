# AI_RULES.md – Regras para Assistentes de IA no Projeto ShowPad Pro

## 1. Objetivo

Este documento define como qualquer assistente de IA deve atuar ao ler, propor mudanças ou gerar código para o projeto **ShowPad Pro**.  
Priorize sempre: estabilidade de sincronização, preservação de dados musicais, fidelidade visual das cifras e código legível.

---

## 2. Princípios Gerais

- Leia sempre o `CONTEXT.md` por completo antes de sugerir qualquer alteração.
- Trabalhe de forma incremental:
  - Prefira mudanças pequenas e localizadas, com explicação clara do impacto.
  - Evite “refatorar tudo” ou reescrever arquivos grandes sem necessidade explícita.
- Quando tiver dúvida sobre uma regra de negócio ou comportamento desejado, **pergunte antes de assumir qualquer coisa**.
- Nunca introduza comportamentos que possam causar perda de dados ou duplicidade silenciosa (especialmente bandas solo e sync).

---

## 3. Limites Técnicos

- Evite criar arquivos com mais de ~250–300 linhas.
- Mantenha funções com responsabilidade única:
  - Evitar funções que misturem sync, lógica de negócio e renderização de UI no mesmo bloco.
- Não introduza novas dependências externas sem:
  - Justificar claramente o motivo.
  - Verificar se não é possível resolver com as bibliotecas e APIs já presentes.
- Não migrar o projeto para outro framework (por ex., para Next.js ou TypeScript) sem orientação explícita.

---

## 4. Arquitetura e Organização

- **Estado e lógica central:**
  - Manter lógica de banco local (Dexie), sincronização e lógica musical em arquivos centrais como `ShowPadCore.js` ou módulos designados para isso.
  - Evitar espalhar lógica de sync em múltiplos componentes de UI.
- **Estilos:**
  - Usar somente o objeto `styles` definido em `Styles.js`.
  - Não criar CSS externo, styled-components ou inline styles aleatórios sem alinhamento.
- **Features:**
  - Organizar o código por funcionalidade dentro de `src/features/` (auth, garimpo, bandas, shows).
  - Componentes verdadeiramente genéricos devem ir em `src/components/`.
- **Autenticação:**
  - Respeitar que o projeto usa Supabase Auth com Email/Senha **e** Google OAuth.
  - Não alterar o fluxo central de login sem considerar o impacto na criação/verificação de Banda Solo.

---

## 5. Regras de Negócio Específicas (críticas)

### 5.1 Banda Solo

- Cada usuário deve ter **no máximo uma** Banda Solo (`is_solo: true`).
- No primeiro login (seja via Email/Senha ou Google), criar automaticamente a Banda Solo se ela não existir.
- Antes de criar uma Banda Solo, verificar se já existe uma banda solo associada ao usuário.
- Em operações de sincronização ou merge de dados:
  - Nunca criar banda solo duplicada.
  - Preservar sempre a banda solo local em caso de conflito com a nuvem.

### 5.2 Case Sensitivity e Cifras

- Nunca normalizar automaticamente títulos ou artistas para uppercase/lowercase.
- A grafia original inserida pelo usuário deve ser preservada em todas as operações (incluindo Garimpo, edição, sync).
- Qualquer sugestão de alteração na exibição deve manter os dados brutos intactos.

### 5.3 Transposição Musical

- Toda lógica de transposição deve continuar baseada em:
  - `chordRegex`
  - `scale` de 12 semitons
- Não misturar lógica de transposição com código de UI (ex.: componentes de renderização).
- Ao propor alterações na transposição:
  - Explicar claramente o impacto na detecção de acordes e no conteúdo de `content`.

### 5.4 Sincronização Dexie ↔ Supabase

- Nunca usar o ID numérico do Dexie como chave primária na nuvem.
- Antes de enviar dados ao Supabase:
  - Remover IDs locais de Dexie e permitir que o Supabase gere UUIDs.
- Em qualquer mudança que envolva sync:
  - Garantir que não haja criação de registros duplicados.
  - Evitar que registros mais antigos sobrescrevam dados mais novos.
- Em caso de banda solo:
  - Preservar sempre a banda solo local; descartar versões conflitantes vindas da nuvem.

---

## 6. Processo de Trabalho com IA

Quando um humano estiver pedindo ajuda à IA neste projeto, o fluxo recomendado é:

1. Informar o objetivo da tarefa de forma clara (ex.: “corrigir bug de duplicidade de banda solo após sync”).
2. Colar:
   - `CONTEXT.md`
   - Este `AI_RULES.md`
   - Os arquivos diretamente relevantes (por ex.: `ShowPadCore.js`, módulo de bandas, componente de login).
3. A IA deve:
   - Explicar o raciocínio antes de propor mudanças complexas.
   - Sugerir diffs ou trechos de código bem localizados, em vez de arquivos inteiros quando possível.
   - Indicar se é necessário ajustar modelo de dados, RLS ou regras de sync.

Após a implementação das mudanças sugeridas, a IA pode ser instruída a:

- Atualizar o `CONTEXT.md` com novas decisões técnicas relevantes.
- Ajustar este `AI_RULES.md` se novas restrições ou padrões forem definidos.

---

## 7. Coisas que a IA NÃO deve fazer sem autorização explícita

- Alterar o modelo de dados no Supabase (tabelas, colunas, tipos) sem discussão prévia.
- Modificar profundamente o fluxo de sincronização Dexie ↔ Supabase.
- Remover ou alterar campos relacionados a:
  - Banda Solo (`is_solo`, `invite_code` de solo etc.)
  - Transposição e detecção de acordes
  - Identificadores de usuário (`creator_id`, `owner_id`, `band_id`)
- Introduzir novas formas de autenticação (ex.: outros provedores OAuth) sem que isso seja solicitado.
- Reescrever completamente `ShowPadCore.js` ou módulos centrais sem que o humano peça explicitamente uma refatoração grande.