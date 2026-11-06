/* =========================================================
   SCENERY — a child's space doodles: the place name written on the paper,
   plus faint stars, planets, moons and comets behind the battle
   ========================================================= */
const PLACES = ['GAIA', 'NOVA PRIME', 'KEPLER-7', 'ORION', 'ASTRA', 'ZORBA', 'MOON BASE', 'NEBULA X', 'PLUTO', 'VEGA', 'TITAN', 'ANDROMEDA',
  'SIRIUS', 'CASSINI', 'LUNA', 'RIGEL', 'POLARIS', 'COMET ALLEY', 'MARS CAMP', 'ZETA-9', 'CYGNUS', 'EUROPA', 'NEPTUNIA', 'ALTAIR',
  'DRACO', 'IO', 'STARDUST', 'AURORA', 'PEGASUS', 'HALLEY', 'LYRA', 'GALAXY 42', 'COSMO', 'SATURNIA', 'ROCKET BAY', 'PHOBOS',
  'SKY KINGDOM', 'BETA-3', 'CRATER CITY', 'URANIA', 'ELARA', 'NOVA-5'];
function makeScenery(seed) {
  const r = mulberry((seed * 2654435761) >>> 0), items = [];
  const name = PLACES[Math.floor(r() * PLACES.length)];
  for (let i = 0; i < 9; i++) items.push({ k: 'star', x: r(), y: r(), s: 6 + r() * 7, rot: r() * 6 });
  for (let i = 0; i < 7; i++) items.push({ k: 'dot', x: r(), y: r(), s: 1.5 + r() * 2 });
  const np = 1 + (r() < .6 ? 1 : 0);
  for (let i = 0; i < np; i++) items.push({ k: 'planet', x: i ? .82 + r() * .1 : .08 + r() * .12, y: .15 + r() * .7, s: 20 + r() * 18, ring: r() < .6, tilt: r() * .6 - .3 });
  if (r() < .5) items.push({ k: 'moon', x: .45 + r() * .3, y: .1 + r() * .8, s: 14 + r() * 8 });
  if (r() < .45) items.push({ k: 'comet', x: .2 + r() * .6, y: .1 + r() * .8, s: 30 + r() * 20, a: r() * 6 });
  return { name, items, t0: performance.now(), rot: (r() - .5) * .14 };
}
function sceneryNow(seed) { return makeScenery(seed == null ? (Math.random() * 1e9) | 0 : seed); }
function drawScenery() {
  const S = M && M.scenery; if (!S) return;
  const x0 = BL.bx, w = M.C * BL.cell, y0 = rowY(M.topRow), h = (M.bottomRow - M.topRow) * BL.cell;
  const pen = '#2a5fd0';
  ctx.save(); ctx.strokeStyle = pen; ctx.fillStyle = pen; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const it of S.items) {
    const x = x0 + it.x * w, y = y0 + it.y * h;
    ctx.globalAlpha = it.k === 'dot' ? .16 : .13; ctx.lineWidth = 2;
    if (it.k === 'star') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(it.rot); ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? it.s * .45 : it.s; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.stroke(); ctx.restore();
    } else if (it.k === 'dot') { ctx.beginPath(); ctx.arc(x, y, it.s, 0, 7); ctx.fill(); }
    else if (it.k === 'planet') {
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, it.s, 0, 7); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, it.s, 0, 7); ctx.clip(); ctx.lineWidth = 1.5;
      for (let k = -it.s; k < it.s; k += 6) { ctx.beginPath(); ctx.moveTo(x + k, y + it.s); ctx.lineTo(x + k + it.s * .8, y - it.s); ctx.stroke(); }
      ctx.restore();
      if (it.ring) { ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, y, it.s * 1.8, it.s * .45, it.tilt, Math.PI * 1.05, Math.PI * 1.95, true); ctx.stroke(); }
    } else if (it.k === 'moon') {
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, it.s, Math.PI * .3, Math.PI * 1.7); ctx.arc(x + it.s * .45, y, it.s * .78, Math.PI * 1.62, Math.PI * .38, true); ctx.closePath(); ctx.stroke();
    } else if (it.k === 'comet') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(it.a); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.stroke();
      for (const d of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(-8, d); ctx.lineTo(-8 - it.s * (d ? .7 : 1), d * 1.8); ctx.stroke(); }
      ctx.restore();
    }
  }
  // the place name, "handwritten" in on arrival
  const cx = W / 2, cy = rowY(M.G / 2) - BL.cell * .2, k = clamp((performance.now() - S.t0) / 1400, 0, 1);
  const fs = Math.min(96, 560 / Math.max(4, S.name.length) * 1.25);
  ctx.globalAlpha = .2; ctx.font = `700 ${fs}px "Comic Sans MS","Chalkboard SE","Marker Felt",Roboto,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(S.name).width;
  ctx.translate(cx, cy); ctx.rotate(S.rot);
  if (k < 1) { ctx.beginPath(); ctx.rect(-tw / 2 - 10, -fs, (tw + 20) * k, fs * 2); ctx.clip(); }
  ctx.lineWidth = 3; ctx.strokeStyle = pen; ctx.textAlign = 'left';
  let lx = -tw / 2; const chars = [...S.name];
  chars.forEach((ch, i) => {
    const cw = ctx.measureText(ch).width, j = h1(S.name.length * 31 + i * 17);
    ctx.save(); ctx.translate(lx + cw / 2, j * fs * .05); ctx.rotate(j * .09); ctx.scale(1 + h1(i * 7 + 3) * .05, 1 + h1(i * 5 + 1) * .07);
    ctx.strokeText(ch, -cw / 2, 0); ctx.fillText(ch, -cw / 2, 0); ctx.restore(); lx += cw * .97;
  });
  ctx.restore();
  if (k < 1 && k > 0) { const px = cx - tw / 2 + tw * k; drawPen(px, cy + fs * .25, pen, -1); }
}
