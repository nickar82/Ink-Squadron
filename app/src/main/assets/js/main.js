/* =========================================================
   LOOP & BOOT
   ========================================================= */
window.inkBack = function () { try { return !!(scene && scene.back && scene.back()); } catch (e) { return false; } };
let last = performance.now(), gt = 0;
function frame(now) {
  let dt = Math.min(.05, (now - last) / 1000); last = now; gt += dt;
  const inMatch = M && (scene === SCENES.game || scene === SCENES.arena);
  const intro = inMatch && Intro.on;
  const paused = inMatch && (M.paused || M.netLost || intro);
  if (intro) Intro.update(dt); else if (Intro.on && !inMatch) Intro.on = false;
  if (!paused) {
    const sdt = dt * TS;
    for (const tm of timers.slice()) { tm.t += sdt; if (tm.fn) tm.fn(Math.min(1, tm.t / tm.d)); if (tm.t >= tm.d) { const i = timers.indexOf(tm); if (i >= 0) timers.splice(i, 1); tm.done(); } }
    updateFx(dt);
  }
  seasonUpdate(dt); musicUpdate();
  sceneT += dt;
  hits = [];
  drawPaper();
  try { scene.draw(gt, paused ? 0 : dt * (scene === SCENES.arena ? TS : 1)); if (!inMatch) drawFx(); if (intro) drawIntro(); } catch (e) { console.error(e); }
  seasonDraw();
  drawToasts(dt);
  if (window.innerWidth > window.innerHeight * 1.05) {
    ctx.save(); ctx.fillStyle = 'rgba(243,246,252,.96)'; ctx.fillRect(-OX / SC, 0, W + 2 * OX / SC, H);
    ctx.translate(W / 2, H * .42); ctx.rotate(Math.sin(gt * 2) * .3 - .3); rrPath(ctx, -50, -85, 100, 170, 16); ctx.strokeStyle = NAVY; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    txt(t('rotate'), W / 2, H * .62, 36, { color: NAVY, max: 640 });
  }
  if (fade > 0) { ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); ctx.restore(); fade = Math.max(0, fade - dt * 4); }
  requestAnimationFrame(frame);
}
applySeason(); resize();
save.stats.sessions = (save.stats.sessions || 0) + 1; persist();
try { screen.orientation && screen.orientation.lock && screen.orientation.lock('portrait').catch(() => { }); } catch (e) { }
if (!save.lang) { SCENES.lang.from = null; go('lang'); } else go('menu');
fade = 0;
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => { if (document.hidden && M && !M.result && !M.net) M.paused = true; if (document.hidden && AC) AC.suspend && AC.suspend(); else if (AC) AC.resume && AC.resume(); });
window.inkPause = function () { if (M && !M.result && !M.net) M.paused = true; try { AC && AC.suspend(); } catch (e) { } };
window.inkResume = function () { try { AC && AC.resume(); } catch (e) { } last = performance.now(); };
// debug / test hooks
window.__ink = { Intro, levelCfg, newMatch, versusCfg, startRT, get M() { return M; }, setTS(v) { TS = v; }, go, save, applySeason, setLang, get scene() { return Object.keys(SCENES).find(k => SCENES[k] === scene); } };
