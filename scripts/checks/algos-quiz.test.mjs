import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeSet, GENERATORS } from '../../lib/algos/quiz.ts'
import { rng } from '../../lib/algos/rng.ts'
import { extractMin, isHeap, bhInsert, treesIn, sizeH, orders } from '../../lib/algos/heaps.ts'
import { increment } from '../../lib/algos/amort.ts'
import { master } from '../../lib/algos/math.ts'
import { factorial, makeGame, keyCount } from '../../lib/algos/sorting.ts'

test('every generated question is well formed: 4 distinct options, a valid answer, an explanation', () => {
  for (let seed = 1; seed <= 400; seed++) {
    for (const q of makeSet(seed, 10)) {
      assert.ok(q.q.length > 10 && q.why.length > 5, JSON.stringify(q))
      assert.equal(new Set(q.options).size, q.options.length, JSON.stringify(q))
      assert.ok(q.options.length >= 3 && q.options.length <= 4, JSON.stringify(q))
      assert.ok(q.answer >= 0 && q.answer < q.options.length, JSON.stringify(q))
      assert.ok(!q.options.some((o) => /NaN|undefined|Infinity/.test(o)), JSON.stringify(q))
    }
  }
})
test('all ten topics appear in a set of ten', () => {
  const t = new Set(makeSet(3, 10).map((q) => q.topic))
  assert.ok(t.size >= 8, [...t].join())
})
test('answers agree with independent computation', () => {
  const r = rng(99)
  for (let i = 0; i < 300; i++) {
    for (const g of GENERATORS) {
      const q = g(r)
      const a = q.options[q.answer]
      if (q.topic === 'amortized' && /bit flips/.test(q.q)) {
        const n = +q.q.match(/incremented (\d+)/)[1]
        let bits = [], flips = 0
        for (let k = 0; k < n; k++) { const x = increment(bits); bits = x.bits; flips += x.cost }
        assert.equal(+a, flips, q.q)
      }
      if (q.topic === 'heaps' && /extract-min/.test(q.q)) {
        const arr = JSON.parse(q.q.match(/\[[^\]]*\]/)[0])
        assert.ok(isHeap(arr))
        assert.equal(a, `[${extractMin(arr).heap.join(', ')}]`)
        assert.ok(isHeap(JSON.parse(a)))
      }
      if (/binomial heap holds \d+ items. How many trees/.test(q.q)) {
        const n = +q.q.match(/holds (\d+)/)[1]
        let h = []
        for (let k = 0; k < n; k++) h = bhInsert(h, (k * 7919) % 1000).heap
        assert.equal(+a, treesIn(h), q.q)
        assert.equal(sizeH(h), n)
      }
      if (q.topic === 'recurrences') {
        const [, aa, bb, kk] = q.q.match(/T\(n\) = (\d*)T\(n\/(\d)\) \+ (?:(1)|(n\^(\d))|(n))/) ? [0, +(q.q.match(/= (\d*)T/)[1] || 1), +q.q.match(/n\/(\d)/)[1], q.q.includes('+ 1.') ? 0 : q.q.match(/\+ n\^(\d)/) ? +q.q.match(/\+ n\^(\d)/)[1] : 1] : []
        const m = master(aa, bb, kk)
        if (m.kase === 'even') assert.match(a, /log n/, q.q)
        if (m.kase === 'top') assert.doesNotMatch(a, /log n/, q.q)
      }
      if (q.topic === 'lower bounds' && /sort (\d) distinct/.test(q.q)) {
        const n = +q.q.match(/sort (\d) distinct/)[1]
        const g = makeGame('sort', n < 6 ? n : 3)
        if (n < 6) assert.equal(keyCount(g, g.inputs.map((_, j) => j)), factorial(n))
        assert.equal(+a, Math.ceil(Math.log2(factorial(n))))
      }
    }
  }
})
