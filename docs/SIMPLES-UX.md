# PULSO Simples — por que existe e como foi pensado

> Escrito em 2026-11-16. Complementa o [HANDOFF.md](../HANDOFF.md).

## 1. O problema (palavras do Lucas)

> "Fica muito complicado montar treinos e entender como acompanhar os treinos. Tem muita função, e acabamos caindo na armadilha da dificuldade de entendimento do usuário."

Quem criou o app (e conhece cada função) não enxerga mais a dificuldade. A pessoa que abre pela primeira vez, sim.

## 2. Diagnóstico da versão completa

Leitura do código (`app/index.html`), **não** teste com usuários. Os números são contagens do que está na tela.

**Só a aba Treinos mostra ~12 blocos de uma vez:** faixa de instalar, faixa do tutorial, faixa de demonstração, alternador Em casa/Academia, cartão "Hoje" (com 3 atalhos), faixa da semana, "Meus treinos" (Sugestões + Montar), treino guiado 60+, cardio, biblioteca de exercícios (chips de músculo + chips de equipamento + lista), últimos treinos.

**Conceitos que a pessoa precisa aprender antes do primeiro treino:** modo casa/academia · programas sugeridos (filtrados por sexo, local e objetivo) · planos A/B/C/D · montador "quebra-cabeça" com arrastar e soltar · calendário da semana · treino livre · caderno de séries · cronômetro "início/fim do exercício" · descanso · recorde (PR) · volume · XP/níveis/medalhas.

**Caminho até a primeira série registrada (estimativa):** abrir o app → escolher modo → Sugestões → escolher programa → aplicar/encaixar na semana → Iniciar treino → Abrir treino (caderno) → digitar repetições e carga em cada série → usar início/fim do exercício. Mais de 10 decisões/toques e digitação.

**Sintomas de "armadilha de complexidade":**
1. Muitas opções de igual importância na mesma tela (ninguém sabe qual é o caminho principal).
2. A pessoa precisa *construir* algo (o plano) antes de poder *usar* o app.
3. Jargão de academia (PR, volume, séries) e de jogo (XP, medalhas) misturados.
4. Registrar exige digitar números em vários campos, no meio do treino, com a mão suada.
5. Funções que o criador adora (puzzle, cronômetro de início/fim) viram trabalho para quem só quer treinar.

## 3. O que o mercado e a literatura dizem (força da evidência: **fraca**)

A busca encontrou sobretudo blogs de UX e de fornecedores de apps, **não** estudos controlados. Serve como consenso de prática, não como prova. Pontos que se repetem:

- O fluxo central de um app de treino é: ver o próximo exercício → registrar a série → descansar → repetir. Registrar deve caber **em um toque grande**, com os valores da última vez já preenchidos e o **descanso começando sozinho**.
- A tela de treino é onde o app é julgado: números grandes, uso com uma mão.
- Excesso de escolha derruba a adesão (ex.: uma grade de programas leva a "abrir, pensar 5 minutos e fechar"). A recomendação é **mostrar no máximo ~3 ações no primeiro uso** e revelar o resto aos poucos ("*progressive disclosure*").
- Os melhores apps não têm mais funções: têm o **caminho mais curto até o primeiro treino concluído**. Pedir conta cedo demais também afasta.

Leituras consultadas: [Fitness App Design: UI and UX Tips](https://madegooddesigns.com/fitness-app-design/) · [Simple Workout App: guide to minimalist tracking](https://setgraph.app/ai-blog/simple-workout-app-guide) · [Gymkee: timer, menu and logging sets](https://gymkee.com/help/athlete/during-your-workout-on-gymkee-timer-menu-and-logging-sets/) · [Why do users abandon fitness apps](https://autentika.com/blog/why-do-users-abandon-fitness-apps) · [Fitness app onboarding guide](https://dev.to/paywallpro/fitness-app-onboarding-guide-data-motivation-completion-an0) · [How to stop users quitting during setup](https://thisisglance.com/learning-centre/how-do-you-stop-users-quitting-during-your-app-setup).
(As porcentagens de abandono citadas nesses textos não foram verificadas e **não** foram usadas nas decisões.)

## 4. Princípios da versão Simples

1. **Uma ação principal por tela.** Hoje = "Começar treino". Treino = "Série feita". Assistente = a pergunta da vez.
2. **O app decide, a pessoa corrige depois.** Plano gerado a partir de 4 respostas; editar é opcional e fica escondido atrás de "Editar".
3. **Quase nada de digitar.** Valores da última vez já preenchidos, ajuste com − e +, e **sugestão automática de subir a carga** quando a pessoa completou tudo.
4. **Palavras comuns.** "Onde você evoluiu", "Série feita", "Estou pronto". Sem PR, volume, XP.
5. **Ensinar na hora, uma vez.** Dicas curtas no primeiro uso, dispensáveis, em vez de tutorial em vídeo.
6. **Perdoar.** Treinos giram em ordem (sem calendário que "cobra"); sequência conta **semanas** batendo a meta; existem *Desfazer*, *Fazer depois* (aparelho ocupado), *Pular* e *Trocar*.
7. **Pouco para escolher:** 5 focos, 2 locais, 4 opções de dias, 3 de tempo.
8. **Sem conta e sem internet para começar.** Conta só quando houver motivo (trocar de celular).

## 5. De → Para (o que mudou e por quê)

| Versão completa | Versão Simples | Motivo |
|---|---|---|
| Montador A/B/C/D com quebra-cabeça (arrastar e soltar) | Assistente de 4 perguntas gera o plano; editar por toque (±, ▲▼, Trocar, Adicionar) | Arrastar é difícil no celular e exige entender o conceito de "montar" |
| Catálogo de programas sugeridos por sexo/local/objetivo | Gerador automático (204 combinações auditadas) | Escolher entre muitos programas paralisa |
| Calendário da semana com dias atribuídos | Rotação automática do "próximo treino" | Faltar um dia não vira "erro" |
| Caderno de séries: digitar reps e kg + cronômetro início/fim | Uma série por vez, valores preenchidos, "Série feita", descanso automático | Menos campos, menos toques, mão livre |
| Biblioteca de 180 exercícios sempre visível | 116 escolhidos; aparecem só em "Trocar"/"Adicionar" | O comum é seguir o plano, não navegar na biblioteca |
| Níveis, XP e 24 medalhas | Só semanas seguidas + "onde você evoluiu" | Motivação simples e honesta; o resto vira ruído |
| PR, volume, gráficos de carga | "30 → 40 kg (+10)" e um gráfico por exercício | Mesma informação, sem jargão |
| Dieta, medidas, cardio, treino guiado 60+, login | **Fora da v3.0** (continuam na versão completa) | O pedido era treinar e acompanhar; entram depois só se fizerem falta |
| Tutorial em vídeo de 2 min | Dicas de primeiro uso (uma vez) | Ninguém assiste vídeo antes de usar |

## 6. Como saber se funcionou (roteiro de teste)

Com 3 pessoas (Lucas, um amigo, uma pessoa mais velha), celular na mão, **sem explicar nada**:

1. "Abra e monte um treino para você." → anotar o tempo até chegar na tela de treino e **quantas vezes perguntou algo**.
2. "Faça a primeira série." → conseguiu? Tocou onde?
3. "Troque um exercício do treino A." → achou o Editar?
4. "Veja se você evoluiu." → entendeu a tela Evolução?

**Bom sinal:** montar + 1ª série em **menos de 2 minutos**, **no máximo 1 dúvida** por pessoa, e ninguém precisou do vídeo. Anotar também o que **sentiram falta** (isso decide o que volta, em forma simples).

## 7. Auditoria automática do gerador de planos

`node tools/auditar-planos.mjs` roda todas as combinações do assistente (foco × local × equipamento × dias × tempo = 204) e confere: nenhum treino com menos de 3 exercícios, nenhum exercício repetido dentro do treino, nenhum exercício indisponível para o local/equipamento escolhido. Rode **antes de publicar** qualquer mudança em `js/plano.js` ou na lista de exercícios.

## 8. Riscos e dúvidas

- Gerador é genérico: pessoas com lesões ou necessidades específicas precisam de orientação profissional (o app não dá).
- Carga inicial vem da biblioteca (ex.: 60 kg no supino) e pode estar errada para iniciantes: o app avisa "ajuste a carga para o que for confortável". Se o teste mostrar problema, começar vazio ou com valores bem menores.
- "Sequência em semanas" é decisão de produto, não validada: se as pessoas sentirem falta de "dias seguidos", reavaliar.
- Não testado em Android real, nem leitor de tela (botões têm `aria-label`, mas não foi auditado).
