'use client'

/* drawing bits for the algorithm figures. the paper, buttons and sliders are the orgo note's; these add cells, boxes and a tiny line chart */
import { useState, type ReactNode } from 'react'
export { Fig, Btn, Seg, Slider, Meter, T } from '../orbitals/kit'

export const r1 = (x: number) => Math.round(x * 10) / 10

export type Tone = 'none' | 'blue' | 'red' | 'green' | 'yellow' | 'grey' | 'pink'
export const FILL: Record<Tone, string> = {
  none: 'var(--orb-paper)',
  blue: 'rgba(44, 70, 116, 0.2)',
  red: 'rgba(192, 67, 45, 0.2)',
  green: 'rgba(79, 122, 63, 0.26)',
  yellow: 'rgba(238, 213, 111, 0.6)',
  grey: 'rgba(31, 30, 28, 0.07)',
  pink: 'rgba(232, 150, 160, 0.4)',
}

export function Box({ x, y, w, h, label, tone = 'none', size = 14, bold, dashed, faint, onClick, title, sub, ring }: { x: number; y: number; w: number; h: number; label?: ReactNode; tone?: Tone; size?: number; bold?: boolean; dashed?: boolean; faint?: boolean; onClick?: () => void; title?: string; sub?: ReactNode; ring?: boolean }) {
  return (
    <g opacity={faint ? 0.35 : 1} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined} role={onClick ? 'button' : undefined} aria-label={title}>
      {title && <title>{title}</title>}
      <rect x={r1(x)} y={r1(y)} width={r1(w)} height={r1(h)} rx={3} fill={FILL[tone]} stroke={ring ? 'var(--red-pen)' : 'var(--ink)'} strokeWidth={ring ? 2.4 : 1.3} strokeDasharray={dashed ? '4 3' : undefined} />
      {label !== undefined && (
        <text x={r1(x + w / 2)} y={r1(y + h / 2 + size * 0.34 - (sub ? size * 0.3 : 0))} textAnchor="middle" fontSize={size} fontWeight={bold ? 700 : 400} className="orb-t" style={{ fontSize: `calc(${size}px * var(--orb-ts, 1))` }} fill="var(--ink)">
          {label}
        </text>
      )}
      {sub !== undefined && (
        <text x={r1(x + w / 2)} y={r1(y + h - 3)} textAnchor="middle" fontSize={9} className="orb-t" fill="var(--pencil)">
          {sub}
        </text>
      )}
    </g>
  )
}

/** a row of cells, left to right */
export function Cells({ items, x, y, cw, ch = 26, size = 13, gap = 0 }: { items: { label: ReactNode; tone?: Tone; bold?: boolean; faint?: boolean; ring?: boolean; dashed?: boolean; onClick?: () => void; title?: string; sub?: ReactNode }[]; x: number; y: number; cw: number; ch?: number; size?: number; gap?: number }) {
  return (
    <g>
      {items.map((it, i) => (
        <Box key={i} x={x + i * (cw + gap)} y={y} w={cw} h={ch} size={size} {...it} />
      ))}
    </g>
  )
}

export function Line({ x1, y1, x2, y2, tone = 'ink', w = 1.4, dash }: { x1: number; y1: number; x2: number; y2: number; tone?: 'ink' | 'red' | 'blue' | 'pencil' | 'green'; w?: number; dash?: string }) {
  const c = { ink: 'var(--ink)', red: 'var(--red-pen)', blue: 'var(--blue-pen)', pencil: 'var(--pencil)', green: 'var(--orb-hyb)' }[tone]
  return <line x1={r1(x1)} y1={r1(y1)} x2={r1(x2)} y2={r1(y2)} stroke={c} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />
}

/* ------------------------------------------------------------------ a tiny line chart */

export type Series = { label: string; color: 'blue' | 'red' | 'green' | 'ink' | 'pencil'; pts: [number, number][]; dash?: string }
const COL = { blue: 'var(--blue-pen)', red: 'var(--red-pen)', green: 'var(--orb-hyb)', ink: 'var(--ink)', pencil: 'var(--pencil)' }

export function Chart({ series, xLabel, yLabel, height = 200, yMin, yMax, xFmt, yFmt, hline, marker }: { series: Series[]; xLabel?: string; yLabel?: string; height?: number; yMin?: number; yMax?: number; xFmt?: (v: number) => string; yFmt?: (v: number) => string; hline?: number; marker?: number }) {
  const W = 560
  const H = height
  const L = 46
  const R = 12
  const Tp = 34
  const B = 30
  const all = series.flatMap((s) => s.pts).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
  if (!all.length) return <svg viewBox={`0 0 ${W} ${H}`} className="orb-svg" />
  const xs = all.map((p) => p[0])
  const ys = all.map((p) => p[1])
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const nice = (lo: number, hi: number) => {
    // a series that is flat up to rounding noise must not make the tick step vanish
    const span = hi - lo < 1e-9 * Math.max(1, Math.abs(lo), Math.abs(hi)) ? Math.max(1, Math.abs(hi)) : hi - lo
    const raw = span / 4
    const mag = Math.pow(10, Math.floor(Math.log10(raw)))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= raw) ?? mag * 10
    return { lo: Math.floor(lo / step + 1e-9) * step, hi: Math.ceil(hi / step - 1e-9) * step, step }
  }
  const ny = nice(yMin ?? Math.min(...ys), yMax ?? Math.max(...ys))
  const y0 = yMin ?? ny.lo
  const y1 = yMax ?? ny.hi
  const nx = nice(Math.min(...xs), Math.max(...xs))
  const sx = (v: number) => L + ((v - x0) / (x1 - x0 || 1)) * (W - L - R)
  const sy = (v: number) => H - B - ((Math.min(Math.max(v, y0), y1) - y0) / (y1 - y0 || 1)) * (H - B - Tp)
  const ticks = (a: number, b: number, step: number) => {
    const out: number[] = []
    for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + step * 1e-6 && out.length < 12; v += step) out.push(Math.round(v * 1e6) / 1e6)
    return out
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="orb-svg" role="img" aria-label={`chart: ${series.map((s) => s.label).join(', ')}`}>
      {ticks(y0, y1, ny.step).map((v, i) => (
        <g key={`y${i}`}>
          <line x1={L} x2={W - R} y1={r1(sy(v))} y2={r1(sy(v))} stroke="rgba(31,30,28,0.12)" strokeWidth={1} />
          <text x={L - 5} y={r1(sy(v) + 4)} textAnchor="end" fontSize={10.5} className="orb-t" fill="var(--pencil)">
            {(yFmt ?? fmt)(v)}
          </text>
        </g>
      ))}
      {ticks(x0, x1, nx.step).map((v, i) => (
        <text key={`x${i}`} x={r1(sx(v))} y={H - B + 14} textAnchor="middle" fontSize={10.5} className="orb-t" fill="var(--pencil)">
          {(xFmt ?? fmt)(v)}
        </text>
      ))}
      {hline !== undefined && <line x1={L} x2={W - R} y1={r1(sy(hline))} y2={r1(sy(hline))} stroke="var(--pencil)" strokeDasharray="5 4" />}
      {marker !== undefined && <line x1={r1(sx(marker))} x2={r1(sx(marker))} y1={Tp} y2={H - B} stroke="var(--red-pen)" strokeDasharray="3 3" />}
      {series.map((s, k) => (
        <g key={k}>
          <polyline points={s.pts.filter(([x, y]) => Number.isFinite(y)).map(([x, y]) => `${r1(sx(x))},${r1(sy(y))}`).join(' ')} fill="none" stroke={COL[s.color]} strokeWidth={2} strokeLinejoin="round" strokeDasharray={s.dash} />
        </g>
      ))}
      {xLabel && (
        <text x={W - R} y={H - 3} textAnchor="end" fontSize={11} className="orb-t" fill="var(--pencil)">
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={L + 4} y={Tp - 6} fontSize={11} className="orb-t" fill="var(--pencil)">
          {yLabel}
        </text>
      )}
      {series.map((s, k) => (
        <g key={`l${k}`}>
          <line x1={L + k * 170} x2={L + 18 + k * 170} y1={10} y2={10} stroke={COL[s.color]} strokeWidth={2} strokeDasharray={s.dash} />
          <text x={L + 23 + k * 170} y={14} fontSize={11} className="orb-t" fill={COL[s.color]}>
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
const fmt = (v: number) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 0.01 && v !== 0) ? v.toExponential(0) : String(Math.round(v * 100) / 100))

/** a number field that only takes digits */
export function Num({ label, value, onChange, min = 0, max = 999999 }: { label: ReactNode; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const [txt, setTxt] = useState(String(value))
  return (
    <label className="orb-slider hand">
      <span className="orb-slider-label">{label}</span>
      <input
        className="algo-num"
        inputMode="numeric"
        value={txt}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9]/g, '')
          setTxt(t)
          if (t !== '') onChange(Math.min(max, Math.max(min, +t)))
        }}
        aria-label={typeof label === 'string' ? label : undefined}
      />
    </label>
  )
}
export function Say({ children }: { children: ReactNode }) {
  return <span className="algo-say">{children}</span>
}
