/* lecture 4: quickselect and median of medians */

export type Round = { size: number; pivot: number; L: number[]; G: number[]; k: number; arr: number[] }

/** sort with insertion sort, counting comparisons */
function sortCount(a: number[], st: { comps: number }) {
  const b = a.slice()
  for (let i = 1; i < b.length; i++) {
    let j = i
    while (j > 0) {
      st.comps++
      if (b[j] < b[j - 1]) {
        ;[b[j], b[j - 1]] = [b[j - 1], b[j]]
        j--
      } else break
    }
  }
  return b
}

export type PivotRule = 'first' | 'last' | 'middle' | 'median3' | 'mom'

/** the pivot is the *value* chosen; comparisons made choosing it are added to st.comps */
export function choosePivot(a: number[], rule: PivotRule, st: { comps: number }, g = 5): number {
  if (rule === 'first') return a[0]
  if (rule === 'last') return a[a.length - 1]
  if (rule === 'middle') return a[Math.floor(a.length / 2)]
  if (rule === 'median3') {
    const t = sortCount([a[0], a[Math.floor(a.length / 2)], a[a.length - 1]], st)
    return t[1]
  }
  return bfprt(a, Math.ceil(a.length / 2), st, g)
}

/** quickselect with any pivot rule. k is 1-based. every round costs (size - 1) comparisons, plus whatever choosing the pivot cost */
export function quickselect(arr: number[], k: number, rule: PivotRule, g = 5): { value: number; rounds: Round[]; comps: number; pivotComps: number } {
  const st = { comps: 0 }
  let a = arr.slice()
  const rounds: Round[] = []
  let partComps = 0
  while (true) {
    if (a.length === 1) {
      rounds.push({ size: 1, pivot: a[0], L: [], G: [], k, arr: a })
      return { value: a[0], rounds, comps: st.comps + partComps, pivotComps: st.comps }
    }
    const p = choosePivot(a, rule, st, g)
    const L = a.filter((x) => x < p)
    const G = a.filter((x) => x > p)
    partComps += a.length - 1
    rounds.push({ size: a.length, pivot: p, L, G, k, arr: a })
    if (L.length === k - 1) return { value: p, rounds, comps: st.comps + partComps, pivotComps: st.comps }
    if (L.length > k - 1) a = L
    else {
      k = k - L.length - 1
      a = G
    }
  }
}

/** BFPRT with group size g (odd). k is 1-based */
export function bfprt(A: number[], k: number, st = { comps: 0 }, g = 5): number {
  if (A.length <= g) return sortCount(A, st)[k - 1]
  const meds: number[] = []
  for (let i = 0; i < A.length; i += g) {
    const grp = sortCount(A.slice(i, i + g), st)
    meds.push(grp[Math.floor((grp.length - 1) / 2)])
  }
  const p = bfprt(meds, Math.ceil(meds.length / 2), st, g)
  const L = A.filter((x) => x < p)
  const G = A.filter((x) => x > p)
  st.comps += A.length - 1
  if (L.length === k - 1) return p
  if (L.length > k - 1) return bfprt(L, k, st, g)
  return bfprt(G, k - L.length - 1, st, g)
}

export function bfprtComps(A: number[], k: number, g = 5) {
  const st = { comps: 0 }
  const v = bfprt(A, k, st, g)
  return { value: v, comps: st.comps }
}

/** one level of BFPRT, laid out for a picture */
export function bfprtTop(A: number[], g = 5) {
  const groups: number[][] = []
  for (let i = 0; i < A.length; i += g) groups.push(A.slice(i, i + g).sort((x, y) => x - y))
  const med = (grp: number[]) => grp[Math.floor((grp.length - 1) / 2)]
  const medians = groups.map(med)
  const sortedMeds = medians.slice().sort((x, y) => x - y)
  const p = sortedMeds[Math.floor((sortedMeds.length - 1) / 2)]
  // columns ordered by their median, so the "quadrants" line up
  const cols = groups.slice().sort((a, b) => med(a) - med(b))
  const pIdx = cols.findIndex((c) => med(c) === p)
  const smaller = new Set<number>()
  const larger = new Set<number>()
  cols.forEach((c, ci) => {
    const mi = Math.floor((c.length - 1) / 2)
    if (ci < pIdx) c.slice(0, mi + 1).forEach((x) => smaller.add(x))
    if (ci > pIdx) c.slice(mi).forEach((x) => larger.add(x))
    if (ci === pIdx) {
      c.slice(0, mi).forEach((x) => smaller.add(x))
      c.slice(mi + 1).forEach((x) => larger.add(x))
    }
  })
  const L = A.filter((x) => x < p)
  const G = A.filter((x) => x > p)
  return { groups, cols, medians, p, pIdx, smaller, larger, L, G, mi: (c: number[]) => Math.floor((c.length - 1) / 2) }
}

/** the worst side after a pivot from groups of g: as a fraction of n */
export const worstFraction = (g: number) => (3 * g - 1) / (4 * g)
/** T(n) <= T(worst n) + T(n/g) + cn: what the two recursive calls add up to */
export const recursionSum = (g: number) => worstFraction(g) + 1 / g
