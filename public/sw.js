self.addEventListener('push', (event) => {
    if (!event.data) {
        return;
    }

    let payload = {};

    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'TimeTraq', body: event.data.text() };
    }

    const title = payload.title ?? 'TimeTraq';
    const options = {
        body: payload.body ?? '',
        icon: payload.icon ?? '/img/Logo.png',
        badge: payload.badge ?? '/img/Logo.png',
        data: payload.data ?? {},
        tag: payload.tag ?? undefined,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url ?? '/';

    const absoluteUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }

            if (self.clients.openWindow) {
                return self.clients.openWindow(absoluteUrl);
            }
        }),
    );
});
