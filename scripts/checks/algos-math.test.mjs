import { test } from 'node:test'
import assert from 'node:assert/strict'
import { karatsuba, karatsubaFour, strassen, strassenBlocks, matMul, master, thetaText, levels, recurrences, evalRec, fns, fnById, firstViolation, verdict } from '../../lib/algos/math.ts'
import { rng, ri } from '../../lib/algos/rng.ts'

test('karatsuba multiplies correctly (random up to 64 bits, edge cases)', () => {
  const r = rng(7)
  const big = () => BigInt(ri(r, 0, 2 ** 30)) * BigInt(ri(r, 1, 2 ** 30)) + BigInt(ri(r, 0, 1000))
  for (let i = 0; i < 500; i++) {
    const x = big(), y = big()
    assert.equal(karatsuba(x, y).result, x * y, `${x}*${y}`)
  }
  for (const [x, y] of [[0n, 0n], [1n, 1n], [7n, 7n], [255n, 255n], [65535n, 65535n], [54n, 41n], [2n ** 64n - 1n, 2n ** 64n - 1n]]) assert.equal(karatsuba(x, y).result, x * y)
  assert.equal(karatsuba(54n, 41n).result, 2214n) // lecture example
})
test('karatsuba does 3 subproducts, 3^log n base multiplications for powers of two', () => {
  const t = karatsuba(0b10110110n, 0b10100101n)
  assert.equal(t.kids.length, 3)
  const t16 = karatsuba(0xffffn, 0xffffn)
  assert.ok(t16.base < 16 * 16 / 4, 'far fewer small multiplications than grade school')
  const four = karatsubaFour(54n, 41n, 3)
  assert.equal(four.total, 2214n)
})
test('strassen: the 7 products give the same matrix as the ordinary product', () => {
  const r = rng(3)
  for (let i = 0; i < 100; i++) {
    const v = Array.from({ length: 8 }, () => ri(r, -9, 9))
    const s = strassenBlocks(...v)
    const [A, B, C, D, E, F, G, H] = v
    assert.deepEqual(s.out, [A * E + B * G, A * F + B * H, C * E + D * G, C * F + D * H])
  }
  for (const n of [1, 2, 4, 8, 16]) {
    const X = Array.from({ length: n }, () => Array.from({ length: n }, () => ri(r, -5, 5)))
    const Y = Array.from({ length: n }, () => Array.from({ length: n }, () => ri(r, -5, 5)))
    const s = strassen(X, Y)
    assert.deepEqual(s.C, matMul(X, Y))
    assert.equal(s.mults, 7 ** Math.log2(n))
  }
})
test('master theorem cases, including the homework and lecture ones', () => {
  assert.equal(master(2, 2, 1).kase, 'even')
  assert.equal(thetaText(2, 2, 1), 'n log n')
  assert.equal(master(3, 2, 1).kase, 'bottom')
  assert.ok(Math.abs(master(3, 2, 1).p - Math.log2(3)) < 1e-12)
  assert.equal(master(7, 2, 2).kase, 'bottom')
  assert.equal(master(1, 2, 1).kase, 'top')
  assert.equal(thetaText(1, 2, 1), 'n')
  assert.equal(master(6, 4, 1).kase, 'bottom') // HW1 3
  assert.ok(Math.abs(master(6, 4, 1).p - Math.log(6) / Math.log(4)) < 1e-12)
  assert.equal(master(4, 2, 2).kase, 'even')
  assert.equal(thetaText(8, 2, 2), 'n^3')
  assert.equal(master(1, 2, 0).kase, 'even') // binary search
  assert.equal(thetaText(1, 2, 0), 'log n')
})
test('recursion tree levels sum like the notes say', () => {
  const L = levels(2, 2, 1, 1024)
  assert.equal(L.length, 11)
  for (const l of L) assert.equal(l.total, 1024)
  const S = levels(7, 2, 2, 1024)
  assert.ok(Math.abs(S[1].total / S[0].total - 7 / 4) < 1e-12)
})
test('each recurrence: T(n)/guess stays bounded above and below as n grows', () => {
  for (const r of recurrences) {
    const xs = Array.from({ length: 24 }, (_, i) => r.lo + ((r.hi - r.lo) * i) / 23)
    const ratios = xs.map((x) => { const e = evalRec(r, x); return e.T / e.g })
    for (const v of ratios) assert.ok(Number.isFinite(v) && v > 0, `${r.id}: ${v}`)
    const half = ratios.slice(12)
    const mx = Math.max(...half), mn = Math.min(...half)
    assert.ok(mx / mn < 6, `${r.id} ratio spread ${mx / mn}`)
    // not still growing/shrinking by a lot at the end (log log converges slowly, so allow a bit)
    if (!r.integer) {
      const growth = ratios[23] / ratios[17]
      assert.ok(growth < 1.6 && growth > 0.6, `${r.id} still moving: ${growth}`)
    }
  }
})
test('wrong guesses visibly fail', () => {
  const r = recurrences.find((x) => x.id === 'thirds')
  const a = evalRec(r, 3), b = evalRec(r, 8)
  assert.ok(b.T / b.n / (a.T / a.n) > 2, 'T(n)/n keeps growing for 3T(n/3)+n')
  const bf = recurrences.find((x) => x.id === 'bfprt')
  const x = evalRec(bf, 5)
  assert.ok(x.T <= 10 * x.n, 'guess-and-check bound T(n) <= 10 n')
})
test('asymptotic verdicts (HW1 and recitation statements)', () => {
  const v = (f, g) => verdict(fnById(f), fnById(g))
  assert.match(v('n2p27'.replace('n2p27', '2n2p27'), 'n2').text, /Θ/)
  assert.match(v('3n', '3n2').text, /Θ/) // 3^n = Ω(3^(n+2)), also Θ
  assert.match(v('l15', 'l3').text, /Θ/)
  assert.equal(v('en', '2n').Omega, true)
  assert.equal(v('en', '2n').O, false) // e^n is not O(2^n)
  assert.equal(v('ncos', 'n').O, true)
  assert.equal(v('ncos', 'n').Omega, false)
  assert.equal(v('ntan', '2n').O, true)
  assert.equal(v('nmax', 'n2p').O, true)
  assert.equal(v('n2p', 'nmax').O, true)
  assert.equal(v('n2p', 'nmax').Omega, true)
  assert.equal(v('n', 'n2').little, 'o')
  assert.equal(v('n2', 'n').little, 'omega')
  assert.equal(v('sqcos', 'sqrt').O, true)
  assert.equal(v('n5', 'n2').O, false) // recitation: 2^(5 log n) = n^5 is not O(n^2)
  assert.equal(v('n5', 'n2').Omega, true)
})
test('lecture witnesses: 2n^2+27 <= 3n^2 for n > 5, fails at n0=4', () => {
  const f = fnById('2n2p27'), g = fnById('n2')
  assert.equal(firstViolation(f, g, 3, 5), 0)
  assert.equal(firstViolation(f, g, 3, 6), 0)
  assert.equal(firstViolation(f, g, 3, 4), 5)
  assert.ok(firstViolation(f, g, 2, 100) > 0)
  assert.equal(firstViolation(fnById('n2'), fnById('n3'), 1, 1), 0)
})
