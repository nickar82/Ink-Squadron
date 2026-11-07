/* =========================================================
   GET READY intro — a gloved hand draws the battlefield
   from the top-left corner to the bottom-right one while
   the kid's card says GET READY. The match waits for it.
   ========================================================= */
const Intro = {
  on: false, t: 0, cb: null, label: '', seed: 1,
  DRAW: 1.55, OUT: .35,
  start(label, cb) {
    this.on = true; this.fired = false; this.t = 0; this.cb = cb; this.label = label; this.seed = (Math.random() * 1e4) | 0; this.lastScr = 0;
    sfx.turn();
  },
  update(dt) {
    if (!this.on) return;
    this.t += dt;
    if (this.t > this.DRAW && !this.fired) { this.fired = true; const f = this.cb; this.cb = null; try { f && f(); } catch (e) { console.error(e); } }
    if (this.t > this.DRAW + this.OUT) { this.on = false; this.fired = false; }
    // scratchy pen noise while drawing
    if (this.t < this.DRAW && this.t - this.lastScr > .11) { this.lastScr = this.t; if (save.settings.sound) scribbleSfx(); }
  },
  skip() { if (this.on && this.t < this.DRAW) this.t = this.DRAW; }
};
function scribbleSfx() {
  try {
    if (!sndOn() || !NB) return; const a = AC;
    const n = a.createBufferSource(); n.buffer = NB; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400 + Math.random() * 1600; f.Q.value = 1.4;
    const g = a.createGain(); g.gain.setValueAtTime(.06, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .07); n.connect(f); f.connect(g); g.connect(master); n.start(a.currentTime, Math.random() * .8, .08);
  } catch (e) { }
}
function introLabel() {
  if (!M) return '';
  if (M.rt === 'arcade') return t('arcade');
  if (M.rt === 'timeattack') return t('time_attack');
  if (M.rt === 'rtvs' || M.mode === 'versus') return M.sides[0].name + '  ⚔  ' + M.sides[1].name;
  return t('level_n', M.level);
}
function drawIntro() {
  if (!Intro.on) return;
  const T = Intro.t, k = clamp(T / Intro.DRAW, 0, 1), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const D = e * (W + H) * 1.04 - 20, r = mulberry(Intro.seed);
  // 1) blank paper over everything that is not drawn yet
  if (k < 1) {
    const pts = []; const n = 34;
    for (let i = 0; i <= n; i++) { const u = i / n, j = (r() - .5) * 18; pts.push([D * u + j, D * (1 - u) + j]); }
    ctx.save(); ctx.beginPath(); ctx.moveTo(-400, pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(pts[n][0], -400); ctx.lineTo(W + 400, -400); ctx.lineTo(W + 400, H + 400); ctx.lineTo(-400, H + 400); ctx.closePath();
    ctx.clip(); ctx.fillStyle = PAPER; ctx.fillRect(-400, -40, W + 800, H + 80); if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, W, H);
    ctx.restore();
    // wet-ink edge
    ctx.save(); ctx.strokeStyle = 'rgba(27,42,94,.35)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
    // 2) the hand, scribbling back and forth along the edge
    const im = MASCOT.img.hand;
    if (im && im.complete && im.width) {
      const u = clamp(.5 + Math.sin(T * 11) * .22 + Math.sin(T * 3.1) * .1, .05, .95);
      let tx = D * u, ty = D * (1 - u);
      // keep the pen on screen
      if (tx > W - 40) { tx = W - 40; ty = D - tx; } if (ty > H - 40) { ty = H - 40; tx = D - ty; }
      const hw = 320, hh = hw * im.height / im.width;
      ctx.drawImage(im, tx - hw * .144, ty - hh * .786 + Math.sin(T * 22) * 3, hw, hh);
    }
  }
  // 3) the GET READY card
  const outK = clamp((T - Intro.DRAW) / Intro.OUT, 0, 1), inK = clamp(T / .32, 0, 1);
  const cw = 600, ch = 300, cx = (W - cw) / 2 + 30, cy = H * .39;
  ctx.save(); ctx.globalAlpha = 1 - outK;
  ctx.translate(W / 2, cy + ch / 2 - outK * 120); const s = easeBack(inK) * (1 + outK * .15); ctx.scale(s, s); ctx.translate(-W / 2, -(cy + ch / 2));
  sketchBox(cx, cy, cw, ch, { r: 38 });
  const boy = MASCOT.img.ready;
  if (boy && boy.width) { const bh = 330, bw = bh * boy.width / boy.height; ctx.drawImage(boy, cx - 70, cy - 120 + Math.sin(T * 5) * 4, bw, bh); }
  const tx = cx + cw / 2 + 95;
  txt(Intro.label, tx, cy + 62, 32, { max: 360 });
  txt(t('gr_title'), tx, cy + 128, 62, { color: RED, stroke: '#fff', sw: 10, rot: -.04, max: 380 });
  inkLine(tx - 170, cy + 178, tx + 170, cy + 171, RED, 6, 77);
  txt(t('gr_sub'), tx, cy + 214, 22, { color: '#4a5a88', weight: 700, max: 370 });
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(tx - 40 + i * 40, cy + 254, 9, 0, 7); ctx.fillStyle = k * 3 > i + .3 ? NAVY : '#cdd4e4'; ctx.fill(); }
  ctx.restore();
}
