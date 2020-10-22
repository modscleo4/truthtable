/**
 * Copyright 2020 Dhiego Cassiano Fogaça Barbosa

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @file Service Worker runs even if the page is not open, handling background sync and push notifications.
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

/**
 * What files to cache
 */
const CACHE_NAME = 'truthTable-cache-v1';
const urlsToCache = [
    './',
    './icons/notification-icon.png',
    './css/main.css',
    './css/themes/light.css',
    './css/themes/dark.css',
    './js/theme.js',
    './js/debug.js',
    './js/main.js',
];

/**
 * Cache the files
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

/**
 * Get the cached files
 */
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }

            const fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then(async cache => {
                        await cache.put(event.request, responseToCache);
                    });

                    return response;
                }
            );
        })
    );
});

/**
 * Delete the old versions on update
 */
self.addEventListener('activate', event => {
    const cacheWhitelist = ['truthTable-cache-v1'];

    event.waitUntil(caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
            }
        }));
    }));
});

self.addEventListener('sync', event => {
    event.waitUntil(console.log(`[Service Worker] received sync request '${event.tag}'`));
});

self.addEventListener('push', event => {
    console.log('[Service Worker] Push received.');
    console.log(`[Service Worker] Push had this data: '${event.data.text()}'`);

    let title = 'Kana List';
    let body = event.data.text();
    let icon = 'icons/notification-icon.png';

    event.waitUntil(self.registration.showNotification(title, {body: body, icon: icon}));
});

self.addEventListener('notificationclick', event => {
    console.log(`[Service Worker] Notification click received. Notification tag: ${event.notification.tag}`);

    event.notification.close();

    // Check if the user is in the tab, and focus it if so
    event.waitUntil(self.clients.matchAll({
        type: 'window'
    }).then(clientList => {
        clientList.forEach(client => {
            if (client.url === '/' && 'focus' in client) {
                return client.focus();
            } else if (client.openWindow) {
                return client.openWindow('/');
            }
        });
    }));
});
