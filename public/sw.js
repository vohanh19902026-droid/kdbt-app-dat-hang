const CACHE = "cencom-shell-v3";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/offline.html", "/icon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"])));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
});
self.addEventListener("push", (event) => {
  let message = {};
  try { message = event.data ? event.data.json() : {}; } catch { message = { body: event.data?.text() || "Bạn có cập nhật mới." }; }
  const title = typeof message.title === "string" ? message.title.slice(0, 100) : "CENCOM · Thông báo";
  const body = typeof message.body === "string" ? message.body.slice(0, 300) : "Bạn có cập nhật mới trong ứng dụng.";
  const candidate = typeof message.url === "string" && message.url.startsWith("/") && !message.url.startsWith("//") ? message.url : "/notifications";
  event.waitUntil(self.registration.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: candidate }, tag: "cencom-order-update", renotify: true }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/notifications", self.location.origin);
  const safeTarget = target.origin === self.location.origin ? target.href : new URL("/notifications", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const openClient = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (openClient) return openClient.navigate(safeTarget).then(() => openClient.focus());
    return self.clients.openWindow(safeTarget);
  }));
});
