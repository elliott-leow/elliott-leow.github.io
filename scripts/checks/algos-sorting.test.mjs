import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeGame, keyCount, split, adversary, bestQuery, lowerBound, factorial, groupOutcomes, groupBound, countingSort, radixLSD, radixMSD, radixCost, sortStrings } from '../../lib/algos/sorting.ts'
import { rng, ri, shuffle } from '../../lib/algos/rng.ts'

function play(g, choose) {
  let alive = g.inputs.map((_, i) => i)
  const asked = new Set()
  let steps = 0
  const start = keyCount(g, alive)
  while (keyCount(g, alive) > 1) {
    const q = choose(alive, asked)
    assert.ok(q >= 0, 'ran out of questions with keys left')
    asked.add(q)
    const before = keyCount(g, alive)
    const a = adversary(g, alive, q)
    alive = a.alive
    steps++
    assert.ok(a.keys * g.outcomes >= before, 'adversary keeps at least 1/outcomes of the keys')
  }
  return { steps, start }
}

test('sorting game: n! keys, adversary never lets you beat log2 n!', () => {
  for (const n of [2, 3, 4, 5]) {
    const g = makeGame('sort', n)
    assert.equal(keyCount(g, g.inputs.map((_, i) => i)), factorial(n))
    const { steps } = play(g, (alive, asked) => bestQuery(g, alive, asked))
    assert.ok(steps >= lowerBound(factorial(n), 2), `n=${n}: ${steps}`)
    assert.ok(steps <= { 2: 1, 3: 3, 4: 5, 5: 8 }[n], `n=${n} took ${steps}`)
  }
  // a dumb algorithm (asks in order) is beaten too, and never below the bound
  const g = makeGame('sort', 4)
  const { steps } = play(g, (alive, asked) => g.queries.findIndex((_, q) => !asked.has(q) && split(g, alive, q).every((p) => p.alive.length)))
  assert.ok(steps >= 5)
})
test('n=3 matches the lecture picture: 6 permutations, first comparison leaves 3', () => {
  const g = makeGame('sort', 3)
  const all = g.inputs.map((_, i) => i)
  const parts = split(g, all, 0)
  assert.deepEqual(parts.map((p) => p.keys), [3, 3])
})
test('dumbbell matching: 3 answers per question, n! matchings, needs >= log3 n!', () => {
  for (const n of [2, 3, 4]) {
    const g = makeGame('dumbbell', n)
    const all = g.inputs.map((_, i) => i)
    assert.equal(all.length, factorial(n) ** 2)
    assert.equal(keyCount(g, all), factorial(n))
    const { steps } = play(g, (alive, asked) => bestQuery(g, alive, asked))
    assert.ok(steps >= lowerBound(factorial(n), 3), `n=${n}: ${steps}`)
  }
  // same-set comparisons are not offered
  const g = makeGame('dumbbell', 3)
  assert.ok(g.queries.every((q) => q.label.startsWith('A') && q.label.includes(': B')))
})
test('k-group sorting game: n!/((n/k)!)^k answers', () => {
  for (const [n, k] of [[4, 2], [6, 2], [6, 3], [4, 4], [4, 1]]) {
    const g = makeGame('group', n, k)
    const all = g.inputs.map((_, i) => i)
    assert.equal(keyCount(g, all), groupOutcomes(n, k))
    if (n <= 6 && k > 1) {
      const { steps } = play(g, (alive, asked) => bestQuery(g, alive, asked))
      assert.ok(steps >= lowerBound(groupOutcomes(n, k), 2), `n=${n} k=${k}: ${steps}`)
    }
  }
  assert.equal(groupOutcomes(6, 3), 90)
  assert.equal(groupOutcomes(8, 8), factorial(8)) // n-group-sorted = fully sorted
  assert.equal(groupOutcomes(8, 1), 1) // 1-group-sorted: nothing to do
})
test('group bound: log2 of the number of answers is Theta(n log k)', () => {
  for (const [n, k] of [[1024, 2], [1024, 32], [4096, 64], [4096, 4096 / 2]]) {
    const b = groupBound(n, k)
    assert.ok(b.frac > 0.3 && b.frac <= 1.0001, `${n},${k}: ${b.frac}`)
  }
  assert.ok(groupBound(4096, 64).frac > 0.7)
})
test('search game (recitation 2): n indices, ternary tests, log3 n at least', () => {
  const g = makeGame('search', 13)
  const { steps } = play(g, (alive, asked) => bestQuery(g, alive, asked))
  assert.ok(steps >= lowerBound(13, 3))
  assert.ok(steps <= 3)
})

test('counting sort: sorted; stable keeps ties in order; unstable does not', () => {
  const r = rng(1)
  for (let t = 0; t < 100; t++) {
    const n = ri(r, 0, 30), k = ri(r, 1, 8)
    const a = Array.from({ length: n }, (_, i) => ({ key: ri(r, 0, k - 1), id: `r${i}` }))
    const s = countingSort(a, k, true)
    assert.deepEqual(s.out.map((x) => x.key), a.map((x) => x.key).sort((x, y) => x - y))
    const expect = [...a].sort((x, y) => x.key - y.key) // JS sort is stable
    assert.deepEqual(s.out.map((x) => x.id), expect.map((x) => x.id))
    const u = countingSort(a, k, false)
    assert.deepEqual(u.out.map((x) => x.key), a.map((x) => x.key).sort((x, y) => x - y))
  }
  const ties = [{ key: 1, id: 'a' }, { key: 1, id: 'b' }]
  assert.deepEqual(countingSort(ties, 2, true).out.map((x) => x.id), ['a', 'b'])
  assert.deepEqual(countingSort(ties, 2, false).out.map((x) => x.id), ['b', 'a'])
})
test('radix sort: lecture example, LSD needs stability, MSD works too', () => {
  const nums = [353, 457, 657, 839, 436, 720, 355]
  const sorted = [...nums].sort((a, b) => a - b)
  const lsd = radixLSD(nums, 10, 3, true)
  assert.deepEqual(lsd.out, sorted)
  assert.deepEqual(lsd.passes[0].order, [720, 353, 355, 436, 457, 657, 839]) // matches the notes
  assert.deepEqual(lsd.passes[1].order, [720, 436, 839, 353, 355, 457, 657])
  assert.deepEqual(radixMSD(nums, 10, 3), sorted)
  assert.notDeepEqual(radixLSD([21, 22], 10, 2, false).out, [21, 22])
  const r = rng(4)
  for (let t = 0; t < 100; t++) {
    const a = Array.from({ length: ri(r, 0, 25) }, () => ri(r, 0, 999))
    assert.deepEqual(radixLSD(a, 10, 3, true).out, [...a].sort((x, y) => x - y))
    assert.deepEqual(radixMSD(a, 10, 3), [...a].sort((x, y) => x - y))
    assert.deepEqual(radixLSD(a, 7, 4, true).out, [...a].sort((x, y) => x - y))
  }
})
test('radix cost: base n on a universe n^3 is 3 passes of 2n (the notes: 18n for n^9 base n... 9 passes)', () => {
  assert.deepEqual(radixCost(1000, 1000 ** 3, 1000), { passes: 3, cost: 6000 })
  assert.equal(radixCost(1000, 1000 ** 9, 1000).cost, 18000)
  assert.ok(radixCost(1000, 1000 ** 3, 2).cost > 4 * radixCost(1000, 1000 ** 3, 1000).cost)
})
test('HW2: strings of different lengths sort in O(total length)', () => {
  const r = rng(6)
  const alpha = 'abc'
  for (let t = 0; t < 200; t++) {
    const strs = Array.from({ length: ri(r, 0, 25) }, () => Array.from({ length: ri(r, 0, 7) }, () => alpha[ri(r, 0, 2)]).join(''))
    const s = sortStrings(strs, alpha)
    assert.deepEqual(s.out, [...strs].sort())
    assert.ok(s.cost <= 2 * s.total + 4 * (strs.length + 3 * 3) + 10, 'linear in n plus small terms')
  }
  assert.deepEqual(sortStrings(['b', 'ab', 'a', 'ba', ''], 'ab').out, ['', 'a', 'ab', 'b', 'ba'])
  // one long string and many short ones: padding would cost L*count, this costs about total
  const many = [...Array(50).fill('a'), 'a'.repeat(50)]
  const s = sortStrings(many, 'ab')
  assert.ok(s.cost < s.padded / 5, `${s.cost} vs ${s.padded}`)
})
