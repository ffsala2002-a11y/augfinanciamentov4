const CACHE_NAME = "aug-v6-ia";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/img/logoaugfinance.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
  );

  self.skipWaiting();
});


self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});


self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Never cache or intercept API/function calls.
  if (url.pathname.includes("/functions/v1/") || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
