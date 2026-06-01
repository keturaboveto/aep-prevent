const CACHE = 'aep-nr17-final-v2';
const ASSETS = ['./', './login.html', './diagnostico.html', './aeps.html', './admin.html', './index.html',
  './auth.js', './aeps.js', './app.js', './logo-data.js', './firebase-config.js',
  './manifest.json', './logo-prevent.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(u => c.add(u).catch(()=>{}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.hostname === 'brasilapi.com.br') return;

  // Network-first para HTML, cache-first para o resto
  if(e.request.mode === 'navigate' || e.request.destination === 'document'){
    e.respondWith(
      fetch(e.request).then(res => {
        if(res && res.status === 200){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./login.html')))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then(cached => {
    if(cached) return cached;
    return fetch(e.request).then(res => {
      if(!res || res.status !== 200) return res;
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => { if(e.request.mode === 'navigate') return caches.match('./login.html'); });
  }));
});
