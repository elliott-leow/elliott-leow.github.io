'use client'

/*
 * A photograph held onto the page with tape.
 * The tape doesn't move, so the photo can't either. What it can do is give:
 * pull on it and the untaped end stretches toward you and peels up off the page,
 * swinging a little about the tape. Let go and it springs back flat, wobbling
 * once as it settles. On touch screens a tap gives it a small tug instead, so
 * scrolling still works.
 */
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Photo as PhotoData, Tape as TapeData } from '@/lib/content'
import { settleSpring } from '@/lib/motion'

export function Tape({ t }: { t: TapeData }) {
  return (
    <span
      aria-hidden
      className={`tape tape--${t.tone ?? 'masking'}`}
      style={
        {
          left: `${t.x}%`,
          top: t.y,
          width: t.w,
          '--tape-rot': `${t.rot}deg`,
          '--tape-op': t.opacity ?? 0.7,
        } as CSSProperties
      }
    />
  )
}

type Props = {
  photo: PhotoData
  width: number
  className?: string
  style?: CSSProperties
  /** entrance: settle onto the page after this many seconds */
  settleDelay?: number
  priority?: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/** a springy give, with one wobble on the way back */
const give = { stiffness: 320, damping: 13, mass: 0.6 }

export default function Photo({ photo, width, className, style, settleDelay, priority }: Props) {
  const reduce = useReducedMotion()
  const [pulling, setPulling] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)

  const imgH = Math.round(width / photo.aspect)
  const pad = photo.variant === 'polaroid' ? { p: 12, b: 46 } : photo.variant === 'instant' ? { p: 9, b: 46 } : { p: 7, b: 7 }
  const W = width + pad.p * 2
  const H = imgH + pad.p + pad.b

  // the tape is the hinge. the photo gives in the direction away from it.
  const { ax, ay, ux, uy } = useMemo(() => {
    const pts = photo.tape.map((t) => ({ x: (t.x / 100) * W + t.w / 2 - 8, y: t.y + 10 }))
    const ax = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const ay = Math.max(0, pts.reduce((s, p) => s + p.y, 0) / pts.length)
    const dx = W / 2 - ax
    const dy = H / 2 - ay
    const len = Math.hypot(dx, dy) || 1
    return { ax, ay, ux: dx / len, uy: dy / len }
  }, [photo.tape, W, H])

  const pull = useSpring(0, give) // px, away from the tape
  const swing = useSpring(0, give) // px, sideways
  const lift = useSpring(0, { stiffness: 300, damping: 24 }) // hovering: the free end lifts a touch

  const peel = useTransform([pull, lift], ([p, l]: number[]) => p * 0.2 + l * 4)
  const rotateX = useTransform(peel, (k) => k * uy)
  const rotateY = useTransform(peel, (k) => -k * ux)
  const rotate = useTransform(swing, (s) => photo.rotation + clamp(s * 0.05, -6, 6))
  const scaleX = useTransform(pull, (p) => 1 + Math.max(0, p) * 0.0012 * Math.abs(ux))
  const scaleY = useTransform(pull, (p) => 1 + Math.max(0, p) * 0.0012 * Math.abs(uy))
  // the lifted end throws its shadow further from the page
  const sx = useTransform(peel, (k) => ux * k * 0.9)
  const sy = useTransform(peel, (k) => 2 + uy * k * 0.9)
  const blur = useTransform(peel, (k) => 5 + k * 1.6)
  const shadowA = useTransform(peel, (k) => 0.14 + Math.min(k, 20) * 0.006)
  const boxShadow = useMotionTemplate`${sx}px ${sy}px ${blur}px rgba(30, 25, 20, ${shadowA}), 0 1px 2px rgba(30, 25, 20, 0.1)`

  const release = () => {
    if (!start.current) return
    start.current = null
    setPulling(false)
    pull.set(0)
    swing.set(0)
  }
  const tug = () => {
    if (reduce) return
    pull.set(34)
    swing.set(10)
    window.setTimeout(() => {
      pull.set(0)
      swing.set(0)
    }, 160)
  }

  const settle = settleDelay !== undefined && !reduce
  return (
    <div className={`photo-slot ${className ?? ''} ${pulling ? 'is-pulled' : ''}`} style={{ ...style, width: W }}>
      <motion.figure
        className={`photo photo--${photo.variant}`}
        style={{ rotate }}
        initial={settle ? { opacity: 0, y: -30, scale: 1.08 } : false}
        animate={settle ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={settle ? { ...settleSpring, delay: settleDelay, opacity: { duration: 0.2, delay: settleDelay } } : undefined}
        onPointerEnter={(e) => e.pointerType === 'mouse' && !reduce && lift.set(1)}
        onPointerLeave={() => lift.set(0)}
        onPointerDown={(e) => {
          if (reduce) return
          if (e.pointerType === 'touch') return tug()
          e.currentTarget.setPointerCapture(e.pointerId)
          start.current = { x: e.clientX, y: e.clientY }
          setPulling(true)
        }}
        onPointerMove={(e) => {
          if (!start.current) return
          const dx = e.clientX - start.current.x
          const dy = e.clientY - start.current.y
          // pulling toward the tape does nothing: it's already flat against the page
          const along = dx * ux + dy * uy
          const across = dx * -uy + dy * ux
          // it gives less the further it's pulled
          pull.set(along > 0 ? 90 * (1 - Math.exp(-along / 110)) : 0)
          swing.set(60 * Math.tanh(across / 140))
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            tug()
          }
        }}
        tabIndex={0}
        aria-label={`${photo.alt}. ${photo.caption}.`}
      >
        <motion.div
          className="photo-card"
          style={{
            rotateX,
            rotateY,
            scaleX,
            scaleY,
            boxShadow,
            transformOrigin: `${ax}px ${ay}px`,
            padding: `${pad.p}px ${pad.p}px ${pad.b}px`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt=""
            width={width}
            height={imgH}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            style={{ width, height: imgH }}
          />
          {photo.variant !== 'print' && <figcaption className="photo-caption hand">{photo.caption}</figcaption>}
        </motion.div>
        {photo.variant === 'print' && <figcaption className="photo-caption photo-caption--below hand">{photo.caption}</figcaption>}
        {photo.tape.map((t, i) => (
          <motion.span
            key={i}
            className="tape-wrap"
            initial={settle ? { opacity: 0, scale: 0.85 } : false}
            animate={settle ? { opacity: 1, scale: 1 } : undefined}
            transition={settle ? { delay: (settleDelay ?? 0) + 0.28 + i * 0.12, duration: 0.18 } : undefined}
          >
            <Tape t={t} />
          </motion.span>
        ))}
      </motion.figure>
    </div>
  )
}
