/* Integra os módulos completos ao início guiado; a página original mantém seu comportamento. */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const modulo = params.get('integrado');
  const permitidos = ['dieta', 'medidas', 'cardio', 'conquistas', 'conta', 'guiado', 'biblioteca'];
  const ativo = permitidos.includes(modulo);
  if (ativo) document.documentElement.dataset.pulsoIntegrado = 'true';
  const ler = chave => { try { return JSON.parse(localStorage.getItem(chave) || 'null'); } catch (_) { return null; } };
  window.PulsoModulos = {
    ativo,
    iniciar(api) {
      if (!ativo) return;
      const S = api.estado(), treino = ler('pulso.simples.v1');
      if (treino && Array.isArray(treino.historico)) {
        const mapa = new Map(S.exercises.map(e => [e.id, e]));
        const registros = treino.historico.filter(h => h && h.id && Array.isArray(h.itens)).map(h => ({
          id: 'guiado_' + h.id, source: 'pulso-guiado', start: h.ini, end: h.fim,
          mode: treino.plano && treino.plano.local === 'casa' ? 'home' : 'gym', name: h.nome || 'Treino guiado',
          sets: h.itens.flatMap(it => (it.series || []).map((s, i) => ({ exId: it.ex, name: mapa.get(it.ex)?.name || 'Exercício', kg: +s.kg || 0, reps: +s.reps || 0, ts: h.ini + i * 1000, t0: h.ini + i * 1000 }))), cardio: [],
        }));
        S.workouts = S.workouts.filter(w => w.source !== 'pulso-guiado').concat(registros);
        S.measures = S.measures.filter(m => m.source !== 'pulso-guiado').concat((treino.pesos || []).map(p => ({ id: 'guiado_peso_' + p.em, source: 'pulso-guiado', ts: p.em, weight: p.kg, notes: 'Peso registrado no treino guiado' })));
        S.guided = treino;
      }
      const intro = (titulo, texto, botao, acao) => `<div class="page-head"><div><div class="eyebrow">Sua rotina completa</div><h1>${titulo}</h1></div></div><section class="card module-intro"><p>${texto}</p><button class="btn btn-primary btn-lg" data-action="${acao}">${botao}</button></section>`;
      if (modulo === 'dieta') api.aba('diet');
      else if (modulo === 'medidas') api.aba('measures');
      else if (modulo === 'conquistas') api.aba('progress');
      else {
        api.aba('workouts');
        if (modulo === 'cardio') api.telas.workouts = () => {
          const atividades = api.estado().workouts.filter(w => (w.cardio || []).length).sort((a, b) => b.start - a.start).slice(0, 20);
          return `<div class="page-head"><div><div class="eyebrow">Movimento além da musculação</div><h1>Cardio</h1></div></div>${api.cardio(api.estatisticas())}<section class="card"><h3>Suas atividades</h3>${atividades.length ? atividades.map(w => `<div class="li"><div><b>${api.esc(w.cardio.map(c => c.name || c.type).join(' + '))}</b><small style="display:block">${api.data(w.start)} · ${w.cardio.reduce((n, c) => n + (+c.min || 0), 0)} min${w.cardio[0].km ? ' · ' + w.cardio[0].km + ' km' : ''}</small></div></div>`).join('') : '<p class="muted small">Caminhada, corrida, bicicleta ou outra atividade: registre a primeira para acompanhar sua rotina.</p>'}</section>`;
        };
        if (modulo === 'conta') api.telas.workouts = () => intro('Conta e preferências', 'Cuide do perfil, das metas de alimentação e da sincronização opcional. O app continua funcionando sem conta.', 'Abrir configurações', 'settings');
        if (modulo === 'guiado') api.telas.workouts = () => intro('Treino acompanhado', 'Exercícios em casa com demonstração, ritmo ajustável e voz contando as repetições. Você pode pausar a qualquer momento.', 'Escolher treino acompanhado', 'gd-open');
      }
      const abaAtual = modulo === 'dieta' ? 'diet' : modulo === 'medidas' ? 'measures' : modulo === 'conquistas' ? 'progress' : 'workouts';
      const telaAtual = api.telas[abaAtual];
      api.telas[abaAtual] = () => (api.estado().demo ? '<div class="module-demo">Dados de exemplo da interface clássica. Use o backup antes de trocar ou apagar registros.</div>' : '') + telaAtual();
      // Importações feitas nos módulos só restauram o treino guiado quando o backup o contém.
      window.PulsoModulos.restaurarGuiado = function (dados) {
        if (!dados || !Array.isArray(dados.historico)) return;
        localStorage.setItem('pulso.simples.v1', JSON.stringify(dados));
        parent.postMessage({ tipo: 'pulso:restaurado' }, location.origin);
      };
      if (window.parent !== window) {
        window.addEventListener('pagehide', () => api.salvar());
        setTimeout(() => {
          parent.postMessage({ tipo: 'pulso:pronto', modulo }, location.origin);
          if (params.get('acao') === 'cardapio') api.cardapio();
          if (params.get('acao') === 'agua') document.querySelector('[data-action="water"]')?.closest('.card')?.scrollIntoView({ block: 'start' });
        }, 0);
      }
    },
  };
})();
