// Times are seconds on the language-pack explanation track, not source-video time.
export const DEFAULT_FUZZY = {
  sourceStart: 12,
  languagePacks: {
    ko: { start: 0, end: 5, subtitle: '작업 전 보호구 착용 상태를 확인해 주세요.' },
    en: { start: 0, end: 7, subtitle: 'Check your protective equipment before starting.' },
    ur: { start: 0, end: 10, subtitle: 'کام شروع کرنے سے پہلے حفاظتی سامان کی جانچ کریں۔' },
  },
};
export function segmentsFor(step){
 if(Array.isArray(step.fuzzySegments))return [...step.fuzzySegments].sort((a,b)=>a.sourceStart-b.sourceStart);
 return [{id:'legacy-default',sourceStart:step.fuzzy?.sourceStart??DEFAULT_FUZZY.sourceStart,languagePacks:step.fuzzy?.languagePacks||DEFAULT_FUZZY.languagePacks}];
}
export function explanationPack(step,language,segment=null){
 const packs=segment?.languagePacks||step.fuzzy?.languagePacks||DEFAULT_FUZZY.languagePacks;
 const pack=packs[language]||{start:0,end:5,subtitle:step.desc||'',subtitleOnly:true};
 // Original video audio is never used as a language pack.
 return {tts:true,locale:language,...pack,audioUrl:pack.sourceAudio?undefined:pack.audioUrl,duration:Math.max(0,pack.end-pack.start)};
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
        audio.play().catch(() => this.audioFallback(audio));
      };
      audio.onended = () => this.finish();
      audio.onerror = () => this.audioFallback(audio);
    }
    if(!pack.audioUrl && pack.tts && pack.subtitle && globalThis.speechSynthesis){
      const voice=speechSynthesis.getVoices().find(v=>v.localService&&v.lang.toLowerCase().split('-')[0]===(pack.locale||'ko').split('-')[0]);
      if(voice){const utterance=this.utterance=new SpeechSynthesisUtterance(pack.subtitle);utterance.voice=voice;utterance.lang=voice.lang;utterance.onend=()=>{if(this.utterance===utterance)this.finish();};utterance.onerror=()=>{if(this.utterance===utterance){this.utterance=null;this.tick();}};speechSynthesis.speak(utterance);}
    }
    this.tick();
  }
  audioFallback(audio) {
    if(!this.active||this.audio!==audio)return;
    this.cleanup();this.elapsed=0;this.startedAt=this.now();this.tick();
  }
  tick() {
    if (!this.active) return;
    if (!this.utterance && this.progress() >= this.pack.duration) { this.finish(); return; }
    this.timer = this.schedule(() => this.tick(), 50);
  }
  finish() {
    if (!this.active) return;
    this.active = false;
    this.cleanup();
    this.onFinish();
  }
  cleanup() {
    if(this.utterance){this.utterance.onend=this.utterance.onerror=null;this.utterance=null;globalThis.speechSynthesis?.cancel();}
    if (this.timer !== undefined) this.cancel(this.timer);
    if (this.audio) {
      this.audio.onended = this.audio.onloadedmetadata = this.audio.onerror = null;
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
