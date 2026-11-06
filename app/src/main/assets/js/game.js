/* =========================================================
   GAME SCENE — turn-based board (Classic, 1 VS 1, Wi-Fi/Bluetooth)
   ========================================================= */
function drawBoardBase(dt, opts = {}) {
  const cell = BL.cell, vs = M.mode === 'versus' || M.rt === 'rtvs';
  const midY = rowY(M.G / 2);
  ctx.save(); ctx.strokeStyle = 'rgba(27,42,94,0.55)'; ctx.lineWidth = 3; ctx.setLineDash([16, 10]); ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke(); ctx.restore();
  if (vs) {
    ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + s * (60 + i * 6), midY - 10 + i * 9); ctx.lineTo(W / 2 + s * (100 - i * 6), midY - 14 + i * 9); ctx.stroke(); } ctx.restore();
    sketchBox(W / 2 - 50, midY - 30, 100, 60, { r: 16 }); txt('VS', W / 2, midY + 2, 36, { color: '#2b5fbf' });
  }
  // stains
  for (const s of M.splats) {
    const x = colX(s.x), y = rowY(s.r), R = s.size * cell;
    if (SPRITES.ready) drawSprite('splat' + (1 + (s.seed % 3 + 3) % 3), 5, x, y, R * 2.4, s.color || NAVY, .14, (s.seed % 10) * .6, s.seed % 2 === 0);
    else { ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = NAVY; ctx.beginPath(); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, rr = R * (.7 + .35 * h1(s.seed + i)); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  const lw = Math.max(3, cell * .14);
  for (const d of M.decals) {
    const x = colX(d.c), y1 = rowY(d.r1), y2 = rowY(d.r2);
    inkLine(x, y1, x, y2, d.color, lw * .8, d.seed, { alpha: .26 });
    const my = (y1 + y2) / 2; ctx.save(); ctx.globalAlpha = .32; ctx.strokeStyle = d.color; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 5; i++) ctx.lineTo(x + (i % 2 ? 8 : -8), my - 10 + i * 5); ctx.stroke(); ctx.restore();
  }
  // bunkers
  for (const b of M.bunkers) {
    const x = BL.bx + b.c * cell, y = rowY(b.r);
    ctx.save(); ctx.fillStyle = '#dfe6f5'; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i = -1; i < 4; i++) { ctx.moveTo(x + i * cell / 3, y + cell); ctx.lineTo(x + (i + 1) * cell / 3, y); }
    ctx.globalAlpha = .45; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 2.4; ctx.strokeRect(x + 1 + h1(b.seed) * 1.2, y + 1, cell - 2, cell - 2); ctx.restore();
  }
}
function drawLines(lw) {
  for (const sd of M.sides) for (const s of sd.ships) for (const g of s.guns) {
    if (g.a <= 0) continue; const p = gunPos(s, g);
    inkLine(p.x, p.y0, p.x, p.y1, sd.color, lw, g.seed);
    ctx.save(); ctx.fillStyle = sd.color; ctx.beginPath(); ctx.arc(p.x, p.y1, lw * .55, 0, 7); ctx.fill(); ctx.restore();
  }
}
function drawShips(dt, hlFn) {
  const cell = BL.cell;
  for (const sd of M.sides) for (const s of sd.ships) {
    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 2.5);
    if (!s.alive) s.deadT += dt;
    const x = colX(s.x + s.ox), y = rowY(s.gunRow + s.oy);
    if (hlFn) hlFn(s, sd, x, y);
    drawShip(x, y, cell, sd.dir, { type: s.type, color: sd.color, t: M.t + s.id, exhaust: true, dead: !s.alive, deadT: s.deadT, killColor: s.killColor, flash: s.flash, shield: s.shield, maxHp: s.maxHp, hp: s.hp, armor: s.armor, damage: s.parts ? 0 : s.maxHp - s.hp, seed: s.seed, parts: s.parts });
  }
}
SCENES.game = {
  draw(gt, dt) {
    if (!M) return;
    if (!M.paused) M.t += dt;
    computeBL(); netPump();
    const cell = BL.cell, vs = M.mode === 'versus';
    const sx = shakeA ? rnd(-shakeA, shakeA) : 0, sy = shakeA ? rnd(-shakeA, shakeA) : 0;
    drawGrid(cell, BL.bx + sx, BL.by - (M.topRow - Math.floor(M.topRow)) * cell + sy);
    ctx.save(); ctx.translate(sx, sy);
    drawBoardBase(dt);
    const midY = rowY(M.G / 2), lw = Math.max(3, cell * .14);
    const side = M.sides[M.turn], human = isHuman(side) && !M.over;
    const aiming = human && (M.phase === 'aim' || (M.phase === 'roll' && M.tool === 'rocket'));
    const flip = vs && side.idx === 1 ? Math.PI : 0;
    if (human && (M.phase === 'roll' || M.phase === 'aim')) {
      for (const s of alive(side)) for (const g of s.guns) {
        if (g.dead) continue;
        const I = colInfo(side, s, g), p = gunPos(s, g); const end = I.block ? I.block.dist : I.T ? I.hit : I.exit;
        const yEnd = rowY(frontRow(s, I.c) + side.dir * end);
        if (aiming) inkLine(p.x, p.y1, p.x, yEnd, I.T ? side.color : '#99a', 2, g.seed, { alpha: .35, dash: [6, 8], jit: 0 });
        if (aiming) { ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y1, cell * .45 + Math.sin(M.t * 7) * 3, 0, 7); ctx.strokeStyle = YEL; ctx.lineWidth = 4; ctx.globalAlpha = .9; ctx.stroke(); ctx.restore(); }
        const need = I.block ? '▦' : I.T ? I.hit - g.m : null, bx = p.x, by = p.y1 + side.dir * cell * .62 * (aiming ? 1.3 : 1);
        ctx.save(); ctx.beginPath(); ctx.arc(bx, by, cell * .32, 0, 7); ctx.fillStyle = need == null ? '#dde3ee' : need <= 6 ? '#ffe9a8' : '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        txt(need == null ? '–' : String(need), bx, by + 1, cell * .36, { italic: false, rot: flip });
      }
    }
    drawLines(lw);
    if (M.preview && aiming) {
      const { ship, g } = M.preview, amt = M.phase === 'aim' ? M.dice[0] : 6, o = outcome(side, ship, g, amt, M.phase !== 'aim');
      const p = gunPos(ship, g, o.at), p0 = gunPos(ship, g);
      inkLine(p.x, p0.y1, p.x, p.y1, side.color, lw, 99, { alpha: .45, dash: [10, 8], jit: 0 });
      const lab = (o.cut ? t('pv_cut') + ' ' : '') + (o.type === 'hit' ? (o.I.T.shield ? t('pv_block') : (o.I.T.parts || o.I.T.hp > 1) ? t('fx_dent') : t('pv_hit')) : o.type === 'miss' ? t('fx_miss') : o.type === 'block' ? t('pv_bunker') : '+' + amt);
      txt(lab, p.x, p.y1 + side.dir * 26, 30, { color: o.type === 'hit' ? RED : NAVY, stroke: '#fff', sw: 7, rot: flip });
    }
    drawShips(dt, (s, sd, x, y) => {
      if (M.sel === s) { ctx.save(); ctx.strokeStyle = YEL; ctx.lineWidth = 6; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -M.t * 30; ctx.beginPath(); ctx.arc(x, y - sd.dir * cell * .3, cell * (s.w === 5 ? 2.5 : 1.7), 0, 7); ctx.stroke(); ctx.restore(); }
      const hl = human && sd === side && (M.tool === 'shield' || (M.tool === 'move' && !M.sel)) && s.alive;
      if (hl) { ctx.save(); ctx.globalAlpha = .5 + .3 * Math.sin(M.t * 6); ctx.fillStyle = M.tool === 'shield' ? '#bfe0ff' : '#fff1a8'; ctx.beginPath(); ctx.arc(x, y - sd.dir * cell * .3, cell * 1.7, 0, 7); ctx.fill(); ctx.restore(); }
    });
    // raider (shot-clock bomber)
    if (M.raider) {
      const R = M.raider, x = colX(R.vis), y = rowY(R.row);
      ctx.save(); ctx.strokeStyle = 'rgba(227,52,44,.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(R.dir > 0 ? W : 0, y); ctx.stroke(); ctx.restore();
      drawRaider(x, y, cell * 1.5, R.dir, M.t, RED);
      const left = raiderLeft(); ctx.save(); ctx.beginPath(); ctx.arc(x, y - cell * 1.1, 17, 0, 7); ctx.fillStyle = YEL; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
      txt(String(left), x, y - cell * 1.1 + 1, 20, { italic: false });
    }
    if (M.bomb) { ctx.save(); ellipse(M.bomb.x, M.bomb.y, 8, 12); ctx.fillStyle = '#2b2b3a'; ctx.fill(); ctx.restore(); }
    if (M.pen && !M.rocketFx) { const p = gunPos(M.pen.ship, M.pen.g); drawPen(p.x, p.y1, sideOf(M.pen.ship).color, sideOf(M.pen.ship).dir); }
    if (M.rocketFx) { const p = gunPos(M.rocketFx.ship, M.rocketFx.g); const d = sideOf(M.rocketFx.ship).dir; ctx.save(); ctx.translate(p.x, p.y1); ctx.rotate(d < 0 ? -Math.PI / 4 : Math.PI * .75); iconRocket(0, 0, cell * 1.4); ctx.restore(); }
    if (human && M.tool === 'move' && M.sel && M.phase === 'roll') {
      const s = M.sel, x = colX(s.x), y = rowY(s.gunRow) - side.dir * cell * .3, off = cell * (half(s) + 1.3) + 34;
      for (const d of [-1, 1]) {
        if (!canMove(s, d)) continue;
        ui('mv' + d, x + d * off - 34, y - 34, 68, 68, {}, (bx, by, w, h) => { sketchBox(bx, by, w, h, { r: 34, fill: YEL }); ctx.save(); ctx.translate(bx + w / 2, by + h / 2); if (d > 0) ctx.scale(-1, 1); iconBack(0, 0, 44); ctx.restore(); }, () => humanMove(s, d));
      }
    }
    drawFx();
    ctx.restore();
    if (M.flash > 0) { ctx.save(); ctx.globalAlpha = M.flash * .5; ctx.fillStyle = '#fff7b0'; ctx.fillRect(0, 0, W, H); ctx.restore(); M.flash -= dt * 1.5; }
    if (M.diceUI && M.mode === 'campaign' && M.diceUI.side === 1) {
      const u = M.diceUI; for (let i = 0; i < u.n; i++) drawDie(W - 70 - i * 84, BL.top + 50, 70, u.faces[i], { rot: u.rot[i], color: '#2f6fe0', used: i < u.used });
      if (u.bonus && !u.rolling) txt('+' + u.bonus, W - 70 - u.n * 84 + 30, BL.top + 50, 30, { color: RED, stroke: '#fff', sw: 6 });
    }
    // shot clock
    if (M.clock && human && (M.phase === 'roll' || M.phase === 'aim') && !M.paused && !M.result) {
      M.clock.left -= dt; if (M.clock.left <= 0) { M.clock.left = M.clock.limit; clockExpired(); }
    }
    if (vs) { for (const sd of M.sides) { ctx.save(); if (sd.idx === 1) { ctx.translate(W, H); ctx.rotate(Math.PI); } drawPlayerHud(sd); ctx.restore(); } }
    else { drawTopBar(); drawTray(M.sides[0], false); }
    if (M.banner) {
      const b = M.banner; b.t += dt; const k = b.t;
      if (k > 1.2) M.banner = null; else {
        const a = k < .2 ? easeBack(k / .2) : 1, al = k > .9 ? 1 - (k - .9) / .3 : 1;
        ctx.save(); ctx.translate(W / 2, midY); if (vs && b.side === 1 && !M.net) ctx.rotate(Math.PI); ctx.scale(a, a); ctx.globalAlpha = Math.max(0, al);
        sketchBox(-240, -50, 480, 100, { r: 26, fill: b.color === RED ? '#ffe1de' : '#dde9ff' });
        txt(b.text, 0, 3, 52, { color: b.color === RED ? RED : '#2366c9', stroke: '#fff', sw: 8, max: 440 }); ctx.restore();
      }
    }
    if (M.odNotice > 0) {
      M.odNotice -= dt; const k = 1.6 - M.odNotice, a = k < .2 ? easeBack(k / .2) : 1;
      ctx.save(); ctx.translate(W / 2, midY + (vs ? 0 : 80)); ctx.scale(a, a); ctx.globalAlpha = Math.min(1, M.odNotice * 2);
      burst(0, 0, 150, 16, M.t, '#ffd23a', NAVY, 4); txt(t('overdrive'), 0, -10, 40, { color: RED, stroke: '#fff', sw: 7, max: 260 }); txt(t('overdrive_sub', overdrive()), 0, 30, 22, { color: NAVY, max: 250 });
      ctx.restore();
    }
    if (M.netLost) drawNetLost();
    else if (M.paused) drawPause();
    if (M.result) drawResult(dt);
  },
  down(p) {
    if (!M || !humanTurn()) return;
    const side = M.sides[M.turn];
    if (M.phase === 'aim' || (M.phase === 'roll' && M.tool === 'rocket')) { const g = pickGun(side, p); M.preview = g; return; }
    if (M.phase === 'roll' && (M.tool === 'shield' || M.tool === 'move')) {
      const s = pickShip(side, p);
      if (s && M.tool === 'shield' && !s.shield && side.pw.shield > 0) { humanShield(side, s); M.tool = null; setHint(); }
      else if (s && M.tool === 'move') { M.sel = s; sfx.click(); setHint(); }
      else if (!s) { M.sel = null; setHint(); }
    }
  },
  move(p) { if (M && M.preview) { const g = pickGun(M.sides[M.turn], p); if (!g || g.g !== M.preview.g) M.preview = null; } },
  up(p, cancel) {
    if (!M) return; const pv = M.preview; M.preview = null;
    if (pv && !cancel && humanTurn()) { const g = pickGun(M.sides[M.turn], p); if (g && g.g === pv.g) humanFire(g.ship, g.g); }
  },
  back() { if (!M) { go('menu'); return true; } if (M.result) { quitMatch(); return true; } if (M.net) { M.paused = !M.paused; return true; } M.paused = !M.paused; return true; }
};
function quitMatch(toScene) {
  const wasNet = M && M.net;
  if (M) M.token = null; M = null; timers = [];
  if (wasNet) netStop();
  go(toScene || 'menu');
  Ads.onQuit();
}
function drawPen(x, y, color, dir) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(dir < 0 ? .5 : Math.PI + .5);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, 18); ctx.lineTo(-7, 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2b2b3a'; rrPath(ctx, -9, 18, 18, 70, 5); ctx.fill(); ctx.fillStyle = color; ctx.fillRect(-9, 60, 18, 10); ctx.restore();
}
function pickGun(side, p, maxD) {
  let best = null, bd = maxD || Math.max(34, BL.cell * .8);
  for (const s of alive(side)) for (const g of s.guns) {
    if (g.dead) continue;
    const q = gunPos(s, g); const y0 = Math.min(q.y0, q.y1) - BL.cell * .5, y1 = Math.max(q.y0, q.y1) + BL.cell * .5;
    const dy = p.y < y0 ? y0 - p.y : p.y > y1 ? p.y - y1 : 0, d = Math.hypot(p.x - q.x, dy);
    if (d < bd) { bd = d; best = { ship: s, g }; }
  }
  return best;
}
function pickShip(side, p) {
  let best = null, bd = BL.cell * 2;
  for (const s of alive(side)) { const c = shipCenter(s), d = Math.hypot(p.x - c.x, p.y - c.y); if (d < bd) { bd = d; best = s; } }
  return best;
}
function drawTopBar() {
  ui('pause', 26, 30, 84, 80, {}, (x, y, w, h) => { sketchBox(x, y, w, h, { r: 20 }); iconPause(x + w / 2, y + h / 2, 46); }, () => { M.paused = true; });
  sketchBox(126, 36, 200, 68, { r: 14, seed: 4 }); txt(t('level_n', M.level), 226, 72, 32, { max: 184 });
  const st = liveStars(); for (let i = 0; i < 3; i++) star(386 + i * 46, 70, 22, i < st);
  sketchBox(510, 34, 186, 72, { r: 18, seed: 9 }); star(548, 70, 20, true); txt(String(totalScore() + M.score), 628, 72, 30, { max: 110 });
  const e = M.sides[1].pw; let x = 30;
  ctx.save(); ctx.globalAlpha = .8;
  if (e.rocket) { iconRocket(x + 14, 135, 26); txt('×' + e.rocket, x + 38, 136, 18, { align: 'left' }); x += 66; }
  if (e.shield) { iconShield(x + 14, 135, 26); txt('×' + e.shield, x + 38, 136, 18, { align: 'left' }); x += 66; }
  if (e.bolt) { iconBolt(x + 14, 135, 26); txt('×' + e.bolt, x + 38, 136, 18, { align: 'left' }); x += 66; }
  if (M.cfg.loaded) { txt(t('ace'), x + 10, 136, 18, { align: 'left', color: RED }); }
  if (overdrive()) txt(t('overdrive') + ' +' + overdrive(), W - 30, 136, 20, { align: 'right', color: RED });
  else if (M.reinfLeft > 0) txt(t('reinf_in', Math.max(0, M.reinfNext - M.round)), W - 30, 136, 18, { align: 'right', color: '#5a6c9a' });
  ctx.restore();
}
function drawPlayerHud(sd) {
  const rot = sd.idx === 1, active = M.turn === sd.idx && !M.over;
  const ry = H - 268;
  ctx.save(); ctx.globalAlpha = active ? 1 : .55;
  const col = sd.color === RED ? RED : '#2366c9';
  ctx.beginPath(); ctx.moveTo(240, ry - 26); ctx.lineTo(480, ry - 26); ctx.lineTo(502, ry); ctx.lineTo(480, ry + 26); ctx.lineTo(240, ry + 26); ctx.lineTo(218, ry); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke();
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); const bx = W / 2 + s * (152 + i * 20); ctx.moveTo(bx, ry - 22); ctx.lineTo(bx + s * 16, ry); ctx.lineTo(bx, ry + 22); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.stroke(); }
  txt(sd.name, W / 2, ry + 2, 32, { color: '#fff', max: 240 });
  ctx.restore();
  if (!sd.isRemote) ui('pause' + sd.idx, 24, ry - 36, 72, 72, { rot }, (x, y, w, h) => { sketchBox(x, y, w, h, { r: 18 }); iconPause(x + w / 2, y + h / 2, 40); }, () => { M.paused = true; });
  const n = sd.ships.length;
  sd.ships.forEach((s, i) => { const x = W - 36 - (n - 1 - i) * 24; ctx.save(); ctx.globalAlpha = s.alive ? 1 : .35; drawShip(x, ry - 6, 9, -1, { color: sd.color }); ctx.restore(); });
  if (M.clock && active && isHuman(sd) && (M.phase === 'roll' || M.phase === 'aim')) {
    const k = clamp(M.clock.left / M.clock.limit, 0, 1), y = ry - 44;
    ctx.save(); rrPath(ctx, 120, y - 7, 480, 14, 7); ctx.fillStyle = '#e5e9f2'; ctx.fill();
    rrPath(ctx, 120, y - 7, 480 * k, 14, 7); ctx.fillStyle = k < .3 ? RED : YEL; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 2; rrPath(ctx, 120, y - 7, 480, 14, 7); ctx.stroke();
    ctx.fillStyle = '#ff7a1f'; ctx.beginPath(); ctx.arc(120 + 480 * k, y, 8 + Math.sin(M.t * 30) * 2, 0, 7); ctx.fill(); ctx.restore();
  }
  drawTray(sd, rot);
}
function drawTray(sd, rot) {
  const active = M.turn === sd.idx && !M.over && isHuman(sd), roll = active && M.phase === 'roll';
  const y0 = H - 196, cy = y0 + 80;
  sketchBox(30, y0, 660, 160, { r: 28, fill: active ? '#fbfdff' : '#eef2f9', seed: 31 + sd.idx });
  const hint = sd.isRemote ? (M.turn === sd.idx && !M.over ? t('hint_remote') : '') : active ? M.hint : (M.over ? '' : sd.isAI ? '' : t('hint_wait'));
  if (hint) txt(hint, W / 2, y0 - 20, 24, { stroke: '#f3f6fc', sw: 6, color: hint === t('hint_notarget') ? RED : NAVY, max: 640 });
  const pw = sd.pw;
  const slot = (id, x, icon, count, toolOn, onTap) => {
    ui(id + sd.idx, x - 50, cy - 50, 100, 100, { rot, disabled: !roll || (count != null && count <= 0) }, (bx, by, w, h) => {
      sketchBox(bx, by, w, h, { r: 22, fill: toolOn ? YEL : '#fff', seed: x | 0 });
      icon(bx + w / 2, by + h / 2, 66);
      if (count != null) { ctx.save(); ctx.beginPath(); ctx.arc(bx + w - 8, by + h - 8, 19, 0, 7); ctx.fillStyle = '#1f3c8f'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); txt(String(count), bx + w - 8, by + h - 7, 22, { color: '#fff', italic: false }); }
    }, onTap);
  };
  slot('rocket', 100, iconRocket, pw.rocket, M.tool === 'rocket' && active, () => toggleTool('rocket'));
  slot('shield', 215, (x, y, s) => iconShield(x, y, s), pw.shield, M.tool === 'shield' && active, () => toggleTool('shield'));
  slot('bolt', 505, iconBolt, pw.bolt, M.boltArmed && active, () => toggleTool('bolt'));
  slot('move', 620, iconMove, null, M.tool === 'move' && active, () => toggleTool('move'));
  const u = M.diceUI && M.diceUI.side === sd.idx ? M.diceUI : null;
  const canRoll = roll && !u;
  ui('dice' + sd.idx, W / 2 - 66, cy - 66, 132, 132, { rot, silent: true }, (bx, by, w, h) => {
    if (u) {
      const n = u.n, s = n > 1 ? 84 : 112;
      for (let i = 0; i < n; i++) drawDie(W / 2 + (n > 1 ? (i - .5) * 92 : 0), cy, s, u.faces[i], { rot: u.rot[i] + (u.rolling ? Math.sin(M.t * 30 + i) * .3 : 0), used: i < u.used, color: sd.color === RED ? '#e23a32' : '#2f6fe0' });
      if (u.bonus && !u.rolling) txt('+' + u.bonus, W / 2 + (n > 1 ? 120 : 76), cy - 40, 34, { color: RED, stroke: '#fff', sw: 6 });
    } else {
      const pul = canRoll ? 1 + .05 * Math.sin(M.t * 6) : 1;
      ctx.save(); ctx.translate(W / 2, cy); ctx.scale(pul, pul); drawDie(0, 0, 112, 5, { alpha: canRoll ? 1 : .45, color: sd.color === RED ? '#e23a32' : '#2f6fe0' }); ctx.restore();
      if (canRoll) txt(t('tap'), W / 2, cy + 74, 22, { color: RED, stroke: '#fff', sw: 5 });
    }
  }, () => humanRoll());
}
function overlayCard(y, h) {
  ctx.save(); ctx.fillStyle = 'rgba(243,246,252,0.86)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  sketchBox(100, y, 520, h, { r: 34 });
}
function drawPause() {
  const y = H / 2 - 260; overlayCard(y, 520);
  txt(t('paused'), W / 2, y + 70, 60, { stroke: '#fff', sw: 8, max: 460 });
  bigButton('resume', 170, y + 130, 380, 86, t('resume'), { fill: YEL, icon: iconPlay, fs: 36 }, () => { M.paused = false; });
  if (!M.net) bigButton('restart', 170, y + 236, 380, 80, t('restart'), { fs: 32 }, () => { const c = M.mode === 'campaign' ? levelCfg(M.level) : versusCfg(); M.token = null; newMatch(c); });
  bigButton('snd', 170, y + 336, 184, 70, t('sound') + (save.settings.sound ? ' ✓' : ' ✗'), { fs: 22 }, () => { save.settings.sound = !save.settings.sound; persist(); });
  bigButton('mus', 366, y + 336, 184, 70, t('music') + (save.settings.music !== false ? ' ✓' : ' ✗'), { fs: 22 }, () => { save.settings.music = save.settings.music === false; persist(); });
  bigButton('quit', 170, y + 422, 380, 70, t('quit'), { fs: 28 }, () => { if (M.net) netSend({ t: 'bye' }); quitMatch(); });
}
function drawNetLost() {
  const y = H / 2 - 160; overlayCard(y, 320);
  txt(t('net_lost'), W / 2, y + 90, 40, { color: RED, stroke: '#fff', sw: 8, max: 460 });
  bigButton('nlmenu', 170, y + 180, 380, 86, t('menu'), { fill: YEL, fs: 34 }, () => quitMatch());
}
function drawResult(dt) {
  const r = M.result; r.t += dt; const k = Math.min(1, r.t / .4);
  ctx.save(); ctx.fillStyle = `rgba(243,246,252,${.8 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  const vs = M.mode === 'versus', win = r.winner === 0;
  ctx.save(); ctx.translate(W / 2, H / 2); if (vs && r.winner === 1 && !M.net) ctx.rotate(Math.PI); const s = easeBack(k); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
  const y = H / 2 - 290;
  sketchBox(80, y, 560, 580, { r: 36 });
  const title = M.net ? (win ? t('you_win') : t('you_lose')) : vs ? (r.winner === 0 ? t('p1_wins') : t('p2_wins')) : win ? t('victory') : t('shot_down');
  const col = (vs && !M.net) ? (r.winner === 0 ? RED : '#2366c9') : win ? RED : NAVY;
  txt(title, W / 2, y + 80, vs ? 52 : 66, { color: col, stroke: '#fff', sw: 10, rot: -.04, max: 500 });
  inkLine(W / 2 - 200, y + 125, W / 2 + 200, y + 118, col, 6, 5);
  if (!vs) {
    for (let i = 0; i < 3; i++) {
      const st = .5 + i * .3, on = win && i < r.stars && r.t > st, kk = clamp((r.t - st) / .3, 0, 1);
      if (on && !r['s' + i]) { r['s' + i] = 1; sfx.star(i); spawnBurst(W / 2 + (i - 1) * 110, y + 210, 14, { colors: [YEL, '#fff'], g: 0, max: 250 }); }
      star(W / 2 + (i - 1) * 110, y + 210 - (i === 1 ? 18 : 0), 46 * (on ? easeBack(kk) * .3 + .7 : .7), on, { lw: 4 });
    }
    txt(win ? t('level_cleared', M.level) : t('level_n', M.level), W / 2, y + 300, 32, { max: 500 });
    txt(t('score') + ' ' + Math.round(r.score * clamp(r.t / 1.2, 0, 1)), W / 2, y + 346, 38, { color: '#2366c9', max: 500 });
  } else {
    const sd = M.sides[r.winner]; drawShip(W / 2, y + 210, 44, -1, { color: sd.color, t: r.t, exhaust: true });
    txt(t('kills_left', sd.hits, sd.ships.filter(s => s.alive).length), W / 2, y + 330, 28, { max: 500 });
  }
  const by = y + 400;
  if (M.net) {
    if (Net.host) bigButton('netre', 140, by, 440, 84, t('rematch'), { fill: YEL, icon: iconPlay, fs: 36 }, () => netStartMatch());
    else txt(t('wait_host'), W / 2, by + 42, 26, { max: 460 });
    bigButton('rmenu', 140, by + 100, 440, 70, t('menu'), { fs: 28 }, () => { netSend({ t: 'bye' }); quitMatch(); });
  } else {
    if (!vs && win && M.level < MAXLV) bigButton('next', 140, by, 440, 84, t('next_level'), { fill: YEL, icon: iconPlay, fs: 36 }, () => Ads.afterLevel(M.level, () => { const n = M.level + 1; M.token = null; newMatch(levelCfg(n)); }));
    else bigButton('retry', 140, by, 440, 84, vs ? t('rematch') : t('try_again'), { fill: YEL, icon: iconPlay, fs: 36 }, () => { const c = vs ? versusCfg() : levelCfg(M.level); M.token = null; newMatch(c); });
    bigButton('rmenu', 140, by + 100, 210, 70, t('menu'), { fs: 28 }, () => { if (!vs && win) Ads.afterLevel(M.level, () => quitMatch(), true); else quitMatch(); });
    bigButton('rretry', 370, by + 100, 210, 70, vs ? t('setup') : t('retry'), { fs: 28 }, () => { if (vs) quitMatch('setup'); else { const c = levelCfg(M.level); M.token = null; newMatch(c); } });
  }
  ctx.restore();
  if (vs && r.winner === 1 && !M.net) for (const h of hits) if (['next', 'retry', 'rmenu', 'rretry'].includes(h.id)) h.rot = true;
}
