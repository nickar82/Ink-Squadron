/* =========================================================
   SEASONAL THEMES — switch on automatically by date
   ========================================================= */
var SEASON = { id: 'none' };
const SEASONS = {
  halloween: { enemy: '#7b3fe0', grid: 'rgba(120,70,200,0.30)', accent: '#ff7a1f' },
  winter: { enemy: '#2a7fe0', grid: 'rgba(60,120,210,0.32)', accent: '#5ab0ff' },
  valentine: { enemy: '#d6336c', grid: 'rgba(214,51,108,0.22)', accent: '#ff6fa5' },
  summer: { enemy: '#0a9aa8', grid: 'rgba(10,140,160,0.26)', accent: '#ffb02e' },
  none: {}
};
const THEME_OPTS = ['auto', 'off', 'halloween', 'winter', 'valentine', 'summer'];
function detectSeason(d) {
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 10 && day >= 15) || (m === 11 && day <= 2)) return 'halloween';
  if ((m === 12 && day >= 10) || (m === 1 && day <= 7)) return 'winter';
  if (m === 2 && day >= 7 && day <= 15) return 'valentine';
  if (m === 7 || m === 8) return 'summer';
  return 'none';
}
function applySeason() {
  const th = save.settings.theme || 'auto';
  const id = th === 'off' ? 'none' : th === 'auto' ? detectSeason(new Date()) : th;
  SEASON = Object.assign({ id, fx: [], spawn: 0 }, SEASONS[id] || {});
  if (typeof buildBg === 'function' && bgCanvas) buildBg();
}
function pumpkin(c, x, y, s) {
  c.save(); c.translate(x, y); c.lineWidth = Math.max(2, s * .06); c.strokeStyle = '#1b2a5e';
  for (const [dx, rx] of [[-.32, .34], [.32, .34], [0, .38]]) { c.beginPath(); c.ellipse(dx * s, 0, rx * s, .42 * s, 0, 0, 7); c.fillStyle = '#ff8a2a'; c.fill(); c.stroke(); }
  c.fillStyle = '#3a8a3a'; c.fillRect(-.05 * s, -.6 * s, .1 * s, .2 * s);
  c.fillStyle = '#1b2a5e'; c.beginPath(); c.moveTo(-.26 * s, -.1 * s); c.lineTo(-.12 * s, -.1 * s); c.lineTo(-.19 * s, -.22 * s); c.fill(); c.beginPath(); c.moveTo(.26 * s, -.1 * s); c.lineTo(.12 * s, -.1 * s); c.lineTo(.19 * s, -.22 * s); c.fill();
  c.beginPath(); c.moveTo(-.25 * s, .08 * s); for (let i = 0; i <= 6; i++) c.lineTo((-.25 + i * .083) * s, (.08 + (i % 2 ? .1 : 0)) * s); c.lineTo(.25 * s, .18 * s); c.lineTo(-.25 * s, .18 * s); c.fill();
  c.restore();
}
function bat(c, x, y, s, t) {
  c.save(); c.translate(x, y); const f = Math.sin(t * 12) * .25; c.fillStyle = '#2b1d4a';
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-.4 * s, (-.3 + f) * s, -.8 * s, (-.05 + f) * s); c.quadraticCurveTo(-.55 * s, .05 * s, -.4 * s, .15 * s); c.quadraticCurveTo(-.2 * s, .05 * s, 0, .2 * s);
  c.quadraticCurveTo(.2 * s, .05 * s, .4 * s, .15 * s); c.quadraticCurveTo(.55 * s, .05 * s, .8 * s, (-.05 + f) * s); c.quadraticCurveTo(.4 * s, (-.3 + f) * s, 0, 0); c.fill(); c.restore();
}
function snowflake(c, x, y, s, a) {
  c.save(); c.translate(x, y); c.rotate(a || 0); c.strokeStyle = 'rgba(60,120,210,.55)'; c.lineWidth = Math.max(1.5, s * .08); c.lineCap = 'round';
  for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s); c.moveTo(0, -s * .55); c.lineTo(s * .2, -s * .75); c.moveTo(0, -s * .55); c.lineTo(-s * .2, -s * .75); c.stroke(); }
  c.restore();
}
function heart(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.beginPath(); c.moveTo(0, s * .3); c.bezierCurveTo(-s, -s * .3, -s * .5, -s, 0, -s * .45); c.bezierCurveTo(s * .5, -s, s, -s * .3, 0, s * .3); c.closePath();
  c.fillStyle = col || '#ff6fa5'; c.fill(); c.strokeStyle = '#1b2a5e'; c.lineWidth = Math.max(1.5, s * .08); c.stroke(); c.restore();
}
function sunDoodle(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.rotate((t || 0) * .2); c.strokeStyle = '#ff9a2e'; c.lineWidth = s * .08; c.lineCap = 'round';
  for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, -s * .62); c.lineTo(0, -s * .9); c.stroke(); }
  c.beginPath(); c.arc(0, 0, s * .5, 0, 7); c.fillStyle = '#ffd23a'; c.fill(); c.strokeStyle = '#1b2a5e'; c.lineWidth = s * .06; c.stroke(); c.restore();
}
function seasonBg(b) {
  const id = SEASON.id, r = mulberry(77);
  if (id === 'halloween') { pumpkin(b, 60, H - 70, 70); pumpkin(b, W - 70, H - 60, 56); for (let i = 0; i < 4; i++) bat(b, 80 + r() * (W - 160), 140 + r() * 120, 26, i); }
  else if (id === 'winter') { for (let i = 0; i < 14; i++) snowflake(b, r() * W, r() * H, 10 + r() * 14, r() * 3); }
  else if (id === 'valentine') { for (let i = 0; i < 10; i++) heart(b, r() * W, r() * H, 10 + r() * 12, 'rgba(255,111,165,.35)'); }
  else if (id === 'summer') { sunDoodle(b, W - 70, 150, 70, 0); }
}
function seasonUpdate(dt) {
  const id = SEASON.id; if (id === 'none' || id === 'summer') return;
  SEASON.spawn -= dt;
  if (SEASON.spawn <= 0 && SEASON.fx.length < 40) {
    SEASON.spawn = id === 'winter' ? .12 : .45;
    SEASON.fx.push({ x: rnd(0, W), y: -20, vy: rnd(40, 90), vx: rnd(-20, 20), a: rnd(0, 6), va: rnd(-2, 2), s: rnd(6, 13) });
  }
  for (const p of SEASON.fx) { p.x += (p.vx + Math.sin(p.y * .02) * 20) * dt; p.y += p.vy * dt; p.a += p.va * dt; }
  SEASON.fx = SEASON.fx.filter(p => p.y < H + 30);
}
function seasonDraw() {
  const id = SEASON.id; if (id === 'none' || id === 'summer') return;
  ctx.save(); ctx.globalAlpha = .7;
  for (const p of SEASON.fx) {
    if (id === 'winter') { ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(60,120,210,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .4, 0, 7); ctx.fill(); ctx.stroke(); }
    else if (id === 'halloween') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.s > 10 ? '#ff8a2a' : '#c9561a'; ctx.beginPath(); ctx.ellipse(0, 0, p.s * .6, p.s * .3, 0, 0, 7); ctx.fill(); ctx.restore(); }
    else if (id === 'valentine') heart(ctx, p.x, p.y, p.s * .7, '#ff8fb8');
  }
  ctx.restore();
}
/* small decoration drawn on the main menu */
function seasonMenu(t) {
  const id = SEASON.id; if (id === 'none') return;
  const label = t_('season_' + id);
  if (id === 'halloween') { bat(ctx, 120 + Math.sin(t) * 40, 140 + Math.cos(t * 1.3) * 20, 30, t); bat(ctx, 600 + Math.cos(t * .8) * 40, 300 + Math.sin(t) * 20, 24, t + 1); }
  if (id === 'summer') sunDoodle(ctx, 610, 120, 60, t);
  if (id === 'winter') { // santa hat on the hero
    const cy = H * .17 - Math.min(140, H * .11) * .5 * 1.08 + Math.sin(t * 2) * 5;
    ctx.save(); ctx.translate(W / 2, cy - 4); ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(0, -60, 34, -44); ctx.lineTo(26, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; rrPath(ctx, -30, -6, 60, 14, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(36, -44, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.save(); ctx.translate(W - 110, H * .29); ctx.rotate(.12);
  sketchBox(-100, -24, 200, 48, { r: 24, fill: SEASON.accent || YEL, shadow: false }); txt(label, 0, 2, 20, { color: '#fff', stroke: NAVY, sw: 4, max: 186 }); ctx.restore();
}
