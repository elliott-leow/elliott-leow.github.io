/** how soon to ask the Worker again. Playing: at the track's end, but never more than 8 seconds out, so a skip or
    a pause shows quickly. Idle or untimed: every 5 seconds, so pressing play shows quickly. (The Worker has already
    aged remainingMs by its own cache residence time, and serves a reading for at most 5 seconds) */
export const IDLE_POLL = 5000
export const PLAYING_POLL_MAX = 8000

export function nextPlaybackDelay(remainingMs: unknown): number {
  if (typeof remainingMs !== 'number' || !Number.isFinite(remainingMs) || remainingMs < 0) return IDLE_POLL
  return Math.min(PLAYING_POLL_MAX, Math.max(2000, remainingMs + 1000))
}
