/* PULSO Simples — utilitários: datas, números, ícones, avisos, janelas (folhas), som */
(function () {
  const P = window.P = window.P || {};
  P.VERSAO = '3.0.0';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = n => String(n).padStart(2, '0');
  const dkey = d => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const inicioSemana = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const addDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const fmtNum = (n, d = 1) => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d });
  const fmtRelogio = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h}:${pad(m)}:${pad(x)}` : `${pad(m)}:${pad(x)}`; };
  const fmtMin = s => { const m = Math.max(1, Math.round(s / 60)); return m >= 60 ? `${Math.floor(m / 60)} h ${pad(m % 60)} min` : `${m} min`; };
  const dataLonga = ts => { const d = new Date(ts); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; };
  const dataCurta = ts => { const d = new Date(ts); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
  const relDia = ts => {
    const n = Math.round((new Date(dkey(Date.now())) - new Date(dkey(ts))) / 864e5);
    return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`;
  };
  const saudacao = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const plural = (n, um, muitos) => `${n} ${n === 1 ? um : muitos}`;
  const arred = (n, casas = 2) => { const f = Math.pow(10, casas); return Math.round(n * f) / f; };
  /* número digitado pelo usuário (aceita vírgula) */
  const lerNum = v => { if (v == null) return null; const s = String(v).trim().replace(',', '.'); if (s === '') return null; const n = parseFloat(s); return isFinite(n) ? n : null; };
  const txtNum = n => (n == null || isNaN(n)) ? '' : String(arred(n)).replace('.', ',');

  /* ---------- ícones (traço simples, estilo Lucide) ---------- */
  const ICONES = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    dir: '<path d="m9 18 6-6-6-6"/>',
    esq: '<path d="m15 18-6-6 6-6"/>',
    baixo: '<path d="m6 9 6 6 6-6"/>',
    cima: '<path d="m18 15-6-6-6 6"/>',
    casa: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    predio: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
    halter: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    grafico: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    ajustes: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    relogio: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
    fogo: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    trocar: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
    lixo: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    lapis: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    pular: '<polygon points="5 4 15 12 5 20 5 4"/><path d="M19 5v14"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    luz: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
    balanca: '<rect width="18" height="18" x="3" y="3" rx="4"/><path d="M8 9a5 5 0 0 1 8 0M12 9l2-2"/>',
    medalha: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-1.97 1.5-.5.2-1.03.5-1.03 1.5v2M14 14.66V17c0 .55.47.98 1.97 1.5.5.2 1.03.5 1.03 1.5v2M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    subir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    magia: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    corpo: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v7M7 11h10M9 22l3-7 3 7"/>',
    pernas: '<path d="M9 3h6l1 8-2 10M9 3l-1 8 2 10M12 3v8"/>',
    braco: '<path d="M7 20c0-4 1-6 3-8l-2-5a2 2 0 0 1 3.7-1.4L13 8l5 1a3 3 0 0 1 2 3.5L19 18"/>',
    abdomen: '<rect x="6" y="3" width="12" height="18" rx="4"/><path d="M12 3v18M6 9h12M6 15h12"/>',
    coracao: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    link: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    celular: '<rect width="14" height="20" x="5" y="2" rx="3"/><path d="M12 18h.01"/>',
  };
  const ic = (nome, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome] || ''}</svg>`;

  /* ---------- avisos curtos ---------- */
  let toastT = null;
  function toast(msg, ms = 2600) {
    const box = $('#camadas'); if (!box) return;
    $$('.toast', box).forEach(t => t.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    box.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), ms);
  }

  /* ---------- folhas: janelas que sobem de baixo. Cada uma tem uma função render() que devolve o HTML ---------- */
  const folhas = [];
  function pintarFolha(f) {
    const corpo = $('.folha-corpo', f.el), y = corpo.scrollTop;
    $('.folha-topo h2', f.el).textContent = typeof f.titulo === 'function' ? f.titulo() : f.titulo;
    corpo.innerHTML = f.render();
    corpo.scrollTop = y;
    if (f.depois) f.depois(f.el);
  }
  function abrirFolha(cfg) {
    const el = document.createElement('div');
    el.className = 'folha-fundo';
    el.innerHTML = `<div class="folha" role="dialog" aria-modal="true"><div class="folha-pega"></div><div class="folha-topo"><h2></h2><button class="btn-icone" data-a="fechar" aria-label="Fechar">${ic('x')}</button></div><div class="folha-corpo"></div></div>`;
    $('#camadas').appendChild(el);
    document.body.classList.add('trava');
    const f = { ...cfg, el }; folhas.push(f); pintarFolha(f);
    return f;
  }
  function fecharFolha(f) {
    f = f || folhas[folhas.length - 1]; if (!f) return;
    const i = folhas.indexOf(f); if (i >= 0) folhas.splice(i, 1);
    f.el.remove();
    if (!folhas.length && !P.travaTela) document.body.classList.remove('trava');
    if (f.aoFechar) f.aoFechar();
  }
  const fecharTodas = () => { while (folhas.length) fecharFolha(); };
  const atualizarFolhas = () => folhas.slice().forEach(pintarFolha);
  const topoFolha = () => folhas[folhas.length - 1];

  /* ---------- som e vibração (só depois do primeiro toque, regra do navegador) ---------- */
  let audio = null;
  function prepararAudio() {
    if (audio) { if (audio.state === 'suspended') audio.resume(); return; }
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
  }
  function bip(vezes = 1) {
    if (!P.S || !P.S.som || !audio) return;
    for (let i = 0; i < vezes; i++) {
      try {
        const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + i * 0.22;
        o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + 0.18);
      } catch (e) { /* sem som */ }
    }
  }
  const vibrar = p => {
    /* só vibra depois de um toque real na tela (regra do navegador) */
    if (P.S && P.S.vibrar && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) { try { navigator.vibrate(p); } catch (e) { /* ok */ } }
  };

  Object.assign(P, {
    $, $$, esc, uid, clamp, pad, dkey, inicioSemana, addDias, MESES, DIAS, fmtNum, fmtRelogio, fmtMin, dataLonga, dataCurta,
    relDia, saudacao, plural, arred, lerNum, txtNum, ic, toast, abrirFolha, fecharFolha, fecharTodas, atualizarFolhas, topoFolha,
    prepararAudio, bip, vibrar,
  });
})();
