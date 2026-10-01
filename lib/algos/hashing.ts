/* lecture 10: universal and perfect hashing */
import { rng } from './rng.ts'

export const isPrime = (p: number) => {
  if (p < 2) return false
  for (let i = 2; i * i <= p; i++) if (p % i === 0) return false
  return true
}
export const nextPrime = (n: number) => {
  while (!isPrime(n)) n++
  return n
}
/** the family h_{a,b}(x) = ((a x + b) mod p) mod m, a in 1..p-1, b in 0..p-1 */
export const hab = (a: number, b: number, p: number, m: number) => (x: number) => (((a * x + b) % p) % m)

/** exact: over every (a, b), how often do x and y collide? */
export function collisionProbability(x: number, y: number, p: number, m: number) {
  let hit = 0
  let total = 0
  for (let a = 1; a < p; a++) for (let b = 0; b < p; b++) {
    total++
    const h = hab(a, b, p, m)
    if (h(x) === h(y)) hit++
  }
  return { hit, total, prob: hit / total }
}
/** how many (a,b) make h_{a,b} a collision-free hash of these keys? */
export function collisionFree(keys: number[], p: number, m: number) {
  let good = 0
  let total = 0
  for (let a = 1; a < p; a++) for (let b = 0; b < p; b++) {
    total++
    const h = hab(a, b, p, m)
    if (new Set(keys.map(h)).size === keys.length) good++
  }
  return { good, total }
}
export const loads = (keys: number[], h: (x: number) => number, m: number) => {
  const c = Array(m).fill(0)
  for (const k of keys) c[h(k)]++
  return c
}
export const collisions = (keys: number[], h: (x: number) => number) => {
  let c = 0
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) if (h(keys[i]) === h(keys[j])) c++
  return c
}

/* ------------------------------------------------------------ the lecture's matrix method */
/** h is a b×u 0/1 matrix stored by column: cols[i] is column i read top to bottom as a b-bit number. h(x) = h·x mod 2 = the XOR of the columns where x has a 1 */
export const matHash = (cols: number[], bits: number[]) => cols.reduce((acc, c, i) => (bits[i] ? acc ^ c : acc), 0)
/** exact: over every b×u matrix, how often do x and y collide? */
export function matCollisionProbability(x: number[], y: number[], b: number) {
  const u = x.length
  const total = 2 ** (b * u)
  let hit = 0
  for (let code = 0; code < total; code++) {
    const cols = Array.from({ length: u }, (_, i) => Math.floor(code / 2 ** (b * i)) % 2 ** b)
    if (matHash(cols, x) === matHash(cols, y)) hit++
  }
  return { hit, total, prob: hit / total }
}

/* ------------------------------------------------------------ FKS perfect hashing */
export type FKS = {
  p: number
  m: number
  a: number
  b: number
  buckets: number[][]
  second: { size: number; a: number; b: number; attempts: number; slots: (number | null)[] }[]
  space: number
  firstTries: number
}
export function buildFKS(keys: number[], p: number, seed: number, spaceLimit = 4): FKS {
  const r = rng(seed)
  const n = keys.length
  const m = n
  const ri = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))
  let a = 0, b = 0, buckets: number[][] = []
  let tries = 0
  while (true) {
    tries++
    a = ri(1, p - 1)
    b = ri(0, p - 1)
    const h = hab(a, b, p, m)
    buckets = Array.from({ length: m }, () => [])
    for (const k of keys) buckets[h(k)].push(k)
    if (buckets.reduce((s, x) => s + x.length ** 2, 0) <= spaceLimit * n) break
  }
  const second = buckets.map((bk) => {
    const size = bk.length ** 2
    if (size === 0) return { size: 0, a: 0, b: 0, attempts: 0, slots: [] as (number | null)[] }
    let attempts = 0
    while (true) {
      attempts++
      const sa = ri(1, p - 1)
      const sb = ri(0, p - 1)
      const h2 = hab(sa, sb, p, size)
      const slots: (number | null)[] = Array(size).fill(null)
      let ok = true
      for (const k of bk) {
        const s = h2(k)
        if (slots[s] !== null) {
          ok = false
          break
        }
        slots[s] = k
      }
      if (ok) return { size, a: sa, b: sb, attempts, slots }
    }
  })
  return { p, m, a, b, buckets, second, space: second.reduce((s, x) => s + x.size, 0), firstTries: tries }
}
export function fksLookup(f: FKS, x: number) {
  const i = hab(f.a, f.b, f.p, f.m)(x)
  const s = f.second[i]
  if (!s.size) return { found: false, bucket: i, slot: -1 }
  const slot = hab(s.a, s.b, f.p, s.size)(x)
  return { found: s.slots[slot] === x, bucket: i, slot }
}
