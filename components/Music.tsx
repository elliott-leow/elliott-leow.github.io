'use client'

import { useEffect, useState } from 'react'
import Photo from './Photo'
import { InkLink } from './Ink'
import { nextPlaybackDelay } from '@/lib/music-polling'

type Track = { title: string; album: string; artist: string; image: string; url: string; playlist?: string | null }
type Playback = { status: 'playing' | 'idle' | 'unavailable' | 'unconnected' | 'loading'; track: Track | null }
const endpoint = process.env.NEXT_PUBLIC_SPOTIFY_ENDPOINT || 'https://notebook-music.leowelliottd23.workers.dev/now-playing'
const blank = '/photos/music-empty.svg'

function validTrack(value: unknown): value is Track {
  if (!value || typeof value !== 'object') return false
  const t = value as Track
  return [t.title, t.album, t.artist, t.image, t.url].every(v => typeof v === 'string')
    && t.image.startsWith('https://i.scdn.co/') && t.url.startsWith('https://open.spotify.com/')
}

export default function Music() {
  const [playback, setPlayback] = useState<Playback>({ status: endpoint ? 'loading' : 'unconnected', track: null })
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
      let delay = 20000
      try {
        const response = await fetch(endpoint!, { cache: 'no-store', signal: AbortSignal.any([current.signal, AbortSignal.timeout(20000)]) })
        if (current.signal.aborted || stopped) return
        if (!response.ok) {
          const retry = Number(response.headers.get('Retry-After'))
          delay = Math.min(2147483647, Math.max(30, Number.isFinite(retry) ? retry : 30) * 1000)
          throw new Error('Unavailable')
        }
        const data = await response.json()
        if (current.signal.aborted || stopped) return
        const playing = data.status === 'playing' && validTrack(data.track)
        if (playing) delay = nextPlaybackDelay(data.remainingMs)
        retryAt = 0
        setPlayback(playing
          ? { status: 'playing', track: data.track }
          : { status: data.status === 'idle' ? 'idle' : 'unavailable', track: null })
      } catch {
        if (current.signal.aborted || stopped) return
        delay = Math.max(30000, delay)
        retryAt = performance.now() + delay
        setPlayback({ status: 'unavailable', track: null })
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
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  const track = playback.track
  const message = playback.status === 'idle' ? 'a little quiet right now.'
    : playback.status === 'unavailable' ? 'couldn’t tune in just now.'
    : playback.status === 'loading' ? 'tuning in…' : 'nothing playing here yet.'
  return (
    <div className="music-entry">
        <Photo photo={{ id: 'music', src: track?.image ?? blank, alt: track ? `Album cover for ${track.album}` : 'An empty space for an album cover', caption: typeof track?.playlist === 'string' ? track.playlist : '', rotation: -3, aspect: 1, variant: 'polaroid', tape: [{ x: 30, y: -11, w: 68, rot: 5, opacity: 0.65 }] }} width={144} className="music-photo" />
        <div className="music-writing" aria-live="polite" aria-atomic="true">
          {track ? <>
            <InkLink key={track.url} href={track.url} i={2} className="music-title">{track.title}</InkLink>
            <p className="music-artist hand">{track.artist}</p>
          </> : <p className="music-empty hand">{message}</p>}
        </div>
      </div>
  )
}
