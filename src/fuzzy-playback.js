// Times are seconds on the language-pack explanation track, not source-video time.
export const DEFAULT_FUZZY = {
  sourceStart: 12,
  languagePacks: {
    ko: { start: 0, end: 5, subtitle: '작업 전 보호구 착용 상태를 확인해 주세요.' },
    en: { start: 0, end: 7, subtitle: 'Check your protective equipment before starting.' },
    ur: { start: 0, end: 10, subtitle: 'کام شروع کرنے سے پہلے حفاظتی سامان کی جانچ کریں۔' },
  },
};
export function explanationPack(step, language) {
  const pack = step.fuzzy?.languagePacks?.[language] || DEFAULT_FUZZY.languagePacks[language];
  return { ...pack, duration: Math.max(0, pack.end - pack.start) };
}
export class FuzzyPlayback {
  constructor({ onFinish, now = () => performance.now(), schedule = (fn, ms) => setTimeout(fn, ms), cancel = id => clearTimeout(id), createAudio = url => new Audio(url) }) {
    Object.assign(this, { onFinish, now, schedule, cancel, createAudio });
    this.active = false;
    this.elapsed = 0;
  }
  start(pack) {
    this.stop();
    this.active = true;
    this.elapsed = 0;
    this.startedAt = this.now();
    this.setPack(pack);
  }
  progress() {
    if (this.audio) return Math.max(0, this.audio.currentTime - this.pack.start);
    return this.elapsed + (this.now() - this.startedAt) / 1000;
  }
  setPack(pack) {
    if (!this.active) return;
    this.elapsed = this.pack ? this.progress() : this.elapsed;
    this.cleanup();
    this.pack = pack;
    this.startedAt = this.now();
    if (this.elapsed >= pack.duration) { this.finish(); return; }
    if (pack.audioUrl) {
      const audio = this.audio = this.createAudio(pack.audioUrl);
      audio.onloadedmetadata = () => {
        if (!this.active || this.audio !== audio) return;
        audio.currentTime = pack.start + this.elapsed;
        audio.play().catch(() => { /* The UI retains manual skip if autoplay is denied. */ });
      };
      audio.onended = () => this.finish();
    }
    this.tick();
  }
  tick() {
    if (!this.active) return;
    if (this.progress() >= this.pack.duration) { this.finish(); return; }
    this.timer = this.schedule(() => this.tick(), 50);
  }
  finish() {
    if (!this.active) return;
    this.active = false;
    this.cleanup();
    this.onFinish();
  }
  cleanup() {
    if (this.timer !== undefined) this.cancel(this.timer);
    if (this.audio) {
      this.audio.onended = this.audio.onloadedmetadata = null;
      this.audio.pause();
      this.audio = null;
    }
  }
  stop() {
    this.active = false;
    this.cleanup();
    this.pack = null;
    this.elapsed = 0;
  }
}
