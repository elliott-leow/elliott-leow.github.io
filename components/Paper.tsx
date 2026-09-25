'use client'

/*
 * Things that are made of paper and sit on the page. They are deliberately not
 * one "Card" with variants: a sticky note, an index card and a torn scrap are
 * different objects and behave differently.
 */
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { paperSpring, penEase } from '@/lib/motion'
import { Tape } from './Photo'
import type { Tape as TapeData } from '@/lib/content'

type Pos = { rotation?: number; className?: string; style?: CSSProperties }

/* ---------------------------------------------------------------- depth */

/** moves at a slightly different speed from the page while scrolling. very slightly. */
export function Depth({ speed = 0.97, children, className, style }: { speed?: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, (p) => (reduce ? 0 : (p - 0.5) * 900 * (1 - speed)))
  return (
    <motion.div ref={ref} className={className} style={{ ...style, y }}>
      {children}
    </motion.div>
  )
}

/* ---------------------------------------------------------------- handwriting */

/** handwriting that gets written left to right the first time you see it */
/**
 * The visibility check watches the unclipped outer element; only the inner span is
 * clipped. (An element clipped to zero width can't be relied on to report itself
 * as visible to IntersectionObserver.)
 */
export function Hand({
  as: Tag = 'span',
  children,
  className,
  style,
  delay = 0,
  duration = 0.6,
  write = true,
  rotation,
  ink,
}: {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div' | 'li'
  children: ReactNode
  className?: string
  style?: CSSProperties
  delay?: number
  duration?: number
  write?: boolean
  rotation?: number
  ink?: 'blue' | 'red' | 'pencil' | 'ink'
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const seen = useInView(ref, { once: true, margin: '0px 0px -6% 0px' })
  const s: CSSProperties = { ...style, rotate: rotation ? `${rotation}deg` : undefined }
  const cls = `hand ${ink ? `ink-${ink}` : ''} ${className ?? ''}`
  const T = Tag as ElementType
  if (!write || reduce) return <T className={cls} style={s}>{children}</T>
  return (
    <T ref={ref} className={cls} style={s}>
      <motion.span
        className="hand-write"
        initial={{ clipPath: 'inset(-20% 100% -30% -2%)' }}
        animate={seen ? { clipPath: 'inset(-20% -4% -30% -2%)' } : undefined}
        transition={{ delay, duration, ease: penEase }}
      >
        {children}
      </motion.span>
    </T>
  )
}

/* ---------------------------------------------------------------- sticky note */

export function StickyNote({
  front,
  children,
  rotation = -2,
  tone = 'yellow',
  className,
  style,
}: Pos & { front: ReactNode; children?: ReactNode; tone?: 'yellow' | 'pink' | 'blue' | 'green' }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const expandable = !!children
  const toggle = () => setOpen((o) => !o)
  return (
    <motion.div
      className={`sticky sticky--${tone} ${open ? 'is-open' : ''} ${expandable ? 'is-expandable' : ''} ${className ?? ''}`}
      style={{ ...style, rotate: rotation }}
      layout={!reduce}
      transition={paperSpring}
      whileHover={reduce ? undefined : { rotate: rotation * 0.6, y: -2 }}
      // the whole note folds and unfolds, not just its front. links inside still work.
      onClick={expandable ? (e) => !(e.target as HTMLElement).closest('a') && toggle() : undefined}
    >
      {expandable ? (
        // the click bubbles up to the note; this button is here for keyboards and screen readers
        <button type="button" className="sticky-hit" aria-expanded={open}>
          <motion.span layout="position" className="sticky-front hand">
            {front}
          </motion.span>
          {!open && <span className="sticky-more hand" aria-hidden>(unfold ↓)</span>}
        </button>
      ) : (
        <div className="sticky-front hand">{front}</div>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="sticky-inside"
            initial={reduce ? false : { opacity: 0, rotateX: -80 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={reduce ? undefined : { opacity: 0, rotateX: -80, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: penEase }}
          >
            <div className="sticky-fold" aria-hidden />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ---------------------------------------------------------------- index card */

export function IndexCard({ children, rotation = 1, className, style, tape, as: Tag = 'div' }: Pos & { children: ReactNode; tape?: TapeData[]; as?: ElementType }) {
  return (
    <Tag className={`index-card ${className ?? ''}`} style={{ ...style, rotate: `${rotation}deg` }}>
      {tape?.map((t, i) => <Tape key={i} t={t} />)}
      {children}
    </Tag>
  )
}

/* ---------------------------------------------------------------- loose / torn paper */

export function LoosePaper({
  children,
  rotation = -1,
  className,
  style,
  kind = 'torn',
  tape,
  clip,
}: Pos & { children: ReactNode; kind?: 'torn' | 'graph' | 'printout' | 'lined' | 'kraft'; tape?: TapeData[]; clip?: 'left' | 'right' }) {
  return (
    <div className={`loose loose--${kind} ${className ?? ''}`} style={{ ...style, rotate: `${rotation}deg` }}>
      {tape?.map((t, i) => <Tape key={i} t={t} />)}
      {clip && <PaperClip side={clip} />}
      {children}
    </div>
  )
}

export function PaperClip({ side = 'left' }: { side?: 'left' | 'right' }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`paperclip paperclip--${side}`} src="/textures/paperclip.webp" alt="" aria-hidden />
}

/* ---------------------------------------------------------------- a sketch taped in */

export function Sketch({
  src,
  alt,
  width,
  rotation = 0,
  className,
  style,
  tape,
  children,
}: Pos & { src: string; alt: string; width: number; tape?: TapeData[]; children?: ReactNode }) {
  return (
    <figure className={`sketch ${className ?? ''}`} style={{ ...style, width, rotate: `${rotation}deg` }}>
      {tape?.map((t, i) => <Tape key={i} t={t} />)}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={width} loading="lazy" decoding="async" draggable={false} />
      {children}
    </figure>
  )
}

/* ---------------------------------------------------------------- margin notes */

/**
 * A note that lives in the margin, partly off the page.
 * `hidden` notes only show up when you follow the arrow to them.
 */
export function MarginNote({
  children,
  side = 'right',
  rotation = -3,
  className,
  style,
  hidden,
  delay = 0.2,
}: Pos & { children: ReactNode; side?: 'left' | 'right'; hidden?: boolean; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.aside
      className={`margin-note margin-note--${side} ${hidden ? 'is-hidden' : ''} hand ${className ?? ''}`}
      style={{ ...style, rotate: rotation }}
      initial={reduce || hidden ? false : { opacity: 0, x: side === 'right' ? -6 : 6 }}
      whileInView={reduce || hidden ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ delay, duration: 0.4, ease: penEase }}
      tabIndex={hidden ? 0 : undefined}
    >
      {children}
    </motion.aside>
  )
}
