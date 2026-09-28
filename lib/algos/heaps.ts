/* lecture 8: binary heaps and binomial heaps */

/* ------------------------------------------------------------ binary heap (min), 0-indexed array */
export const parent = (i: number) => (i - 1) >> 1
export const depthOf = (i: number) => Math.floor(Math.log2(i + 1))
export const potential = (n: number) => {
  let s = 0
  for (let i = 0; i < n; i++) s += depthOf(i)
  return s
}
export type HStep = { i: number; j: number } // a swap of two positions

export function swim(h: number[], i: number) {
  const a = h.slice()
  const swaps: HStep[] = []
  while (i > 0 && a[i] < a[parent(i)]) {
    ;[a[i], a[parent(i)]] = [a[parent(i)], a[i]]
    swaps.push({ i, j: parent(i) })
    i = parent(i)
  }
  return { heap: a, swaps }
}
export function sink(h: number[], i: number, n = h.length) {
  const a = h.slice()
  const swaps: HStep[] = []
  while (true) {
    let m = i
    const l = 2 * i + 1
    const r = l + 1
    if (l < n && a[l] < a[m]) m = l
    if (r < n && a[r] < a[m]) m = r
    if (m === i) break
    ;[a[i], a[m]] = [a[m], a[i]]
    swaps.push({ i, j: m })
    i = m
  }
  return { heap: a, swaps }
}
export function insert(h: number[], x: number) {
  const r = swim([...h, x], h.length)
  return { ...r, at: h.length }
}
export function extractMin(h: number[]) {
  const min = h[0]
  const a = h.slice()
  const last = a.length - 1
  ;[a[0], a[last]] = [a[last], a[0]]
  const removedDepth = depthOf(last)
  a.pop()
  const r = sink(a, 0)
  return { min, ...r, removedDepth }
}
export function decreaseKey(h: number[], i: number, k: number) {
  const a = h.slice()
  a[i] = Math.min(a[i], k)
  return swim(a, i)
}
export function deleteAt(h: number[], i: number) {
  const a = h.slice()
  const last = a.length - 1
  if (i === last) return { heap: a.slice(0, -1), swaps: [] as HStep[] }
  a[i] = a[last]
  a.pop()
  const up = swim(a, i)
  if (up.swaps.length) return { heap: up.heap, swaps: up.swaps }
  return sink(a, i)
}
export const isHeap = (a: number[]) => a.every((v, i) => i === 0 || a[parent(i)] <= v)

/** build by n inserts (swim up) vs bottom-up (sink down): number of swaps */
export function buildBySwim(a: number[]) {
  let h: number[] = []
  let swaps = 0
  for (const x of a) {
    const r = insert(h, x)
    h = r.heap
    swaps += r.swaps.length
  }
  return { heap: h, swaps }
}
export function buildBySink(a: number[]) {
  let h = a.slice()
  let swaps = 0
  const order: number[] = []
  for (let i = (h.length >> 1) - 1; i >= 0; i--) {
    const r = sink(h, i)
    h = r.heap
    swaps += r.swaps.length
    order.push(i)
  }
  return { heap: h, swaps, order }
}
/** the sum in the notes: nodes at height h cost at most h each */
export const sinkBound = (n: number) => {
  let s = 0
  for (let h = 0; h <= Math.floor(Math.log2(n)); h++) s += h * Math.ceil(n / Math.pow(2, h + 1))
  return s
}

/* ------------------------------------------------------------ binomial heap */
export type BT = { id: number; key: number; kids: BT[] } // kids[i] has order i
export type BH = (BT | null)[] // index = order
export const cloneT = (t: BT): BT => ({ id: t.id, key: t.key, kids: t.kids.map(cloneT) })
export const cloneH = (h: BH): BH => h.map((t) => (t ? cloneT(t) : null))
export const sizeT = (t: BT): number => 1 + t.kids.reduce((s, k) => s + sizeT(k), 0)
export const sizeH = (h: BH) => h.reduce((s, t) => s + (t ? sizeT(t) : 0), 0)
export const treesIn = (h: BH) => h.filter(Boolean).length

/** link two trees of the same order: the smaller root goes on top */
export function link(a: BT, b: BT): BT {
  const [lo, hi] = a.key <= b.key ? [a, b] : [b, a]
  return { ...lo, kids: [...lo.kids, hi] }
}
export type MeldStep = { order: number; have: string[]; action: string; carryOut: boolean }
export function meld(h1: BH, h2: BH) {
  const A = cloneH(h1)
  const B = cloneH(h2)
  const out: BH = []
  const steps: MeldStep[] = []
  let carry: BT | null = null
  let links = 0
  const L = Math.max(A.length, B.length)
  for (let k = 0; k <= L; k++) {
    const present: { name: string; t: BT }[] = []
    if (A[k]) present.push({ name: 'H1', t: A[k]! })
    if (B[k]) present.push({ name: 'H2', t: B[k]! })
    if (carry) present.push({ name: 'carry', t: carry })
    let placed: BT | null = null
    let next: BT | null = null
    let action = ''
    if (present.length === 0) action = 'nothing'
    else if (present.length === 1) {
      placed = present[0].t
      action = `keep ${present[0].name}'s B${k}`
    } else if (present.length === 2) {
      next = link(present[0].t, present[1].t)
      links++
      action = `link ${present[0].name} + ${present[1].name} → carry B${k + 1}`
    } else {
      placed = carry
      next = link(A[k]!, B[k]!)
      links++
      action = `keep the carry, link H1 + H2 → carry B${k + 1}`
    }
    out[k] = placed
    carry = next
    steps.push({ order: k, have: present.map((p) => p.name), action, carryOut: !!next })
  }
  while (out.length && out[out.length - 1] === null) out.pop()
  return { heap: out, links, steps }
}
let nextId = 1000
export const freshId = () => nextId++
export const single = (key: number, id = freshId()): BH => [{ id, key, kids: [] }]
export function bhInsert(h: BH, key: number, id = freshId()) {
  const before = treesIn(h)
  const r = meld(h, single(key, id))
  const after = treesIn(r.heap)
  return { ...r, cost: r.links + 1, dPhi: after - before, amortized: r.links + 1 + after - before }
}
export function bhFindMin(h: BH) {
  let best: BT | null = null
  for (const t of h) if (t && (!best || t.key < best.key)) best = t
  return best
}
export function bhExtractMin(h: BH) {
  const m = bhFindMin(h)
  if (!m) return null
  const rest: BH = h.map((t) => (t && t.id === m.id ? null : t))
  while (rest.length && rest[rest.length - 1] === null) rest.pop()
  const kids: BH = m.kids.map((k) => k)
  const before = treesIn(h)
  const r = meld(rest, kids)
  const after = treesIn(r.heap)
  const cost = h.length + r.steps.length // find the min, then meld
  return { min: m.key, heap: r.heap, steps: r.steps, links: r.links, kids: m.kids.length, cost, dPhi: after - before, amortized: cost + after - before }
}
export function findPath(t: BT, id: number, path: BT[] = []): BT[] | null {
  if (t.id === id) return [...path, t]
  for (const k of t.kids) {
    const r = findPath(k, id, [...path, t])
    if (r) return r
  }
  return null
}
export function bhDecreaseKey(h: BH, id: number, key: number) {
  const H = cloneH(h)
  let swaps = 0
  for (const t of H) {
    if (!t) continue
    const path = findPath(t, id)
    if (!path) continue
    let i = path.length - 1
    path[i].key = Math.min(path[i].key, key)
    while (i > 0 && path[i].key < path[i - 1].key) {
      const tmp = path[i].key
      path[i].key = path[i - 1].key
      path[i - 1].key = tmp
      swaps++
      i--
    }
    break
  }
  return { heap: H, swaps }
}
export function bhValid(h: BH): string[] {
  const bad: string[] = []
  const rec = (t: BT, order: number) => {
    if (t.kids.length !== order) bad.push(`order of ${t.key}`)
    t.kids.forEach((k, i) => {
      if (k.key < t.key) bad.push(`heap order at ${t.key}`)
      rec(k, i)
    })
  }
  h.forEach((t, k) => {
    if (t) {
      rec(t, k)
      if (sizeT(t) !== 2 ** k) bad.push(`B${k} has ${sizeT(t)} nodes`)
    }
  })
  return bad
}
/** which orders are present, from the number of items: the binary representation */
export const orders = (n: number) => n.toString(2).split('').reverse().map((c, i) => (c === '1' ? i : -1)).filter((i) => i >= 0)
export const heapKeys = (h: BH): number[] => h.flatMap((t) => (t ? flat(t) : []))
const flat = (t: BT): number[] => [t.key, ...t.kids.flatMap(flat)]
