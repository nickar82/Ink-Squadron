/* =========================================================
   SERVICES — achievements, leaderboards (Google Play Games), ads (AdMob)
   Everything works offline; the Android bridge is used when present.
   ========================================================= */
const Bridge = () => (typeof window.AndroidBridge !== 'undefined' ? window.AndroidBridge : null);
const ACH = [
  // id, icon, target (1 = one-shot)
  ['first_win', '🏁', 1], ['flawless', '⭐', 1], ['boss', '👑', 1], ['cut25', '✂', 25], ['rocket_kill', '🚀', 1],
  ['raider', '💣', 1], ['bunker20', '🧱', 20], ['level25', '25', 1], ['level50', '50', 1], ['level100', '100', 1],
  ['stars100', '★', 100], ['arcade10', '🕹', 1], ['bonus20', '🎈', 1], ['ta5000', '⏱', 1], ['vs_win', '⚔', 1],
  ['nearby_win', '📶', 1], ['variety', '✈', 1], ['season', '🎃', 1]
];
const LEADERBOARDS = { stars: 'lb_total_stars', arcade: 'lb_arcade', ta60: 'lb_time_attack_60', ta120: 'lb_time_attack_120', ta180: 'lb_time_attack_180' };
function achProgress(id) { return save.ach[id] || 0; }
function achDone(id) { const a = ACH.find(x => x[0] === id); return a && achProgress(id) >= a[2]; }
function achAdd(id, n = 1) {
  const a = ACH.find(x => x[0] === id); if (!a) return;
  const before = achProgress(id); if (before >= a[2]) return;
  save.ach[id] = Math.min(a[2], before + n); persist();
  const b = Bridge();
  try { if (b && b.pgsAchievement) b.pgsAchievement('ach_' + id, a[2] > 1 ? n : 0); } catch (e) { }
  if (save.ach[id] >= a[2]) toast(t('ach_unlocked'), t('ach_' + id));
}
function achSet(id, v) { const cur = achProgress(id); if (v > cur) achAdd(id, v - cur); }
function submitScore(board, score) { if (!LEADERBOARDS[board]) return; const b = Bridge(); try { if (b && b.pgsScore) b.pgsScore(LEADERBOARDS[board], Math.round(score)); } catch (e) { } }
let toasts = [];
function toast(title, text) { toasts.push({ title, text, t: 0 }); sfx.star(2); }
function drawToasts(dt) {
  if (!toasts.length) return; const tt = toasts[0]; tt.t += dt;
  const k = tt.t < .3 ? easeOut(tt.t / .3) : tt.t > 2.7 ? 1 - (tt.t - 2.7) / .3 : 1;
  const y = -90 + k * 120;
  sketchBox(110, y, 500, 80, { r: 22, fill: '#fff4c6' }); star(155, y + 40, 22, true);
  txt(tt.title, 190, y + 26, 18, { align: 'left', color: '#8a6a00', max: 400 }); txt(tt.text, 190, y + 54, 24, { align: 'left', max: 400 });
  if (tt.t > 3) toasts.shift();
}
const seenTypes = () => (save.stats.types = save.stats.types || {});
/* one entry point for everything the game reports */
function gameEvent(ev, d = {}) {
  const st = save.stats;
  switch (ev) {
    case 'win':
      achAdd('first_win'); if (d.stars === 3) achAdd('flawless'); if (d.boss) achAdd('boss');
      if (d.level >= 25) achAdd('level25'); if (d.level >= 50) achAdd('level50'); if (d.level >= 100) achAdd('level100');
      achSet('stars100', Math.min(100, totalStars())); submitScore('stars', totalStars()); break;
    case 'cut': st.cuts = (st.cuts || 0) + 1; achAdd('cut25'); break;
    case 'kill': if (d.rocket) achAdd('rocket_kill'); { const s = seenTypes(); s[d.type] = 1; if (['fighter', 'armored', 'interceptor', 'bomber', 'tank', 'sniper'].every(k => s[k])) achAdd('variety'); } break;
    case 'raider': achAdd('raider'); break;
    case 'bunker': achAdd('bunker20'); break;
    case 'wave': if (d.mode === 'arcade' && d.wave >= 10) achAdd('arcade10'); break;
    case 'bonus': if (d.pops >= 20) achAdd('bonus20'); break;
    case 'rtover':
      if (d.mode === 'arcade') submitScore('arcade', d.score);
      else { submitScore('ta' + d.dur, d.score); if (d.score >= 5000) achAdd('ta5000'); }
      break;
    case 'vsend': achAdd('vs_win'); break;
    case 'netend': if (d.winner === 0) achAdd('nearby_win'); break;
  }
  persist();
}
function onMatchStart() { if (typeof SEASON !== 'undefined' && SEASON.id !== 'none') achAdd('season'); }
const PGS = {
  available() { const b = Bridge(); try { return !!(b && b.pgsAvailable && b.pgsAvailable()); } catch (e) { return false; } },
  showAchievements() { const b = Bridge(); try { b && b.pgsShowAchievements(); } catch (e) { } },
  showLeaderboards() { const b = Bridge(); try { b && b.pgsShowLeaderboards(); } catch (e) { } },
  signIn() { const b = Bridge(); try { b && b.pgsSignIn(); } catch (e) { } }
};
/* ---- Ads: App Open at launch (native), interstitial every 5 cleared levels and on quit-to-menu ---- */
const Ads = {
  last: 0, MIN_GAP: 60000,
  show(reason, after) {
    const b = Bridge(), now = Date.now();
    if (!b || !b.adsInterstitial || now - this.last < this.MIN_GAP) { after && after(); return; }
    this.last = now; this.after = after || null;
    try { b.adsInterstitial(reason); } catch (e) { this.done(); }
  },
  done() { const f = this.after; this.after = null; if (f) f(); },
  afterLevel(level, after, quitting) { if (level % 5 === 0) this.show('level', after); else after && after(); },
  onQuit() { this.show('quit'); }
};
window.inkAdClosed = function () { Ads.done(); };
window.inkPgsState = function () { };
