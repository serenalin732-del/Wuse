// 五色 App - Service Worker for offline support
const CACHE_NAME = 'wuse-v29-mobile-tree-compact';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './assets/life-tree-handdrawn-v1.png',
  './assets/growth-fruit-v1.png',
  './assets/growth-flower-v1.png',
  './assets/growth-leaf-v1.png',
  './assets/life-tree-branches-v1.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // 只缓存 GET 请求；API 请求不缓存
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('api.anthropic.com')) return;
  if (e.request.url.includes('fonts.googleapis.com') || e.request.url.includes('fonts.gstatic.com')) {
    // 字体走网络优先
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // 静态资源：cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
