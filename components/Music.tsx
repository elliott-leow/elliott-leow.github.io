'use client'

import { useEffect, useState } from 'react'
import Photo from './Photo'

type Track = { title: string; album: string; artist: string; image: string; url: string }
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
    async function refresh() {
      clearTimeout(timer)
      controller?.abort()
      if (document.hidden) return
      controller = new AbortController()
      let delay = 20000
      try {
        const response = await fetch(endpoint!, { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) })
        if (!response.ok) {
          delay = Math.max(30, Number(response.headers.get('Retry-After')) || 30) * 1000
          throw new Error('Unavailable')
        }
        const data = await response.json()
        if (!stopped) setPlayback(data.status === 'playing' && validTrack(data.track)
          ? { status: 'playing', track: data.track }
          : { status: data.status === 'idle' ? 'idle' : 'unavailable', track: null })
      } catch {
        if (!stopped) setPlayback({ status: 'unavailable', track: null })
      } finally {
        if (!stopped) timer = setTimeout(refresh, delay)
      }
    }
    void refresh()
    const onVisibility = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  const track = playback.track
  const message = playback.status === 'idle' ? 'a little quiet right now.'
    : playback.status === 'unavailable' ? 'couldn’t tune in just now.'
    : playback.status === 'loading' ? 'tuning in…' : 'nothing playing here yet.'
  return (
    <div className="music-entry">
        <Photo photo={{ id: 'music', src: track?.image ?? blank, alt: track ? `Album cover for ${track.album}` : 'An empty space for an album cover', caption: '', rotation: -3, aspect: 1, variant: 'polaroid', tape: [{ x: 30, y: -11, w: 68, rot: 5, opacity: 0.65 }] }} width={144} className="music-photo" />
        <div className="music-writing" aria-live="polite" aria-atomic="true">
          {track ? <>
            <a className="music-title hand" href={track.url} target="_blank" rel="noreferrer">{track.title}</a>
            <p className="music-artist hand">{track.artist}</p>
            <a className="music-source hand" href={track.url} target="_blank" rel="noreferrer">on Spotify ↗</a>
          </> : <p className="music-empty hand">{message}</p>}
        </div>
      </div>
  )
}
