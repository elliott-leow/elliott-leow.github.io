'use client'

/*
 * The drawing kit for the orbital figures. Everything is drawn the way you'd
 * draw it in a notebook: pen outlines, a light wash of colour inside, blue for
 * one phase and red for the other. Nothing here is random at render time
 * (the dots use a seeded generator) so the server and the browser draw the same thing.
 */
import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'

export const PH = {
  in: 'var(--orb-in)',
  out: 'var(--orb-out)',
  hyb: 'var(--orb-hyb)',
  empty: 'var(--faded-ink)',
} as const
export type Phase = keyof typeof PH
export const flip = (p: Phase): Phase => (p === 'in' ? 'out' : p === 'out' ? 'in' : p)

/* ------------------------------------------------------------------ shapes */

/** one lobe, a teardrop pointing up from the nucleus at (0, 0) */
export function lobeD(L: number, W: number) {
  return `M0 0 C ${W * 0.95} ${-L * 0.18}, ${W} ${-L * 0.92}, 0 ${-L} C ${-W} ${-L * 0.92}, ${-W * 0.95} ${-L * 0.18}, 0 0 Z`
}

type LobeProps = {
  x?: number
  y?: number
  /** degrees clockwise from straight up */
  angle?: number
  L?: number
  W?: number
  phase?: Phase
  fill?: number
  dashed?: boolean
  opacity?: number
  className?: string
  style?: CSSProperties
}

export function Lobe({ x = 0, y = 0, angle = 0, L = 80, W = 36, phase = 'in', fill = 0.2, dashed, opacity = 1, className, style }: LobeProps) {
  const c = PH[phase]
  return (
    <path
      d={lobeD(L, W)}
      transform={`translate(${x} ${y}) rotate(${angle})`}
      fill={c}
      fillOpacity={fill}
      stroke={c}
      strokeWidth={1.8}
      strokeDasharray={dashed ? '5 5' : undefined}
      strokeLinejoin="round"
      opacity={opacity}
      className={className}
      style={style}
    />
  )
}

/** a whole p orbital: two lobes of opposite phase, one orbital */
export function POrb({ top = 'in', angle = 0, ...p }: LobeProps & { top?: Phase }) {
  return (
    <g>
      <Lobe {...p} angle={angle} phase={top} />
      <Lobe {...p} angle={angle + 180} phase={flip(top)} />
    </g>
  )
}

export function Atom({ x, y, label, r = 15, size = 19, faded, className }: { x: number; y: number; label: string; r?: number; size?: number; faded?: boolean; className?: string }) {
  return (
    <g className={className} opacity={faded ? 0.55 : 1}>
      <circle cx={x} cy={y} r={r} fill="var(--orb-paper)" stroke="var(--ink)" strokeWidth={1.6} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" className="orb-t" fontSize={size}>
        {label}
      </text>
    </g>
  )
}

export function Bond({ x1, y1, x2, y2, w = 2, dash, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; w?: number; dash?: string; opacity?: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} opacity={opacity} />
}

/** handwriting inside a figure */
export function T({ x, y, children, size = 18, anchor = 'middle', ink = 'pencil', rotate = 0, opacity = 1, className }: { x: number; y: number; children: ReactNode; size?: number; anchor?: 'start' | 'middle' | 'end'; ink?: 'pencil' | 'ink' | 'blue' | 'red' | 'green'; rotate?: number; opacity?: number; className?: string }) {
  const fill = { pencil: 'var(--pencil)', ink: 'var(--ink)', blue: 'var(--blue-pen)', red: 'var(--red-pen)', green: 'var(--orb-hyb)' }[ink]
  return (
    <text x={x} y={y} fontSize={size} style={{ fontSize: `calc(${size}px * var(--orb-ts, 1))` }} textAnchor={anchor} fill={fill} className={`orb-t ${className ?? ''}`} opacity={opacity} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      {children}
    </text>
  )
}

/* ------------------------------------------------------------------ electron clouds */

/** a seeded generator, so the dots are the same on the server and in the browser */
export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)
}

/** where an electron might be: a scatter of twinkling dots inside a lobe */
export function LobeDots({ x = 0, y = 0, angle = 0, L = 80, W = 36, n = 30, phase = 'in', seed = 1, opacity = 1 }: LobeProps & { n?: number; seed?: number }) {
  const r = rng(seed)
  const dots: { cx: number; cy: number; d: number }[] = []
  for (let i = 0; i < n; i++) {
    // most of the density sits in the fat part of the lobe
    const t = 0.15 + 0.8 * (0.5 + (r() + r() + r() - 1.5) / 3)
    const half = W * 0.72 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.7)
    dots.push({ cx: (r() * 2 - 1) * half, cy: -t * L * 0.96, d: r() * 2.4 })
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={opacity} fill={PH[phase]}>
      {dots.map((p, i) => (
        <circle key={i} cx={p.cx.toFixed(1)} cy={p.cy.toFixed(1)} r={1.7} className="orb-dot" style={{ animationDelay: `${-p.d}s` }} />
      ))}
    </g>
  )
}

/* ------------------------------------------------------------------ motion */

/** a number that springs toward its target. re-renders every frame while it moves. */
export function useSpringValue(target: number, stiffness = 170, damping = 20) {
  const reduce = useReducedMotion()
  const [v, setV] = useState(target)
  const st = useRef({ x: target, v: 0, raf: 0 })
  useEffect(() => {
    const s = st.current
    cancelAnimationFrame(s.raf)
    if (reduce) {
      s.x = target
      s.v = 0
      setV(target)
      return
    }
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      s.v += (-stiffness * (s.x - target) - damping * s.v) * dt
      s.x += s.v * dt
      if (Math.abs(s.x - target) < 1e-3 && Math.abs(s.v) < 1e-2) {
        s.x = target
        s.v = 0
        setV(target)
        return
      }
      setV(s.x)
      s.raf = requestAnimationFrame(step)
    }
    s.raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(s.raf)
  }, [target, reduce, stiffness, damping])
  return v
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** 0 → 1 over `ms` while `on`, straight back to 0 when it goes off */
export function useProgress(on: boolean, ms: number) {
  const reduce = useReducedMotion()
  const [p, setP] = useState(0)
  useEffect(() => {
    if (!on) {
      setP(0)
      return
    }
    if (reduce) {
      setP(1)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms)
      setP(easeInOut(t))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [on, ms, reduce])
  return p
}

/** seconds since mount, ticking every frame (only while `on`) */
export function useClock(on = true) {
  const reduce = useReducedMotion()
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!on || reduce) return
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      setT((now - t0) / 1000)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [on, reduce])
  return t
}

/** turns a pointer event into the svg's own coordinates */
export function svgPoint(svg: SVGSVGElement, e: { clientX: number; clientY: number }) {
  const m = svg.getScreenCTM()
  if (!m) return { x: 0, y: 0 }
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
  return { x: p.x, y: p.y }
}
export type SvgRef = RefObject<SVGSVGElement | null>

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t

/* ------------------------------------------------------------------ the paper around a figure */

export function Fig({ n, title, hint, children, controls, caption, tape = -3 }: { n: number; title: ReactNode; hint?: ReactNode; children: ReactNode; controls?: ReactNode; caption?: ReactNode; tape?: number }) {
  return (
    <figure className="orb-fig">
      <span className="orb-tape" style={{ rotate: `${tape}deg` }} aria-hidden />
      <div className="orb-head">
        <span className="orb-title hand">
          <span className="orb-num">fig. {n}</span> {title}
        </span>
        {hint && <span className="orb-hint hand">{hint}</span>}
      </div>
      <div className="orb-stage">{children}</div>
      {controls && <div className="orb-controls">{controls}</div>}
      {caption && <figcaption className="orb-cap hand">{caption}</figcaption>}
    </figure>
  )
}

export function Btn({ on, onClick, children, disabled, label }: { on?: boolean; onClick: () => void; children: ReactNode; disabled?: boolean; label?: string }) {
  return (
    <button type="button" className={`orb-btn hand ${on ? 'is-on' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={on} aria-label={label}>
      {children}
    </button>
  )
}

export function Seg<K extends string>({ value, options, onChange, label }: { value: K; options: { k: K; label: ReactNode }[]; onChange: (k: K) => void; label: string }) {
  return (
    <div className="orb-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.k} type="button" role="radio" aria-checked={value === o.k} className={`orb-btn hand ${value === o.k ? 'is-on' : ''}`} onClick={() => onChange(o.k)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: { label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => ReactNode }) {
  return (
    <label className="orb-slider hand">
      <span className="orb-slider-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      {format && <span className="orb-slider-val">{format(value)}</span>}
    </label>
  )
}

/** a bar filled in marker, for "how strong is the bond right now" */
export function Meter({ label, value, tone = 'blue', right }: { label: ReactNode; value: number; tone?: 'blue' | 'red' | 'green' | 'yellow'; right?: ReactNode }) {
  return (
    <div className="orb-meter hand">
      <span className="orb-meter-label">{label}</span>
      <span className="orb-meter-bar" aria-hidden>
        <span className={`orb-meter-fill orb-meter-fill--${tone}`} style={{ transform: `scaleX(${clamp(value, 0, 1)})` }} />
      </span>
      <span className="orb-meter-val">{right}</span>
    </div>
  )
}

/** a ring that breathes around something you can touch, until you touch it */
export function Pulse({ x, y, r = 22, show }: { x: number; y: number; r?: number; show: boolean }) {
  if (!show) return null
  return <circle cx={x} cy={y} r={r} className="orb-pulse" fill="none" stroke="var(--red-pen)" strokeWidth={1.6} pointerEvents="none" />
}

/** a curved mechanism arrow, drawn on in pen */
export function CurlyArrow({ d, head, show, delay = 0 }: { d: string; head: string; show: boolean; delay?: number }) {
  return (
    <g className={`orb-curly ${show ? 'is-on' : ''}`} style={{ '--cd': `${delay}s` } as CSSProperties} fill="none" stroke="var(--red-pen)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} pathLength={1} className="orb-curly-shaft" />
      <path d={head} pathLength={1} className="orb-curly-head" />
    </g>
  )
}
