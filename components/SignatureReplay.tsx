'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

type Props = { children: ReactNode; className: string; delay: number; duration: number; replayable: boolean }

/**
 * Holds the signature, and writes it out again from the start when it's clicked. Once it's written,
 * the pieces it was written with are taken off the page, so the browser isn't left holding a layer for each.
 */
export default function SignatureReplay({ children, className, delay, duration, replayable }: Props) {
  const [plays, setPlays] = useState(0)
  const [written, setWritten] = useState(false)
  useEffect(() => {
    setWritten(false)
    const id = window.setTimeout(() => setWritten(true), (plays ? 0 : delay) + duration + 500)
    return () => window.clearTimeout(id)
  }, [plays, delay, duration])
  return (
    <div
      // a fresh copy restarts every animation in it; a replay starts right away
      key={plays}
      className={className}
      style={{ '--sig-delay': `${plays ? 0 : delay}ms` } as CSSProperties}
      role="img"
      aria-label="Elliott."
      onClick={replayable ? () => setPlays((n) => n + 1) : undefined}
      data-interactive={replayable || undefined}
      data-written={written || undefined}
    >
      {children}
    </div>
  )
}
