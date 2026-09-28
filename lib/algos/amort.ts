/* lecture 7 and homework 3: amortized analysis */

/* ------------------------------------------------------------ stack in an array */
export type Growth = 'plus1' | 'double' | 'x1.5' | 'x3'
export function pushCosts(n: number, growth: Growth) {
  let cap = 1
  let size = 0
  const costs: number[] = []
  const caps: number[] = []
  for (let i = 0; i < n; i++) {
    let c = 1
    if (size === cap) {
      c += size // copy everything
      cap = growth === 'plus1' ? cap + 1 : growth === 'double' ? cap * 2 : growth === 'x1.5' ? Math.ceil(cap * 1.5) : cap * 3
    }
    size++
    costs.push(c)
    caps.push(cap)
  }
  return { costs, caps }
}

/* ------------------------------------------------------------ binary counter */
export function increment(bits: number[]) {
  const b = bits.slice()
  let i = 0
  let down = 0
  while (i < b.length && b[i] === 1) {
    b[i] = 0
    down++
    i++
  }
  if (i === b.length) b.push(1)
  else b[i] = 1
  return { bits: b, i, down, cost: down + 1, phi: b.reduce((s, x) => s + x, 0) }
}

/* ------------------------------------------------------------ the array-of-sorted-arrays dictionary */
export type Dict = (number[] | null)[]
export function dictInsert(A: Dict, x: number) {
  const D: Dict = A.map((a) => (a ? a.slice() : null))
  let B = [x]
  let cost = 1
  const merges: number[] = []
  let i = 0
  while (true) {
    if (i >= D.length) D.push(null)
    if (D[i] === null) {
      D[i] = B
      break
    }
    const m = B.length
    const M: number[] = []
    const a = D[i]!
    let p = 0
    let q = 0
    while (p < a.length || q < B.length) M.push(q >= B.length || (p < a.length && a[p] < B[q]) ? a[p++] : B[q++])
    cost += 2 * m
    merges.push(m)
    D[i] = null
    B = M
    i++
  }
  return { dict: D, cost, merges, landed: i }
}
export const dictLookup = (A: Dict, x: number) => {
  let probes = 0
  let found = false
  for (const a of A) {
    if (!a) continue
    let lo = 0
    let hi = a.length - 1
    while (lo <= hi) {
      probes++
      const mid = (lo + hi) >> 1
      if (a[mid] === x) {
        found = true
        break
      }
      if (a[mid] < x) lo = mid + 1
      else hi = mid - 1
    }
  }
  return { found, probes }
}

/* ------------------------------------------------------------ move to front (homework 3) */
export function mtfRun(items: number[], ops: number[], ref: number[]) {
  let list = items.slice()
  const pos = new Map(ref.map((x, i) => [x, i]))
  const inv = (L: number[]) => {
    let c = 0
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (pos.get(L[i])! > pos.get(L[j])!) c++
    return c
  }
  let phi = inv(list)
  const phi0 = phi
  const rows: { x: number; cost: number; refCost: number; before: number[]; after: number[]; dPhi: number; amortized: number; A: number; B: number }[] = []
  for (const x of ops) {
    const before = list.slice()
    const t = before.indexOf(x) + 1
    const refCost = ref.indexOf(x) + 1
    const ahead = before.slice(0, t - 1)
    const A = ahead.filter((y) => pos.get(y)! < pos.get(x)!).length // before x in both lists
    const B = ahead.length - A // before x here, after x in the reference
    list = [x, ...before.filter((y) => y !== x)]
    const np = inv(list)
    rows.push({ x, cost: t, refCost, before, after: list.slice(), dPhi: np - phi, amortized: t + np - phi, A, B })
    phi = np
  }
  const total = rows.reduce((s, r) => s + r.cost, 0)
  const refTotal = rows.reduce((s, r) => s + r.refCost, 0)
  return { rows, total, refTotal, phi0, phiEnd: phi }
}
/** the best fixed list: most-looked-up first */
export function bestStatic(items: number[], ops: number[]) {
  const c = new Map<number, number>()
  for (const x of ops) c.set(x, (c.get(x) ?? 0) + 1)
  return items.slice().sort((a, b) => (c.get(b) ?? 0) - (c.get(a) ?? 0) || a - b)
}
export const listCost = (list: number[], ops: number[]) => ops.reduce((s, x) => s + list.indexOf(x) + 1, 0)
