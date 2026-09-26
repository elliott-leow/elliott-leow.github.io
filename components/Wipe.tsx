'use client'

import { useInView } from 'motion/react'
import { useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * Reveals its contents left to right, like a pen writing them, the first time they scroll into view.
 * A clip slides right while the contents inside it slide left by the same amount, so nothing moves on
 * screen but the edge. Both are transforms, which the GPU animates off the main thread; animating
 * the clip itself (clip-path, a mask, a dash) would be redrawn by the main thread every frame.
 * The outer span never moves, so it's the one watched for coming into view.
 */
export default function Wipe({
  children,
  delay = 0,
  duration = 0.6,
  className,
  style,
}: {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true, margin: '0px 0px -6% 0px' })
  return (
    <span
      ref={ref}
      className={`wipe ${seen ? 'is-seen' : ''} ${className ?? ''}`}
      style={{ ...style, '--wipe-d': `${delay}s`, '--wipe-t': `${duration}s` } as CSSProperties}
    >
      <span className="wipe-clip">
        <span className="wipe-in">{children}</span>
      </span>
    </span>
  )
}
