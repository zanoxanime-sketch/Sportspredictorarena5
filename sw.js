// Sports Predictor Arena — Service Worker
// Minimal offline cache: just enough to make the app installable and let it
// open once even with no signal. Supabase/Cloudinary calls still need
// internet — this does NOT make the app fully offline.

const CACHE_NAME = 'spa-cache-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle simple GET requests for our own app shell.
  // Everything else (Supabase, Cloudinary, ads) goes straight to the network.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // If offline and not cached, fall back to the cached homepage
          // so the app at least opens instead of showing a browser error.
          return caches.match('/');
        })
      );
    })
  );
});
