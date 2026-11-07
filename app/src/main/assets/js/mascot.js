/* =========================================================
   MASCOT — the astronaut kid pops up with short comic messages,
   sits on the result cards, and asks for a rating (rarely)
   ========================================================= */
const Mascot = { cur: null, last: -1e9, turnN: 0 };
const mascotOn = () => save.settings.mascot !== false && typeof MASCOT !== 'undefined' && MASCOT.ready;
function mLine(key, name) {
  const v = t(key).split('|'), s = v[Math.random() * v.length | 0];
  return s.split('{0}').join(name || ((save.names || {}).p1 ? pName(1) : t('pilot')));
}
/* mood: happy | sad | attack | satisfied | surprised | afraid | thumbs; side: which player's corner (0 bottom, 1 top) */
function mascotSay(mood, key, o = {}) {
  if (!mascotOn() || !M) return;
  const now = performance.now(), pr = o.pri || 1;
  if (Mascot.cur && Mascot.cur.pri >= pr && now - Mascot.cur.t0 < 1500) return;
  if (!o.force && now - Mascot.last < (o.gap || 3500) && pr < 3) return;
  const side = o.side || 0;
  Mascot.cur = { mood, text: mLine(key, o.name), t0: now, dur: o.dur || 2.0, side, right: o.right ?? Math.random() < .5, pri: pr, tok: M.token };
  Mascot.last = now;
}
function drawMascotPop(trayTop) {
  const c = Mascot.cur; if (!c || !M || c.tok !== M.token || !mascotOn()) { Mascot.cur = null; return; }
  const e = (performance.now() - c.t0) / 1000; if (e > c.dur + .45) { Mascot.cur = null; return; }
  const im = MASCOT.img[c.mood]; if (!im) return;
  const h = 290, w = h * im.width / im.height, inK = clamp(e / .35, 0, 1), outK = clamp((e - c.dur) / .4, 0, 1);
  const show = (inK < 1 ? easeBack(inK) : 1) * (1 - easeInOut(outK));
  const vs = M.mode === 'versus' || M.rt === 'rtvs', base = trayTop;
  ctx.save();
  if (vs && c.side === 1) { ctx.translate(W, H); ctx.rotate(Math.PI); }
  const x = c.right ? W - w * .78 : -w * .2, y = base - h * .5 * show + 8 * (1 - show);
  ctx.save(); ctx.beginPath(); ctx.rect(-50, 0, W + 100, base + 6); ctx.clip();   // he hides behind the tray
  ctx.globalAlpha = .16; ctx.filter = 'brightness(0)'; ctx.drawImage(im, x + 8, y + 12, w, h); ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.drawImage(im, x, y, w, h); ctx.restore();
  if (show > .6) {
    ctx.globalAlpha = clamp((show - .6) / .4, 0, 1);
    const lines = c.text.split('\n'), fs = 24, bw = 330, bh = lines.length * (fs + 8) + 26;
    const bx = c.right ? x - bw + w * .12 : x + w * .82, by = y + 8;
    const tx = c.right ? bx + bw - 10 : bx + 10, ty = by + bh * .7;
    ctx.fillStyle = 'rgba(27,42,94,.2)'; rrPath(ctx, bx + 5, by + 7, bw, bh, 24); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx, by + bh * .35); ctx.lineTo(c.right ? bx + bw + 26 : bx - 26, ty + 16); ctx.lineTo(tx, by + bh * .75); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
    rrPath(ctx, bx, by, bw, bh, 24); ctx.fill(); ctx.stroke();
    ctx.fillRect(c.right ? bx + bw - 6 : bx + 2, by + bh * .38, 6, bh * .34);
    lines.forEach((l, i) => txt(l, bx + bw / 2, by + 18 + fs / 2 + i * (fs + 8), fs, { max: bw - 24 }));
  }
  ctx.restore();
}
/* mascot sitting on the top-right corner of a result card */
function drawMascotCorner(mood, text, cardTop, t) {
  if (!mascotOn()) return;
  const im = MASCOT.img[mood]; if (!im) return;
  const k = clamp((t - .35) / .4, 0, 1); if (k <= 0) return;
  const h = 230, w = h * im.width / im.height, x = W - w - 40, y = cardTop - h * .62 + (1 - easeBack(k)) * 40;
  ctx.save(); ctx.globalAlpha = k; ctx.drawImage(im, x, y, w, h);
  const lines = text.split('\n'), fs = 24, bw = 300, bh = lines.length * (fs + 8) + 24, bx = x - bw - 14, by = cardTop - bh - 74;
  ctx.fillStyle = 'rgba(27,42,94,.2)'; rrPath(ctx, bx + 5, by + 7, bw, bh, 22); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx + bw - 60, by + bh - 4); ctx.lineTo(x + w * .18, by + bh + 26); ctx.lineTo(bx + bw - 20, by + bh - 4); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
  rrPath(ctx, bx, by, bw, bh, 22); ctx.fill(); ctx.stroke(); ctx.fillRect(bx + bw - 58, by + bh - 6, 36, 6);
  lines.forEach((l, i) => txt(l, bx + bw / 2, by + 16 + fs / 2 + i * (fs + 8), fs, { max: bw - 20 }));
  ctx.restore();
}
/* ---- rate the app (rare, only after a good run) ---- */
const Rate = {
  maybe() {
    const r = save.rate = save.rate || { shown: 0, last: 0, done: false }, st = save.stats;
    if (r.done || r.shown >= 3 || (st.sessions || 0) < 3 || (st.wins || 0) < 1 || Date.now() - r.last < 3 * 864e5 || !M) return;
    M.rate = { t: -1.5 }; r.shown++; r.last = Date.now(); persist();
  },
  rate() { save.rate.done = true; persist(); M.rate = null; const b = Bridge(); try { if (b && b.openStore) b.openStore(); else window.open('https://play.google.com/store/apps/details?id=com.inksquadron.game', '_blank'); } catch (e) { } },
  later() { M.rate = null; },
  never() { save.rate.done = true; persist(); M.rate = null; }
};
function drawRate(dt) {
  const R = M.rate; R.t += dt; if (R.t < 0) return;
  const k = clamp(R.t / .35, 0, 1);
  ui('rate_block', -300, 0, W + 600, H, { silent: true }, () => { }, () => { });
  ctx.save(); ctx.fillStyle = `rgba(243,246,252,${.85 * k})`; ctx.fillRect(-200, 0, W + 400, H); ctx.restore();
  ctx.save(); ctx.translate(W / 2, H / 2); const s = easeBack(k); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
  const w = 560, h = 470, x0 = (W - w) / 2, y0 = H * .4;
  sketchBox(x0, y0, w, h, { r: 36 });
  const im = MASCOT.img.thumbs; if (im) { const ih = 330, iw = ih * im.width / im.height; ctx.drawImage(im, W / 2 - iw / 2 + 8, y0 - 250 + Math.sin(R.t * 3) * 4, iw, ih); }
  txt(t('rate_title', (save.names || {}).p1 ? pName(1) : t('pilot')), W / 2, y0 + 115, 42, { max: w - 40 });
  const L = t('rate_text').split('\n'); L.forEach((l, i) => txt(l, W / 2, y0 + 168 + i * 34, 25, { color: '#4a5a88', weight: 700, max: w - 50 }));
  bigButton('rate_go', x0 + 50, y0 + 250, w - 100, 92, t('rate_btn'), { fill: YEL, primary: true, fs: 36 }, () => Rate.rate());
  bigButton('rate_later', x0 + 110, y0 + 358, w - 220, 64, t('rate_later'), { fs: 26 }, () => Rate.later());
  ui('rate_never', x0 + w - 190, y0 + h - 4, 190, 40, {}, (x, y, ww, hh) => txt(t('rate_never'), x + ww / 2, y + hh / 2, 20, { color: '#7a88aa', max: 180 }), () => Rate.never());
  ctx.restore();
}
