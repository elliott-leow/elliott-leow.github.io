import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextPlaybackDelay } from '../../lib/music-polling.ts'

test('waits until after the predicted end with a settling grace', () => {
  assert.equal(nextPlaybackDelay(120000), 121000)
  assert.equal(nextPlaybackDelay(4000), 5000)
})

test('expired timing cannot create a tight request loop', () => {
  assert.equal(nextPlaybackDelay(0), 2000)
  assert.equal(nextPlaybackDelay(500), 2000)
})

test('missing or invalid timing keeps the fallback polling interval', () => {
  for (const value of [null, undefined, -1, NaN, Infinity, '10000']) {
    assert.equal(nextPlaybackDelay(value), 20000)
  }
})

test('long tracks cannot overflow the browser timer and cause immediate polling', () => {
  assert.equal(nextPlaybackDelay(Number.MAX_VALUE), 2147483647)
})
