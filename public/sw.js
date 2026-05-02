// Service Worker for IZ152 Flight Tracker PWA
const CACHE = 'iz152-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['/', '/index.html'])
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Pass API calls through; serve cached HTML for navigation
  if (e.request.url.includes('/api/')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
  }
});

// ── Push notification handler ─────────────────────────────────────────────
self.addEventListener('push', (e) => {
  if (!e.data) return;
  let payload;
  try { payload = e.data.json(); }
  catch { payload = { title: 'עדכון טיסה IZ152', body: e.data.text() }; }

  e.waitUntil(
    self.registration.showNotification(payload.title || 'עדכון טיסה IZ152', {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      dir: 'rtl',
      lang: 'he',
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'פתח אפליקציה' },
        { action: 'dismiss', title: 'סגור' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(e.notification.data?.url || '/');
    })
  );
});
