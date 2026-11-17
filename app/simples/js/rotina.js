/* PULSO 3.1: uma entrada guiada para treino, alimentação e acompanhamento. */
(function () {
  'use strict';
  const P = window.P, { esc, ic, fmtNum } = P;
  const base = P.htmlCasca;
  const CHAVE = 'pulso.fit.v1';
  const modulos = new Set(['dieta', 'medidas', 'cardio', 'conquistas', 'conta', 'guiado', 'biblioteca']);
  P.rotina = () => { try { const s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); return s && Array.isArray(s.workouts) && s.settings ? s : null; } catch (_) { return null; } };
  const header = (titulo, texto) => `<div class="cab"><div><div class="olho">PULSO · SUA ROTINA</div><h1>${titulo}</h1>${texto ? `<p class="suave peq" style="margin-top:8px">${texto}</p>` : ''}</div><button class="btn-icone" data-a="ajustes" aria-label="Ajustes do treino">${ic('ajustes')}</button></div>`;
  const item = (modulo, titulo, texto, icone, extra = '') => `<button class="rotina-item" data-a="rotina-abrir" data-modulo="${modulo}" ${extra}><span class="rotina-icone">${ic(icone)}</span><span class="cresce"><b>${titulo}</b><small>${texto}</small></span>${ic('dir')}</button>`;
  function passosHoje() {
    const s = P.rotina(), dia = s?.diet?.[P.dkey(Date.now())], agua = +dia?.water || 0, meta = +s?.settings?.waterGoal || 2000;
    const refeicoes = Object.values(dia?.meals || {}).filter(a => Array.isArray(a) && a.length).length;
    const medidas = (s?.measures || []).filter(m => m.source !== 'pulso-guiado').length;
    return `<section class="rotina-hoje">${s?.demo ? '<p class="rotina-convite">Os módulos da interface clássica estão com dados de exemplo. Eles continuam identificados ao abrir.</p>' : ''}<div class="rotina-titulo"><h2>O resto também conta</h2><span>Um passo de cada vez</span></div>
      <div class="rotina-grade">
        <button class="rotina-atalho" data-a="rotina-abrir" data-modulo="dieta"><span class="rotina-icone cor-dieta">${ic('comida')}</span><b>Alimentação</b><small>${refeicoes ? refeicoes + ' refeições registradas' : s?.dietPlan ? 'Seu cardápio está pronto' : 'Monte seu cardápio'}</small><span class="rotina-link">${refeicoes ? 'Ver meu dia' : 'Começar'} ${ic('dir')}</span></button>
        <button class="rotina-atalho" data-a="rotina-abrir" data-modulo="dieta" data-opcao="agua"><span class="rotina-icone cor-agua">${ic('agua')}</span><b>Água</b><small>${agua ? fmtNum(agua / 1000) + ' de ' + fmtNum(meta / 1000) + ' L hoje' : 'Registre ao longo do dia'}</small><span class="rotina-link">Registrar ${ic('plus')}</span></button>
      </div>
      ${!P.S.plano ? '<p class="rotina-convite">Comece pelo treino acima. Alimentação, medidas e cardio continuam aqui quando você quiser.</p>' : `<button class="rotina-proximo" data-a="rotina-abrir" data-modulo="${!s?.dietPlan ? 'dieta' : !medidas ? 'medidas' : 'cardio'}" ${!s?.dietPlan ? 'data-opcao="cardapio"' : ''}><span class="rotina-icone">${ic(!s?.dietPlan ? 'comida' : !medidas ? 'balanca' : 'coracao')}</span><span class="cresce"><small>SEU PRÓXIMO PASSO</small><b>${!s?.dietPlan ? 'Organize sua alimentação' : !medidas ? 'Registre seu ponto de partida' : 'Complete o dia com movimento'}</b></span>${ic('dir')}</button>`}
    </section>`;
  }
  const abasEvolucao = selecionada => `<nav class="rotina-filtros" aria-label="Tipo de evolução">${[['evolucao', 'Treinos'], ['medidas', 'Corpo'], ['conquistas', 'Conquistas']].map(([id, nome]) => `<button data-a="rotina-abrir" data-modulo="${id}" class="${selecionada === id ? 'on' : ''}" ${selecionada === id ? 'aria-current="page"' : ''}>${nome}</button>`).join('')}</nav>`;
  function mais() {
    return `${header('Mais da sua rotina', 'Tudo continua aqui. Abra o que fizer sentido para você.')}
      <section class="cartao rotina-lista">${item('cardio', 'Cardio', 'Caminhada, corrida, bicicleta e outras atividades', 'coracao')}${item('medidas', 'Medidas do corpo', 'Peso, cintura e evolução de cada medida', 'balanca')}${item('conquistas', 'Acompanhamento completo', 'Gráficos, recordes, níveis e medalhas', 'medalha')}</section>
      <div class="titulo-sec">Outras formas de treinar</div>
      <section class="cartao rotina-lista">${item('guiado', 'Treino acompanhado', 'Movimentos em casa com voz e ritmo ajustável', 'play')}${item('biblioteca', 'Seus treinos anteriores e biblioteca', 'Planos A/B/C/D, exercícios e opções avançadas', 'lista')}</section>
      <div class="titulo-sec">Seu app, seus dados</div>
      <section class="cartao rotina-lista">${item('conta', 'Conta e metas', 'Perfil, alimentação e sincronização opcional', 'corpo')}<button class="rotina-item" data-a="ajustes"><span class="rotina-icone">${ic('ajustes')}</span><span class="cresce"><b>Preferências do treino</b><small>Descanso, som, meta semanal e dicas</small></span>${ic('dir')}</button></section>
      <section class="cartao rotina-backup"><div>${ic('baixar')}<h2>Uma cópia de tudo</h2></div><p class="suave peq">Treinos, alimentação, medidas e progresso no mesmo arquivo.</p><button class="btn btn-bloco" data-a="rotina-exportar">${ic('baixar')}Salvar backup completo</button><button class="btn-link" data-a="rotina-importar">Importar um backup</button></section>
      <a class="rotina-classica" href="../" target="_blank" rel="noopener">Abrir a interface clássica ${ic('link')}</a><p class="rotina-versao">PULSO ${esc(P.VERSAO)} · gratuito e sem anúncios</p><input id="rotinaBackup" type="file" accept="application/json,.json" hidden>`;
  }
  function modulo(tela) {
    const nomes = { dieta: ['Alimentação', 'Seu cardápio, refeições e hidratação.'], medidas: ['Sua evolução', 'Acompanhe o corpo ao longo do tempo.'], conquistas: ['Sua evolução', 'Veja seu progresso e celebre a constância.'], cardio: ['Cardio', 'Registre o movimento fora da musculação.'], conta: ['Conta e metas', 'Personalize sua rotina.'], guiado: ['Treino acompanhado', 'Movimento em casa, no seu ritmo.'], biblioteca: ['Treinos e biblioteca', 'Seus planos anteriores e todas as opções.'] };
    const [titulo, texto] = nomes[tela], opcao = P.ui.moduloAcao || '';
    return `${header(titulo, texto)}${['medidas', 'conquistas'].includes(tela) ? abasEvolucao(tela) : ''}<iframe class="rotina-frame" id="moduloRotina" src="../index.html?integrado=${tela}${opcao ? '&acao=' + encodeURIComponent(opcao) : ''}" title="${titulo}" allow="fullscreen" loading="eager"></iframe><p class="rotina-ajuda">Os registros ficam salvos neste navegador.</p>`;
  }
  P.htmlCasca = function () {
    const tela = P.ui.tela;
    let corpo;
    if (tela === 'mais' || modulos.has(tela)) corpo = `<main class="tela ${modulos.has(tela) ? 'tela-modulo' : ''}" data-tela="${tela}">${tela === 'mais' ? mais() : modulo(tela)}</main>`;
    else {
      const template = document.createElement('template'); template.innerHTML = base();
      const main = template.content.querySelector('main');
      if (tela === 'hoje') main.insertAdjacentHTML('beforeend', passosHoje());
      if (tela === 'evolucao') main.querySelector('.cab').insertAdjacentHTML('afterend', abasEvolucao('evolucao'));
      if (tela === 'plano') main.insertAdjacentHTML('beforeend', `<section class="cartao rotina-lista">${item('cardio', 'Registrar cardio', 'Complete seu treino com outra atividade', 'coracao')}${item('guiado', 'Treinar com acompanhamento', 'Demonstração e voz contando as repetições', 'play')}</section>`);
      corpo = main.outerHTML;
    }
    const ativa = ['medidas', 'conquistas'].includes(tela) ? 'evolucao' : modulos.has(tela) && tela !== 'dieta' ? 'mais' : tela;
    const nav = [['hoje', 'casa', 'Hoje'], ['plano', 'halter', 'Treinos'], ['dieta', 'comida', 'Dieta'], ['evolucao', 'grafico', 'Evolução'], ['mais', 'grade', 'Mais']].map(([id, icon, nome]) => `<button class="aba ${ativa === id ? 'on' : ''}" data-a="rotina-abrir" data-modulo="${id}" ${ativa === id ? 'aria-current="page"' : ''}>${ic(icon)}<span>${nome}</span></button>`).join('');
    return `${corpo}<nav class="abas" aria-label="Seções do PULSO"><div class="abas-in">${nav}</div></nav>`;
  };
  P.A['rotina-abrir'] = el => {
    const destino = el.dataset.modulo;
    if (!modulos.has(destino) && !['hoje', 'plano', 'evolucao', 'mais'].includes(destino)) return;
    if (P.ui.tela === destino && !el.dataset.opcao) return;
    P.fecharTodas(); P.ui.tela = destino; P.ui.moduloAcao = el.dataset.opcao || ''; P.render();
  };
  P.exportarRotina = function () {
    const backup = { tipo: 'pulso-rotina', v: 1, exportado: new Date().toISOString(), treino: { ...P.S, sessao: null }, rotina: P.rotina() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `pulso-completo-${P.dkey(Date.now())}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000); P.toast('Backup completo salvo.');
  };
  P.A['rotina-exportar'] = P.exportarRotina;
  P.A['rotina-importar'] = () => document.getElementById('rotinaBackup')?.click();
  P.importarRotina = function (conteudo) {
    let treino = null, rotina = null;
    if (conteudo?.tipo === 'pulso-rotina' && Array.isArray(conteudo.treino?.historico)) {
      treino = conteudo.treino; rotina = conteudo.rotina;
      if (rotina && (!Array.isArray(rotina.workouts) || !Array.isArray(rotina.exercises) || !rotina.settings)) throw new Error('Dados da rotina inválidos');
    } else if (Array.isArray(conteudo?.historico)) treino = conteudo;
    else if (Array.isArray(conteudo?.workouts) && Array.isArray(conteudo?.exercises) && conteudo.settings) { rotina = conteudo; treino = conteudo.guided || null; }
    else throw new Error('Formato de backup inválido');
    if (treino && !Array.isArray(treino.historico)) throw new Error('Treinos inválidos');
    if (!confirm('Restaurar este backup? Os dados incluídos nele substituem os correspondentes deste aparelho. Exporte uma cópia antes se quiser preservar os atuais.')) return false;
    // Salvar os dois blocos antes de trocar a tela. Um backup antigo não apaga os módulos que não contém.
    const anterior = { treino: localStorage.getItem('pulso.simples.v1'), rotina: localStorage.getItem(CHAVE) };
    try {
      if (rotina) localStorage.setItem(CHAVE, JSON.stringify(rotina));
      if (treino) localStorage.setItem('pulso.simples.v1', JSON.stringify({ ...P.migrar(treino), sessao: null }));
    } catch (erro) {
      for (const [chave, valor] of [['pulso.simples.v1', anterior.treino], [CHAVE, anterior.rotina]]) { if (valor == null) localStorage.removeItem(chave); else localStorage.setItem(chave, valor); }
      throw erro;
    }
    if (treino) P.S = P.migrar({ ...treino, sessao: null });
    P.wiz = null; P.fecharTodas(); P.ui.tela = 'hoje'; P.render(); P.toast('Backup restaurado.'); return true;
  };
  document.addEventListener('change', ev => {
    if (ev.target.id !== 'rotinaBackup') return;
    const arquivo = ev.target.files?.[0]; if (!arquivo) return;
    arquivo.text().then(t => P.importarRotina(JSON.parse(t))).catch(() => P.toast('Arquivo inválido ou sem espaço para restaurar. Use um backup do PULSO.', 4500));
  });
  window.addEventListener('message', ev => {
    const frame = document.getElementById('moduloRotina');
    if (ev.origin !== location.origin || !frame || ev.source !== frame.contentWindow) return;
    if (ev.data?.tipo === 'pulso:pronto') frame.dataset.pronto = 'true';
    if (ev.data?.tipo === 'pulso:restaurado') { try { P.S = P.migrar(JSON.parse(localStorage.getItem('pulso.simples.v1'))); P.render(); } catch (_) { P.toast('Não consegui restaurar os treinos deste backup.'); } }
  });
  window.addEventListener('storage', ev => {
    if (ev.key === CHAVE && P.ui.tela === 'hoje' && !P.S.sessao && !P.wiz) P.render();
  });
})();
