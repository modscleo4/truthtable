Vue.config.devtools = true

function clearCache() {
    caches.keys().then(names => names.map(n => caches.delete(n)));
}
