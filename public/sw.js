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
  // Only intercept GET requests. Re-dispatching a request with a body
  // (e.g. multipart/form-data uploads) via fetch(event.request) can drop
  // or truncate the body on iOS Safari, so let non-GET requests hit the
  // network directly instead of going through respondWith.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).catch((error) => {
      console.error('Fetch failed:', error);
      // Return a basic error response or try to serve from cache if available
      return new Response('Network error occurred', {
        status: 500,
        statusText: 'Service Unavailable'
      });
    })
  );
});
