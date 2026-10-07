const CACHE = 'maine-ledger-v5';
const BASE = self.registration.scope;
const R = p => new URL(p, BASE).href;
const PRECACHE = ['./', 'index.html', 'archive.html', 'story.html', 'petersburg.html', 'listen.js', 'story-print.html', 'email.html', 'identity.html', 'about.html', 'ledger.css', 'offline.html', 'assets/icon-192.png', 'assets/icon-512.png', 'manifest.webmanifest'].map(R);
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then(r => r || caches.match(R('offline.html')))));
    return;
  }
  if (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
  }
});