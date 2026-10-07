// js/audio.js - Servicio de sintetización de audio con Web Audio API (100% offline y sin archivos externos)

export class SoundService {
  constructor({ storageKey = 'cronometro_sound_enabled' } = {}) {
    this.storageKey = storageKey;
    this.enabled = true;
    this.audioCtx = null;

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch (e) {}
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    try {
      localStorage.setItem(this.storageKey, this.enabled.toString());
    } catch (e) {}
    return this.enabled;
  }

  toggle() {
    return this.setEnabled(!this.enabled);
  }

  _getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Reproduce una suave y elegante campanada en acorde mayor (Do-Mi-Sol / C5-E5-G5)
   */
  playChime() {
    if (!this.enabled) return;

    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.6);
      });
    } catch (e) {
      console.warn('Error sintetizando sonido', e);
    }
  }
}
