import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9337', `--user-data-dir=${mkdtempSync('/tmp/cdp-')}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
for (let i = 0; i < 50; i++) { try { const l = await (await fetch('http://127.0.0.1:9337/json')).json(); const p = l.find((t) => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break } } catch {} await sleep(100) }
await new Promise((r) => ws.addEventListener('open', r))
let id = 0; const pend = new Map()
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Page.navigate', { url: process.argv[2] })
for (let i = 0; i < 300; i++) { const r = await send('Runtime.evaluate', { expression: 'document.title' }); if (r.result.value === 'done') break; await sleep(200) }
const r = (await send('Runtime.evaluate', { expression: 'JSON.stringify(RESULT)', returnByValue: true })).result.value
const res = JSON.parse(r)
writeFileSync(process.argv[3] + '.png', Buffer.from(res.png, 'base64'))
writeFileSync(process.argv[3] + '.webp', Buffer.from(res.webp, 'base64'))
writeFileSync(process.argv[3] + '.json', JSON.stringify({ AW: res.AW, AH: res.AH, tiles: res.tiles }))
console.log('atlas', res.AW, 'x', res.AH, 'tiles', res.tiles.length, 'area', res.tiles.reduce((a, t) => a + t.w * t.h, 0))
chrome.kill(); process.exit(0)
