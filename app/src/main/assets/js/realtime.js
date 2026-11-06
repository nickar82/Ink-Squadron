/* =========================================================
   REAL-TIME ENGINE — Arcade, Time Attack, real-time 1 VS 1
   Hold a gun to draw. Every gun has its own ink that recharges.
   ========================================================= */
const RT = { INK: 6, DRAW: 9, REFILL: 2.1, BONUS_EVERY: 5 };
function startRT(kind) {
  timers = []; parts = []; floats = [];
  const vs = kind === 'rtvs';
  let C, G, px, ex = [], st;
  if (vs) {
    const cfg = versusCfg(); cfg.mode = 'versus'; const L = makeLayout(cfg, mulberry(cfg.seed)); C = L.C; G = cfg.G; px = L.p; ex = L.e; st = cfg.stP;
  } else { C = 17; G = 11; px = [3, 8, 13]; st = [0, 0, 0]; }
  const sides = [
    { idx: 0, dir: -1, color: RED, ships: [], pw: {}, name: vs ? t('player1') : t('you'), lost: 0, hits: 0 },
    { idx: 1, dir: 1, color: (typeof SEASON !== 'undefined' && SEASON.enemy) || BLUE, ships: [], pw: {}, isAI: !vs, name: vs ? t('player2') : t('enemy'), lost: 0, hits: 0 }
  ];
  px.forEach((x, i) => sides[0].ships.push(mkShip(0, x, st[i] || 0, 'fighter', -1, G)));
  if (vs) ex.forEach((x, i) => sides[1].ships.push(mkShip(1, x, (st.slice().reverse())[i] || 0, 'fighter', 1, G)));
  M = {
    rt: kind, mode: 'rt', C, G, sides, decals: [], splats: [], bunkers: [], t: 0, token: {}, paused: false, over: false, result: null,
    topRow: -2.6, bottomRow: G + 2 + 2.6, wave: 0, score: 0, credits: vs ? 0 : 3, timeLeft: kind === 'timeattack' ? save.ta.dur : 0, dur: save.ta.dur,
    phase: 'play', holds: {}, drags: {}, ai: { think: 1 }, bonus: null, cont: null, banner: null, flash: 0, calm: 0, cuts: 0
  };
  scene = SCENES.arena; computeBL();
  if (!vs) nextWave(); else { M.phase = 'countdown'; M.cd = 3.2; }
  if (typeof onMatchStart === 'function') onMatchStart();
}
function rtWaveTypes(w) {
  const pool = ['fighter', 'fighter']; if (w >= 3) pool.push('armored'); if (w >= 5) pool.push('interceptor'); if (w >= 7) pool.push('tank'); if (w >= 9) pool.push('sniper');
  const n = Math.min(4, 1 + Math.ceil(w / 2)), out = [];
  for (let i = 0; i < n; i++) out.push(pool[Math.random() * pool.length | 0]);
  if (w >= 11 && Math.random() < .5) { out[0] = 'bomber'; if (out.length > 3) out.pop(); }
  return out;
}
function nextWave() {
  M.wave++;
  if (M.rt === 'arcade' && M.wave > 1 && (M.wave - 1) % RT.BONUS_EVERY === 0 && !M.bonusDone) { startBonus(); return; }
  M.bonusDone = false;
  const types = rtWaveTypes(M.wave), P = alive(M.sides[0]).map(s => ({ x: s.x, type: s.type }));
  let ex = null;
  for (let k = 0; k < 300 && !ex; k++) {
    const r = Math.random; let xs = genLine(types, r); const end = xs[xs.length - 1] + TH(types[types.length - 1]);
    if (end > M.C - 1) { if (types.length > 1) types.pop(); continue; }
    const sh = Math.floor(r() * (M.C - 1 - end)); xs = xs.map(x => x + sh);
    const E = xs.map((x, i) => ({ x, type: types[i] }));
    if (covered(P, E)) ex = xs;
  }
  if (!ex) ex = [8];
  const e = M.sides[1]; e.ships = ex.map((x, i) => { const s = mkShip(1, x, 0, types[i] || 'fighter', 1, M.G); s.oy = -7; for (const g of s.guns) g.ink = 2; return s; });
  M.phase = 'wavein'; M.waveT = 0; M.banner = { text: t('wave_n', M.wave), t: 0, side: 1, color: e.color }; sfx.turn();
  M.ai.skill = Math.min(1, .2 + M.wave * .07);
}
function startBonus() {
  M.phase = 'bonus'; M.bonus = { t: 15, spawn: 0, targets: [], pops: 0 }; M.sides[1].ships = [];
  M.banner = { text: t('bonus_stage'), t: 0, side: 0, color: RED }; sfx.win();
  for (const s of M.sides[0].ships) for (const g of s.guns) { if (g.m > 0) eraseGun(s, g); g.ink = RT.INK; }
}
function endBonus() {
  const b = M.bonus, earn = Math.min(3, Math.floor(b.pops / 6));
  M.credits += earn; M.bonus = null; M.bonusDone = true;
  addFloat(W / 2, H / 2, earn ? t('credits_plus', earn) : t('bonus_over'), earn ? RED : NAVY, 46);
  for (const s of M.sides[0].ships) { s.alive = true; s.hp = s.maxHp; s.deadT = 0; }
  M.sides[0].lost = 0; gameEvent('bonus', { pops: b.pops });
  M.wave--; nextWave();
}
/* extend a line by d cells, resolving bunkers, cuts, hits and misses */
function rtExtend(side, ship, g, d) {
  const I = colInfo(side, ship, g); let nm = g.m + d;
  if (I.block && nm >= I.block.dist && !(I.em > 0 && I.clash < I.block.dist)) {
    g.m = g.a = I.block.dist; const p = gunPos(ship, g); const b = I.block.cell; M.bunkers.splice(M.bunkers.indexOf(b), 1);
    explosion(p.x, p.y1, BL.cell * .8, false, side.color); eraseGun(ship, g); sfx.dent(); return false;
  }
  if (I.em > 0 && nm >= I.clash) {
    g.m = g.a = I.clash; const p = gunPos(ship, g); explosion(p.x, p.y1, BL.cell * .8, false, side.color); sfx.clash(); shake(4); vib(30);
    addFloat(p.x + 30, p.y1, t('fx_cut'), NAVY, 32, rnd(-.15, .15)); eraseGun(I.T, I.eg);
    if (side.idx === 0 && M.rt !== 'rtvs') M.score += 50; if (!side.isAI) gameEvent('cut');
  }
  if (I.T && nm >= I.hit) { g.m = g.a = I.hit; eraseGun(ship, g); rtHit(I.T, side, I.c); return false; }
  if (!I.T && nm >= I.exit) { g.m = g.a = I.exit; eraseGun(ship, g); sfx.miss(); return false; }
  g.m = g.a = nm; return true;
}
function rtHit(T, att, c) {
  const tside = sideOf(T), hx = colX(c), hy = rowY(frontRow(T, c)); T.flash = 1; T.hp--;
  if (att.idx === 0 && M.rt !== 'rtvs') M.score += 100;
  if (T.hp > 0) { sfx.dent(); explosion(hx, hy, BL.cell * .9, false, att.color); shake(5); vib(50); addFloat(hx, hy, t('fx_dent'), '#ff7a1f', 32, rnd(-.2, .2)); return; }
  T.alive = false; T.deadT = 0; T.killColor = att.color;
  for (const g of T.guns) if (g.m > 0) eraseGun(T, g);
  const cc = shipCenter(T); explosion(cc.x, cc.y, BL.cell * (T.w === 5 ? 3.2 : 2.2), true, att.color); sfx.boom(true); shake(14); vib(120);
  M.splats.push({ x: T.x, r: T.gunRow - tside.dir * .4, size: 1.6, seed: T.seed, color: att.color });
  if (M.splats.length > 40) M.splats.shift();
  addFloat(cc.x, cc.y, ['BOOM!', 'KABOOM!', 'POW!', 'WHAM!'][Math.random() * 4 | 0], att.color === RED ? RED : NAVY, 48, rnd(-.2, .2));
  att.hits++; tside.lost++;
  if (att.idx === 0 && M.rt !== 'rtvs') M.score += 250;
  if (!att.isAI) gameEvent('kill', { type: T.type, rt: true });
}
function rtMove(ship, d) {
  if (!canMove(ship, d)) return;
  for (const g of ship.guns) if (g.m > 0) eraseGun(ship, g);
  ship.x += d; ship.ox = -d; sfx.move();
  const opp = M.sides[1 - ship.side];
  for (const s of alive(opp)) for (const g of s.guns) { if (g.m <= 0 || g.dead) continue; const I = colInfo(opp, s, g); if (I.T === ship && g.m >= I.hit) { g.m = g.a = I.hit; eraseGun(s, g); rtHit(ship, opp, I.c); } }
}
function rtAI(dt) {
  const e = M.sides[1], p = M.sides[0], sk = M.ai.skill, A = M.ai;
  A.think -= dt;
  for (const s of alive(e)) for (const g of s.guns) if (g.drawLeft > 0) {
    const d = Math.min(RT.DRAW * dt, g.drawLeft, g.ink); if (d <= 0) { g.drawLeft = 0; continue; }
    g.ink -= d; g.drawLeft -= d; if (!rtExtend(e, s, g, d)) g.drawLeft = 0; g.drawing = true;
  }
  if (A.think > 0) return;
  A.think = lerp(1.5, .42, sk) * rnd(.7, 1.3);
  let best = null, bs = -1e9;
  for (const s of alive(e)) for (const g of s.guns) {
    if (g.dead || g.drawLeft > 0 || g.ink < 1) continue;
    const I = colInfo(e, s, g); let sc = -1e9, amt = 0;
    if (I.T) {
      const rem = I.hit - g.m, bonus = s.type === 'sniper' ? 1.5 : 0;
      if (I.em > 0) { const threat = I.hit - I.em; const need = I.clash - g.m; if (threat <= 3 && need <= g.ink) { sc = 900 - threat * 50; amt = need + .2; } }
      if (sc < 0) { sc = 200 - rem * 10 + (rem <= g.ink ? 300 : 0) + bonus * 40; amt = Math.min(g.ink, rem, 2 + Math.random() * 3 + bonus); }
    }
    sc += Math.random() * 120 * (1 - sk);
    if (sc > bs) { bs = sc; best = { s, g, amt }; }
  }
  if (best && bs > -1e8) best.g.drawLeft = best.amt;
  // interceptors hop
  for (const s of alive(e)) if (s.type === 'interceptor' && Math.random() < .12) { const ds = [-1, 1].filter(d => canMove(s, d)); if (ds.length) rtMove(s, ds[Math.random() * ds.length | 0]); }
}
function rtUpdate(dt) {
  if (M.phase === 'countdown') { M.cd -= dt; if (M.cd <= 0) { M.phase = 'play'; sfx.turn(); } return; }
  if (M.phase === 'continue') { M.cont.t -= dt; if (Math.ceil(M.cont.t) !== M.cont.last) { M.cont.last = Math.ceil(M.cont.t); if (M.cont.t > 0) sfx.click(); } if (M.cont.t <= 0) rtGameOver(); return; }
  if (M.phase === 'over') return;
  for (const sd of M.sides) for (const s of sd.ships) { s.ox *= Math.pow(.0005, dt); if (Math.abs(s.ox) < .01) s.ox = 0; }
  if (M.phase === 'wavein') {
    M.waveT += dt; for (const s of M.sides[1].ships) s.oy = -7 * Math.max(0, 1 - easeOut(Math.min(1, M.waveT / 1.1)));
    if (M.waveT > 1.2) { M.phase = 'play'; for (const s of M.sides[1].ships) s.oy = 0; }
  }
  if (M.rt === 'rtvs' && M.phase === 'play') { M.vsT = (M.vsT || 0) + dt; if (M.vsT > 90 && !M.sudden) { M.sudden = true; M.banner = { text: t('sudden_death'), t: 0, side: 0, color: RED }; sfx.zap(); } }
  const refill = M.phase === 'bonus' ? 4 : M.sudden ? RT.REFILL * 2.5 : RT.REFILL;
  // human drawing
  for (const sd of M.sides) {
    if (sd.isAI) continue;
    for (const s of alive(sd)) for (const g of s.guns) {
      const held = Object.values(M.holds).some(h => h.g === g);
      g.drawing = false;
      if (held && g.ink > 0 && M.phase !== 'wavein') {
        const d = Math.min(RT.DRAW * dt, g.ink); g.ink -= d; g.drawing = true;
        if (M.phase === 'bonus') { const I = colInfo(sd, s, g); if (g.m + d >= I.exit) { eraseGun(s, g); } else g.m = g.a = g.m + d; }
        else rtExtend(sd, s, g, d);
        if (Math.random() < .25) sfx.scribble(.05);
      } else g.ink = Math.min(RT.INK, g.ink + refill * dt);
    }
  }
  if (M.phase === 'play') {
    const e = M.sides[1];
    if (e.isAI) {
      const er = Math.min(2.3, .85 + M.wave * .09);
      for (const s of alive(e)) for (const g of s.guns) if (!(g.drawLeft > 0)) g.ink = Math.min(RT.INK, g.ink + er * dt);
      rtAI(dt);
    }
    if (M.rt === 'timeattack') { M.timeLeft -= dt; if (M.timeLeft <= 0) { M.timeLeft = 0; rtGameOver(true); return; } }
    if (!alive(M.sides[1]).length) {
      if (M.rt === 'rtvs') { rtFinishVs(0); return; }
      if (M.rt === 'timeattack') { M.timeLeft += 5; addFloat(W / 2, H * .3, '+5s', RED, 44); }
      gameEvent('wave', { wave: M.wave, mode: M.rt });
      M.score += 100 * M.wave; nextWave();
    } else if (!alive(M.sides[0]).length) {
      if (M.rt === 'rtvs') { rtFinishVs(1); return; }
      M.phase = 'continue'; M.cont = { t: 10, last: 11 }; M.holds = {}; sfx.lose();
    }
  }
  if (M.phase === 'bonus') {
    const B = M.bonus; B.t -= dt; B.spawn -= dt;
    if (B.spawn <= 0 && B.t > 1) {
      B.spawn = rnd(.45, .8); const fromL = Math.random() < .5;
      B.targets.push({ x: fromL ? -1 : M.C, y: rnd(M.topRow + 2, M.G * .55), v: (fromL ? 1 : -1) * rnd(1.6, 3.4), hue: ['#ff6a6a', '#ffcf3a', '#5ad08a', '#6ab0ff'][Math.random() * 4 | 0], seed: (Math.random() * 1e6) | 0 });
    }
    for (const tg of B.targets) {
      tg.x += tg.v * dt; const c = Math.round(tg.x);
      if (c >= 0 && c < M.C && !tg.pop) {
        const hit = lineCovers(c, tg.y);
        if (hit) { tg.pop = true; B.pops++; M.score += 100; const x = colX(tg.x), y = rowY(tg.y); explosion(x, y, BL.cell * .9, false, tg.hue); sfx.pop(); addFloat(x, y - 20, '+100', NAVY, 28); }
      }
    }
    B.targets = B.targets.filter(tg => !tg.pop && tg.x > -2 && tg.x < M.C + 1);
    if (B.t <= 0) endBonus();
  }
}
function rtFinishVs(winner) { M.phase = 'over'; M.over = true; setTimeout(() => { if (!M) return; M.result = { winner, t: 0 }; sfx.win(); confetti(); gameEvent('vsend', { winner, rt: true }); }, 700); }
function rtGameOver(timeUp) {
  M.phase = 'over'; M.over = true; M.cont = null;
  const key = M.rt === 'arcade' ? 'arcade' : 'ta' + M.dur, prev = save.hi[key] || 0;
  const stars = M.rt === 'timeattack' ? (M.wave - 1 >= 10 ? 3 : M.wave - 1 >= 6 ? 2 : M.wave - 1 >= 3 ? 1 : 0) : 0;
  save.hi[key] = Math.max(prev, M.score); persist();
  M.result = { t: 0, score: M.score, best: save.hi[key], newBest: M.score > prev, wave: M.wave, stars, timeUp };
  gameEvent('rtover', { mode: M.rt, score: M.score, wave: M.wave, dur: M.dur });
  sfx[M.score > prev ? 'win' : 'lose']();
}
function rtContinue() {
  if (M.credits <= 0) return; M.credits--; M.phase = 'play'; M.cont = null;
  for (const s of M.sides[0].ships) { s.alive = true; s.hp = s.maxHp; s.deadT = 0; for (const g of s.guns) { g.m = g.a = 0; g.ink = RT.INK; } }
  for (const s of M.sides[1].ships) for (const g of s.guns) if (g.m > 0) eraseGun(s, g);
  M.sides[0].lost = 0; M.banner = { text: t('continue_go'), t: 0, side: 0, color: RED }; sfx.turn();
}
SCENES.arena = {
  multi: true,
  draw(gt, dt) {
    if (!M) return;
    if (!M.paused && !M.result) { M.t += dt; rtUpdate(dt); }
    computeBL();
    const cell = BL.cell, vs = M.rt === 'rtvs';
    const sx = shakeA ? rnd(-shakeA, shakeA) : 0, sy = shakeA ? rnd(-shakeA, shakeA) : 0;
    drawGrid(cell, BL.bx + sx, BL.by - (M.topRow - Math.floor(M.topRow)) * cell + sy);
    ctx.save(); ctx.translate(sx, sy);
    drawBoardBase(dt);
    const lw = Math.max(3, cell * .14);
    // ink gauges
    for (const sd of M.sides) {
      if (sd.isAI && !vs) continue;
      for (const s of alive(sd)) for (const g of s.guns) {
        const p = gunPos(s, g), k = g.ink / RT.INK, r = cell * .5;
        ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(27,42,94,.15)'; ctx.beginPath(); ctx.arc(p.x, p.y0, r, 0, 7); ctx.stroke();
        ctx.strokeStyle = g.drawing ? YEL : sd.color; ctx.beginPath(); ctx.arc(p.x, p.y0, r, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
    drawLines(lw);
    drawShips(dt);
    for (const sd of M.sides) for (const s of alive(sd)) for (const g of s.guns) if (g.drawing && g.m > 0) { const p = gunPos(s, g); drawPen(p.x, p.y1, sd.color, sd.dir); }
    if (M.bonus) for (const tg of M.bonus.targets) {
      const x = colX(tg.x), y = rowY(tg.y), r = cell * .7;
      ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + r); ctx.quadraticCurveTo(x + 6, y + r * 1.6, x, y + r * 2.2); ctx.stroke();
      ellipse(x, y, r * .8, r); ctx.fillStyle = tg.hue; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(x - r * .3, y - r * .35, r * .18, r * .28); ctx.fill(); ctx.restore();
    }
    drawFx();
    ctx.restore();
    // HUD
    if (vs) {
      for (const sd of M.sides) {
        ctx.save(); if (sd.idx === 1) { ctx.translate(W, H); ctx.rotate(Math.PI); }
        const ry = H - 90; const col = sd.color === RED ? RED : '#2366c9';
        ctx.beginPath(); ctx.moveTo(240, ry - 26); ctx.lineTo(480, ry - 26); ctx.lineTo(502, ry); ctx.lineTo(480, ry + 26); ctx.lineTo(240, ry + 26); ctx.lineTo(218, ry); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke();
        txt(sd.name, W / 2, ry + 2, 32, { color: '#fff', max: 240 });
        ui('rpause' + sd.idx, 24, ry - 36, 72, 72, { rot: sd.idx === 1 }, (x, y, w, h) => { sketchBox(x, y, w, h, { r: 18 }); iconPause(x + w / 2, y + h / 2, 40); }, () => { M.paused = true; });
        const n = sd.ships.length; sd.ships.forEach((s, i) => { const x = W - 36 - (n - 1 - i) * 24; ctx.save(); ctx.globalAlpha = s.alive ? 1 : .35; drawShip(x, ry - 6, 9, -1, { color: sd.color }); ctx.restore(); });
        txt(t('hold_gun'), W / 2, ry - 50, 22, { color: '#5a6c9a', max: 600 });
        ctx.restore();
      }
    } else {
      ui('rpause', 26, 30, 84, 80, {}, (x, y, w, h) => { sketchBox(x, y, w, h, { r: 20 }); iconPause(x + w / 2, y + h / 2, 46); }, () => { M.paused = true; });
      sketchBox(126, 36, 230, 68, { r: 14, seed: 4 });
      if (M.rt === 'timeattack') { const s = Math.ceil(M.timeLeft); txt(`⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, 241, 72, 32, { color: s <= 10 ? RED : NAVY }); }
      else txt(M.bonus ? t('bonus') + ' ' + Math.ceil(M.bonus.t) : t('wave_n', M.wave), 241, 72, 30, { max: 210 });
      sketchBox(372, 36, 150, 68, { r: 14, seed: 8 }); for (let i = 0; i < Math.min(M.credits, 5); i++) coin(400 + i * 24, 70, 13); if (M.credits > 5) txt('×' + M.credits, 500, 72, 22);
      sketchBox(536, 34, 160, 72, { r: 18, seed: 9 }); star(568, 70, 18, true); txt(String(M.score), 632, 72, 28, { max: 100 });
      txt(M.bonus ? t('bonus_hint') : M.rt === 'timeattack' ? t('wave_n', M.wave) + ' · ' + t('hold_gun') : t('hold_gun'), W / 2, H - 60, 24, { color: '#5a6c9a', stroke: '#f3f6fc', sw: 6, max: 660 });
    }
    if (M.banner) {
      const b = M.banner; b.t += dt; const k = b.t;
      if (k > 1.2) M.banner = null; else {
        const a = k < .2 ? easeBack(k / .2) : 1, al = k > .9 ? 1 - (k - .9) / .3 : 1;
        ctx.save(); ctx.translate(W / 2, rowY(M.G / 2)); ctx.scale(a, a); ctx.globalAlpha = Math.max(0, al);
        sketchBox(-240, -50, 480, 100, { r: 26, fill: b.color === RED ? '#ffe1de' : '#dde9ff' });
        txt(b.text, 0, 3, 50, { color: b.color === RED ? RED : '#2366c9', stroke: '#fff', sw: 8, max: 440 }); ctx.restore();
      }
    }
    if (M.phase === 'countdown') { const n = Math.ceil(M.cd); for (const r of [0, Math.PI]) { ctx.save(); ctx.translate(W / 2, rowY(M.G / 2)); ctx.rotate(r); txt(n > 0 ? String(n) : 'GO!', 0, 0, 120, { color: RED, stroke: '#fff', sw: 12 }); ctx.restore(); } }
    if (M.phase === 'continue') drawContinue();
    if (M.paused && !M.result) drawRTPause();
    if (M.result) drawRTResult(dt);
  },
  pdown(id, p) {
    if (!M || M.paused || M.result || M.phase === 'continue' || M.phase === 'over' || M.phase === 'countdown') return;
    const cands = M.rt === 'rtvs' ? M.sides : [M.sides[0]];
    let best = null;
    for (const sd of cands) { const g = pickGun(sd, p, 46); if (g) { const q = gunPos(g.ship, g.g), d = Math.abs(p.x - q.x); if (!best || d < best.d) best = { ...g, d, sd }; } }
    if (best) { M.holds[id] = { g: best.g, ship: best.ship }; return; }
    for (const sd of cands) { const s = pickShip(sd, p); if (s) { M.drags[id] = { ship: s, x0: p.x }; return; } }
  },
  pmove(id, p) {
    if (!M) return; const d = M.drags[id];
    if (d && d.ship.alive) { const dx = p.x - d.x0; if (Math.abs(dx) > BL.cell * .8) { const dir = Math.sign(dx); if (canMove(d.ship, dir)) rtMove(d.ship, dir); d.x0 += dir * BL.cell; } }
  },
  pup(id) { if (!M) return; delete M.holds[id]; delete M.drags[id]; },
  back() { if (!M) { go('menu'); return true; } if (M.result) { quitMatch(); return true; } M.paused = !M.paused; return true; }
};
function coin(x, y, r) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = YEL; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, r * .55, 0, 7); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
function drawContinue() {
  const c = M.cont, y = H / 2 - 270; overlayCard(y, 540);
  txt(t('continue_q'), W / 2, y + 80, 64, { color: RED, stroke: '#fff', sw: 10, max: 460 });
  const n = Math.max(0, Math.ceil(c.t)), k = c.t - Math.floor(c.t);
  txt(String(n), W / 2, y + 220, 150 * (0.85 + k * .25), { color: NAVY, stroke: '#fff', sw: 12 });
  for (let i = 0; i < Math.min(M.credits, 8); i++) coin(W / 2 + (i - (Math.min(M.credits, 8) - 1) / 2) * 34, y + 330, 15);
  txt(t('credits_n', M.credits), W / 2, y + 368, 24, { color: '#5a6c9a' });
  bigButton('cont', 150, y + 400, 420, 84, t('continue'), { fill: YEL, icon: iconPlay, fs: 36, disabled: M.credits <= 0 }, () => rtContinue());
  hits[hits.length - 1].disabled = M.credits <= 0;
  ui('giveup', 250, y + 492, 220, 40, {}, (x, yy, w, h) => txt(t('give_up'), x + w / 2, yy + h / 2, 22, { color: '#5a6c9a' }), () => rtGameOver());
}
function drawRTPause() {
  const y = H / 2 - 220; overlayCard(y, 440);
  txt(t('paused'), W / 2, y + 70, 60, { stroke: '#fff', sw: 8, max: 460 });
  bigButton('rresume', 170, y + 130, 380, 86, t('resume'), { fill: YEL, icon: iconPlay, fs: 36 }, () => { M.paused = false; });
  bigButton('rrestart', 170, y + 236, 380, 76, t('restart'), { fs: 30 }, () => { const k = M.rt; M.token = null; startRT(k); });
  bigButton('rquit', 170, y + 330, 380, 70, t('quit'), { fs: 28 }, () => quitMatch());
}
function drawRTResult(dt) {
  const r = M.result; r.t += dt; const k = Math.min(1, r.t / .4), vs = M.rt === 'rtvs';
  ctx.save(); ctx.fillStyle = `rgba(243,246,252,${.8 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.translate(W / 2, H / 2); if (vs && r.winner === 1) ctx.rotate(Math.PI); ctx.scale(easeBack(k), easeBack(k)); ctx.translate(-W / 2, -H / 2);
  const y = H / 2 - 290; sketchBox(80, y, 560, 580, { r: 36 });
  if (vs) {
    txt(r.winner === 0 ? t('p1_wins') : t('p2_wins'), W / 2, y + 80, 52, { color: r.winner === 0 ? RED : '#2366c9', stroke: '#fff', sw: 10, max: 500 });
    drawShip(W / 2, y + 220, 44, -1, { color: M.sides[r.winner].color, t: r.t, exhaust: true });
  } else {
    txt(r.timeUp ? t('time_up') : t('game_over'), W / 2, y + 80, 62, { color: RED, stroke: '#fff', sw: 10, max: 500 });
    if (M.rt === 'timeattack') for (let i = 0; i < 3; i++) star(W / 2 + (i - 1) * 100, y + 175, 38, i < r.stars, { lw: 4 });
    txt(t('score') + ' ' + Math.round(r.score * clamp(r.t / 1.2, 0, 1)), W / 2, y + 250, 44, { color: '#2366c9', max: 500 });
    txt((r.newBest ? '★ ' + t('new_best') + ' ★' : t('best') + ' ' + r.best), W / 2, y + 305, 28, { color: r.newBest ? RED : '#5a6c9a', max: 500 });
    txt(t('wave_n', r.wave), W / 2, y + 345, 26, { max: 500 });
  }
  const by = y + 400;
  bigButton('rtagain', 140, by, 440, 84, vs ? t('rematch') : t('play_again'), { fill: YEL, icon: iconPlay, fs: 36 }, () => { const kk = M.rt; M.token = null; startRT(kk); });
  bigButton('rtmenu', 140, by + 100, 440, 70, t('menu'), { fs: 28 }, () => quitMatch());
  ctx.restore();
  if (vs && r.winner === 1) for (const h of hits) if (['rtagain', 'rtmenu'].includes(h.id)) h.rot = true;
}
