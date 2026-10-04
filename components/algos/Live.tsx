'use client'

/* what the one-button data-structure figures share: an operation is a short list of frames that plays by itself, on a stage that is as wide as the structure needs and scrolls to where the action is. nodes and edges slide between frames */
import { motion, useReducedMotion } from 'motion/react'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Btn, Seg, r1 } from './kit'

export type Speed = 'slow' | 'normal' | 'fast'
/** how long a frame stays up, and how long things take to slide there */
const HOLD: Record<Speed, number> = { slow: 1700, normal: 950, fast: 380 }
const SLIDE: Record<Speed, number> = { slow: 0.7, normal: 0.5, fast: 0.24 }

/** plays a list of frames one after another. `end` is where the operation finishes, so the next one can start before this one is done playing */
export function useFrames<F>(first: F, speed: Speed) {
  const [st, setSt] = useState<{ frames: F[]; i: number }>({ frames: [first], i: 0 })
  useEffect(() => {
    if (st.i >= st.frames.length - 1) return
    const t = setTimeout(() => setSt((s) => (s.frames === st.frames ? { frames: s.frames, i: s.i + 1 } : s)), HOLD[speed])
    return () => clearTimeout(t)
  }, [st, speed])
  return {
    frame: st.frames[st.i],
    end: st.frames[st.frames.length - 1],
    step: st.i + 1,
    steps: st.frames.length,
    play: (frames: F[]) => setSt({ frames, i: 0 }),
  }
}

/** the last few operations, numbered from the start of the run */
export type Entry = { n: number; text: string }
export function useLog() {
  const [log, setLog] = useState<Entry[]>([])
  const count = log.length ? log[log.length - 1].n : 0
  return { log, count, add: (text: string) => setLog((l) => [...l.slice(-5), { n: (l.length ? l[l.length - 1].n : 0) + 1, text }]), clear: () => setLog([]) }
}
export function OpLog({ log }: { log: Entry[] }) {
  if (!log.length) return null
  return (
    <div className="algo-log" role="log" aria-label="the last operations, newest first">
      {log
        .slice()
        .reverse()
        .map((e) => (
          <div key={e.n}>
            <b>#{e.n}</b> {e.text}
          </div>
        ))}
    </div>
  )
}

/** the one button. it sits above the drawing so that it stays put while the structure grows */
export function Run({ onGo, onReset, count }: { onGo: () => void; onReset: () => void; count: number }) {
  return (
    <div className="orb-controls algo-run">
      <span className="algo-go">
        <Btn onClick={onGo}>▶ random operation{count ? ` (#${count + 1})` : ''}</Btn>
      </span>
      <Btn onClick={onReset}>start over</Btn>
    </div>
  )
}

/** what the step on screen is doing, with a dot per step of the operation */
export function Narr({ step, steps, children }: { step: number; steps: number; children: ReactNode }) {
  return (
    <p className="algo-narr hand" aria-live="polite">
      {steps > 1 && (
        <span className="algo-stepof" aria-label={`step ${step} of ${steps}`}>
          {Array.from({ length: steps }, (_, i) => (
            <i key={i} className={i < step ? 'is-on' : ''} />
          ))}
        </span>
      )}
      {children}
    </p>
  )
}

/** the two settings every one of these figures has */
export function Pace({ speed, setSpeed, fit, setFit }: { speed: Speed; setSpeed: (s: Speed) => void; fit: boolean; setFit: (f: boolean) => void }) {
  return (
    <>
      <Seg label="speed" value={speed} onChange={setSpeed} options={[{ k: 'slow', label: 'slow' }, { k: 'normal', label: 'normal' }, { k: 'fast', label: 'fast' }]} />
      <Seg label="view" value={fit ? 'fit' : 'follow'} onChange={(v) => setFit(v === 'fit')} options={[{ k: 'follow', label: 'follow the action' }, { k: 'fit', label: 'whole thing' }]} />
    </>
  )
}

/** pick one of the allowed kinds, by weight */
export function draw<K extends string>(kinds: { k: K; w: number; ok: boolean }[]): K | null {
  const can = kinds.filter((x) => x.ok && x.w > 0)
  let u = Math.random() * can.reduce((s, x) => s + x.w, 0)
  for (const x of can) if ((u -= x.w) < 0) return x.k
  return can.length ? can[can.length - 1].k : null
}
export const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
/** a number in lo..hi that is not taken (null when all are) */
export function freshKey(taken: Iterable<number>, lo: number, hi: number): number | null {
  const used = new Set(taken)
  const free: number[] = []
  for (let v = lo; v <= hi; v++) if (!used.has(v)) free.push(v)
  return free.length ? free[randInt(0, free.length - 1)] : null
}

/* ------------------------------------------------------------------ the stage */

const Tempo = createContext(0.5)
const useTween = () => ({ duration: useContext(Tempo), ease: 'easeInOut' as const })

/** an svg drawn one unit to one pixel, so a structure that grows gets wider instead of smaller. it scrolls sideways by itself to keep `focus` in view */
export function Stage({ w, h, focus, fit, speed, label, children }: { w: number; h: number; focus?: number; fit: boolean; speed: Speed; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const W = Math.ceil(Math.max(w, 320))
  const H = Math.ceil(h)
  useEffect(() => {
    const el = ref.current
    if (!el || fit || focus === undefined) return
    el.scrollTo({ left: focus - el.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' })
  }, [focus, fit, W, reduce])
  return (
    <Tempo.Provider value={reduce ? 0 : SLIDE[speed]}>
      <div className="algo-scroll algo-stage" ref={ref} tabIndex={0} role="group" aria-label={`${label}, scrolls sideways`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="orb-svg" style={fit ? { maxHeight: '70vh' } : { width: W, maxWidth: 'none', margin: '0 auto' }} role="img" aria-label={label}>
          {children}
        </svg>
      </div>
    </Tempo.Provider>
  )
}

/** a line whose ends slide to wherever they are now */
export function Edge({ x1, y1, x2, y2, stroke = 'var(--pencil)', w = 1.3 }: { x1: number; y1: number; x2: number; y2: number; stroke?: string; w?: number }) {
  const transition = useTween()
  return <motion.line className="algo-fade" initial={false} animate={{ x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2) }} transition={transition} stroke={stroke} strokeWidth={w} strokeLinecap="round" style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }} />
}

export type Paint = { fill?: string; stroke?: string; sw?: number; ink?: string }
export const PAINT = {
  plain: { fill: 'var(--orb-paper)' },
  hot: { fill: 'rgba(238, 213, 111, 0.85)' },
  path: { fill: 'rgba(44, 70, 116, 0.2)', stroke: 'var(--blue-pen)', sw: 2.2 },
  good: { fill: 'rgba(79, 122, 63, 0.3)' },
  bad: { fill: 'rgba(192, 67, 45, 0.25)', stroke: 'var(--red-pen)', sw: 2.2 },
} satisfies Record<string, Paint>

/** a round node that slides to (x, y); a new one pops in */
export function Node({ x, y, r = 13, label, size = 12, paint = PAINT.plain, tag }: { x: number; y: number; r?: number; label: ReactNode; size?: number; paint?: Paint; tag?: ReactNode }) {
  const transition = useTween()
  return (
    <motion.g initial={false} animate={{ x: r1(x), y: r1(y) }} transition={transition}>
      <g className="algo-pop">
        <circle r={r} fill="var(--orb-paper)" />
        <circle r={r} fill={paint.fill ?? 'var(--orb-paper)'} stroke={paint.stroke ?? 'var(--ink)'} strokeWidth={paint.sw ?? 1.4} style={{ transition: 'fill 0.3s, stroke 0.3s' }} />
        <text y={r1(size * 0.34)} textAnchor="middle" fontSize={size} className="orb-t" fill={paint.ink ?? 'var(--ink)'}>
          {label}
        </text>
        {tag !== undefined && (
          <text x={r + 3} y={-r + 3} fontSize={10.5} className="orb-t" fill="var(--blue-pen)">
            {tag}
          </text>
        )}
      </g>
    </motion.g>
  )
}

/** a square cell (one key of a B-tree node) that slides to (x, y), its top left corner */
export function Tile({ x, y, w, h = 26, label, size = 12, paint = PAINT.plain }: { x: number; y: number; w: number; h?: number; label: ReactNode; size?: number; paint?: Paint }) {
  const transition = useTween()
  return (
    <motion.g initial={false} animate={{ x: r1(x), y: r1(y) }} transition={transition}>
      <g className="algo-pop">
        <rect width={w} height={h} rx={3} fill="var(--orb-paper)" />
        <rect width={w} height={h} rx={3} fill={paint.fill ?? 'var(--orb-paper)'} stroke={paint.stroke ?? 'var(--ink)'} strokeWidth={paint.sw ?? 1.3} style={{ transition: 'fill 0.3s, stroke 0.3s' }} />
        <text x={w / 2} y={r1(h / 2 + size * 0.34)} textAnchor="middle" fontSize={size} className="orb-t" fill={paint.ink ?? 'var(--ink)'}>
          {label}
        </text>
      </g>
    </motion.g>
  )
}
