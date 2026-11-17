/* PULSO Simples — service worker: instala como app e funciona sem internet.
   Mudou algum arquivo do app? Suba o número em CACHE (v1 → v2) para os celulares atualizarem. */
const CACHE = 'pulso-simples-v3';
const CORE = [
  './', './index.html', './estilo.css', './rotina.css', './manifest.webmanifest',
  './js/dados.js', './js/fotos.js', './js/util.js', './js/estado.js', './js/plano.js', './js/treino.js', './js/telas.js', './js/rotina.js', './js/app.js',
  '../index.html', '../firebase-config.js', '../modulos/integracao.js', '../modulos/integracao.css', '../vendor/lucide.min.js', '../vendor/chart.umd.min.js', '../icons/icon-192.png', '../icons/icon-512.png',
];
const FONTES = /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  /* só apaga caches antigos DESTE app (o app completo tem os dele) */
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('pulso-simples-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), mesma = url.origin === self.location.origin;
  if (!mesma && !FONTES.test(url.hostname)) return;
  const base = new URL('../', self.location);
  const paginaModulo = mesma && url.pathname === new URL('index.html', base).pathname && url.searchParams.has('integrado');
  const recursoModulo = mesma && /\/(modulos|vendor)\//.test(url.pathname);
  if (mesma && !paginaModulo && !recursoModulo && !url.pathname.startsWith(new URL('./', self.location).pathname) && !url.pathname.startsWith(new URL('icons/', base).pathname)) return;
  /* página: rede primeiro (pega atualizações), cache se estiver sem internet */
  if (req.mode === 'navigate') {
    const chave = paginaModulo ? '../index.html' : './index.html';
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(chave, c)); } return r; }).catch(() => caches.open(CACHE).then(c => c.match(chave))));
    return;
  }
  /* o resto: cache primeiro, atualiza em segundo plano */
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const rede = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || rede;
  }));
});
