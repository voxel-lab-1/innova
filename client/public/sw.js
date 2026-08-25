const CACHE_NAME = "zerofit-cache-v15";

// Install Event - Immediate activation
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

// Activate Event - Clear all old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First for HTML, Cache First for assets
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/") || e.request.method !== "GET") {
    return;
  }

  // Network First for HTML and root navigation to ensure updates are instant
  if (e.request.mode === "navigate" || e.request.url.endsWith("/") || e.request.url.includes("index.html")) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache First for static assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
