import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import worker from './worker.mjs'
const env = parseEnv(await readFile(new URL('./.dev.vars', import.meta.url), 'utf8'))
createServer(async (req, res) => {
  const response = await worker.fetch(new Request(`http://127.0.0.1:8787${req.url}`, { method: req.method }), env)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(await response.text())
}).listen(8787, '127.0.0.1', () => console.log('Spotify endpoint: http://127.0.0.1:8787/now-playing'))
