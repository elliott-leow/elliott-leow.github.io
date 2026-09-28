/* lecture 9: union-find */
export type DSU = { parent: number[]; rank: number[]; size: number[] }
export const makeDSU = (n: number): DSU => ({ parent: Array.from({ length: n }, (_, i) => i), rank: Array(n).fill(0), size: Array(n).fill(1) })
export type Opts = { byRank: boolean; compress: boolean }

export function find(d: DSU, x: number, o: Opts) {
  const path = [x]
  let r = x
  while (d.parent[r] !== r) {
    r = d.parent[r]
    path.push(r)
  }
  const root = r
  const hops = path.length - 1
  if (o.compress) for (const v of path) d.parent[v] = root
  return { root, path, hops }
}
export function union(d: DSU, x: number, y: number, o: Opts) {
  const a = find(d, x, o)
  const b = find(d, y, o)
  let steps = a.hops + b.hops
  if (a.root === b.root) return { linked: false, steps, child: -1, top: a.root }
  let [c, t] = [a.root, b.root] // c goes under t (naive: first under second)
  if (o.byRank) {
    if (d.rank[c] > d.rank[t]) [c, t] = [t, c]
    else if (d.rank[c] === d.rank[t]) d.rank[t]++
  }
  d.parent[c] = t
  d.size[t] += d.size[c]
  steps++
  return { linked: true, steps, child: c, top: t }
}
export const depth = (d: DSU, x: number) => {
  let k = 0
  while (d.parent[x] !== x) {
    x = d.parent[x]
    k++
  }
  return k
}
export const height = (d: DSU) => Math.max(...d.parent.map((_, i) => depth(d, i)))
/** inverse Ackermann-ish: how many times you can take log* ... here alpha(n) for real-world n */
export const alpha = (n: number) => (n <= 3 ? 1 : n <= 7 ? 2 : n <= 2047 ? 3 : n <= 2 ** 65536 ? 4 : 5)
export const components = (d: DSU) => {
  const m = new Map<number, number[]>()
  d.parent.forEach((_, i) => {
    let r = i
    while (d.parent[r] !== r) r = d.parent[r]
    m.set(r, [...(m.get(r) ?? []), i])
  })
  return [...m.values()]
}
