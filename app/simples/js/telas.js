/* PULSO Simples — as telas: Hoje, Plano, Evolução, Ajustes e o assistente "monte meu treino" */
(function () {
  const P = window.P;
  const { $, esc, ic, plural, txtNum, fmtNum, dataCurta, relDia } = P;
  const A = P.A = P.A || {};
  Object.assign(P.ui, { tela: 'hoje', edit: false });
  P.wiz = null;

  const diaCurto = ts => `${P.DIAS[new Date(ts).getDay()].slice(0, 3)} · ${dataCurta(ts)}`;
  const minis = (t, max = 6) => {
    const exs = t.itens.map(i => P.exPorId(i.ex)).filter(Boolean);
    return `<div class="minis">${exs.slice(0, max).map(P.mini).join('')}${exs.length > max ? `<span class="mais">+${exs.length - max}</span>` : ''}</div>`;
  };
  const unidadeDe = ex => ex.unidade === 'seg' ? ' s' : '';
  const cabecalho = (olho, titulo) => `<div class="cab"><div><div class="olho">${olho}</div><h1>${titulo}</h1></div><button class="btn-icone" data-a="ajustes" aria-label="Ajustes">${ic('ajustes')}</button></div>`;

  /* =========================================================  HOJE  ========================================================= */
  function vHoje() {
    const S = P.S;
    const cab = cabecalho(esc(P.dataLonga(Date.now())), `${P.saudacao()}${S.nome ? ', ' + esc(S.nome) : ''}`);
    if (!S.plano) {
      return `${cab}<section class="cartao destaque">
        <div class="olho">Vamos começar</div>
        <h2 class="proximo-nome">Monte seu treino em <span class="degrade">4 toques</span></h2>
        <p class="suave" style="margin:8px 0 18px">O app escolhe os exercícios por você. Depois é só tocar em “Começar treino” e fazer uma série de cada vez.</p>
        <button class="btn btn-pri btn-bloco" data-a="assist-novo">${ic('magia')}Montar meu treino</button>
        <div class="centro" style="margin-top:6px"><button class="btn-link" data-a="plano-zero">Prefiro montar do zero</button></div>
      </section>`;
    }
    const sem = P.semana(), t = P.proximoTreino(), seq = P.seqSemanas(), hoje = P.treinoHoje();
    const dias = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => `<div class="dia ${sem.dias[i] ? 'feito' : ''} ${i === sem.hoje ? 'hoje' : ''}"><i>${sem.dias[i] ? ic('check') : ''}</i>${l}</div>`).join('');
    const instalar = P.instalarEvt && S.historico.length && !S.dicas.instalar
      ? `<div class="dica">${ic('celular')}<div><b>Instale o app no celular</b><br>Abre mais rápido, em tela cheia, e funciona sem internet.<br><button data-a="instalar">Instalar</button> &nbsp; <button data-a="dica-ok" data-id="instalar" style="color:var(--suave)">Agora não</button></div></div>` : '';
    return `${cab}
      <section class="cartao">
        <div class="linha" style="justify-content:space-between"><b>Esta semana</b>${seq ? `<span class="selo">${ic('fogo')}${plural(seq, 'semana seguida', 'semanas seguidas')}</span>` : ''}</div>
        <div class="semana">${dias}</div>
        <div class="suave peq"><b style="color:var(--texto)">${sem.feitos} de ${sem.meta}</b> treinos nesta semana</div>
      </section>
      <section class="cartao destaque">
        <div class="olho">${hoje ? 'Hoje você já treinou 🎉 · próximo' : 'Próximo treino'}</div>
        <div class="linha" style="margin-top:12px"><span class="letra gde">${t.letra}</span><div class="cresce"><h2 class="proximo-nome" style="margin:0">${esc(t.nome)}</h2><div class="suave peq">${esc(P.gruposDoTreino(t) || 'Sem exercícios ainda')}</div></div></div>
        <div style="margin-top:14px">${minis(t)}</div>
        <div class="meta"><span>${ic('lista')}${plural(t.itens.length, 'exercício', 'exercícios')}</span><span>${ic('relogio')}~${P.minutosTreino(t)} min</span></div>
        ${t.itens.length
          ? `<button class="btn btn-pri btn-bloco" data-a="comecar" data-id="${t.id}">${ic('play')}Começar treino</button>`
          : `<button class="btn btn-pri btn-bloco" data-a="ver-treino" data-id="${t.id}">${ic('plus')}Adicionar exercícios</button>`}
        <div class="linha" style="justify-content:center;margin-top:4px"><button class="btn-link" data-a="ver-treino" data-id="${t.id}">Ver exercícios</button><button class="btn-link" data-a="escolher-treino">Escolher outro</button></div>
      </section>
      ${S.historico.length ? '' : P.dica('hoje1', 'Para treinar, é só tocar em <b>Começar treino</b>. O app mostra um exercício de cada vez e já deixa tudo preenchido.')}
      ${instalar}`;
  }

  /* =========================================================  PLANO  ========================================================= */
  function cartaoTreino(t) {
    return `<article class="cartao treino-card">
      <button class="topo" data-a="ver-treino" data-id="${t.id}" style="text-align:left;width:100%"><span class="letra">${t.letra}</span><div class="cresce"><h3>${esc(t.nome)}</h3><div class="suave peq">${esc(P.gruposDoTreino(t) || 'Vazio')}</div></div>${ic('dir')}</button>
      ${t.itens.length ? minis(t) : ''}
      <div class="linha" style="justify-content:space-between"><span class="suave peq">${plural(t.itens.length, 'exercício', 'exercícios')} · ~${P.minutosTreino(t)} min</span>
        <button class="btn btn-peq" data-a="comecar" data-id="${t.id}" ${t.itens.length ? '' : 'disabled'}>${ic('play')}Começar</button></div>
    </article>`;
  }
  function vPlano() {
    const p = P.S.plano;
    const cab = cabecalho('Seus treinos', 'Treinos');
    if (!p) return `${cab}<section class="cartao vazio">${ic('lista')}<p>Você ainda não tem um plano.</p><button class="btn btn-pri" data-a="assist-novo">${ic('magia')}Montar meu treino</button><button class="btn-link" data-a="plano-zero">Prefiro montar do zero</button></section>`;
    return `${cab}
      <section class="cartao"><div class="suave peq">${esc(P.resumoPlano(p))}</div>
        <div class="linha" style="margin-top:12px;flex-wrap:wrap"><button class="btn btn-peq" data-a="assist-novo">${ic('magia')}Refazer plano</button></div></section>
      ${P.dica('plano1', 'Quer trocar um exercício ou mudar séries e repetições? Toque no treino e depois em <b>Editar</b>.')}
      ${p.treinos.map(cartaoTreino).join('')}
      <button class="btn btn-bloco" data-a="novo-treino">${ic('plus')}Novo treino</button>`;
  }

  /* ----- janela do treino (ver e editar) ----- */
  function htmlTreino(tid) {
    const t = P.treinoPorId(tid); if (!t) return '<div class="vazio">Treino não encontrado.</div>';
    const ed = P.ui.edit, p = P.S.plano;
    const topo = ed
      ? `<input class="campo-txt" data-i="nome-treino" data-id="${tid}" value="${esc(t.nome)}" maxlength="40" aria-label="Nome do treino">`
      : `<div class="linha" style="align-items:flex-start"><div class="cresce"><div style="font:700 22px var(--display)">${esc(t.nome)}</div><div class="suave peq">${esc(P.gruposDoTreino(t) || 'Sem exercícios')} · ~${P.minutosTreino(t)} min</div></div></div>`;
    const linhas = t.itens.map((it, i) => {
      const ex = P.exPorId(it.ex); if (!ex) return '';
      if (!ed) return `<button class="ex-linha" data-a="ver-ex" data-id="${ex.id}">${P.mini(ex)}<span class="cresce"><span class="nome">${esc(ex.nome)}</span><br><span class="sub">${it.series} × ${it.reps}${unidadeDe(ex)} · ${esc(P.GRUPOS[ex.grupo])}</span></span>${ic('dir', 'seta')}</button>`;
      return `<div class="ex-linha" style="align-items:flex-start">${P.mini(ex)}<div class="cresce"><div class="nome">${esc(ex.nome)}</div>
        <div class="edita"><span class="mini-stp"><button data-a="aj-item" data-n="${i}" data-c="series" data-d="-1" aria-label="Menos séries">−</button><span>${it.series} séries</span><button data-a="aj-item" data-n="${i}" data-c="series" data-d="1" aria-label="Mais séries">+</button></span>
        <span class="mini-stp"><button data-a="aj-item" data-n="${i}" data-c="reps" data-d="-1" aria-label="Menos repetições">−</button><span>${it.reps}${ex.unidade === 'seg' ? ' s' : ' reps'}</span><button data-a="aj-item" data-n="${i}" data-c="reps" data-d="1" aria-label="Mais repetições">+</button></span></div>
        <div class="edita"><button class="acao-mini" data-a="mover-item" data-n="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${ic('cima')}</button><button class="acao-mini" data-a="mover-item" data-n="${i}" data-d="1" ${i === t.itens.length - 1 ? 'disabled' : ''} aria-label="Descer">${ic('baixo')}</button>
        <button class="btn btn-peq" data-a="trocar-item" data-n="${i}">${ic('trocar')}Trocar</button><button class="acao-mini perigo" data-a="remover-item" data-n="${i}" aria-label="Remover">${ic('lixo')}</button></div></div></div>`;
    }).join('');
    return `${topo}
      <div class="linha" style="justify-content:space-between"><div class="rotulo">${plural(t.itens.length, 'exercício', 'exercícios')}</div><button class="btn btn-peq" data-a="editar-treino">${ed ? ic('check') + 'Pronto' : ic('lapis') + 'Editar'}</button></div>
      <div class="lista-ex">${linhas || '<div class="vazio">Nenhum exercício ainda.</div>'}</div>
      ${ed
        ? `<button class="btn btn-bloco" data-a="add-item">${ic('plus')}Adicionar exercício</button>${p.treinos.length > 1 ? `<button class="btn-link" style="color:var(--verm)" data-a="excluir-treino" data-id="${tid}">Excluir este treino</button>` : ''}`
        : `<button class="btn btn-pri btn-bloco" data-a="comecar" data-id="${tid}" ${t.itens.length ? '' : 'disabled'}>${ic('play')}Começar este treino</button>`}`;
  }
  P.abrirTreino = function (tid, editar = false) {
    P.ui.edit = editar;
    P.abrirFolha({ titulo: () => { const t = P.treinoPorId(tid); return t ? `Treino ${t.letra}` : 'Treino'; }, render: () => htmlTreino(tid), aoFechar: () => { P.ui.edit = false; }, tid });
  };

  /* ----- foto grande e dicas de um exercício ----- */
  P.abrirExercicio = function (id) {
    const ex = P.exPorId(id); if (!ex) return;
    P.abrirFolha({
      titulo: ex.nome,
      render() {
        const c = P.S.cargas[id];
        return `${P.foto(ex, 'grande')}
          <div class="etiquetas"><span class="etiqueta">${esc(P.GRUPOS[ex.grupo])}</span><span class="etiqueta">${esc(ex.equip)}</span>${ex.musculos.slice(1).map(m => `<span class="etiqueta">${esc(m)}</span>`).join('')}</div>
          <div><div class="rotulo">Como fazer</div><p style="margin-top:6px">${esc(ex.dica)}</p></div>
          ${c ? `<div class="cartao"><div class="rotulo">Sua última vez</div><p style="margin-top:4px"><b>${c.kg ? txtNum(c.kg) + ' kg × ' : ''}${c.reps}${unidadeDe(ex) || (c.kg ? '' : ' repetições')}</b> · ${relDia(c.em)}</p></div>` : ''}`;
      },
    });
  };

  /* ----- seletor de exercício (adicionar / trocar): um toque escolhe ----- */
  P.abrirEscolha = function ({ titulo, grupo = 'todos', excluir = [], aoEscolher, manter = false }) {
    const est = { grupo, busca: '' };
    const lista = () => {
      const itens = P.listaEscolha(est);
      return itens.map(e => { const ja = excluir.includes(e.id); return `<button class="item-escolha ${ja ? 'ja' : ''}" data-a="escolher" data-id="${e.id}" ${ja ? 'disabled' : ''}>${P.mini(e)}<span class="cresce"><b style="font-size:15.5px">${esc(e.nome)}</b><br><span class="suave peq">${esc(P.GRUPOS[e.grupo])} · ${esc(e.equip)}</span></span>${ja ? ic('check') : ic('plus')}</button>`; }).join('')
        || '<div class="vazio">Nada encontrado. Tente outro nome ou grupo.</div>';
    };
    const f = P.abrirFolha({
      titulo,
      render() {
        const chips = ['todos', ...P.gruposDisponiveis()].map(g => `<button class="chip ${est.grupo === g ? 'on' : ''}" data-a="escolha-grupo" data-g="${g}">${g === 'todos' ? 'Todos' : esc(P.GRUPOS[g])}</button>`).join('');
        return `<input class="busca" type="search" data-i="busca-escolha" placeholder="Buscar pelo nome…" value="${esc(est.busca)}" aria-label="Buscar exercício">
          <div class="chips">${chips}</div><div id="listaEscolha" class="lista-ex" style="gap:10px">${lista()}</div>`;
      },
    });
    P.escolhaAtual = { est, f, aoEscolher, manter, excluir, atualizarLista: () => { const el = $('#listaEscolha', f.el); if (el) el.innerHTML = lista(); } };
    f.aoFechar = () => { if (P.escolhaAtual && P.escolhaAtual.f === f) P.escolhaAtual = null; };
  };

  /* =========================================================  EVOLUÇÃO  ========================================================= */
  function svgLinha(pts, un) {
    const W = 320, H = 150, pl = 40, pr = 12, pt = 14, pb = 26, n = pts.length;
    let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v));
    if (lo === hi) { lo -= 1; hi += 1; }
    const x = i => n === 1 ? (pl + W - pr) / 2 : pl + i * (W - pl - pr) / (n - 1), y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
    const area = `${d} L${x(n - 1).toFixed(1)} ${H - pb} L${x(0).toFixed(1)} ${H - pb} Z`;
    return `<svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolução">
      <line class="eixo" x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}"/>
      <path class="area" d="${area}"/><path class="linha" d="${d}"/>
      ${pts.map((p, i) => `<circle class="ponto" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3.5"/>`).join('')}
      <text x="${pl - 6}" y="${y(hi) + 4}" text-anchor="end">${txtNum(hi)}</text><text x="${pl - 6}" y="${y(lo) + 4}" text-anchor="end">${txtNum(lo)}</text>
      <text x="${x(0)}" y="${H - 8}" text-anchor="${n === 1 ? 'middle' : 'start'}">${dataCurta(pts[0].t)}</text>${n > 1 ? `<text x="${x(n - 1)}" y="${H - 8}" text-anchor="end">${dataCurta(pts[n - 1].t)}</text>` : ''}
    </svg>`;
  }
  function avancos() {
    const lista = [];
    P.EX.forEach(ex => { const s = P.serieDoExercicio(ex.id); if (s.pts.length >= 2) lista.push({ ex, s, delta: s.pts[s.pts.length - 1].v - s.pts[0].v }); });
    return lista.sort((a, b) => b.delta - a.delta).slice(0, 6);
  }
  function vEvolucao() {
    const S = P.S, sem = P.semana(), seq = P.seqSemanas(), tot = P.tempoTotal();
    const tempo = tot >= 3600 ? fmtNum(tot / 3600, 1) + ' h' : Math.round(tot / 60) + ' min';
    /* últimas 6 semanas */
    const ini = P.inicioSemana(new Date()), semanas = [];
    for (let i = 5; i >= 0; i--) { const d0 = P.addDias(ini, -7 * i), n = S.historico.filter(h => h.ini >= d0.getTime() && h.ini < P.addDias(d0, 7).getTime()).length; semanas.push({ d0, n }); }
    const maxN = Math.max(S.meta, ...semanas.map(s => s.n), 1);
    const barras = semanas.map(s => `<div class="barra ${s.n >= S.meta ? 'cheia' : ''}"><b>${s.n}</b><i style="height:${Math.max(4, s.n / maxN * 100) * 0.62}%"></i><small>${dataCurta(s.d0)}</small></div>`).join('');
    const av = avancos();
    const pesos = S.pesos.slice().sort((a, b) => a.em - b.em), ultimo = pesos[pesos.length - 1];
    const hist = S.historico.slice().sort((a, b) => b.ini - a.ini).slice(0, 12);
    return `${cabecalho('Seu progresso', 'Evolução')}
      <div class="estats">
        <div class="estat"><b>${S.historico.length}</b><small>treinos feitos</small></div>
        <div class="estat"><b>${seq}</b><small>${seq === 1 ? 'semana seguida' : 'semanas seguidas'}</small></div>
        <div class="estat"><b>${tempo}</b><small>treinando</small></div>
      </div>
      <section class="cartao"><div class="linha" style="justify-content:space-between"><b>Treinos por semana</b><span class="suave peq">meta: ${S.meta}</span></div><div class="barras">${barras}</div></section>
      <div class="titulo-sec">Onde você evoluiu</div>
      <section class="cartao">${av.length
        ? av.map(a => `<button class="linha-hist" data-a="grafico" data-id="${a.ex.id}">${P.mini(a.ex)}<span class="cresce"><b>${esc(a.ex.nome)}</b><small>${txtNum(a.s.pts[0].v)} → ${txtNum(a.s.pts[a.s.pts.length - 1].v)} ${a.s.unidade}</small></span>${a.delta > 0 ? `<span class="sobe">+${txtNum(a.delta)}</span>` : `<span class="fraco">=</span>`}</button>`).join('')
        : `<div class="vazio">${ic('grafico')}<p>Depois de 2 treinos com o mesmo exercício, aqui aparece onde você evoluiu.</p></div>`}</section>
      <div class="titulo-sec">Peso corporal <span class="fraco" style="text-transform:none;letter-spacing:0;font-family:var(--font);font-weight:500">(opcional)</span></div>
      <section class="cartao">${ultimo
        ? `<div class="linha" style="justify-content:space-between;align-items:flex-end"><div><div style="font:700 34px var(--display)">${txtNum(ultimo.kg)} <span class="suave" style="font-size:16px">kg</span></div><div class="suave peq">${pesos.length > 1 ? `${ultimo.kg - pesos[0].kg > 0 ? '+' : ''}${txtNum(ultimo.kg - pesos[0].kg)} kg desde ${dataCurta(pesos[0].em)}` : 'Primeiro registro'}</div></div><button class="btn btn-peq" data-a="peso">${ic('plus')}Registrar</button></div>${pesos.length > 1 ? `<div style="margin-top:10px">${svgLinha(pesos.map(p => ({ t: p.em, v: p.kg })))}</div>` : ''}`
        : `<div class="vazio">${ic('balanca')}<p>Quer acompanhar seu peso? É só digitar um número de vez em quando.</p><button class="btn btn-peq" data-a="peso">${ic('plus')}Registrar peso</button></div>`}</section>
      <div class="titulo-sec">Últimos treinos</div>
      <section class="cartao">${hist.length
        ? hist.map(h => `<button class="linha-hist" data-a="hist" data-id="${h.id}"><span class="cresce"><b>${esc(h.nome)}</b><small>${diaCurto(h.ini)} · ${plural(h.itens.length, 'exercício', 'exercícios')} · ${P.fmtMin((h.fim - h.ini) / 1000)}</small></span>${ic('dir', 'seta')}</button>`).join('')
        : `<div class="vazio">${ic('lista')}<p>Seus treinos concluídos aparecem aqui.</p></div>`}</section>`;
  }
  P.abrirGrafico = function (id) {
    const ex = P.exPorId(id); if (!ex) return;
    P.abrirFolha({
      titulo: ex.nome,
      render() {
        const s = P.serieDoExercicio(id); if (!s.pts.length) return '<div class="vazio">Sem registros ainda.</div>';
        return `<div class="suave peq">${s.unidade === 'kg' ? 'Maior carga de cada treino' : 'Maior número de repetições de cada treino'}</div>${svgLinha(s.pts, s.unidade)}
          <div class="lista-ex">${s.pts.slice().reverse().slice(0, 8).map(p => `<div class="avanco"><span>${diaCurto(p.t)}</span><b>${txtNum(p.v)} ${s.unidade}</b></div>`).join('')}</div>`;
      },
    });
  };
  P.abrirHistorico = function (id) {
    P.abrirFolha({
      titulo: 'Treino feito',
      render() {
        const h = P.S.historico.find(x => x.id === id); if (!h) return '<div class="vazio">Não encontrado.</div>';
        return `<div><div style="font:700 21px var(--display)">${esc(h.nome)}</div><div class="suave peq">${esc(P.dataLonga(h.ini))} · ${P.fmtMin((h.fim - h.ini) / 1000)}</div></div>
          <div class="lista-ex">${h.itens.map(it => { const ex = P.exPorId(it.ex); return `<div class="ex-linha" style="align-items:flex-start">${ex ? P.mini(ex) : ''}<div class="cresce"><div class="nome">${esc(ex ? ex.nome : it.ex)}</div><div class="sub">${it.series.map(s => `${s.reps}${ex && ex.unidade === 'seg' ? ' s' : ''}${s.kg ? '×' + txtNum(s.kg) : ''}`).join(' · ')}</div></div></div>`; }).join('')}</div>
          <button class="btn btn-perigo btn-bloco" data-a="excluir-hist" data-id="${id}">${ic('lixo')}Excluir do histórico</button>`;
      },
    });
  };
  P.abrirPeso = function () {
    P.abrirFolha({
      titulo: 'Peso corporal',
      render() {
        const lista = P.S.pesos.slice().sort((a, b) => b.em - a.em).slice(0, 6);
        return `<div class="rotulo">Quanto você pesa hoje?</div>
          <input class="campo-txt" id="campoPeso" inputmode="decimal" placeholder="Ex.: 72,5" autocomplete="off" aria-label="Peso em quilos">
          <button class="btn btn-pri btn-bloco" data-a="salvar-peso">Salvar</button>
          ${lista.length ? `<div class="lista-ex">${lista.map((p, i) => `<div class="avanco"><span>${dataCurta(p.em)}</span><span><b>${txtNum(p.kg)} kg</b> <button class="btn-link" style="min-height:32px;color:var(--verm)" data-a="del-peso" data-em="${p.em}" aria-label="Apagar">${ic('x')}</button></span></div>`).join('')}</div>` : ''}`;
      },
    });
  };

  /* =========================================================  AJUSTES  ========================================================= */
  P.abrirAjustes = function () {
    P.abrirFolha({
      titulo: 'Ajustes',
      render() {
        const S = P.S, d = S.descanso;
        const opcDesc = [['auto', 'Automático'], [45, '45 s'], [60, '1 min'], [90, '90 s'], [120, '2 min']]
          .map(([v, r]) => `<button class="chip ${d === v ? 'on' : ''}" data-a="descanso" data-v="${v}">${r}</button>`).join('');
        return `<section class="cartao">
            <div class="ajuste"><div class="cresce"><b>Seu nome</b></div></div>
            <input class="campo-txt" data-i="nome" value="${esc(S.nome)}" maxlength="24" placeholder="Como quer ser chamado?" aria-label="Seu nome">
            <div class="ajuste" style="margin-top:6px"><div><b>Meta por semana</b><span class="suave peq">Quantos treinos você quer fazer</span></div>
              <span class="mini-stp"><button data-a="meta" data-d="-1" aria-label="Menos">−</button><span>${S.meta}</span><button data-a="meta" data-d="1" aria-label="Mais">+</button></span></div>
            <div class="ajuste" style="display:block"><b>Descanso entre séries</b><span class="suave peq">“Automático” usa o tempo ideal de cada exercício.</span><div class="chips quebra" style="margin-top:10px">${opcDesc}</div></div>
            <div class="ajuste"><b>Som ao fim do descanso</b><button class="interruptor ${S.som ? 'on' : ''}" data-a="alterna" data-k="som" role="switch" aria-checked="${S.som}" aria-label="Som"></button></div>
            <div class="ajuste"><b>Vibração</b><button class="interruptor ${S.vibrar ? 'on' : ''}" data-a="alterna" data-k="vibrar" role="switch" aria-checked="${S.vibrar}" aria-label="Vibração"></button></div>
          </section>
          <section class="cartao">
            <div class="rotulo" style="margin-bottom:8px">Seus dados</div>
            <p class="suave peq" style="margin-bottom:12px">Tudo fica salvo neste aparelho. Para trocar de celular, exporte o backup aqui e importe no outro.</p>
            <div class="grade2"><button class="btn" data-a="exportar">${ic('baixar')}Exportar</button><button class="btn" data-a="importar">${ic('subir')}Importar</button></div>
            <input type="file" id="arquivoBackup" accept="application/json,.json" hidden>
          </section>
          <section class="cartao" style="display:flex;flex-direction:column;gap:10px">
            <button class="btn btn-bloco" data-a="rever-dicas">${ic('luz')}Rever as dicas</button>
            ${P.instalarEvt ? `<button class="btn btn-bloco" data-a="instalar">${ic('celular')}Instalar no celular</button>` : ''}
            <a class="btn btn-bloco" href="../">${ic('link')}Abrir a versão completa</a>
            <button class="btn btn-perigo btn-bloco" data-a="apagar-tudo">${ic('lixo')}Apagar todos os meus dados</button>
          </section>
          <div class="versao">PULSO Simples · versão ${P.VERSAO}</div>`;
      },
    });
  };

  /* =========================================================  ASSISTENTE  ========================================================= */
  const passosDe = P.passosDe = w => w.foco === 'leve' ? ['foco', 'dias'] : (w.local === 'casa' ? ['foco', 'local', 'equip', 'dias', 'tempo'] : ['foco', 'local', 'dias', 'tempo']);
  const opc = (k, v, icone, titulo, sub, on) => `<button class="opcao ${on ? 'on' : ''}" data-a="assist-escolher" data-k="${k}" data-v="${v}"><span class="ic-box">${ic(icone)}</span><span><b>${titulo}</b>${sub ? `<small>${sub}</small>` : ''}</span></button>`;
  P.htmlAssistente = function () {
    const w = P.wiz;
    if (w.previa) return htmlPrevia(w);
    const passos = passosDe(w), id = passos[w.passo];
    const pontos = passos.map((_, i) => `<i class="${i <= w.passo ? 'on' : ''}"></i>`).join('');
    let titulo = '', sub = '', corpo = '', rodape = '';
    if (id === 'foco') {
      titulo = 'Qual é o seu foco?'; sub = 'Pode ser mudado depois.';
      corpo = opc('foco', 'corpo', 'corpo', 'Corpo todo', 'Equilibrado: peito, costas, pernas e braços', w.foco === 'corpo')
        + opc('foco', 'pernas', 'pernas', 'Pernas e glúteos', 'Mais treino para a parte de baixo', w.foco === 'pernas')
        + opc('foco', 'cima', 'braco', 'Parte de cima', 'Peito, costas, ombros e braços', w.foco === 'cima')
        + opc('foco', 'abd', 'abdomen', 'Abdômen e core', 'Barriga mais forte, com treino completo', w.foco === 'abd')
        + opc('foco', 'leve', 'coracao', 'Leve e seguro', 'Para 60+ ou para quem está voltando a treinar. Em casa, sem pressa.', w.foco === 'leve');
    } else if (id === 'local') {
      titulo = 'Onde você vai treinar?';
      corpo = opc('local', 'casa', 'casa', 'Em casa', 'Só com o corpo ou com o que você tiver', w.local === 'casa')
        + opc('local', 'academia', 'predio', 'Na academia', 'Com máquinas, barras e halteres', w.local === 'academia');
    } else if (id === 'equip') {
      titulo = 'O que você tem em casa?'; sub = 'Marque o que tiver. Se não tiver nada, tudo bem: dá para treinar só com o corpo.';
      const e = w.equip;
      corpo = [['barra', 'Barra fixa (de porta ou parede)'], ['elastico', 'Elásticos de treino'], ['peso', 'Halteres, galões ou mochila com peso']]
        .map(([k, r]) => `<button class="opcao ${e[k] ? 'on' : ''}" data-a="assist-equip" data-k="${k}"><span class="ic-box">${ic(e[k] ? 'check' : 'plus')}</span><span><b>${r}</b></span></button>`).join('');
      rodape = `<button class="btn btn-pri btn-bloco" data-a="assist-prox">Continuar</button>`;
    } else if (id === 'dias') {
      titulo = 'Quantos dias por semana?'; sub = w.foco === 'leve' ? 'Para começar, 2 ou 3 dias são ótimos.' : 'Para quem está começando, 3 dias é um bom número.';
      corpo = `<div class="grade-num">${[2, 3, 4, 5].map(n => `<button class="opcao ${w.dias === n ? 'on' : ''}" data-a="assist-escolher" data-k="dias" data-v="${n}"><b>${n}</b><small>dias</small></button>`).join('')}</div>`;
    } else if (id === 'tempo') {
      titulo = 'Quanto tempo por treino?'; sub = 'Define quantos exercícios entram em cada treino.';
      corpo = `<div class="grade-num">${[30, 45, 60].map(n => `<button class="opcao ${w.tempo === n ? 'on' : ''}" data-a="assist-escolher" data-k="tempo" data-v="${n}"><b>${n}</b><small>minutos</small></button>`).join('')}</div>`;
    }
    return `<div class="tela-cheia">
      <div class="assist-topo"><button class="btn-icone" data-a="assist-voltar" aria-label="${w.passo ? 'Voltar' : 'Cancelar'}">${ic(w.passo ? 'esq' : 'x')}</button><div class="pontos">${pontos}</div><span style="width:46px"></span></div>
      <div class="assist-corpo" data-passo="${id}"><h1>${titulo}</h1>${sub ? `<p class="suave">${sub}</p>` : ''}<div class="opcoes">${corpo}</div></div>
      ${rodape ? `<div class="rodape-fixo">${rodape}</div>` : ''}
    </div>`;
  };
  function htmlPrevia(w) {
    const p = w.previa;
    return `<div class="tela-cheia">
      <div class="assist-topo"><button class="btn-icone" data-a="assist-voltar" aria-label="Voltar">${ic('esq')}</button><div class="pontos">${passosDe(w).map(() => '<i class="on"></i>').join('')}</div><span style="width:46px"></span></div>
      <div class="assist-corpo"><h1>Seu plano está pronto 🎉</h1><p class="suave">${esc(P.resumoPlano(p))}</p>
        <div style="display:flex;flex-direction:column;gap:12px">${p.treinos.map(t => `<div class="cartao"><div class="linha"><span class="letra">${t.letra}</span><div class="cresce"><h3>${esc(t.nome)}</h3><div class="suave peq">${esc(P.gruposDoTreino(t))}</div></div></div><div style="margin:12px 0 8px">${minis(t, 7)}</div><div class="suave peq">${plural(t.itens.length, 'exercício', 'exercícios')} · ~${P.minutosTreino(t)} min</div></div>`).join('')}</div>
        <p class="suave peq">Você pode trocar qualquer exercício depois, na aba Plano.</p></div>
      <div class="rodape-fixo"><button class="btn btn-pri btn-bloco" data-a="assist-usar">Usar este plano</button></div>
    </div>`;
  }

  /* =========================================================  CASCA (abas)  ========================================================= */
  P.htmlCasca = function () {
    const t = P.ui.tela, corpo = t === 'plano' ? vPlano() : t === 'evolucao' ? vEvolucao() : vHoje();
    const aba = (id, icone, nome) => `<button class="aba ${t === id ? 'on' : ''}" data-a="aba" data-t="${id}" ${t === id ? 'aria-current="page"' : ''}>${ic(icone)}<span>${nome}</span></button>`;
    return `<main class="tela" data-tela="${t}">${corpo}</main><nav class="abas" aria-label="Seções"><div class="abas-in">${aba('hoje', 'casa', 'Hoje')}${aba('plano', 'halter', 'Plano')}${aba('evolucao', 'grafico', 'Evolução')}</div></nav>`;
  };
  P.htmlTreinoFolha = htmlTreino;
})();
