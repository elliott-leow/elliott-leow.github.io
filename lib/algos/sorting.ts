/* lecture 5 and homework 2: lower bounds as a game, counting sort, radix sort, strings */

/* ------------------------------------------------------------ the lower-bound game
   Every input is a hidden thing. The algorithm asks comparisons; an adversary answers.
   Each leaf of the decision tree must pin down the *answer* (the "key"). So the number of
   different keys, divided by 2 (or 3) per question, is the number of questions you need. */

export type Mode = 'sort' | 'group' | 'dumbbell' | 'search'
export type Game = {
  mode: Mode
  n: number
  k: number
  inputs: number[][]
  queries: { a: number; b: number; label: string }[]
  outcomes: number
  outLabels: string[]
  outcome: (inp: number[], q: number) => number
  key: (inp: number[]) => string
  what: string
}

export function perms(n: number): number[][] {
  if (n === 0) return [[]]
  const out: number[][] = []
  const rec = (a: number[], rest: number[]) => {
    if (!rest.length) return void out.push(a)
    rest.forEach((x, i) => rec([...a, x], [...rest.slice(0, i), ...rest.slice(i + 1)]))
  }
  rec([], Array.from({ length: n }, (_, i) => i))
  return out
}
export const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1))

export function makeGame(mode: Mode, n: number, k = 2): Game {
  const idx = Array.from({ length: n }, (_, i) => i)
  if (mode === 'sort' || mode === 'group') {
    const size = mode === 'group' ? n / k : 1
    const queries: Game['queries'] = []
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) queries.push({ a: i, b: j, label: `x${i + 1} : x${j + 1}` })
    return {
      mode, n, k,
      inputs: perms(n),
      queries,
      outcomes: 2,
      outLabels: ['<', '>'],
      outcome: (inp, q) => (inp[queries[q].a] < inp[queries[q].b] ? 0 : 1),
      key: mode === 'sort' ? (inp) => inp.join(',') : (inp) => inp.map((r) => Math.floor(r / size)).join(','),
      what: mode === 'sort' ? 'the order' : `the ${k} groups`,
    }
  }
  if (mode === 'dumbbell') {
    const ps = perms(n)
    const inputs: number[][] = []
    for (const s of ps) for (const t of ps) inputs.push([...s, ...t])
    const queries: Game['queries'] = []
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) queries.push({ a: i, b: j, label: `A${i + 1} : B${j + 1}` })
    return {
      mode, n, k,
      inputs,
      queries,
      outcomes: 3,
      outLabels: ['A lighter', 'same', 'A heavier'],
      outcome: (inp, q) => Math.sign(inp[queries[q].a] - inp[n + queries[q].b]) + 1,
      // key: which B each A matches
      key: (inp) => idx.map((i) => { for (let j = 0; j < n; j++) if (inp[n + j] === inp[i]) return j; return -1 }).join(','),
      what: 'the matching',
    }
  }
  // search: the hidden index i in 0..n-1; ask "i vs q"
  const queries: Game['queries'] = idx.map((q) => ({ a: q, b: q, label: `index : ${q + 1}` }))
  return {
    mode, n, k,
    inputs: idx.map((i) => [i]),
    queries,
    outcomes: 3,
    outLabels: ['index <', 'index =', 'index >'],
    outcome: (inp, q) => Math.sign(inp[0] - q) + 1,
    key: (inp) => String(inp[0]),
    what: 'the index',
  }
}

export const keyCount = (g: Game, alive: number[]) => new Set(alive.map((i) => g.key(g.inputs[i]))).size

export function split(g: Game, alive: number[], q: number) {
  const parts: number[][] = Array.from({ length: g.outcomes }, () => [])
  for (const i of alive) parts[g.outcome(g.inputs[i], q)].push(i)
  return parts.map((list, out) => ({ out, alive: list, keys: keyCount(g, list) }))
}

/** the adversary: whichever answer leaves the most different keys still possible */
export function adversary(g: Game, alive: number[], q: number) {
  const parts = split(g, alive, q).filter((p) => p.alive.length)
  parts.sort((a, b) => b.keys - a.keys || b.alive.length - a.alive.length || a.out - b.out)
  return parts[0]
}

/** a good algorithm: the question whose worst answer leaves the fewest keys */
export function bestQuery(g: Game, alive: number[], asked: Set<number>) {
  let best = -1
  let bestScore: [number, number] = [Infinity, Infinity]
  g.queries.forEach((_, q) => {
    if (asked.has(q)) return
    const parts = split(g, alive, q)
    const worst = Math.max(...parts.map((p) => p.keys))
    const worstIn = Math.max(...parts.map((p) => p.alive.length))
    if (worst < bestScore[0] || (worst === bestScore[0] && worstIn < bestScore[1])) {
      best = q
      bestScore = [worst, worstIn]
    }
  })
  return best
}

export const lowerBound = (keys: number, outcomes: number) => Math.ceil(Math.log(keys) / Math.log(outcomes) - 1e-9)

/** number of different answers for k-group-sorting n items */
export const groupOutcomes = (n: number, k: number) => factorial(n) / Math.pow(factorial(n / k), k)
/** log2 of that, as a fraction of n log2 k */
export function groupBound(n: number, k: number) {
  let lg = 0
  for (let i = 2; i <= n; i++) lg += Math.log2(i)
  for (let i = 2; i <= n / k; i++) lg -= k * Math.log2(i)
  return { bits: lg, nlogk: n * Math.log2(k), frac: lg / (n * Math.log2(k)) }
}

/* ------------------------------------------------------------ counting sort */

export type CRec = { key: number; id: string }
export type CStep = { i: number; rec: CRec; slot: number; prefix: number[] }
export function countingSort(a: CRec[], k: number, stable = true) {
  const counts = Array(k).fill(0)
  for (const r of a) counts[r.key]++
  const prefix: number[] = []
  let s = 0
  for (let v = 0; v < k; v++) prefix.push((s += counts[v]))
  const cum = prefix.slice()
  const out: (CRec | null)[] = Array(a.length).fill(null)
  const steps: CStep[] = []
  const order = stable ? a.map((_, i) => a.length - 1 - i) : a.map((_, i) => i)
  for (const i of order) {
    const slot = --prefix[a[i].key]
    out[slot] = a[i]
    steps.push({ i, rec: a[i], slot, prefix: prefix.slice() })
  }
  return { counts, cum, steps, out: out as CRec[] }
}

/* ------------------------------------------------------------ radix sort */

export const digitsOf = (x: number, base: number, d: number) => Array.from({ length: d }, (_, i) => Math.floor(x / Math.pow(base, i)) % base)

/** least significant digit first. `stable` false = the inner sort scrambles ties */
export function radixLSD(nums: number[], base: number, d: number, stable = true) {
  let cur = nums.slice()
  const passes: { digit: number; order: number[] }[] = []
  for (let p = 0; p < d; p++) {
    const recs = cur.map((v) => ({ key: digitsOf(v, base, d)[p], id: String(v) }))
    const r = countingSort(recs, base, stable)
    cur = r.out.map((x) => +x.id)
    passes.push({ digit: p, order: cur.slice() })
  }
  return { out: cur, passes }
}
/** most significant digit first, with buckets */
export function radixMSD(nums: number[], base: number, d: number): number[] {
  const rec = (a: number[], p: number): number[] => {
    if (a.length <= 1 || p < 0) return a
    const buckets: number[][] = Array.from({ length: base }, () => [])
    for (const v of a) buckets[digitsOf(v, base, d)[p]].push(v)
    return buckets.flatMap((b) => rec(b, p - 1))
  }
  return rec(nums, d - 1)
}
/** total work of LSD radix: passes * (n + base) */
export const radixCost = (n: number, universe: number, base: number) => {
  const passes = Math.max(1, Math.ceil(Math.log(universe) / Math.log(base) - 1e-9))
  return { passes, cost: passes * (n + base) }
}

/* ------------------------------------------------------------ strings of different lengths (homework 2) */

export type SPass = { pos: number; participants: number; cost: number; list: string[] }
export function sortStrings(strs: string[], alphabet: string) {
  const L = Math.max(0, ...strs.map((s) => s.length))
  const byLen: string[][] = Array.from({ length: L + 1 }, () => [])
  for (const s of strs) byLen[s.length].push(s)
  let cur: string[] = []
  const passes: SPass[] = []
  for (let p = L; p >= 1; p--) {
    const input = [...byLen[p], ...cur]
    const buckets: string[][] = Array.from({ length: alphabet.length }, () => [])
    for (const s of input) buckets[alphabet.indexOf(s[p - 1])].push(s)
    cur = buckets.flat()
    passes.push({ pos: p, participants: input.length, cost: input.length + alphabet.length, list: cur.slice() })
  }
  const out = [...byLen[0], ...cur]
  const cost = passes.reduce((s, q) => s + q.cost, 0) + strs.length + L
  const total = strs.reduce((s, x) => s + x.length, 0)
  const padded = L * (strs.length + alphabet.length)
  return { out, passes, cost, total, padded, L }
}
