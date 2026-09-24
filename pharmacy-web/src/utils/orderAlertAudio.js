// pharmacy-web/src/utils/orderAlertAudio.js (do not remove this comment)
// pharmacy-web/src/utils/orderAlertAudio.js
// Two independent audio singletons:
//   1. orderAlertAudio        — for marketplace orders (cannot be muted from UI)
//   2. prescriptionAlertAudio — for prescription requests (per-request mute)

function createAlertAudio(soundFile, defaultVolume = 0.6) {
  let audio = null;
  let isPlayingFlag = false;
  let unlocked = false;
  let pendingPlay = false;

  const getAudio = () => {
    if (audio) return audio;
    try {
      audio = new Audio(soundFile);
      audio.loop = true;
      audio.volume = defaultVolume;
      audio.addEventListener('play', () => { isPlayingFlag = true; });
      audio.addEventListener('pause', () => { isPlayingFlag = false; });
      audio.addEventListener('ended', () => { isPlayingFlag = false; });
      audio.addEventListener('error', (e) => {
        console.warn(`[AlertAudio:${soundFile}] Audio error:`, e);
        isPlayingFlag = false;
      });
    } catch {
      audio = null;
    }
    return audio;
  };

  const unlock = () => {
    if (unlocked) return;
    const a = getAudio();
    if (!a) return;

    a.volume = 0;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = defaultVolume;
        unlocked = true;

        if (pendingPlay) {
          pendingPlay = false;
          instance.start();
        }
      })
      .catch(() => {
        // Still blocked — will retry on next interaction
      });
  };

  // Attach unlock to common user gestures
  const UNLOCK_EVENTS = ['click', 'keydown', 'touchstart', 'pointerdown'];
  const onUserGesture = () => {
    unlock();
  };
  if (typeof window !== 'undefined') {
    UNLOCK_EVENTS.forEach((e) =>
      window.addEventListener(e, onUserGesture, { passive: true }),
    );
  }

  const instance = {
    start() {
      const a = getAudio();
      if (!a || isPlayingFlag) return;

      if (!unlocked) {
        pendingPlay = true;
        console.warn(`[AlertAudio:${soundFile}] Not yet unlocked — will play after first user gesture`);
        return;
      }

      a.currentTime = 0;
      a.play().catch((err) => {
        console.warn(`[AlertAudio:${soundFile}] Autoplay blocked:`, err.message);
        isPlayingFlag = false;
      });
    },

    stop() {
      const a = getAudio();
      if (!a) return;
      a.pause();
      a.currentTime = 0;
      isPlayingFlag = false;
      pendingPlay = false;
    },

    isPlaying() {
      return isPlayingFlag;
    },
  };

  return instance;
}

// Order alert — uses the existing sound file
const orderAlertAudio = createAlertAudio('/sounds/order-alert.mp3', 0.6);

// Prescription request alert — uses the SAME sound file (change path if you want a different sound)
const prescriptionAlertAudio = createAlertAudio('/sounds/order-alert.mp3', 0.5);

export { prescriptionAlertAudio };
export default orderAlertAudio;