'use client'

import { type CSSProperties, type ReactNode } from 'react'

/**
 * Reveals its contents left to right, like a pen writing them, when the page loads.
 * A clip slides right while the contents inside it slide left by the same amount, so nothing moves on
 * screen but the edge. Both are transforms, which the GPU animates off the main thread; animating
 * the clip itself (clip-path, a mask, a dash) would be redrawn by the main thread every frame.
 * CSS starts the reveal with the rest of the page, without waiting for hydration.
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
  return (
    <span
      className={`wipe is-seen ${className ?? ''}`}
      style={{ ...style, '--wipe-d': `${delay}s`, '--wipe-t': `${duration}s` } as CSSProperties}
    >
      <span className="wipe-clip">
        <span className="wipe-in">{children}</span>
      </span>
    </span>
  )
}
