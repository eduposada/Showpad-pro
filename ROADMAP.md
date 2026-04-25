# ShowPad — visão de futuro e roadmap

Baseline estável atual: **8.10.0** (2026-04-25)

## Contexto

O ShowPad nasceu como ferramenta pessoal para músicos gerenciarem cifras e repertório. A visão de longo prazo é evoluir para uma plataforma colaborativa completa, do ensaio ao palco, com suporte a bandas, dispositivos físicos e, eventualmente, comercialização.

---

## Plataforma e distribuição

Hoje o ShowPad é uma PWA no navegador, instalável pela tela inicial (iOS e Android), com boa experiência no iPad.

### Frentes de evolução

- **Multiplataforma:** melhorar responsividade em celular; validar uso em smart TVs com navegador (Android TV e similares).
- **Distribuição em lojas:** avaliar publicação na App Store e na Google Play via empacotador (por exemplo Capacitor ou equivalente).
- **MIDI em outros contextos:** pesquisar viabilidade de controle MIDI em smart TV via Bluetooth.

---

## Funcionalidades planejadas

### Colaboração na banda

- **Chat entre membros:** canal interno por banda para pré-ensaio e pré-show (mensagens, histórico por banda, notificações).

### Modo show

- **Metrônomo visual:** sincronizado com o BPM da música em exibição.
- **Modo show sincronizado:** um membro como mestre transmite a passagem de páginas em tempo real para os demais.
- **Sequência de setlist (palco / técnica):** visão enxuta com **título, artista, tom e BPM** para banda, técnico de som e apoio.
- **Modos por instrumento:** variações por função (primeiras ideias: **baixistas** e **bateristas**), com leitura rápida e informação focada no papel.

### Conteúdo musical avançado

- **Biblioteca de acordes:** ao tocar num acorde na cifra, mostrar diagrama (guitarra e teclado).
- **Partituras e tablaturas com metadados:** importar e exibir com leitura de metadados (tom, BPM / andamento, estrutura, marcações).
- **Transposição coerente:** acompanhar mudanças de tom também em tablaturas ou blocos onde fizer sentido.
- **Exibição seletiva no modo show:** ocultar elementos (por exemplo tablaturas) quando não forem relevantes para quem está em palco.

### Hardware e acessórios

- **Passador físico:** botoeiras junto ao instrumento para virar páginas sem soltar o instrumento; comunicação MIDI por Bluetooth ou USB / MIDI.

---

## Modelo de negócio

### Referências de mercado

Aplicativos semelhantes (OnSong, forScore, Setlist Helper) costumam cobrar entre USD 15 e USD 30, como compra única ou assinatura anual.

### Diferencial do ShowPad

Poucos concorrentes combinam colaboração real entre membros, governança de repertório, sincronização e modo show coletivo.

### Modelo sugerido (avaliação)

- **Uso pessoal:** gratuito (biblioteca, garimpo, modo show individual).
- **Banda:** plano pago (repertório colaborativo, aprovação de alterações, sincronização, chat).
- **Hardware:** dispositivo vendido à parte.

### Próximos passos comerciais

- Pesquisa de mercado com músicos brasileiros (público inicial).
- Definição de custos operacionais (Supabase, Vercel, infraestrutura de sincronização).
- Precificação que cubra custos com margem razoável.
- Avaliação jurídica de distribuição e venda.

---

## Prioridades

A prioridade imediata é consolidar bandas e repertório colaborativo, mantendo o bloco de controles de palco recém-estabilizado em `8.10.0`. O restante deste documento serve de referência até essa base estar estável em produção.

### Consolidação recém-concluída (v8.10.0)

- Modal único de **Configurar gestos** (configuração + teste no mesmo fluxo).
- Catálogo de gestos simplificado com `open_palm` único.
- Feedback de último gesto detectado para treino operacional.
- Acesso ao painel de configurações também no **Modo Show**.
- Default de palco ajustado para operação prática:
  - subir: punho fechado
  - descer: mão espalmada
  - próxima música: sinal de rock
  - música anterior: swipe direita

### Em curso na aba Bandas

1. **Fase F — governança de BPM / tom (repertório colaborativo):** é esta a fase acordada; o desenho de execução ainda **não está fechado** — desenvolvimento em conjunto com o mantenedor (regras: quem altera BPM/tom no oficial vs. propostas, impacto em sync e shows, sem quebrar aprovação admin / proposta membro). **Aguardando** retorno após testes na prática do fluxo **Disseminar** (v8.6.3); só então retomamos com instruções explícitas.

### Concluído (referência)

- **Disseminar (admin):** removido dos cartões da lista de bandas; fica **só no rodapé do modal Repertório**. As edições ao oficial continuam a gravar-se na nuvem ao atuar; o admin **notifica os membros** (`band_broadcasts`) apenas quando clica em **Disseminar** antes de fechar (fechar sem disseminar não envia esse aviso).

### Backlog futuro (triagem)

Itens já descritos em **Funcionalidades planejadas**; ordem sugerida apenas para conversa de prioridade:

1. **[Média]** Modo show — sequência de setlist (palco / técnica).
2. **[Média]** Modo show por perfil de instrumento (baixo, bateria, etc.).
3. **[Média / alta]** Partituras e tablaturas com metadados e transposição.

---

*Documento iniciado em abril de 2026. Revisado para baseline estável 8.10.0.*
