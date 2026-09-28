/** seeded, so the server and the browser draw the same thing */
export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)
}
export const shuffle = <T>(a: T[], r: () => number): T[] => {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
export const ri = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))
export const pick = <T>(r: () => number, a: readonly T[]): T => a[Math.floor(r() * a.length)]
