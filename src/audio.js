/** Tiny audio helper: mp3 playback with a synthesized fallback + simple sfx via WebAudio. */
export class Audio {
  constructor() {
    this.ctx = null;
  }
  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Plays an mp3; if it fails (missing file), uses speech synthesis for the text. Resolves when done. */
  async voice(src, text) {
    const audio = new window.Audio(src);
    const played = await new Promise((resolve) => {
      audio.addEventListener('ended', () => resolve(true));
      audio.addEventListener('error', () => resolve(false));
      audio.play().catch(() => resolve(false));
    });
    if (played) return;
    await new Promise((resolve) => {
      if (!window.speechSynthesis) return setTimeout(resolve, 4000);
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = 0.3; u.rate = 0.75;
      u.onend = resolve; u.onerror = resolve;
      window.speechSynthesis.speak(u);
      setTimeout(resolve, 8000);
    });
  }

  tone(freq, duration = 0.1, type = 'square', gain = 0.08) {
    try {
      const ctx = this.ensure();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + duration);
    } catch { /* audio not available */ }
  }

  pickup() { this.tone(660, 0.08); setTimeout(() => this.tone(990, 0.12), 80); }
  hurt() { this.tone(110, 0.3, 'sawtooth', 0.15); }
  roar() { this.tone(70, 0.8, 'sawtooth', 0.25); setTimeout(() => this.tone(55, 1.0, 'sawtooth', 0.25), 200); }
  shot() { this.tone(200, 0.12, 'sawtooth', 0.2); }
  stab() { this.tone(900, 0.06, 'triangle', 0.12); }
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.1), i * 150)); }
}
