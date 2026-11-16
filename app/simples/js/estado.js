/* PULSO Simples — dados salvos no aparelho (localStorage) e contas simples (semana, sequência, cargas) */
(function () {
  const P = window.P;
  const CHAVE = 'pulso.simples.v1';

  /* Formato dos dados (tudo em um objeto só; veja HANDOFF.md):
     plano:     { id, criado, foco, local, equip:{barra,elastico,peso}, dias, tempo, treinos:[{id, letra, nome, itens:[{ex, series, reps}]}] }
     proximo:   índice do próximo treino na rotação do plano (o app avança sozinho ao concluir)
     historico: [{ id, ini, fim, treinoId, nome, itens:[{ex, series:[{reps, kg}]}] }]
     cargas:    { exId: { kg, reps, ok, em } }  → última carga e se "bateu tudo" (para sugerir subir)
     sessao:    treino em andamento (ver treino.js)  */
  const novo = () => ({
    v: 1, criado: Date.now(), nome: '', meta: 3, descanso: 'auto', som: true, vibrar: true,
    plano: null, proximo: 0, historico: [], cargas: {}, pesos: [], sessao: null, dicas: {},
  });

  function migrar(o) {
    const s = Object.assign(novo(), o || {});
    if (!Array.isArray(s.historico)) s.historico = [];
    if (!Array.isArray(s.pesos)) s.pesos = [];
    if (!s.cargas || typeof s.cargas !== 'object') s.cargas = {};
    if (!s.dicas || typeof s.dicas !== 'object') s.dicas = {};
    return s;
  }
  function carregar() {
    try { const raw = localStorage.getItem(CHAVE); if (raw) return migrar(JSON.parse(raw)); } catch (e) { /* começa limpo */ }
    return novo();
  }
  let avisouErro = false;
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(P.S)); }
    catch (e) { if (!avisouErro) { avisouErro = true; P.toast('Não consegui salvar neste navegador. Use o backup em Ajustes.', 5000); } }
  }
  P.S = carregar();

  /* ---------- semana, sequência e totais ---------- */
  const noPeriodo = (a, b) => P.S.historico.filter(h => h.ini >= a && h.ini < b);

  P.semana = function () {
    const ini = P.inicioSemana(new Date()), fim = P.addDias(ini, 7);
    const feitos = noPeriodo(ini.getTime(), fim.getTime());
    const dias = [0, 1, 2, 3, 4, 5, 6].map(i => { const d0 = P.addDias(ini, i).getTime(); return feitos.some(h => h.ini >= d0 && h.ini < d0 + 864e5); });
    return { feitos: feitos.length, dias, meta: P.S.meta, hoje: (new Date().getDay() + 6) % 7 };
  };
  /* Sequência = semanas seguidas batendo a meta. A semana atual só conta quando já bateu;
     se ainda não bateu, ela não quebra a sequência (dá tempo de treinar). */
  P.seqSemanas = function () {
    const meta = Math.max(1, P.S.meta), ini = P.inicioSemana(new Date());
    const n = d0 => noPeriodo(d0.getTime(), P.addDias(d0, 7).getTime()).length;
    let seq = n(ini) >= meta ? 1 : 0;
    for (let i = 1; i < 520; i++) { if (n(P.addDias(ini, -7 * i)) >= meta) seq++; else break; }
    return seq;
  };
  P.tempoTotal = () => P.S.historico.reduce((a, h) => a + Math.max(0, (h.fim - h.ini) / 1000), 0);
  P.treinoHoje = () => P.S.historico.some(h => P.dkey(h.ini) === P.dkey(Date.now()));

  /* evolução de um exercício: um valor por treino (maior carga; sem carga → maior nº de repetições) */
  P.serieDoExercicio = function (exId) {
    const ex = P.exPorId(exId), usaKg = ex && ex.carga > 0, pts = [];
    P.S.historico.slice().sort((a, b) => a.ini - b.ini).forEach(h => {
      const it = h.itens.find(i => i.ex === exId); if (!it || !it.series.length) return;
      const v = usaKg ? Math.max(...it.series.map(s => s.kg || 0)) : Math.max(...it.series.map(s => s.reps || 0));
      pts.push({ t: h.ini, v });
    });
    return { pts, unidade: usaKg ? 'kg' : (ex && ex.unidade === 'seg' ? 's' : 'reps') };
  };

  /* coach marks: mostra uma vez só */
  P.dica = (id, texto, compacta) => P.S.dicas[id] ? '' : (compacta
    ? `<div class="dica compacta">${P.ic('luz')}<div class="cresce">${texto}</div><button data-a="dica-ok" data-id="${id}">OK</button></div>`
    : `<div class="dica">${P.ic('luz')}<div>${texto}<br><button data-a="dica-ok" data-id="${id}">Entendi</button></div></div>`);

  P.salvar = salvar;
  P.novoEstado = novo;
  P.migrar = migrar;
})();
