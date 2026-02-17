const CACHE_NAME = "tribu-v1";
const STATIC_ASSETS = ["/", "/events", "/create", "/groups", "/settings"];

// Install: cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigations, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets (JS, CSS, images): cache-first
  if (
    request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)(\?|$)/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Tribu";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/events" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/events";
  event.waitUntil(clients.openWindow(url));
});
