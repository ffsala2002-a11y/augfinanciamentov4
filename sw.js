
const CACHE_PREFIX = "aug-financeira-";
const CACHE_NAME = "aug-financeira-v8";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/img/logoaugfinance.png"
];

// Instala a nova versão e prepara os arquivos essenciais.
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll(FILES);

      await self.skipWaiting();
    })()
  );
});

// Remove somente caches antigos deste sistema.
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            key =>
              key.startsWith(CACHE_PREFIX) &&
              key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

// Controla as requisições de arquivos.
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Não intercepta métodos diferentes de GET.
  if (request.method !== "GET") {
    return;
  }

  // Não intercepta recursos de outros domínios.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Não intercepta chamadas conhecidas do Supabase.
  const apiPaths = [
    "/functions/v1/",
    "/rest/v1/",
    "/auth/v1/",
    "/storage/v1/"
  ];

  if (apiPaths.some(path => url.pathname.includes(path))) {
    return;
  }

  // Não intercepta requisições parciais de arquivos.
  if (request.headers.has("range")) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        // Prioriza a versão atual do servidor.
        const response = await fetch(request, {
          cache: "no-store"
        });

        // Atualiza o cache somente com respostas válidas.
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        // Sem rede, tenta recuperar o recurso armazenado.
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // Se for uma navegação, tenta abrir a página principal.
        if (request.mode === "navigate") {
          const offlinePage = await cache.match("./index.html");

          if (offlinePage) {
            return offlinePage;
          }
        }

        // Não existe resposta disponível.
        return Response.error();
      }
    })()
  );
});
