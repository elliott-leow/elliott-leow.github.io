'use client'

import { useEffect, useState } from 'react'
import { TapeStrip } from './Print'
import { IDLE_POLL, nextPlaybackDelay } from '@/lib/music-polling'

type Track = { title: string; album: string; artist: string; image: string; url: string; playlist?: string | null }
type Playback = { status: 'playing' | 'idle' | 'unavailable' | 'unconnected' | 'loading'; track: Track | null; last: Track | null }
const endpoint = process.env.NEXT_PUBLIC_SPOTIFY_ENDPOINT || 'https://notebook-music.leowelliottd23.workers.dev/now-playing'

function validTrack(value: unknown): value is Track {
  if (!value || typeof value !== 'object') return false
  const t = value as Track
  return [t.title, t.album, t.artist, t.image, t.url].every(v => typeof v === 'string')
    && t.image.startsWith('https://i.scdn.co/') && t.url.startsWith('https://open.spotify.com/')
}

/** what's playing on Spotify right now, as a record sleeve taped to the sheet; when nothing is, a drawing of a quiet room */
export default function NowPlaying() {
  const [playback, setPlayback] = useState<Playback>({ status: endpoint ? 'loading' : 'unconnected', track: null, last: null })
  useEffect(() => {
    if (!endpoint) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let controller: AbortController | undefined
    let retryAt = 0
    async function refresh() {
      clearTimeout(timer)
      controller?.abort()
      if (document.hidden || stopped) return
      if (performance.now() < retryAt) {
        timer = setTimeout(refresh, retryAt - performance.now())
        return
      }
      controller = new AbortController()
      const current = controller
      let delay = IDLE_POLL
      try {
        const response = await fetch(endpoint!, { cache: 'no-store', signal: AbortSignal.any([current.signal, AbortSignal.timeout(20000)]) })
        if (current.signal.aborted || stopped) return
        if (!response.ok) {
          const retry = Number(response.headers.get('Retry-After'))
          delay = Math.min(2147483647, Math.max(5, Number.isFinite(retry) ? retry : 5) * 1000)
          throw new Error('Unavailable')
        }
        const data = await response.json()
        if (current.signal.aborted || stopped) return
        const playing = data.status === 'playing' && validTrack(data.track)
        if (playing) delay = nextPlaybackDelay(data.remainingMs)
        retryAt = 0
        // (when nothing is playing, the Worker sends what played last, if it knows)
        setPlayback(playing
          ? { status: 'playing', track: data.track, last: null }
          : { status: data.status === 'idle' ? 'idle' : 'unavailable', track: null, last: validTrack(data.last) ? data.last : null })
      } catch {
        if (current.signal.aborted || stopped) return
        delay = Math.max(IDLE_POLL, delay)
        retryAt = performance.now() + delay
        // (a hiccup keeps what's shown, rather than claiming the music stopped; it's asked again in a few seconds)
        setPlayback((p) => p.status === 'loading' ? p : { ...p, status: 'unavailable' })
      } finally {
        if (!stopped && !current.signal.aborted && !document.hidden) timer = setTimeout(refresh, delay)
      }
    }
    void refresh()
    const onVisibility = () => {
      clearTimeout(timer)
      controller?.abort()
      if (!document.hidden) void refresh()
    }
    // (coming back to the tab or the window, or back online, asks at once)
    const onReturn = () => { retryAt = 0; void refresh() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onReturn)
    window.addEventListener('online', onReturn)
    return () => {
      stopped = true; clearTimeout(timer); controller?.abort()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onReturn)
      window.removeEventListener('online', onReturn)
    }
  }, [])

  // playing: the track now. Not playing: the one played last, under "Last listened to". Neither known: the quiet room
  const track = playback.track ?? playback.last
  const live = !!playback.track
  const message = playback.status === 'idle' ? 'a little quiet right now.' : 'tuning in…'
  const sleeve = (
    <span className="pic" style={{ '--r': '-1.6deg' } as React.CSSProperties}>
      <TapeStrip n={1} className="wt-top" />
      <span className="pic-paper">
        <img className="pic-img pic-square" src={track?.image ?? '/art/cards/record.webp'} alt={track ? `Album cover for ${track.album}` : ''} decoding="async" />
      </span>
    </span>
  )
  return (
    <div className="playing" aria-live="polite" aria-atomic="true">
      <div className="print playing-print">
        {track ? <a href={track.url} target="_blank" rel="noreferrer">{sleeve}</a> : <div>{sleeve}</div>}
      </div>
      <div className="playing-words">
        {track && <p className="kicker">{live ? (track.playlist ? `Now playing, from ${track.playlist}` : 'Now playing') : 'Last listened to'}</p>}
        {track ? <>
          <p className="playing-title"><a className="link" href={track.url} target="_blank" rel="noreferrer">{track.title}</a></p>
          <p className="playing-artist">{track.artist}</p>
          <p className="playing-album quiet">{track.album}</p>
        </> : <p className="playing-title">{message}</p>}
      </div>
    </div>
  )
}
