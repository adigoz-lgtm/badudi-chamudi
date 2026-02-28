const CACHE_NAME = 'badudi-chamudi-v5';

const CACHE_FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './songs.js',
  './manifest.json',
  './songs/song-one.mp3',
  './songs/song-two.mp3',
  './songs/אוי בדודי.mp3',
  './songs/אוי בדודי - שובו של הפודל.mp3',
  './songs/אני לא מכיל.mp3',
  './songs/בוקר טוב בדודי.mp3',
  './songs/בלדה לבלוטי.mp3',
  './songs/היא מגיעה בתשע.mp3',
  './songs/יש לי זנב.mp3',
  './songs/מלחמה עם איראן.mp3',
  './songs/קשה קשה קשה.mp3',
  './songs/תחת תחת תחת.mp3',
  './images/song-one.png',
  './images/song-two.png',
  './images/אוי בדודי.png',
  './images/אוי בדודי - שובו של הפודל.png',
  './images/אני לא מכיל.png',
  './images/בוקר טוב בדודי.png',
  './images/בלדה לבלוטי.png',
  './images/היא מגיעה בתשע.png',
  './images/יש לי זנב.png',
  './images/מלחמה עם איראן.png',
  './images/קשה קשה קשה.png',
  './images/תחת תחת תחת.png',
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
