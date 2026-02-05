// Service Worker for Style Forage PWA
const CACHE_NAME = 'styleforage-v1';

// Minimal service worker - required for PWA install prompt
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients immediately
  event.waitUntil(clients.claim());
});

// Pass through fetch requests (no caching strategy for now)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
