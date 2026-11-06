/* =========================================================
   MUSIC — C64 / SID-style synthwave, generated live with WebAudio
   pulse-wave arpeggios · octave bass · vibrato lead · drum machine · saw pad
   ========================================================= */
const Music = { gain: null, waves: {}, track: null, want: 'menu', step: 0, next: 0, timer: null, bar: 0 };
const TRACKS = {
  menu: {
    bpm: 100, swing: 0,
    prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], roots: [45, 41, 36, 43],
    lead: [{ 0: 76, 4: 74, 6: 72, 8: 74, 12: 69 }, { 0: 72, 4: 74, 6: 76, 8: 77, 12: 76 }, { 0: 79, 4: 76, 8: 72, 10: 74, 12: 76 }, { 0: 74, 4: 71, 8: 74, 12: 79, 14: 78 }],
    kick: [0, 8], snare: [4, 12], hat: 2, leadLen: 3
  },
  cruise: {
    bpm: 108, swing: 0,
    prog: [[57, 60, 64], [52, 55, 59], [53, 57, 60], [55, 59, 62]], roots: [45, 40, 41, 43],
    lead: [{ 0: 69, 3: 72, 6: 76, 8: 74, 11: 72, 14: 71 }, { 0: 71, 3: 72, 6: 74, 8: 76, 12: 79 }, { 0: 77, 3: 76, 6: 72, 8: 69, 12: 72 }, { 0: 74, 4: 79, 8: 78, 12: 74 }],
    kick: [0, 6, 8], snare: [4, 12], hat: 2, leadLen: 2
  },
  battle: {
    bpm: 132, swing: 0,
    prog: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]], roots: [45, 43, 41, 40],
    lead: [{ 0: 69, 2: 72, 4: 76, 6: 72, 8: 81, 10: 79, 12: 76, 14: 72 }, { 0: 74, 2: 71, 4: 67, 8: 74, 10: 76, 12: 79 }, { 0: 77, 2: 76, 4: 72, 6: 69, 8: 72, 12: 77, 14: 76 }, { 0: 76, 4: 80, 8: 83, 12: 80 }],
    kick: [0, 4, 8, 12], snare: [4, 12], hat: 1, leadLen: 2
  }
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function pulseWave(duty) {
  const n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return AC.createPeriodicWave(re, im);
}
function musicInit() {
  if (!AC || Music.gain) return;
  Music.gain = AC.createGain(); Music.gain.gain.value = 0; Music.gain.connect(AC.destination);
  Music.waves = { p12: pulseWave(.125), p25: pulseWave(.25), p50: pulseWave(.5) };
  Music.next = AC.currentTime + .1;
  Music.timer = setInterval(musicTick, 25);
}
const musicOn = () => AC && save.settings.music !== false;
function voice(t, freq, dur, wave, vol, o = {}) {
  const osc = AC.createOscillator(), g = AC.createGain();
  if (typeof wave === 'string' && Music.waves[wave]) osc.setPeriodicWave(Music.waves[wave]); else osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
  if (o.vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.5; lg.gain.value = freq * .012; l.connect(lg); lg.connect(osc.frequency); l.start(t + .08); l.stop(t + dur + .05); }
  let node = osc;
  if (o.lp) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t); if (o.lpEnd) f.frequency.exponentialRampToValueAtTime(o.lpEnd, t + dur); f.Q.value = o.q || 4; osc.connect(f); node = f; }
  const a = o.attack || .004;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + Math.max(a, dur * (o.hold || .5))); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  node.connect(g); g.connect(Music.gain); osc.start(t); osc.stop(t + dur + .05);
}
function drumNoise(t, dur, vol, type, f, q) {
  const s = AC.createBufferSource(); s.buffer = NB; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1;
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(Music.gain); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
}
function musicStep(T, step, t, spb) {
  const bar = Math.floor(step / 16) % 4, s = step % 16, section = Math.floor(step / 64) % 4, chord = T.prog[bar], root = T.roots[bar];
  const dur16 = spb / 4;
  // pad at bar start
  if (s === 0) chord.forEach(n => voice(t, mtof(n), spb * 4, 'sawtooth', .018, { lp: 900, lpEnd: 1600, attack: .3, hold: .85, q: 1 }));
  // octave bass (8ths)
  if (s % 2 === 0) voice(t, mtof(root - 12 + (s % 4 === 2 ? 12 : 0)), dur16 * 1.7, 'p50', .09, { lp: 700, lpEnd: 220, q: 6 });
  // C64 arpeggio (fast chord cycling)
  if (section !== 0 || s % 2 === 0) { const n = chord[step % 3] + 12; voice(t, mtof(n), dur16 * .9, 'p25', .028, { lp: 3200 }); }
  // lead (skips every 4th section for breathing room)
  if (section !== 3) { const m = T.lead[bar][s]; if (m) voice(t, mtof(m + (section === 2 ? 12 : 0)) * (section === 2 ? .5 : 1), dur16 * T.leadLen * 1.6, 'p12', .05, { vib: true, lp: 4200, hold: .7 }); }
  // drums
  if (T.kick.includes(s)) voice(t, 150, .22, 'sine', .32, { slide: 40, hold: .1 });
  if (T.snare.includes(s)) { drumNoise(t, .16, .16, 'bandpass', 1900, .8); voice(t, 190, .1, 'triangle', .08, { slide: 120, hold: .1 }); }
  if (s % T.hat === 0) drumNoise(t, s % 4 === 2 ? .07 : .03, .045, 'highpass', 7500);
  if (s === 15 && bar === 3) drumNoise(t, .3, .08, 'bandpass', 3500, .5);
}
function musicTick() {
  if (!AC || !Music.gain) return;
  const on = musicOn() && AC.state === 'running';
  const target = on ? (Music.duck ? .3 : .8) : 0;
  Music.gain.gain.setTargetAtTime(target, AC.currentTime, .15);
  if (!on) { Music.next = AC.currentTime + .05; return; }
  if (Music.track !== Music.want) { Music.track = Music.want; Music.step = 0; Music.next = Math.max(Music.next, AC.currentTime + .05); }
  const T = TRACKS[Music.track], spb = 60 / T.bpm;
  while (Music.next < AC.currentTime + .15) {
    musicStep(T, Music.step, Music.next, spb);
    Music.next += spb / 4; Music.step = (Music.step + 1) % 256;
  }
}
/* called every frame: pick the track for the current screen */
function musicUpdate() {
  if (AC && !Music.gain) musicInit();
  Music.want = scene === SCENES.arena ? 'battle' : scene === SCENES.game ? 'cruise' : 'menu';
  Music.duck = !!(M && (M.paused || M.result) && (scene === SCENES.game || scene === SCENES.arena));
}
