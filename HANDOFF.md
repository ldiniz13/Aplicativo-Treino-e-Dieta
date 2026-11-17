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
| Nome interno / tag git | `v2.1.0-completo` | `v3.0.0-simples` |
| Para quê | Tudo: A/B/C/D com montador, caderno de séries, dieta, medidas, cardio, treino guiado 60+, níveis e medalhas, login | Montar o treino em 4 toques e fazer **uma série de cada vez**. Só treino + evolução |
| Código | `app/index.html` (arquivo único, 3,1 MB) | `app/simples/` (vários arquivos, **sem etapa de build**) |
| Dados no aparelho | `localStorage` chave `pulso.fit.v1` | `localStorage` chave `pulso.simples.v1` |
| Service worker | `app/sw.js` (cache `pulso-v5`) | `app/simples/sw.js` (cache `pulso-simples-v1`) |
| Login/nuvem | Pronto no código, aguardando config | Ainda não tem (só backup em arquivo) |

**Decisão importante (2026-11-16):** o Lucas achou a versão completa **difícil de entender** (montar treinos e acompanhar o treino têm funções demais). Em vez de mexer nela, foi criada a **versão Simples ao lado**. **A versão completa não deve ser apagada nem simplificada** ("essa versão está show"). As duas não compartilham dados (chaves diferentes) — de propósito, para uma não estragar a outra.

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
- **Ainda não há repositório remoto (GitHub).** Para criar: `gh repo create` ou criar no site e `git remote add origin …`. Ver a pergunta ao Lucas no fim da sessão de 2026-11-16.
- `app/.vercel/` (ligação local com a Vercel) fica fora do git; cada computador gera a sua ao publicar.
- Identidade do git é só local ao repositório (`user.name = Lucas`, `user.email = ldiniztavares@gmail.com`); ajuste se quiser.

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
- A integração dos módulos **ainda não foi implementada**. Nesta retomada não houve alteração no código do app nem publicação de nova versão.
- Instruções comuns de CLI e desktop em `../AGENTS.md`: handoffs atualizados, cuidado com trabalho paralelo e versionamento no GitHub.
- No início desta retomada: repositório limpo, `main`, commit `a5e67c1`, sem remoto `origin`. GitHub em configuração.
