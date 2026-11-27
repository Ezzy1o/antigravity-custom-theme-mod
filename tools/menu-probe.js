// Antigravity menu probe: waits a few seconds (open a menu meanwhile), then prints the
// DOM ancestry and backgrounds of the element containing the given text.
// Usage: node menu-probe.js "Create Project"
const fs = require('fs');
const path = require('path');

const needle = process.argv[2] || 'Create Project';
const delaySec = 6;
const portFile = process.env.AGY_PORT_FILE ||
  path.join(process.env.APPDATA || '', 'Antigravity', 'DevToolsActivePort');
const port = parseInt(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0], 10);

const EXPR = `(() => {
  const needle = ${JSON.stringify(needle)};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node, hit = null;
  while ((node = walker.nextNode())) { if (node.nodeValue.includes(needle)) { hit = node.parentElement; break; } }
  if (!hit) return JSON.stringify({ found: false, url: location.href });
  const chain = [];
  for (let el = hit, i = 0; el && el !== document.body && i < 10; el = el.parentElement, i++) {
    const cs = getComputedStyle(el);
    const data = Array.from(el.attributes).filter(a => a.name.startsWith('data-') || a.name === 'role' || a.name === 'id')
      .map(a => a.name + '=' + String(a.value).slice(0, 40));
    chain.push({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 160), attrs: data,
      bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 60), position: cs.position });
  }
  return JSON.stringify({ found: true, url: location.href, chain });
})()`;

function evaluate(wsUrl) {
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => { try { ws.close(); } catch (e) {} resolve({ error: 'timeout' }); }, 4000);
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: EXPR, returnByValue: true } }));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== 1) return;
      clearTimeout(timer); ws.close();
      const v = msg.result && msg.result.result && msg.result.result.value;
      resolve(v ? JSON.parse(v) : { error: 'eval failed' });
    };
    ws.onerror = () => { clearTimeout(timer); resolve({ error: 'websocket error' }); };
  });
}

(async () => {
  console.log(`Open the menu in Antigravity now. Capturing in ${delaySec} seconds...`);
  await new Promise((r) => setTimeout(r, delaySec * 1000));
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const pages = (await res.json()).filter((t) => t.type === 'page' && t.url.startsWith('https://127.0.0.1'));
  for (const t of pages) {
    const out = await evaluate(t.webSocketDebuggerUrl);
    if (out.found) { console.log(JSON.stringify(out, null, 2)); return; }
  }
  console.log(`Text "${needle}" not found. Was the menu open when the capture ran?`);
})().catch((e) => console.error('Probe failed:', e.message));
