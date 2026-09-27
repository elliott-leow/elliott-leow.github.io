// Credentials stay in Worker secrets. Only the owner's public music metadata leaves here.
export function createHandler(fetcher = fetch, { now = () => Date.now() } = {}) {
  let accessToken = '', tokenUntil = 0, cached, cacheUntil = 0, pending, playlistBlockedUntil = 0
  const playlistCache = new Map()
  const empty = (status) => ({ status, remainingMs: null, track: null })
  const retryAfter = (response) => Math.max(30, Number(response.headers.get('Retry-After')) || 30)
  const rememberPlaylist = (id, name, until) => {
    if (playlistCache.size >= 32 && !playlistCache.has(id)) playlistCache.delete(playlistCache.keys().next().value)
    playlistCache.set(id, { name, until })
    return name
  }
  async function playlistName(uri) {
    const match = typeof uri === 'string' && /^spotify:playlist:([A-Za-z0-9]+)$/.exec(uri)
    if (!match) return null
    const id = match[1]
    const saved = playlistCache.get(id)
    if (saved && now() < saved.until) return saved.name
    if (now() < playlistBlockedUntil) return rememberPlaylist(id, null, playlistBlockedUntil)
    try {
      const response = await fetcher(`https://api.spotify.com/v1/playlists/${id}?fields=name`, {
        headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(8000),
      })
      if (response.status === 429) {
        const retry = retryAfter(response)
        playlistBlockedUntil = now() + retry * 1000
        return rememberPlaylist(id, null, playlistBlockedUntil)
      }
      if (!response.ok) return rememberPlaylist(id, null, now() + 60_000)
      const data = await response.json()
      return rememberPlaylist(id, typeof data?.name === 'string' ? data.name : null, now() + 300_000)
    } catch {
      return rememberPlaylist(id, null, now() + 60_000)
    }
  }
  const bodyFor = (entry) => entry.remainingAt == null
    ? entry.body
    : { ...entry.body, remainingMs: Math.max(0, Math.floor(entry.remainingAt - (now() - entry.receivedAt))) }
  async function read(env) {
    let retry = 30
    try {
      if (now() >= tokenUntil) {
        const response = await fetcher('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { Authorization: `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.SPOTIFY_REFRESH_TOKEN }),
          signal: AbortSignal.timeout(8000),
        })
        if (!response.ok) {
          retry = retryAfter(response)
          throw new Error('Token unavailable')
        }
        const token = await response.json()
        if (!token.access_token || !token.expires_in) throw new Error('Invalid token response')
        accessToken = token.access_token
        tokenUntil = now() + Math.max(0, token.expires_in - 60) * 1000
      }
      const response = await fetcher('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(8000),
      })
      const receivedAt = now()
      if (response.status === 401) tokenUntil = 0
      if (!response.ok) {
        retry = retryAfter(response)
        throw new Error('Playback unavailable')
      }
      const data = response.status === 204 ? null : await response.json()
      const item = data?.item
      const isTrack = data?.is_playing && item?.type === 'track' && item.album?.images?.[0]?.url
      const remainingAt = isTrack && Number.isFinite(item.duration_ms) && item.duration_ms >= 0 && Number.isFinite(data.progress_ms) && data.progress_ms >= 0
        ? Math.max(0, item.duration_ms - data.progress_ms)
        : null
      const body = isTrack
        ? {
            status: 'playing',
            remainingMs: remainingAt,
            track: {
              title: item.name,
              album: item.album.name,
              artist: item.artists.map(a => a.name).join(', '),
              image: item.album.images[0].url,
              url: item.external_urls.spotify,
              playlist: await playlistName(data.context?.uri),
            },
          }
        : empty('idle')
      cached = { body, status: 200, retry: 15, receivedAt, remainingAt }
      cacheUntil = receivedAt + (remainingAt == null ? 15_000 : Math.min(15_000, remainingAt))
    } catch {
      cached = { body: empty('unavailable'), status: 503, retry, receivedAt: now(), remainingAt: null }
      cacheUntil = now() + retry * 1000
    }
  }
  return async (request, env) => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Retry-After', 'Cache-Control': 'no-store', 'Content-Type': 'application/json' }
    if (new URL(request.url).pathname !== '/now-playing') return new Response('Not found', { status: 404, headers })
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET' } })
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REFRESH_TOKEN) {
      return Response.json(empty('unavailable'), { status: 503, headers })
    }
    if (!cached || now() >= cacheUntil) {
      pending ??= read(env).finally(() => { pending = undefined })
      await pending
    }
    return Response.json(bodyFor(cached), { status: cached.status, headers: { ...headers, ...(cached.status === 503 ? { 'Retry-After': String(cached.retry) } : {}) } })
  }
}
export default { fetch: createHandler() }
