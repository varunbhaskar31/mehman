// Mehman's service worker: keeps the app shell and static files on the
// phone, and shows an offline page when a page can't load. Data from
// Supabase is never cached here; it always comes fresh from the network.
const VERSION = "mehman-v1";
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const IMAGES = `${VERSION}-images`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/", "/explore", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      // One page failing (say, offline during install) shouldn't stop the
      // rest from being saved.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/auth/")) return;

  // Pages: the network first, so bookings are never stale; the last copy
  // or the offline page when there's no connection.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(SHELL).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match(OFFLINE_URL))),
    );
    return;
  }

  // Built files have content hashes in their names, so a cached copy is
  // always right.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              void caches.open(STATIC).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Resized photos: show the saved copy straight away and refresh it.
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(request);
        const fresh = fetch(request)
          .then((response) => {
            if (response.ok) {
              void cache.put(request, response.clone()).then(() => trim(IMAGES, 120));
            }
            return response;
          })
          .catch(() => hit);
        return hit ?? fresh;
      }),
    );
  }
});
