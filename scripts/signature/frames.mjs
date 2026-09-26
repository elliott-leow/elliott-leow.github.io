import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
const [,, url, dir, fps = '60', lead = '250'] = process.argv
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9336', '--hide-scrollbars', '--force-color-profile=srgb', `--user-data-dir=${mkdtempSync('/tmp/cdp-')}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
for (let i = 0; i < 50; i++) { try { const l = await (await fetch('http://127.0.0.1:9336/json')).json(); const p = l.find((t) => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break } } catch {} await sleep(100) }
await new Promise((r) => ws.addEventListener('open', r))
let id = 0; const pend = new Map()
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Emulation.setDeviceMetricsOverride', { width: 1062, height: 450, deviceScaleFactor: 1, mobile: false })
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
await send('Page.navigate', { url }); await sleep(800)
const end = (await send('Runtime.evaluate', { expression: 'END', returnByValue: true })).result.value
const step = 1000 / +fps
const n = Math.ceil((+lead + end) / step) + 1
for (let k = 0; k <= n; k++) {
  await send('Runtime.evaluate', { expression: `frame(${k * step - +lead})` })
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1062, height: 450, scale: 1 } })
  writeFileSync(`${dir}/f${String(k).padStart(4, '0')}.png`, Buffer.from(r.data, 'base64'))
}
console.log('end', end, 'frames', n + 1)
chrome.kill(); process.exit(0)
