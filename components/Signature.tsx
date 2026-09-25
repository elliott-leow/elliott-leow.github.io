'use client'

/*
 * The signature from ../name_animation/index-v3.html: the name in Shantell Sans SemiBold
 * outlines, written in by a pen. Each letter is masked, and the mask is revealed by
 * a wide stroke running along the letter's centreline, in writing order. The pen keeps
 * one average speed across the word, eases in and out of each stroke, and pauses briefly
 * wherever it lifts. The "lead" layer runs 120ms ahead of the ink, which reads as wet ink
 * at the nib. Until the pen starts the masks are empty, so it never flashes in finished.
 */
import { useEffect, useId, useRef } from 'react'

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
const place = (x: number) => `translate(${x} 185) scale(0.108 -0.108)`

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
// a stroke that carries on without a lift keeps its speed through the join
const EASE_IN = 'cubic-bezier(.4,0,.7,.7)'
const EASE_OUT = 'cubic-bezier(.3,.3,.55,1)'
const EASE_BOTH = 'cubic-bezier(.4,0,.45,1)'

const layers = ['lead', 'ink'] as const

type Props = { delay?: number; duration?: number; className?: string; replayable?: boolean }

export default function Signature({ delay = 400, duration = 1250, className, replayable = true }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const play = useRef<() => void>(() => {})
  // ids for the masks and glyphs, unique to this signature and safe inside url(#…)
  const uid = `sig${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    const reveals = [...svg.querySelectorAll<SVGPathElement>('.sig-reveal')]
    const uses = [...svg.querySelectorAll<SVGUseElement>('.sig-mark')]
    const length = new Map(reveals.map((p) => [p, p.getTotalLength()]))
    let running: Animation[] = []
    let runId = 0

    // one average pen speed along the whole word (very short strokes get a minimum); lifts cost a fixed beat
    const lengths = strokes.map((_, i) => length.get(reveals.find((p) => p.dataset.layer === 'lead' && Number(p.dataset.stroke) === i)!)!)
    const sum = lengths.reduce((a, b) => a + b, 0)
    const writing = duration - INK_LAG - strokes.filter(([, , lift], i) => lift && i > 0).length * PEN_LIFT
    const weights = lengths.map((l) => Math.max(l, (MIN_STROKE / writing) * sum))
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let cursor = 0
    const timeline = strokes.map(([, , lift], i) => {
      if (lift && i > 0) cursor += PEN_LIFT
      const d = (weights[i] / totalWeight) * writing
      const joinsNext = strokes[i + 1] && !strokes[i + 1][2]
      const joinedPrev = i > 0 && !lift
      const t = { delay: cursor, duration: d, easing: joinsNext ? EASE_IN : joinedPrev ? EASE_OUT : EASE_BOTH }
      cursor += d
      return t
    })

    const mark = (layer: string, seg: string) => uses.find((u) => u.dataset.layer === layer && u.dataset.segment === seg)
    // once a letter's last stroke lands, drop its mask so the whole glyph shows crisply
    const unmask = (u?: SVGUseElement) => u?.removeAttribute('mask')
    const remask = () => uses.forEach((u) => u.setAttribute('mask', u.dataset.mask!))

    const settle = () => {
      running.forEach((a) => a.cancel())
      running = []
      uses.forEach(unmask)
    }

    const run = (startDelay: number) => {
      runId += 1
      const id = runId
      running.forEach((a) => a.cancel())
      running = []
      remask()
      if (reduce.matches) return settle()
      for (const p of reveals) {
        const i = Number(p.dataset.stroke)
        const t = timeline[i]
        const len = length.get(p)!
        const dash = `${len} ${len}`
        const a = p.animate(
          [
            { opacity: 1, strokeDasharray: dash, strokeDashoffset: `${len}` },
            { opacity: 1, strokeDasharray: dash, strokeDashoffset: '0' },
          ],
          { duration: t.duration, delay: startDelay + t.delay + (p.dataset.layer === 'ink' ? INK_LAG : 0), easing: t.easing, fill: 'forwards' },
        )
        running.push(a)
        const seg = strokes[i][0]
        if (strokes[i + 1]?.[0] !== seg) a.finished.then(() => id === runId && unmask(mark(p.dataset.layer!, seg))).catch(() => {})
      }
    }

    play.current = () => run(0)
    run(delay)
    return () => running.forEach((a) => a.cancel())
  }, [delay, duration])

  return (
    <svg
      ref={svgRef}
      className={`signature ${className ?? ''}`}
      // trimmed to the letters on the left and right, so the name lines up with the text under it
      viewBox="48 60 354 150"
      role="img"
      aria-label="Elliott."
      onClick={replayable ? () => play.current() : undefined}
      data-interactive={replayable || undefined}
    >
      <title>Elliott.</title>
      <defs>
        {Object.entries(glyphs).map(([g, d]) => (
          <path key={g} id={`${uid}-${g}`} d={d} />
        ))}
        {layers.map((layer) =>
          marks.map(([seg]) => (
            <mask key={`${layer}-${seg}`} id={`${uid}-${layer}-${seg}`} maskUnits="userSpaceOnUse" x={-500} y={-500} width={2000} height={2000}>
              {strokes.map(([s, width, , d], i) =>
                s === seg ? <path key={i} className="sig-reveal" data-layer={layer} data-stroke={i} d={d} strokeWidth={width} /> : null,
              )}
            </mask>
          )),
        )}
      </defs>
      {layers.map((layer) => (
        <g key={layer} className={`sig-layer sig-layer--${layer}`}>
          {marks.map(([seg, g, x]) => (
            <use
              key={seg}
              className="sig-mark"
              data-layer={layer}
              data-segment={seg}
              data-mask={`url(#${uid}-${layer}-${seg})`}
              mask={`url(#${uid}-${layer}-${seg})`}
              href={`#${uid}-${g}`}
              transform={place(x)}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}
