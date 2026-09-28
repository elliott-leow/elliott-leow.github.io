/* exam-style questions, generated from the same functions the figures use */
import { rng, ri, pick, shuffle } from './rng.ts'
import { master, thetaText } from './math.ts'
import { factorial, groupOutcomes, lowerBound } from './sorting.ts'
import { worstFraction, recursionSum } from './select.ts'
import { pushCosts } from './amort.ts'
import { extractMin, isHeap } from './heaps.ts'

export type Q = { topic: string; q: string; options: string[]; answer: number; why: string }

const uniq = (correct: string, wrong: string[], r: () => number): { options: string[]; answer: number } => {
  const seen = new Set([correct])
  const w: string[] = []
  for (const x of wrong) if (!seen.has(x)) { seen.add(x); w.push(x) }
  const opts = shuffle([correct, ...w.slice(0, 3)], r)
  return { options: opts, answer: opts.indexOf(correct) }
}
const num = (x: number) => String(x)

export function masterQ(r: () => number): Q {
  const a = pick(r, [1, 2, 3, 4, 5, 6, 8, 9])
  const b = pick(r, [2, 3, 4])
  const k = pick(r, [0, 1, 2, 3])
  const m = master(a, b, k)
  const fmt = (poly: string, lg: boolean) => `Θ(${poly === '1' ? (lg ? 'log n' : '1') : lg ? `${poly} log n` : poly})`
  const top = k === 0 ? '1' : k === 1 ? 'n' : `n^${k}`
  const bottomExp = Math.log(a) / Math.log(b)
  const bottom = Number.isInteger(bottomExp) ? (bottomExp === 1 ? 'n' : `n^${bottomExp}`) : `n^${Math.round(bottomExp * 1000) / 1000}`
  const correct = m.kase === 'top' ? fmt(top, false) : m.kase === 'even' ? fmt(top, true) : `Θ(${bottom})`
  const wrong = [fmt(top, false), fmt(top, true), `Θ(${bottom})`, `Θ(${bottom} log n)`, `Θ(n^${k + 1})`]
  return {
    topic: 'recurrences',
    q: `T(n) = ${a === 1 ? '' : a}T(n/${b}) + ${k === 0 ? '1' : k === 1 ? 'n' : `n^${k}`}. What is T(n)?`,
    ...uniq(correct, wrong, r),
    why: `a / b^k = ${a} / ${Math.pow(b, k)} = ${Math.round((a / Math.pow(b, k)) * 1000) / 1000}. ${m.kase === 'top' ? '< 1: top level dominates' : m.kase === 'even' ? '= 1: every level equal, log n levels' : '> 1: leaves dominate, n^(log_b a)'}.`,
  }
}

export function lowerQ(r: () => number): Q {
  const t = ri(r, 0, 3)
  let text: string, ans: number, why: string
  if (t === 0) {
    const n = ri(r, 4, 8)
    ans = lowerBound(factorial(n), 2)
    text = `At least how many comparisons to sort ${n} distinct items in the worst case?`
    why = `${n}! = ${factorial(n)} leaves, binary tree: ⌈log₂ ${factorial(n)}⌉ = ${ans}.`
  } else if (t === 1) {
    const [n, k] = pick(r, [[4, 2], [6, 2], [6, 3], [8, 2], [8, 4]] as const)
    const M = groupOutcomes(n, k)
    ans = lowerBound(M, 2)
    text = `At least how many comparisons to ${k}-group-sort ${n} items?`
    why = `${n}!/((${n / k})!)^${k} = ${M} different answers, so ⌈log₂ ${M}⌉ = ${ans}.`
  } else if (t === 2) {
    const n = ri(r, 3, 6)
    ans = lowerBound(factorial(n), 3)
    text = `Two sets of ${n} dumbbells; you may only compare across sets (<, =, >). At least how many comparisons to find the matching?`
    why = `${n}! matchings, each comparison has 3 outcomes: ⌈log₃ ${factorial(n)}⌉ = ${ans}.`
  } else {
    const n = ri(r, 10, 60)
    ans = lowerBound(n, 3)
    text = `A hidden index among ${n}; each query answers <, = or >. At least how many queries?`
    why = `${n} answers, 3 outcomes per query: ⌈log₃ ${n}⌉ = ${ans}.`
  }
  return { topic: 'lower bounds', q: text, ...uniq(num(ans), [num(ans + 1), num(ans - 1), num(ans + 3), num(ans * 2)].filter((x) => +x > 0), r), why }
}

export function bfprtQ(r: () => number): Q {
  const g = pick(r, [3, 5, 7, 9, 11])
  const s = recursionSum(g)
  const worst = Math.round(worstFraction(g) * 1000) / 1000
  const lin = s < 1 - 1e-9
  return {
    topic: 'selection',
    q: `Median of medians with groups of ${g}. The two recursive calls are on n/${g} and at most ${worst}n elements. Total time?`,
    ...uniq(lin ? 'Θ(n)' : 'Θ(n log n)', ['Θ(n)', 'Θ(n log n)', 'Θ(n²)', 'Θ(n log log n)'], r),
    why: `${Math.round((1 / g) * 1000) / 1000} + ${worst} = ${Math.round(s * 1000) / 1000} ${lin ? '< 1: work shrinks each level, top wins' : '= 1: every level costs cn, log n levels'}.`,
  }
}

const pop = (n: number) => n.toString(2).split('').filter((c) => c === '1').length
export function binomialQ(r: () => number): Q {
  const n = ri(r, 5, 200)
  const t = ri(r, 0, 1)
  if (t === 0) {
    const a = pop(n)
    return { topic: 'heaps', q: `A binomial heap holds ${n} items. How many trees does it have?`, ...uniq(num(a), [num(a + 1), num(Math.max(1, a - 1)), num(Math.floor(Math.log2(n))), num(Math.floor(Math.log2(n)) + 1)], r), why: `${n} = ${n.toString(2)}₂: one tree per 1 bit, so ${a}.` }
  }
  const k = Math.floor(Math.log2(n))
  return { topic: 'heaps', q: `A binomial heap holds ${n} items. What is the largest tree in it?`, ...uniq(`B${k}`, [`B${k + 1}`, `B${Math.max(0, k - 1)}`, `B${n}`, `B${pop(n)}`], r), why: `${n} = ${n.toString(2)}₂, highest 1 bit is bit ${k}, so B${k}.` }
}

export function btreeQ(r: () => number): Q {
  const h = ri(r, 2, 5)
  const t = ri(r, 0, 2)
  if (t === 0) return { topic: 'trees', q: `Most keys a 2-3-4 tree with ${h} levels can hold?`, ...uniq(num(4 ** h - 1), [num(4 ** h), num(3 * h), num(2 ** h - 1), num(3 ** h - 1)], r), why: `every node full: 3 keys, 4 children. (4^${h} − 1)/3 nodes × 3 = ${4 ** h - 1}.` }
  if (t === 1) return { topic: 'trees', q: `Fewest keys a 2-3-4 tree with ${h} levels can hold?`, ...uniq(num(2 ** h - 1), [num(2 ** h), num(h), num(4 ** h - 1), num(3 ** h - 1)], r), why: `every node has 1 key and 2 children, a perfect binary tree: 2^${h} − 1.` }
  return { topic: 'trees', q: `Most keys a B-tree with t = 3 and ${h} levels can hold? (a node holds up to 2t−1 = 5 keys)`, ...uniq(num(6 ** h - 1), [num(5 ** h - 1), num(6 ** h), num(5 * h), num(4 ** h - 1)], r), why: `full nodes have 5 keys and 6 children: (6^${h} − 1) · 5 / 5 = ${6 ** h - 1}.` }
}

export function amortQ(r: () => number): Q {
  const t = ri(r, 0, 2)
  if (t === 0) {
    const k = ri(r, 3, 9)
    const n = 2 ** k
    const copies = pushCosts(n, 'double').costs.reduce((a, b) => a + b, 0) - n
    return { topic: 'amortized', q: `A stack in an array starts with capacity 1 and doubles when full. Total elements copied over ${n} pushes?`, ...uniq(num(copies), [num(copies + 1), num(copies * 2), num(n), num((n * (n - 1)) / 2)], r), why: `copies at sizes 1, 2, 4, …, ${n / 2}: total ${copies} < 2n. so cost n + ${copies} < 3n: O(1) amortized.` }
  }
  if (t === 1) {
    const n = ri(r, 20, 500)
    const flips = 2 * n - pop(n)
    return { topic: 'amortized', q: `A binary counter starts at 0 and is incremented ${n} times. Total bit flips?`, ...uniq(num(flips), [num(2 * n), num(flips + 1), num(n), num(flips - 1)], r), why: `bit i flips ⌊n/2^i⌋ times: Σ = 2n − (number of 1s in ${n}) = ${flips}. amortized < 2.` }
  }
  const n = ri(r, 2, 40)
  return { topic: 'amortized', q: `Move-to-front vs the best fixed list, m lookups, ${n} items. The bound is C_MTF ≤ 2·C_static + ?`, ...uniq(`n² = ${n * n}`, [`n = ${n}`, `m`, `${n * n * 2}`, `0`].map((x) => x), r), why: `Φ₀ ≤ number of pairs ≤ n².` }
}

export function heapQ(r: () => number): Q {
  const n = ri(r, 6, 10)
  let heap: number[] = []
  const vals = shuffle(Array.from({ length: n }, (_, i) => (i + 1) * 3), r)
  for (const v of vals) { heap = [...heap, v]; let i = heap.length - 1; while (i > 0 && heap[i] < heap[(i - 1) >> 1]) { const p = (i - 1) >> 1; [heap[i], heap[p]] = [heap[p], heap[i]]; i = p } }
  const e = extractMin(heap)
  const naiveShift = heap.slice(1)
  const noSink = [heap[heap.length - 1], ...heap.slice(1, -1)]
  const wrongChild = (() => { const a = noSink.slice(); const l = 1, rr = 2; const m = rr < a.length && a[rr] > a[l] ? rr : l; if (m < a.length && a[m] < a[0]) return a; [a[0], a[m]] = [a[m], a[0]]; return a })()
  const s = (a: number[]) => `[${a.join(', ')}]`
  return { topic: 'heaps', q: `Min-heap array ${s(heap)}. After extract-min, the array is?`, ...uniq(s(e.heap), [s(naiveShift), s(noSink), s(wrongChild)], r), why: `swap the root with the last (${heap[heap.length - 1]}), delete it, sink the new root, always swapping with the smaller child.` }
}

export function radixQ(r: () => number): Q {
  const c = ri(r, 2, 6)
  return { topic: 'sorting', q: `Sort n integers in the range 0 … n^${c} − 1 with radix sort in base n. How many counting-sort passes?`, ...uniq(num(c), [num(c + 1), num(c * 2), 'log n', num(Math.max(1, c - 1))], r), why: `each digit (base n) has n values, and n^${c} needs ${c} digits. every pass costs O(n + n), so O(${c}n) = O(n).` }
}

export function hashQ(r: () => number): Q {
  const n = ri(r, 4, 40)
  const t = ri(r, 0, 1)
  if (t === 0) {
    const e = (n * (n - 1)) / 2 / n
    const nice = (x: number) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 10) / 10))
    return { topic: 'hashing', q: `${n} keys in a table of size m = ${n} from a universal family. Expected number of colliding pairs at most?`, ...uniq(`${nice(e)}`, [nice(e * 2), nice(n), nice((n * (n - 1)) / 2), nice(1)], r), why: `C(${n},2) pairs × 1/m = (${n}·${n - 1}/2)/${n} = ${nice(e)}.` }
  }
  return { topic: 'hashing', q: `Perfect hashing on ${n} keys. Each of the ${n} first-level buckets with c keys gets a second table of what size?`, ...uniq('c²', ['c', '2c', 'c log c', 'n'], r), why: `c keys have C(c,2) pairs, each collides w.p. ≤ 1/c²: expected < ½ collisions, so a random draw works with probability ≥ ½.` }
}

export function ufQ(r: () => number): Q {
  const t = ri(r, 0, 1)
  if (t === 0) { const k = ri(r, 2, 9); return { topic: 'union-find', q: `Union by rank. A root of rank ${k} has at least how many nodes in its tree?`, ...uniq(num(2 ** k), [num(k), num(k * k), num(2 ** k - 1), num(2 * k)], r), why: `rank only grows when two equal ranks meet, doubling the size: ≥ 2^${k} = ${2 ** k}.` } }
  const n = 2 ** ri(r, 4, 10)
  return { topic: 'union-find', q: `Union by rank only, n = ${n} elements. Largest possible height?`, ...uniq(num(Math.log2(n)), [num(n - 1), num(Math.sqrt(n)), num(Math.log2(n) + 1), num(n / 2)], r), why: `rank ≤ log₂ n and height = rank of the root.` }
}

export const GENERATORS = [masterQ, lowerQ, bfprtQ, binomialQ, btreeQ, amortQ, heapQ, radixQ, hashQ, ufQ]
export function makeSet(seed: number, count = 10): Q[] {
  const r = rng(seed * 2654435761)
  const order = shuffle(GENERATORS.map((_, i) => i), r)
  return Array.from({ length: count }, (_, i) => GENERATORS[order[i % order.length]](r))
}
export { isHeap }
