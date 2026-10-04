import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pushCosts, increment, dictInsert, dictLookup, mtfRun, bestStatic, listCost } from '../../lib/algos/amort.ts'
import { insert, extractMin, decreaseKey, deleteAt, isHeap, buildBySwim, buildBySink, sinkBound, potential, depthOf, sink, swim, bhInsert, bhExtractMin, bhFindMin, bhDecreaseKey, bhValid, meld, orders, treesIn, sizeH, heapKeys, single, cloneH, linkSteps, toHeap, byOrder } from '../../lib/algos/heaps.ts'
import { makeDSU, find, union, height, components, depth } from '../../lib/algos/dsu.ts'
import { collisionProbability, collisionFree, buildFKS, fksLookup, hab, loads, collisions, matHash, matCollisionProbability } from '../../lib/algos/hashing.ts'
import { rng, shuffle, ri } from '../../lib/algos/rng.ts'

test('array stack: +1 is quadratic; doubling is <= 3n total; each op amortizes to O(1)', () => {
  const n = 1024
  const plus = pushCosts(n, 'plus1').costs.reduce((a, b) => a + b, 0)
  assert.ok(plus > n * n / 2 - n)
  for (const g of ['double', 'x1.5', 'x3']) {
    const tot = pushCosts(n, g).costs.reduce((a, b) => a + b, 0)
    assert.ok(tot <= (g === 'x1.5' ? 5 : 3) * n, `${g}: ${tot}`)
  }
  const d = pushCosts(n, 'double').costs
  assert.equal(Math.max(...d), 513) // a single push can still cost n/2 + 1
})
test('binary counter: n increments cost <= 2n; c + dPhi = 2 exactly, Phi = number of ones', () => {
  let bits = []
  let total = 0
  for (let i = 1; i <= 1000; i++) {
    const before = bits.reduce((s, x) => s + x, 0)
    const r = increment(bits)
    bits = r.bits
    total += r.cost
    assert.equal(r.cost + r.phi - before, 2)
    assert.equal(parseInt([...bits].reverse().join(''), 2), i)
  }
  assert.ok(total <= 2000)
})
test('sorted-array dictionary: lecture example, cost O(n log n), lookup finds everything', () => {
  let D = []
  const r = rng(2)
  let total = 0
  const keys = shuffle(Array.from({ length: 512 }, (_, i) => i), r)
  for (const k of keys) { const x = dictInsert(D, k); D = x.dict; total += x.cost }
  assert.ok(total <= 2 * 512 * Math.log2(512) + 512, `${total}`)
  for (const k of keys.slice(0, 50)) assert.equal(dictLookup(D, k).found, true)
  assert.equal(dictLookup(D, 9999).found, false)
  assert.deepEqual(D.map((a) => (a ? a.length : 0)), [0, 0, 0, 0, 0, 0, 0, 0, 0, 512])
  // notes: inserting 1..11 then 12
  let E = []
  for (const k of [5, 2, 8, 1, 3, 4, 6, 7, 9, 10, 11]) E = dictInsert(E, k).dict
  assert.deepEqual(E.map((a) => (a ? a.length : 0)), [1, 2, 0, 8])
  const f = dictInsert(E, 12)
  assert.deepEqual(f.dict.map((a) => (a ? a.length : 0)), [0, 0, 4, 8])
  assert.deepEqual(f.merges, [1, 2])
})
test('HW3 move-to-front: c + dPhi <= 2*refcost - 1 every time; C_MTF <= 2 C_init; <= 2 C_static + n^2', () => {
  const r = rng(8)
  for (let t = 0; t < 200; t++) {
    const n = ri(r, 2, 12)
    const items = Array.from({ length: n }, (_, i) => i + 1)
    const ops = Array.from({ length: ri(r, 1, 60) }, () => (r() < 0.5 ? ri(r, 1, Math.min(3, n)) : ri(r, 1, n)))
    const a = mtfRun(items, ops, items)
    for (const row of a.rows) {
      assert.ok(row.amortized <= 2 * row.refCost - 1, JSON.stringify(row))
      assert.equal(row.amortized, 1 + 2 * row.A)
      assert.equal(row.dPhi, row.A - row.B)
    }
    assert.equal(a.phi0, 0)
    assert.ok(a.total <= 2 * listCost(items, ops))
    const st = bestStatic(items, ops)
    const b = mtfRun(items, ops, st)
    assert.equal(b.refTotal, listCost(st, ops))
    assert.ok(b.total <= 2 * b.refTotal + b.phi0 - b.phiEnd)
    assert.ok(b.total <= 2 * listCost(st, ops) + n * n)
    assert.ok(listCost(st, ops) <= listCost(items, ops))
  }
  // homework example: (x1,x2,x3,x4) with counts 2,3,1,4 costs 27; (x4,x2,x1,x3) costs 20
  const ops = [1, 1, 2, 2, 2, 3, 4, 4, 4, 4]
  assert.equal(listCost([1, 2, 3, 4], ops), 27)
  assert.equal(listCost([4, 2, 1, 3], ops), 20)
  assert.deepEqual(bestStatic([1, 2, 3, 4], ops), [4, 2, 1, 3])
})

test('binary heap: every op keeps heap order; extracting gives sorted order', () => {
  const r = rng(4)
  for (let t = 0; t < 100; t++) {
    let h = []
    const xs = shuffle(Array.from({ length: ri(r, 1, 60) }, (_, i) => i * 3), r)
    for (const x of xs) { h = insert(h, x).heap; assert.ok(isHeap(h)) }
    for (let j = 0; j < 5 && h.length; j++) {
      const i = ri(r, 0, h.length - 1)
      h = r() < 0.5 ? decreaseKey(h, i, h[i] - ri(r, 0, 50)).heap : deleteAt(h, i).heap
      assert.ok(isHeap(h))
    }
    const out = []
    while (h.length) { const e = extractMin(h); out.push(e.min); h = e.heap; assert.ok(isHeap(h)) }
    assert.deepEqual(out, [...out].sort((a, b) => a - b))
  }
})
test('binary heap amortization: extract-min is O(1) amortized, insert O(log n)', () => {
  const r = rng(6)
  let h = []
  for (const x of shuffle(Array.from({ length: 200 }, (_, i) => i), r)) {
    const before = potential(h.length)
    const ins = insert(h, x)
    const amort = 1 + ins.swaps.length + potential(ins.heap.length) - before
    assert.ok(amort <= 1 + 2 * depthOf(h.length))
    h = ins.heap
  }
  while (h.length > 1) {
    const before = potential(h.length)
    const e = extractMin(h)
    const amort = 1 + e.swaps.length + potential(e.heap.length) - before
    assert.ok(amort <= 1, `amortized ${amort}`)
    h = e.heap
  }
})
test('heap example from the notes: insert 7, extract min', () => {
  const H = [6, 10, 8, 17, 11, 25, 12, 21, 18, 19]
  assert.ok(isHeap(H))
  const i = insert(H, 7)
  assert.ok(isHeap(i.heap))
  assert.equal(i.heap[0], 6)
  assert.equal(extractMin(i.heap).min, 6)
})
test('build heap: bottom-up sink is O(n), n inserts is n log n on bad input', () => {
  const n = 4095
  const desc = Array.from({ length: n }, (_, i) => n - i)
  const a = buildBySwim(desc), b = buildBySink(desc)
  assert.ok(isHeap(a.heap) && isHeap(b.heap))
  assert.ok(b.swaps <= n && b.swaps <= sinkBound(n))
  assert.ok(a.swaps > 5 * b.swaps)
  const r = rng(1)
  for (let t = 0; t < 50; t++) {
    const xs = shuffle(Array.from({ length: ri(r, 1, 300) }, (_, i) => i), r)
    const s = buildBySink(xs)
    assert.ok(isHeap(s.heap) && s.swaps <= sinkBound(xs.length))
  }
})

test('binomial heap: n inserts give the binary representation of n; extract-min sorts', () => {
  const r = rng(12)
  for (let t = 0; t < 60; t++) {
    const n = ri(r, 1, 100)
    const keys = shuffle(Array.from({ length: n }, (_, i) => i), r)
    let h = []
    keys.forEach((k, idx) => {
      const before = treesIn(h)
      const x = bhInsert(h, k)
      h = x.heap
      assert.deepEqual(bhValid(h), [])
      assert.equal(x.amortized, 2) // links + 1 + (1 - links)
      assert.deepEqual(h.map((tt, o) => (tt ? o : -1)).filter((o) => o >= 0), orders(idx + 1))
      assert.equal(x.dPhi, treesIn(h) - before)
    })
    const out = []
    while (h.length) { const e = bhExtractMin(h); out.push(e.min); h = e.heap; assert.deepEqual(bhValid(h), []) }
    assert.deepEqual(out, keys.slice().sort((a, b) => a - b))
  }
})
test('binomial heap meld = binary addition; decrease-key swims up', () => {
  const r = rng(15)
  for (let t = 0; t < 60; t++) {
    const mk = (n, off) => { let h = []; for (let i = 0; i < n; i++) h = bhInsert(h, off + ri(r, 0, 1000) * 2 + (i % 2)).heap; return h }
    const a = mk(ri(r, 0, 40), 0), b = mk(ri(r, 0, 40), 0)
    const m = meld(a, b)
    assert.deepEqual(bhValid(m.heap), [])
    assert.equal(sizeH(m.heap), sizeH(a) + sizeH(b))
    assert.deepEqual(m.heap.map((tt, o) => (tt ? o : -1)).filter((o) => o >= 0), orders(sizeH(a) + sizeH(b)))
    assert.deepEqual([...heapKeys(m.heap)].sort((x, y) => x - y), [...heapKeys(a), ...heapKeys(b)].sort((x, y) => x - y))
    assert.ok(m.links <= treesIn(a) + treesIn(b))
    if (m.heap.length) {
      const ids = []
      const walk = (tt) => { ids.push(tt.id); tt.kids.forEach(walk) }
      m.heap.forEach((tt) => tt && walk(tt))
      const id = ids[ri(r, 0, ids.length - 1)]
      const d = bhDecreaseKey(m.heap, id, -5)
      assert.deepEqual(bhValid(d.heap), [])
      assert.equal(bhFindMin(d.heap).key, -5)
    }
  }
})
test('linking one carry at a time ends in the same shape as meld, and never loses a key', () => {
  const r = rng(11)
  for (let trial = 0; trial < 40; trial++) {
    const mk = (n) => { let h = []; for (let i = 0; i < n; i++) h = bhInsert(h, ri(r, 1, 500)).heap; return h }
    const a = mk(ri(r, 0, 40)), b = mk(ri(r, 1, 20))
    const row = [...a, ...b].filter(Boolean)
    const steps = linkSteps(row)
    const end = steps.length ? steps[steps.length - 1].forest : byOrder(row)
    const h = toHeap(end)
    assert.deepEqual(bhValid(h), [])
    assert.equal(steps.length, meld(a, b).links)
    assert.deepEqual(orders(sizeH(a) + sizeH(b)), end.map((t) => t.kids.length))
    assert.deepEqual(heapKeys(h).sort((x, y) => x - y), [...heapKeys(a), ...heapKeys(b)].sort((x, y) => x - y))
    // each step removes exactly one tree and links two of the same order
    steps.forEach((s, i) => { assert.equal(s.a.kids.length, s.b.kids.length); assert.equal(s.forest.length, row.length - i - 1) })
  }
})
test('lecture meld example sizes: 17 + 13 heaps', () => {
  let a = [], b = []
  for (let i = 0; i < 11; i++) a = bhInsert(a, i * 2).heap
  for (let i = 0; i < 7; i++) b = bhInsert(b, i * 2 + 1).heap
  const m = meld(a, b)
  assert.deepEqual(orders(18), m.heap.map((tt, o) => (tt ? o : -1)).filter((o) => o >= 0))
})

test('union-find: correct components; naive can build a path; by rank keeps height <= log n; compression flattens', () => {
  const r = rng(30)
  for (const o of [{ byRank: false, compress: false }, { byRank: true, compress: false }, { byRank: false, compress: true }, { byRank: true, compress: true }]) {
    const n = 60
    const d = makeDSU(n)
    const naive = Array.from({ length: n }, (_, i) => i)
    for (let s = 0; s < 80; s++) {
      const x = ri(r, 0, n - 1), y = ri(r, 0, n - 1)
      union(d, x, y, o)
      const ax = naive[x], ay = naive[y]
      if (ax !== ay) for (let i = 0; i < n; i++) if (naive[i] === ax) naive[i] = ay
      for (let i = 0; i < n; i += 7) assert.equal(find(d, i, o).root === find(d, x, o).root, naive[i] === naive[x])
    }
    assert.equal(components(d).length, new Set(naive).size)
  }
  const n = 128
  const d = makeDSU(n)
  for (let i = 0; i + 1 < n; i++) union(d, i, i + 1, { byRank: false, compress: false })
  assert.equal(height(d), n - 1)
  assert.equal(find(d, 0, { byRank: false, compress: false }).hops, n - 1)
  const e = makeDSU(n)
  for (let i = 0; i + 1 < n; i++) union(e, i, i + 1, { byRank: true, compress: false })
  assert.ok(height(e) <= Math.log2(n))
  // rank r root has >= 2^r nodes
  for (let i = 0; i < n; i++) if (e.parent[i] === i) assert.ok(e.size[i] >= 2 ** e.rank[i])
  // one find with compression: every node on the path now points at the root
  const f = find(d, 0, { byRank: false, compress: true })
  assert.equal(f.hops, n - 1)
  assert.equal(depth(d, 0), 1)
  assert.equal(find(d, 0, { byRank: false, compress: true }).hops, 1)
})

test('universal hashing: Pr[h(x)=h(y)] <= 1/m exactly, for every pair, p = 11', () => {
  for (const m of [2, 3, 4, 5, 7]) {
    for (let x = 0; x < 11; x++) for (let y = x + 1; y < 11; y++) {
      const c = collisionProbability(x, y, 11, m)
      assert.equal(c.total, 110)
      assert.ok(c.prob <= 1 / m + 1e-12, `p=11 m=${m} x=${x} y=${y}: ${c.prob}`)
    }
  }
})
test('a fixed hash x mod m is beaten by keys that are multiples of m; random (a,b) is not', () => {
  const keys = [0, 7, 14, 21, 28, 35, 42]
  assert.equal(collisions(keys, (x) => x % 7), 21) // all collide
  const p = 101
  let tot = 0
  for (let a = 1; a < p; a++) for (let b = 0; b < p; b++) tot += collisions(keys, hab(a, b, p, 7))
  const avg = tot / (100 * 101)
  assert.ok(avg <= 21 / 7 + 1e-9, `expected collisions <= C(n,2)/m = 3: ${avg}`)
  const c = collisionFree(keys, 101, 49)
  assert.ok(c.good / c.total >= 0.5, 'table of size n^2: at least half of the functions are collision free')
})
test('perfect hashing (FKS): no collisions, all lookups right, space O(n)', () => {
  const r = rng(77)
  for (let t = 0; t < 40; t++) {
    const p = 1009
    const n = ri(r, 1, 60)
    const keys = shuffle(Array.from({ length: 1000 }, (_, i) => i), r).slice(0, n)
    const f = buildFKS(keys, p, t + 1)
    for (const k of keys) assert.equal(fksLookup(f, k).found, true, `key ${k}`)
    for (let x = 0; x < 1000; x++) if (!keys.includes(x)) assert.equal(fksLookup(f, x).found, false)
    assert.ok(f.space <= 4 * n, `space ${f.space} n=${n}`)
    for (const s of f.second) assert.equal(s.slots.filter((x) => x !== null).length, s.slots.length ? f.buckets[f.second.indexOf(s)].length : 0)
  }
})

test('dropping b from h(a,b) breaks universality (the demo family); the full family never does', () => {
  const p = 11
  let broke = 0
  for (const m of [2, 3, 4, 6, 7, 9]) {
    let worst = 0
    for (let x = 0; x < p; x++) for (let y = x + 1; y < p; y++) {
      let hit = 0
      for (let a = 1; a < p; a++) if (((a * x) % p) % m === ((a * y) % p) % m) hit++
      worst = Math.max(worst, hit / (p - 1))
    }
    if (worst > 1 / m + 1e-12) broke++
  }
  assert.ok(broke >= 4)
})

test('matrix method (theorem 10.3.5): every pair of distinct keys collides with probability exactly 1/M', () => {
  const u = 4, b = 2
  const keys = Array.from({ length: 2 ** u }, (_, v) => Array.from({ length: u }, (_, i) => (v >> i) & 1))
  for (const x of keys) for (const y of keys) {
    if (x === y) continue
    assert.equal(matCollisionProbability(x, y, b).prob, 1 / 2 ** b)
  }
  // h(x) is the XOR of the columns picked out by x's 1 bits (the example in the notes: columns 1 and 3)
  assert.equal(matHash([0b101, 0b011, 0b011, 0b010], [1, 0, 1, 0]), 0b110)
})
