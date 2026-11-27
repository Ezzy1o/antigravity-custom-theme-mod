// Antigravity boot-intro probe: reports boot flags on every themed page via CDP.
// Usage: node boot-probe.js
const fs = require('fs');
const path = require('path');

const portFile = process.env.AGY_PORT_FILE ||
  path.join(process.env.APPDATA || '', 'Antigravity', 'DevToolsActivePort');
const port = parseInt(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0], 10);

const EXPR = `JSON.stringify({
  url: location.href,
  uptimeSec: Math.round(performance.now() / 1000),
  visibility: document.visibilityState,
  themeActive: !!document.getElementById('antigravity-custom-theme-active'),
  bootPlayed: !!window.__AGY_BOOT_PLAYED__,
  bootFinished: !!window.__AGY_BOOT_FINISHED__,
  bootOverlayInDom: !!document.getElementById('agy-boot-overlay'),
  lazyMods: Object.keys(window.__AGY_LOADED_MODS__ || {}),
  mediaBase: window.__AGY_MEDIA_BASE_URL__ || null,
  bootIntroSetting: localStorage.getItem('agy_boot_intro_v3')
})`;

function evaluate(wsUrl) {
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => { try { ws.close(); } catch (e) {} resolve({ error: 'timeout' }); }, 4000);
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: EXPR, returnByValue: true } }));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== 1) return;
      clearTimeout(timer);
      ws.close();
      const v = msg.result && msg.result.result && msg.result.result.value;
      resolve(v ? JSON.parse(v) : { error: JSON.stringify(msg) });
    };
    ws.onerror = () => { clearTimeout(timer); resolve({ error: 'websocket error' }); };
  });
}

(async () => {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = (await res.json()).filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  console.log(`CDP port ${port}, ${targets.length} page(s)\n`);
  for (const t of targets) {
    console.log(`[${t.id.slice(0, 8)}] ${t.title}`);
    console.log(JSON.stringify(await evaluate(t.webSocketDebuggerUrl), null, 2), '\n');
  }
})().catch((e) => console.error('Probe failed:', e.message));
