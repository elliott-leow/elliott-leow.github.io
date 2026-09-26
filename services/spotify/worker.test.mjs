import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHandler } from './worker.mjs'

const env = { SPOTIFY_CLIENT_ID: 'id', SPOTIFY_CLIENT_SECRET: 'secret', SPOTIFY_REFRESH_TOKEN: 'refresh' }
const request = () => new Request('https://music.example/now-playing')
const token = () => Response.json({ access_token: 'private-token', expires_in: 3600 })

test('publishes only display metadata; caches upstream calls', async () => {
  let calls = 0
  const handle = createHandler(async (url) => {
    calls++
    if (String(url).includes('/api/token')) return token()
    return Response.json({ is_playing: true, item: { type: 'track', name: 'Song', album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } }, device: { name: 'private' } })
  })
  const response = await handle(request(), env)
  assert.deepEqual(await response.json(), { status: 'playing', track: { title: 'Song', album: 'Album', artist: 'Artist', image: 'https://i.scdn.co/image/test', url: 'https://open.spotify.com/track/test' } })
  await handle(request(), env)
  assert.equal(calls, 2)
})

test('204, paused playback and episodes produce honest empty states', async () => {
  for (const playback of [null, { is_playing: false, item: { type: 'track' } }, { is_playing: true, item: { type: 'episode' } }]) {
    const handle = createHandler(async (url) => String(url).includes('/api/token') ? token() : playback === null ? new Response(null, { status: 204 }) : Response.json(playback))
    assert.deepEqual(await (await handle(request(), env)).json(), { status: 'idle', track: null })
  }
})

test('missing configuration and upstream failure never leak credentials', async () => {
  const handle = createHandler(async () => { throw new Error('private-token') })
  assert.equal((await handle(request(), {})).status, 503)
  const result = await handle(request(), env)
  assert.equal(result.status, 503)
  assert.deepEqual(await result.json(), { status: 'unavailable', track: null })
})

test('rate limits honor Retry-After without repeatedly calling Spotify', async () => {
  let calls = 0
  const handle = createHandler(async (url) => {
    calls++
    return String(url).includes('/api/token') ? token() : new Response(null, { status: 429, headers: { 'Retry-After': '120' } })
  })
  assert.equal((await handle(request(), env)).status, 503)
  assert.equal((await handle(request(), env)).headers.get('Retry-After'), '120')
  assert.equal(calls, 2)
})
