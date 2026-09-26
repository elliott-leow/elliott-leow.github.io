// Run after next build. Headings must start their CSS reveal in the exported
// HTML, even when JavaScript and the Spotify request have not completed.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const html = readFileSync(new URL('../../out/index.html', import.meta.url), 'utf8')
for (const id of ['music-h', 'notes-h']) {
  const heading = [...html.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/g)].map(m => m[0]).find(h => h.includes(`id="${id}"`))
  assert.ok(heading, `${id} must be present before client hydration`)
  assert.match(heading, /class="wipe is-seen\b/, `${id} must begin revealing without a client observer or Spotify response`)
}
console.log('Both homepage headings animate from the initial HTML.')
