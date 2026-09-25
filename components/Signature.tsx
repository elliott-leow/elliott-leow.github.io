/*
 * The signature from ../name_animation/index-v3.html: the name in Shantell Sans SemiBold
 * outlines, written in by a pen. Each letter is revealed by a wide stroke running along
 * its centreline, in writing order. The pen keeps one average speed across the word, eases
 * in and out of each stroke, and pauses briefly wherever it lifts. The "lead" layer runs
 * 120ms ahead of the ink, which reads as wet ink at the nib.
 *
 * Nothing here runs in JavaScript. Each stroke is cut, when the page is built, into short
 * pieces a few milliseconds of pen travel long, each clipped to its letter, and each piece
 * just fades in on cue with a CSS opacity animation. Opacity is the one thing every browser
 * animates on the GPU, off the main thread, so the pen keeps moving at the display's full
 * rate even while the page is still loading its scripts. (Animating the stroke itself, as a
 * dash or a mask, has to be redrawn by the main thread every frame, and Safari stutters.)
 */
import type { CSSProperties } from 'react'
import SignatureReplay from './SignatureReplay'

/** Shantell Sans SemiBold outlines, font units (1000/em, y up) */
const glyphs = {
  e: 'M285 -10C436 -10 548 68 548 133C548 162 538 177 514 177C468 177 427 101 276 101C199 101 173 137 173 193C173 195 173 198 173 200C191 190 218 183 254 183C393 183 507 238 507 349C507 457 434 513 327 513C154 513 45 351 45 210C45 82 118 -10 285 -10ZM327 396C368 396 384 378 384 344C384 297 318 265 241 265C215 265 198 268 185 270C208 341 261 396 327 396Z',
  l: 'M220 -11C274 -11 317 22 317 72C317 101 307 123 275 123C263 123 257 117 237 117C213 117 193 143 193 297C193 485 217 576 217 655C217 730 192 760 149 760C116 760 98 742 89 694C70 583 60 474 60 317C60 24 149 -11 220 -11Z',
  i: 'M160 580C219 580 241 617 241 652C241 694 205 743 144 743C93 743 56 714 56 665C56 617 98 580 160 580ZM149 -10C195 -10 216 18 216 56C216 130 226 358 225 427C224 482 198 509 157 509C98 509 74 466 74 413C74 320 77 265 77 80C77 27 98 -10 149 -10Z',
  o: 'M333 -12C478 -12 589 104 589 258C589 411 493 507 333 507C323 507 314 506 304 504C295 509 283 511 271 511C178 511 47 394 47 254C47 99 166 -12 333 -12ZM178 253C178 268 181 283 187 296C190 295 194 295 197 295C227 295 236 311 266 340C293 367 311 384 345 384C414 384 458 334 458 256C458 167 406 109 328 109C237 109 178 165 178 253Z',
  t: 'M292 -13C391 -13 435 31 435 85C435 118 420 134 393 134C365 134 354 116 306 116C230 116 190 161 190 293C190 316 191 337 193 356C253 380 301 391 384 397C416 399 436 416 436 446C436 485 411 513 347 513C303 513 254 506 210 494C212 514 215 535 216 558C222 667 195 712 140 712C100 712 84 686 83 658C82 625 86 593 83 536C79 454 60 390 60 288C60 107 122 -13 292 -13Z',
  period: 'M166 -14C218 -14 243 17 243 55C243 107 207 166 125 166C80 166 50 135 50 89C50 25 93 -14 166 -14Z',
}

/** the written word: [segment, glyph, x offset] */
const marks: [seg: string, glyph: keyof typeof glyphs, x: number][] = [
  ['e', 'e', 43.88],
  ['l1', 'l', 106.63],
  ['l2', 'l', 141.41],
  ['i', 'i', 176.62],
  ['o', 'o', 207.94],
  ['t1', 't', 276.3],
  ['t2', 't', 326.09],
  ['period', 'period', 375.01],
]

const L = 'M150 690C140 520 126 340 128 220C130 110 165 52 215 52C240 52 255 62 265 66'
const T_STEM = 'M150 650C145 500 128 330 128 230C128 110 190 50 280 50C330 50 360 68 385 78'
const T_CROSS = 'M175 430C240 440 320 450 385 452'
/** pen centrelines in glyph font units, in writing order: [segment, nib width, pen lift before, path] */
const strokes: [seg: string, width: number, lift: boolean, d: string][] = [
  ['e', 105, true, 'M200 224C290 222 390 245 432 300'],
  ['e', 140, false, 'M432 300C460 345 452 410 405 438C360 460 290 462 240 440C150 400 100 300 105 200C110 90 190 45 280 44C360 44 440 80 495 125'],
  ['l1', 150, true, L],
  ['l2', 150, true, L],
  ['i', 160, true, 'M148 440L143 55'],
  ['i', 170, true, 'M132 672L164 648'],
  ['o', 165, true, 'M300 446C230 450 150 400 118 320C90 240 110 120 200 70C260 38 360 38 430 80C510 130 540 240 510 330C480 410 400 450 320 446C285 445 250 405 228 365'],
  ['t1', 155, true, T_STEM],
  ['t1', 150, true, T_CROSS],
  ['t2', 155, true, T_STEM],
  ['t2', 150, true, T_CROSS],
  ['period', 170, true, 'M132 88L162 64'],
]

const INK_LAG = 120
const PEN_LIFT = 24
const MIN_STROKE = 45
/** how much pen travel, in ms, each piece covers. each one fades in over that time, so the nib moves smoothly between them */
const PIECE_MS = 9
/** a finished letter swaps to its crisp outline over this long */
const SETTLE_MS = 16
// a stroke that carries on without a lift keeps its speed through the join
const EASE_IN = bezier(0.4, 0, 0.7, 0.7)
const EASE_OUT = bezier(0.3, 0.3, 0.55, 1)
const EASE_BOTH = bezier(0.4, 0, 0.45, 1)

/** the part of the word that's drawn, in the word's units: trimmed to the letters on the left and right */
const VIEW = { x: 48, y: 60, w: 354, h: 150 }
const SCALE = 0.108
const BASELINE = 185

/** a CSS cubic-bezier() timing function, as a function of progress */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const X = (t: number) => ((ax * t + bx) * t + cx) * t
  const Y = (t: number) => ((ay * t + by) * t + cy) * t
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    for (let i = 0; i < 40; i++) {
      const t = (lo + hi) / 2
      if (X(t) < x) lo = t
      else hi = t
    }
    return Y((lo + hi) / 2)
  }
}

type Pt = [x: number, y: number]
/** a path of absolute M, L, C and Z commands as a polyline, with the distance along it at each point */
function flatten(d: string) {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+/gi)!
  const pts: Pt[] = []
  const at: number[] = []
  let i = 0
  let cur: Pt = [0, 0]
  let start: Pt = [0, 0]
  let cmd = ''
  const num = () => +tok[i++]
  const push = (p: Pt, jump = false) => {
    const last = pts[pts.length - 1]
    at.push(!last || jump ? (at[at.length - 1] ?? 0) : at[at.length - 1] + Math.hypot(p[0] - last[0], p[1] - last[1]))
    pts.push(p)
  }
  while (i < tok.length) {
    if (/[a-z]/i.test(tok[i])) cmd = tok[i++].toUpperCase()
    if (cmd === 'M') {
      cur = start = [num(), num()]
      push(cur, true)
      cmd = 'L'
    } else if (cmd === 'L') {
      cur = [num(), num()]
      push(cur)
    } else if (cmd === 'C') {
      const [x0, y0] = cur
      const [x1, y1, x2, y2, x3, y3] = [num(), num(), num(), num(), num(), num()]
      for (let k = 1; k <= 48; k++) {
        const t = k / 48
        const u = 1 - t
        push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3])
      }
      cur = [x3, y3]
    } else if (cmd === 'Z') {
      cur = start
      push(cur)
      cmd = ''
    } else i++
  }
  return { pts, at, length: at[at.length - 1] }
}

/** a box around the points of a polyline between two distances along it, grown by `pad` */
function boxAlong({ pts, at }: ReturnType<typeof flatten>, from: number, to: number, pad: number): Box {
  const lerp = (s: number): Pt => {
    const k = Math.max(1, at.findIndex((a) => a >= s))
    const f = at[k] === at[k - 1] ? 0 : (s - at[k - 1]) / (at[k] - at[k - 1])
    return [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f]
  }
  const inside = pts.filter((_, k) => at[k] > from && at[k] < to)
  const all = [lerp(from), lerp(to), ...inside]
  const xs = all.map((p) => p[0])
  const ys = all.map((p) => p[1])
  return { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad }
}

/** a box in glyph units, placed at `x` in the word, as a box in the word's units */
const toWord = (b: Box, x: number) => ({
  x0: x + b.x0 * SCALE,
  x1: x + b.x1 * SCALE,
  y0: BASELINE - b.y1 * SCALE,
  y1: BASELINE - b.y0 * SCALE,
})
const r = (n: number) => Math.round(n * 100) / 100
type Box = { x0: number; y0: number; x1: number; y1: number }
const WORD: Box = { x0: VIEW.x, y0: VIEW.y, x1: VIEW.x + VIEW.w, y1: VIEW.y + VIEW.h }
/** absolutely placed inside `within` (both in the word's units), in % of it, showing that same part of the word */
function frame(b: Box, within: Box = WORD) {
  const x0 = Math.max(within.x0, b.x0)
  const y0 = Math.max(within.y0, b.y0)
  const x1 = Math.min(within.x1, b.x1)
  const y1 = Math.min(within.y1, b.y1)
  const w = within.x1 - within.x0
  const h = within.y1 - within.y0
  return {
    box: { x0, y0, x1, y1 },
    viewBox: `${r(x0)} ${r(y0)} ${r(x1 - x0)} ${r(y1 - y0)}`,
    style: {
      left: `${r(((x0 - within.x0) / w) * 100)}%`,
      top: `${r(((y0 - within.y0) / h) * 100)}%`,
      width: `${r(((x1 - x0) / w) * 100)}%`,
      height: `${r(((y1 - y0) / h) * 100)}%`,
    },
  }
}

type Piece = { stroke: number; from: number; to: number; delay: number; duration: number }

/** where and when every piece of every stroke is written, and when each letter is finished */
function plan(duration: number) {
  const pens = strokes.map(([, , , d]) => flatten(d))
  const lengths = pens.map((p) => p.length)
  // one average pen speed along the whole word (very short strokes get a minimum); lifts cost a fixed beat
  const sum = lengths.reduce((a, b) => a + b, 0)
  const writing = duration - INK_LAG - strokes.filter(([, , lift], i) => lift && i > 0).length * PEN_LIFT
  const weights = lengths.map((l) => Math.max(l, (MIN_STROKE / writing) * sum))
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let cursor = 0
  const pieces: Piece[] = []
  const done: Record<string, number> = {}
  strokes.forEach(([seg, , lift], i) => {
    if (lift && i > 0) cursor += PEN_LIFT
    const d = (weights[i] / totalWeight) * writing
    const joinsNext = strokes[i + 1] && !strokes[i + 1][2]
    const joinedPrev = i > 0 && !lift
    const ease = joinsNext ? EASE_IN : joinedPrev ? EASE_OUT : EASE_BOTH
    // cut evenly in time, so the pen's easing carries over into where each cut falls
    const n = Math.max(1, Math.round(d / PIECE_MS))
    for (let k = 0; k < n; k++) {
      pieces.push({ stroke: i, from: ease(k / n), to: ease((k + 1) / n), delay: cursor + (k * d) / n, duration: d / n })
    }
    cursor += d
    done[seg] = cursor
  })
  return { pens, pieces, done }
}

const glyphBoxes = Object.fromEntries(
  Object.entries(glyphs).map(([g, d]) => {
    const { pts } = flatten(d)
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    return [g, { x0: Math.min(...xs) - 4, y0: Math.min(...ys) - 4, x1: Math.max(...xs) + 4, y1: Math.max(...ys) + 4 }]
  }),
) as Record<keyof typeof glyphs, Box>

const ms = (n: number) => `${Math.round(n * 10) / 10}ms`
const t = (delay: number, duration?: number) =>
  ({ '--d': `calc(var(--sig-delay) + ${ms(delay)})`, ...(duration !== undefined && { '--t': ms(duration) }) }) as CSSProperties

type Props = { delay?: number; duration?: number; className?: string; replayable?: boolean }

export default function Signature({ delay = 400, duration = 1250, className, replayable = true }: Props) {
  const { pens, pieces, done } = plan(duration)
  const place = (x: number) => `translate(${x} ${BASELINE}) scale(${SCALE} ${-SCALE})`

  // each letter's outline, as a mask: the pieces inside are plain pen strokes, and the letter's edge
  // comes from this one shape rather than from every piece's own clip, so the pieces can't show seams
  const letters = Object.fromEntries(
    marks.map(([seg, g, x]) => {
      const f = frame(toWord(glyphBoxes[g], x))
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f.viewBox}" preserveAspectRatio="none"><path transform="${place(x)}" d="${glyphs[g]}"/></svg>`
      const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
      return [seg, { ...f, mask, x }]
    }),
  )

  const layer = (name: 'lead' | 'ink', lag: number) =>
    marks.map(([seg]) => {
      const { box, style, mask, x } = letters[seg]
      return (
        // the pieces of one letter, put away once its crisp outline is down
        <div
          key={`${name}-${seg}`}
          className={`sig-letter sig-${name}`}
          style={{ ...style, maskImage: mask, WebkitMaskImage: mask, ...t(done[seg] + INK_LAG + SETTLE_MS) }}
        >
          {pieces.map((p, k) => {
            const [s, width] = strokes[p.stroke]
            if (s !== seg) return null
            const L = pens[p.stroke].length
            const f = frame(toWord(boxAlong(pens[p.stroke], p.from * L, p.to * L, width / 2 + 6), x), box)
            return (
              <svg key={k} className="sig-piece" viewBox={f.viewBox} preserveAspectRatio="none" style={{ ...f.style, ...t(p.delay + lag, p.duration) }} aria-hidden>
                <use
                  href={`#sig-stroke-${p.stroke}`}
                  transform={place(x)}
                  strokeDasharray={`${r((p.to - p.from) * 1000)} 2000`}
                  strokeDashoffset={r(-p.from * 1000)}
                />
              </svg>
            )
          })}
        </div>
      )
    })

  const body = (
    <>
      <svg className="sig-defs" aria-hidden>
        <defs>
          {strokes.map(([, width, , d], i) => (
            <path key={i} id={`sig-stroke-${i}`} d={d} pathLength={1000} strokeWidth={width} />
          ))}
        </defs>
      </svg>
      {layer('lead', 0)}
      {layer('ink', INK_LAG)}
      {/* each letter, once written, as one crisp outline */}
      {marks.map(([seg, g, x]) => {
        const f = frame(toWord(glyphBoxes[g], x))
        return (
          <svg key={seg} className="sig-glyph" viewBox={f.viewBox} preserveAspectRatio="none" style={{ ...f.style, ...t(done[seg] + INK_LAG, SETTLE_MS) }} aria-hidden>
            <path d={glyphs[g]} transform={place(x)} />
          </svg>
        )
      })}
    </>
  )

  return (
    <SignatureReplay className={`signature ${className ?? ''}`} delay={delay} duration={duration} replayable={replayable}>
      {body}
    </SignatureReplay>
  )
}
