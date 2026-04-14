# ShowPad — Visão de Futuro e Roadmap

## Contexto

O ShowPad nasceu como uma ferramenta pessoal para músicos gerenciarem cifras e repertório. A visão de longo prazo é evoluir para uma plataforma colaborativa completa, cobrindo desde o ensaio até o palco, com suporte a bandas, dispositivos físicos e eventualmente comercialização.

---

## Plataforma e Distribuição

O ShowPad roda hoje como PWA no navegador, o que já permite instalação em iOS e Android pela tela inicial. O iPad já apresenta boa experiência visual. Os próximos passos nessa frente são:

- Adaptar o layout para telas de celular (responsividade mobile)
- Validar experiência em Smart TV com navegador (Android TV, etc.)
- Avaliar publicação nas lojas (App Store e Google Play) via wrapper como Capacitor ou similar
- Pesquisar viabilidade de controle MIDI em Smart TV via Bluetooth

---

## Funcionalidades Planejadas

### 1. Biblioteca de Acordes
Ao clicar em um acorde dentro da cifra, exibir um diagrama visual do acorde para guitarra e teclado. Útil para iniciantes e para consulta rápida durante ensaio.

### 2. Suporte a Tablaturas
Cifras importadas do Cifra Club e outras fontes frequentemente incluem tablaturas em formato texto. O app deve:
- Identificar automaticamente blocos de tablatura no conteúdo importado
- Realizar transposição de tablatura (ajuste de casas ao mudar o tom)
- Permitir ocultar tablaturas no modo show (para vocalistas e outros que não precisam)

### 3. Chat entre Membros da Banda
Canal de comunicação interno por banda, voltado para coordenação de pré-ensaio e pré-show. Funcionalidades mínimas: mensagens de texto, histórico por banda, notificações.

### 4. Metrônomo Visual no Modo Show
Exibição de metrônomo visual sincronizado com o BPM da música em exibição durante o modo show.

### 5. Modo Show Sincronizado entre Membros
Um membro assume o papel de mestre. A passagem de páginas é transmitida em tempo real para os dispositivos de todos os outros membros. Método de sincronização a definir: WebSocket, WebRTC peer-to-peer, ou comunicação local via Wi-Fi/Bluetooth.

### 6. Dispositivo Físico de Passagem de Páginas
Pequeno dispositivo eletrônico com botoeiras para fixar próximo ao instrumento (guitarra, baixo, saxofone, trompete, etc.), permitindo virar páginas sem tirar as mãos do instrumento. Comunicação via MIDI Bluetooth ou cabo USB/MIDI. Representa também um produto físico independente com potencial comercial próprio.

---

## Modelo de Negócio

### Referências de Mercado
Aplicativos similares (OnSong, forScore, Setlist Helper) praticam entre USD 15 e USD 30 como compra única ou assinatura anual.

### Diferencial do ShowPad
Nenhum concorrente relevante oferece colaboração real entre membros de banda com governança de repertório, sincronização e modo show coletivo.

### Modelo Sugerido para Avaliação
- Uso pessoal: gratuito (biblioteca, garimpo, modo show individual)
- Banda: plano pago (repertório colaborativo, aprovação de alterações, sincronização, chat)
- Hardware: dispositivo físico vendido separadamente

### Próximos Passos para Comercialização
- Pesquisa de mercado com músicos brasileiros (público inicial)
- Definição de custos operacionais (Supabase, Vercel, infraestrutura de sync)
- Precificação baseada em cobertura de custos com margem
- Avaliação de modelo jurídico para distribuição e venda

---

## Prioridades

A prioridade imediata é consolidar a dinâmica de bandas e repertório colaborativo. As demais funcionalidades serão priorizadas após essa base estar estável e validada em produção.

### Próxima sessão — prioridade alta

1. **Botão Disseminar (admin da banda):** o botão só deve ficar **verde** (disponível/clicável) quando houver **alguma alteração** a disseminar para os membros; sem nada pendente, permanece **cinza** (desabilitado). Implementação provável em `BandView.jsx` (fluxo DISSEMINAR / estado derivado do que mudou desde a última disseminação ou desde o snapshot oficial — a definir na implementação).

---

*Documento criado em abril de 2026. Atualizar conforme o projeto evolui.*
