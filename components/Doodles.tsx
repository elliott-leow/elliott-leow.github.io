'use client'

/*
 * Hand-drawn marks. Every path here was drawn to wobble a little, and every one
 * can draw itself the first time it scrolls into view (once, never again).
 */
import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { penEase } from '@/lib/motion'
import Wipe from './Wipe'

type Ink = 'ink' | 'blue' | 'red' | 'pencil' | 'faded'
const inkVar: Record<Ink, string> = {
  ink: 'var(--ink)',
  blue: 'var(--blue-pen)',
  red: 'var(--red-pen)',
  pencil: 'var(--pencil)',
  faded: 'var(--faded-ink)',
}

type Base = {
  width?: number
  rotation?: number
  ink?: Ink
  delay?: number
  duration?: number
  strokeWidth?: number
  /** draw on mount instead of when scrolled into view */
  immediate?: boolean
  className?: string
  style?: CSSProperties
}

function Stroke({
  d,
  i = 0,
  delay = 0,
  duration = 0.5,
  immediate,
}: {
  d: string
  i?: number
  delay?: number
  duration?: number
  immediate?: boolean
}) {
  const reduce = useReducedMotion()
  if (reduce) return <path d={d} />
  const t = { pathLength: { delay: delay + i * duration * 0.85, duration, ease: penEase }, opacity: { delay: delay + i * duration * 0.85, duration: 0.01 } }
  // note: no vector-effect here. Chrome gets pathLength dashes wrong with non-scaling-stroke
  const common = { d, initial: { pathLength: 0, opacity: 0 }, transition: t }
  return immediate ? (
    <motion.path {...common} animate={{ pathLength: 1, opacity: 1 }} />
  ) : (
    <motion.path {...common} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true, margin: '0px 0px -12% 0px' }} />
  )
}

function Svg({
  viewBox,
  width,
  rotation = 0,
  ink = 'ink',
  strokeWidth = 2,
  className,
  style,
  children,
  label,
  stretch,
}: Base & { viewBox: string; children: ReactNode; label?: string; stretch?: boolean }) {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={stretch ? 'none' : undefined}
      width={width}
      className={`doodle ${className ?? ''}`}
      style={{ ...style, rotate: `${rotation}deg`, color: inkVar[ink] }}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {children}
    </svg>
  )
}

/* -------------------------------------------------------------- arrows */

const arrowPaths = {
  // shaft, then the two strokes of the head
  'curve-down-right': ['M6 8 C 14 34, 34 52, 70 58', 'M56 48 C 62 53, 67 56, 71 58', 'M71 58 C 66 60, 60 63, 56 68'],
  'curve-down-left': ['M70 6 C 64 30, 44 50, 10 58', 'M24 48 C 18 52, 13 55, 9 58', 'M9 58 C 14 61, 19 64, 23 68'],
  'curve-up-right': ['M6 62 C 20 40, 40 20, 72 12', 'M58 6 C 64 9, 69 11, 73 12', 'M73 12 C 69 16, 66 21, 64 26'],
  right: ['M4 22 C 24 19, 48 24, 84 20', 'M72 11 C 77 15, 81 18, 85 20', 'M85 20 C 80 23, 76 27, 72 31'],
  left: ['M86 20 C 66 23, 42 18, 6 22', 'M18 11 C 13 15, 9 18, 5 22', 'M5 22 C 10 25, 14 28, 18 32'],
  down: ['M22 4 C 19 22, 24 40, 21 70', 'M12 58 C 15 63, 18 67, 21 71', 'M21 71 C 24 66, 27 62, 31 58'],
  up: ['M22 72 C 25 52, 20 32, 23 6', 'M13 18 C 16 13, 19 9, 23 5', 'M23 5 C 26 10, 29 14, 33 18'],
  loop: ['M4 50 C 20 50, 34 44, 38 30 C 42 16, 26 12, 24 24 C 22 38, 48 48, 86 36', 'M74 30 C 79 32, 83 34, 87 36', 'M87 36 C 82 39, 78 42, 75 47'],
  'long-right': ['M4 24 C 60 18, 120 28, 176 20', 'M163 11 C 168 15, 173 18, 177 20', 'M177 20 C 172 23, 167 27, 163 31'],
} as const
const arrowBox: Record<keyof typeof arrowPaths, string> = {
  'curve-down-right': '0 0 80 74',
  'curve-down-left': '0 0 80 74',
  'curve-up-right': '0 0 80 70',
  right: '0 0 90 40',
  left: '0 0 90 40',
  down: '0 0 44 76',
  up: '0 0 44 76',
  loop: '0 0 92 56',
  'long-right': '0 0 180 40',
}

export function DoodleArrow({ variant = 'right', ...p }: Base & { variant?: keyof typeof arrowPaths }) {
  const dur = p.duration ?? 0.32
  return (
    <Svg viewBox={arrowBox[variant]} width={p.width ?? 70} {...p}>
      {arrowPaths[variant].map((d, i) => (
        <Stroke key={i} d={d} i={i === 0 ? 0 : 1 + (i - 1) * 0.35} delay={p.delay} duration={i === 0 ? dur : dur * 0.4} immediate={p.immediate} />
      ))}
    </Svg>
  )
}

/* -------------------------------------------------------------- circle */

export function DoodleCircle(p: Base & { height?: number }) {
  return (
    <Svg viewBox="0 0 160 64" width={p.width ?? 140} stretch {...p} style={{ ...p.style, height: p.height }}>
      <Stroke
        d="M28 12 C 62 0, 124 2, 146 20 C 162 34, 132 58, 80 60 C 34 62, 4 50, 6 32 C 8 16, 40 6, 72 5 C 92 4, 108 7, 118 11"
        delay={p.delay}
        duration={p.duration ?? 0.6}
        immediate={p.immediate}
      />
    </Svg>
  )
}

/* -------------------------------------------------------------- underline */

const underlines = [
  'M3 9 C 30 5, 58 10, 90 7 S 136 4, 157 8',
  'M2 7 C 40 10, 80 4, 120 8 C 134 9, 146 7, 158 5',
  'M4 8 C 50 4, 100 11, 156 6 M 20 13 C 60 10, 110 14, 140 11',
]
/** an underline is near enough level that sweeping it in reads as drawing it, and a sweep runs on the GPU */
export function DoodleUnderline({ variant = 0, ...p }: Base & { variant?: 0 | 1 | 2 }) {
  return (
    <Wipe
      className={`doodle-wipe ${p.className ?? ''}`}
      style={{ ...p.style, rotate: p.rotation ? `${p.rotation}deg` : undefined }}
      delay={p.delay}
      duration={p.duration ?? 0.42}
    >
      <Svg viewBox="0 0 160 16" width={p.width ?? 140} strokeWidth={p.strokeWidth ?? 2.2} stretch ink={p.ink}>
        <path d={underlines[variant]} />
      </Svg>
    </Wipe>
  )
}

/* -------------------------------------------------------------- star */

export function DoodleStar(p: Base) {
  return (
    <Svg viewBox="0 0 48 48" width={p.width ?? 26} {...p}>
      <Stroke d="M24 4 L 30 42 L 5 17 L 44 18 L 16 44 Z" delay={p.delay} duration={p.duration ?? 0.55} immediate={p.immediate} />
    </Svg>
  )
}

/* -------------------------------------------------------------- inline marks */

/** a word written, then crossed out. hover and it becomes readable again. */
export function CrossOut({ children, ink = 'red', delay = 0 }: { children: ReactNode; ink?: Ink; delay?: number }) {
  const reduce = useReducedMotion()
  const line = (k: number) =>
    reduce ? (
      <span className={`crossout-line crossout-line--${k}`} />
    ) : (
      <motion.span
        className={`crossout-line crossout-line--${k}`}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
        viewport={{ once: true }}
        transition={{ delay: delay + k * 0.28, duration: 0.32, ease: penEase }}
      />
    )
  return (
    <span className="crossout" tabIndex={0} style={{ ['--x-ink' as string]: inkVar[ink] }}>
      <span className="crossout-text">{children}</span>
      <span className="crossout-mark" aria-hidden>
        {line(0)}
        {line(1)}
      </span>
    </span>
  )
}

/** a highlighter swipe that lays itself down once */
export function Highlight({ children, delay = 0, tone = 'yellow' }: { children: ReactNode; delay?: number; tone?: 'yellow' | 'pink' | 'green' }) {
  const reduce = useReducedMotion()
  return (
    <span className={`highlight highlight--${tone}`}>
      <motion.span
        className="highlight-ink"
        aria-hidden
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '0px 0px -15% 0px' }}
        transition={{ delay, duration: 0.5, ease: [0.3, 0.1, 0.3, 1] }}
      />
      <span className="highlight-text">{children}</span>
    </span>
  )
}

/** an underline drawn under a phrase in the flow of text */
export function Underlined({ children, ink = 'blue', variant = 0, delay = 0 }: { children: ReactNode; ink?: Ink; variant?: 0 | 1 | 2; delay?: number }) {
  return (
    <span className="underlined">
      {children}
      <DoodleUnderline className="underlined-mark" ink={ink} variant={variant} delay={delay} width={undefined} />
    </span>
  )
}

/** a word with a pen circle around it */
export function Circled({ children, ink = 'red', delay = 0 }: { children: ReactNode; ink?: Ink; delay?: number }) {
  return (
    <span className="circled">
      {children}
      <DoodleCircle className="circled-mark" ink={ink} delay={delay} width={undefined} strokeWidth={1.8} />
    </span>
  )
}
