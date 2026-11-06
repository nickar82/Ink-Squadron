/* =========================================================
   INK SQUADRON  —  hand-drawn dice dogfight
   ========================================================= */
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const NAVY = '#1b2a5e', RED = '#e3342c', BLUE = '#2a7fe0', YEL = '#f8d23a', PAPER = '#f3f6fc';
const FONT = '"Comic Sans MS","Chalkboard SE","Marker Felt",Roboto,"Segoe UI","Noto Sans CJK SC","Noto Sans SC","PingFang SC","Hiragino Sans","Microsoft YaHei","Noto Sans JP",system-ui,sans-serif';
let W = 720, H = 1280, SC = 1, OX = 0, DPR = 1, TS = 1; // TS = time scale (debug)
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3), easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function h1(i) { let x = Math.imul(i | 0, 0x27d4eb2d) ^ 0x9e3779b9; x = Math.imul(x ^ (x >>> 15), 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296 * 2 - 1; }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------------- save data ---------------- */
const SAVE_KEY = 'inkSquadron.v1', MAXLV = 100;
let save = { unlocked: 1, best: {}, stars: {}, lang: null, ach: {}, stats: {}, hi: {}, settings: { sound: true, vib: true, shake: true, theme: 'auto' }, vs: { ships: 3, len: 1, pw: true, rt: false, clock: 0 }, ta: { dur: 120 } };
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (s) save = Object.assign({}, save, s, { settings: Object.assign({}, save.settings, s.settings || {}), vs: Object.assign({}, save.vs, s.vs || {}), ta: Object.assign({}, save.ta, s.ta || {}), ach: s.ach || {}, stats: s.stats || {}, hi: s.hi || {} });
} catch (e) { }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
const totalScore = () => Object.values(save.best).reduce((a, b) => a + b, 0);
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);

/* ---------------- audio (synthesised) ---------------- */
let AC = null, NB = null, master = null;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = .7; master.connect(AC.destination);
    const len = AC.sampleRate; NB = AC.createBuffer(1, len, AC.sampleRate);
    const d = NB.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
const sndOn = () => AC && save.settings.sound;
function tone(f, dur, type = 'sine', vol = .2, f2 = null, delay = 0) {
  if (!sndOn()) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
}
function noise(dur, vol = .2, ft = 'lowpass', f = 1000, f2 = null, q = 1, delay = 0) {
  if (!sndOn()) return; const t = AC.currentTime + delay;
  const s = AC.createBufferSource(); s.buffer = NB; s.loop = true;
  const fl = AC.createBiquadFilter(); fl.type = ft; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q;
  const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t, Math.random() * .5); s.stop(t + dur + .05);
}
const sfx = {
  click() { tone(520, .07, 'triangle', .18, 780); },
  scribble(d) { if (!sndOn()) return; const n = Math.max(2, Math.round(d / .07)); for (let i = 0; i < n; i++) noise(.06, .09 + Math.random() * .05, 'bandpass', 2400 + Math.random() * 2600, null, 1.5, i * .07); },
  dice() { for (let i = 0; i < 6; i++) noise(.035, .28, 'highpass', 2500, null, 1, i * .085 + Math.random() * .03); },
  land() { noise(.05, .3, 'bandpass', 1800, null, 2); },
  boom(big) { noise(big ? 1.1 : .55, big ? .9 : .55, 'lowpass', big ? 1300 : 1900, 60, 1); tone(big ? 110 : 160, big ? .8 : .45, 'sine', .6, 30); },
  clash() { tone(1400, .18, 'square', .08, 200); noise(.25, .35, 'highpass', 3000); tone(700, .2, 'sawtooth', .06, 1600, .03); },
  shield() { tone(300, .35, 'sine', .25, 900); tone(450, .35, 'triangle', .1, 1300, .05); },
  pop() { tone(900, .12, 'square', .08, 200); noise(.15, .3, 'bandpass', 1500); },
  zap() { for (let i = 0; i < 4; i++) tone(200 + Math.random() * 900, .08, 'sawtooth', .08, 2000, i * .05); noise(.3, .3, 'highpass', 4000); },
  rocket() { noise(.7, .35, 'bandpass', 500, 3000, 2); tone(180, .6, 'sawtooth', .05, 700); },
  move() { noise(.3, .22, 'bandpass', 700, 2200, 1.5); },
  miss() { tone(420, .25, 'triangle', .12, 140); },
  dent() { tone(220, .12, 'square', .12, 110); noise(.12, .3, 'bandpass', 2200); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'triangle', .2, null, i * .12)); tone(1047, .7, 'triangle', .15, null, .5); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, .35, 'triangle', .18, null, i * .18)); },
  turn() { tone(660, .08, 'sine', .1, 990); },
  star(i) { tone(700 + i * 180, .18, 'triangle', .18, 1400 + i * 200); }
};
function vib(ms) {
  if (!save.settings.vib) return;
  try { if (window.AndroidBridge && AndroidBridge.vibrate) AndroidBridge.vibrate(ms | 0); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { }
}

/* ---------------- canvas & paper ---------------- */
let bgCanvas = null;
function resize() {
  const cw = window.innerWidth, ch = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
  SC = cw / 720; H = ch / SC; OX = 0;
  if (H < 1060) { SC = ch / 1060; H = 1060; OX = (cw - 720 * SC) / 2; }
  W = 720; buildBg();
}
function cloudPath(b, x, y, s, flip) {
  b.save(); b.translate(x, y); b.scale(flip ? -s : s, s);
  b.beginPath(); b.moveTo(-100, 22);
  b.arc(-66, 4, 30, Math.PI * .95, Math.PI * 1.75);
  b.arc(-18, -16, 40, Math.PI * 1.15, Math.PI * 1.85);
  b.arc(36, -2, 30, Math.PI * 1.25, Math.PI * 1.95);
  b.arc(78, 12, 20, Math.PI * 1.3, Math.PI * .15);
  b.lineTo(-100, 22); b.closePath(); b.restore();
}
function cloud(b, x, y, s, flip) {
  b.save(); cloudPath(b, x, y, s, flip); b.fillStyle = 'rgba(243,246,252,0.85)'; b.fill();
  b.save(); b.clip(); b.strokeStyle = 'rgba(40,90,200,0.22)'; b.lineWidth = 1.6;
  for (let i = -160; i < 160; i += 7) { b.beginPath(); b.moveTo(x + i * s, y + 24 * s); b.lineTo(x + (i + 26) * s, y - 4 * s); b.stroke(); }
  b.restore();
  b.strokeStyle = 'rgba(40,90,200,0.6)'; b.lineWidth = 2.4; b.lineJoin = 'round'; b.stroke(); b.restore();
}
function buildBg() {
  bgCanvas = document.createElement('canvas'); const k = SC * DPR;
  bgCanvas.width = Math.ceil(W * k); bgCanvas.height = Math.ceil(H * k);
  const b = bgCanvas.getContext('2d'); b.setTransform(k, 0, 0, k, 0, 0);
  b.fillStyle = PAPER; b.fillRect(0, 0, W, H);
  const r = mulberry(42); b.lineCap = 'round';
  for (let i = 0; i < 3200; i++) {
    const x = r() * W, y = r() * H;
    const ex = Math.min(x, W - x) / W, ey = Math.min(y, H - y) / H;
    const e = Math.min(ex * 2.0, ey * 3.4);
    const p = Math.pow(1 - clamp(e * 3.0, 0, 1), 2.4);
    if (r() > p) continue;
    const L = 10 + r() * 28; b.strokeStyle = `rgba(40,90,200,${.10 + r() * .2})`; b.lineWidth = 1 + r() * 1.8;
    b.beginPath(); b.moveTo(x, y); b.lineTo(x + L * .8, y - L * .6); b.stroke();
  }
  cloud(b, -10, H * .30, .85); cloud(b, W + 15, H * .40, .9, true); cloud(b, -20, H * .66, .8);
  cloud(b, W + 5, H * .74, .85, true);
  if (typeof seasonBg === 'function') seasonBg(b);
}
function drawPaper() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(SC * DPR, 0, 0, SC * DPR, OX * DPR, 0);
  if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, W, H);
}
function drawGrid(step, ox, oy) {
  ctx.save(); ctx.strokeStyle = (typeof SEASON !== 'undefined' && SEASON.grid) || 'rgba(45,95,200,0.34)'; ctx.lineWidth = .6;
  ctx.beginPath();
  for (let x = ((ox % step) + step) % step; x <= W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = ((oy % step) + step) % step; y <= H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke(); ctx.restore();
}

/* ---------------- drawing primitives ---------------- */
function txt(s, x, y, size, o = {}) {
  ctx.save(); s = String(s);
  ctx.font = `${o.italic === false ? '' : 'italic '}${o.weight || 900} ${size}px ${FONT}`;
  if (o.max) { const w = ctx.measureText(s).width; if (w > o.max) { size *= o.max / w; ctx.font = `${o.italic === false ? '' : 'italic '}${o.weight || 900} ${size}px ${FONT}`; } }
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.sw || 6; ctx.strokeStyle = o.stroke; ctx.strokeText(s, 0, 0); }
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(s, 3, 3); }
  ctx.fillStyle = o.color || NAVY; ctx.fillText(s, 0, 0); ctx.restore();
}
function rrPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function sketchBox(x, y, w, h, o = {}) {
  const r = o.r ?? 18, seed = o.seed || 7;
  ctx.save();
  if (o.shadow !== false) { rrPath(ctx, x + 3, y + 5, w, h, r); ctx.fillStyle = 'rgba(27,42,94,0.18)'; ctx.fill(); }
  rrPath(ctx, x, y, w, h, r); ctx.fillStyle = o.fill || '#fbfdff'; ctx.fill();
  if (o.hatch) {
    ctx.save(); rrPath(ctx, x, y, w, h, r); ctx.clip(); ctx.strokeStyle = o.hatch; ctx.lineWidth = 2.2;
    for (let i = -h; i < w; i += 9) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h * .7, y); ctx.stroke(); }
    ctx.restore();
  }
  ctx.strokeStyle = o.stroke || NAVY; ctx.lineWidth = o.lw || 4; ctx.lineJoin = 'round';
  rrPath(ctx, x, y, w, h, r); ctx.stroke();
  ctx.globalAlpha = .5; ctx.lineWidth = (o.lw || 4) * .5;
  rrPath(ctx, x + h1(seed) * 2, y + h1(seed + 1) * 2, w + h1(seed + 2) * 2, h + h1(seed + 3) * 1.5, r); ctx.stroke();
  ctx.restore();
}
function inkPath(x1, y1, x2, y2, seed, jit) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < .5) return null;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux, step = 7, n = Math.floor(len / step), pts = [];
  for (let i = 0; i <= n; i++) { const d = i * step, o = h1(seed * 977 + i) * jit * (i === 0 ? .2 : 1); pts.push(x1 + ux * d + nx * o, y1 + uy * d + ny * o); }
  const oe = h1(seed * 977 + n + 1) * jit * .5; pts.push(x2 + nx * oe, y2 + ny * oe); return pts;
}
function strokePts(p) {
  ctx.beginPath(); ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length - 2; i += 2) { ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2); }
  ctx.lineTo(p[p.length - 2], p[p.length - 1]); ctx.stroke();
}
function inkLine(x1, y1, x2, y2, color, w, seed, o = {}) {
  const p = inkPath(x1, y1, x2, y2, seed, o.jit ?? Math.max(1, w * .32)); if (!p) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color;
  const a = o.alpha ?? 1; ctx.globalAlpha = a; ctx.lineWidth = w; if (o.dash) ctx.setLineDash(o.dash); strokePts(p);
  if (!o.dash) { ctx.globalAlpha = a * .35; ctx.lineWidth = w * .45; const p2 = inkPath(x1 + 1.2, y1, x2 + 1.2, y2, seed + 5, w * .5); if (p2) strokePts(p2); }
  ctx.restore();
}
function burst(x, y, r, spikes, rot, fill, stroke, lw) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) { const a = i / (spikes * 2) * Math.PI * 2, rr = i % 2 ? r * (.45 + .1 * h1(i * 31 + spikes)) : r * (.9 + .12 * h1(i * 17)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.lineJoin = 'round'; ctx.stroke(); } ctx.restore();
}
function star(x, y, r, filled, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = filled ? YEL : '#e9eef8'; ctx.fill();
  const sp = new Path2D(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; sp.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } sp.closePath();
  if (filled) { ctx.save(); ctx.clip(sp); ctx.fillStyle = '#ffe98a'; ctx.beginPath(); ctx.arc(-r * .3, -r * .4, r * .5, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.beginPath(); ctx.strokeStyle = NAVY; ctx.lineWidth = o.lw || Math.max(2, r * .14); ctx.lineJoin = 'round'; ctx.stroke(sp); ctx.restore();
}

/* ---- icons ---- */
function iconRocket(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.lineJoin = 'round'; const lw = Math.max(2, s * .06);
  ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.moveTo(-s * .13, s * .38); ctx.lineTo(0, s * .62); ctx.lineTo(s * .13, s * .38); ctx.fill();
  ctx.fillStyle = RED; ctx.strokeStyle = NAVY; ctx.lineWidth = lw;
  for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * s * .12, s * .1); ctx.lineTo(k * s * .3, s * .38); ctx.lineTo(k * s * .12, s * .34); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -s * .5); ctx.quadraticCurveTo(s * .17, -s * .3, s * .14, s * .38); ctx.lineTo(-s * .14, s * .38); ctx.quadraticCurveTo(-s * .17, -s * .3, 0, -s * .5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(0, -s * .5); ctx.quadraticCurveTo(s * .12, -s * .38, s * .15, -s * .22); ctx.lineTo(-s * .15, -s * .22); ctx.quadraticCurveTo(-s * .12, -s * .38, 0, -s * .5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(0, -s * .05, s * .07, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function iconShield(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, -s * .48);
  ctx.quadraticCurveTo(s * .22, -s * .36, s * .4, -s * .38); ctx.quadraticCurveTo(s * .42, s * .2, 0, s * .5);
  ctx.quadraticCurveTo(-s * .42, s * .2, -s * .4, -s * .38); ctx.quadraticCurveTo(-s * .22, -s * .36, 0, -s * .48); ctx.closePath();
  ctx.fillStyle = col || '#3d8ef0'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-s, -s, s, s * 2); ctx.restore();
  ctx.strokeStyle = NAVY; ctx.lineWidth = Math.max(2, s * .06); ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function iconBolt(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  const P = [[.1, -.5], [-.28, .06], [-.02, .06], [-.12, .5], [.3, -.1], [.04, -.1], [.18, -.5]];
  P.forEach((p, i) => i ? ctx.lineTo(p[0] * s, p[1] * s) : ctx.moveTo(p[0] * s, p[1] * s)); ctx.closePath();
  ctx.fillStyle = YEL; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = Math.max(2, s * .06); ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function iconMove(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = NAVY; ctx.fillStyle = '#9cc6ff'; ctx.lineWidth = Math.max(2, s * .06); ctx.lineJoin = 'round';
  ctx.beginPath(); const a = s * .45, b = s * .2, c = s * .1;
  ctx.moveTo(-a, 0); ctx.lineTo(-b, -s * .22); ctx.lineTo(-b, -c); ctx.lineTo(b, -c); ctx.lineTo(b, -s * .22); ctx.lineTo(a, 0); ctx.lineTo(b, s * .22); ctx.lineTo(b, c); ctx.lineTo(-b, c); ctx.lineTo(-b, s * .22); ctx.closePath();
  ctx.fill(); ctx.stroke(); ctx.restore();
}
function iconPause(x, y, s) { ctx.save(); ctx.fillStyle = NAVY; rrPath(ctx, x - s * .28, y - s * .32, s * .2, s * .64, 4); ctx.fill(); rrPath(ctx, x + s * .08, y - s * .32, s * .2, s * .64, 4); ctx.fill(); ctx.restore(); }
function iconPlay(x, y, s) { ctx.save(); ctx.beginPath(); ctx.moveTo(x - s * .3, y - s * .4); ctx.lineTo(x + s * .42, y); ctx.lineTo(x - s * .3, y + s * .4); ctx.closePath(); ctx.fillStyle = '#2f7ff0'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - s, y - s, s * 2, s * .9); ctx.restore(); ctx.strokeStyle = NAVY; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
function iconBars(x, y, s) { ctx.save(); ctx.strokeStyle = NAVY; ctx.fillStyle = '#cfe0ff'; ctx.lineWidth = 3; [[-.3, .2], [-.05, .45], [.2, .3]].forEach(([dx, h]) => { ctx.beginPath(); ctx.rect(x + dx * s, y + s * .32 - h * s * 1.2, s * .2, h * s * 1.2); ctx.fill(); ctx.stroke(); }); ctx.restore(); }
function iconGear(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = (i % 2 ? .3 : .42) * s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath(); ctx.fillStyle = '#cfe0ff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, s * .13, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.restore();
}
function iconInfo(x, y, s) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, s * .42, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore(); txt('i', x, y + 2, s * .55, { italic: false }); }
function iconVs(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  for (const k of [-1, 1]) { ctx.save(); ctx.rotate(k * Math.PI / 4); ctx.strokeStyle = NAVY; ctx.lineWidth = s * .13; ctx.beginPath(); ctx.moveTo(0, -s * .45); ctx.lineTo(0, s * .3); ctx.stroke(); ctx.strokeStyle = k < 0 ? RED : BLUE; ctx.lineWidth = s * .07; ctx.beginPath(); ctx.moveTo(0, -s * .42); ctx.lineTo(0, s * .15); ctx.stroke(); ctx.strokeStyle = NAVY; ctx.lineWidth = s * .09; ctx.beginPath(); ctx.moveTo(-s * .15, s * .2); ctx.lineTo(s * .15, s * .2); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
function iconLock(x, y, s) {
  ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - s * .12, s * .18, Math.PI, 0); ctx.stroke();
  rrPath(ctx, x - s * .26, y - s * .12, s * .52, s * .4, 5); ctx.fillStyle = '#c9d4ea'; ctx.fill(); ctx.stroke(); ctx.restore();
}
function iconBack(x, y, s) { ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x + s * .2, y - s * .3); ctx.lineTo(x - s * .15, y); ctx.lineTo(x + s * .2, y + s * .3); ctx.stroke(); ctx.restore(); }
function drawDie(x, y, s, v, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.globalAlpha = o.alpha ?? 1;
  rrPath(ctx, -s / 2 + 3, -s / 2 + 5, s, s, s * .2); ctx.fillStyle = 'rgba(27,42,94,.22)'; ctx.fill();
  rrPath(ctx, -s / 2, -s / 2, s, s, s * .2); ctx.fillStyle = o.color || '#e23a32'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-s / 2, -s / 2, s, s * .35); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-s / 2, s * .25, s, s * .3); ctx.restore();
  rrPath(ctx, -s / 2, -s / 2, s, s, s * .2); ctx.strokeStyle = NAVY; ctx.lineWidth = Math.max(2, s * .055); ctx.stroke();
  const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  ctx.fillStyle = '#fff'; for (const [a, b] of (P[v] || [])) { ctx.beginPath(); ctx.arc(a * s * .26, b * s * .26, s * .09, 0, 7); ctx.fill(); }
  if (o.used) { ctx.globalAlpha = .9; inkLine(-s * .45, -s * .45, s * .45, s * .45, NAVY, 4, 3); }
  ctx.restore();
}

/* ---------------- immediate-mode UI ---------------- */
let hits = [], pressed = null, pointer = { x: 0, y: 0, down: false };
function ui(id, x, y, w, h, o, draw, onTap) {
  const pr = pressed && pressed.id === id && pressed.inside && !o.disabled;
  const s = pr ? .94 : 1;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s); ctx.translate(-(x + w / 2), -(y + h / 2));
  if (o.disabled) ctx.globalAlpha = .45; draw(x, y, w, h, pr); ctx.restore();
  hits.push({ id, x, y, w, h, rot: !!o.rot, disabled: !!o.disabled, onTap, silent: o.silent });
}
function bigButton(id, x, y, w, h, label, o, onTap) {
  ui(id, x, y, w, h, o, (x, y, w, h) => {
    sketchBox(x, y, w, h, { fill: o.fill || '#f8faff', hatch: o.hatch, r: h * .28, lw: o.primary ? 5 : 4, seed: id.length * 7 });
    const ic = o.icon; const fs = o.fs || h * .4;
    if (ic) ic(x + h * .62, y + h / 2, h * .62);
    txt(label, x + w / 2 + (ic ? h * .25 : 0), y + h / 2 + 2, fs, { color: NAVY, max: w - (ic ? h * 1.3 : 30) });
  }, onTap);
}
function hitInside(h, p) { const q = h.rot ? { x: W - p.x, y: H - p.y } : p; return q.x >= h.x && q.x <= h.x + h.w && q.y >= h.y && q.y <= h.y + h.h; }
function hitTest(p) { for (let i = hits.length - 1; i >= 0; i--) if (hitInside(hits[i], p)) return hits[i]; return null; }
function toLocal(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - OX) / SC, y: (e.clientY - r.top) / SC }; }
let activePointer = null;
cv.addEventListener('pointerdown', e => {
  audioInit(); const p = toLocal(e);
  const multi = scene && scene.multi && !overlayBlocks();
  if (activePointer === null) {
    const h = hitTest(p);
    if (h || overlayBlocks()) { activePointer = e.pointerId; pointer = { x: p.x, y: p.y, down: true }; if (h) pressed = { id: h.id, inside: true, h }; return; }
  }
  if (multi) { scene.pdown && scene.pdown(e.pointerId, p); return; }
  if (activePointer !== null) return; activePointer = e.pointerId; pointer = { x: p.x, y: p.y, down: true };
  scene.down && scene.down(p);
});
cv.addEventListener('pointermove', e => {
  const p = toLocal(e);
  if (e.pointerId === activePointer) { pointer.x = p.x; pointer.y = p.y; if (pressed) { pressed.inside = hitInside(pressed.h, p); return; } if (!(scene && scene.multi)) { scene.move && scene.move(p); return; } }
  if (scene && scene.multi) scene.pmove && scene.pmove(e.pointerId, p);
});
function pUp(e, cancel) {
  const p = toLocal(e);
  if (e.pointerId === activePointer) {
    activePointer = null; pointer.down = false;
    if (pressed) { const h = pressed.h; const ok = pressed.inside && !cancel && !h.disabled; pressed = null; if (ok) { if (!h.silent) sfx.click(); vib(8); h.onTap && h.onTap(); } return; }
    if (!(scene && scene.multi)) { scene.up && scene.up(p, cancel); return; }
  }
  if (scene && scene.multi) scene.pup && scene.pup(e.pointerId, p, cancel);
}
cv.addEventListener('pointerup', e => pUp(e, false));
cv.addEventListener('pointercancel', e => pUp(e, true));
window.addEventListener('resize', resize);
window.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Backspace') window.inkBack(); });

/* ---------------- timers / effects ---------------- */
let timers = [];
const wait = ms => new Promise(r => timers.push({ t: 0, d: ms / 1000, done: r }));
const tween = (ms, fn) => new Promise(r => timers.push({ t: 0, d: ms / 1000, fn, done: r }));
let parts = [], floats = [], shakeA = 0;
function shake(a) { if (save.settings.shake) shakeA = Math.max(shakeA, a); }
function addFloat(x, y, text, color, size = 40, rot = 0) { floats.push({ x, y, text, color, t: 0, life: 1.1, size, rot }); }
function spawnBurst(x, y, n, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), sp = rnd(o.min || 80, o.max || 380);
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(.4, o.life || .9), t: 0, type: o.type || 'spark', color: o.colors ? o.colors[i % o.colors.length] : (o.color || '#ffb020'), size: rnd(o.smin || 3, o.smax || 8), rot: rnd(0, 6), vr: rnd(-8, 8), g: o.g ?? 300 });
  }
}
function explosion(x, y, r, big, color) {
  color = color || NAVY;
  if (typeof SPRITES !== 'undefined' && SPRITES.ready) {
    parts.push({ x, y, type: 'splat', sheet: 'splat' + (1 + (Math.random() * 3 | 0)), color, t: 0, life: big ? 1.0 : .55, size: r * (big ? 2.2 : 1.9), rot: rnd(0, 6.28), flip: Math.random() < .5, vx: 0, vy: 0, g: 0, small: !big });
  } else parts.push({ x, y, type: 'boom', t: 0, life: big ? .7 : .45, size: r, rot: rnd(0, 1), vx: 0, vy: 0, g: 0 });
  spawnBurst(x, y, big ? 18 : 8, { type: 'ink', colors: [color], min: 120, max: big ? 520 : 300, smin: 2, smax: big ? 6 : 4, g: 0, life: big ? .6 : .4 });
  if (big) spawnBurst(x, y, 10, { type: 'debris', colors: ['#fff'], max: 420, smin: 6, smax: 13, life: 1.2, g: 600 });
  spawnBurst(x, y, big ? 8 : 3, { type: 'smoke', colors: ['rgba(60,70,100,0.25)'], min: 20, max: 90, smin: 14, smax: 30, life: 1.1, g: -40 });
}
function updateFx(dt) {
  for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= .985; p.rot += (p.vr || 0) * dt; }
  parts = parts.filter(p => p.t < p.life);
  for (const f of floats) f.t += dt; floats = floats.filter(f => f.t < f.life);
  shakeA *= Math.pow(.02, dt); if (shakeA < .3) shakeA = 0;
}
function drawFx() {
  for (const p of parts) {
    const k = p.t / p.life;
    ctx.save(); ctx.globalAlpha = 1 - k * k;
    if (p.type === 'splat') {
      const fr = Math.min(5, Math.floor(p.t / (p.small ? .045 : .055))), end = p.small ? 3 : 5;
      ctx.globalAlpha = p.t > p.life * .6 ? 1 - (p.t - p.life * .6) / (p.life * .4) : 1;
      drawSprite(p.sheet, Math.min(fr, end), p.x, p.y, p.size, p.color, 1, p.rot, p.flip);
    } else if (p.type === 'boom') {
      const r = p.size * (.4 + easeOut(Math.min(1, k * 2.2)) * .8);
      ctx.globalAlpha = 1 - Math.max(0, k - .5) * 2;
      burst(p.x, p.y, r * 1.15, 12, p.rot, '#ff7a1f', NAVY, 3);
      burst(p.x, p.y, r * .85, 10, p.rot + .3, '#ffd23a', null);
      burst(p.x, p.y, r * .45, 8, p.rot + .6, '#fff6c0', null);
    } else if (p.type === 'smoke') {
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + k), 0, 7); ctx.fill();
    } else if (p.type === 'debris') {
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = '#fff'; ctx.strokeStyle = NAVY; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-p.size, -p.size * .4); ctx.lineTo(p.size, 0); ctx.lineTo(-p.size * .4, p.size * .6); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (p.type === 'confetti') {
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size * .4, p.size * 2, p.size * .8);
    } else if (p.type === 'ink') {
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - k * .5), 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = p.color; ctx.lineWidth = p.size * .6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); ctx.stroke();
    }
    ctx.restore();
  }
  for (const f of floats) {
    const k = f.t / f.life, s = k < .2 ? easeBack(k / .2) : 1;
    txt(f.text, f.x, f.y - k * 50, f.size * s, { color: f.color, stroke: '#fff', sw: 7, alpha: 1 - Math.max(0, k - .7) / .3, rot: f.rot });
  }
}

