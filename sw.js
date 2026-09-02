const CACHE_NAME = 'mha-cache-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/en.html',
    '/style.min.css',
    '/script.min.js',
    '/images/profile.webp',
    '/images/profile.jpg',
    '/images/mha-logo.webp',
    '/images/mha-logo.png',
    '/fonts/Vazirmatn-Regular.woff2',
    '/fonts/Vazirmatn-Bold.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request).catch(() => caches.match('/404.html')))
    );
});
