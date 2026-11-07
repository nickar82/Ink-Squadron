/* =========================================================
   MENUS — language, main menu, new game, levels, settings,
   1 VS 1 setup, how to play, achievements
   ========================================================= */
let scene = null, sceneT = 0, fade = 0;
function go(name) { scene = SCENES[name]; sceneT = 0; fade = 1; hits = []; pressed = null; }
function overlayBlocks() { return (scene === SCENES.game || scene === SCENES.arena) && M && (M.paused || M.result || M.netLost || M.phase === 'continue' || (M.rate && M.rate.t >= 0)); }
const SCENES = {};
/* ---- player names ---- */
function pName(i) { const n = (save.names || {})['p' + i]; return n && n.trim() ? n.trim().toUpperCase() : t(i === 1 ? 'player1' : 'player2'); }
let nameBox = null;
function askName(title, value, cb) {
  if (nameBox) return;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;background:rgba(243,246,252,.88);display:flex;align-items:flex-start;justify-content:center;z-index:10;padding-top:18vh';
  const card = document.createElement('div');
  card.style.cssText = `width:min(86vw,460px);background:#fbfdff;border:4px solid ${NAVY};border-radius:26px;padding:22px 22px 18px;box-shadow:4px 6px 0 rgba(27,42,94,.18);font-family:${FONT};text-align:center`;
  const h = document.createElement('div'); h.textContent = title; h.style.cssText = `font-weight:900;font-style:italic;font-size:26px;color:${NAVY};margin-bottom:14px`;
  const inp = document.createElement('input'); inp.value = value || ''; inp.maxLength = 12; inp.placeholder = 'ACE';
  inp.setAttribute('autocomplete', 'off'); inp.setAttribute('autocapitalize', 'characters'); inp.setAttribute('enterkeyhint', 'done');
  inp.style.cssText = `width:100%;box-sizing:border-box;font:italic 900 30px ${FONT};color:${NAVY};text-align:center;border:3px solid ${NAVY};border-radius:16px;padding:10px;background:#fff;outline:none;text-transform:uppercase`;
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:12px;margin-top:16px';
  const mk = (label, bg) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = `flex:1;font:italic 900 22px ${FONT};color:${NAVY};background:${bg};border:3px solid ${NAVY};border-radius:18px;padding:12px`; return b; };
  const skip = mk(t('skip'), '#fff'), ok = mk(t('ok'), YEL);
  row.append(skip, ok); card.append(h, inp, row); wrap.append(card); document.body.append(wrap); nameBox = wrap;
  const close = (v) => { wrap.remove(); nameBox = null; sfx.click(); cb(v); };
  ok.onclick = () => close(inp.value.replace(/[<>]/g, '').trim().slice(0, 12));
  skip.onclick = () => close(null);
  inp.onkeydown = e => { if (e.key === 'Enter') ok.onclick(); e.stopPropagation(); };
  wrap.addEventListener('pointerdown', e => e.stopPropagation());
  setTimeout(() => inp.focus(), 60);
}
function setName(i, v) { save.names = save.names || {}; if (v != null) save.names['p' + i] = v; persist(); }
function header(title, onBack) {
  ui('back', 28, 46, 84, 84, {}, (x, y, w, h) => { sketchBox(x, y, w, h, { r: 22 }); iconBack(x + w / 2, y + h / 2, 52); }, onBack);
  txt(title, W / 2 + 30, 92, 56, { stroke: '#fff', sw: 10, shadow: '#9fb8e8', rot: -.03, max: 520 });
  inkLine(W / 2 - 130, 132, W / 2 + 170, 124, RED, 6, title.length);
}
function nextBtn(id, x, y, onTap, dis) { ui(id, x, y, 110, 80, { disabled: dis }, (bx, by, w, h) => { sketchBox(bx, by, w, h, { r: 20, fill: YEL }); ctx.save(); ctx.translate(bx + w / 2, by + h / 2); ctx.scale(-1, 1); iconBack(0, 0, 48); ctx.restore(); }, onTap); }
function prevBtn(id, x, y, onTap, dis) { ui(id, x, y, 110, 80, { disabled: dis }, (bx, by, w, h) => { sketchBox(bx, by, w, h, { r: 20 }); iconBack(bx + w / 2, by + h / 2, 48); }, onTap); }
function chips(idp, x, y, w, h, items, cur, onPick) {
  const gap = 12, cw = (w - gap * (items.length - 1)) / items.length;
  items.forEach(([label, val], i) => {
    const cx = x + i * (cw + gap);
    ui(idp + i, cx, y, cw, h, {}, (bx, by, bw, bh) => { sketchBox(bx, by, bw, bh, { r: 20, fill: cur === val ? YEL : '#fbfdff', seed: i * 9 + idp.length }); txt(label, bx + bw / 2, by + bh / 2 + 2, 24, { max: bw - 14 }); }, () => onPick(val));
  });
}
function iconTrophy(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = Math.max(2, s * .06); ctx.strokeStyle = NAVY; ctx.fillStyle = YEL; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-s * .28, -s * .36); ctx.lineTo(s * .28, -s * .36); ctx.quadraticCurveTo(s * .28, s * .1, 0, s * .12); ctx.quadraticCurveTo(-s * .28, s * .1, -s * .28, -s * .36); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-s * .3, -s * .2, s * .12, Math.PI * .5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(s * .3, -s * .2, s * .12, -Math.PI * .5, Math.PI * .5); ctx.stroke();
  ctx.fillRect(-s * .06, s * .12, s * .12, s * .16); ctx.strokeRect(-s * .06, s * .12, s * .12, s * .16);
  ctx.fillStyle = '#c9d4ea'; ctx.fillRect(-s * .22, s * .28, s * .44, s * .1); ctx.strokeRect(-s * .22, s * .28, s * .44, s * .1); ctx.restore();
}
function iconClock(x, y, s) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, s * .4, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = Math.max(2.5, s * .07); ctx.stroke();
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * .26); ctx.moveTo(x, y); ctx.lineTo(x + s * .18, y + s * .08); ctx.stroke();
  ctx.fillStyle = RED; ctx.fillRect(x - s * .08, y - s * .58, s * .16, s * .12); ctx.restore();
}
function iconJoy(x, y, s) {
  ctx.save(); ctx.lineWidth = Math.max(2.5, s * .07); ctx.strokeStyle = NAVY; rrPath(ctx, x - s * .4, y + s * .05, s * .8, s * .3, s * .1); ctx.fillStyle = '#cfe0ff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + s * .1); ctx.lineTo(x, y - s * .25); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y - s * .3, s * .14, 0, 7); ctx.fillStyle = RED; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + s * .24, y + s * .2, s * .06, 0, 7); ctx.fillStyle = YEL; ctx.fill(); ctx.stroke(); ctx.restore();
}
function iconGlobe(x, y, s) {
  ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = Math.max(2, s * .06); ctx.beginPath(); ctx.arc(x, y, s * .4, 0, 7); ctx.fillStyle = '#cfe0ff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y, s * .16, s * .4, 0, 0, 7); ctx.moveTo(x - s * .4, y); ctx.lineTo(x + s * .4, y); ctx.moveTo(x - s * .34, y - s * .2); ctx.lineTo(x + s * .34, y - s * .2); ctx.moveTo(x - s * .34, y + s * .2); ctx.lineTo(x + s * .34, y + s * .2); ctx.stroke(); ctx.restore();
}

/* ---- LANGUAGE ---- */
SCENES.lang = {
  from: null,
  draw(gt) {
    drawGrid(40, 0, 0);
    if (this.from) header(t('language'), () => go(this.from));
    else { iconGlobe(W / 2, 110, 90); txt('Language · 语言 · Idioma', W / 2, 190, 28, { max: 640 }); txt('言語 · Sprache · Langue · Lingua · Γλώσσα', W / 2, 228, 22, { color: '#5a6c9a', max: 640 }); }
    const y0 = this.from ? 190 : 270, cw = 300, ch = 120, gx = (W - cw * 2 - 24) / 2;
    LANGS.forEach((L, i) => {
      const x = gx + (i % 2) * (cw + 24), y = y0 + Math.floor(i / 2) * (ch + 20);
      ui('lang' + L.code, x, y, cw, ch, {}, (bx, by, w, h) => {
        sketchBox(bx, by, w, h, { r: 24, fill: save.lang === L.code ? YEL : '#fbfdff', seed: i * 3 + 2 });
        drawFlag(L.code, bx + 24, by + h / 2 - 30, 90, 60);
        txt(L.name, bx + 130, by + h / 2 + 2, 30, { align: 'left', max: w - 145 });
      }, () => {
        setLang(L.code);
        if (!this.from && !save.nameAsked) { save.nameAsked = true; persist(); askName(t('your_name'), (save.names || {}).p1 || '', v => { setName(1, v); go('menu'); }); }
        else go(this.from || 'menu');
      });
    });
  },
  back() { if (this.from) { go(this.from); return true; } return false; }
};

/* ---- MAIN MENU extras: scribbled logo, mute, flying squadron, secret ---- */
let logoCv = null, logoKey = '';
function scribbleLogo(gt) {
  const key = (document.fonts && document.fonts.status) + (gt > 1.5 ? 'b' : 'a');
  if (!logoCv || logoKey !== key) {
    logoKey = key; const S = 2, w = 760, h = 300;
    const mk = () => { const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; const x = c.getContext('2d'); x.scale(S, S); return [c, x]; };
    const font = sz => `italic 900 ${sz}px ${FONT}`;
    const letters = x => { x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font(108); x.fillText('INK', w / 2, h / 2 - 50); x.font = font(100); x.fillText('SQUADRON', w / 2, h / 2 + 42); };
    const strokeL = (x, dx, dy) => { x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font(108); x.strokeText('INK', w / 2 + dx, h / 2 - 50 + dy); x.font = font(100); x.strokeText('SQUADRON', w / 2 + dx, h / 2 + 42 + dy); };
    // hatch-filled letters
    const [hc, hx] = mk(); const r = mulberry(7);
    hx.fillStyle = '#c8d8f6'; letters(hx);
    hx.globalCompositeOperation = 'source-atop'; hx.strokeStyle = NAVY; hx.lineCap = 'round';
    for (let i = -h; i < w + h; i += 9) { hx.lineWidth = 2.6 + r() * 1.6; hx.beginPath(); hx.moveTo(i + r() * 4, -4); hx.quadraticCurveTo(i - h * .3 + r() * 10, h * .5, i - h * .62 + r() * 4, h + 4); hx.stroke(); }
    hx.globalCompositeOperation = 'source-over';
    const [c, x] = mk();
    x.lineJoin = 'round'; x.strokeStyle = '#fff'; x.lineWidth = 18; strokeL(x, 0, 0);
    x.save(); x.globalAlpha = .9; x.fillStyle = '#9fb8e8'; x.translate(5, 6); letters(x); x.restore();
    x.drawImage(hc, 0, 0, w, h);
    x.strokeStyle = NAVY; x.lineWidth = 4; strokeL(x, 0, 0); x.lineWidth = 2.2; x.globalAlpha = .8; strokeL(x, 2.5, -1.8); x.globalAlpha = .55; strokeL(x, -1.8, 2.2);
    logoCv = c;
  }
  return logoCv;
}
function iconSpeaker(x, y, s, on) {
  ctx.save(); ctx.strokeStyle = NAVY; ctx.fillStyle = on ? '#cfe0ff' : '#e5e9f2'; ctx.lineWidth = Math.max(2.5, s * .07); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * .38, y - s * .14); ctx.lineTo(x - s * .18, y - s * .14); ctx.lineTo(x + s * .06, y - s * .36); ctx.lineTo(x + s * .06, y + s * .36); ctx.lineTo(x - s * .18, y + s * .14); ctx.lineTo(x - s * .38, y + s * .14); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (on) { for (const rr of [.2, .36]) { ctx.beginPath(); ctx.arc(x + s * .08, y, s * rr, -.8, .8); ctx.stroke(); } }
  else { ctx.strokeStyle = RED; ctx.lineWidth = s * .09; ctx.beginPath(); ctx.moveTo(x + s * .16, y - s * .16); ctx.lineTo(x + s * .42, y + s * .16); ctx.moveTo(x + s * .42, y - s * .16); ctx.lineTo(x + s * .16, y + s * .16); ctx.stroke(); }
  ctx.restore();
}
const isMuted = () => !save.settings.sound && !save.settings.music;
function toggleMute() { const m = !isMuted(); save.settings.sound = !m; save.settings.music = !m; persist(); if (!m) { audioInit(); sfx.click(); } }
const menuSq = [{ dx: -170, dy: 0, s: 30 }, { dx: 0, dy: -30, s: 38 }, { dx: 170, dy: 0, s: 30 }].map(p => Object.assign(p, { f: -1 }));
const menuEgg = new Set();
let eggPop = null;
function launchSquadPlane(i) {
  const p = menuSq[i]; if (p.f >= 0) return;
  p.f = 0; p.wob = Math.random() * 6; sfx.rocket(); vib(25);
  if (!(save.egg && save.egg.done)) { menuEgg.add(i); if (menuEgg.size === 3) setTimeout(unlockEgg, 1700); }
}
function unlockEgg() {
  if (save.egg && save.egg.done) return;
  save.egg = { done: true, credits: 3, pw: 1 }; persist();
  achAdd('secret'); confetti(); sfx.win(); eggPop = { t: 0 };
}
function drawSquad(gt, dt) {
  const sy = H * .895;
  menuSq.forEach((p, i) => {
    const hx = W / 2 + p.dx, hy = sy + p.dy + Math.sin(gt * 2.2 + i) * 6;
    let x = hx, y = hy, rot = 0, sc = 1;
    if (p.f >= 0) {
      p.f += dt;
      const up = .85, back = .9;
      if (p.f < up) { const k = p.f / up, e = k * k; y = hy - e * (hy + 140); x = hx + Math.sin(k * 7 + p.wob) * 30 * k; sc = 1 + k * .35; }
      else if (p.f < up + .35) { y = -400; }
      else if (p.f < up + .35 + back) { const k = (p.f - up - .35) / back, e = 1 - Math.pow(1 - k, 3); y = H + 120 - e * (H + 120 - hy); x = hx + Math.sin(k * 5 + p.wob) * 24 * (1 - k); }
      else p.f = -1;
      // ink trail
      if (p.f >= 0 && y > -200 && y < H + 100) { ctx.save(); ctx.globalAlpha = .35; ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.setLineDash([10, 9]); ctx.beginPath(); ctx.moveTo(x, y + p.s * 1.4); ctx.lineTo(x - (x - hx) * .3, y + p.s * 1.4 + 120); ctx.stroke(); ctx.restore(); }
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
    drawShip(x, y, p.s, -1, { color: RED, t: gt, exhaust: true }); ctx.restore();
    if (p.f < 0) ui('sq' + i, hx - 70, hy - 70, 140, 140, { silent: true }, () => { }, () => launchSquadPlane(i));
  });
}
function drawEggPop(dt) {
  const R = eggPop; R.t += dt; const k = clamp(R.t / .35, 0, 1);
  ui('egg_block', -300, 0, W + 600, H, { silent: true }, () => { }, () => { });
  ctx.save(); ctx.fillStyle = `rgba(243,246,252,${.88 * k})`; ctx.fillRect(-200, 0, W + 400, H); ctx.restore();
  ctx.save(); ctx.translate(W / 2, H / 2); const s = easeBack(k); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
  const w = 580, h = 470, x0 = (W - w) / 2, y0 = H * .38;
  sketchBox(x0, y0, w, h, { r: 36, fill: '#fff8dc' });
  const im = MASCOT.img.thumbs; if (im && im.width) { const ih = 320, iw = ih * im.width / im.height; ctx.drawImage(im, W / 2 - iw / 2 + 8, y0 - 245 + Math.sin(R.t * 3) * 4, iw, ih); }
  star(x0 + 60, y0 + 70, 26, true); star(x0 + w - 60, y0 + 70, 26, true);
  txt(t('egg_title'), W / 2, y0 + 110, 46, { color: RED, stroke: '#fff', sw: 9, rot: -.03, max: w - 140 });
  txt(t('ach_unlocked') + ': ' + t('ach_secret'), W / 2, y0 + 168, 22, { color: '#8a6a00', max: w - 60 });
  [t('egg_a'), t('egg_b')].forEach((l, i) => { coin(x0 + 70, y0 + 222 + i * 50, 13); txt(l, x0 + 100, y0 + 224 + i * 50, 24, { align: 'left', weight: 700, color: NAVY, max: w - 130 }); });
  bigButton('egg_ok', x0 + 130, y0 + 330, w - 260, 90, 'OK!', { fill: YEL, primary: true, fs: 40 }, () => { eggPop = null; });
  ctx.restore();
}

/* ---- MAIN MENU ---- */
const menuPlanes = [{ x: 120, y: 260, s: .5, a: -.9 }, { x: 600, y: 230, s: .45, a: -2.3 }];
SCENES.menu = {
  draw(gt) {
    drawGrid(40, 0, 0);
    for (let i = 0; i < 12; i++) { const x = 42 + i * 58; ctx.save(); ctx.fillStyle = '#c9d6ef'; ctx.beginPath(); ctx.arc(x, 44, 11, 0, 7); ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(x, 18, 15, Math.PI * .15, Math.PI * .85, true); ctx.strokeStyle = '#2b5fbf'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore(); }
    for (const p of menuPlanes) {
      const k = (gt * .05 + p.x / 700) % 1; const px = p.x + Math.cos(p.a) * k * 140, py = p.y + Math.sin(p.a) * k * 140;
      ctx.save(); ctx.globalAlpha = .35; ctx.translate(px, py); ctx.rotate(p.a + Math.PI / 2); ctx.translate(-px, -py);
      shipPath(px, py, 34 * p.s * 2, 34 * p.s * 2); ctx.strokeStyle = '#2b5fbf'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = .25; ctx.strokeStyle = '#2b5fbf'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(p.a) * 160, py - Math.sin(p.a) * 160); ctx.stroke(); ctx.restore();
    }
    const cy = H * .16, r = Math.min(130, H * .1);
    ctx.save(); ctx.strokeStyle = '#2b6fd8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2, cy, r, 0, 7); ctx.stroke();
    ctx.setLineDash([14, 10]); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(W / 2, cy, r - 16, gt * .3, gt * .3 + 6.28); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = NAVY;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.beginPath(); ctx.moveTo(W / 2 + dx * (r - 10), cy + dy * (r - 10)); ctx.lineTo(W / 2 + dx * (r + 22), cy + dy * (r + 22)); ctx.stroke(); }
    ctx.restore();
    drawShip(W / 2, cy + 2 + Math.sin(gt * 2) * 5, r * .5, -1, { color: BLUE, t: gt, exhaust: true });
    const ty = H * .31;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { inkLine(150 + i * 30, ty - 85 + i * 14, 290 + i * 20, ty - 95 + i * 14, RED, 7, 40 + i); inkLine(450 + i * 18, ty - 92 + i * 14, 590 - i * 10, ty - 100 + i * 14, RED, 7, 50 + i); }
    inkLine(110, ty + 70, 640, ty + 38, RED, 9, 61); inkLine(160, ty + 92, 560, ty + 70, RED, 6, 62);
    ctx.restore();
    ctx.save(); ctx.translate(W / 2, ty); ctx.rotate(-.07); ctx.transform(1, 0, -.08, 1, 0, 0);
    ctx.drawImage(scribbleLogo(gt), -380, -150 + 2, 760, 300);
    ctx.restore();
    txt(t('tag1'), W / 2 + 10, H * .405, 30, { rot: -.06, max: 600 });
    txt(t('tag2'), W / 2, H * .405 + 38, 30, { rot: -.06, max: 600 });
    seasonMenu(gt);
    const bx = 130, bw = 460;
    bigButton('play', bx - 20, H * .5 - 50, bw + 40, 100, t('play'), { fill: YEL, hatch: 'rgba(230,160,20,0.35)', primary: true, icon: iconPlay, fs: 50 }, () => go('newgame'));
    bigButton('vs', bx, H * .575 - 40, bw, 80, t('vs'), { fill: '#ffe1de', hatch: 'rgba(227,52,44,0.15)', icon: iconVs, fs: 36 }, () => go('setup'));
    bigButton('levels', bx, H * .645 - 35, bw, 70, t('levels'), { icon: iconBars, fs: 30 }, () => { SCENES.levels.page = Math.floor((save.unlocked - 1) / 25); go('levels'); });
    bigButton('settings', bx, H * .71 - 35, bw / 2 - 8, 70, t('settings'), { fs: 22, icon: iconGear }, () => go('settings'));
    bigButton('howto', bx + bw / 2 + 8, H * .71 - 35, bw / 2 - 8, 70, t('howto'), { fs: 22, icon: iconInfo }, () => { SCENES.howto.page = 0; go('howto'); });
    bigButton('achv', bx, H * .775 - 35, bw / 2 - 8, 70, t('awards'), { fs: 22, icon: iconTrophy }, () => { SCENES.achv.page = 0; go('achv'); });
    ui('flag', bx + bw / 2 + 8, H * .775 - 35, bw / 2 - 8, 70, {}, (x, y, w, h) => { sketchBox(x, y, w, h, { r: 20 }); drawFlag(save.lang || 'en', x + 18, y + h / 2 - 18, 54, 36); txt(LANGS.find(l => l.code === (save.lang || 'en')).name, x + 84, y + h / 2 + 2, 22, { align: 'left', max: w - 96 }); }, () => { SCENES.lang.from = 'menu'; go('lang'); });
    const mdt = Math.min(.05, gt - (this.lgt || gt)); this.lgt = gt;
    drawSquad(gt, mdt);
    txt(`★ ${totalScore()}`, W - 24, H - 26, 24, { align: 'right', color: '#5a6c9a' });
    txt('Created by Nickar ©2026', W / 2, H - 26, 20, { color: '#6a7aa0', weight: 700, rot: -.015, max: 360 });
    ui('mute', 22, 64, 84, 84, {}, (x, y, w, h) => { sketchBox(x, y, w, h, { r: 22, fill: isMuted() ? '#ffe1de' : '#fbfdff', seed: 91 }); iconSpeaker(x + w / 2, y + h / 2, 58, !isMuted()); }, toggleMute);
    if (eggPop) drawEggPop(mdt);
  },
  back() { return false; }
};

/* ---- NEW GAME ---- */
SCENES.newgame = {
  draw(gt) {
    drawGrid(40, 0, 0); header(t('new_game'), () => go('menu'));
    const card = (id, y, h, fill, icon, title, sub, sub2, onTap) => ui(id, 60, y, 600, h, {}, (x, yy, w, hh) => {
      sketchBox(x, yy, w, hh, { r: 30, fill, seed: id.length * 3 }); icon(x + 70, yy + hh / 2, 90);
      txt(title, x + 140, yy + hh / 2 - 26, 40, { align: 'left', max: w - 160 });
      txt(sub, x + 140, yy + hh / 2 + 14, 21, { align: 'left', color: '#4a5a88', weight: 700, max: w - 160 });
      if (sub2) txt(sub2, x + 140, yy + hh / 2 + 44, 20, { align: 'left', color: RED, max: w - 160 });
    }, onTap);
    const lv = Math.min(save.unlocked, MAXLV);
    card('ng_classic', 180, 170, YEL, (x, y, s) => drawDie(x, y, s * .8, 5, { rot: -.15 }), t('classic'), t('classic_sub'), t('level_n', lv), () => newMatch(levelCfg(lv)));
    card('ng_arcade', 370, 170, '#dde9ff', iconJoy, t('arcade'), t('arcade_sub'), save.hi.arcade ? t('best') + ' ' + save.hi.arcade : '', () => startRT('arcade'));
    card('ng_ta', 560, 170, '#e3f6ea', iconClock, t('time_attack'), t('ta_sub'), save.hi['ta' + save.ta.dur] ? t('best') + ' ' + save.hi['ta' + save.ta.dur] : '', () => startRT('timeattack'));
    const std = [60, 120, 180].includes(save.ta.dur), cm = save.ta.custom || 5;
    chips('tadur', 180, 750, 480, 64, [['60s', 60], ['120s', 120], ['180s', 180], [t('custom'), 'c']], std ? save.ta.dur : 'c', v => { save.ta.dur = v === 'c' ? cm * 60 : v; persist(); });
    txt(t('ta_length'), 110, 782, 22, { color: '#4a5a88', max: 130 });
    if (!std) {
      const step = d => { save.ta.custom = clamp((save.ta.custom || 5) + d, 1, 60); save.ta.dur = save.ta.custom * 60; persist(); };
      [[-5, '−5'], [-1, '−'], [1, '+'], [5, '+5']].forEach(([d, l], i) => ui('tac' + i, [180, 270, 520, 610][i], 830, 80, 60, {}, (x, y, w, h) => { sketchBox(x, y, w, h, { r: 18 }); txt(l, x + w / 2, y + h / 2 + 2, 28); }, () => step(d)));
      txt(t('minutes_n', save.ta.custom || 5), 435, 862, 34, { color: '#2366c9', max: 150 });
    }
    txt(t('credits_info'), W / 2, std ? 860 : 935, 22, { color: '#5a6c9a', max: 640 });
    if (!std && save.ta.dur > 180) txt(t('ta_breaks'), W / 2, 968, 18, { color: '#7a88aa', max: 640 });
  },
  back() { go('menu'); return true; }
};

/* ---- LEVELS ---- */
SCENES.levels = {
  page: 0,
  draw(gt) {
    drawGrid(40, 0, 0); header(t('levels'), () => go('menu'));
    txt(`★ ${totalStars()} / ${MAXLV * 3}`, W / 2, 168, 30, { color: '#5a6c9a' });
    const p = this.page, gw = 112, gh = 112, gx = (W - gw * 5 - 20 * 4) / 2, gy = Math.max(215, H / 2 - 360);
    for (let i = 0; i < 25; i++) {
      const n = p * 25 + i + 1, x = gx + (i % 5) * (gw + 20), y = gy + Math.floor(i / 5) * (gh + 24), locked = n > save.unlocked;
      ui('lv' + n, x, y, gw, gh, { disabled: locked }, (x, y, w, h) => {
        const cur = n === save.unlocked;
        sketchBox(x, y, w, h, { fill: cur ? YEL : n % 5 === 0 ? '#ffe1de' : '#fbfdff', r: 20, seed: n });
        if (locked) iconLock(x + w / 2, y + h / 2 - 6, 48);
        else { txt(String(n), x + w / 2, y + h / 2 - 12, 40); const s = save.stars[n] || 0; for (let k = 0; k < 3; k++) star(x + w / 2 + (k - 1) * 28, y + h - 24, 12, k < s, { lw: 2 }); }
        if (n % 5 === 0 && !locked) { ctx.save(); ctx.fillStyle = YEL; ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w - 30, y + 8); ctx.lineTo(x + w - 24, y + 20); ctx.lineTo(x + w - 18, y + 8); ctx.lineTo(x + w - 12, y + 20); ctx.lineTo(x + w - 10, y + 26); ctx.lineTo(x + w - 32, y + 26); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      }, () => newMatch(levelCfg(n)));
    }
    const yb = gy + 5 * (gh + 24) + 10;
    txt(`${p * 25 + 1} – ${p * 25 + 25}`, W / 2, yb + 40, 30);
    prevBtn('pprev', 70, yb, () => this.page--, p === 0);
    nextBtn('pnext', W - 180, yb, () => this.page++, p >= 3);
  },
  back() { go('menu'); return true; }
};

/* ---- SETTINGS ---- */
function toggleRow(id, y, label, on, onTap) {
  ui(id, 70, y, 580, 70, {}, (x, yy, w, h) => {
    sketchBox(x, yy, w, h, { r: 22, seed: y | 0 }); txt(label, x + 30, yy + h / 2 + 2, 26, { align: 'left', max: w - 200 });
    const tx = x + w - 140;
    sketchBox(tx, yy + 11, 110, 48, { r: 24, fill: on ? '#7ad39a' : '#e5e9f2', shadow: false, lw: 3 });
    ctx.save(); ctx.beginPath(); ctx.arc(on ? tx + 86 : tx + 24, yy + 35, 19, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    txt(on ? t('on') : t('off'), on ? tx + 38 : tx + 72, yy + 36, 16, { max: 44 });
  }, onTap);
}
function valueRow(id, y, label, value, onTap, drawExtra) {
  ui(id, 70, y, 580, 70, {}, (x, yy, w, h) => {
    sketchBox(x, yy, w, h, { r: 22, seed: y | 0 }); txt(label, x + 30, yy + h / 2 + 2, 26, { align: 'left', max: 260 });
    if (drawExtra) drawExtra(x, yy, w, h);
    txt(value, x + w - 30, yy + h / 2 + 2, 24, { align: 'right', color: '#2366c9', max: 240 });
  }, onTap);
}
SCENES.settings = {
  confirm: 0,
  draw(gt) {
    drawGrid(40, 0, 0); header(t('settings'), () => go('menu'));
    let y = 156; const st = 78;
    const L = LANGS.find(l => l.code === (save.lang || 'en'));
    valueRow('sname', y, t('your_name'), pName(1), () => askName(t('your_name'), (save.names || {}).p1 || '', v => setName(1, v))); y += st;
    valueRow('slang', y, t('language'), L.name, () => { SCENES.lang.from = 'settings'; go('lang'); }, (x, yy, w, h) => drawFlag(L.code, x + w - 290, yy + 17, 54, 36)); y += st;
    toggleRow('ssound', y, t('sound'), save.settings.sound, () => { save.settings.sound = !save.settings.sound; persist(); }); y += st;
    toggleRow('smusic', y, t('music'), save.settings.music !== false, () => { save.settings.music = save.settings.music === false; persist(); }); y += st;
    toggleRow('svib', y, t('vibration'), save.settings.vib, () => { save.settings.vib = !save.settings.vib; persist(); vib(60); }); y += st;
    toggleRow('sshake', y, t('shake'), save.settings.shake, () => { save.settings.shake = !save.settings.shake; persist(); }); y += st;
    toggleRow('smascot', y, t('mascot'), save.settings.mascot !== false, () => { save.settings.mascot = save.settings.mascot === false; persist(); }); y += st;
    const th = save.settings.theme || 'auto';
    valueRow('stheme', y, t('theme'), t('theme_' + th) + (th === 'auto' && SEASON.id !== 'none' ? ' (' + t('season_' + SEASON.id) + ')' : ''), () => { const i = THEME_OPTS.indexOf(th); save.settings.theme = THEME_OPTS[(i + 1) % THEME_OPTS.length]; persist(); applySeason(); }); y += st;
    if (PGS.available()) { valueRow('spgs', y, 'Google Play Games', t('sign_in'), () => PGS.signIn()); y += st; }
    const b = Bridge();
    if (b && b.adsPrivacy) { valueRow('sads', y, t('ad_privacy'), '›', () => { try { b.adsPrivacy(); } catch (e) { } }); y += st; }
    y += 14;
    bigButton('reset', 140, y, 440, 76, this.confirm > 0 ? t('reset_confirm') : t('reset'), { fill: this.confirm > 0 ? '#ffd0cc' : '#fbfdff', fs: 26 }, () => {
      if (this.confirm > 0) { save.unlocked = 1; save.best = {}; save.stars = {}; save.hi = {}; persist(); this.confirm = 0; addFloat(W / 2, y - 30, t('reset_done'), RED, 32); }
      else this.confirm = 3;
    });
    this.confirm = Math.max(0, this.confirm - 1 / 60);
    txt('Ink Squadron v1.0', W / 2, H - 50, 22, { color: '#7a88aa' });
  },
  back() { go('menu'); return true; }
};

/* ---- 1 VS 1 SETUP ---- */
SCENES.setup = {
  draw(gt) {
    drawGrid(40, 0, 0); header(t('vs'), () => go('menu'));
    const net = save.vs.net && netAvailable();
    txt(net ? t('vs_sub_net') : t('vs_sub'), W / 2, 170, 23, { color: '#5a6c9a', max: 640 });
    const nf = (id, x, i, col) => ui(id, x, 192, 290, 58, {}, (bx, by, w, h) => { sketchBox(bx, by, w, h, { r: 18, fill: col, seed: i * 7 }); txt(pName(i), bx + w / 2, by + h / 2 + 2, 24, { max: w - 50 }); ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx + w - 30, by + 40); ctx.lineTo(bx + w - 16, by + 18); ctx.stroke(); ctx.restore(); }, () => askName(i === 1 ? t('player1') : t('player2'), (save.names || {})['p' + i] || '', v => setName(i, v)));
    nf('name1', 60, 1, '#ffe1de'); if (!net) nf('name2', 370, 2, '#dde9ff');
    let y = 262;
    for (let i = 1; i <= 5; i++) {
      const x = 60 + (i - 1) * 124;
      ui('ships' + i, x, y, 112, 104, {}, (bx, by, w, h) => {
        const on = save.vs.ships >= i, sel = save.vs.ships === i;
        sketchBox(bx, by, w, h, { r: 22, fill: sel ? YEL : on ? '#fff6d0' : '#fbfdff', seed: i * 5 });
        drawShip(bx + w / 2, by + 42, 19, -1, { color: on ? RED : '#aab4c8', alpha: on ? 1 : .6, t: gt, exhaust: on });
        txt(String(i), bx + w / 2, by + h - 16, 24);
      }, () => { save.vs.ships = i; persist(); });
    }
    const row = (yy, label) => txt(label, 60, yy + 32, 22, { align: 'left', color: '#4a5a88', max: 190 });
    y = 392; row(y, t('battlefield')); chips('len', 260, y, 400, 64, [[t('short'), 0], [t('medium'), 1], [t('long'), 2]], save.vs.len, v => { save.vs.len = v; persist(); });
    y += 80; row(y, t('powerups')); chips('pw', 260, y, 400, 64, [[t('on'), true], [t('off'), false]], save.vs.pw, v => { save.vs.pw = v; persist(); });
    y += 80; row(y, t('mode')); chips('rt', 260, y, 400, 64, [[t('turn_based'), false], [t('real_time'), true]], !!save.vs.rt, v => { save.vs.rt = v; if (v) save.vs.net = false; persist(); });
    y += 80; if (!save.vs.rt) { row(y, t('shot_clock')); chips('clk', 260, y, 400, 64, [[t('off'), 0], ['10s', 10], ['20s', 20]], save.vs.clock || 0, v => { save.vs.clock = v; persist(); }); }
    y += 80; row(y, t('device'));
    if (netAvailable()) chips('dev', 260, y, 400, 64, [[t('this_phone'), false], [t('wifi_bt'), true]], !!save.vs.net, v => { save.vs.net = v; if (v) save.vs.rt = false; persist(); });
    else txt(t('net_android_only'), 460, y + 32, 20, { color: '#7a88aa', max: 400 });
    y += 96;
    bigButton('startvs', 110, Math.min(y, H - 118), 500, 96, net ? t('connect') : t('start_battle'), { fill: YEL, hatch: 'rgba(230,160,20,0.35)', primary: true, icon: iconPlay, fs: 38 }, () => {
      if (net) { go('lobby'); return; }
      if (save.vs.rt) startRT('rtvs'); else newMatch(versusCfg());
    });
  },
  back() { go('menu'); return true; }
};

/* ---- HOW TO PLAY ---- */
const HOWTO_PAGES = 8;
SCENES.howto = {
  page: 0,
  draw(gt) {
    drawGrid(40, 0, 0); header(t('howto_title'), () => go('menu'));
    const P = this.page, cx = W / 2, top = 180;
    sketchBox(50, top, 620, 460, { r: 30, fill: 'rgba(255,255,255,0.75)' });
    ctx.save(); rrPath(ctx, 54, top + 4, 612, 452, 28); ctx.clip();
    ctx.strokeStyle = 'rgba(70,120,215,0.2)'; ctx.lineWidth = .8;
    for (let x = 50; x < 670; x += 34) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + 460); ctx.stroke(); }
    for (let y = top; y < top + 460; y += 34) { ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(670, y); ctx.stroke(); }
    const c = 34, k = (gt % 3) / 3;
    if (P === 0) {
      drawShip(cx - 120, top + 370, c, -1, { color: RED, t: gt, exhaust: true });
      drawShip(cx + 120, top + 90, c, 1, { color: BLUE, t: gt });
      const len = Math.min(1, k * 1.6) * 4;
      inkLine(cx - 120 + c, top + 370, cx - 120 + c, top + 370 - len * c, RED, 5, 3);
      drawDie(cx + 140, top + 320, 80, 4, { rot: Math.sin(gt * 3) * .1 });
      ctx.save(); ctx.beginPath(); ctx.arc(cx - 120 + c, top + 370, 22 + 6 * Math.sin(gt * 6), 0, 7); ctx.strokeStyle = YEL; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
    } else if (P === 1) {
      drawShip(cx, top + 380, c, -1, { color: RED, t: gt, exhaust: true });
      const hit = k > .5;
      drawShip(cx + c, top + 110, c, 1, { color: BLUE, t: gt, dead: hit, deadT: (k - .5) * 3, killColor: RED, seed: 3 });
      inkLine(cx + c, top + 380, cx + c, top + 380 - Math.min(1, k * 2) * 270, RED, 5, 9);
      if (hit && k < .75 && SPRITES.ready) drawSprite('splat2', Math.min(5, ((k - .5) / .04) | 0), cx + c, top + 120, 160, RED, 1 - (k - .5) * 2);
    } else if (P === 2) {
      drawShip(cx - c, top + 380, c, -1, { color: RED, t: gt, exhaust: true });
      drawShip(cx + c, top + 90, c, 1, { color: BLUE, t: gt });
      const bt = top + 200, kk = clamp((k - .15) * 1.6, 0, 1), ry = lerp(top + 380, top + 160, kk);
      inkLine(cx, top + 90, cx, bt, BLUE, 5, 5, { alpha: ry > bt ? 1 : .22 });
      inkLine(cx, top + 380, cx, ry, RED, 5, 4);
      if (ry <= bt && k < .85) { if (SPRITES.ready) drawSprite('splat1', 4, cx, bt, 90, RED, .9); txt(t('fx_cut'), cx + 100, bt, 38, { stroke: '#fff', sw: 7 }); }
    } else if (P === 3) {
      const items = [[iconRocket, 'rocket'], [(x, y, s) => iconShield(x, y, s), 'shield'], [iconBolt, 'bolt'], [iconMove, 'move']];
      items.forEach(([ic, key], i) => { const y = top + 62 + i * 104; sketchBox(80, y - 42, 84, 84, { r: 20 }); ic(122, y, 64); txt(t('pw_' + key), 190, y - 16, 30, { align: 'left', max: 450 }); txt(t('pwd_' + key), 190, y + 20, 21, { align: 'left', color: '#4a5a88', weight: 700, max: 450 }); });
    } else if (P === 4) {
      const types = [['boss', 1.0], ['bomber', 1.0], ['interceptor', .9], ['tank', .9], ['sniper', .9]];
      drawShip(cx, top + 120, 30, 1, { type: 'boss', color: BLUE, t: gt, parts: { lw: { hp: 1, max: 2 }, rw: { hp: 2, max: 2 }, nose: { hp: 2, max: 2 }, eng: { hp: 2, max: 2 }, core: { hp: 3, max: 4 } } });
      types.slice(1).forEach(([tp], i) => { const x = 120 + i * 160, y = top + 330; drawShip(x, y, tp === 'bomber' ? 18 : 24, 1, { type: tp, color: BLUE, t: gt, maxHp: TYPES[tp].hp, hp: TYPES[tp].hp }); txt(t('type_' + tp), x, y + 100, 20, { max: 150 }); });
    } else if (P === 5) {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = 120 + i * c, y = top + 120 + j * c; ctx.fillStyle = '#dfe6f5'; ctx.fillRect(x, y, c - 2, c - 2); ctx.strokeStyle = NAVY; ctx.lineWidth = 2.4; ctx.strokeRect(x, y, c - 2, c - 2); }
      txt(t('bunkers'), 170, top + 230, 24, { max: 220 });
      drawRaider(470 + Math.sin(gt) * 40, top + 150, 60, 1, gt, RED); txt(t('raid'), 470, top + 230, 24, { max: 240 });
      drawShip(cx, top + 360, 26, 1, { type: 'fighter', color: BLUE, t: gt }); txt(t('reinforcements'), cx, top + 430, 24, { max: 400 });
    } else if (P === 7) {
      // hold the tail → lever appears → slide
      const cyc = gt % 3.2, sy = top + 300;
      let off = 0, lifted = cyc > .35 && cyc < 2.9;
      if (cyc > .6 && cyc < 1.4) off = -easeOut((cyc - .6) / .8) * 2; else if (cyc >= 1.4 && cyc < 2.6) off = -2 + easeOut((cyc - 1.4) / 1.2) * 4; else if (cyc >= 2.6) off = 2 - clamp((cyc - 2.6) / .3, 0, 1) * 2;
      const sx = cx + off * c;
      if (lifted) { const lw = c * 5.2, lh = 34, ly = sy - c * 2.55; rrPath(ctx, cx - lw / 2, ly - lh / 2, lw, lh, lh / 2); ctx.fillStyle = 'rgba(159,225,203,.92)'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(cx + clamp(off * c, -lw / 2 + 17, lw / 2 - 17), ly, 19, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#0F6E56'; ctx.lineWidth = 4; ctx.stroke(); }
      ctx.save(); const ls = lifted ? 1.07 : 1; ctx.translate(sx, sy); ctx.scale(ls, ls); ctx.translate(-sx, -sy);
      if (lifted) { ctx.save(); ctx.globalAlpha = .18; ctx.beginPath(); ctx.ellipse(sx + 8, sy + 14, c * 1.4, c * .5, 0, 0, 7); ctx.fillStyle = NAVY; ctx.fill(); ctx.restore(); }
      drawShip(sx, sy, c, -1, { color: RED, t: gt, exhaust: true }); ctx.restore();
      // finger on the tail
      const fy = sy + c * 1.25, press = cyc < .35 ? cyc / .35 : 1;
      ctx.save(); ctx.globalAlpha = cyc < 2.9 ? 1 : .3; ctx.beginPath(); ctx.arc(sx, fy, 24, 0, 7); ctx.fillStyle = 'rgba(248,210,58,.55)'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, fy, 24 + 14 * press, -Math.PI / 2, -Math.PI / 2 + press * 6.28); ctx.strokeStyle = YEL; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
      txt('0.15 s', cx + 190, top + 380, 26, { color: '#2366c9' });
      for (const d of [-1, 1]) { ctx.save(); ctx.globalAlpha = .5; inkLine(cx + d * 70, top + 120, cx + d * 170, top + 120, NAVY, 4, 30 + d); ctx.beginPath(); ctx.moveTo(cx + d * 185, top + 120); ctx.lineTo(cx + d * 165, top + 108); ctx.lineTo(cx + d * 165, top + 132); ctx.closePath(); ctx.fillStyle = NAVY; ctx.fill(); ctx.restore(); }
    } else {
      drawShip(cx - 80, top + 330, 40, -1, { color: RED, t: gt, exhaust: true });
      const ink = (Math.sin(gt * 2) + 1) / 2;
      ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(27,42,94,.15)'; ctx.beginPath(); ctx.arc(cx - 40, top + 330, 22, 0, 7); ctx.stroke(); ctx.strokeStyle = RED; ctx.beginPath(); ctx.arc(cx - 40, top + 330, 22, -Math.PI / 2, -Math.PI / 2 + ink * 6.28); ctx.stroke(); ctx.restore();
      inkLine(cx - 40, top + 330, cx - 40, top + 330 - (1 - ink) * 200, RED, 6, 8);
      for (let i = 0; i < 3; i++) coin(cx + 120 + i * 40, top + 140, 17);
      txt(t('continue_q'), cx + 160, top + 200, 30, { color: RED, max: 260 });
    }
    ctx.restore();
    txt(t('ht' + P + '_t'), W / 2, top + 512, 42, { color: RED, stroke: '#fff', sw: 8, max: 620 });
    txt(t('ht' + P + '_a'), W / 2, top + 566, 24, { weight: 700, max: 640 }); txt(t('ht' + P + '_b'), W / 2, top + 602, 24, { weight: 700, max: 640 });
    for (let i = 0; i < HOWTO_PAGES; i++) { ctx.beginPath(); ctx.arc(W / 2 + (i - (HOWTO_PAGES - 1) / 2) * 30, top + 650, i === P ? 10 : 7, 0, 7); ctx.fillStyle = i === P ? NAVY : '#c5d0e8'; ctx.fill(); }
    const by = Math.min(H - 120, top + 690);
    prevBtn('hprev', 70, by, () => this.page--, P === 0);
    if (P < HOWTO_PAGES - 1) nextBtn('hnext', W - 180, by, () => this.page++);
    else bigButton('hplay', W - 290, by, 220, 80, t('play') + '!', { fill: YEL, fs: 34 }, () => go('newgame'));
  },
  back() { go('menu'); return true; }
};

/* ---- ACHIEVEMENTS ---- */
SCENES.achv = {
  page: 0,
  draw(gt) {
    drawGrid(40, 0, 0); header(t('awards'), () => go('menu'));
    const done = ACH.filter(a => achDone(a[0])).length;
    txt(`${done} / ${ACH.length}`, W / 2, 168, 28, { color: '#5a6c9a' });
    const per = 7, p = this.page, pages = Math.ceil(ACH.length / per);
    ACH.slice(p * per, p * per + per).forEach(([id, icon, target], i) => {
      const y = 200 + i * 92, ok = achDone(id), prog = achProgress(id);
      sketchBox(60, y, 600, 80, { r: 22, fill: ok ? '#fff4c6' : '#fbfdff', seed: i + 11 });
      ctx.save(); ctx.globalAlpha = ok ? 1 : .35; ctx.beginPath(); ctx.arc(110, y + 40, 28, 0, 7); ctx.fillStyle = ok ? YEL : '#e5e9f2'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      txt(icon, 110, y + 42, icon.length > 2 ? 18 : 26, { italic: false, alpha: ok ? 1 : .45 });
      txt(t('ach_' + id), 156, y + 27, 24, { align: 'left', max: 400 });
      txt(t('achd_' + id), 156, y + 56, 18, { align: 'left', color: '#4a5a88', weight: 700, max: 400 });
      if (target > 1 && !ok) txt(`${prog}/${target}`, 640, y + 42, 20, { align: 'right', color: '#2366c9' });
      if (ok) star(630, y + 40, 16, true);
    });
    const by = 200 + per * 92 + 10;
    prevBtn('aprev', 70, by, () => this.page--, p === 0);
    nextBtn('anext', W - 180, by, () => this.page++, p >= pages - 1);
    if (PGS.available()) {
      bigButton('pgsa', 200, by, 150, 80, '', { icon: iconTrophy }, () => PGS.showAchievements());
      bigButton('pgsl', 370, by, 150, 80, '', { icon: iconBars }, () => PGS.showLeaderboards());
      txt('Google Play Games', W / 2, by + 104, 20, { color: '#5a6c9a' });
    }
  },
  back() { go('menu'); return true; }
};
