# Prompt Padrão de Release (Mobile Nativo)

```text
Atue como Mobile Release Manager (iOS/Android) + Documentation Lead.

Contexto:
- App: <NOME_APP>
- Plataformas: <iOS | Android | ambas>
- Stack: <Swift/Kotlin/Flutter/React Native/etc.>
- Versão atual: <VERSAO_ATUAL>
- Nova versão: <X.Y.Z>
- Build number/code: <BUILD_NUMBER/VCODE>
- Data: <AAAA-MM-DD>
- Idioma: pt-BR

Objetivo:
Fechar release estável mobile com consistência entre versão técnica, versão exibida no app, notas de release e documentação operacional.

Atualizações obrigatórias:
1. Manifestos de versão mobile
- iOS: CFBundleShortVersionString + CFBundleVersion.
- Android: versionName + versionCode.
- Framework cross-platform: atualizar arquivo equivalente.

2. Tela “Sobre”/Settings do app
- Exibir versão v<X.Y.Z> e build atual.

3. CHANGELOG.md
- Nova seção:
  ## [X.Y.Z] - <AAAA-MM-DD>
- Adicionado / Alterado / Corrigido.
- Destaque de impacto em UX, performance, compatibilidade e estabilidade.

4. README.md
- Versão atual, requisitos de build, links para docs de release.

5. ROADMAP.md
- Baseline estável atual.
- Próximas frentes (features, dívida técnica, qualidade de release).

6. REQUISITOS_FUNCIONAIS.md
- RFs validados desta versão.
- Fluxos críticos mobile (offline, permissões, background, notificações, sincronização).

7. CONCEITO_DE_OPERACOES.md
- Cenários de uso real (campo, baixa rede, bateria, interrupções).
- Estratégia de fallback (sem rede, sem permissão de câmera/microfone/Bluetooth).
- Procedimentos de suporte e diagnóstico.

8. Release notes para lojas (App Store / Play Store)
- Texto curto orientado ao usuário final.
- Mudanças principais e correções.

9. Checklist de submissão
- Assinatura/certificados, testes em dispositivos, políticas de privacidade, permissões e conformidade.

Critérios:
- Versão e build coerentes em todos os pontos.
- Texto de release claro para usuário e para equipe técnica.
- Foco em estabilidade e operação real em dispositivo.

Saída:
1) Arquivos alterados.
2) Release notes das lojas (pt-BR).
3) Checklist de publicação.
4) Commit message sugerida.
5) Tag sugerida: v<X.Y.Z>.
```
