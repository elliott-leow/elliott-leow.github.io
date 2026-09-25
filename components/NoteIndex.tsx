'use client'

import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { notes } from '@/lib/content'
import { penEase } from '@/lib/motion'

/** notes, listed the way you'd keep a table of contents in the front of a notebook */
export default function NoteIndex({ limit, compact }: { limit?: number; compact?: boolean }) {
  const list = limit ? notes.slice(0, limit) : notes
  const [hover, setHover] = useState<string | null>(null)
  const reduce = useReducedMotion()
  return (
    <ol className={`note-index ${compact ? 'is-compact' : ''}`}>
      {list.map((n, i) => (
        <li key={n.slug} onMouseEnter={() => setHover(n.slug)} onMouseLeave={() => setHover(null)}>
          <Link href={`/notes/${n.slug}/`} className="note-row" onFocus={() => setHover(n.slug)} onBlur={() => setHover(null)}>
            <span className="note-date mono">{n.date}</span>
            <span className="note-title mono">{n.title}</span>
            <span className="note-dots" aria-hidden />
          </Link>
          <AnimatePresence>
            {hover === n.slug && (
              <motion.span
                className="note-preview hand"
                initial={reduce ? false : { height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0, transition: { duration: 0.18, ease: penEase } }}
                transition={{ duration: 0.25, ease: penEase }}
                aria-hidden
              >
                <motion.span
                  style={{ rotate: i % 2 ? 0.8 : -0.9 }}
                  initial={reduce ? false : { opacity: 0, x: -8, clipPath: 'inset(0 100% 0 0)' }}
                  animate={{ opacity: 1, x: 0, clipPath: 'inset(0 -5% 0 0)' }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.35, ease: penEase }}
                >
                  {n.preview}
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </li>
      ))}
    </ol>
  )
}
