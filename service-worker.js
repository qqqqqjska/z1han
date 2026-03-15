self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (err) {
        data = {
            title: '新消息',
            body: event.data ? event.data.text() : '你收到了一条新消息'
        };
    }

    const payload = data.data || data || {};
    const title = data.contactName || payload.contactName || data.title || '新消息';
    const icon = data.icon || payload.icon || 'https://placehold.co/192x192/png?text=Chat';
    const badge = data.badge || payload.badge || icon || 'https://placehold.co/72x72/png?text=Chat';
    const options = {
        body: data.body || '你收到了一条联系人主动消息',
        icon,
        badge,
        tag: data.tag || `contact-${data.contactId || payload.contactId || 'general'}`,
        renotify: true,
        data: payload
    };

    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            try {
                client.postMessage({ type: 'offline-push-sync', payload });
            } catch (err) {}
        }
        await self.registration.showNotification(title, options);
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const payload = event.notification.data || {};
    const targetUrl = payload.url || `./?contactId=${encodeURIComponent(payload.contactId || '')}&openChat=1`;
    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            if ('focus' in client) {
                await client.focus();
                try {
                    client.postMessage({ type: 'offline-push-open-chat', payload });
                } catch (err) {}
                return;
            }
        }
        if (self.clients.openWindow) {
            await self.clients.openWindow(targetUrl);
        }
    })());
});
