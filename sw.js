// Cranky Chickens — episode notification service worker
self.addEventListener('push', e => {
  let data = { title: '🐔 Cranky Chickens', body: 'Something happened at the farm.', url: '/' };
  try { data = { ...data, ...e.data.json() }; } catch (err) {}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    data: { url: data.url },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) { if (c.url.includes(url) && 'focus' in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});
