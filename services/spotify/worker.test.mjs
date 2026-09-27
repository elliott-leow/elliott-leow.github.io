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
  assert.deepEqual(await response.json(), { status: 'playing', remainingMs: null, track: { title: 'Song', album: 'Album', artist: 'Artist', image: 'https://i.scdn.co/image/test', url: 'https://open.spotify.com/track/test', playlist: null } })
  await handle(request(), env)
  assert.equal(calls, 2)
})

test('204, paused playback and episodes produce honest empty states', async () => {
  for (const playback of [null, { is_playing: false, item: { type: 'track' } }, { is_playing: true, item: { type: 'episode' } }]) {
    const handle = createHandler(async (url) => String(url).includes('/api/token') ? token() : playback === null ? new Response(null, { status: 204 }) : Response.json(playback))
    assert.deepEqual(await (await handle(request(), env)).json(), { status: 'idle', remainingMs: null, track: null })
  }
})

test('missing configuration and upstream failure never leak credentials', async () => {
  const handle = createHandler(async () => { throw new Error('private-token') })
  assert.equal((await handle(request(), {})).status, 503)
  const result = await handle(request(), env)
  assert.equal(result.status, 503)
  assert.deepEqual(await result.json(), { status: 'unavailable', remainingMs: null, track: null })
})

test('rate limits honor Retry-After without repeatedly calling Spotify', async () => {
  let calls = 0
  const handle = createHandler(async (url) => {
    calls++
    return String(url).includes('/api/token') ? token() : new Response(null, { status: 429, headers: { 'Retry-After': '120' } })
  })
  assert.equal((await handle(request(), env)).status, 503)
  const retryResponse = await handle(request(), env)
  assert.equal(retryResponse.headers.get('Retry-After'), '120')
  assert.equal(retryResponse.headers.get('Access-Control-Expose-Headers'), 'Retry-After')
  assert.equal(calls, 2)
})

test('ages remaining time from the playback response and reuses the playback cache', async () => {
  let now = 1_000
  let calls = 0
  const handle = createHandler(async (url) => {
    calls++
    if (String(url).includes('/api/token')) return token()
    return Response.json({ is_playing: true, progress_ms: 1_000, item: { type: 'track', name: 'Song', duration_ms: 30_000, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } })
  }, { now: () => now })
  assert.equal((await (await handle(request(), env)).json()).remainingMs, 29_000)
  now = 6_000
  assert.equal((await (await handle(request(), env)).json()).remainingMs, 24_000)
  assert.equal(calls, 2)
})

test('refreshes playback at the predicted end boundary', async () => {
  let now = 0
  let playbackCalls = 0
  const handle = createHandler(async (url) => {
    if (String(url).includes('/api/token')) return token()
    playbackCalls++
    return Response.json({ is_playing: true, progress_ms: 0, item: { type: 'track', name: 'Song', duration_ms: 2_000, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } })
  }, { now: () => now })
  await handle(request(), env)
  now = 2_000
  await handle(request(), env)
  assert.equal(playbackCalls, 2)
})

test('publishes a valid playlist context name and reuses its bounded cache', async () => {
  let now = 0
  let playlistCalls = 0
  const handle = createHandler(async (url) => {
    const value = String(url)
    if (value.includes('/api/token')) return token()
    if (value.includes('/v1/playlists/')) {
      playlistCalls++
      return Response.json({ name: 'Night Walks' })
    }
    return Response.json({ is_playing: true, progress_ms: 0, context: { uri: 'spotify:playlist:abc123' }, item: { type: 'track', name: 'Song', duration_ms: 1_000, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } })
  }, { now: () => now })
  assert.equal((await (await handle(request(), env)).json()).track.playlist, 'Night Walks')
  now = 1_000
  assert.equal((await (await handle(request(), env)).json()).track.playlist, 'Night Walks')
  assert.equal(playlistCalls, 1)
})

test('does not look up non-playlist contexts and degrades playlist failures to null', async () => {
  let playlistCalls = 0
  const noPlaylist = createHandler(async (url) => {
    if (String(url).includes('/api/token')) return token()
    if (String(url).includes('/v1/playlists/')) playlistCalls++
    return Response.json({ is_playing: true, context: { uri: 'spotify:album:abc123' }, item: { type: 'track', name: 'Song', duration_ms: 3_000, progress_ms: 0, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } })
  })
  assert.equal((await (await noPlaylist(request(), env)).json()).track.playlist, null)
  assert.equal(playlistCalls, 0)
  let failedPlaylistCalls = 0
  const failedPlaylist = createHandler(async (url) => {
    if (String(url).includes('/api/token')) return token()
    if (String(url).includes('/v1/playlists/')) {
      failedPlaylistCalls++
      return new Response(null, { status: 403 })
    }
    return Response.json({ is_playing: true, context: { uri: 'spotify:playlist:abc123' }, item: { type: 'track', name: 'Song', duration_ms: 3_000, progress_ms: 0, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } })
  })
  assert.equal((await (await failedPlaylist(request(), env)).json()).track.playlist, null)
  assert.equal(failedPlaylistCalls, 1)
})

test('holds playlist lookups during a playlist Retry-After window', async () => {
  let now = 0
  let playlistCalls = 0
  const handle = createHandler(async (url) => {
    const value = String(url)
    if (value.includes('/api/token')) return token()
    if (value.includes('/v1/playlists/')) {
      playlistCalls++
      return new Response(null, { status: 429, headers: { 'Retry-After': '120' } })
    }
    return Response.json({ is_playing: true, progress_ms: 0, context: { uri: `spotify:playlist:abc${now}` }, item: { type: 'track', name: 'Song', duration_ms: 1_000, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } })
  }, { now: () => now })
  await handle(request(), env)
  now = 1_000
  await handle(request(), env)
  assert.equal(playlistCalls, 1)
})

test('subtracts playlist lookup time from remaining playback time', async () => {
  let now = 1_000
  const handle = createHandler(async (url) => {
    const value = String(url)
    if (value.includes('/api/token')) return token()
    if (value.includes('/v1/playlists/')) {
      now += 750
      return Response.json({ name: 'Night Walks' })
    }
    return Response.json({ is_playing: true, progress_ms: 2_000, context: { uri: 'spotify:playlist:abc123' }, item: { type: 'track', name: 'Song', duration_ms: 10_000, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } })
  }, { now: () => now })
  assert.equal((await (await handle(request(), env)).json()).remainingMs, 7_250)
})

test('does not fetch malformed playlist context URIs', async () => {
  let playlistCalls = 0
  const handle = createHandler(async (url) => {
    const value = String(url)
    if (value.includes('/api/token')) return token()
    if (value.includes('/v1/playlists/')) playlistCalls++
    return Response.json({ is_playing: true, progress_ms: 0, context: { uri: 'spotify:playlist:abc123/other' }, item: { type: 'track', name: 'Song', duration_ms: 3_000, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } })
  })
  assert.equal((await (await handle(request(), env)).json()).track.playlist, null)
  assert.equal(playlistCalls, 0)
})

test('treats negative Spotify timing values as unavailable', async () => {
  for (const [duration_ms, progress_ms] of [[-1, 0], [3_000, -1]]) {
    const handle = createHandler(async (url) => String(url).includes('/api/token') ? token() : Response.json({ is_playing: true, progress_ms, item: { type: 'track', name: 'Song', duration_ms, album: { name: 'Album', images: [{ url: 'https://i.scdn.co/image/test' }] }, artists: [{ name: 'Artist' }], external_urls: { spotify: 'https://open.spotify.com/track/test' } } }))
    assert.equal((await (await handle(request(), env)).json()).remainingMs, null)
  }
})
