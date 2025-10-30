const CACHE_NAME = 'panc-cache-v1';
const FILES_TO_CACHE = [
  './',
  './identificador.html',
  './landing-page.html',
  './style.css',
  './script.js',
  './panc.png',
  './tm-my-image-model/model.json',
  './tm-my-image-model/metadata.json'
];

// Instala o service worker e faz cache dos arquivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Cache criado com sucesso!');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Ativa o SW e remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

// Intercepta requisições e serve do cache se offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) =>
      response || fetch(event.request)
    )
  );
});
