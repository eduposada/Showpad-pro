# ShowPad Pro — Conceito de Operações Específico (Dinâmica de Bandas)

Versão de referência: **8.10.0**  
Última revisão: **2026-04-26**

## 1. Objetivo operacional

Este documento descreve, de forma operacional e testável, como a dinâmica de bandas deve funcionar no ShowPad Pro, cobrindo:

- criação de banda;
- entrada e gestão de membros;
- inclusão e gestão de músicas no repertório;
- papel do cartão da banda;
- governança, sincronização e execução em contexto real.

Também serve como baseline para comparar a qualidade de implementação por outros modelos de IA em outros projetos/plataformas.

---

## 2. Atores e papéis

### 2.1 Administrador da banda

Responsável por governança da banda e do repertório oficial.

Capacidades esperadas:
- criar banda;
- aprovar/rejeitar entrada de membros;
- gerir repertório oficial;
- disseminar atualizações relevantes para os membros.

### 2.2 Membro da banda

Responsável por consumir e operar o repertório da banda e contribuir conforme política vigente.

Capacidades esperadas:
- solicitar entrada na banda;
- acessar repertório oficial após aprovação;
- sincronizar dados para convergência local/nuvem;
- colaborar (por proposta ou edição permitida pelo fluxo adotado).

### 2.3 Operador solo

Usuário sem banda colaborativa, mas que opera no mesmo modelo funcional por meio de estrutura solo, preservando compatibilidade com o restante do sistema.

---

## 3. Entidades operacionais

- **Banda**: unidade de colaboração com identidade própria.
- **Membro**: vínculo usuário-banda com papel.
- **Pedido de entrada**: solicitação pendente de decisão do admin.
- **Repertório oficial**: lista canônica de músicas da banda.
- **Propostas de repertório**: sugestões de membros para avaliação (quando aplicável).
- **Broadcast/disseminação**: notificação operacional de mudança relevante.
- **Show/setlist da banda**: agenda e execução no contexto coletivo.

---

## 4. Fluxo operacional de ponta a ponta

1. Admin cria banda.  
2. Músico interessado solicita entrada.  
3. Admin aprova/rejeita pedido.  
4. Repertório oficial é construído e mantido.  
5. Alterações relevantes são disseminadas.  
6. Membros sincronizam seus ambientes.  
7. Shows são montados/executados com base no repertório vigente.  
8. Pós-show: sincronização para convergência e continuidade.

---

## 5. Regras de operação

1. O repertório oficial deve ter governança explícita do admin.
2. Colaboração de membros não pode comprometer estabilidade do conteúdo oficial.
3. Operação local deve continuar viável mesmo com conectividade instável.
4. Disseminação deve sinalizar mudanças relevantes para ação dos membros.
5. O cartão da banda deve expor status suficiente para decisão rápida.

---

## 6. Cartão da banda — especificação operacional

O cartão da banda deve atuar como painel tático resumido.

Informações mínimas recomendadas:
- nome da banda;
- papel do usuário atual (admin/membro);
- indicador de pendências (pedidos, propostas, novidades);
- atalhos para repertório, gestão da banda e sincronização;
- contexto visual de saúde operacional (ex.: há mudanças para revisar).

Critério operacional:
- o usuário deve entender o estado da banda e próxima ação com leitura rápida, sem abrir múltiplas telas.

---

## 7. Cenários testáveis (Given/When/Then)

## CT-01 — Criação de banda
**Given** usuário autenticado com permissão para criar banda  
**When** cria uma nova banda com dados válidos  
**Then** a banda é persistida, aparece na listagem e o criador é marcado como admin.

## CT-02 — Solicitação de entrada
**Given** uma banda existente com código/identificador válido  
**When** um usuário envia pedido de entrada  
**Then** o pedido fica pendente para decisão administrativa.

## CT-03 — Aprovação de membro
**Given** pedido pendente visível para admin  
**When** o admin aprova  
**Then** o vínculo de membro é criado e o usuário passa a acessar contexto da banda.

## CT-04 — Rejeição de membro
**Given** pedido pendente visível para admin  
**When** o admin rejeita  
**Then** o pedido é encerrado sem vínculo de membro.

## CT-05 — Inclusão no repertório oficial (admin)
**Given** admin no contexto da banda  
**When** adiciona música ao repertório oficial  
**Then** a música passa a constar no repertório oficial da banda.

## CT-06 — Alteração do repertório e disseminação
**Given** repertório oficial alterado  
**When** o admin executa disseminação  
**Then** membros recebem indicação de novidade e conseguem convergir após sincronização.

## CT-07 — Sincronização de membro
**Given** membro com dados locais potencialmente defasados  
**When** executa sincronização  
**Then** o contexto local da banda converge com o estado remoto permitido.

## CT-08 — Operação offline temporária
**Given** membro sem conectividade momentânea  
**When** acessa dados já sincronizados localmente  
**Then** consegue operar localmente; sincronização permanece pendente até rede voltar.

## CT-09 — Cartão da banda com pendências
**Given** existem pendências (pedidos/propostas/novidades)  
**When** usuário abre aba de bandas  
**Then** o cartão sinaliza pendências de forma visível e acionável.

## CT-10 — Execução de show com contexto de banda
**Given** show/setlist vinculado à banda e repertório disponível  
**When** músico entra no modo de execução  
**Then** consegue navegar conteúdo da apresentação sem depender de backend em tempo real.

---

## 8. Checklist de conformidade (comparação entre implementações)

Marcar cada item como **OK / PARCIAL / FALHA**.

### 8.1 Governança
- [ ] Criação de banda define claramente o admin.
- [ ] Entrada de membros exige decisão administrativa.
- [ ] Repertório oficial possui controle explícito.

### 8.2 Colaboração
- [ ] Fluxo de contribuição de membro existe sem quebrar o oficial.
- [ ] Pendências são visíveis para decisão (admin/membro).

### 8.3 Sincronização e resiliência
- [ ] Sistema mantém operação local mesmo sem internet.
- [ ] Sincronização reconcilia estado local e remoto de forma previsível.
- [ ] Mudanças relevantes são disseminadas/notificadas.

### 8.4 UX operacional
- [ ] Cartão da banda apresenta status, pendências e atalhos úteis.
- [ ] Estado da banda é compreensível em leitura rápida.

### 8.5 Execução em campo
- [ ] Usuário consegue preparar e executar show com contexto da banda.
- [ ] Fluxo não depende de múltiplos passos ocultos para ações críticas.

---

## 9. Métricas de comparação recomendadas

Para comparar outro modelo/implementação, medir:

- tempo para criar banda e admitir primeiro membro;
- tempo para publicar mudança no repertório e disseminar;
- tempo para membro convergir via sincronização;
- incidência de divergência entre repertório local e oficial;
- clareza operacional percebida no cartão da banda.

---

## 10. Critério de aceitação global

Considera-se a dinâmica de bandas adequada quando:

1. governança (admin) e colaboração (membros) coexistem sem ambiguidade;
2. repertório oficial é estável e rastreável;
3. usuários operam com segurança em cenários de conectividade imperfeita;
4. o cartão da banda sustenta decisão rápida;
5. a execução musical não depende de backend em tempo real.

