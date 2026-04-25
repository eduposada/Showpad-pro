# Roadmap Nativo: Controles de Palco

## Objetivo

Evoluir os controles de palco (rolagem e navegação de músicas) para apps nativos iOS e Android, preservando o mesmo contrato de comandos usado no web.

## Contrato de comandos (único para todas as plataformas)

- `scroll_up`
- `scroll_down`
- `prev_song`
- `next_song`

No app web, esses comandos são disparados por toque, pedal HID e gestos de câmera.
No app nativo, esse mesmo contrato deve receber entradas de MIDI nativo, gestos e botões físicos.

## Fase iOS (TestFlight)

1. Criar app iOS com WebView para o ShowPad.
2. Implementar camada nativa de MIDI (CoreMIDI) e encaminhar os eventos para o contrato de comandos.
3. Expor canal bridge entre nativo e WebView (postMessage).
4. Distribuir por TestFlight para validação de palco.

## Fase Android

1. Criar app Android com WebView.
2. Implementar camada de MIDI Android e bridge para WebView.
3. Reusar o mesmo contrato de comandos já usado no iOS.

## Critérios de estabilidade antes de publicação

- Funciona offline com PWA e com app nativo.
- Comandos de palco respondem com baixa latência.
- Fallback de toque continua funcional sem hardware externo.
- Fluxo de shows não regressa em relação à versão web estável.
