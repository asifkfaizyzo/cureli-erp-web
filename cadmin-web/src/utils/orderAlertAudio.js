// cadmin-web/src/utils/orderAlertAudio.js (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\curely_erp\cadmin-web\src\utils\orderAlertAudio.js
/**
 * Audio Singleton Utility for looping real-time alerts.
 * Attempts direct playback immediately and defers to the next user interaction if blocked.
 */
function createAlertAudio(soundFile, defaultVolume = 0.6) {
  let audio = null;
  let isPlayingFlag = false;
  let pendingPlay = false;

  const getAudio = () => {
    if (audio) return audio;
    try {
      audio = new Audio(soundFile);
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = defaultVolume;

      audio.addEventListener("play", () => {
        isPlayingFlag = true;
      });
      audio.addEventListener("pause", () => {
        isPlayingFlag = false;
      });
      audio.addEventListener("ended", () => {
        isPlayingFlag = false;
      });
      audio.addEventListener("error", (e) => {
        console.warn(`[AlertAudio:${soundFile}] Audio error:`, e);
        isPlayingFlag = false;
        pendingPlay = false;
      });
    } catch (err) {
      console.warn(`[AlertAudio] Failed to initialize Audio object:`, err);
      audio = null;
    }
    return audio;
  };

  // If autoplay was deferred, trigger playback on first user gesture
  const handleUserGesture = () => {
    if (pendingPlay) {
      pendingPlay = false;
      instance.start();
    }
  };

  if (typeof window !== "undefined") {
    const UNLOCK_EVENTS = ["click", "pointerdown", "keydown", "touchstart"];
    UNLOCK_EVENTS.forEach((e) =>
      window.addEventListener(e, handleUserGesture, {
        passive: true,
        capture: true,
      }),
    );
  }

  const instance = {
    start() {
      const a = getAudio();
      if (!a) return;
      if (isPlayingFlag) return;

      a.currentTime = 0;
      const playPromise = a.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlayingFlag = true;
            pendingPlay = false;
          })
          .catch((err) => {
            // Autoplay deferred until user interacts with the page
            isPlayingFlag = false;
            pendingPlay = true;
            console.warn(
              `[AlertAudio] Autoplay deferred until user interacts:`,
              err.message,
            );
          });
      }
    },

    stop() {
      const a = getAudio();
      pendingPlay = false;
      if (!a) return;
      a.pause();
      a.currentTime = 0;
      isPlayingFlag = false;
    },

    isPlaying() {
      return isPlayingFlag;
    },
  };

  return instance;
}

const orderAlertAudio = createAlertAudio("/sounds/order-alert.mp3", 0.6);

export default orderAlertAudio;
