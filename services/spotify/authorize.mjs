// One-time owner authorization. Run with Node 22+: node services/spotify/authorize.mjs
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { readFile, writeFile, chmod } from 'node:fs/promises'
import { parseEnv } from 'node:util'
const file = new URL('./.dev.vars', import.meta.url)
let env
try { env = parseEnv(await readFile(file, 'utf8')) } catch { env = {} }
const id = env.SPOTIFY_CLIENT_ID
const secret = env.SPOTIFY_CLIENT_SECRET
if (!id || !secret) {
  console.error('Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to services/spotify/.dev.vars first. Do not put them in NEXT_PUBLIC variables.')
  process.exit(1)
}
const redirect = 'http://127.0.0.1:8888/callback'
const state = randomBytes(32).toString('hex')
const url = new URL('https://accounts.spotify.com/authorize')
url.search = new URLSearchParams({ client_id: id, response_type: 'code', redirect_uri: redirect, state, scope: 'user-read-currently-playing' }).toString()
let exchanging = false
const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Referrer-Policy', 'no-referrer')
  const callback = new URL(req.url, redirect)
  if (callback.pathname !== '/callback') { res.writeHead(404); res.end('Not found'); return }
  if (callback.searchParams.get('state') !== state) { res.writeHead(400); res.end('Invalid state. Use the authorization link from the terminal.'); return }
  if (callback.searchParams.has('error')) { res.end('Authorization declined. You can close this tab.'); return }
  const code = callback.searchParams.get('code')
  if (!code || exchanging) { res.writeHead(400); res.end('Missing or already used code.'); return }
  exchanging = true
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect }), signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error('Authorization exchange failed')
    const token = await response.json()
    if (!token.refresh_token) throw new Error('No refresh token returned')
    env.SPOTIFY_REFRESH_TOKEN = token.refresh_token
    await writeFile(file, Object.entries(env).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('\n') + '\n', { mode: 0o600 })
    await chmod(file, 0o600)
    res.end('Spotify connected. You can close this tab and return to Codex.')
    console.log('Spotify connected. Credentials saved privately in services/spotify/.dev.vars.')
    server.close()
  } catch {
    res.writeHead(502); res.end('Could not connect. Restart the authorization script and try again.')
    exchanging = false
  }
})
server.listen(8888, '127.0.0.1', () => console.log(`Open this link to authorize read-only playback access:\n${url}`))
