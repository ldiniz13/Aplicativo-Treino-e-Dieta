# PULSO — instruções de continuidade

Leia `HANDOFF.md` antes de editar e confira `git status` para preservar o trabalho de outras sessões.

- Produto: treino, alimentação e acompanhamento completos, com uma entrada guiada e linguagem simples em português do Brasil.
- Custo zero e Android primeiro. Não exigir conta para começar.
- Preserve a interface clássica e seus dados. O início guiado fica em `app/simples/`; os módulos compartilham a lógica existente por `app/modulos/`.
- Preserve as chaves de dados existentes. Valide a migração e os backups quando alterar persistência.
- Sem build e sem dependências de execução a instalar. Bibliotecas locais em `app/vendor/` devem manter suas licenças.
- Ao editar a interface guiada, atualize `P.VERSAO` e o cache do service worker. Atualize o cache principal se mudar a interface clássica ou os módulos.
- Verifique sintaxe, execute a auditoria dos planos e teste os fluxos afetados no navegador. Não use os dados pessoais do perfil do navegador para testes.
- Finalize atualizando o handoff, fazendo commit dos arquivos da tarefa e push para o remoto `origin`. Use tags de versão e nunca force push.
- Repositório indicado pelo Lucas: https://github.com/ldiniz13/Aplicativo-Treino-e-Dieta.
