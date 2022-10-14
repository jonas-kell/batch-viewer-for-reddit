urlsToCache = [
    "",
    "index.html",
    "app.js",
    "styles.css",
    "app.webmanifest",
    "favicon.ico",
    "archive.html",
    "archive.js",
    "manage.html",
    "manage.js",
    "hash.js",
    "assets/favicons/apple-touch-icon.png",
    "assets/favicons/favicon-16x16.png",
    "assets/favicons/favicon-32x32.png",
    "assets/favicons/safari-pinned-tab.svg",
    "assets/icons/icon-48x48.png",
    "assets/icons/icon-72x72.png",
    "assets/icons/icon-128x128.png",
    "assets/icons/icon-144x144.png",
    "assets/icons/icon-152x152.png",
    "assets/icons/icon-192x192.png",
    "assets/icons/icon-384x384.png",
    "assets/icons/icon-512x512.png",
    "https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js",
];

// This code executes in its own worker or thread
self.addEventListener("install", (event) => {
    console.log("Service worker installed");

    // cache for offlie use
    event.waitUntil(
        caches.open("pwa-assets").then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});
self.addEventListener("activate", (event) => {
    console.log("Service worker activated");
});

// fetch event listener
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // It can update the cache to serve updated content on the next request
            return cachedResponse || fetch(event.request);
        })
    );
});
