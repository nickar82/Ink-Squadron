/* =========================================================
   MATCH / RULES  (turn-based: Classic, 1 VS 1, Wi-Fi/Bluetooth)
   ========================================================= */
let M = null, BL = {}, uid = 1;
const TW = t => TYPES[t].w, TH = t => (TYPES[t].w - 1) / 2;
function layoutFleet(np, ne) {
  const nmax = Math.max(np, ne), nmin = Math.min(np, ne), C = 4 * nmax + 3, big = [], small = [];
  for (let k = 0; k < nmax; k++) big.push(4 * k + 2);
  const off = nmax === nmin ? 2 : 2 + 4 * Math.floor((nmax - nmin - 1) / 2);
  for (let k = 0; k < nmin; k++) small.push(4 * k + 2 + off);
  return np >= ne ? { C, p: big, e: small } : { C, p: small, e: big };
}
function gunCols(x, type) { return TYPES[type].guns.map(o => x + o); }
function covered(att, def) { return def.every(d => att.some(a => gunCols(a.x, a.type).some(c => Math.abs(c - d.x) <= TH(d.type)))); }
function genLine(types, r) {
  const xs = []; let x = TH(types[0]) + 1 + (r() < .4 ? 1 : 0);
  types.forEach((tp, i) => { if (i) x += Math.max(4, TH(types[i - 1]) + TH(tp) + 2) + (r() < .55 ? 1 : 0); xs.push(x); });
  return xs;
}
function makeLayout(cfg, r) {
  const tp = cfg.pTypes, te = cfg.eTypes;
  for (let tries = 0; tries < 500; tries++) {
    let px = genLine(tp, r), ex, C;
    if (cfg.mode === 'versus') { C = px[px.length - 1] + TH(tp[tp.length - 1]) + 2 + (r() < .5 ? 1 : 0); ex = px.map(x => C - 1 - x).reverse(); }
    else {
      ex = genLine(te, r);
      const endP = px[px.length - 1] + TH(tp[tp.length - 1]), endE = ex[ex.length - 1] + TH(te[te.length - 1]);
      C = Math.max(endP, endE) + 2;
      const sp = Math.floor(r() * (C - 2 - endP + 1)), se = Math.floor(r() * (C - 2 - endE + 1));
      px = px.map(x => x + sp); ex = ex.map(x => x + se);
    }
    const P = px.map((x, i) => ({ x, type: tp[i] })), E = ex.map((x, i) => ({ x, type: te[i] }));
    if (covered(P, E) && covered(E, P)) return { C, p: px, e: ex };
  }
  const L = layoutFleet(tp.length, te.length); return L;
}
const TYPE_INTRO = { armored: 4, interceptor: 6, bomber: 11, tank: 16, sniper: 22 };
function levelCfg(n) {
  const r = mulberry(n * 7919 + 3);
  const np = n <= 3 ? 2 : n <= 9 ? 3 : n <= 17 ? 4 : 5;
  let ne = n === 1 ? 1 : Math.min(5, np + ((n >= 3 && n % 4 === 3) ? 1 : 0));
  const boss = n >= 5 && n % 5 === 0;
  // enemy types
  const pool = ['fighter', 'fighter', 'fighter', 'fighter']; for (const k in TYPE_INTRO) if (n >= TYPE_INTRO[k]) pool.push(k);
  const intro = Object.keys(TYPE_INTRO).find(k => TYPE_INTRO[k] === n);
  const te = []; let bombers = 0, maxB = 1;
  for (let i = 0; i < ne; i++) {
    let k = pool[Math.floor(r() * pool.length)];
    if (k === 'bomber' && bombers >= maxB) k = 'armored';
    if (k === 'bomber') bombers++;
    te.push(k);
  }
  if (intro && !te.includes(intro)) te[ne - 1] = intro;
  if (boss) { const esc = Math.max(1, np - 3); te.length = Math.min(te.length, esc + 1); for (let i = 0; i < te.length; i++) if (te[i] === 'bomber' || te[i] === 'tank') te[i] = 'fighter'; te[Math.floor((te.length - 1) / 2)] = 'boss'; ne = te.length; }
  // heavy ships replace the extra ship on odd levels
  if (te.length > np && (boss || te.includes('bomber'))) { const k = te.findIndex(x => x !== 'boss' && x !== 'bomber'); if (k >= 0) te.splice(k, 1); ne = te.length; }
  // health budget: the enemy fleet may only be a bit tougher than yours, growing with the level
  const hpOf = k => k === 'boss' ? (n < 20 ? 1 : 2) + Math.min(4, 2 + Math.floor(n / 35)) + 1 : k === 'bomber' ? 3 : k === 'sniper' ? 1.5 : TYPES[k].hp;
  // effective health = hull + shields + reinforcements, compared with yours (hull + shields)
  const eShield = n >= 8 ? (n >= 60 ? 2 : 1) : 0, reinfN = n >= 25 && !boss ? 1 + Math.floor((n - 25) / 40) : 0;
  const pEff = np + (boss ? 3 : 2), budget = Math.max(np - 1, Math.round(pEff * Math.min(1.25, .8 + n / 100)) - eShield - reinfN);
  { let sn = 0; for (let i = 0; i < te.length; i++) if (te[i] === 'sniper' && ++sn > 1) te[i] = 'fighter'; }
  let tot = te.reduce((a, k) => a + hpOf(k), 0);
  for (let i = te.length - 1; i >= 0 && tot > budget; i--) if (te[i] !== 'boss' && te[i] !== 'fighter' && te[i] !== intro && te[i] !== 'interceptor' && te[i] !== 'sniper') { tot -= hpOf(te[i]) - 1; te[i] = 'fighter'; }
  while (tot > budget && te.length > Math.max(1, np - 1)) { const k = te.lastIndexOf('fighter'); if (k < 0) break; te.splice(k, 1); tot--; }
  ne = te.length;
  const stMax = n < 4 ? 0 : n < 10 ? 1 : 2;
  const bunkers = n > 20 && r() < .42 ? 1 + Math.floor(r() * 3) : 0;
  return {
    mode: 'campaign', level: n, np, ne, pTypes: Array(np).fill('fighter'), eTypes: te, G: 10 + Math.min(5, Math.floor(n / 8)) + (bunkers ? 1 : 0),
    stP: Array.from({ length: np }, () => Math.floor(r() * (stMax + 1))), stE: Array.from({ length: ne }, () => Math.floor(r() * (stMax + 1))),
    skill: clamp(.08 + (n - 1) * .035, 0, .95), loaded: n >= 70 && !boss, seed: n,
    pPw: { rocket: 3, shield: boss ? 3 : 2, bolt: 3 },
    ePw: { rocket: n >= 15 ? (n >= 60 ? 2 : 1) : 0, shield: eShield, bolt: n >= 10 ? (n >= 60 ? 2 : 1) : 0 },
    bossLv: n, bunkers,
    raid: n >= 10 && !boss ? { first: 5 + Math.floor(r() * 3), every: Math.max(8, 12 - Math.floor(n / 25)), step: n >= 40 ? 4 : 3 } : null,
    reinf: reinfN && !boss ? { count: reinfN, every: 9 } : null,
    first: 0, odStart: 30
  };
}
function versusCfg() {
  const n = save.vs.ships, st = Array.from({ length: n }, () => Math.random() < .35 ? 1 : 0);
  const pw = save.vs.pw ? { rocket: 3, shield: 2, bolt: 3 } : { rocket: 0, shield: 0, bolt: 0 };
  return { mode: 'versus', np: n, ne: n, pTypes: Array(n).fill('fighter'), eTypes: Array(n).fill('fighter'), G: [9, 12, 15][save.vs.len], stP: st, stE: st.slice().reverse(), pPw: Object.assign({}, pw), ePw: Object.assign({}, pw), first: Math.random() < .5 ? 0 : 1, seed: (Math.random() * 65535) | 0, clock: save.vs.clock || 0, odStart: 22 };
}
function mkShip(side, x, st, type, dir, G, lv) {
  const T = TYPES[type];
  const s = { id: uid++, side, x, type, w: T.w, hp: T.hp, maxHp: T.hp, alive: true, shield: false, st, ox: 0, oy: 0, flash: 0, seed: uid * 13, armor: !!T.armor, deadT: 0 };
  s.gunRow = dir < 0 ? G + st : -st; s.baseRow = s.gunRow;
  s.guns = T.guns.map(off => ({ off, m: 0, a: 0, seed: uid++ * 31, ink: 6 }));
  if (T.boss) {
    lv = lv || 5; const wh = lv < 15 ? 1 : lv < 45 ? 2 : 3, sm = lv < 20 ? 1 : 2, ch = Math.min(4, 2 + Math.floor(lv / 35));
    s.parts = { lw: { hp: wh, max: wh }, rw: { hp: wh, max: wh }, nose: { hp: sm, max: sm }, eng: { hp: sm, max: sm }, core: { hp: ch, max: ch } };
    s.hp = s.maxHp = ch;
  }
  return s;
}
function newMatch(cfg) {
  timers = []; parts = []; floats = [];
  const r = mulberry(cfg.seed * 13 + 1), L = makeLayout(cfg, r), G = cfg.G;
  const camp = cfg.mode === 'campaign';
  let supply = 0;
  if (camp) {
    const f = (save.fails || {})[cfg.level] || 0;
    if (f >= 2) { supply = Math.min(3, Math.floor(f / 2)); cfg = Object.assign({}, cfg, { pPw: Object.assign({}, cfg.pPw), skill: Math.max(.4, cfg.skill - .1 * supply) }); cfg.pPw.shield += supply; cfg.pPw.rocket += Math.min(2, supply); }
  }
  let eggPw = false;
  if (camp && save.egg && save.egg.pw) { eggPw = true; cfg = Object.assign({}, cfg, { pPw: Object.assign({}, cfg.pPw) }); for (const k of ['rocket', 'shield', 'bolt']) cfg.pPw[k] = (cfg.pPw[k] || 0) + save.egg.pw; save.egg.pw = 0; persist(); }
  const sides = [
    { idx: 0, dir: -1, color: RED, ships: [], pw: Object.assign({}, cfg.pPw), isAI: false, name: camp ? t('you') : pName(1), lost: 0, hits: 0 },
    { idx: 1, dir: 1, color: (typeof SEASON !== 'undefined' && SEASON.enemy) || BLUE, ships: [], pw: Object.assign({}, cfg.ePw), isAI: camp, isRemote: !!cfg.net, name: camp ? t('enemy') : cfg.net ? (cfg.oppName || t('opponent')).toUpperCase() : pName(2), lost: 0, hits: 0, ai: { skill: cfg.skill || 0, loaded: !!cfg.loaded } }
  ];
  L.p.forEach((x, i) => sides[0].ships.push(mkShip(0, x, cfg.stP[i] || 0, cfg.pTypes[i] || 'fighter', -1, G)));
  L.e.forEach((x, i) => sides[1].ships.push(mkShip(1, x, cfg.stE[i] || 0, cfg.eTypes[i] || 'fighter', 1, G, cfg.bossLv)));
  const stMaxE = Math.max(0, ...sides[1].ships.map(s => s.st)), stMaxP = Math.max(0, ...sides[0].ships.map(s => s.st));
  M = {
    cfg, mode: cfg.mode, net: !!cfg.net, level: cfg.level || 0, C: L.C, G, sides, turn: cfg.first, phase: 'start', dice: [], diceUI: null,
    tool: null, sel: null, preview: null, decals: [], splats: [], banner: null, result: null, paused: false, over: false,
    topRow: -stMaxE - 2.6, bottomRow: G + stMaxP + 2.6, score: 0, t: 0, token: {}, hint: '', boltArmed: false, turns: 0, calm: 0,
    round: 0, bunkers: [], raider: null, raidNext: cfg.raid ? cfg.raid.first : 1e9, reinfLeft: cfg.reinf ? cfg.reinf.count : 0, reinfNext: cfg.reinf ? cfg.reinf.every : 1e9,
    clock: cfg.clock ? { limit: cfg.clock, left: cfg.clock } : null, odStart: cfg.odStart || 22, netQ: [], netBusy: false, rocketKills: 0
  };
  if (sides[1].ships.some(s => s.type === 'boss')) M.topRow -= 1.2;
  M.scenery = makeScenery(camp ? cfg.level * 31 + 7 : cfg.seed);
  if (cfg.bunkers) placeBunkers(cfg.bunkers, r);
  scene = SCENES.game; computeBL();
  if (typeof onMatchStart === 'function') onMatchStart();
  Mascot.turnN = 0; Mascot.cur = null;
  const tok = M.token;
  Intro.start(introLabel(), () => {
    if (M.token !== tok) return;
    if (eggPw) { addFloat(W / 2, H * .64, t('egg_pw'), RED, 34); mascotSay('thumbs', 'm_egg', { force: true, pri: 3 }); }
    else if (supply) { M.supply = supply; addFloat(W / 2, H * .45, t('supply', supply), RED, 40); setTimeout(() => mascotSay('thumbs', 'm_supply', { force: true, pri: 3 }), 900); }
    startTurn();
  });
}
function placeBunkers(n, r) {
  const mid = Math.round(M.G / 2), used = new Set();
  for (let k = 0; k < n; k++) {
    for (let tries = 0; tries < 30; tries++) {
      const w = 3 + (r() < .4 ? 1 : 0), c0 = 1 + Math.floor(r() * (M.C - w - 1)), r0 = mid - 1 + Math.floor(r() * 2);
      let ok = true; for (let c = c0 - 1; c <= c0 + w; c++) if (used.has(c)) ok = false;
      if (!ok) continue;
      for (let c = c0; c < c0 + w; c++) { used.add(c); for (let rr = r0; rr < r0 + 2; rr++) M.bunkers.push({ c, r: rr, seed: (c * 31 + rr * 7) | 0 }); }
      break;
    }
  }
}
function computeBL() {
  const vs = M.mode === 'versus', rt = M.rt;
  const top = vs ? 304 : rt ? 150 : 128, bot = vs ? H - 304 : rt === 'rtvs' ? H - 150 : rt ? H - 120 : H - 224;
  const rows = M.bottomRow - M.topRow, cell = Math.min((W - 24) / M.C, (bot - top) / rows, 60);
  BL = { cell, bx: (W - M.C * cell) / 2, by: top + ((bot - top) - rows * cell) / 2, top, bot };
}
const colX = c => BL.bx + (c + .5) * BL.cell, rowY = r => BL.by + (r - M.topRow) * BL.cell;
const half = s => (s.w - 1) / 2;
const sideOf = s => M.sides[s.side];
function covers(s, c) {
  if (!s.alive) return false; const d = c - s.x; if (Math.abs(d) > half(s)) return false;
  if (s.parts && Math.abs(d) === 2) return (d < 0 ? s.parts.lw : s.parts.rw).hp > 0;
  return true;
}
function frontRow(s, c) { return s.gunRow + M.sides[s.side].dir * (c === s.x && !(s.parts && s.parts.nose.hp <= 0) ? 1 : 0); }
function shipAt(si, c) { return M.sides[si].ships.find(s => covers(s, c)); }
function gunOf(s, c) { return s.guns.find(g => !g.dead && s.x + g.off === c); }
function partAt(s, c) { const d = c - s.x; if (Math.abs(d) === 2) return d < 0 ? 'lw' : 'rw'; if (Math.abs(d) === 1) return s.parts.eng.hp > 0 ? 'eng' : 'core'; return s.parts.nose.hp > 0 ? 'nose' : 'core'; }
function bunkerIn(side, c, front) {
  let best = null;
  for (const b of M.bunkers) {
    if (b.c !== c) continue;
    const d = side.dir < 0 ? front - (b.r + 1) : b.r - front;
    if (d >= 0 && (!best || d < best.dist)) best = { cell: b, dist: d };
  }
  return best;
}
function colInfo(side, ship, g) {
  const c = ship.x + g.off, me = frontRow(ship, c), T = shipAt(1 - side.idx, c), b = M.bunkers.length ? bunkerIn(side, c, me) : null;
  let I;
  if (T) { const hit = Math.abs(me - frontRow(T, c)), eg = gunOf(T, c), em = eg ? eg.m : 0; I = { c, T, hit, eg, em, clash: em > 0 ? hit - em : Infinity, exit: Infinity }; }
  else { const edge = side.dir < 0 ? M.topRow + .4 : M.bottomRow - .4; I = { c, T: null, hit: Infinity, eg: null, em: 0, clash: Infinity, exit: Math.abs(me - edge) }; }
  I.block = b && b.dist < Math.min(I.hit, I.exit) ? b : null;
  return I;
}
function outcome(side, ship, g, amt, rocket) {
  const I = colInfo(side, ship, g), nm = g.m + amt;
  if (I.block && nm >= I.block.dist && !(I.em > 0 && I.clash < I.block.dist)) return { type: 'block', at: I.block.dist, I, cut: false };
  const cut = I.em > 0 && nm >= I.clash;
  if (I.T && nm >= I.hit) return { type: 'hit', at: I.hit, I, cut };
  if (!I.T && nm >= I.exit) return { type: 'miss', at: I.exit, I, cut };
  return { type: 'extend', at: nm, I, cut };
}
function gunPos(ship, g, len) {
  const c = ship.x + g.off, side = sideOf(ship), f = frontRow(ship, c);
  return { x: colX(c + ship.ox), y0: rowY(f + ship.oy), y1: rowY(f + ship.oy + side.dir * (len ?? g.a)) };
}
function addDecal(ship, g, len) {
  if (len <= 0) return; const c = ship.x + g.off, f = frontRow(ship, c), d = sideOf(ship).dir;
  M.decals.push({ c, r1: f, r2: f + d * len, color: sideOf(ship).color, seed: g.seed + M.decals.length * 7 });
  if (M.decals.length > 220) M.decals.shift();
}
function eraseGun(ship, g) { addDecal(ship, g, g.m); g.m = g.a = 0; }
const alive = side => side.ships.filter(s => s.alive);
function liveStars() { const s = M.sides[0], lost = s.lost; return lost === 0 ? 3 : lost <= Math.floor(s.ships.length / 2) ? 2 : 1; }
const isHuman = s => !s.isAI && !s.isRemote;

/* ---- flow ---- */
function setHint() {
  const side = M.sides[M.turn];
  if (side.isAI) { M.hint = t('hint_enemy'); return; }
  if (side.isRemote) { M.hint = t('hint_remote'); return; }
  if (M.phase === 'aim') { M.hint = t('hint_aim', M.dice[0]); return; }
  if (M.tool === 'rocket') { M.hint = t('hint_rocket'); return; }
  if (M.tool === 'shield') { M.hint = t('hint_shield'); return; }
  if (M.tool === 'move') { M.hint = M.sel ? t('hint_arrow') : t('hint_move'); return; }
  const any = alive(side).some(s => s.guns.some(g => !g.dead && colInfo(side, s, g).T));
  M.hint = any ? (M.boltArmed ? t('hint_bolt') : t('hint_roll')) : t('hint_notarget');
}
async function startTurn() {
  const tok = M.token; if (M.over) return;
  const side = M.sides[M.turn]; M.turns++; M.calm++;
  if (M.turn === 0) M.round++;
  if (M.calm >= M.odStart && (M.calm - M.odStart) % OD_STEP === 0) M.odNotice = 1.6;
  M.phase = 'banner'; M.dice = []; M.tool = null; M.sel = null; M.boltArmed = false; M.diceUI = null;
  if (M.clock) M.clock.left = M.clock.limit;
  const label = M.mode === 'campaign' ? (side.isAI ? t('enemy_turn') : t('your_turn')) : M.net ? (side.isRemote ? t('their_turn') : t('your_turn')) : side.name;
  M.banner = { text: label, t: 0, side: side.idx, color: side.color }; sfx.turn();
  await wait(side.isAI ? 1250 : 1350); if (tok !== M.token) return;
  if (M.mode === 'campaign' && M.turn === 1) { await enemyEvents(); if (tok !== M.token || checkEnd()) return; }
  M.phase = 'roll'; setHint();
  if (isHuman(side)) {
    Mascot.turnN++; const nm = M.mode === 'versus' && !M.net ? side.name : null;
    if (Mascot.turnN === 1 && M.sides[1].ships.some(s => s.type === 'boss')) mascotSay('surprised', 'm_boss', { side: side.idx, force: true, pri: 2 });
    else if (Mascot.turnN === 1 || Mascot.turnN % 3 === 0) mascotSay('attack', 'm_turn', { side: side.idx, name: nm });
  }
  if (side.isAI) await aiTurn(side);
}
async function endTurn() {
  const tok = M.token; if (M.over || checkEnd()) return;
  M.phase = 'wait'; await wait(600); if (tok !== M.token) return;
  if (M.mode === 'campaign' && M.turn === 1 && M.raider) { await moveRaider(); if (tok !== M.token || checkEnd()) return; }
  M.turn = 1 - M.turn; startTurn();
}
function checkEnd() {
  if (M.over) return true;
  const a = alive(M.sides[0]).length, b = alive(M.sides[1]).length;
  if (a && b) return false;
  M.over = true; M.phase = 'over'; const winner = a ? 0 : 1; finish(winner); return true;
}
async function finish(winner) {
  const tok = M.token; await wait(900); if (tok !== M.token) return;
  const res = { winner, t: 0, stars: 0, score: 0 };
  if (M.mode === 'campaign') {
    if (winner === 0) {
      const left = alive(M.sides[0]).length; res.stars = liveStars();
      M.score += left * 200 + M.level * 30; res.score = M.score;
      const n = M.level; save.stars[n] = Math.max(save.stars[n] || 0, res.stars); save.best[n] = Math.max(save.best[n] || 0, M.score);
      save.unlocked = Math.max(save.unlocked, Math.min(MAXLV, n + 1)); persist(); sfx.win(); confetti();
      gameEvent('win', { stars: res.stars, level: n, boss: M.sides[1].ships.some(s => s.type === 'boss') });
      if (save.fails) { delete save.fails[n]; persist(); }
      save.stats.wins = (save.stats.wins || 0) + 1;
    } else { res.score = M.score; sfx.lose(); Rate.maybe(); save.fails = save.fails || {}; save.fails[M.level] = (save.fails[M.level] || 0) + 1; persist(); }
  } else {
    sfx.win(); confetti(); save.stats.wins = (save.stats.wins || 0) + 1;
    gameEvent(M.net ? 'netend' : 'vsend', { winner });
  }
  M.result = res;
}
function confetti() { for (let i = 0; i < 90; i++) parts.push({ x: rnd(0, W), y: rnd(-200, -10), vx: rnd(-60, 60), vy: rnd(100, 300), g: 120, t: 0, life: rnd(2.2, 3.5), type: 'confetti', color: [RED, BLUE, YEL, '#3fbf6f', NAVY][i % 5], size: rnd(5, 9), rot: rnd(0, 6), vr: rnd(-9, 9) }); }

const OD_STEP = 12;
const overdrive = () => M.calm >= M.odStart ? 1 + Math.floor((M.calm - M.odStart) / OD_STEP) : 0;
async function rollDice(side, n, forced) {
  const ui = { side: side.idx, vals: [], faces: [], rolling: true, t: 0, n, used: 0, rot: [] };
  for (let i = 0; i < n; i++) { ui.faces.push(1 + (Math.random() * 6 | 0)); ui.rot.push(0); }
  M.diceUI = ui; sfx.dice(); vib(20);
  let acc = 0;
  await tween(650 / TS, (k) => { acc++; if (acc % 4 === 0) for (let i = 0; i < n; i++) { ui.faces[i] = 1 + (Math.random() * 6 | 0); ui.rot[i] = rnd(-.6, .6) * (1 - k); } });
  const vals = [];
  for (let i = 0; i < n; i++) { let v = forced ? forced[i] : 1 + (Math.random() * 6 | 0); if (!forced && side.ai && side.ai.loaded && v === 1) v = 1 + (Math.random() * 6 | 0); vals.push(v); }
  const od = overdrive(); ui.bonus = od;
  ui.faces = vals.slice(); ui.vals = vals; ui.rot = ui.rot.map(() => rnd(-.12, .12)); ui.rolling = false; ui.land = 0; sfx.land();
  await wait(650 / TS); return vals.map(v => v + od);
}

async function fire(side, ship, g, amt, rocket) {
  const tok = M.token, o = outcome(side, ship, g, amt, rocket), I = o.I, m0 = g.m, target = o.at;
  const dur = rocket ? .6 : .16 + .06 * Math.max(0, target - m0);
  if (rocket) { sfx.rocket(); vib(30); M.rocketFx = { ship, g }; } else sfx.scribble(dur);
  M.pen = { ship, g }; let cutDone = false;
  await tween(dur * 1000 / TS, k => {
    const e = rocket ? easeInOut(k) : k; g.a = m0 + (target - m0) * e;
    if (rocket) { const p = gunPos(ship, g); if (Math.random() < .7) parts.push({ x: p.x + rnd(-4, 4), y: p.y1, vx: rnd(-20, 20), vy: -side.dir * rnd(10, 40), g: 0, t: 0, life: .7, type: 'smoke', color: 'rgba(90,100,130,0.3)', size: rnd(5, 10) }); }
    if (o.cut && !cutDone && g.a >= I.clash && I.eg) {
      cutDone = true; const p = gunPos(ship, g); explosion(p.x, p.y1, BL.cell * .9, false, side.color); sfx.clash(); shake(6); vib(45);
      addFloat(p.x + 30, p.y1, t('fx_cut'), NAVY, 38, rnd(-.15, .15));
      eraseGun(I.T, I.eg);
      if (M.mode === 'campaign' && side.idx === 0) M.score += 50;
      if (isHuman(side)) gameEvent('cut');
    }
  });
  M.pen = null; M.rocketFx = null; if (tok !== M.token) return;
  g.a = g.m = target;
  const p = gunPos(ship, g);
  if (side.idx === 0 && M.raider) checkRaiderShot();
  if (o.type === 'block') {
    const b = I.block.cell; M.bunkers.splice(M.bunkers.indexOf(b), 1);
    explosion(p.x, p.y1, BL.cell * .8, false, side.color); spawnBurst(p.x, p.y1, 8, { type: 'debris', colors: ['#fff'], max: 260, smin: 4, smax: 8, life: .8, g: 500 });
    sfx.dent(); shake(4); eraseGun(ship, g); if (isHuman(side)) gameEvent('bunker');
    M.splats.push({ x: b.c, r: b.r + .5, size: .9, seed: b.seed, color: side.color });
    await wait(800 / TS);
  } else if (o.type === 'hit') {
    eraseGun(ship, g); await hitShip(I.T, side, I.c, rocket);
  } else if (o.type === 'miss') {
    addFloat(p.x, p.y1 + side.dir * -20, t('fx_miss'), '#8090b0', 32); sfx.miss(); eraseGun(ship, g); await wait(850 / TS);
  } else if (rocket) { explosion(p.x, p.y1, BL.cell * .6, false, side.color); sfx.pop(); await wait(700 / TS); }
  else if (o.cut) await wait(750 / TS);
}
function shipCenter(T) { const d = sideOf(T).dir; return { x: colX(T.x + T.ox), y: rowY(T.gunRow + T.oy) - d * BL.cell * .4 }; }
async function hitShip(T, att, c, rocket) {
  const tside = sideOf(T), cc = shipCenter(T), hx = colX(c), hy = rowY(frontRow(T, c));
  if (T.shield) {
    T.shield = false; sfx.pop(); vib(40); spawnBurst(cc.x, cc.y, 22, { colors: [BLUE, '#9cc6ff', '#fff'], max: 300, g: 0 });
    addFloat(hx, hy, t('fx_blocked'), BLUE, 36); await wait(950 / TS); return;
  }
  T.flash = 1; M.calm = 0;
  if (M.mode === 'campaign' && att.idx === 0) M.score += 100;
  if (T.parts) {
    const k = partAt(T, c), p = T.parts[k]; p.hp--;
    if (k !== 'core' && p.hp <= 0) {
      for (const g of T.guns) if ((k === 'lw' && g.off < 0) || (k === 'rw' && g.off > 0) || (k === 'nose' && g.off === 0)) { if (g.m > 0) eraseGun(T, g); g.dead = true; }
      explosion(hx, hy, BL.cell * 1.6, true, att.color); sfx.boom(false); shake(10); vib(90);
      addFloat(hx, hy, t('fx_part_' + k), '#ff7a1f', 36, rnd(-.2, .2)); await wait(1150 / TS); return;
    }
    T.hp = T.parts.core.hp;
    if (k !== 'core' || p.hp > 0) { sfx.dent(); explosion(hx, hy, BL.cell * .9, false, att.color); shake(6); vib(60); addFloat(hx, hy, t('fx_dent'), '#ff7a1f', 34, rnd(-.2, .2)); await wait(950 / TS); return; }
  } else {
    T.hp--;
    if (T.hp > 0) {
      sfx.dent(); explosion(hx, hy, BL.cell * .9, false, att.color); shake(6); vib(60); addFloat(hx, hy, t('fx_dent'), '#ff7a1f', 36, rnd(-.2, .2));
      if (isHuman(tside)) mascotSay('afraid', 'm_hit', { side: tside.idx, pri: 2 });
      await wait(1000 / TS); return;
    }
  }
  T.alive = false; T.deadT = 0; T.shield = false; T.killColor = att.color;
  for (const g of T.guns) if (g.m > 0) eraseGun(T, g);
  explosion(cc.x, cc.y, BL.cell * (T.w === 5 ? 3.2 : 2.2), true, att.color); sfx.boom(true); shake(16); vib(140);
  M.splats.push({ x: T.x, r: T.gunRow - tside.dir * .4, size: T.w === 5 ? 2.4 : 1.6, seed: T.seed, color: att.color });
  addFloat(cc.x, cc.y, ['BOOM!', 'KABOOM!', 'POW!', 'WHAM!'][Math.random() * 4 | 0], att.color === RED ? RED : NAVY, 52, rnd(-.2, .2));
  att.hits++; tside.lost++;
  if (M.mode === 'campaign' && att.idx === 0) M.score += 250;
  if (isHuman(att)) gameEvent('kill', { type: T.type, rocket });
  if (isHuman(tside)) mascotSay('afraid', 'm_lost', { side: tside.idx, pri: 2, force: true });
  else if (isHuman(att)) mascotSay(T.type === 'boss' ? 'satisfied' : 'happy', T.type === 'boss' ? 'm_bosskill' : 'm_kill', { side: att.idx, pri: 2 });
  await wait(1350 / TS);
}
function canMove(ship, d) {
  const nx = ship.x + d, hh = half(ship);
  if (nx - hh < 0 || nx + hh > M.C - 1) return false;
  if (ship.parts && ship.parts.eng.hp <= 0) return false;
  return !sideOf(ship).ships.some(o => o !== ship && o.alive && Math.abs(nx - o.x) <= hh + half(o));
}
async function moveShip(ship, d) {
  const tok = M.token; for (const g of ship.guns) if (g.m > 0) eraseGun(ship, g);
  ship.x += d; ship.ox = -d; sfx.move(); vib(25);
  await tween(380 / TS, k => ship.ox = -d * (1 - easeOut(k)));
  ship.ox = 0; if (tok !== M.token) return;
  await resolveStatic(ship);
}
/* forward/back move (boss) keeps lines; then everything that now touches is resolved */
async function moveShipRow(ship, d) {
  const tok = M.token; ship.gunRow += d; ship.oy = -d; sfx.move();
  await tween(420 / TS, k => ship.oy = -d * (1 - easeOut(k))); ship.oy = 0; if (tok !== M.token) return;
  const me = sideOf(ship);
  for (const g of ship.guns) {
    if (g.dead || g.m <= 0) continue; const I = colInfo(me, ship, g);
    if (I.em > 0 && g.m + I.em >= I.hit) { eraseGun(ship, g); eraseGun(I.T, I.eg); continue; }
    if (I.T && g.m >= I.hit) { g.a = g.m = I.hit; eraseGun(ship, g); await hitShip(I.T, me, I.c); if (tok !== M.token) return; }
  }
  await resolveStatic(ship);
}
async function resolveStatic(ship) {
  const tok = M.token, opp = M.sides[1 - ship.side];
  for (const s of alive(opp)) for (const g of s.guns) {
    if (!ship.alive || g.m <= 0 || g.dead) continue; const I = colInfo(opp, s, g);
    if (I.T === ship && g.m >= I.hit) { g.a = g.m = I.hit; eraseGun(s, g); await hitShip(ship, opp, I.c); if (tok !== M.token) return; }
  }
}
async function useShield(side, ship) {
  side.pw.shield--; ship.shield = true; sfx.shield(); vib(20);
  const c = shipCenter(ship); spawnBurst(c.x, c.y, 16, { colors: [BLUE, '#9cc6ff'], max: 220, g: 0 });
  await wait(850 / TS);
}

/* ---- enemy events: reinforcements & bomber raid (Classic) ---- */
async function enemyEvents() {
  const tok = M.token, cfg = M.cfg;
  if (M.reinfLeft > 0 && M.round >= M.reinfNext) {
    const e = M.sides[1], spots = [];
    for (let x = 1; x < M.C - 1; x++) {
      if (e.ships.some(o => o.alive && Math.abs(x - o.x) <= 1 + half(o))) continue;
      const okCover = alive(M.sides[0]).some(p => gunCols(p.x, p.type).some(c => Math.abs(c - x) <= 1));
      if (okCover) spots.push(x);
    }
    if (spots.length) {
      const x = spots[Math.random() * spots.length | 0], s = mkShip(1, x, 0, 'fighter', 1, M.G);
      s.oy = -6; e.ships.push(s); e.ships.sort((a, b) => a.x - b.x); M.reinfLeft--; M.reinfNext = M.round + cfg.reinf.every;
      M.banner = { text: t('reinforcements'), t: 0, side: 1, color: e.color }; sfx.rocket(); mascotSay('surprised', 'm_reinf', { force: true, pri: 3 });
      await tween(700 / TS, k => s.oy = -6 * (1 - easeOut(k))); s.oy = 0; if (tok !== M.token) return;
      await resolveStatic(s); await wait(800 / TS);
    } else M.reinfNext = M.round + 2;
  }
  if (cfg.raid && !M.raider && M.round >= M.raidNext && (M.raids || 0) < (M.level >= 50 ? 3 : 2)) {
    M.raids = (M.raids || 0) + 1;
    const fromLeft = Math.random() < .5, pf = Math.min(...alive(M.sides[0]).map(s => s.gunRow));
    M.raider = { c: fromLeft ? -1 : M.C, dir: fromLeft ? 1 : -1, row: pf - 2.5, step: cfg.raid.step, vis: fromLeft ? -1 : M.C };
    M.banner = { text: t('raid'), t: 0, side: 1, color: RED }; sfx.zap(); mascotSay('surprised', 'm_raid', { force: true, pri: 3 });
    await wait(700 / TS); await tween(500 / TS, k => M.raider.vis = M.raider.c + M.raider.dir * k * .9); M.raider.c += M.raider.dir; M.raider.vis = M.raider.c;
    if (tok !== M.token) return; checkRaiderShot();
  }
}
function raiderLeft() { const R = M.raider; return R ? Math.max(1, Math.ceil((R.dir > 0 ? M.C - R.c : R.c + 1) / R.step)) : 0; }
function lineCovers(c, row) {
  for (const s of alive(M.sides[0])) for (const g of s.guns) {
    if (g.dead || g.m <= 0 || s.x + g.off !== c) continue;
    const f = frontRow(s, c), tip = f - g.m; if (f > row && tip <= row + .5) return { s, g };
  }
  return null;
}
function checkRaiderShot(from) {
  const R = M.raider; if (!R) return false;
  const cols = []; const a = from == null ? R.c : from;
  for (let c = Math.min(a, R.c); c <= Math.max(a, R.c); c++) cols.push(c);
  for (const c of cols) {
    if (c < 0 || c >= M.C) continue; const hit = lineCovers(c, R.row);
    if (hit) {
      const x = colX(c), y = rowY(R.row); explosion(x, y, BL.cell * 1.6, true, RED); sfx.boom(false); shake(10); vib(90);
      addFloat(x, y, t('fx_raider'), RED, 40); M.raider = null; M.raidNext = M.round + M.cfg.raid.every;
      if (M.mode === 'campaign') M.score += 200; gameEvent('raider'); mascotSay('happy', 'm_raider', { force: true, pri: 3 }); return true;
    }
  }
  return false;
}
async function moveRaider() {
  const tok = M.token, R = M.raider, from = R.c, to = R.c + R.dir * R.step;
  await tween(600 / TS, k => R.vis = from + (to - from) * easeInOut(k)); if (tok !== M.token || !M.raider) return;
  R.c = to; R.vis = to;
  if (checkRaiderShot(from)) return;
  if (R.c < 0 || R.c >= M.C) {
    // drops its bomb
    const targets = alive(M.sides[0]); M.raider = null; M.raidNext = M.round + M.cfg.raid.every;
    if (!targets.length) return;
    const T = targets.sort((a, b) => Math.abs(a.x - from) - Math.abs(b.x - from))[0], cc = shipCenter(T);
    addFloat(cc.x, cc.y - 60, t('fx_bomb'), RED, 40); sfx.rocket();
    const b = { x: colX(clamp(from, 0, M.C - 1)), y: rowY(R.row) };
    M.bomb = b; await tween(450 / TS, k => { b.x = lerp(colX(clamp(from, 0, M.C - 1)), cc.x, k); b.y = lerp(rowY(R.row), cc.y, k * k); });
    M.bomb = null; if (tok !== M.token) return;
    await hitShip(T, M.sides[1], T.x);
  }
}

/* ---- human actions ---- */
function humanTurn() { const s = M.sides[M.turn]; return isHuman(s) && !M.over && !M.paused && !M.result; }
async function humanRoll(auto) {
  if (!humanTurn() || M.phase !== 'roll') return;
  const side = M.sides[M.turn]; M.tool = null; M.sel = null; M.phase = 'rolling';
  let n = 1; if (M.boltArmed && side.pw.bolt > 0) { side.pw.bolt--; n = 2; sfx.zap(); M.flash = .6; }
  M.boltArmed = false;
  const tok = M.token; const vals = await rollDice(side, n); if (tok !== M.token) return;
  if (M.net) netSend({ t: 'roll', raw: M.diceUI.vals, n });
  M.dice = vals; M.phase = 'aim'; setHint();
  if (M.clock) M.clock.left = M.clock.limit;
}
const shipIdx = s => sideOf(s).ships.indexOf(s);
async function humanFire(ship, g) {
  const side = M.sides[M.turn], tok = M.token;
  if (M.phase === 'aim' && M.dice.length) {
    M.phase = 'firing'; const v = M.dice.shift(); M.diceUI && M.diceUI.used++;
    if (M.net) netSend({ t: 'fire', s: shipIdx(ship), g: ship.guns.indexOf(g) });
    await fire(side, ship, g, v, false); if (tok !== M.token || checkEnd()) return;
    if (M.dice.length) { M.phase = 'aim'; setHint(); if (M.clock) M.clock.left = M.clock.limit; } else endTurn();
  } else if (M.phase === 'roll' && M.tool === 'rocket' && side.pw.rocket > 0) {
    side.pw.rocket--; M.tool = null; M.phase = 'firing';
    if (M.net) netSend({ t: 'rocket', s: shipIdx(ship), g: ship.guns.indexOf(g) });
    await fire(side, ship, g, 6, true); if (tok !== M.token || checkEnd()) return; endTurn();
  }
}
async function humanShield(side, s) {
  if (M.net) netSend({ t: 'shield', s: shipIdx(s) });
  await useShield(side, s);
}
async function humanMove(s, d) {
  if (!humanTurn() || M.phase !== 'roll') return; M.phase = 'moving'; M.tool = null; const tok = M.token; M.sel = null;
  if (M.net) netSend({ t: 'move', s: shipIdx(s), d });
  await moveShip(s, d); if (tok !== M.token || checkEnd()) return; endTurn();
}
function toggleTool(tl) {
  if (!humanTurn() || M.phase !== 'roll') return; const side = M.sides[M.turn];
  if (tl === 'bolt') { if (side.pw.bolt > 0) { M.boltArmed = !M.boltArmed; M.tool = null; if (M.boltArmed) sfx.zap(); } setHint(); return; }
  if (tl !== 'move' && side.pw[tl] <= 0) return;
  M.tool = M.tool === tl ? null : tl; M.sel = null; setHint();
}
/* shot clock ran out: the game plays for you */
function clockExpired() {
  const side = M.sides[M.turn]; if (!humanTurn()) return;
  addFloat(W / 2, rowY(M.G / 2), t('fx_time'), RED, 44);
  if (M.phase === 'roll') { M.boltArmed = false; humanRoll(true); }
  else if (M.phase === 'aim') { const keep = side.ai; side.ai = { skill: 1 }; const b = aiBest(side, M.dice[0], false); side.ai = keep; if (b) humanFire(b.sh, b.g); }
}

/* ---- AI ---- */
function sniperBonus(ship) { return ship.type === 'sniper' ? 1 : 0; }
function aiEval(side, ship, g, amt, rocket) {
  amt += rocket ? 0 : sniperBonus(ship);
  const o = outcome(side, ship, g, amt, rocket), I = o.I; let s = 0;
  if (o.type === 'hit') { const T = I.T; s = T.shield ? 420 : (T.parts ? (T.parts[partAt(T, I.c)].hp <= 1 ? 800 : 520) : T.hp <= 1 ? 1000 + (T.w > 3 ? 250 : 0) : 560); if (o.cut) s += 60; }
  else if (o.type === 'miss') s = -600;
  else if (o.type === 'block') s = 40 + (I.T ? 30 : -200);
  else {
    if (!I.T) s = -400;
    else {
      const rem = I.hit - o.at; s = 130 - rem * 6; if (rem <= 6) s += 70; if (rem <= 3) s += 25;
      if (o.cut) { const rem2 = I.hit - I.em; s += 120 + I.em * 22; if (rem2 <= 6) s += 380 * (7 - rem2) / 6 + 120; }
      if (I.T.hp > 1) s -= 18 * (I.T.hp - 1); if (I.T.shield) s -= 40;
    }
  }
  // (player-side AI / auto-play) try to have a line ready in the raider's path
  if (side.idx === 0 && M.raider && o.type === 'extend') {
    const R = M.raider, c = I.c, ahead = R.dir > 0 ? (c > R.c && c <= R.c + R.step * 2) : (c < R.c && c >= R.c - R.step * 2);
    const f = frontRow(ship, c); if (ahead && f > R.row && f - g.m > R.row + .5 && f - o.at <= R.row + .5) s += 260;
  }
  return { o, s };
}
function aiBest(side, amt, rocket) {
  const sk = side.ai.skill, cands = [];
  for (const sh of alive(side)) for (const g of sh.guns) { if (g.dead) continue; const e = aiEval(side, sh, g, amt, rocket); cands.push({ sh, g, s: e.s + (Math.random() - .5) * 450 * (1 - sk), o: e.o }); }
  if (!cands.length) return null;
  if (Math.random() < (1 - sk) * .3) { const ok = cands.filter(c => c.o.I.T); if (ok.length) return ok[Math.random() * ok.length | 0]; }
  cands.sort((a, b) => b.s - a.s); return cands[0];
}
function threatOn(ship) {
  const opp = M.sides[1 - ship.side]; let m = Infinity;
  for (const s of alive(opp)) for (const g of s.guns) { if (g.m <= 0 || g.dead) continue; const I = colInfo(opp, s, g); if (I.T === ship) m = Math.min(m, I.hit - g.m); }
  return m;
}
async function aiFreeMoves(side) {
  const tok = M.token;
  // boss: random 4-direction movement while its engines work
  for (const b of alive(side)) {
    if (b.type !== 'boss' || b.parts.eng.hp <= 0 || Math.random() > .35) continue;
    const opts = [];
    if (canMove(b, -1)) opts.push(['x', -1]); if (canMove(b, 1)) opts.push(['x', 1]);
    if (b.gunRow < b.baseRow + 2) opts.push(['y', 1]); if (b.gunRow > b.baseRow - 1) opts.push(['y', -1]);
    if (!opts.length) continue;
    const [ax, d] = opts[Math.random() * opts.length | 0];
    if (ax === 'x') await moveShip(b, d); else await moveShipRow(b, d);
    if (tok !== M.token || checkEnd()) return false;
  }
  // interceptors hop sideways when their lines are short
  for (const s of alive(side)) {
    if (s.type !== 'interceptor' || Math.random() > .35 || s.guns.some(g => g.m > 1)) continue;
    const ds = [-1, 1].filter(d => canMove(s, d)); if (!ds.length) continue;
    await moveShip(s, ds[Math.random() * ds.length | 0]); if (tok !== M.token || checkEnd()) return false;
  }
  return true;
}
async function aiTurn(side) {
  const tok = M.token, sk = side.ai ? side.ai.skill : .7; if (!side.ai) side.ai = { skill: .7, loaded: false };
  await wait(800 / TS); if (tok !== M.token) return;
  if (!(await aiFreeMoves(side))) return;
  // shield
  if (side.pw.shield > 0 && Math.random() < .3 + sk * .7) {
    let best = null, bt = Infinity;
    for (const s of alive(side)) { if (s.shield) continue; const tt = threatOn(s); if (tt < bt) { bt = tt; best = s; } }
    if (best && bt <= (sk > .6 ? 6 : 3)) { await useShield(side, best); if (tok !== M.token) return; }
  }
  // reposition
  const hasT = alive(side).some(s => s.guns.some(g => !g.dead && colInfo(side, s, g).T));
  const opp = M.sides[1 - side.idx];
  const laneVal = s => { let v = 0; for (const g of s.guns) { if (g.dead) continue; const I = colInfo(side, s, g); if (I.T) v += (I.eg ? 45 : 110) + Math.max(0, 20 - (I.hit - g.m)) + g.m * 4; else { let md = 99; for (const e of alive(opp)) md = Math.min(md, Math.max(0, Math.abs(I.c - e.x) - half(e))); v -= md * 6; } } return v; };
  let best = null, bs = -1e9;
  for (const s of alive(side)) {
    if (s.type === 'boss') continue;
    const cur = laneVal(s);
    for (const d of [-1, 1]) {
      if (!canMove(s, d)) continue; s.x += d;
      let sc = laneVal(s) - cur - s.guns.reduce((a, g) => a + g.m * 6, 0);
      if (threatOn(s) <= 0) sc -= 800; s.x -= d; sc += Math.random() * 10;
      if (sc > bs) { bs = sc; best = { s, d }; }
    }
  }
  const wantMove = best && (!hasT || (bs > 55 && Math.random() < sk * .55));
  if (wantMove) {
    if (side.isAI) M.hint = t('hint_enemy_move');
    M.sel = best.s; await wait(750 / TS); M.sel = null; await moveShip(best.s, best.d); if (tok !== M.token || checkEnd()) return; endTurn(); return;
  }
  // rocket
  if (side.pw.rocket > 0 && Math.random() < .25 + sk * .6) {
    const b = aiBest(side, 6, true);
    if (b && b.o.type === 'hit' && (b.o.I.T.hp <= 1 && !b.o.I.T.shield && !b.o.I.T.parts)) {
      side.pw.rocket--; M.phase = 'firing'; await wait(250 / TS); await fire(side, b.sh, b.g, 6, true);
      if (tok !== M.token || checkEnd()) return; endTurn(); return;
    }
  }
  let n = 1;
  if (side.pw.bolt > 0 && Math.random() < .12 + sk * .45) { side.pw.bolt--; n = 2; sfx.zap(); M.flash = .6; await wait(300 / TS); }
  M.phase = 'rolling'; const vals = await rollDice(side, n); if (tok !== M.token) return;
  M.dice = vals.slice(); M.phase = 'aim';
  for (const v of vals) {
    await wait(750 / TS); if (tok !== M.token) return;
    const b = aiBest(side, v, false); M.dice.shift(); M.diceUI && M.diceUI.used++;
    if (b) { M.phase = 'firing'; await fire(side, b.sh, b.g, v + sniperBonus(b.sh), false); }
    if (tok !== M.token || checkEnd()) return;
  }
  endTurn();
}

/* ---- remote (Wi-Fi / Bluetooth) turn processing ---- */
function netMap(msg) {
  const side = M.sides[1], n = side.ships.length;
  const s = msg.s != null ? side.ships[n - 1 - msg.s] : null;
  const g = s && msg.g != null ? s.guns[s.guns.length - 1 - msg.g] : null;
  return { side, s, g };
}
async function netPump() {
  if (!M || !M.net || M.netBusy || !M.netQ.length || M.over) return;
  const side = M.sides[M.turn]; if (!side.isRemote) return;
  const msg = M.netQ[0];
  if (msg.t === 'roll' && M.phase !== 'roll') return;
  if ((msg.t === 'fire') && M.phase !== 'aim') return;
  if ((msg.t === 'rocket' || msg.t === 'move' || msg.t === 'shield') && M.phase !== 'roll') return;
  M.netQ.shift(); M.netBusy = true; const tok = M.token;
  try {
    const { s, g } = netMap(msg);
    if (msg.t === 'shield') { await useShield(side, s); }
    else if (msg.t === 'roll') {
      if (msg.n === 2) { side.pw.bolt--; sfx.zap(); M.flash = .6; }
      M.phase = 'rolling'; const vals = await rollDice(side, msg.n, msg.raw); if (tok !== M.token) return;
      M.dice = vals; M.phase = 'aim';
    } else if (msg.t === 'fire') {
      M.phase = 'firing'; const v = M.dice.shift(); M.diceUI && M.diceUI.used++;
      await fire(side, s, g, v, false); if (tok !== M.token || checkEnd()) return;
      if (M.dice.length) M.phase = 'aim'; else endTurn();
    } else if (msg.t === 'rocket') {
      side.pw.rocket--; M.phase = 'firing'; await fire(side, s, g, 6, true); if (tok !== M.token || checkEnd()) return; endTurn();
    } else if (msg.t === 'move') {
      M.phase = 'moving'; await moveShip(s, -msg.d); if (tok !== M.token || checkEnd()) return; endTurn();
    }
  } finally { if (M) M.netBusy = false; }
}
