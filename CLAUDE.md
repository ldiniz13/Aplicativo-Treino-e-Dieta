# PULSO — instruções para o Claude Code

**Leia [HANDOFF.md](HANDOFF.md) antes de qualquer coisa** (estado, estrutura, pendências). A análise de usabilidade está em [docs/SIMPLES-UX.md](docs/SIMPLES-UX.md).

Regras do projeto:

- Idioma: **português do Brasil**, texto de tela em linguagem simples.
- Custo **zero** (só serviços gratuitos) e **Android primeiro** (PWA).
- Existem **duas versões** em `app/`: a completa (`app/index.html`, tag `v2.1.0-completo`) e a Simples (`app/simples/`). **Nunca apague nem simplifique a completa**; novidades de "facilidade de uso" vão para a Simples.
- A versão completa é um arquivo único **sem build**: edite com trechos exatos e valide a sintaxe (comando no HANDOFF, seção 4). Não use `sed`/heredoc para trechos com barra invertida.
- Versão Simples: sem build nem dependências. Mudou algo em `app/simples/`? Suba `CACHE` em `app/simples/sw.js` e `P.VERSAO` em `js/util.js`, rode `node tools/auditar-planos.mjs` e teste em tela de celular (375×812 e 320×568).
- Nunca publique `app/firebase-config.js` com configuração de teste.
- Ao terminar um trabalho: atualize o HANDOFF.md, faça commit e, se for uma versão nova, uma tag (`vMAIOR.MENOR.PATCH-nome`).
