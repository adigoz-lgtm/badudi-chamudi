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

// ===== אתחול =====
function init() {
  if (!SONGS || SONGS.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
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

  progressBar.style.width = '0%';
  updateActiveCard();
}

// ===== ניגון / עצירה =====
function playAudio() {
  audio.play().then(() => {
    isPlaying = true;
    btnPlayPause.textContent = '⏸';
  }).catch(() => {});
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  btnPlayPause.textContent = '▶';
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

// ===== פס התקדמות =====
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = pct + '%';
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
