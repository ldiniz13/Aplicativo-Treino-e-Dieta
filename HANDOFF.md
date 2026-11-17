# PULSO — Handoff

> Última atualização: **2026-11-17** · Leia este arquivo primeiro. Quem retomar o projeto (pessoa ou Claude) deve conseguir continuar só com ele.

## 1. O que é

**PULSO** é o app pessoal de treino, dieta, medidas e evolução do Lucas. Regras do projeto:

- **Custo zero** (só serviços gratuitos) e **Android primeiro** (site instalável, "PWA"). Funciona sem internet.
- Idioma: português do Brasil. O Lucas escreve de forma direta e manda pedidos extras no meio do trabalho.
- Hospedagem: Vercel (projeto `pulso-fit`, pasta `app/`). Login opcional: Firebase (ainda **não ativado**, ver seção 6).

## 2. Duas versões no mesmo site

| | **Completa** (`/`) | **Simples** (`/simples/`) |
|---|---|---|
| Nome interno / tag git | `v2.1.0-completo` | `v3.1.0-rotina` |
| Para quê | Tudo: A/B/C/D com montador, caderno de séries, dieta, medidas, cardio, treino guiado 60+, níveis e medalhas, login | Montar o treino em 4 toques e fazer **uma série de cada vez**. Treino guiado + dieta, medidas, cardio e acompanhamento completo |
| Código | `app/index.html` (arquivo único, 3,1 MB) | `app/simples/` (vários arquivos, **sem etapa de build**) |
| Dados no aparelho | `localStorage` chave `pulso.fit.v1` | `localStorage`: treino em `pulso.simples.v1`; demais módulos compartilham `pulso.fit.v1` |
| Service worker | `app/sw.js` (cache `pulso-v7`) | `app/simples/sw.js` (cache `pulso-simples-v3`) |
| Login/nuvem | Pronto no código, aguardando config | Mesma configuração Firebase da completa; backup unificado em arquivo |

**Decisão importante (2026-11-16):** o Lucas achou a versão completa **difícil de entender** (montar treinos e acompanhar o treino têm funções demais). Em vez de mexer nela, foi criada a **versão Simples ao lado**. **A versão completa não deve ser apagada nem simplificada** ("essa versão está show"). Até a v3.0, as duas interfaces mantinham dados separados. Na v3.1, o treino guiado preserva sua chave original; dieta, medidas e demais módulos reutilizam a chave da interface clássica, e o histórico guiado é incorporado ao acompanhamento sem duplicação.

Por que a versão Simples existe, o que foi cortado e como medir se deu certo: **[docs/SIMPLES-UX.md](docs/SIMPLES-UX.md)**.

## 3. Estrutura de pastas

```
.
├─ HANDOFF.md              este arquivo
├─ CLAUDE.md               aviso curto para o Claude Code ler ao abrir o projeto
├─ LEIA-ME.txt             passo a passo para o Lucas (publicar, ativar login)
├─ PUBLICAR.cmd            dois cliques = publica a pasta app/ na Vercel
├─ firestore.rules         regras do banco (colar no Firebase quando ativar o login)
├─ docs/SIMPLES-UX.md      análise de usabilidade e decisões da versão Simples
├─ tools/extrair-dados.mjs gera a biblioteca de exercícios da versão Simples
├─ tools/auditar-planos.mjs confere os planos gerados (204 combinações)
├─ .claude/launch.json     servidor de teste local (porta 5173, serve app/)
└─ app/                    TUDO que vai para a internet
   ├─ index.html           versão COMPLETA (fonte da verdade, ver seção 4)
   ├─ sw.js · manifest.webmanifest · vercel.json · firebase-config.js · icons/ · tutorial/
   └─ simples/             versão SIMPLES
      ├─ index.html · estilo.css · manifest.webmanifest · sw.js
      └─ js/
         ├─ dados.js   (GERADO) 116 exercícios em português simples
         ├─ fotos.js   (GERADO) fotos embutidas, 1,5 MB, funcionam offline
         ├─ util.js    datas, números, ícones, janelas ("folhas"), som
         ├─ estado.js  dados salvos, semana, sequência, evolução de carga
         ├─ plano.js   gerador automático de plano + edição do plano
         ├─ treino.js  a tela de treino (uma série por vez, descanso, cronômetro)
         ├─ telas.js   Hoje, Plano, Evolução, Ajustes, assistente de 4 perguntas
         └─ app.js     cliques, desenho da tela, backup, instalação
```

## 4. Versão completa (`app/index.html`) — estado e cuidados

- **Fonte da verdade é o próprio `app/index.html`.** Antes ele era montado por partes (`p1_head.html … p8_app.js`) numa pasta temporária de trabalho que **foi apagada** pelo sistema. Não existe mais etapa de build. Edite o arquivo diretamente, com trechos exatos e únicos.
- Depois de editar, **valide a sintaxe** (script inline único):
  ```bash
  node -e "const h=require('fs').readFileSync('app/index.html','utf8');for(const m of h.matchAll(/<script>([\s\S]*?)<\/script>/g)) if(m[1].length>1000) new Function(m[1]);console.log('ok')"
  ```
- Ela é **uma IIFE JavaScript** com seções numeradas (utilitários, constantes `LIB`/`PHOTOS`, estado `S` em `localStorage`, abas, ações por delegação `ACT`, boot). Dados versão 2; `migrate()` preserva dados antigos — se mudar o formato, estenda `migrate()`.
- Fotos: banco *free-exercise-db* (domínio público), embutidas em WebP 320 px (`PHOTOS`); em telas grandes troca pela versão em alta via jsDelivr.
- Login Google/e-mail + nuvem (Firebase, plano grátis) já está no código, **desligado** enquanto `app/firebase-config.js` tiver `window.PULSO_FIREBASE = null`.
- ⚠️ **Nunca publique `firebase-config.js` com configuração falsa/de teste.**
- Só duas mudanças foram feitas nela em 2026-11-16: um atalho "Abrir o PULSO Simples" em Configurações e, no `sw.js`, (a) não apagar o cache da versão Simples e (b) não interceptar `/simples/`.

## 5. Versão Simples (`app/simples/`) — como funciona

**Ideia:** quem abre o app só precisa decidir **uma coisa por vez**. O app decide o resto e a pessoa muda depois, se quiser.

Fluxo principal (≈ 8 toques até a 1ª série, sem digitar):
1. **Hoje** (sem plano) → "Montar meu treino".
2. Assistente: foco → onde treina → (em casa: o que tem) → dias por semana → tempo por treino → prévia do plano → "Usar este plano".
3. **Hoje** mostra o *próximo treino* com um botão grande: "Começar treino". Não há calendário: os treinos **giram sozinhos** (A → B → C → A…).
4. **Treino:** um exercício por vez, foto grande, nome, "Como fazer". Embaixo: repetições e carga já preenchidas (com − e +) e **Série feita**. O descanso começa sozinho, avisa com som/vibração e mostra a próxima série. Exercícios por tempo (prancha) têm contagem regressiva.
5. Fim: resumo com "onde você evoluiu" e progresso da semana.

Regras de comportamento que não devem ser quebradas sem pensar:
- **Sugestão de carga:** repete a última; se na última vez completou todas as séries/repetições, sugere subir um degrau (`passo` do exercício). Estado em `S.cargas[exId] = {kg, reps, ok, em}`.
- **Sequência = semanas seguidas batendo a meta** (não dias seguidos): treinar 3×/semana não pode "quebrar" a sequência a cada dia de descanso.
- **Editar é opcional e por toque** (Plano → treino → Editar): séries/reps com ± , ▲▼, Trocar (mostra parecidos), Adicionar (busca + grupos), Remover. Sem arrastar e soltar.
- Dicas de primeiro uso aparecem **uma vez** (`S.dicas`, função `P.dica`); "Ajustes → Rever as dicas" reativa.
- Plano **Leve e seguro** (60+ / voltando a treinar): usa só os 18 exercícios `h_s_*`, em casa, sem perguntar tempo.

### Dados (`localStorage`, chave `pulso.simples.v1`)
```
{ v, nome, meta, descanso:'auto'|segundos, som, vibrar,
  plano: { id, foco, local, equip:{barra,elastico,peso}, dias, tempo, treinos:[{id, letra, nome, itens:[{ex, series, reps}]}] },
  proximo,                       // índice do próximo treino na rotação
  historico: [{id, ini, fim, treinoId, nome, itens:[{ex, series:[{reps, kg}]}]}],
  cargas: { exId: {kg, reps, ok, em} },
  pesos: [{em, kg}], sessao: null | treino em andamento (ver treino.js), dicas: {} }
```

### Como mexer
- **Rodar local:** servidor `pulso` do `.claude/launch.json` (porta 5173) e abrir `http://localhost:5173/simples/`. Ao testar, **desregistre o service worker** (ele guarda CSS/JS em cache) ou o navegador mostra a versão velha.
- **Mudou qualquer arquivo de `app/simples/`?** suba o número em `CACHE` de `app/simples/sw.js` (`v1` → `v2`) para os celulares atualizarem. Mude também `P.VERSAO` em `js/util.js`.
- **Trocar/adicionar exercícios:** edite as listas `PREFERENCIA`/`LEVES` em `tools/extrair-dados.mjs` e rode `node tools/extrair-dados.mjs` (lê a versão completa; **não** a altera). A **ordem** é a preferência do gerador (primeiro = mais simples/seguro).
- **Mudar como os planos são montados:** `js/plano.js` → `RECEITAS` (músculos por treino), `PLANOS` (foco × dias → treinos), `N_POR_TEMPO`. Depois, rode `node tools/auditar-planos.mjs`: gera as 204 combinações do assistente e confere que nenhum treino fica com menos de 3 exercícios, repete exercício ou usa algo indisponível. **Rode antes de publicar.**
- Sem build, sem dependências, sem framework. Scripts comuns (`<script defer>`) com um objeto global `P`; funciona abrindo `index.html` direto.

## 6. Pendências e como retomar

1. **Publicar** (nada da versão Simples está no ar ainda): dois cliques em `PUBLICAR.cmd`. Isso publica a versão completa **e** a Simples (`/simples/`). *Não foi verificado qual versão está no ar hoje.*
2. **Login (Firebase)** — aguardando o Lucas criar o projeto Firebase e mandar o bloco `firebaseConfig`. Passo a passo completo em `LEIA-ME.txt` ("ATIVAR LOGIN"). Quando chegar: colar em `app/firebase-config.js`, publicar, adicionar o domínio da Vercel em *Authentication → Domínios autorizados* e colar `firestore.rules` nas regras do Firestore.
3. **Testar a versão Simples com pessoas reais** (o Lucas, um amigo e, de preferência, uma pessoa mais velha) e anotar onde travam. Roteiro e critérios em `docs/SIMPLES-UX.md`. **Foi testada só em Chrome emulando celular (375×812 e 320×568), não em um Android de verdade.**
4. Candidatos para a Simples (só adicionar se o teste mostrar que faz falta, **sempre na forma mais simples possível**): login e nuvem (os dados são pequenos, cabe num documento só), dieta leve, medidas leves, contar repetições por voz, lembrete de treino.
5. Dúvidas em aberto: migrar dados da versão completa para a Simples? (hoje não). A versão Simples deveria virar a página inicial (`/`)? (decidir depois do teste com pessoas).

## 7. Limitações conhecidas (Simples)

- Aviso do fim do descanso (som/vibração) só toca com o app aberto; com a tela apagada o app tenta manter a tela ligada (Wake Lock), mas depende do navegador.
- Tempo estimado do treino é aproximado (fórmula em `P.minutosTreino`).
- Os planos gerados são genéricos e **não são orientação médica ou de profissional de educação física**.
- Fotos vêm do *free-exercise-db* (domínio público); 2 quadros por exercício.

## 8. Git e versões

- Repositório local em `main`. **Tags:** `v2.1.0-completo` (versão completa preservada), `v3.0.0-simples` (versão Simples). Convenção: `vMAIOR.MENOR.PATCH-nome`.
- Para voltar à versão completa intacta: `git checkout v2.1.0-completo -- app/index.html`.
- **GitHub definido pelo Lucas:** https://github.com/ldiniz13/Aplicativo-Treino-e-Dieta · remoto `origin` · branch `main`. A autenticação local do GitHub CLI foi validada com permissão ADMIN.
- `app/.vercel/` (ligação local com a Vercel) fica fora do git; cada computador gera a sua ao publicar.
- Commits novos usam o endereço `noreply` do GitHub, mantendo a proteção de e-mail privado ativada.

## 9. Armadilhas já encontradas

- Ao editar por terminal/heredoc, **barras invertidas** (`\b`, `\\`) são alteradas: use as ferramentas de edição de arquivo, não `sed`/`echo`, para trechos com `\`.
- Heredocs muito longos falham; escreva arquivos com a ferramenta de arquivo.
- O servidor `python -m http.server` não suporta *Range*: vídeo não avança ao testar localmente (na Vercel funciona).
- Texto de interface: português simples, sem jargão (evitar PR, volume, XP, "série concluída por rep"…).


## 10. Retomada em 2026-11-17 - feedback do Lucas

- Projeto aberto no CLI; servidor local na porta 5173, servindo `app/`. `/simples/` respondeu HTTP 200 e o endereço foi enviado ao navegador padrão.
- **Feedback do Lucas:** gostou do começo guiado da Simples, que direciona a montagem do treino. Sentiu falta do restante do app, que era o diferencial.
- **Direção para a próxima iteração:** manter a entrada guiada e recuperar os demais módulos da experiência completa, com navegação fácil. Treino e evolução sozinhos não representam toda a proposta.
- Dieta, medidas, cardio e os demais recursos continuam preservados na completa em `/`. A Simples continua em `/simples/`.
- A integração foi implementada na **v3.1.0**, descrita abaixo. A publicação na Vercel ainda não foi feita nesta sessão.
- Instruções comuns de CLI e desktop em `../AGENTS.md`: handoffs atualizados, cuidado com trabalho paralelo e versionamento no GitHub.
- No início desta retomada: repositório limpo, `main`, commit `a5e67c1`, sem remoto `origin`. GitHub em configuração.


## 11. PULSO 3.1.0 — rotina completa com início guiado

### O que mudou

- `/simples/` agora tem cinco áreas: **Hoje, Treinos, Dieta, Evolução e Mais**.
- O assistente e o treino de uma série por vez foram mantidos. Hoje acrescenta atalhos de alimentação e água e sugere o próximo passo sem bloquear o treino.
- Dieta recupera o questionário, cardápio, banco de alimentos, refeições, macronutrientes, água, frutas/vegetais e etiquetas do dia.
- Evolução mantém o progresso do treino e oferece Corpo (medidas) e Conquistas. Mais reúne cardio, treino acompanhado com voz, biblioteca/planos anteriores, conta e preferências.
- Os módulos usam o mesmo motor e dados da interface clássica, dentro da navegação guiada. A interface clássica em `/` foi preservada.
- Treinos concluídos e pesos da interface guiada entram no acompanhamento completo com identificadores estáveis, sem duplicar e sem apagar registros anteriores.
- Backup completo reúne os dois blocos de dados e aceita backups anteriores. Importar um backup antigo de treino não apaga a dieta e medidas que ele não contém.

### Código

- `app/simples/js/rotina.js`: navegação, resumo do dia, próximos passos e backup unificado.
- `app/simples/rotina.css`: navegação de cinco áreas e telas responsivas.
- `app/modulos/integracao.js` e `.css`: adaptador dos módulos existentes; ativado apenas por `?integrado=...`.
- `app/index.html`: pequenos pontos de integração e bibliotecas locais; funções originais preservadas.
- `app/vendor/`: versões já utilizadas de Lucide e Chart.js, com suas licenças, disponíveis sem CDN.
- `tools/testar-rotina.cjs`: teste de integração em navegador isolado.

### Execução e verificação

- Servidor: `python -m http.server 5173 --bind 127.0.0.1 --directory app`.
- Versão nova: http://127.0.0.1:5173/simples/
- Interface clássica: http://127.0.0.1:5173/
- Auditoria do gerador: `node tools/auditar-planos.mjs` — 204 combinações, 0 problemas nesta sessão.
- Teste de integração: instalar Playwright em pasta temporária e apontar `NODE_PATH` para seu `node_modules`; executar `node tools/testar-rotina.cjs` com o servidor acima ativo.
- Não foi usado o perfil pessoal do navegador nos testes.

### Pendências reais

- Firebase continua não ativado: `app/firebase-config.js` não foi alterado. Sem configuração, o app informa que os dados ficam no aparelho e oferece backup. Não anunciar sincronização entre dispositivos como pronta.
- Conferir em Android real, especialmente voz, vibração e instalação. Os testes automatizados usam navegador de desktop com viewport de celular.
- Esta sessão preparou código e versionamento; não publicou uma nova implantação na Vercel.


### Validação final desta versão

- Teste de integração concluído com `PULSO_QA_OK`: assistente, plano, dieta/água, medidas, cardio, acompanhamento, treino com voz, conta, biblioteca e backup completo.
- Um treino foi concluído pelo fluxo real de tela, incorporado ao acompanhamento e reaberto duas vezes: sem duplicação e preservando cardio e medidas.
- Navegação conferida nas larguras 320, 375 e 1280 px; sem rolagem horizontal na página principal.
- Recarga e módulo de dieta/hidratação testados sem internet após o cache assumir a página. Bibliotecas de ícones e gráficos ficam locais.
- Tag desta entrega: `v3.1.0-rotina`. O estado do envio ao GitHub deve ser conferido pelo remoto, sem presumir publicação na Vercel.


### GitHub confirmado

- Código enviado e verificado em https://github.com/ldiniz13/Aplicativo-Treino-e-Dieta.
- Commit da versão: `ba52c5833206823329819f095b689feae052699e`; tag publicada: `v3.1.0-rotina`.
- As tags históricas `v2.1.0-completo` e `v3.0.0-simples` continuam locais: o GitHub bloqueou esses refs pelo e-mail privado nos commits antigos. Não use `push --tags` para contornar isso; envie explicitamente a nova tag e a branch. A proteção de privacidade foi mantida.
- O token de ambiente usado por outros programas foi preservado. Git usa o login local do GitHub CLI, salvo no cofre do Windows, por um helper específico para github.com.
- Foi criado um repositório privado vazio `ldiniz13/pulso-fit` na tentativa inicial. Ele não recebeu o código e não é o remoto do projeto; foi preservado sem exclusão.
- A implantação Vercel de produção não foi alterada nesta tarefa. A versão atual pode ser conferida no servidor local.
