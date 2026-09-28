import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quickselect, bfprt, bfprtComps, bfprtTop, worstFraction, recursionSum } from '../../lib/algos/select.ts'
import { rng, shuffle, ri } from '../../lib/algos/rng.ts'

const perm = (n, r) => shuffle(Array.from({ length: n }, (_, i) => i + 1), r)

test('quickselect returns the kth smallest for every pivot rule', () => {
  const r = rng(11)
  for (const rule of ['first', 'last', 'middle', 'median3', 'mom']) {
    for (let t = 0; t < 60; t++) {
      const n = ri(r, 1, 60)
      const A = perm(n, r)
      const k = ri(r, 1, n)
      assert.equal(quickselect(A, k, rule).value, k, `${rule} n=${n} k=${k}`)
    }
  }
})
test('quickselect: first pivot on sorted input is quadratic, median pivot is linear', () => {
  const n = 400
  const sorted = Array.from({ length: n }, (_, i) => i + 1)
  const bad = quickselect(sorted, n, 'first')
  assert.equal(bad.comps, (n * (n - 1)) / 2)
  const good = quickselect(sorted, n, 'middle')
  assert.ok(good.comps < 3 * n, `${good.comps}`)
  assert.ok(quickselect(sorted, 1, 'last').comps === (n * (n - 1)) / 2)
})
test('bfprt correct for group sizes 3, 5, 7', () => {
  const r = rng(5)
  for (const g of [3, 5, 7, 9]) {
    for (let t = 0; t < 60; t++) {
      const n = ri(r, 1, 120)
      const A = perm(n, r)
      const k = ri(r, 1, n)
      assert.equal(bfprt(A, k, { comps: 0 }, g), k)
    }
  }
})
test('bfprt is linear: comparisons / n stays bounded as n grows', () => {
  const r = rng(9)
  const ratios = [100, 1000, 10000].map((n) => bfprtComps(perm(n, r), Math.ceil(n / 2)).comps / n)
  for (const x of ratios) assert.ok(x < 40, `${x}`)
  assert.ok(ratios[2] / ratios[0] < 1.6, 'not growing like log n')
})
test('median of medians: both sides at most 7n/10 (Lemma 4.3.1)', () => {
  const r = rng(21)
  for (let n = 10; n <= 300; n += 10) {
    for (let t = 0; t < 8; t++) {
      const top = bfprtTop(perm(n, r))
      assert.ok(top.L.length <= (7 * n) / 10 && top.G.length <= (7 * n) / 10, `n=${n} L=${top.L.length} G=${top.G.length}`)
      assert.ok(top.L.length >= (3 * n) / 10 - 1 && top.G.length >= (3 * n) / 10 - 1)
      // the shaded "guaranteed" elements really are on the right side
      for (const x of top.smaller) assert.ok(x < top.p)
      for (const x of top.larger) assert.ok(x > top.p)
      assert.ok(top.smaller.size >= (3 * n) / 10 - 1)
    }
  }
})
test('why 5: groups of 3 give T(n/3)+T(2n/3), which is n log n; 5 and up are linear', () => {
  assert.ok(Math.abs(recursionSum(3) - 1) < 1e-12)
  assert.ok(Math.abs(worstFraction(5) - 0.7) < 1e-12)
  assert.ok(Math.abs(recursionSum(5) - 0.9) < 1e-12)
  assert.ok(recursionSum(7) < 1 && recursionSum(9) < 1)
  // the recurrences themselves: T(n)/n is flat for g=5 and keeps growing for g=3
  const T = (f1, f2) => { const M = new Map(); const t = (n) => { if (n <= 5) return 1; const key = n.toPrecision(9); if (!M.has(key)) M.set(key, t(f1 * n) + t(f2 * n) + n); return M.get(key) }; return t }
  const t3 = T(2 / 3, 1 / 3), t5 = T(0.7, 0.2)
  assert.ok(t3(1e8) / 1e8 > 2 * (t3(1e4) / 1e4))
  assert.ok(t5(1e8) / 1e8 < 10 && t5(1e12) / 1e12 < 10) // guess-and-check from the lecture: T(n) <= 10n
})
