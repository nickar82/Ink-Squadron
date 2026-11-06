/* =========================================================
   MENUS — language, main menu, new game, levels, settings,
   1 VS 1 setup, how to play, achievements
   ========================================================= */
let scene = null, sceneT = 0, fade = 0;
function go(name) { scene = SCENES[name]; sceneT = 0; fade = 1; hits = []; pressed = null; }
function overlayBlocks() { return (scene === SCENES.game || scene === SCENES.arena) && M && (M.paused || M.result || M.netLost || M.phase === 'continue'); }
const SCENES = {};
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
      }, () => { setLang(L.code); go(this.from || 'menu'); });
    });
  },
  back() { if (this.from) { go(this.from); return true; } return false; }
};

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
    ctx.save(); ctx.translate(W / 2, ty); ctx.rotate(-.07); ctx.transform(1, 0, -.12, 1, 0, 0);
    txt('INK', 0, -48, 104, { color: NAVY, stroke: '#fff', sw: 16, shadow: '#9fb8e8' });
    txt('SQUADRON', 0, 40, 96, { color: NAVY, stroke: '#fff', sw: 16, shadow: '#9fb8e8' });
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
    const sy = H * .895;
    drawShip(W / 2, sy - 30 + Math.sin(gt * 2.2) * 6, 38, -1, { color: RED, t: gt, exhaust: true });
    drawShip(W / 2 - 170, sy + Math.sin(gt * 2.2 + 1) * 6, 30, -1, { color: RED, t: gt, exhaust: true });
    drawShip(W / 2 + 170, sy + Math.sin(gt * 2.2 + 2) * 6, 30, -1, { color: RED, t: gt, exhaust: true });
    txt(`★ ${totalScore()}`, W - 24, H - 26, 24, { align: 'right', color: '#5a6c9a' });
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
    chips('tadur', 200, 750, 400, 64, [['60s', 60], ['120s', 120], ['180s', 180]], save.ta.dur, v => { save.ta.dur = v; persist(); });
    txt(t('ta_length'), 130, 782, 22, { color: '#4a5a88', max: 130 });
    txt(t('credits_info'), W / 2, 860, 22, { color: '#5a6c9a', max: 640 });
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
  ui(id, 70, y, 580, 80, {}, (x, yy, w, h) => {
    sketchBox(x, yy, w, h, { r: 24, seed: y | 0 }); txt(label, x + 30, yy + h / 2 + 2, 28, { align: 'left', max: w - 200 });
    const tx = x + w - 140;
    sketchBox(tx, yy + 16, 110, 48, { r: 24, fill: on ? '#7ad39a' : '#e5e9f2', shadow: false, lw: 3 });
    ctx.save(); ctx.beginPath(); ctx.arc(on ? tx + 86 : tx + 24, yy + 40, 19, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    txt(on ? t('on') : t('off'), on ? tx + 38 : tx + 72, yy + 41, 16, { max: 44 });
  }, onTap);
}
function valueRow(id, y, label, value, onTap, drawExtra) {
  ui(id, 70, y, 580, 80, {}, (x, yy, w, h) => {
    sketchBox(x, yy, w, h, { r: 24, seed: y | 0 }); txt(label, x + 30, yy + h / 2 + 2, 28, { align: 'left', max: 260 });
    if (drawExtra) drawExtra(x, yy, w, h);
    txt(value, x + w - 30, yy + h / 2 + 2, 24, { align: 'right', color: '#2366c9', max: 240 });
  }, onTap);
}
SCENES.settings = {
  confirm: 0,
  draw(gt) {
    drawGrid(40, 0, 0); header(t('settings'), () => go('menu'));
    let y = 170; const st = 92;
    const L = LANGS.find(l => l.code === (save.lang || 'en'));
    valueRow('slang', y, t('language'), L.name, () => { SCENES.lang.from = 'settings'; go('lang'); }, (x, yy, w, h) => drawFlag(L.code, x + w - 290, yy + 22, 54, 36)); y += st;
    toggleRow('ssound', y, t('sound'), save.settings.sound, () => { save.settings.sound = !save.settings.sound; persist(); }); y += st;
    toggleRow('smusic', y, t('music'), save.settings.music !== false, () => { save.settings.music = save.settings.music === false; persist(); }); y += st;
    toggleRow('svib', y, t('vibration'), save.settings.vib, () => { save.settings.vib = !save.settings.vib; persist(); vib(60); }); y += st;
    toggleRow('sshake', y, t('shake'), save.settings.shake, () => { save.settings.shake = !save.settings.shake; persist(); }); y += st;
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
    txt('Ink Squadron v2.0', W / 2, H - 50, 22, { color: '#7a88aa' });
  },
  back() { go('menu'); return true; }
};

/* ---- 1 VS 1 SETUP ---- */
SCENES.setup = {
  draw(gt) {
    drawGrid(40, 0, 0); header(t('vs'), () => go('menu'));
    const net = save.vs.net && netAvailable();
    txt(net ? t('vs_sub_net') : t('vs_sub'), W / 2, 170, 23, { color: '#5a6c9a', max: 640 });
    let y = 200;
    for (let i = 1; i <= 5; i++) {
      const x = 60 + (i - 1) * 124;
      ui('ships' + i, x, y, 112, 128, {}, (bx, by, w, h) => {
        const on = save.vs.ships >= i, sel = save.vs.ships === i;
        sketchBox(bx, by, w, h, { r: 22, fill: sel ? YEL : on ? '#fff6d0' : '#fbfdff', seed: i * 5 });
        drawShip(bx + w / 2, by + 54, 22, -1, { color: on ? RED : '#aab4c8', alpha: on ? 1 : .6, t: gt, exhaust: on });
        txt(String(i), bx + w / 2, by + h - 20, 28);
      }, () => { save.vs.ships = i; persist(); });
    }
    const row = (yy, label) => txt(label, 60, yy + 32, 22, { align: 'left', color: '#4a5a88', max: 190 });
    y = 360; row(y, t('battlefield')); chips('len', 260, y, 400, 64, [[t('short'), 0], [t('medium'), 1], [t('long'), 2]], save.vs.len, v => { save.vs.len = v; persist(); });
    y += 88; row(y, t('powerups')); chips('pw', 260, y, 400, 64, [[t('on'), true], [t('off'), false]], save.vs.pw, v => { save.vs.pw = v; persist(); });
    y += 88; row(y, t('mode')); chips('rt', 260, y, 400, 64, [[t('turn_based'), false], [t('real_time'), true]], !!save.vs.rt, v => { save.vs.rt = v; if (v) save.vs.net = false; persist(); });
    y += 88; if (!save.vs.rt) { row(y, t('shot_clock')); chips('clk', 260, y, 400, 64, [[t('off'), 0], ['10s', 10], ['20s', 20]], save.vs.clock || 0, v => { save.vs.clock = v; persist(); }); }
    y += 88; row(y, t('device'));
    if (netAvailable()) chips('dev', 260, y, 400, 64, [[t('this_phone'), false], [t('wifi_bt'), true]], !!save.vs.net, v => { save.vs.net = v; if (v) save.vs.rt = false; persist(); });
    else txt(t('net_android_only'), 460, y + 32, 20, { color: '#7a88aa', max: 400 });
    y += 110;
    bigButton('startvs', 110, Math.min(y, H - 130), 500, 100, net ? t('connect') : t('start_battle'), { fill: YEL, hatch: 'rgba(230,160,20,0.35)', primary: true, icon: iconPlay, fs: 38 }, () => {
      if (net) { go('lobby'); return; }
      if (save.vs.rt) startRT('rtvs'); else newMatch(versusCfg());
    });
  },
  back() { go('menu'); return true; }
};

/* ---- HOW TO PLAY ---- */
const HOWTO_PAGES = 7;
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
