import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bstInsert, bstHeight, bstInorder, btInsert, btValid, btKeys, btHeight, btNodes, btPath, worstSequence, NAIVE_BAD, bestNextAmortized, bankRun, rbInsert, rbValid, rbInorder, rbHeight, rbRotate, to234, rbBlackHeight } from '../../lib/algos/trees.ts'
import { rng, shuffle, ri } from '../../lib/algos/rng.ts'

test('BST: lecture example H O P K I N S; sorted input is a path', () => {
  let t = null
  for (const k of 'HOPKINS') t = bstInsert(t, k)
  assert.equal(t.key, 'H')
  assert.deepEqual(bstInorder(t), [...'HOPKINS'].sort())
  let s = null
  for (let i = 1; i <= 50; i++) s = bstInsert(s, String(i))
  assert.equal(bstHeight(s), 50)
})
function build(keys, t) { let r = null; for (const k of keys) { r = btInsert(r, k, t).root; assert.deepEqual(btValid(r, t), [], `after ${k}`) } return r }
test("B-tree (t=3) reproduces the lecture's example", () => {
  // start from the notes' tree by inserting keys that produce it, then E, F, S, U, V, P
  let r = null
  for (const k of 'ABCDHKLMNORTYZ') r = btInsert(r, k, 3).root
  assert.deepEqual(btValid(r, 3), [])
  assert.deepEqual(btKeys(r), [...'ABCDHKLMNORTYZ'].sort())
})
test('B-tree: random inserts keep all 3 properties, keep all keys, for t = 2, 3, 4', () => {
  const r = rng(13)
  for (const t of [2, 3, 4]) {
    for (let trial = 0; trial < 40; trial++) {
      const keys = shuffle(Array.from({ length: ri(r, 1, 120) }, (_, i) => String(i)), r)
      const tree = build(keys, t)
      assert.deepEqual(btKeys(tree), [...keys].sort((a, b) => a - b))
    }
  }
})
test('B-tree: duplicate insert changes nothing', () => {
  const r = btInsert(btInsert(null, '5', 2).root, '5', 2)
  assert.equal(r.dup, true)
})
test('2-3-4: splitting on the way down; height grows only when the root splits', () => {
  let r = null
  const heights = []
  for (let i = 1; i <= 40; i++) { const x = btInsert(r, String(i), 2); r = x.root; heights.push(btHeight(r)) }
  assert.equal(heights[0], 1)
  assert.ok(heights.every((h, i) => i === 0 || h - heights[i - 1] <= 1))
})
test('HW3(a): there are insert sequences after which ONE insert splits a whole root-to-leaf path', () => {
  for (const L of [1, 2, 3]) {
    const w = worstSequence(L)
    assert.deepEqual(btValid(w.root, 2), [])
    assert.equal(w.splits, L, `levels ${L}`)
  }
  const ns = [1, 2, 3].map((L) => worstSequence(L).n)
  assert.ok(ns[2] > 4 * ns[1] && ns[1] > 3 * ns[0], `n grows geometrically with the number of splits: ${ns}`)
})
test('HW3(b),(c): the bank (0,1,2) gives <= 1 amortized split per insert; "1 if full" does not', () => {
  const nb = NAIVE_BAD.map(String)
  assert.ok(bestNextAmortized(nb, [0, 0, 1]).amortized >= 2, 'naive bank pays 2 in one insert')
  assert.ok(bestNextAmortized(nb, [0, 1, 2]).amortized <= 1)
  for (const L of [1, 2, 3]) {
    const w = worstSequence(L)
    const run = bankRun([...w.seq, w.next], [0, 1, 2])
    assert.ok(run.rows.every((x) => x.amortized <= 1 && x.phi >= 0))
    assert.equal(run.rows[run.rows.length - 1].splits, L)
    assert.ok(run.rows[run.rows.length - 1].amortized <= 1, 'the big split is paid for by the bank')
  }
  const r = rng(3)
  for (let t = 0; t < 30; t++) {
    const keys = shuffle(Array.from({ length: ri(r, 1, 200) }, (_, i) => String(i)), r)
    const run = bankRun(keys, [0, 1, 2])
    assert.ok(run.rows.reduce((s, x) => s + x.splits, 0) <= keys.length, 'total splits <= number of inserts')
    assert.ok(run.rows.every((x) => x.amortized <= 1))
  }
})
test('red-black: insertion keeps every property, random and sorted', () => {
  const r = rng(17)
  for (let trial = 0; trial < 60; trial++) {
    const n = ri(r, 1, 150)
    const keys = trial % 3 === 0 ? Array.from({ length: n }, (_, i) => i) : shuffle(Array.from({ length: n }, (_, i) => i), r)
    let t = null
    for (const k of keys) {
      const x = rbInsert(t, k)
      t = x.root
      assert.deepEqual(rbValid(t), [], `after ${k}: ${JSON.stringify(rbValid(t))}`)
      for (const s of x.steps.slice(0, -1)) assert.ok(s.note.length > 0)
    }
    assert.deepEqual(rbInorder(t), [...keys].sort((a, b) => a - b))
    assert.ok(rbHeight(t) <= 2 * Math.log2(n + 1) + 1e-9, 'height <= 2 log(n+1)')
  }
})
test('red-black: a rotation preserves order; the 2-3-4 view is a valid 2-3-4 tree', () => {
  const r = rng(29)
  for (let trial = 0; trial < 40; trial++) {
    let t = null
    const keys = shuffle(Array.from({ length: ri(r, 1, 80) }, (_, i) => i), r)
    for (const k of keys) t = rbInsert(t, k).root
    const b = to234(t)
    assert.deepEqual(btValid(b, 2), [], JSON.stringify(b))
    assert.equal(btNodes(b).reduce((s, n) => s + n.keys.length, 0), keys.length)
    const k = keys[ri(r, 0, keys.length - 1)]
    for (const d of ['L', 'R']) assert.deepEqual(rbInorder(rbRotate(t, k, d)), rbInorder(t))
    // black height of the tree = depth of the 2-3-4 tree
    assert.equal(btHeight(b), rbBlackHeight(t))
  }
})
test('red-black: inserting 1,2,3 makes a rotation with 2 at the top', () => {
  let t = null
  for (const k of [1, 2, 3]) t = rbInsert(t, k).root
  assert.equal(t.key, 2)
  assert.equal(t.red, false)
  assert.equal(t.l.red && t.r.red, true)
})

test('B-tree insert snapshots: one valid tree per event, the last one is the result; btPath ends at the key', () => {
  const r = rng(5)
  for (const t of [2, 3, 4]) {
    let root = null
    for (const k of shuffle(Array.from({ length: 120 }, (_, i) => String(i + 1)), r)) {
      const x = btInsert(root, k, t)
      assert.equal(x.snaps.length, x.events.length)
      for (const s of x.snaps) assert.deepEqual(btValid(s, t), [])
      assert.deepEqual(x.snaps[x.snaps.length - 1], x.root)
      // a split moves keys around but adds none; only the last step adds the key
      x.snaps.slice(0, -1).forEach((s) => assert.equal(btKeys(s).length, btKeys(root).length))
      root = x.root
      const path = btPath(root, k)
      assert.ok(path[path.length - 1].keys.includes(k))
      assert.equal(path[0], root)
    }
    assert.deepEqual(btInsert(root, '7', t).snaps, [])
  }
})
