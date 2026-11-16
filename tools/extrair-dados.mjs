/* PULSO Simples — gera a biblioteca de exercícios enxuta a partir da versão completa.
 *
 * Lê  app/index.html  (a versão completa NÃO é alterada) e escreve:
 *   app/simples/js/dados.js   exercícios escolhidos, já em português simples
 *   app/simples/js/fotos.js   só as fotos dos exercícios escolhidos (base64 webp)
 *
 * Rodar (na pasta do projeto):   node tools/extrair-dados.mjs
 *
 * Para mudar quais exercícios entram, edite a lista PREFERENCIA abaixo.
 * A ORDEM importa: o gerador de treinos escolhe sempre o primeiro disponível
 * (então coloque primeiro os exercícios mais simples e seguros para iniciantes).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origem = path.join(raiz, 'app', 'index.html');
const saida = path.join(raiz, 'app', 'simples', 'js');

/* ---------- 1. Exercícios escolhidos, por grupo muscular, em ordem de preferência ---------- */
const PREFERENCIA = {
  peito: [
    'g_supino', 'g_supino_inc_h', 'g_chestpress', 'g_crossover', 'g_peckdeck', 'g_supino_h', 'g_crucifixo',
    'h_flexao', 'h_flexao_inc', 'h_flexao_aberta', 'h_flexao_dec', 'h_el_crucifixo',
  ],
  costas: [
    'g_puxada', 'g_remada_baixa', 'g_remada_unil', 'g_puxada_tri', 'g_remada', 'g_pulldown_ext', 'g_puxada_sup',
    'h_barra', 'h_remada_inv', 'h_el_remada', 'h_toalha_remada', 'h_remada', 'h_barra_sup', 'h_superman', 'h_barra_escap',
  ],
  ombros: [
    'g_desenv_h', 'g_elev_lat', 'g_desenv_maq', 'g_facepull', 'g_elev_lat_polia', 'g_crucifixo_inv',
    'h_pike', 'h_el_desenv', 'h_desenv_mochila', 'h_el_elev_lat', 'h_el_pullapart',
  ],
  biceps: [
    'g_rosca_alt', 'g_rosca_martelo', 'g_rosca_polia', 'g_rosca_w', 'g_rosca_scott',
    'h_el_rosca', 'h_rosca_mochila',
  ],
  triceps: [
    'g_triceps_corda', 'g_triceps_testa', 'g_triceps_frances', 'g_triceps',
    'h_mergulho', 'h_flexao_diam', 'h_el_triceps', 'h_toalha_triceps',
  ],
  quad: [
    'g_legpress', 'g_agach', 'g_extensora', 'g_goblet', 'g_hack', 'g_afundo_h', 'g_bulgaro', 'g_smith',
    'h_agach', 'h_afundo', 'h_agach_mochila', 'h_bulgaro', 'h_stepup', 'h_agach_salto',
  ],
  post: [
    'g_mesa_flexora', 'g_stiff', 'g_cadeira_flexora', 'g_rdl',
    'h_stiff_mochila', 'h_el_goodmorning', 'h_toalha_flexora',
  ],
  glut: [
    'g_hip_thrust', 'g_gluteo_polia', 'g_abdutora',
    'h_ponte', 'h_ponte_unil', 'h_el_lateral',
  ],
  pant: [
    'g_panturrilha_pe', 'g_gemeos_sent', 'g_panturrilha_lp',
    'h_panturrilha',
  ],
  abd: [
    'g_abd_maquina', 'g_abd_polia', 'g_elev_pernas', 'g_abd_declinado', 'g_pallof',
    'h_prancha', 'h_abd', 'h_abd_infra', 'h_bike', 'h_elev_pernas', 'h_russian', 'h_deadbug', 'h_prancha_lat', 'h_barra_pernas',
  ],
};
/* Exercícios leves (60+ / voltando a treinar): só aparecem no plano "Leve e seguro" */
const LEVES = [
  'h_s_ombros', 'h_s_bracos', 'h_s_marcha', 'h_s_tornozelo', 'h_s_sentar', 'h_s_flexao_parede', 'h_s_ext_joelho',
  'h_s_braco_frente', 'h_s_perna_lado', 'h_s_ponta_pes', 'h_s_rosca', 'h_s_lateral_braco', 'h_s_equilibrio',
  'h_s_along_lateral', 'h_s_along_ombro', 'h_s_along_panturrilha', 'h_s_along_costas', 'h_s_respiracao',
];
/* Grupo dos leves (para o "Trocar") */
const GRUPO_LEVE = {
  h_s_ombros: 'mobil', h_s_bracos: 'mobil', h_s_marcha: 'mobil', h_s_tornozelo: 'mobil',
  h_s_sentar: 'forca', h_s_flexao_parede: 'forca', h_s_ext_joelho: 'forca', h_s_braco_frente: 'forca',
  h_s_perna_lado: 'forca', h_s_ponta_pes: 'forca', h_s_rosca: 'forca', h_s_lateral_braco: 'forca',
  h_s_equilibrio: 'equil', h_s_along_lateral: 'along', h_s_along_ombro: 'along', h_s_along_panturrilha: 'along',
  h_s_along_costas: 'along', h_s_respiracao: 'along',
};
/* Equipamento que o exercício de casa exige (null = nada de especial; cadeira e toalha todo mundo tem) */
const REQUER = { 'Barra fixa': 'barra', 'Elástico': 'elastico', 'Mochila/Halter': 'peso' };

/* ---------- 2. Lê a versão completa ---------- */
const html = fs.readFileSync(origem, 'utf8');
const rodar = (codigo, nome) => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(codigo, ctx);
  return ctx[nome];
};
const iE = html.indexOf('const E = (id');
const iFim = html.indexOf('\n];', html.indexOf('const LIB = [')) + 3;
if (iE < 0 || iFim < 3) throw new Error('Não achei a biblioteca LIB em app/index.html');
const LIB = rodar(html.slice(iE, iFim) + '\n;globalThis.__x = LIB;', '__x');

const iF = html.indexOf('const PHOTOS = {');
const iFF = html.indexOf('const PHOTO_FIT');
const iFFfim = html.indexOf('\n', iFF);
if (iF < 0 || iFF < 0) throw new Error('Não achei PHOTOS em app/index.html');
const FOTOS = rodar(html.slice(iF, iFFfim) + '\n;globalThis.__x = { PHOTOS, PHOTO_FIT: [...PHOTO_FIT] };', '__x');
const IMG_CDN = (html.match(/const IMG_CDN = '([^']+)'/) || [])[1];

/* ---------- 3. Monta os registros ---------- */
const porId = Object.fromEntries(LIB.map(e => [e.id, e]));
const exercicios = [];
const usados = new Set();
const pegar = (id, grupo, ordem, leve) => {
  const e = porId[id];
  if (!e) throw new Error('Exercício não existe na biblioteca: ' + id);
  if (usados.has(id)) throw new Error('Exercício repetido na lista: ' + id);
  usados.add(id);
  exercicios.push({
    id: e.id,
    modo: e.mode === 'gym' ? 'gym' : 'casa',
    nome: e.name,
    musculos: e.muscles,
    equip: e.equip,
    req: e.mode === 'home' ? (REQUER[e.equip] || null) : null,
    foto: e.photo,
    grupo,
    series: Math.min(e.sets, 4),
    reps: e.reps,
    desc: e.rest,
    carga: e.load,
    passo: e.step,
    unidade: e.unit === 'seg' ? 'seg' : 'reps',
    dica: e.cue,
    leve: !!leve,
    ordem,
  });
};
for (const [grupo, ids] of Object.entries(PREFERENCIA)) ids.forEach((id, i) => pegar(id, grupo, i, false));
LEVES.forEach((id, i) => pegar(id, GRUPO_LEVE[id], i, true));

/* Fotos só dos escolhidos */
const fotos = {};
const fit = new Set(FOTOS.PHOTO_FIT);
const fotoIds = new Set();
for (const e of exercicios) {
  const fid = String(e.foto || '').split('#')[0];
  if (!fid) continue;
  fotoIds.add(fid);
  if (FOTOS.PHOTOS[fid]) fotos[fid] = FOTOS.PHOTOS[fid];
}
const fotoFit = [...fotoIds].filter(i => fit.has(i));

/* ---------- 4. Escreve ---------- */
fs.mkdirSync(saida, { recursive: true });
const cab = '/* GERADO por tools/extrair-dados.mjs — não edite à mão (edite o script e rode de novo). */\n';
const linhas = exercicios.map(e => '  ' + JSON.stringify(e)).join(',\n');
fs.writeFileSync(path.join(saida, 'dados.js'),
  `${cab}window.PULSO_DADOS = {\n  imgCdn: ${JSON.stringify(IMG_CDN)},\n  fotoFit: ${JSON.stringify(fotoFit)},\n  exercicios: [\n${linhas}\n  ],\n};\n`);
const fl = Object.entries(fotos).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
fs.writeFileSync(path.join(saida, 'fotos.js'), `${cab}window.PULSO_FOTOS = {\n${fl}\n};\n`);

const kb = f => Math.round(fs.statSync(path.join(saida, f)).size / 1024);
console.log(`exercícios: ${exercicios.length} (${exercicios.filter(e => e.leve).length} leves)`);
console.log(`fotos: ${Object.keys(fotos).length} de ${fotoIds.size} usadas`);
console.log(`dados.js ${kb('dados.js')} KB · fotos.js ${kb('fotos.js')} KB`);
const faltam = [...fotoIds].filter(i => !fotos[i]);
if (faltam.length) console.log('sem foto embutida (usarão a internet):', faltam.join(', '));
