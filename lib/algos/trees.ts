/* lecture 6: BSTs, B-trees / 2-3-4 trees, red-black trees */

export const cmp = (a: string, b: string) => {
  const x = Number(a), y = Number(b)
  if (a.trim() !== '' && b.trim() !== '' && !Number.isNaN(x) && !Number.isNaN(y)) return x - y
  return a < b ? -1 : a > b ? 1 : 0
}

/* ------------------------------------------------------------ plain BST */
export type BST = { key: string; l: BST | null; r: BST | null }
export function bstInsert(t: BST | null, key: string): BST {
  if (!t) return { key, l: null, r: null }
  const c = cmp(key, t.key)
  if (c === 0) return t
  return c < 0 ? { ...t, l: bstInsert(t.l, key) } : { ...t, r: bstInsert(t.r, key) }
}
export const bstHeight = (t: BST | null): number => (t ? 1 + Math.max(bstHeight(t.l), bstHeight(t.r)) : 0)
export const bstDepthOf = (t: BST | null, key: string, d = 1): number => (!t ? 0 : t.key === key ? d : bstDepthOf(cmp(key, t.key) < 0 ? t.l : t.r, key, d + 1))
export const bstInorder = (t: BST | null): string[] => (t ? [...bstInorder(t.l), t.key, ...bstInorder(t.r)] : [])

/* ------------------------------------------------------------ B-tree, t >= 2 */
export type BNode = { keys: string[]; kids: BNode[] }
export type BEvent =
  | { type: 'split'; before: string[]; median: string; root: boolean; depth: number }
  | { type: 'put'; key: string; leaf: string[] }
export const cloneB = (n: BNode): BNode => ({ keys: n.keys.slice(), kids: n.kids.map(cloneB) })

export function btInsert(root: BNode | null, key: string, t: number): { root: BNode; events: BEvent[]; splits: number; dup: boolean } {
  const events: BEvent[] = []
  if (!root) {
    events.push({ type: 'put', key, leaf: [key] })
    return { root: { keys: [key], kids: [] }, events, splits: 0, dup: false }
  }
  let r = cloneB(root)
  const max = 2 * t - 1
  const splitChild = (parent: BNode, i: number, depth: number, isRoot: boolean) => {
    const c = parent.kids[i]
    const before = c.keys.slice()
    const med = c.keys[t - 1]
    const right: BNode = { keys: c.keys.slice(t), kids: c.kids.slice(t) }
    c.keys = c.keys.slice(0, t - 1)
    c.kids = c.kids.slice(0, t)
    parent.keys.splice(i, 0, med)
    parent.kids.splice(i + 1, 0, right)
    events.push({ type: 'split', before, median: med, root: isRoot, depth })
  }
  // already there? (no changes, no splits)
  {
    let n: BNode | undefined = r
    while (n) {
      const i = n.keys.findIndex((k) => cmp(k, key) >= 0)
      if (i >= 0 && cmp(n.keys[i], key) === 0) return { root, events: [], splits: 0, dup: true }
      n = n.kids.length ? n.kids[i < 0 ? n.keys.length : i] : undefined
    }
  }
  if (r.keys.length === max) {
    const nr: BNode = { keys: [], kids: [r] }
    splitChild(nr, 0, 0, true)
    r = nr
  }
  let node = r
  let depth = 0
  while (node.kids.length) {
    let i = node.keys.findIndex((k) => cmp(key, k) < 0)
    if (i < 0) i = node.keys.length
    if (node.kids[i].keys.length === max) {
      splitChild(node, i, depth + 1, false)
      if (cmp(key, node.keys[i]) > 0) i++
    }
    node = node.kids[i]
    depth++
  }
  let j = node.keys.findIndex((k) => cmp(key, k) < 0)
  if (j < 0) j = node.keys.length
  node.keys.splice(j, 0, key)
  events.push({ type: 'put', key, leaf: node.keys.slice() })
  return { root: r, events, splits: events.filter((e) => e.type === 'split').length, dup: false }
}

export const btHeight = (n: BNode | null): number => (!n ? 0 : 1 + (n.kids.length ? btHeight(n.kids[0]) : 0))
export const btNodes = (n: BNode | null): BNode[] => (!n ? [] : [n, ...n.kids.flatMap(btNodes)])
export const btKeys = (n: BNode | null): string[] => (!n ? [] : n.kids.length ? n.kids.flatMap((c, i) => [...btKeys(c), ...(i < n.keys.length ? [n.keys[i]] : [])]) : n.keys)

/** the three B-tree properties from the notes; returns a list of problems (empty = valid) */
export function btValid(root: BNode | null, t: number): string[] {
  const bad: string[] = []
  if (!root) return bad
  const leaves = new Set<number>()
  const rec = (n: BNode, d: number, lo: string | null, hi: string | null, isRoot: boolean) => {
    const cnt = n.keys.length
    if (cnt > 2 * t - 1) bad.push(`too many keys: ${n.keys}`)
    if (cnt < (isRoot ? 1 : t - 1)) bad.push(`too few keys: ${n.keys}`)
    for (let i = 1; i < cnt; i++) if (cmp(n.keys[i - 1], n.keys[i]) >= 0) bad.push(`unsorted: ${n.keys}`)
    for (const k of n.keys) {
      if (lo !== null && cmp(k, lo) <= 0) bad.push(`${k} out of range`)
      if (hi !== null && cmp(k, hi) >= 0) bad.push(`${k} out of range`)
    }
    if (!n.kids.length) return void leaves.add(d)
    if (n.kids.length !== cnt + 1) bad.push(`degree: ${n.keys}`)
    n.kids.forEach((c, i) => rec(c, d + 1, i === 0 ? lo : n.keys[i - 1], i === cnt ? hi : n.keys[i], false))
  }
  rec(root, 0, null, null, true)
  if (leaves.size > 1) bad.push('leaves at different depths')
  return bad
}

/** homework 3: the next insert would cause this many splits (the number of full nodes on its path) */
export function pathFull(root: BNode | null, key: string, t: number) {
  return btInsert(root, key, t).splits
}
/** found by search (see scripts/checks): after these inserts (keys are ranks), ONE more insert splits `levels` nodes */
export const WORST: Record<number, number[]> = {
  1: [3, 2, 1],
  2: [10, 7, 6, 5, 4, 9, 8, 3, 2, 1],
  3: [46, 43, 42, 41, 40, 45, 44, 39, 38, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 9, 8, 7, 6, 5, 4, 3, 2, 1],
}
/** a sequence that makes the naive bank (1 if full, else 0) pay 2 in a single insert */
export const NAIVE_BAD = [17, 15, 14, 13, 16, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

/** build the tree from a sequence of keys, then find the gap where the next insert splits the most */
export function worstSequence(levels: number, t = 2) {
  const seq = (WORST[levels] ?? []).map(String)
  let root: BNode | null = null
  for (const k of seq) root = btInsert(root, k, t).root
  let best = { key: '0.5', splits: -1 }
  for (let g = 0; g <= seq.length; g++) {
    const key = String(g + 0.5)
    const sp = btInsert(root, key, t).splits
    if (sp > best.splits) best = { key, splits: sp }
  }
  return { seq, root, next: best.key, splits: best.splits, n: seq.length }
}

/** the bank on a node depends only on how many keys it has: bank[keys-1]. returns per-insert amortized cost (splits + change in bank) */
export function bankRun(keys: string[], bank: [number, number, number]) {
  let root: BNode | null = null
  const phi = (r: BNode | null) => btNodes(r).reduce((s, n) => s + (bank[n.keys.length - 1] ?? 0), 0)
  let prev = 0
  const rows: { key: string; splits: number; phi: number; amortized: number }[] = []
  for (const k of keys) {
    const r = btInsert(root, k, 2)
    root = r.root
    const p = phi(root)
    rows.push({ key: k, splits: r.splits, phi: p, amortized: r.splits + p - prev })
    prev = p
  }
  return { rows, root }
}

/* ------------------------------------------------------------ red-black trees */
export type RB = { key: number; red: boolean; l: RB | null; r: RB | null }
export type RBStep = { note: string; tree: RB | null; mark: number[] }
type N = { key: number; red: boolean; l: N | null; r: N | null; p: N | null }

const fromPlain = (t: RB | null, p: N | null = null): N | null => {
  if (!t) return null
  const n: N = { key: t.key, red: t.red, l: null, r: null, p }
  n.l = fromPlain(t.l, n)
  n.r = fromPlain(t.r, n)
  return n
}
const toPlain = (n: N | null): RB | null => (n ? { key: n.key, red: n.red, l: toPlain(n.l), r: toPlain(n.r) } : null)

export function rbInsert(tree: RB | null, key: number): { root: RB | null; steps: RBStep[] } {
  let root = fromPlain(tree)
  const steps: RBStep[] = []
  const snap = (note: string, ...mark: number[]) => steps.push({ note, tree: toPlain(root), mark })
  const rotL = (x: N) => {
    const y = x.r!
    x.r = y.l
    if (y.l) y.l.p = x
    y.p = x.p
    if (!x.p) root = y
    else if (x === x.p.l) x.p.l = y
    else x.p.r = y
    y.l = x
    x.p = y
  }
  const rotR = (x: N) => {
    const y = x.l!
    x.l = y.r
    if (y.r) y.r.p = x
    y.p = x.p
    if (!x.p) root = y
    else if (x === x.p.r) x.p.r = y
    else x.p.l = y
    y.r = x
    x.p = y
  }
  // ordinary BST insert; the new node is red
  let p: N | null = null
  let c = root
  while (c) {
    if (c.key === key) return { root: tree, steps: [] }
    p = c
    c = key < c.key ? c.l : c.r
  }
  const z: N = { key, red: true, l: null, r: null, p }
  if (!p) root = z
  else if (key < p.key) p.l = z
  else p.r = z
  snap(`insert ${key} as a red leaf`, key)
  let n = z
  while (n.p && n.p.red) {
    const par = n.p
    const g = par.p!
    const left = par === g.l
    const unc = left ? g.r : g.l
    if (unc && unc.red) {
      par.red = false
      unc.red = false
      g.red = true
      snap(`uncle red: recolor parent, uncle, grandparent (a 4-node splits)`, par.key, unc.key, g.key)
      n = g
    } else {
      if (left && n === par.r) {
        n = par
        rotL(n)
        snap(`uncle black, kink: rotate ${n.key} left`, n.key)
      } else if (!left && n === par.l) {
        n = par
        rotR(n)
        snap(`uncle black, kink: rotate ${n.key} right`, n.key)
      }
      const p2 = n.p!
      const g2 = p2.p!
      p2.red = false
      g2.red = true
      if (p2 === g2.l) rotR(g2)
      else rotL(g2)
      snap(`uncle black, line: rotate grandparent ${g2.key} ${p2.key < g2.key ? 'right' : 'left'} and swap colors`, p2.key, g2.key)
    }
  }
  if (root!.red) {
    root!.red = false
    snap('root is always black', root!.key)
  }
  return { root: toPlain(root), steps }
}

export const rbInorder = (t: RB | null): number[] => (t ? [...rbInorder(t.l), t.key, ...rbInorder(t.r)] : [])
export function rbValid(t: RB | null): string[] {
  const bad: string[] = []
  if (t?.red) bad.push('root is red')
  const rec = (n: RB | null, lo: number, hi: number): number => {
    if (!n) return 1
    if (n.key <= lo || n.key >= hi) bad.push(`order at ${n.key}`)
    if (n.red && ((n.l && n.l.red) || (n.r && n.r.red))) bad.push(`red-red at ${n.key}`)
    const a = rec(n.l, lo, n.key)
    const b = rec(n.r, n.key, hi)
    if (a !== b) bad.push(`black height differs at ${n.key}`)
    return a + (n.red ? 0 : 1)
  }
  rec(t, -Infinity, Infinity)
  return bad
}
export const rbHeight = (t: RB | null): number => (t ? 1 + Math.max(rbHeight(t.l), rbHeight(t.r)) : 0)
export const rbBlackHeight = (t: RB | null): number => (t ? rbBlackHeight(t.l) + (t.red ? 0 : 1) : 0)

/** rotate about key x. dir 'L' lifts x's right child. returns null if it can't */
export function rbRotate(t: RB | null, key: number, dir: 'L' | 'R'): RB | null {
  const rec = (n: RB | null): RB | null => {
    if (!n) return n
    if (n.key === key) {
      if (dir === 'L' && n.r) return { ...n.r, l: { ...n, r: n.r.l } }
      if (dir === 'R' && n.l) return { ...n.l, r: { ...n, l: n.l.r } }
      return n
    }
    return { ...n, l: rec(n.l), r: rec(n.r) }
  }
  return rec(t)
}
/** colors stay where they were: a rotation just moves the nodes */
export const canRotate = (t: RB | null, key: number, dir: 'L' | 'R'): boolean => {
  const f = (n: RB | null): RB | null => (!n ? null : n.key === key ? n : key < n.key ? f(n.l) : f(n.r))
  const n = f(t)
  return !!n && (dir === 'L' ? !!n.r : !!n.l)
}

/** every black node plus its red children is one 2-3-4 node */
export function to234(t: RB | null): BNode | null {
  if (!t) return null
  const conv = (b: RB): BNode => {
    const keys: string[] = []
    const kids: (RB | null)[] = []
    const walk = (x: RB | null, top: boolean) => {
      if (!x) return void kids.push(null)
      if (top || x.red) {
        walk(x.l, false)
        keys.push(String(x.key))
        walk(x.r, false)
      } else kids.push(x)
    }
    walk(b, true)
    return { keys, kids: kids.every((k) => k === null) ? [] : kids.map((k) => conv(k!)) }
  }
  return conv(t)
}

/** after `seq`, which single next insert has the largest amortized cost under this bank? */
export function bestNextAmortized(seq: string[], bank: [number, number, number]) {
  let best = { key: '0.5', amortized: -Infinity, splits: 0 }
  const base = bankRun(seq, bank)
  const n = seq.length
  for (let g = 0; g <= n; g++) {
    const key = String(g + 0.5)
    const r = bankRun([...seq, key], bank).rows[n]
    if (r.amortized > best.amortized) best = { key, amortized: r.amortized, splits: r.splits }
  }
  return { ...best, base }
}
