const CACHE_NAME = 'badudi-chamudi-v3';

const CACHE_FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './songs.js',
  './manifest.json',
  './songs/song-one.mp3',
  './songs/song-two.mp3',
  './images/song-one.png',
  './images/song-two.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// התקנה – שמירת קבצים ב-cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// הפעלה – מחיקת cache ישן
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// בקשות רשת – Cache First
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => {
      // אם אין cache ואין אינטרנט – החזר index.html
      return caches.match('./index.html');
    })
  );
});
