// Credentials stay in Worker secrets. Only the owner's public music metadata leaves here.
export function createHandler(fetcher = fetch) {
  let accessToken = '', tokenUntil = 0, cached, cacheUntil = 0, pending
  const empty = (status) => ({ status, track: null })
  async function read(env) {
    let retry = 30
    try {
      if (Date.now() >= tokenUntil) {
        const response = await fetcher('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { Authorization: `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.SPOTIFY_REFRESH_TOKEN }),
          signal: AbortSignal.timeout(8000),
        })
        if (!response.ok) {
          retry = Math.max(30, Number(response.headers.get('Retry-After')) || 30)
          throw new Error('Token unavailable')
        }
        const token = await response.json()
        if (!token.access_token || !token.expires_in) throw new Error('Invalid token response')
        accessToken = token.access_token
        tokenUntil = Date.now() + Math.max(0, token.expires_in - 60) * 1000
      }
      const response = await fetcher('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(8000),
      })
      if (response.status === 401) tokenUntil = 0
      if (!response.ok) {
        retry = Math.max(30, Number(response.headers.get('Retry-After')) || 30)
        throw new Error('Playback unavailable')
      }
      const data = response.status === 204 ? null : await response.json()
      const item = data?.item
      const body = data?.is_playing && item?.type === 'track' && item.album?.images?.[0]?.url
        ? { status: 'playing', track: { title: item.name, album: item.album.name, artist: item.artists.map(a => a.name).join(', '), image: item.album.images[0].url, url: item.external_urls.spotify } }
        : empty('idle')
      cached = { body, status: 200, retry: 15 }
      cacheUntil = Date.now() + 15000
    } catch {
      cached = { body: empty('unavailable'), status: 503, retry }
      cacheUntil = Date.now() + retry * 1000
    }
  }
  return async (request, env) => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store', 'Content-Type': 'application/json' }
    if (new URL(request.url).pathname !== '/now-playing') return new Response('Not found', { status: 404, headers })
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET' } })
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REFRESH_TOKEN) {
      return Response.json(empty('unavailable'), { status: 503, headers })
    }
    if (!cached || Date.now() >= cacheUntil) {
      pending ??= read(env).finally(() => { pending = undefined })
      await pending
    }
    return Response.json(cached.body, { status: cached.status, headers: { ...headers, ...(cached.status === 503 ? { 'Retry-After': String(cached.retry) } : {}) } })
  }
}
export default { fetch: createHandler() }
