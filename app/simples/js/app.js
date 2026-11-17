/* PULSO Simples — liga tudo: desenho da tela, cliques, backup, instalação e início do app */
(function () {
  const P = window.P;
  const { $, $$, esc, ic, plural } = P;
  const A = P.A;

  /* ---------- desenho: decide qual tela mostrar ---------- */
  let ultima = '';
  P.render = function () {
    const S = P.S, app = $('#app');
    let chave, html;
    if (P.ui.resumo) { chave = 'resumo'; html = P.htmlResumo(); }
    else if (S.sessao) { chave = `treino:${S.sessao.atual}:${S.sessao.fase}:${S.sessao.itens[S.sessao.atual] ? S.sessao.itens[S.sessao.atual].feitas.length : 0}`; html = P.htmlTreinando(); }
    else if (P.wiz) { chave = `assist:${P.wiz.passo}:${P.wiz.previa ? 1 : 0}`; html = P.htmlAssistente(); }
    else { chave = 'casca:' + P.ui.tela; html = P.htmlCasca(); }
    const y = window.scrollY, ty = ($('.tr-corpo') || {}).scrollTop || 0, mesma = chave === ultima;
    app.innerHTML = html;
    if (mesma) {
      $$('.tela,.assist-corpo,.resumo', app).forEach(e => { e.style.animation = 'none'; });   // sem piscar quando só atualiza
      window.scrollTo(0, y); const tc = $('.tr-corpo'); if (tc) tc.scrollTop = ty;
    } else window.scrollTo(0, 0);
    ultima = chave;
    P.atualizarFolhas();
  };

  /* ---------- cliques, digitação ---------- */
  document.addEventListener('click', ev => {
    P.prepararAudio();
    const el = ev.target.closest('[data-a]');
    if (!el) { if (ev.target.classList && ev.target.classList.contains('folha-fundo')) P.fecharFolha(); return; }
    const fn = A[el.dataset.a];
    if (fn) { ev.preventDefault(); fn(el, ev); }
  });
  document.addEventListener('input', ev => {
    const t = ev.target, k = t.dataset && t.dataset.i; if (!k) return;
    if (k === 'reps' || k === 'kg') P.digitarCur(k, t.value);
    else if (k === 'busca-escolha' && P.escolhaAtual) { P.escolhaAtual.est.busca = t.value; P.escolhaAtual.atualizarLista(); }
  });
  document.addEventListener('change', ev => {
    const t = ev.target, k = t.dataset && t.dataset.i;
    if (t.id === 'arquivoBackup') return importar(t);
    if (!k) return;
    if (k === 'reps' || k === 'kg') { const s = P.S.sessao; P.salvar(); if (s && s.cur) t.value = P.txtNum(s.cur[k]); }
    else if (k === 'nome') { P.S.nome = t.value.trim().slice(0, 24); P.salvar(); P.render(); }
    else if (k === 'nome-treino') { P.renomearTreino(t.dataset.id, t.value); P.render(); }
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.id === 'campoPeso') A['salvar-peso'](); });

  /* ---------- navegação e janelas ---------- */
  A.aba = el => { if (P.ui.tela === el.dataset.t) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } P.ui.tela = el.dataset.t; P.render(); };
  A.ajustes = () => P.abrirAjustes();
  A.fechar = () => P.fecharFolha();
  A['dica-ok'] = el => { P.S.dicas[el.dataset.id] = 1; P.salvar(); P.render(); };
  A.comecar = el => P.iniciarTreino(el.dataset.id);
  A['ver-treino'] = el => P.abrirTreino(el.dataset.id);
  A['ver-ex'] = el => P.abrirExercicio(el.dataset.id);
  A['escolher-treino'] = () => P.abrirFolha({
    titulo: 'Escolher treino',
    render() {
      const p = P.S.plano, atual = P.S.proximo % p.treinos.length;
      return p.treinos.map((t, i) => `<button class="opcao ${i === atual ? 'on' : ''}" data-a="definir-proximo" data-n="${i}"><span class="letra">${t.letra}</span><span><b>${esc(t.nome)}</b><small>${esc(P.gruposDoTreino(t))} · ~${P.minutosTreino(t)} min</small></span></button>`).join('');
    },
  });
  A['definir-proximo'] = el => { P.S.proximo = +el.dataset.n; P.salvar(); P.fecharFolha(); P.render(); };

  /* ---------- editar treino ---------- */
  const tidAtual = () => { const f = P.topoFolha(); return f && f.tid; };
  A['editar-treino'] = () => { P.ui.edit = !P.ui.edit; P.atualizarFolhas(); };
  A['aj-item'] = el => { P.ajustarItem(tidAtual(), +el.dataset.n, el.dataset.c, +el.dataset.d); P.render(); };
  A['mover-item'] = el => { P.moverItem(tidAtual(), +el.dataset.n, +el.dataset.d); P.render(); };
  A['remover-item'] = el => { P.removerItem(tidAtual(), +el.dataset.n); P.render(); };
  A['trocar-item'] = el => {
    const tid = tidAtual(), t = P.treinoPorId(tid), n = +el.dataset.n, ex = P.exPorId(t.itens[n].ex);
    P.abrirEscolha({ titulo: 'Trocar por', grupo: ex.grupo, excluir: t.itens.map(i => i.ex), aoEscolher: id => { P.trocarItem(tid, n, id); P.render(); } });
  };
  A['add-item'] = () => {
    const tid = tidAtual(), t = P.treinoPorId(tid);
    P.abrirEscolha({ titulo: 'Adicionar exercício', excluir: t.itens.map(i => i.ex), manter: true, aoEscolher: id => { P.addItem(tid, id); P.render(); P.toast('Adicionado ao treino'); } });
  };
  A['excluir-treino'] = el => {
    if (!confirm('Excluir este treino do plano?')) return;
    P.excluirTreino(el.dataset.id); P.fecharTodas(); P.S.proximo = P.S.proximo % P.S.plano.treinos.length; P.salvar(); P.render();
  };
  A['novo-treino'] = () => { const t = P.novoTreino(); if (!t) return; P.render(); P.abrirTreino(t.id, true); };
  A.escolher = el => {
    const e = P.escolhaAtual; if (!e) return;
    e.aoEscolher(el.dataset.id);
    if (e.manter) { e.excluir.push(el.dataset.id); e.atualizarLista(); } else P.fecharFolha(e.f);
  };
  A['escolha-grupo'] = el => { if (P.escolhaAtual) { P.escolhaAtual.est.grupo = el.dataset.g; P.atualizarFolhas(); } };

  /* ---------- evolução ---------- */
  A.grafico = el => P.abrirGrafico(el.dataset.id);
  A.hist = el => P.abrirHistorico(el.dataset.id);
  A['excluir-hist'] = el => {
    if (!confirm('Excluir este treino do histórico?')) return;
    P.S.historico = P.S.historico.filter(h => h.id !== el.dataset.id); P.salvar(); P.fecharFolha(); P.render();
  };
  A.peso = () => P.abrirPeso();
  A['salvar-peso'] = () => {
    const kg = P.lerNum(($('#campoPeso') || {}).value);
    if (kg == null || kg < 20 || kg > 400) { P.toast('Digite um peso válido, por exemplo 72,5'); return; }
    P.S.pesos.push({ em: Date.now(), kg: P.arred(kg, 1) }); P.salvar(); P.fecharFolha(); P.render(); P.toast('Peso registrado');
  };
  A['del-peso'] = el => { P.S.pesos = P.S.pesos.filter(p => String(p.em) !== el.dataset.em); P.salvar(); P.render(); };

  /* ---------- ajustes ---------- */
  A.descanso = el => { P.S.descanso = el.dataset.v === 'auto' ? 'auto' : +el.dataset.v; P.salvar(); P.render(); };
  A.meta = el => { P.S.meta = P.clamp(P.S.meta + +el.dataset.d, 1, 7); P.salvar(); P.render(); };
  A.alterna = el => { const k = el.dataset.k; P.S[k] = !P.S[k]; P.salvar(); P.render(); };
  A['rever-dicas'] = () => { P.S.dicas = {}; P.salvar(); P.render(); P.toast('As dicas vão aparecer de novo.'); };
  A.exportar = () => {
    if (P.exportarRotina) return P.exportarRotina();
    const blob = new Blob([JSON.stringify({ ...P.S, sessao: null }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pulso-simples-${P.dkey(Date.now())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    P.toast('Backup salvo na pasta de downloads.');
  };
  A.importar = () => { const i = $('#arquivoBackup'); if (i) i.click(); };
  function importar(input) {
    const arq = input.files && input.files[0]; if (!arq) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const o = JSON.parse(r.result);
        if (P.importarRotina) return P.importarRotina(o);
        if (!o || typeof o !== 'object' || !Array.isArray(o.historico)) throw new Error('formato');
        if (!confirm('Importar este backup? Ele substitui os dados atuais deste aparelho.')) return;
        P.S = P.migrar(o); P.S.sessao = null; P.salvar(); P.fecharTodas(); P.render(); P.toast('Backup importado!');
      } catch (e) { P.toast('Arquivo inválido. Use um backup exportado pelo PULSO Simples.', 4500); }
    };
    r.readAsText(arq); input.value = '';
  }
  A.instalar = async () => {
    const ev = P.instalarEvt; if (!ev) return;
    try { ev.prompt(); await ev.userChoice; } catch (e) { /* ok */ }
    P.instalarEvt = null; P.render();
  };
  A['apagar-tudo'] = () => {
    if (!confirm('Apagar TODOS os seus dados deste aparelho? Isso não pode ser desfeito. Dica: exporte um backup antes.')) return;
    try { localStorage.removeItem('pulso.simples.v1'); } catch (e) { /* ok */ }
    P.liberarTela(); P.S = P.novoEstado(); P.fecharTodas(); P.wiz = null; P.ui.tela = 'hoje'; P.render(); P.toast('Dados apagados.');
  };

  /* ---------- assistente "monte meu treino" ---------- */
  const novoWiz = () => ({ passo: 0, foco: null, local: null, equip: { barra: false, elastico: false, peso: false }, dias: null, tempo: null, previa: null });
  A['assist-novo'] = () => {
    if (P.S.plano && !confirm('Refazer o plano troca os treinos atuais. Seu histórico continua salvo. Continuar?')) return;
    P.fecharTodas(); P.wiz = novoWiz(); P.render();
  };
  A['assist-voltar'] = () => {
    const w = P.wiz; if (!w) return;
    if (w.previa) w.previa = null; else if (w.passo > 0) w.passo--; else P.wiz = null;
    P.render();
  };
  const avancar = () => {
    const w = P.wiz;
    if (w.passo + 1 >= P.passosDe(w).length) w.previa = P.gerarPlano({ foco: w.foco, local: w.local, equip: w.equip, dias: w.dias, tempo: w.tempo || 45 });
    else w.passo++;
    P.render();
  };
  A['assist-escolher'] = el => {
    const w = P.wiz, k = el.dataset.k, v = el.dataset.v;
    w[k] = (k === 'dias' || k === 'tempo') ? +v : v;
    if (k === 'foco' && v === 'leve') w.local = 'casa';
    avancar();
  };
  A['assist-equip'] = el => { P.wiz.equip[el.dataset.k] = !P.wiz.equip[el.dataset.k]; P.render(); };
  A['assist-prox'] = avancar;
  A['assist-usar'] = () => {
    const w = P.wiz; if (!w || !w.previa) return;
    P.S.plano = w.previa; P.S.proximo = 0; P.S.meta = w.previa.dias; P.salvar();
    P.wiz = null; P.ui.tela = 'hoje'; P.render(); P.toast('Plano criado! Toque em “Começar treino”.');
  };
  A['plano-zero'] = () => {
    if (P.S.plano && !confirm('Isso troca seu plano atual por um vazio. Seu histórico continua salvo. Continuar?')) return;
    P.abrirFolha({
      titulo: 'Onde você vai treinar?',
      render: () => `<button class="opcao" data-a="zero-local" data-v="casa"><span class="ic-box">${ic('casa')}</span><span><b>Em casa</b><small>Mostra exercícios de casa</small></span></button>
        <button class="opcao" data-a="zero-local" data-v="academia"><span class="ic-box">${ic('predio')}</span><span><b>Na academia</b><small>Mostra máquinas, barras e halteres</small></span></button>`,
    });
  };
  A['zero-local'] = el => {
    P.S.plano = P.planoVazio(el.dataset.v); P.S.proximo = 0; P.salvar();
    P.fecharTodas(); P.ui.tela = 'plano'; P.render(); P.abrirTreino(P.S.plano.treinos[0].id, true);
  };

  /* ---------- treino em andamento ---------- */
  A['serie-feita'] = () => P.serieFeita();
  A.ajustar = el => P.ajustarCur(el.dataset.c, +el.dataset.d);
  A.desfazer = () => P.desfazerSerie();
  A.mudar = () => P.abrirMudar();
  A.depois = () => P.fazerDepois();
  A['pular-ex'] = () => P.pularExercicio();
  A['trocar-hoje'] = () => {
    const s = P.S.sessao, ex = P.exPorId(s.itens[s.atual].ex);
    P.abrirEscolha({ titulo: 'Trocar por', grupo: ex.grupo, excluir: s.itens.map(i => i.ex), aoEscolher: id => P.trocarNoTreino(id) });
  };
  A['pular-descanso'] = () => P.pularDescanso();
  A['mais-descanso'] = () => { P.maisDescanso(15); P.toast('+15 segundos', 1200); };
  A['iniciar-cont'] = () => P.iniciarCont();
  A['parar-cont'] = () => P.pararCont();
  A['sair-treino'] = () => P.abrirSair();
  A.encerrar = () => P.concluirTreino();
  A.descartar = () => { if (confirm('Descartar este treino? As séries feitas hoje serão perdidas.')) P.descartarTreino(); };
  A['fechar-resumo'] = () => { P.ui.resumo = null; P.ui.tela = 'hoje'; P.render(); };

  /* ---------- instalação como app e funcionamento offline ---------- */
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); P.instalarEvt = e; if (!P.S.sessao && !P.wiz && !P.ui.resumo) P.render(); });
  window.addEventListener('appinstalled', () => { P.instalarEvt = null; });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { Promise.allSettled([navigator.serviceWorker.register('sw.js'), navigator.serviceWorker.register('../sw.js')]); });
  }

  /* ---------- início ---------- */
  if (P.S.sessao) P.pedirTela();
  P.render();
})();
