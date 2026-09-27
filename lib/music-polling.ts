/** The Worker has already aged this duration by its own cache residence time. */
export function nextPlaybackDelay(remainingMs: unknown): number {
  if (typeof remainingMs !== 'number' || !Number.isFinite(remainingMs) || remainingMs < 0) return 20000
  return Math.min(2147483647, Math.max(2000, remainingMs + 1000))
}
