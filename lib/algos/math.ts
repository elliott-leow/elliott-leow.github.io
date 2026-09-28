/* lectures 1-3: Karatsuba, Strassen, asymptotics, recurrences */

/* ------------------------------------------------------------ Karatsuba */

export type KNode = {
  x: bigint
  y: bigint
  m: number
  half?: number
  A?: bigint
  B?: bigint
  C?: bigint
  D?: bigint
  kids?: [KNode, KNode, KNode]
  mid?: bigint
  result: bigint
  /** small multiplications done at the bottom of this subtree */
  base: number
}
export const bitLen = (v: bigint) => (v === 0n ? 0 : v.toString(2).length)

export function karatsuba(x: bigint, y: bigint): KNode {
  const m = Math.max(bitLen(x), bitLen(y))
  if (m <= 2) return { x, y, m, result: x * y, base: 1 }
  const half = Math.ceil(m / 2)
  const h = BigInt(half)
  const mask = (1n << h) - 1n
  const A = x >> h
  const B = x & mask
  const C = y >> h
  const D = y & mask
  const k1 = karatsuba(A, C)
  const k2 = karatsuba(B, D)
  const k3 = karatsuba(A + B, C + D)
  const mid = k3.result - k1.result - k2.result // AD + BC
  const result = (k1.result << (2n * h)) + (mid << h) + k2.result
  return { x, y, m, half, A, B, C, D, kids: [k1, k2, k3], mid, result, base: k1.base + k2.base + k3.base }
}

/** the rewrite that makes it 3 multiplications, not 4 */
export function karatsubaFour(x: bigint, y: bigint, half: number) {
  const h = BigInt(half)
  const mask = (1n << h) - 1n
  const A = x >> h
  const B = x & mask
  const C = y >> h
  const D = y & mask
  return { A, B, C, D, AC: A * C, AD: A * D, BC: B * C, BD: B * D, total: (A * C << (2n * h)) + ((A * D + B * C) << h) + B * D }
}

/* ------------------------------------------------------------ Strassen */

export type Mat = number[][]
export const matMul = (X: Mat, Y: Mat): Mat => X.map((row, i) => Y[0].map((_, j) => row.reduce((s, v, k) => s + v * Y[k][j], 0)))
const add = (X: Mat, Y: Mat, s = 1): Mat => X.map((r, i) => r.map((v, j) => v + s * Y[i][j]))
const block = (X: Mat, bi: number, bj: number): Mat => {
  const h = X.length / 2
  return X.slice(bi * h, bi * h + h).map((r) => r.slice(bj * h, bj * h + h))
}
const join = (a: Mat, b: Mat, c: Mat, d: Mat): Mat => [...a.map((r, i) => [...r, ...b[i]]), ...c.map((r, i) => [...r, ...d[i]])]

/** the seven products, with the four blocks of the answer. entries can be numbers or matrices' blocks */
export function strassenBlocks(A: number, B: number, C: number, D: number, E: number, F: number, G: number, H: number) {
  const M1 = (A + D) * (E + H)
  const M2 = (C + D) * E
  const M3 = A * (F - H)
  const M4 = D * (G - E)
  const M5 = (A + B) * H
  const M6 = (C - A) * (E + F)
  const M7 = (B - D) * (G + H)
  return { M: [M1, M2, M3, M4, M5, M6, M7], out: [M1 + M4 - M5 + M7, M3 + M5, M2 + M4, M1 - M2 + M3 + M6] as [number, number, number, number] }
}

/** n x n, n a power of two. counts scalar multiplications */
export function strassen(X: Mat, Y: Mat): { C: Mat; mults: number } {
  const n = X.length
  if (n === 1) return { C: [[X[0][0] * Y[0][0]]], mults: 1 }
  const [A, B, C, D] = [block(X, 0, 0), block(X, 0, 1), block(X, 1, 0), block(X, 1, 1)]
  const [E, F, G, H] = [block(Y, 0, 0), block(Y, 0, 1), block(Y, 1, 0), block(Y, 1, 1)]
  const r = [strassen(add(A, D), add(E, H)), strassen(add(C, D), E), strassen(A, add(F, H, -1)), strassen(D, add(G, E, -1)), strassen(add(A, B), H), strassen(add(C, A, -1), add(E, F)), strassen(add(B, D, -1), add(G, H))]
  const [M1, M2, M3, M4, M5, M6, M7] = r.map((q) => q.C)
  const top = add(add(add(M1, M4), M5, -1), M7)
  const bot = add(add(add(M1, M2, -1), M3), M6)
  return { C: join(top, add(M3, M5), add(M2, M4), bot), mults: r.reduce((s, q) => s + q.mults, 0) }
}

/* ------------------------------------------------------------ master theorem */

export type MasterCase = 'top' | 'even' | 'bottom'
export function master(a: number, b: number, k: number) {
  const bk = Math.pow(b, k)
  const alpha = a / bk
  const eq = Math.abs(a - bk) < 1e-9
  const kase: MasterCase = eq ? 'even' : a < bk ? 'top' : 'bottom'
  const p = kase === 'bottom' ? Math.log(a) / Math.log(b) : k
  return { alpha: eq ? 1 : alpha, kase, p, logPow: kase === 'even' ? 1 : 0 }
}
export const thetaText = (a: number, b: number, k: number) => {
  const m = master(a, b, k)
  const e = Number.isInteger(m.p) ? String(m.p) : m.p.toFixed(3)
  const poly = m.p === 0 ? '' : m.p === 1 ? 'n' : `n^${e}`
  if (m.logPow) return poly ? `${poly} log n` : 'log n'
  return poly || '1'
}

export type Level = { i: number; nodes: number; size: number; each: number; total: number }
/** level i of the recursion tree for T(n) = a T(n/b) + n^k */
export function levels(a: number, b: number, k: number, n: number): Level[] {
  const out: Level[] = []
  const L = Math.floor(Math.log(n) / Math.log(b) + 1e-9)
  for (let i = 0; i <= L; i++) {
    const size = n / Math.pow(b, i)
    const nodes = Math.pow(a, i)
    const each = Math.pow(size, k)
    out.push({ i, nodes, size, each, total: nodes * each })
  }
  return out
}

/* ------------------------------------------------------------ recurrences, numerically */

export type Rec = {
  id: string
  label: string
  /** the recurrence, T(x) = 1 for x <= 5 */
  T: (n: number) => number
  guess: (n: number) => number
  guessLabel: string
  /** where to plot: n from 10^lo to 10^hi */
  lo: number
  hi: number
  integer?: boolean
  theta: string
}

function memo(f: (n: number, T: (m: number) => number) => number): (n: number) => number {
  const M = new Map<string, number>()
  const T = (n: number): number => {
    if (n <= 5) return 1
    const key = n.toPrecision(10)
    let v = M.get(key)
    if (v === undefined) {
      v = f(n, T)
      M.set(key, v)
    }
    return v
  }
  return T
}
const lg = (x: number) => Math.log2(x)

export const recurrences: Rec[] = [
  { id: 'merge', label: 'T(n) = 2T(n/2) + n', T: memo((n, T) => 2 * T(n / 2) + n), guess: (n) => n * lg(n), guessLabel: 'n log n', lo: 1, hi: 8, theta: 'n log n' },
  { id: 'karatsuba', label: 'T(n) = 3T(n/2) + n', T: memo((n, T) => 3 * T(n / 2) + n), guess: (n) => Math.pow(n, lg(3)), guessLabel: 'n^1.585', lo: 1, hi: 8, theta: 'n^(log₂3)' },
  { id: 'strassen', label: 'T(n) = 7T(n/2) + n²', T: memo((n, T) => 7 * T(n / 2) + n * n), guess: (n) => Math.pow(n, lg(7)), guessLabel: 'n^2.807', lo: 1, hi: 8, theta: 'n^(log₂7)' },
  { id: 'thirds', label: 'T(n) = 3T(n/3) + n', T: memo((n, T) => 3 * T(n / 3) + n), guess: (n) => n * Math.log(n) / Math.log(3), guessLabel: 'n log₃ n', lo: 1, hi: 8, theta: 'n log n' },
  { id: 'select', label: 'T(n) = T(n/2) + n', T: memo((n, T) => T(n / 2) + n), guess: (n) => n, guessLabel: 'n', lo: 1, hi: 8, theta: 'n' },
  { id: 'bfprt', label: 'T(n) = T(7n/10) + T(n/5) + n', T: memo((n, T) => T((7 * n) / 10) + T(n / 5) + n), guess: (n) => n, guessLabel: 'n', lo: 1, hi: 8, theta: 'n' },
  { id: 'sel', label: 'T(n) = T(n−1) + n', T: memo((n, T) => T(n - 1) + n), guess: (n) => n * n, guessLabel: 'n²', lo: 1, hi: 3.3, integer: true, theta: 'n²' },
  { id: 'hw1a', label: 'HW1: T(n) = 5T(n−3)', T: memo((n, T) => 5 * T(n - 3)), guess: (n) => Math.pow(5, n / 3), guessLabel: '5^(n/3)', lo: 1, hi: 2.4, integer: true, theta: '5^(n/3)' },
  { id: 'hw1b', label: 'HW1: T(n) = n^¼ T(n^¾) + n', T: memo((n, T) => Math.pow(n, 0.25) * T(Math.pow(n, 0.75)) + n), guess: (n) => n * lg(lg(n)), guessLabel: 'n log log n', lo: 1.4, hi: 300, theta: 'n log log n' },
  { id: 'hw1c', label: 'HW1: T(n) = 6T(n/4) + n', T: memo((n, T) => 6 * T(n / 4) + n), guess: (n) => Math.pow(n, Math.log(6) / Math.log(4)), guessLabel: 'n^1.292', lo: 1, hi: 8, theta: 'n^(log₄6)' },
  { id: 'rec1', label: 'recitation: T(n) = 4T(n/4) + n log₄ n', T: memo((n, T) => 4 * T(n / 4) + n * (Math.log(n) / Math.log(4))), guess: (n) => n * lg(n) * lg(n), guessLabel: 'n log² n', lo: 1, hi: 8, theta: 'n log² n' },
]

/** T(n) for n = 10^x (rounded, if the recurrence is over integers) */
export function evalRec(r: Rec, x: number) {
  let n = Math.pow(10, x)
  if (r.integer) n = Math.max(6, Math.round(n))
  return { n, T: r.T(n), g: r.guess(n) }
}

/** guess-and-check on T(n) = 3T(n/3) + n: the constant c in T(n) <= c n, as n grows */
export function constantCreep(levelsCount: number) {
  // if T(n/3) <= c n/3 then T(n) <= (c+1) n: c goes up by 1 per level
  return Array.from({ length: levelsCount }, (_, i) => ({ level: i, c: 1 + i }))
}

/* ------------------------------------------------------------ asymptotic notation */

type Fn = { id: string; label: string; ln: (n: number) => number; sign?: (n: number) => number }
const lnFact = (n: number) => {
  let s = 0
  for (let i = 2; i <= n; i++) s += Math.log(i)
  return s
}
export const fns: Fn[] = [
  { id: 'one', label: '1', ln: () => 0 },
  { id: 'logn', label: 'log n', ln: (n) => Math.log(Math.log2(n)) },
  { id: 'sqrt', label: '√n', ln: (n) => 0.5 * Math.log(n) },
  { id: 'n', label: 'n', ln: (n) => Math.log(n) },
  { id: 'nlogn', label: 'n log n', ln: (n) => Math.log(n * Math.log2(n)) },
  { id: 'n2', label: 'n²', ln: (n) => 2 * Math.log(n) },
  { id: '2n2p27', label: '2n² + 27', ln: (n) => Math.log(2 * n * n + 27) },
  { id: 'n3', label: 'n³', ln: (n) => 3 * Math.log(n) },
  { id: 'n2p', label: 'n + n²', ln: (n) => Math.log(n + n * n) },
  { id: 'nmax', label: 'max(n, n²)', ln: (n) => Math.log(Math.max(n, n * n)) },
  { id: '2n', label: '2ⁿ', ln: (n) => n * Math.LN2 },
  { id: 'en', label: 'eⁿ', ln: (n) => n },
  { id: '3n', label: '3ⁿ', ln: (n) => n * Math.log(3) },
  { id: '3n2', label: '3^(n+2)', ln: (n) => (n + 2) * Math.log(3) },
  { id: 'fact', label: 'n!', ln: (n) => lnFact(Math.round(n)) },
  { id: 'l15', label: 'log(n^(1/5))', ln: (n) => Math.log(Math.log2(n) / 5) },
  { id: 'l3', label: 'log(n³)', ln: (n) => Math.log(3 * Math.log2(n)) },
  { id: 'ntan', label: 'n tan n', ln: (n) => Math.log(Math.abs(n * Math.tan(n))), sign: (n) => Math.sign(Math.tan(n)) },
  { id: 'ncos', label: 'n cos n', ln: (n) => Math.log(Math.abs(n * Math.cos(n))), sign: (n) => Math.sign(Math.cos(n)) },
  { id: 'sqcos', label: '√n + cos n', ln: (n) => Math.log(Math.sqrt(n) + Math.cos(n)) },
  { id: 'n5', label: '2^(5 log n)', ln: (n) => 5 * Math.log(n) },
]
export const fnById = (id: string) => fns.find((f) => f.id === id)!

/** signed ratio f(n)/g(n), computed through logs so 2^n and n! don't overflow */
export function ratio(f: Fn, g: Fn, n: number) {
  const s = (f.sign?.(n) ?? 1) * (g.sign?.(n) ?? 1)
  return s * Math.exp(f.ln(n) - g.ln(n))
}
export const ratioLn = (f: Fn, g: Fn, n: number) => f.ln(n) - g.ln(n)

/** does f(n) <= c g(n) hold for every integer n0 < n <= N? returns the first n where it fails, or 0 */
export function firstViolation(f: Fn, g: Fn, c: number, n0: number, N = 2000) {
  for (let n = Math.max(2, Math.floor(n0) + 1); n <= N; n++) {
    if (ratio(f, g, n) > c * (1 + 1e-12)) return n
  }
  return 0
}

export type Verdict = { O: boolean; Omega: boolean; little: 'o' | 'omega' | null; text: string }
/** compare the ratio f/g early against late: bounded above? bounded below (and positive)? */
export function verdict(f: Fn, g: Fn, N = 2000): Verdict {
  const win = (a: number, b: number) => {
    let hi = -Infinity
    let lo = Infinity
    for (let n = Math.max(4, Math.floor(a)); n <= b; n++) {
      const r = ratio(f, g, n)
      if (r > hi) hi = r
      if (r < lo) lo = r
    }
    return { hi, lo }
  }
  const early = win(N / 16, N / 8)
  const late = win(N / 2, N)
  const O = late.hi <= 1.5 * Math.max(early.hi, 1e-300) + 1e-300 || late.hi < 1e-9
  const Omega = late.lo > 0 && late.lo >= 0.5 * early.lo
  const little = O && late.hi < early.hi * 0.5 && !Omega ? 'o' : Omega && late.lo > early.lo * 2 && !O ? 'omega' : null
  const parts: string[] = []
  if (O && Omega) parts.push('f = Θ(g)')
  else if (O) parts.push(little === 'o' ? 'f = o(g)  (so also O)' : 'f = O(g) only')
  else if (Omega) parts.push(little === 'omega' ? 'f = ω(g)  (so also Ω)' : 'f = Ω(g) only')
  else parts.push('neither O nor Ω')
  return { O, Omega, little, text: parts[0] }
}
