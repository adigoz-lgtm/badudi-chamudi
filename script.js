// ===== מסך סיסמה =====
(function () {
  const PASSWORD = 'ישליזנב';
  const STORAGE_KEY = 'badudi_auth';

  const lockScreen = document.getElementById('lock-screen');
  const lockInput  = document.getElementById('lock-input');
  const lockBtn    = document.getElementById('lock-btn');
  const lockError  = document.getElementById('lock-error');

  if (localStorage.getItem(STORAGE_KEY) === '1') {
    lockScreen.classList.add('hidden');
    return;
  }

  function tryUnlock() {
    if (lockInput.value === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1');
      lockScreen.classList.add('hidden');
    } else {
      lockError.textContent = 'סיסמה שגויה, נסה שוב';
      lockInput.value = '';
      lockInput.focus();
    }
  }

  lockBtn.addEventListener('click', tryUnlock);
  lockInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryUnlock();
  });
})();

// ===== מסך כניסה =====
(function () {
  const introScreen = document.getElementById('intro-screen');
  const introBtn    = document.getElementById('intro-btn');

  introBtn.addEventListener('click', () => {
    introScreen.classList.add('fade-out');
    setTimeout(() => introScreen.classList.add('hidden'), 500);
  });
})();

// ===== מצב הנגן =====
let currentIndex = 0;
let isPlaying = false;
const audio = new Audio();

// ===== אלמנטים =====
const songList = document.getElementById('song-list');
const emptyState = document.getElementById('empty-state');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const playerThumb = document.getElementById('player-thumb');
const playerTitle = document.getElementById('player-title');
const btnPrev = document.getElementById('btn-prev');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnNext = document.getElementById('btn-next');
const heroImg = document.getElementById('hero-img');
const heroBg = document.getElementById('hero-bg');
const nowPlaying       = document.getElementById('now-playing');
const npBg             = document.getElementById('np-bg');
const npImg            = document.getElementById('np-img');
const npTitle          = document.getElementById('np-title');
const npNumber         = document.getElementById('np-number');
const npProgressCont   = document.getElementById('np-progress-container');
const npProgressBar    = document.getElementById('np-progress-bar');
const npTimeCurrent    = document.getElementById('np-time-current');
const npTimeTotal      = document.getElementById('np-time-total');
const npBtnPrev        = document.getElementById('np-btn-prev');
const npBtnPlay        = document.getElementById('np-btn-play');
const npBtnNext        = document.getElementById('np-btn-next');
const npClose          = document.getElementById('np-close');
const npQueueCard      = document.getElementById('np-queue-card');

// ===== אתחול =====
function init() {
  if (!SONGS || SONGS.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  initMediaSessionHandlers();
  renderSongList();
  loadSong(0);
}

// ===== עיבוד רשימת שירים =====
function renderSongList() {
  songList.innerHTML = '';
  SONGS.forEach((song, index) => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.dataset.index = index;
    card.innerHTML = `
      <img src="${song.image}" alt="${song.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22><rect width=%2256%22 height=%2256%22 fill=%22%23e94560%22 rx=%2210%22/><text x=%2228%22 y=%2236%22 text-anchor=%22middle%22 font-size=%2224%22>🎵</text></svg>'">
      <div class="song-info">
        <div class="song-title">${song.title}</div>
        <div class="song-number">שיר ${index + 1} מתוך ${SONGS.length}</div>
      </div>
      <span class="play-icon">▶</span>
    `;
    card.addEventListener('click', () => {
      if (currentIndex === index) {
        togglePlay();
      } else {
        loadSong(index);
        playAudio();
      }
      showNowPlaying();
    });
    songList.appendChild(card);
  });
}

// ===== טעינת שיר =====
function loadSong(index) {
  currentIndex = index;
  const song = SONGS[index];

  audio.src = song.audio;
  playerTitle.textContent = song.title;
  playerThumb.src = song.image;
  playerThumb.onerror = () => {
    playerThumb.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" fill="%23e94560" rx="8"/><text x="22" y="30" text-anchor="middle" font-size="20">🎵</text></svg>';
  };

  // עדכון תמונת hero
  heroImg.style.opacity = '0.3';
  heroImg.src = song.image;
  heroImg.onload = () => { heroImg.style.opacity = '1'; };
  heroImg.onerror = () => { heroImg.src = 'icons/icon-512.png'; heroImg.style.opacity = '1'; };

  // עדכון רקע מטושטש
  heroBg.style.backgroundImage = `url("${encodeURI(song.image)}")`;
  heroBg.classList.add('visible');

  progressBar.style.width   = '0%';
  npProgressBar.style.width = '0%';
  updateActiveCard();
  if (nowPlaying.classList.contains('visible')) updateNowPlaying();
  updateMediaSession();
}

// ===== Media Session API =====
function initMediaSessionHandlers() {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.setActionHandler('play',          () => playAudio());
  navigator.mediaSession.setActionHandler('pause',         () => pauseAudio());
  navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
  navigator.mediaSession.setActionHandler('nexttrack',     () => nextSong());
  navigator.mediaSession.setActionHandler('seekto',        (d) => { audio.currentTime = d.seekTime; });
  navigator.mediaSession.setActionHandler('seekbackward',  (d) => {
    audio.currentTime = Math.max(0, audio.currentTime - (d.seekOffset || 10));
  });
  navigator.mediaSession.setActionHandler('seekforward',   (d) => {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + (d.seekOffset || 10));
  });
}

function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const song = SONGS[currentIndex];
  const ext  = song.image.split('.').pop().toLowerCase();
  const type = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
  const src  = new URL(song.image, location.href).href;

  navigator.mediaSession.metadata = new MediaMetadata({
    title:  song.title,
    artist: 'בדודי חמודי',
    album:  'בדודי חמודי',
    artwork: [
      { src, sizes: '96x96',   type },
      { src, sizes: '128x128', type },
      { src, sizes: '192x192', type },
      { src, sizes: '256x256', type },
      { src, sizes: '384x384', type },
      { src, sizes: '512x512', type },
    ]
  });
}

// ===== עדכון כפתורי Play/Pause בכל המקומות =====
function setPlayingUI(playing) {
  isPlaying = playing;
  btnPlayPause.textContent = playing ? '⏸' : '▶';
  npBtnPlay.textContent    = playing ? '⏸' : '▶';
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }
}

// ===== ניגון / עצירה =====
function playAudio() {
  audio.play().then(() => setPlayingUI(true)).catch(() => {});
}

function pauseAudio() {
  audio.pause();
  setPlayingUI(false);
}

function togglePlay() {
  if (isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

// ===== ניווט =====
function prevSong() {
  const newIndex = currentIndex === 0 ? SONGS.length - 1 : currentIndex - 1;
  loadSong(newIndex);
  if (isPlaying) playAudio();
}

function nextSong() {
  const newIndex = (currentIndex + 1) % SONGS.length;
  loadSong(newIndex);
  if (isPlaying) playAudio();
}

// ===== עדכון כרטיס פעיל =====
function updateActiveCard() {
  document.querySelectorAll('.song-card').forEach((card, i) => {
    card.classList.toggle('active', i === currentIndex);
  });
}

// ===== נגן מלא =====
function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderQueueCard() {
  const nextIndex = (currentIndex + 1) % SONGS.length;
  const next = SONGS[nextIndex];
  npQueueCard.innerHTML = `
    <img src="${next.image}" alt="${next.title}" onerror="this.src='icons/icon-512.png'" />
    <div class="np-queue-info">
      <div class="np-queue-song-title">${next.title}</div>
      <div class="np-queue-sub">שיר ${nextIndex + 1} מתוך ${SONGS.length}</div>
    </div>
    <span class="np-queue-arrow">▶</span>
  `;
  npQueueCard.onclick = () => {
    loadSong(nextIndex);
    playAudio();
  };
}

function updateNowPlaying() {
  const song = SONGS[currentIndex];
  npBg.style.backgroundImage  = `url("${encodeURI(song.image)}")`;
  npImg.src                    = song.image;
  npImg.onerror                = () => { npImg.src = 'icons/icon-512.png'; };
  npTitle.textContent          = song.title;
  npNumber.textContent         = `שיר ${currentIndex + 1} מתוך ${SONGS.length}`;
  npBtnPlay.textContent        = isPlaying ? '⏸' : '▶';
  npTimeTotal.textContent      = formatTime(audio.duration);
  renderQueueCard();
}

function showNowPlaying() {
  updateNowPlaying();
  nowPlaying.classList.add('visible');
}

function hideNowPlaying() {
  nowPlaying.classList.remove('visible');
}

npClose.addEventListener('click', hideNowPlaying);

npBtnPlay.addEventListener('click', togglePlay);
npBtnPrev.addEventListener('click', () => { prevSong(); updateNowPlaying(); });
npBtnNext.addEventListener('click', () => { nextSong(); updateNowPlaying(); });

npProgressCont.addEventListener('click', (e) => {
  const rect  = npProgressCont.getBoundingClientRect();
  const clickX = rect.right - e.clientX; // RTL
  audio.currentTime = (clickX / rect.width) * audio.duration;
});

// פתיחת נגן מלא בלחיצה על אזור הנגן הקטן
playerThumb.addEventListener('click', showNowPlaying);
playerTitle.addEventListener('click', showNowPlaying);

// ===== פס התקדמות =====
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width   = pct + '%';
    npProgressBar.style.width = pct + '%';
    npTimeCurrent.textContent = formatTime(audio.currentTime);
    npTimeTotal.textContent   = formatTime(audio.duration);

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setPositionState({
          duration:     audio.duration,
          playbackRate: audio.playbackRate,
          position:     audio.currentTime
        });
      } catch (e) {}
    }
  }
});

progressContainer.addEventListener('click', (e) => {
  const rect = progressContainer.getBoundingClientRect();
  // RTL: חישוב הפוך
  const clickX = rect.right - e.clientX;
  const ratio = clickX / rect.width;
  audio.currentTime = ratio * audio.duration;
});

// ===== מעבר אוטומטי =====
audio.addEventListener('ended', () => {
  nextSong();
  playAudio();
});

// ===== כפתורים =====
btnPrev.addEventListener('click', prevSong);
btnPlayPause.addEventListener('click', togglePlay);
btnNext.addEventListener('click', nextSong);

// ===== הפעלה =====
init();
