/* =========================================================
   SHIPS — types, shapes and renderer
   ========================================================= */
const TYPES = {
  fighter:     { w: 3, guns: [-1, 1], hp: 1 },
  armored:     { w: 3, guns: [-1, 1], hp: 2, armor: true },
  interceptor: { w: 3, guns: [-1, 1], hp: 1, mover: true },
  bomber:      { w: 5, guns: [-2, -1, 1, 2], hp: 2 },
  tank:        { w: 3, guns: [0], hp: 3, armor: true },
  sniper:      { w: 3, guns: [0], hp: 1, sniper: true },
  boss:        { w: 5, guns: [-2, 0, 2], hp: 1, boss: true }
};
// right halves, pointing up, in cell units; y=0 is the gun line
const SHAPES = {
  fighter: [[0, -1.08], [.17, -.86], [.29, -.5], [.35, .02], [1.22, .5], [1.26, .84], [.42, .76], [.42, 1.02], [.78, 1.32], [.78, 1.54], [.22, 1.44], [.12, 1.58]],
  interceptor: [[0, -1.18], [.13, -.85], [.22, -.25], [1.2, .72], [1.2, .98], [.36, .9], [.3, 1.18], [.58, 1.45], [.16, 1.42], [.1, 1.56]],
  bomber: [[0, -1.02], [.24, -.82], [.36, -.32], [.42, -.02], [2.45, .28], [2.52, .66], [.48, .8], [.48, 1.08], [1.05, 1.32], [1.05, 1.52], [.26, 1.46], [.15, 1.62]],
  tank: [[0, -1.02], [.32, -.92], [.52, -.42], [.56, -.02], [1.32, .3], [1.36, .98], [.62, 1.02], [.62, 1.32], [.88, 1.46], [.88, 1.68], [.22, 1.62], [.15, 1.72]],
  sniper: [[0, -1.55], [.1, -1.12], [.22, -.42], [.3, .04], [1.16, .55], [1.2, .82], [.38, .76], [.38, 1.04], [.7, 1.3], [.7, 1.5], [.2, 1.42], [.1, 1.55]],
  boss: [[0, -1.1], [.36, -.86], [.56, -.3], [.72, .04], [2.56, .22], [2.62, .86], [.82, .96], [.82, 1.32], [1.52, 1.62], [1.52, 1.88], [.36, 1.76], [.2, 1.92]]
};
SHAPES.armored = SHAPES.fighter;
const SHIP = SHAPES.fighter; // used by menu doodles

function shipPath(x, y, sx, sy, R, L) {
  R = R || SHIP; L = L || R;
  ctx.beginPath(); ctx.moveTo(x + R[0][0] * sx, y + R[0][1] * sy);
  for (let i = 1; i < R.length; i++) ctx.lineTo(x + R[i][0] * sx, y + R[i][1] * sy);
  for (let i = L.length - 1; i >= 1; i--) ctx.lineTo(x - L[i][0] * sx, y + L[i][1] * sy);
  ctx.closePath();
}
function ellipse(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2); }
function brokenHalf(pts, cut, noseGone) {
  return pts.map(([px, py], i) => {
    let X = px, Y = py;
    if (cut != null && X > cut) X = cut + (h1(i * 7) * .08);
    if (noseGone && Y < -.45) Y = -.45 + Math.abs(h1(i * 3)) * .08;
    return [X, Y];
  });
}
/* draws ship with gun line at (x,y); dir -1 points up, +1 points down; cell = grid size
   o: { type, color, t, exhaust, dead, deadT, killColor, flash, shield, maxHp, hp, parts, alpha, seed } */
function drawShip(x, y, cell, dir, o = {}) {
  const type = o.type || (o.w === 5 ? 'boss' : o.armor ? 'armored' : 'fighter'), T = TYPES[type] || TYPES.fighter;
  const sx = cell, sy = cell * (dir < 0 ? 1 : -1), sg = Math.sign(sy);
  const t = o.t || 0, lw = Math.max(2, cell * .085), col = o.color || RED;
  const P = o.parts;
  let R = SHAPES[type] || SHAPES.fighter, L = R;
  if (P) { R = brokenHalf(R, P.rw.hp <= 0 ? .9 : null, P.nose.hp <= 0); L = brokenHalf(L, P.lw.hp <= 0 ? .9 : null, P.nose.hp <= 0); }
  ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
  // exhaust
  const tailY = R[R.length - 1][1];
  if (o.exhaust && !o.dead && !(P && P.eng.hp <= 0)) {
    ctx.lineCap = 'round';
    const nozz = type === 'bomber' ? [-1.05, -.3, .3, 1.05] : type === 'boss' ? [-1.2, -.35, .35, 1.2] : [-.2, .2];
    for (const nx of nozz) for (let k = 0; k < 3; k++) {
      const ex = x + (nx + (k - 1) * .06) * sx, len = (.9 + .25 * Math.sin(t * 28 + k * 2 + nx * 3)) * cell;
      ctx.strokeStyle = k === 1 ? 'rgba(42,127,224,0.85)' : 'rgba(42,127,224,0.45)'; ctx.lineWidth = Math.max(1.5, cell * .07);
      const y0 = y + (tailY - .08) * sy; ctx.beginPath(); ctx.moveTo(ex, y0); ctx.lineTo(ex, y0 + len * sg); ctx.stroke();
    }
  }
  // shadow
  ctx.save(); ctx.globalAlpha *= .13; shipPath(x + cell * .12, y + cell * .18, sx, sy, R, L); ctx.fillStyle = NAVY; ctx.fill(); ctx.restore();
  // body
  shipPath(x, y, sx, sy, R, L);
  ctx.fillStyle = o.flash > 0 ? `rgb(255,${200 + 55 * (1 - o.flash) | 0},${120 + 135 * (1 - o.flash) | 0})` : (o.dead ? '#e7ebf3' : '#ffffff'); ctx.fill();
  ctx.save(); shipPath(x, y, sx, sy, R, L); ctx.clip(); ctx.fillStyle = 'rgba(120,150,210,0.18)';
  ctx.fillRect(x - 3 * cell, y + .62 * sy - (sg < 0 ? 2 * cell : 0), 6 * cell, 2 * cell); ctx.restore();
  if (type === 'tank') { ctx.save(); shipPath(x, y, sx, sy, R, L); ctx.clip(); ctx.strokeStyle = 'rgba(27,42,94,.18)'; ctx.lineWidth = 2; for (let i = -3; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - 2 * cell, y + i * .35 * sy); ctx.lineTo(x + 2 * cell, y + (i * .35 + .6) * sy); ctx.stroke(); } ctx.restore(); }
  ctx.strokeStyle = NAVY; ctx.lineWidth = lw; ctx.lineJoin = 'round'; shipPath(x, y, sx, sy, R, L); ctx.stroke();
  // panel lines
  const b = R[3];
  ctx.lineWidth = lw * .55; ctx.beginPath();
  for (const s of [-1, 1]) { ctx.moveTo(x + s * b[0] * sx, y + b[1] * sy); ctx.lineTo(x + s * (b[0] + .06) * sx, y + .76 * sy); }
  ctx.stroke();
  // wing markings / engine pods
  if (!o.dead) {
    ctx.fillStyle = col;
    const tip = R[4][0];
    for (const s of [-1, 1]) {
      if (P && ((s < 0 && P.lw.hp <= 0) || (s > 0 && P.rw.hp <= 0))) continue;
      ctx.beginPath(); ctx.moveTo(x + s * (tip - .34) * sx, y + .3 * sy); ctx.lineTo(x + s * tip * sx, y + .48 * sy); ctx.lineTo(x + s * (tip + .02) * sx, y + .62 * sy); ctx.lineTo(x + s * (tip - .34) * sx, y + .48 * sy); ctx.closePath(); ctx.fill();
    }
    if (type === 'interceptor') { ctx.strokeStyle = YEL; ctx.lineWidth = lw * 1.3; ctx.beginPath(); ctx.moveTo(x, y - .9 * sy); ctx.lineTo(x, y + 1.3 * sy); ctx.stroke(); }
  }
  if (type === 'bomber' || type === 'boss') {
    const pods = type === 'bomber' ? [-1.5, -.95, .95, 1.5] : [-1.6, -1.05, 1.05, 1.6];
    for (const px of pods) {
      if (P && ((px < 0 && P.lw.hp <= 0 && px < -1.2) || (px > 0 && P.rw.hp <= 0 && px > 1.2))) continue;
      const dead = P && P.eng.hp <= 0 && Math.abs(px) < 1.2;
      ellipse(x + px * sx, y + .62 * sy, .16 * cell, .34 * cell); ctx.fillStyle = dead ? '#3a3f52' : '#dfe8fa'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = lw * .7; ctx.stroke();
    }
  }
  if (o.armor || type === 'tank') {
    ctx.strokeStyle = NAVY; ctx.lineWidth = lw * 1.6; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * .5 * sx, y + .55 * sy); ctx.lineTo(x + s * .95 * sx, y + .72 * sy); ctx.stroke(); }
  }
  // guns
  for (const g of T.guns) {
    if (P && ((g < 0 && P.lw.hp <= 0) || (g > 0 && P.rw.hp <= 0) || (g === 0 && P.nose.hp <= 0))) continue;
    const gx = x + g * sx, gy0 = y + (g === 0 ? -1.0 : 0) * sy;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = NAVY; ctx.lineWidth = lw * .8;
    const bw = cell * (type === 'sniper' || type === 'tank' ? .2 : .16), bl = cell * (type === 'sniper' ? .75 : .5) * sg;
    ctx.beginPath(); ctx.rect(gx - bw / 2, gy0, bw, bl); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.dead ? '#aab' : col; ellipse(gx, gy0, cell * .1, cell * .1); ctx.fill(); ctx.stroke();
  }
  // cockpit
  const ck = type === 'bomber' ? .2 : type === 'boss' ? .24 : .17;
  if (!(P && P.core.hp <= 0)) {
    ellipse(x, y - .12 * sy, ck * cell, .42 * cell); ctx.fillStyle = o.dead ? '#9aa3b8' : col; ctx.fill();
    ctx.lineWidth = lw * .8; ctx.strokeStyle = NAVY; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ellipse(x - .05 * sx, y - .3 * sy, .05 * cell, .14 * cell); ctx.fill();
  }
  if (type === 'boss' && !o.dead) {
    ctx.fillStyle = YEL; ctx.strokeStyle = NAVY; ctx.lineWidth = lw * .7;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * .42 * sx, y + 1.25 * sy, cell * .16, 0, 7); ctx.fill(); ctx.stroke(); }
  }
  // damage cracks
  const dmg = o.damage || 0;
  if (dmg > 0 && !o.dead) {
    ctx.strokeStyle = NAVY; ctx.lineWidth = lw * .6;
    for (let k = 0; k < dmg; k++) {
      const s = k % 2 ? -1 : 1; ctx.beginPath(); ctx.moveTo(x + s * .3 * sx, y + .1 * sy);
      for (let j = 1; j <= 4; j++) ctx.lineTo(x + s * (.3 + j * .18) * sx, y + (.1 + (j % 2 ? .12 : -.02) + j * .08) * sy);
      ctx.stroke();
    }
  }
  // smoke on broken boss parts
  if (P && !o.dead) {
    for (const [k, px] of [['lw', -1.5], ['rw', 1.5], ['nose', 0], ['eng', 0]]) {
      const p = P[k]; if (p.hp > 0 && p.hp >= p.max) continue;
      const py = k === 'nose' ? -.5 : k === 'eng' ? 1.6 : .5;
      if (Math.sin(t * 9 + px) > .3) { ctx.fillStyle = 'rgba(60,70,100,.28)'; ctx.beginPath(); ctx.arc(x + px * sx + Math.sin(t * 3) * 4, y + py * sy - sg * ((t * 40) % 20), cell * .18, 0, 7); ctx.fill(); }
    }
  }
  // hp pips
  if (o.maxHp > 1 && !o.dead && !P) {
    const n = o.maxHp, pr = cell * .11;
    for (let i = 0; i < n; i++) {
      const px = x + (i - (n - 1) / 2) * pr * 2.6, py = y + (tailY + .3) * sy;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fillStyle = i < o.hp ? col : '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
  // boss part health bars
  if (P && !o.dead) {
    const bars = [['lw', -1.75, .1], ['rw', 1.75, .1], ['nose', 0, -1.45], ['eng', 0, 2.25], ['core', 0, .25]];
    for (const [k, bx, by] of bars) {
      const p = P[k]; if (p.hp <= 0 && k !== 'core') continue;
      const w = cell * .9, h = cell * .16, X = x + bx * sx - w / 2, Y = y + by * sy - h / 2;
      ctx.fillStyle = '#fff'; ctx.fillRect(X, Y, w, h); ctx.fillStyle = k === 'core' ? RED : '#ff9a2e'; ctx.fillRect(X, Y, w * Math.max(0, p.hp) / p.max, h);
      ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.strokeRect(X, Y, w, h);
    }
  }
  if (o.dead) {
    ctx.globalAlpha = 1; const R2 = cell * (T.w === 5 ? 3.6 : 2.5), cy = y + .3 * sy;
    if (typeof drawSprite === 'function' && SPRITES.ready) {
      const fr = Math.min(5, Math.floor((o.deadT || 9) / .06));
      drawSprite('scribble', fr, x, cy, R2, o.killColor || RED, .92, (o.seed % 7) * .25 - .7, o.seed % 2 === 0);
    } else {
      inkLine(x - R2 * .4, cy - R2 * .3, x + R2 * .4, cy + R2 * .35, RED, Math.max(3, cell * .14), 11 + (o.seed || 0));
      inkLine(x + R2 * .36, cy - R2 * .34, x - R2 * .38, cy + R2 * .32, RED, Math.max(3, cell * .14), 23 + (o.seed || 0));
    }
  }
  if (o.shield && !o.dead) {
    const Rr = cell * (T.w === 5 ? 2.9 : 1.75), cy = y + .3 * sy;
    ctx.globalAlpha = .16 + .05 * Math.sin(t * 4); ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(x, cy, Rr, 0, 7); ctx.fill();
    ctx.globalAlpha = .85; ctx.strokeStyle = BLUE; ctx.lineWidth = Math.max(2, cell * .09); ctx.setLineDash([cell * .5, cell * .25]);
    ctx.lineDashOffset = -t * 30; ctx.beginPath(); ctx.arc(x, cy, Rr, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}
/* small side-view bomber used as the "shot clock" enemy */
function drawRaider(x, y, s, dirX, t, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dirX, 1); ctx.lineJoin = 'round';
  const lw = Math.max(2, s * .07);
  ctx.strokeStyle = 'rgba(42,127,224,.6)'; ctx.lineWidth = lw; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-s * .55, -s * .06 + k * s * .06); ctx.lineTo(-s * (.85 + .1 * Math.sin(t * 30 + k)), -s * .06 + k * s * .06); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(s * .6, 0); ctx.quadraticCurveTo(s * .4, -s * .2, -s * .5, -s * .14); ctx.lineTo(-s * .55, s * .12); ctx.quadraticCurveTo(s * .3, s * .18, s * .6, 0); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = lw; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * .1, -s * .1); ctx.lineTo(-s * .2, -s * .5); ctx.lineTo(-s * .35, -s * .5); ctx.lineTo(-s * .2, -s * .1); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * .38, -s * .12); ctx.lineTo(-s * .55, -s * .38); ctx.lineTo(-s * .58, -s * .1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ellipse(s * .3, -s * .05, s * .12, s * .07); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
  // bomb
  ellipse(0, s * .24, s * .14, s * .08); ctx.fillStyle = '#2b2b3a'; ctx.fill();
  ctx.restore();
}
