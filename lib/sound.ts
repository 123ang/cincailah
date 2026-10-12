// Global mute for sound effects (winner fanfare). Stored per browser.
const STORAGE_KEY = 'cincailah:soundMuted';
export const SOUND_MUTED_EVENT = 'sound-muted-changed';

export function isSoundMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* storage blocked: the toggle still works for this page view */
  }
  window.dispatchEvent(new CustomEvent(SOUND_MUTED_EVENT, { detail: muted }));
}

/** Plays a preloaded effect from the start, unless sound is muted. */
export function playSoundEffect(audio: HTMLAudioElement | null) {
  if (!audio || isSoundMuted()) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => undefined); // autoplay can be blocked
  } catch {
    /* ignore */
  }
}
