/* PULSO Simples — a tela de treino: um exercício por vez, um botão grande, descanso automático.
   Estado do treino em andamento: P.S.sessao =
   { treinoId, nome, ini, atual, fase:'serie'|'descanso', descansoFim, descansoTotal, cur:{reps,kg}, cont:null|{ini,fim,dur},
     itens:[{ ex, series, reps, feitas:[{reps,kg}], pulado }] }   (o treino de hoje é uma cópia; mexer nele não altera o plano) */
(function () {
  const P = window.P;
  const { $, esc, ic, fmtRelogio, txtNum, arred, clamp } = P;
  P.ui = P.ui || {};

  /* ---------- tela ligada durante o treino ---------- */
  let trava = null;
  P.pedirTela = async function () {
    try { if ('wakeLock' in navigator && !trava) { trava = await navigator.wakeLock.request('screen'); trava.addEventListener('release', () => { trava = null; }); } } catch (e) { /* sem suporte */ }
  };
  P.liberarTela = function () { try { if (trava) trava.release(); } catch (e) { /* ok */ } trava = null; };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && P.S.sessao) P.pedirTela(); });

  /* ---------- começar ---------- */
  P.iniciarTreino = function (tid) {
    const t = P.treinoPorId(tid);
    if (!t || !t.itens.length) { P.toast('Esse treino está vazio. Adicione exercícios no Plano.'); return; }
    P.fecharTodas();
    P.S.sessao = {
      treinoId: t.id, nome: `Treino ${t.letra} · ${t.nome}`, ini: Date.now(), atual: 0, fase: 'serie', descansoFim: 0, descansoTotal: 0, cur: null, cont: null,
      itens: t.itens.map(i => ({ ex: i.ex, series: i.series, reps: i.reps, feitas: [], pulado: false })),
    };
    prepararSerie(); P.salvar(); P.pedirTela(); P.render();
  };

  /* ---------- sugestão de carga: repete a última; se completou tudo, sobe um degrau ---------- */
  function sugestao(ex, it) {
    const c = P.S.cargas[ex.id];
    let kg = ex.carga > 0 ? ex.carga : 0, subiu = false;
    if (c && ex.carga > 0) { kg = c.kg; if (c.ok) { kg = arred(c.kg + ex.passo); subiu = true; } }
    return { kg, reps: it.reps, subiu, ultima: c || null };
  }
  function prepararSerie() {
    const s = P.S.sessao, it = s.itens[s.atual], ex = P.exPorId(it.ex), ult = it.feitas[it.feitas.length - 1];
    const sg = sugestao(ex, it);
    s.cur = ult ? { reps: ult.reps, kg: ult.kg } : { reps: sg.reps, kg: sg.kg };
    s.cont = null; s.fase = 'serie';
  }
  function proximoIndice(s) {
    for (let j = s.atual + 1; j < s.itens.length; j++) if (!s.itens[j].pulado && s.itens[j].feitas.length < s.itens[j].series) return j;
    return -1;
  }

  /* ---------- ações durante o treino ---------- */
  P.ajustarCur = function (campo, d) {
    const s = P.S.sessao; if (!s || !s.cur) return;
    const ex = P.exPorId(s.itens[s.atual].ex), tempo = ex.unidade === 'seg';
    const passo = campo === 'kg' ? (ex.passo || 1) : (tempo ? 5 : 1);
    s.cur[campo] = clamp(arred(s.cur[campo] + d * passo), campo === 'reps' ? 1 : 0, campo === 'kg' ? 1000 : (tempo ? 600 : 300));
    const inp = $(`[data-i="${campo}"]`); if (inp) inp.value = txtNum(s.cur[campo]);
    P.salvar();
  };
  P.digitarCur = function (campo, valor) {
    const s = P.S.sessao; if (!s || !s.cur) return;
    const n = P.lerNum(valor); if (n != null && n >= 0) s.cur[campo] = n;
  };
  P.serieFeita = function () {
    const s = P.S.sessao; if (!s || s.fase !== 'serie') return;
    const it = s.itens[s.atual];
    if (!(s.cur.reps > 0)) s.cur.reps = 1;
    it.feitas.push({ reps: s.cur.reps, kg: s.cur.kg || 0 }); s.cont = null;
    P.vibrar(40);
    if (it.feitas.length >= it.series && proximoIndice(s) < 0) { P.concluirTreino(); return; }
    const dur = P.descansoDe(P.exPorId(it.ex));
    s.fase = 'descanso'; s.descansoTotal = dur; s.descansoFim = Date.now() + dur * 1000;
    P.salvar(); P.render();
  };
  function fimDescanso(avisar) {
    const s = P.S.sessao; if (!s || s.fase !== 'descanso') return;
    const it = s.itens[s.atual];
    if (it.feitas.length >= it.series) { const j = proximoIndice(s); if (j < 0) { P.concluirTreino(); return; } s.atual = j; }
    prepararSerie();
    if (avisar) { P.bip(2); P.vibrar([200, 100, 200]); }
    P.salvar(); P.render();
  }
  P.pularDescanso = () => fimDescanso(false);
  P.maisDescanso = function (seg) { const s = P.S.sessao; if (s && s.fase === 'descanso') { s.descansoFim += seg * 1000; s.descansoTotal += seg; P.salvar(); } };
  P.desfazerSerie = function () {
    const s = P.S.sessao; if (!s) return;
    const it = s.itens[s.atual]; if (!it.feitas.length) return;
    const f = it.feitas.pop(); s.fase = 'serie'; s.cont = null; s.cur = { reps: f.reps, kg: f.kg };
    P.salvar(); P.render();
  };
  /* exercícios por tempo (prancha etc.): contagem regressiva com 3 s para se posicionar */
  P.iniciarCont = function () {
    const s = P.S.sessao; if (!s || s.fase !== 'serie') return;
    const dur = s.cur.reps, ini = Date.now() + 3000;
    s.cont = { ini, fim: ini + dur * 1000, dur }; P.salvar(); P.render();
  };
  P.pararCont = function () { const s = P.S.sessao; if (s) { s.cont = null; P.salvar(); P.render(); } };

  /* ---------- precisa mudar? (aparelho ocupado, não vai fazer, trocar) ---------- */
  P.fazerDepois = function () {
    const s = P.S.sessao; if (!s) return;
    if (proximoIndice(s) < 0) { P.toast('Este já é o último exercício.'); return; }
    const [it] = s.itens.splice(s.atual, 1); s.itens.push(it);
    P.fecharTodas(); prepararSerie(); P.salvar(); P.render(); P.toast('Vai ficar para o final do treino.');
  };
  P.pularExercicio = function () {
    const s = P.S.sessao; if (!s) return;
    s.itens[s.atual].pulado = true; P.fecharTodas();
    const j = proximoIndice(s);
    if (j < 0) { P.concluirTreino(); return; }
    s.atual = j; prepararSerie(); P.salvar(); P.render();
  };
  P.trocarNoTreino = function (exId) {
    const s = P.S.sessao, novo = P.exPorId(exId); if (!s || !novo) return;
    s.itens[s.atual] = { ex: novo.id, series: novo.series, reps: novo.reps, feitas: [], pulado: false };
    P.fecharTodas(); prepararSerie(); P.salvar(); P.render(); P.toast('Trocado só para hoje. Para mudar de vez, edite o plano.');
  };
  P.abrirMudar = function () {
    P.abrirFolha({
      titulo: 'Precisa mudar algo?',
      render() {
        const s = P.S.sessao; if (!s) return '';
        const it = s.itens[s.atual], podeTrocar = it.feitas.length === 0;
        return `<button class="opcao" data-a="depois"><span class="ic-box">${ic('relogio')}</span><span><b>Fazer depois</b><small>Aparelho ocupado? Este exercício vai para o final.</small></span></button>
          ${podeTrocar ? `<button class="opcao" data-a="trocar-hoje"><span class="ic-box">${ic('trocar')}</span><span><b>Trocar por outro</b><small>Mostra exercícios parecidos. Vale só para hoje.</small></span></button>` : ''}
          <button class="opcao" data-a="pular-ex"><span class="ic-box">${ic('pular')}</span><span><b>Pular este exercício</b><small>Hoje você não vai fazer.</small></span></button>`;
      },
    });
  };
  P.abrirSair = function () {
    P.abrirFolha({
      titulo: 'Sair do treino?',
      render() {
        const s = P.S.sessao; if (!s) return '';
        const fez = s.itens.reduce((a, i) => a + i.feitas.length, 0);
        return `<button class="btn btn-pri btn-bloco" data-a="fechar">Continuar treinando</button>
          ${fez ? `<button class="btn btn-bloco" data-a="encerrar">${ic('check')}Encerrar e salvar o que fiz (${P.plural(fez, 'série', 'séries')})</button>` : ''}
          <button class="btn btn-perigo btn-bloco" data-a="descartar">${ic('lixo')}Descartar este treino</button>`;
      },
    });
  };
  P.descartarTreino = function () {
    P.S.sessao = null; P.salvar(); P.liberarTela(); P.fecharTodas(); P.render(); P.toast('Treino descartado.');
  };

  /* ---------- terminar: salva no histórico, atualiza cargas e a rotação ---------- */
  P.concluirTreino = function () {
    const s = P.S.sessao; if (!s) return;
    P.fecharTodas();
    const itens = s.itens.filter(i => i.feitas.length).map(i => ({ ex: i.ex, series: i.feitas.map(f => ({ reps: f.reps, kg: f.kg })) }));
    if (!itens.length) { P.S.sessao = null; P.salvar(); P.liberarTela(); P.render(); P.toast('Nenhuma série registrada, então o treino não foi salvo.'); return; }
    const fim = Date.now(), reg = { id: P.uid(), ini: s.ini, fim, treinoId: s.treinoId, nome: s.nome, itens }, avancos = [];
    s.itens.forEach(i => {
      if (!i.feitas.length) return;
      const ex = P.exPorId(i.ex), antes = P.S.cargas[i.ex], comKg = ex.carga > 0;
      const kg = Math.max(...i.feitas.map(f => f.kg || 0));
      const reps = Math.max(...i.feitas.filter(f => (f.kg || 0) === kg).map(f => f.reps));
      const ok = i.feitas.length >= i.series && i.feitas.every(f => f.reps >= i.reps && (f.kg || 0) >= kg);
      if (antes) {
        if (comKg && kg > antes.kg) avancos.push({ ex: i.ex, de: antes.kg, para: kg, un: 'kg' });
        else if (!comKg && reps > antes.reps) avancos.push({ ex: i.ex, de: antes.reps, para: reps, un: ex.unidade === 'seg' ? 's' : 'reps' });
      }
      P.S.cargas[i.ex] = { kg, reps, ok, em: fim };
    });
    P.S.historico.push(reg);
    const p = P.S.plano;
    if (p) { const idx = p.treinos.findIndex(t => t.id === s.treinoId); if (idx >= 0) P.S.proximo = (idx + 1) % p.treinos.length; }
    P.S.sessao = null; P.salvar(); P.liberarTela();
    P.ui.resumo = { reg, avancos }; P.render();
  };

  /* ---------- relógio: tempo total, descanso e contagem regressiva ---------- */
  const CIRC = 2 * Math.PI * 96;
  setInterval(function () {
    const s = P.S.sessao; if (!s) return;
    const agora = Date.now(), t = $('[data-tempo]'); if (t) t.textContent = fmtRelogio((agora - s.ini) / 1000);
    if (s.fase === 'descanso') {
      const resta = Math.ceil((s.descansoFim - agora) / 1000);
      if (resta <= 0) { fimDescanso(true); return; }
      const n = $('[data-resta]'); if (n) n.textContent = fmtRelogio(resta);
      const c = $('[data-anel]'); if (c) c.style.strokeDashoffset = String(CIRC * (1 - Math.min(1, resta / Math.max(1, s.descansoTotal))));
    }
    if (s.cont) {
      if (agora >= s.cont.fim) { const dur = s.cont.dur; s.cont = null; s.cur.reps = dur; P.bip(3); P.vibrar([300, 100, 300]); P.serieFeita(); return; }
      const n = $('[data-cont]'), prep = agora < s.cont.ini;
      if (n) { n.classList.toggle('prep', prep); n.textContent = prep ? 'Prepare-se…' : String(Math.ceil((s.cont.fim - agora) / 1000)); }
    }
  }, 250);

  /* ---------- desenho da tela de treino ---------- */
  const campo = (rotulo, nome, valor, extra = '') => `<div class="campo"><label>${rotulo}</label><div class="stp">
      <button class="stp-b" data-a="ajustar" data-c="${nome}" data-d="-1" aria-label="Diminuir">${ic('minus')}</button>
      <input class="stp-n" data-i="${nome}" inputmode="decimal" autocomplete="off" value="${txtNum(valor)}" aria-label="${rotulo}" ${extra}>
      <button class="stp-b" data-a="ajustar" data-c="${nome}" data-d="1" aria-label="Aumentar">${ic('plus')}</button></div></div>`;

  function htmlSerie(s, it, ex) {
    const k = it.feitas.length, tempo = ex.unidade === 'seg', semCarga = !(ex.carga > 0);
    const sg = sugestao(ex, it), c = sg.ultima;
    let dica = '';
    if (k === 0) {
      if (!c) dica = semCarga ? '' : 'Primeira vez aqui: ajuste a carga para o que for confortável.';
      else if (semCarga) dica = `Última vez: <b>${c.reps}${tempo ? ' s' : ' repetições'}</b>.`;
      else if (sg.subiu) dica = `Última vez: ${txtNum(c.kg)} kg × ${c.reps}. Você completou tudo, então hoje tente <b>${txtNum(sg.kg)} kg</b>.`;
      else dica = `Última vez: ${txtNum(c.kg)} kg × ${c.reps}. Tente repetir ou passar.`;
    }
    const feitas = it.feitas.map((f, i) => `<span class="etiqueta">${i + 1}ª · ${f.reps}${tempo ? ' s' : ''}${f.kg ? ' × ' + txtNum(f.kg) + ' kg' : ''}</span>`).join('');
    const bolas = Array.from({ length: it.series }, (_, i) => `<i class="${i < k ? 'ok' : i === k ? 'atual' : ''}"></i>`).join('');
    let controles, principal;
    if (tempo && s.cont) {
      const prep = Date.now() < s.cont.ini;
      controles = `<div class="cronometro ${prep ? 'prep' : ''}" data-cont>${prep ? 'Prepare-se…' : Math.ceil((s.cont.fim - Date.now()) / 1000)}</div>`;
      principal = `<button class="btn btn-bloco" data-a="parar-cont">Parar</button>`;
    } else if (tempo) {
      controles = `<div class="campos">${campo('TEMPO (SEGUNDOS)', 'reps', s.cur.reps)}</div>`;
      principal = `<button class="btn btn-pri btn-bloco" data-a="iniciar-cont">${ic('play')}Começar ${s.cur.reps} s</button>`;
    } else {
      controles = `<div class="campos">${campo('REPETIÇÕES', 'reps', s.cur.reps)}${semCarga ? '' : campo('CARGA (KG)', 'kg', s.cur.kg)}</div>`;
      principal = `<button class="btn btn-pri btn-bloco" data-a="serie-feita">${ic('check')}Série feita</button>`;
    }
    return `<div class="tr-corpo">
        ${P.dica('player1', 'Ajuste com <b>+</b> e <b>−</b>, faça a série e toque em <b>Série feita</b>. O descanso começa sozinho.', true)}
        <div><h1 class="tr-nome">${esc(ex.nome)}</h1><div class="etiquetas" style="margin-top:8px"><span class="etiqueta">${esc(P.GRUPOS[ex.grupo])}</span><span class="etiqueta">${esc(ex.equip)}</span></div></div>
        ${P.foto(ex, 'tr-foto grande')}
        <details class="tr-como"><summary>Como fazer ${ic('baixo')}</summary><p>${esc(ex.dica)}</p></details>
      </div>
      <div class="tr-base">
        <div class="serie-tit"><b>Série ${k + 1} de ${it.series}</b><div class="bolinhas">${bolas}</div></div>
        ${feitas ? `<div class="fiz">${feitas}</div>` : ''}
        ${controles}
        ${dica ? `<div class="dica-carga">${dica}</div>` : ''}
        ${principal}
        <div class="linha" style="justify-content:space-between">${k > 0 ? `<button class="btn-link" data-a="desfazer">Desfazer última série</button>` : '<span></span>'}<button class="btn-link" data-a="mudar">Precisa mudar?</button></div>
      </div>`;
  }

  function htmlDescanso(s, it) {
    const resta = Math.max(0, Math.ceil((s.descansoFim - Date.now()) / 1000));
    const fim = it.feitas.length >= it.series, j = fim ? proximoIndice(s) : s.atual, pit = s.itens[j] || it, pex = P.exPorId(pit.ex);
    const off = CIRC * (1 - Math.min(1, resta / Math.max(1, s.descansoTotal)));
    const rotulo = fim ? 'Próximo exercício' : `Próxima: série ${it.feitas.length + 1} de ${it.series}`;
    const detalhe = fim ? `${P.plural(pit.series, 'série', 'séries')} de ${pit.reps}${pex.unidade === 'seg' ? ' s' : ''}` : (pex.unidade === 'seg' ? 'por tempo' : 'mesmo exercício');
    return `<div class="descanso">
        ${P.dica('player2', 'Descansando: quando acabar, o app avisa e mostra a próxima série.', true)}
        <div class="anel"><svg viewBox="0 0 220 220"><circle class="trilho" cx="110" cy="110" r="96"/><circle class="prog" data-anel cx="110" cy="110" r="96" style="stroke-dasharray:${CIRC};stroke-dashoffset:${off}"/></svg>
          <div class="anel-n"><b data-resta>${fmtRelogio(resta)}</b><small>Descansando</small></div></div>
        <div class="prox">${P.mini(pex)}<div><div class="rotulo">${rotulo}</div><b>${esc(pex.nome)}</b><div class="suave peq">${detalhe}</div></div></div>
      </div>
      <div class="tr-base">
        <div class="grade2"><button class="btn" data-a="mais-descanso">${ic('plus')}15 s</button><button class="btn btn-pri" data-a="pular-descanso" style="min-height:50px;font-size:14.5px;padding:0 8px;letter-spacing:.04em">Estou pronto</button></div>
        <div class="linha" style="justify-content:center"><button class="btn-link" data-a="desfazer">Desfazer última série</button></div>
      </div>`;
  }

  P.htmlTreinando = function () {
    const s = P.S.sessao, it = s.itens[s.atual], ex = P.exPorId(it.ex);
    const feitas = s.itens.reduce((a, i) => a + i.feitas.length, 0);
    const total = s.itens.reduce((a, i) => a + (i.pulado && !i.feitas.length ? 0 : i.series), 0);
    return `<div class="treinando">
      <div class="tr-topo"><button class="btn-icone" data-a="sair-treino" aria-label="Sair do treino">${ic('x')}</button>
        <div class="tr-info"><b>Exercício ${s.atual + 1} de ${s.itens.length}</b><div class="tr-barra"><i style="width:${total ? feitas / total * 100 : 0}%"></i></div></div>
        <div class="tr-tempo" data-tempo>${fmtRelogio((Date.now() - s.ini) / 1000)}</div></div>
      ${s.fase === 'descanso' ? htmlDescanso(s, it) : htmlSerie(s, it, ex)}
    </div>`;
  };

  /* ---------- tela final ---------- */
  P.htmlResumo = function () {
    const { reg, avancos } = P.ui.resumo, sem = P.semana(), prox = P.proximoTreino();
    const series = reg.itens.reduce((a, i) => a + i.series.length, 0);
    const frases = ['Mandou bem!', 'Treino feito. Isso é o que importa!', 'Mais um passo. Parabéns!', 'Constância vence tudo. Boa!'];
    return `<div class="resumo">
      <div class="confete">🎉</div>
      <h1>Treino concluído!</h1>
      <p class="centro suave">${frases[reg.ini % frases.length]}</p>
      <div class="estat3">
        <div class="estat"><b>${P.fmtMin((reg.fim - reg.ini) / 1000)}</b><small>duração</small></div>
        <div class="estat"><b>${reg.itens.length}</b><small>${reg.itens.length === 1 ? 'exercício' : 'exercícios'}</small></div>
        <div class="estat"><b>${series}</b><small>${series === 1 ? 'série' : 'séries'}</small></div>
      </div>
      ${avancos.length ? `<div class="cartao"><h3>Você evoluiu 💪</h3>${avancos.map(a => `<div class="avanco"><span>${esc(P.exPorId(a.ex).nome)}</span><span class="sobe">${txtNum(a.de)} → ${txtNum(a.para)} ${a.un}</span></div>`).join('')}</div>` : ''}
      <div class="cartao"><div class="linha"><span class="letra">${sem.feitos}</span><div><b>${sem.feitos} de ${sem.meta} treinos nesta semana</b><div class="suave peq">${sem.feitos >= sem.meta ? 'Meta da semana batida!' : 'Falta pouco para a meta.'}</div></div></div></div>
      ${prox ? `<div class="suave centro peq">Próximo treino: <b>Treino ${prox.letra} · ${esc(prox.nome)}</b></div>` : ''}
      <div style="flex:1"></div>
      <button class="btn btn-pri btn-bloco" data-a="fechar-resumo">Fechar</button>
    </div>`;
  };
})();
