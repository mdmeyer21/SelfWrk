// SelfWrk Service Worker — handles rest timer notifications + offline caching
const CACHE = 'selfwrk-v1';

// ── Rest timer ────────────────────────────────────────────────────────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SCHEDULE_TIMER') {
    var delay = e.data.delay;
    if (self._timerTimeout) clearTimeout(self._timerTimeout);
    self._timerTimeout = setTimeout(function() {
      self.registration.showNotification('Rest Done! 💪', {
        body: 'Time to hit your next set.',
        icon: '/SelfWrk/icon-192.png',
        badge: '/SelfWrk/icon-192.png',
        tag: 'rest-timer',
        renotify: true,
        requireInteraction: false
      });
    }, delay);
  }
  if (e.data && e.data.type === 'CANCEL_TIMER') {
    if (self._timerTimeout) { clearTimeout(self._timerTimeout); self._timerTimeout = null; }
  }
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(function(cs) {
    if (cs.length) cs[0].focus(); else clients.openWindow('/SelfWrk/');
  }));
});

// ── Caching ───────────────────────────────────────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(['./', './manifest.json', './icon-192.png', './icon-512.png']);
    }).catch(function() {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request).then(function(r) {
        return r || caches.match('./');
      });
    })
  );
});
