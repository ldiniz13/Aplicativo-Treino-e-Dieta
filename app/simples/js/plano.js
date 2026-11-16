/* PULSO Simples — biblioteca de exercícios, fotos, gerador automático de plano e edição do plano */
(function () {
  const P = window.P, D = window.PULSO_DADOS, FOTOS = window.PULSO_FOTOS || {};
  const EX = D.exercicios, POR_ID = Object.fromEntries(EX.map(e => [e.id, e])), FIT = new Set(D.fotoFit);
  P.EX = EX;
  P.exPorId = id => POR_ID[id];

  P.GRUPOS = {
    peito: 'Peito', costas: 'Costas', ombros: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps', quad: 'Pernas',
    post: 'Posterior da coxa', glut: 'Glúteos', pant: 'Panturrilha', abd: 'Abdômen',
    mobil: 'Mobilidade', forca: 'Força leve', equil: 'Equilíbrio', along: 'Alongamento',
  };
  const ORDEM_GRUPOS = ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'quad', 'post', 'glut', 'pant', 'abd', 'mobil', 'forca', 'equil', 'along'];

  /* ---------- fotos: 2 quadros (início ↔ fim). Usa a embutida (offline); se faltar, busca na internet ---------- */
  P.foto = function (ex, cls = '') {
    const spec = String((ex && ex.foto) || '');
    if (!spec) return `<div class="foto ${cls}"><div class="sem-foto">${P.ic('halter')}</div></div>`;
    const [id, so] = spec.split('#'), emb = FOTOS[id] || [];
    let quadros = so != null ? [so === '1' ? 1 : 0] : [0, 1];
    if (/\bparada\b/.test(cls)) quadros = quadros.slice(0, 1);
    const lazy = /\bgrande\b/.test(cls) ? '' : 'loading="lazy"';
    const imgs = quadros.map((q, k) => `<img class="f${k}" src="${emb[q] || (D.imgCdn + id + '/' + q + '.jpg')}" alt="" decoding="async" draggable="false" ${lazy}>`).join('');
    return `<div class="foto ${FIT.has(id) ? 'encaixa' : ''} ${quadros.length > 1 ? 'anim' : ''} ${cls}">${imgs}</div>`;
  };
  P.mini = ex => `<span class="mini">${P.foto(ex, 'parada')}</span>`;

  /* ---------- o que está disponível para este plano ---------- */
  P.disponivel = function (ex, cfg) {
    if (cfg.foco === 'leve') return ex.leve;
    if (ex.leve) return false;
    if (cfg.local === 'academia') return ex.modo === 'gym' || (ex.req === null && ex.equip === 'Peso corporal');
    return ex.modo === 'casa' && (!ex.req || !!(cfg.equip && cfg.equip[ex.req]));
  };
  const cfgDoPlano = () => P.S.plano || { foco: 'corpo', local: 'academia', equip: {} };

  /* ---------- receitas: de quais músculos é feito cada treino (na ordem de importância) ---------- */
  const RECEITAS = {
    corpoA: ['quad', 'peito', 'costas', 'ombros', 'abd', 'triceps', 'biceps'],
    corpoB: ['glut', 'costas', 'peito', 'ombros', 'post', 'abd', 'triceps'],
    corpoC: ['quad', 'costas', 'ombros', 'peito', 'post', 'abd', 'biceps'],
    cimaA: ['peito', 'costas', 'ombros', 'triceps', 'biceps', 'abd', 'costas'],
    cimaB: ['costas', 'peito', 'ombros', 'biceps', 'triceps', 'abd', 'peito'],
    pernasA: ['quad', 'post', 'glut', 'quad', 'pant', 'abd', 'post'],
    pernasB: ['post', 'glut', 'quad', 'pant', 'glut', 'abd', 'quad'],
    gluteos: ['glut', 'post', 'glut', 'quad', 'pant', 'abd', 'glut'],
    peitoTri: ['peito', 'peito', 'triceps', 'peito', 'triceps', 'abd', 'triceps'],
    costasBi: ['costas', 'costas', 'biceps', 'costas', 'biceps', 'abd', 'costas'],
    ombrosAbd: ['ombros', 'ombros', 'ombros', 'abd', 'abd', 'triceps', 'biceps'],
    abdominal: ['abd', 'abd', 'abd', 'abd', 'abd', 'abd', 'abd'],
  };
  const NOME_REC = {
    corpoA: 'Corpo todo', corpoB: 'Corpo todo', corpoC: 'Corpo todo', cimaA: 'Parte de cima', cimaB: 'Parte de cima',
    pernasA: 'Pernas', pernasB: 'Pernas e glúteos', gluteos: 'Glúteos e pernas', peitoTri: 'Peito e tríceps',
    costasBi: 'Costas e bíceps', ombrosAbd: 'Ombros e abdômen', abdominal: 'Abdômen e core',
  };
  /* foco → quantidade de dias → quais treinos */
  const PLANOS = {
    corpo: { 2: ['corpoA', 'corpoB'], 3: ['corpoA', 'corpoB', 'corpoC'], 4: ['cimaA', 'pernasA', 'cimaB', 'pernasB'], 5: ['peitoTri', 'costasBi', 'pernasA', 'ombrosAbd', 'pernasB'] },
    pernas: { 2: ['pernasA', 'pernasB'], 3: ['pernasA', 'cimaA', 'pernasB'], 4: ['pernasA', 'cimaA', 'pernasB', 'gluteos'], 5: ['pernasA', 'cimaA', 'pernasB', 'cimaB', 'gluteos'] },
    cima: { 2: ['cimaA', 'cimaB'], 3: ['peitoTri', 'costasBi', 'pernasA'], 4: ['peitoTri', 'costasBi', 'pernasA', 'ombrosAbd'], 5: ['peitoTri', 'costasBi', 'pernasA', 'ombrosAbd', 'cimaB'] },
    abd: { 2: ['corpoA', 'corpoB'], 3: ['corpoA', 'abdominal', 'corpoB'], 4: ['cimaA', 'pernasA', 'abdominal', 'corpoB'], 5: ['peitoTri', 'costasBi', 'pernasA', 'abdominal', 'ombrosAbd'] },
  };
  const N_POR_TEMPO = { 30: 4, 45: 5, 60: 7 };
  const LETRAS = 'ABCDEFGH';

  /* plano "leve e seguro" (60+ ou voltando a treinar): lista fixa de exercícios suaves */
  const LEVE = {
    A: { nome: 'Mobilidade e pernas', ids: ['h_s_ombros', 'h_s_marcha', 'h_s_sentar', 'h_s_ext_joelho', 'h_s_ponta_pes', 'h_s_along_panturrilha'] },
    B: { nome: 'Braços e equilíbrio', ids: ['h_s_bracos', 'h_s_flexao_parede', 'h_s_braco_frente', 'h_s_rosca', 'h_s_equilibrio', 'h_s_along_ombro'] },
    C: { nome: 'Força suave e alongar', ids: ['h_s_marcha', 'h_s_sentar', 'h_s_lateral_braco', 'h_s_perna_lado', 'h_s_along_costas', 'h_s_respiracao'] },
  };
  const ORDEM_LEVE = { 2: ['A', 'B'], 3: ['A', 'B', 'C'], 4: ['A', 'B', 'A', 'C'], 5: ['A', 'B', 'C', 'A', 'B'] };

  const novoItem = ex => ({ ex: ex.id, series: ex.series, reps: ex.reps });
  function escolher(grupo, cfg, noTreino, noPlano) {
    const cand = EX.filter(e => e.grupo === grupo && P.disponivel(e, cfg)).sort((a, b) => a.ordem - b.ordem);
    return cand.find(e => !noTreino.has(e.id) && !noPlano.has(e.id)) || cand.find(e => !noTreino.has(e.id)) || null;
  }

  /* Gera o plano completo. cfg = { foco, local, equip, dias, tempo } */
  P.gerarPlano = function (cfg) {
    const base = { id: P.uid(), criado: Date.now(), foco: cfg.foco, local: cfg.foco === 'leve' ? 'casa' : cfg.local, equip: cfg.equip || {}, dias: cfg.dias, tempo: cfg.tempo || 45 };
    if (cfg.foco === 'leve') {
      base.treinos = ORDEM_LEVE[cfg.dias].map((k, i) => ({ id: P.uid(), letra: LETRAS[i], nome: LEVE[k].nome, itens: LEVE[k].ids.map(id => novoItem(POR_ID[id])) }));
      return base;
    }
    const N = N_POR_TEMPO[base.tempo] || 5, noPlano = new Set();
    base.treinos = PLANOS[cfg.foco][cfg.dias].map((rid, i) => {
      let slots = RECEITAS[rid].slice();
      if (cfg.foco === 'abd' && rid !== 'abdominal') { slots = slots.filter(s => s !== 'abd'); slots.splice(2, 0, 'abd'); slots.push('abd'); }
      slots = slots.slice(0, N);
      const noTreino = new Set(), itens = [];
      const por = g => { const ex = escolher(g, base, noTreino, noPlano); if (ex) { noTreino.add(ex.id); noPlano.add(ex.id); itens.push(novoItem(ex)); } };
      slots.forEach(por);
      for (const g of ['abd', 'quad', 'peito', 'costas', 'glut', 'ombros']) { if (itens.length >= Math.min(N, 4)) break; por(g); }  // sem equipamento sobram vagas: completa
      return { id: P.uid(), letra: LETRAS[i], nome: NOME_REC[rid], itens };
    });
    return base;
  };

  /* ---------- números do treino ---------- */
  P.descansoDe = ex => { const d = P.S.descanso; return d === 'auto' ? P.clamp(ex.desc || 30, 15, 120) : d; };
  P.minutosTreino = function (t) {
    let s = 0;
    t.itens.forEach(it => {
      const ex = POR_ID[it.ex]; if (!ex) return;
      const porSerie = (ex.unidade === 'seg' ? it.reps : it.reps * 3.5 + 10) + P.descansoDe(ex);
      s += it.series * porSerie + 40;
    });
    return Math.max(5, Math.round(s / 60));
  };
  P.totalSeries = t => t.itens.reduce((a, it) => a + it.series, 0);
  /* "Pernas · Peito · Costas": os grupos principais do treino, sem repetir */
  P.gruposDoTreino = function (t, max = 4) {
    const vistos = [];
    t.itens.forEach(it => { const ex = POR_ID[it.ex]; if (ex && !vistos.includes(ex.grupo)) vistos.push(ex.grupo); });
    return vistos.slice(0, max).map(g => P.GRUPOS[g]).join(' · ');
  };
  P.resumoPlano = function (p) {
    const foco = { corpo: 'Corpo todo', pernas: 'Pernas e glúteos', cima: 'Parte de cima', abd: 'Abdômen', leve: 'Leve e seguro' }[p.foco] || '';
    const onde = p.foco === 'leve' ? 'Em casa' : p.local === 'academia' ? 'Academia' : 'Em casa';
    return `${foco} · ${P.plural(p.dias, 'dia', 'dias')} por semana · ${onde}${p.foco === 'leve' ? '' : ' · ' + p.tempo + ' min'}`;
  };

  /* ---------- consultas ---------- */
  P.treinoPorId = id => P.S.plano && P.S.plano.treinos.find(t => t.id === id);
  P.proximoTreino = function () {
    const p = P.S.plano; if (!p || !p.treinos.length) return null;
    return p.treinos[P.S.proximo % p.treinos.length];
  };
  /* lista para o seletor: filtra por grupo e por texto; quem já está no treino vem marcado */
  P.listaEscolha = function ({ grupo = 'todos', busca = '' } = {}) {
    const cfg = cfgDoPlano(), q = busca.trim().toLowerCase();
    return EX.filter(e => P.disponivel(e, cfg) && (grupo === 'todos' || e.grupo === grupo) && (!q || e.nome.toLowerCase().includes(q)))
      .sort((a, b) => ORDEM_GRUPOS.indexOf(a.grupo) - ORDEM_GRUPOS.indexOf(b.grupo) || a.ordem - b.ordem);
  };
  P.gruposDisponiveis = function () {
    const cfg = cfgDoPlano(), set = new Set(EX.filter(e => P.disponivel(e, cfg)).map(e => e.grupo));
    return ORDEM_GRUPOS.filter(g => set.has(g));
  };

  /* ---------- edição do plano (sempre por toque, sem arrastar) ---------- */
  const relancar = () => { P.S.plano.treinos.forEach((t, i) => { t.letra = LETRAS[i] || String(i + 1); }); };
  P.addItem = (tid, exId) => { const t = P.treinoPorId(tid), ex = POR_ID[exId]; if (t && ex && !t.itens.some(i => i.ex === exId)) { t.itens.push(novoItem(ex)); P.salvar(); } };
  P.removerItem = (tid, i) => { const t = P.treinoPorId(tid); if (t) { t.itens.splice(i, 1); P.salvar(); } };
  P.moverItem = (tid, i, d) => {
    const t = P.treinoPorId(tid), j = i + d; if (!t || j < 0 || j >= t.itens.length) return;
    [t.itens[i], t.itens[j]] = [t.itens[j], t.itens[i]]; P.salvar();
  };
  P.trocarItem = (tid, i, exId) => { const t = P.treinoPorId(tid), ex = POR_ID[exId]; if (t && ex && t.itens[i]) { t.itens[i] = novoItem(ex); P.salvar(); } };
  P.ajustarItem = function (tid, i, campo, d) {
    const t = P.treinoPorId(tid), it = t && t.itens[i]; if (!it) return;
    const ex = POR_ID[it.ex];
    if (campo === 'series') it.series = P.clamp(it.series + d, 1, 8);
    else if (ex.unidade === 'seg') it.reps = P.clamp(it.reps + d * 5, 5, 300);
    else it.reps = P.clamp(it.reps + d, 1, 100);
    P.salvar();
  };
  P.novoTreino = function () {
    if (!P.S.plano) return null;
    const t = { id: P.uid(), letra: '', nome: 'Treino novo', itens: [] };
    P.S.plano.treinos.push(t); relancar(); P.salvar(); return t;
  };
  P.excluirTreino = function (tid) {
    const p = P.S.plano; if (!p || p.treinos.length <= 1) return;
    p.treinos = p.treinos.filter(t => t.id !== tid); relancar(); p.dias = Math.max(p.dias, p.treinos.length); P.salvar();
  };
  P.renomearTreino = (tid, nome) => { const t = P.treinoPorId(tid); if (t) { t.nome = nome.trim().slice(0, 40) || 'Treino'; P.salvar(); } };
  /* Plano vazio para quem prefere montar do zero */
  P.planoVazio = function (local = 'academia') {
    return { id: P.uid(), criado: Date.now(), foco: 'corpo', local, equip: { barra: true, elastico: true, peso: true }, dias: 3, tempo: 45, treinos: [{ id: P.uid(), letra: 'A', nome: 'Meu treino', itens: [] }] };
  };
})();
