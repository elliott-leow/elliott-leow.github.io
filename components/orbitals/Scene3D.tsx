'use client'

/*
 * A very small 3D sketchbook: atoms, bonds and lobes placed in space, turned
 * with the pointer, and drawn back to front so near things cover far things.
 * A lobe is round about its own axis, so seen from any angle its outline is
 * still a teardrop, just a shorter one, and end-on it becomes a blob.
 */
import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PH, lobeD, type Phase } from './kit'

export type V3 = [number, number, number]
export type Item =
  | { k: 'atom'; p: V3; label: string; r?: number; tag?: string; tagInk?: 'blue' | 'red' | 'green' | 'pencil' }
  | { k: 'bond'; a: V3; b: V3; w?: number; dash?: string; opacity?: number }
  | { k: 'lobe'; o: V3; d: V3; L: number; W: number; phase: Phase; fill?: number; dashed?: boolean; opacity?: number }
  | { k: 'band'; a: V3; b: V3; w: number; phase: Phase; opacity: number }

export type View = { yaw: number; pitch: number; n: number }

const S = 104 // px per ångström-ish unit
const F = 9 // how far the eye is, in the same units

function rot([x, y, z]: V3, yaw: number, pitch: number): V3 {
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw)
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw)
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch)
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch)
  return [x1, y2, z2]
}

export default function Scene3D({
  items,
  width = 560,
  height = 300,
  view,
  spin = true,
  label,
  onGrab,
  children,
}: {
  items: Item[]
  width?: number
  height?: number
  /** change `n` to fly the camera to a new yaw and pitch */
  view: View
  spin?: boolean
  label: string
  onGrab?: () => void
  children?: ReactNode
}) {
  const reduce = useReducedMotion()
  const [cam, setCam] = useState({ yaw: view.yaw, pitch: view.pitch })
  const camRef = useRef(cam)
  camRef.current = cam
  const grabbed = useRef(false)
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null)
  const flying = useRef(false)

  // fly to a new view
  useEffect(() => {
    const from = camRef.current
    if (reduce) {
      setCam({ yaw: view.yaw, pitch: view.pitch })
      return
    }
    // go the short way round
    let dy = (view.yaw - from.yaw) % (Math.PI * 2)
    if (dy > Math.PI) dy -= Math.PI * 2
    if (dy < -Math.PI) dy += Math.PI * 2
    const dp = view.pitch - from.pitch
    let raf = 0
    const t0 = performance.now()
    flying.current = true
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 750)
      const e = 1 - Math.pow(1 - t, 3)
      setCam({ yaw: from.yaw + dy * e, pitch: from.pitch + dp * e })
      if (t < 1) raf = requestAnimationFrame(step)
      else flying.current = false
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      flying.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.n])

  // a slow idle turn, so it's obviously 3D, until someone takes hold of it
  useEffect(() => {
    if (!spin || reduce) return
    let raf = 0
    let last = performance.now()
    const step = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (!grabbed.current && !flying.current) setCam((c) => ({ ...c, yaw: c.yaw + dt * 0.35 }))
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [spin, reduce])

  const cx = width / 2
  const cy = height / 2
  const proj = (p: V3) => {
    const [x, y, z] = rot(p, cam.yaw, cam.pitch)
    const k = F / (F - z)
    return { x: cx + x * S * k, y: cy - y * S * k, z, k }
  }

  type Drawn = { z: number; el: ReactNode }
  const drawn: Drawn[] = items.map((it, i) => {
    if (it.k === 'atom') {
      const p = proj(it.p)
      const r = (it.r ?? 15) * p.k
      return {
        z: p.z + 0.001,
        el: (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={r} fill="var(--orb-paper)" stroke="var(--ink)" strokeWidth={1.6} />
            <text x={p.x} y={p.y + r * 0.42} fontSize={r * 1.15} textAnchor="middle" className="orb-t">
              {it.label}
            </text>
          </g>
        ),
      }
    }
    if (it.k === 'bond' || it.k === 'band') {
      const a = proj(it.a)
      const b = proj(it.b)
      const band = it.k === 'band'
      return {
        // a π cloud sits behind the atoms and lobes it joins
        z: band ? Math.min(a.z, b.z) - 0.6 : (a.z + b.z) / 2 - 0.02,
        el: (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={band ? PH[it.phase] : 'var(--ink)'}
            strokeWidth={band ? it.w * ((a.k + b.k) / 2) : (it.w ?? 2.2)}
            strokeLinecap="round"
            strokeDasharray={band ? undefined : it.dash}
            opacity={band ? it.opacity : (it.opacity ?? 1)}
          />
        ),
      }
    }
    // a lobe
    const o = proj(it.o)
    const [dx, dy, dz] = rot(it.d, cam.yaw, cam.pitch)
    const len = Math.hypot(dx, dy)
    const L = Math.max(it.L * len, it.W * 0.95) * o.k
    const W = it.W * o.k
    const ang = (Math.atan2(dx, dy) * 180) / Math.PI
    const c = PH[it.phase]
    return {
      z: o.z + dz * 0.5,
      el: (
        <path
          key={i}
          d={lobeD(L, W)}
          transform={`translate(${o.x} ${o.y}) rotate(${ang})`}
          fill={c}
          fillOpacity={it.fill ?? 0.2}
          stroke={c}
          strokeWidth={1.7}
          strokeDasharray={it.dashed ? '5 5' : undefined}
          strokeLinejoin="round"
          opacity={it.opacity ?? 1}
        />
      ),
    }
  })
  drawn.sort((a, b) => a.z - b.z)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="orb-svg orb-3d"
      role="img"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch }
        grabbed.current = true
        onGrab?.()
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        setCam({
          yaw: d.yaw + (e.clientX - d.x) * 0.012,
          pitch: Math.max(-1.3, Math.min(1.3, d.pitch + (e.clientY - d.y) * 0.012)),
        })
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      {drawn.map((d) => d.el)}
      {/* tags (like sp²) run along the bottom, under their atoms, so nothing covers them */}
      {(() => {
        const placed: number[] = []
        return items.map((it, i) => {
          if (it.k !== 'atom' || !it.tag) return null
          const x = proj(it.p).x
          // when atoms line up one behind another, only the first tag is written
          if (placed.some((p) => Math.abs(p - x) < 34)) return null
          placed.push(x)
          return (
            <text key={`tag${i}`} x={x} y={height - 12} fontSize={18} style={{ fontSize: 'calc(18px * var(--orb-ts, 1))' }} textAnchor="middle" className={`orb-t orb-t--${it.tagInk ?? 'pencil'}`}>
              {it.tag}
            </text>
          )
        })
      })()}
      {children}
    </svg>
  )
}
