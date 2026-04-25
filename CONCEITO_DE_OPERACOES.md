# ShowPad Pro — Conceito de Operações (ConOps)

Versão de referência: **8.10.0**  
Última revisão: **2026-04-25**

## 1. Objetivo operacional

O ShowPad Pro apoia músicos e bandas na preparação e execução de repertório, com foco em:

- consulta rápida de cifras no palco;
- navegação sem uso das mãos no instrumento;
- sincronização de conteúdo entre dispositivo local e nuvem.

## 2. Perfis de uso

- **Músico solo:** organiza biblioteca própria, monta shows e executa Modo Show com toque/pedal/gestos.
- **Membro de banda:** consome repertório e agenda compartilhados, com sincronização periódica.
- **Administrador de banda:** gerencia repertório oficial e dissemina atualizações para membros.

## 3. Ambiente operacional

- Plataforma primária atual: navegador moderno (desktop/tablet/celular), com foco em iPad no palco.
- Conectividade pode variar; o app mantém operação local com Dexie e sincroniza quando disponível.
- Captura de câmera é local e necessária para controles por gestos.

## 4. Fluxo operacional padrão (palco)

1. Abrir app e autenticar.
2. Sincronizar (opcional, recomendado antes da apresentação).
3. Abrir show/setlist desejado.
4. Entrar no Modo Show.
5. Ajustar tom/fonte conforme necessidade.
6. Acionar modal de configurações (disponível também dentro do Modo Show).
7. Confirmar/ajustar gestos no modal unificado de configuração e teste.
8. Executar apresentação com comandos por toque, pedal HID ou gestos.

## 5. Controles de comando em operação

Comandos suportados:

- `scroll_up`
- `scroll_down`
- `prev_song`
- `next_song`

Default operacional da versão 8.10.0:

- `scroll_up` = punho fechado
- `scroll_down` = mão espalmada
- `next_song` = sinal de rock
- `prev_song` = swipe para direita

## 6. Princípios operacionais

- **Confiabilidade local:** recursos críticos de palco devem funcionar com latência baixa e sem dependência de backend em tempo real.
- **Recuperação rápida:** em erro de câmera/engine de gesto, o operador deve conseguir retentar sem reiniciar a aplicação.
- **Observabilidade para treino:** o usuário deve visualizar último gesto detectado e estado do motor de gestos.
- **Fallback de controle:** toque e pedal permanecem caminhos válidos de comando quando gestos não estiverem ativos.

## 7. Limites e premissas

- Web MIDI não é garantido em iOS Safari padrão; por isso o fluxo de palco prioriza HID e câmera.
- O desempenho de gestos depende de iluminação, enquadramento e estabilidade da mão.
- Processos colaborativos avançados de banda continuam evoluindo conforme backlog e validação de campo.

## 8. Indicadores de sucesso operacional

- Usuário consegue executar show completo sem laptop externo.
- Troca de música e rolagem ocorrem com comando consistente nas entradas configuradas.
- Ajustes de gesto podem ser feitos e testados em um único fluxo no modal de configuração.
- Sincronização pré/pós-show ocorre sem perda de dados locais.

