# Git — workflow do ShowPad Pro

Este documento descreve o fluxo de Git do projeto para evitar **HEAD detached** em tags e perda de trabalho.

## Regras

1. **Branch principal de trabalho:** a branch de trabalho principal é sempre **`main`**.

2. **Nunca trabalhar diretamente em uma tag:** não usar `git checkout <tag>` para desenvolver. Isso deixa o repositório em *detached HEAD*; commits feitos nesse estado não ficam ligados a uma branch e são fáceis de perder.

3. **Voltar a uma versão antiga para trabalhar:** criar uma branch a partir da tag:
   ```bash
   git checkout -b nome-da-branch <tag>
   ```

4. **Fluxo padrão de commit:**
   ```bash
   git add .
   git commit -m "descrição"
   git push origin main
   ```

5. **Tags:** são apenas **marcos de versão**, nunca o ponto onde se deve trabalhar no dia a dia.

6. **Quando criar tag:** só criar e enviar tag (`git tag -a` + `git push origin <tag>`) **depois** de o mantenedor **confirmar por escrito** que tudo está ok e que quer salvar uma **versão estável**. Não criar tags automaticamente ao fim de cada tarefa.

7. **Emergência (commits “perdidos”):** o **`git reflog`** registra onde o `HEAD` esteve; em caso de erro, pode ajudar a localizar commits e recuperá-los (por exemplo com `cherry-pick` ou criando uma branch a partir do hash visto no reflog).

Para detalhes sobre reflog e recuperação, consulte a documentação oficial do Git ou peça ajuda antes de reescrever histórico.
