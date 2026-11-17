/* PULSO — service worker: deixa o app instalável e funcionando offline.
   Página e configuração do login: rede primeiro (recebem atualizações), cache se estiver sem internet.
   Bibliotecas (ícones, gráficos, Firebase), fontes e fotos: cache primeiro, atualiza em segundo plano.
   Login e dados da nuvem (googleapis) nunca passam pelo cache. */
const CACHE = 'pulso-v7';
const CORE = ['./', './index.html', './manifest.webmanifest', './firebase-config.js', './modulos/integracao.js', './modulos/integracao.css', './vendor/lucide.min.js', './vendor/chart.umd.min.js', './icons/icon-192.png', './icons/icon-512.png'];
const EXTERNAL = /(^|\.)(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|raw\.githubusercontent\.com|www\.gstatic\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  /* só apaga versões antigas DESTE app (pulso-v*); a versão Simples guarda o cache dela em pulso-simples-* */
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k.startsWith('pulso-v')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const networkFirst = (req, key) => fetch(req).then(res => {
  if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key || req, copy)); }
  return res;
}).catch(() => caches.match(key || req));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (same && url.pathname.startsWith(new URL('simples/', self.location).pathname)) return;   // a versão Simples tem o próprio service worker
  if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm')) return;   // vídeo: direto da rede (streaming)
  if (same && url.pathname.startsWith('/__/')) return;                             // telas do login do Firebase
  if (req.mode === 'navigate' || (same && (url.pathname === '/' || url.pathname.endsWith('/index.html')))) {
    e.respondWith(networkFirst(req, './index.html'));
    return;
  }
  if (same && url.pathname.endsWith('/firebase-config.js')) { e.respondWith(networkFirst(req)); return; }
  if (same || EXTERNAL.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
