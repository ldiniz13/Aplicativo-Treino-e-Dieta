/* PULSO Simples — auditoria do gerador de planos.
 * Gera o plano para TODAS as combinações de respostas do assistente e confere que:
 *   - nenhum treino fica com menos de 3 exercícios
 *   - nenhum treino repete exercício
 *   - todo exercício existe e está disponível para o local/equipamento escolhido
 *
 * Rodar (na pasta do projeto):   node tools/auditar-planos.mjs
 * Sai com código 1 se achar algum problema (serve para rodar antes de publicar).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = path.join(raiz, 'app', 'simples', 'js');

/* mini "navegador" só com o necessário para carregar os arquivos de dados e de plano */
const ctx = {
  console,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
  navigator: {},
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['dados.js', 'util.js', 'estado.js', 'plano.js']) vm.runInContext(fs.readFileSync(path.join(js, f), 'utf8'), ctx, { filename: f });
const P = ctx.P;

const focos = ['corpo', 'pernas', 'cima', 'abd', 'leve'], locais = ['casa', 'academia'], dias = [2, 3, 4, 5], tempos = [30, 45, 60];
const equips = [{ barra: false, elastico: false, peso: false }, { barra: true, elastico: true, peso: true }, { barra: true, elastico: false, peso: false }];
let total = 0, minimo = 99; const problemas = [];

for (const foco of focos) for (const local of locais) for (const d of dias) for (const t of tempos)
  for (const equip of (local === 'casa' ? equips : [{}])) {
    if (foco === 'leve' && (local !== 'casa' || t !== 30)) continue;   // o plano leve ignora local e tempo
    const p = P.gerarPlano({ foco, local, equip, dias: d, tempo: t }); total++;
    p.treinos.forEach(tr => {
      const ids = tr.itens.map(i => i.ex), rotulo = `${foco}/${local}/${d}d/${t}min/${JSON.stringify(equip)} ${tr.letra} ${tr.nome}`;
      if (new Set(ids).size !== ids.length) problemas.push('REPETIDO ' + rotulo);
      if (ids.length < 3) problemas.push(`POUCOS(${ids.length}) ${rotulo}`);
      if (ids.some(id => !P.exPorId(id))) problemas.push('INEXISTENTE ' + rotulo);
      if (foco !== 'leve' && !ids.every(id => P.disponivel(P.exPorId(id), p))) problemas.push('INDISPONÍVEL ' + rotulo);
      minimo = Math.min(minimo, ids.length);
    });
  }

console.log(`combinações testadas: ${total} · menor treino: ${minimo} exercícios · problemas: ${problemas.length}`);
problemas.slice(0, 20).forEach(x => console.log('  ' + x));
process.exit(problemas.length ? 1 : 0);
