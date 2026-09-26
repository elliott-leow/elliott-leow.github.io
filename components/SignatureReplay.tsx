'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

type Props = { children: ReactNode; className: string; lead: number; settled: number; replayable: boolean }

/**
 * Holds the signature, and writes it out again when it's clicked: a fresh copy restarts every
 * animation in it, skipping the pause at the start. Once it's written, the patches it was played
 * back with are taken off the page, so the browser isn't left holding a layer for each.
 */
export default function SignatureReplay({ children, className, lead, settled, replayable }: Props) {
  const [plays, setPlays] = useState(0)
  const [written, setWritten] = useState(false)
  useEffect(() => {
    setWritten(false)
    const id = window.setTimeout(() => setWritten(true), settled - (plays ? lead : 0) + 500)
    return () => window.clearTimeout(id)
  }, [plays, lead, settled])
  return (
    <div
      key={plays}
      className={className}
      style={{ '--sig-t0': `${plays ? -lead : 0}ms` } as CSSProperties}
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
