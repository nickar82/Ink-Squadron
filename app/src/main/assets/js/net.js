/* =========================================================
   LOCAL MULTIPLAYER — Wi-Fi / Bluetooth via Google Nearby Connections
   Lockstep: each phone sends its own actions (dice values included).
   ========================================================= */
const Net = { host: false, connected: false, peer: '', status: '', busy: false };
function pilotName() { const n = (save.names || {}).p1; if (n && n.trim()) return n.trim().toUpperCase(); if (!save.pilot) { save.pilot = 'Pilot-' + (100 + Math.random() * 900 | 0); persist(); } return save.pilot; }
function netAvailable() { const b = Bridge(); try { return !!(b && b.netAvailable && b.netAvailable()); } catch (e) { return false; } }
function netHost() { const b = Bridge(); if (!b) return; Net.host = true; Net.connected = false; Net.status = t('net_hosting'); Net.busy = true; try { b.netHost(pilotName()); } catch (e) { Net.status = t('net_error'); } }
function netJoin() { const b = Bridge(); if (!b) return; Net.host = false; Net.connected = false; Net.status = t('net_searching'); Net.busy = true; try { b.netJoin(pilotName()); } catch (e) { Net.status = t('net_error'); } }
function netSend(o) { const b = Bridge(); if (!b || !Net.connected) return; try { b.netSend(JSON.stringify(o)); } catch (e) { } }
function netStop() { const b = Bridge(); Net.connected = false; Net.busy = false; Net.status = ''; try { b && b.netStop(); } catch (e) { } }
function netStartMatch() {
  if (!Net.host || !Net.connected) return;
  const cfg = versusCfg(); cfg.net = true; cfg.oppName = Net.peer;
  netSend({ t: 'start', cfg });
  if (M) M.token = null; newMatch(cfg);
}
window.inkNet = {
  onEvent(json) {
    let e; try { e = typeof json === 'string' ? JSON.parse(json) : json; } catch (x) { return; }
    if (e.type === 'status') Net.status = t(e.key || 'net_searching');
    else if (e.type === 'connected') { Net.connected = true; Net.busy = false; Net.peer = e.name || t('opponent'); Net.status = t('net_connected', Net.peer); sfx.win(); vib(60); if (Net.host) netSend({ t: 'hello', name: pilotName() }); }
    else if (e.type === 'error') { Net.busy = false; Net.status = t('net_error') + (e.text ? ' (' + e.text + ')' : ''); }
    else if (e.type === 'disconnected') { Net.connected = false; Net.busy = false; Net.status = t('net_lost'); if (M && M.net && !M.result) M.netLost = true; }
    else if (e.type === 'msg') {
      let o; try { o = JSON.parse(e.data); } catch (x) { return; }
      if (o.t === 'hello') { Net.peer = o.name || Net.peer; Net.status = t('net_connected', Net.peer); }
      else if (o.t === 'start') { const c = Object.assign({}, o.cfg, { first: 1 - o.cfg.first, net: true, oppName: Net.peer }); if (M) M.token = null; newMatch(c); }
      else if (o.t === 'bye') { if (M && M.net && !M.result) M.netLost = true; }
      else if (M && M.net) M.netQ.push(o);
    }
  }
};
SCENES.lobby = {
  draw(gt) {
    drawGrid(40, 0, 0); header(t('wifi_bt'), () => { netStop(); go('setup'); });
    txt(t('net_intro'), W / 2, 176, 24, { color: '#5a6c9a', max: 640 });
    txt(t('net_you_are', pilotName()), W / 2, 214, 22, { color: '#5a6c9a', max: 640 });
    const y = 270;
    sketchBox(70, y, 580, 250, { r: 30 });
    // antenna doodle
    const ax = W / 2, ay = y + 110, pulse = (gt * 1.3) % 1;
    ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + 70); ctx.stroke();
    if (Net.busy || Net.connected) for (let i = 0; i < 3; i++) { const r = 20 + ((i / 3 + pulse) % 1) * 70; ctx.globalAlpha = 1 - ((i / 3 + pulse) % 1); ctx.beginPath(); ctx.arc(ax, ay, r, -Math.PI * .85, -Math.PI * .15); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, 12, 0, 7); ctx.fillStyle = Net.connected ? '#3fbf6f' : Net.busy ? YEL : '#c9d4ea'; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    txt(Net.status || t('net_pick'), W / 2, y + 220, 26, { color: Net.connected ? '#2a8a4a' : NAVY, max: 540 });
    if (!Net.connected) {
      bigButton('nhost', 90, y + 290, 260, 96, t('host'), { fill: YEL, fs: 34, disabled: Net.busy && Net.host }, () => netHost());
      bigButton('njoin', 370, y + 290, 260, 96, t('join'), { fill: '#dde9ff', fs: 34, disabled: Net.busy && !Net.host }, () => netJoin());
      if (Net.busy) bigButton('ncancel', 210, y + 410, 300, 70, t('cancel'), { fs: 26 }, () => netStop());
    } else if (Net.host) {
      txt(t('net_settings', save.vs.ships, [t('short'), t('medium'), t('long')][save.vs.len]), W / 2, y + 300, 22, { color: '#5a6c9a', max: 600 });
      bigButton('nstart', 110, y + 330, 500, 104, t('start_battle'), { fill: YEL, hatch: 'rgba(230,160,20,0.35)', primary: true, icon: iconPlay, fs: 38 }, () => netStartMatch());
    } else txt(t('wait_host'), W / 2, y + 340, 28, { max: 600 });
  },
  back() { netStop(); go('setup'); return true; }
};
