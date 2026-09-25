'use client'

import { useRef, useState, type ReactNode } from 'react'
import { SheetContext } from './SheetContext'
import { useGlide } from '@/lib/glide'

/*
 * A page of dotted Japanese paper that fills the window, written in an A4-wide column.
 * Folding the bottom corner turns the page over and back again, which writes
 * everything out a second time.
 */
export default function Notebook({ children }: { children: ReactNode }) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [turns, setTurns] = useState(0)
  const [turning, setTurning] = useState(false)
  useGlide(sheetRef)

  const turnPage = () => {
    if (turning) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setTurns((n) => n + 1)
    setTurning(true)
    // swap the page while it's edge-on, then let it fall back flat
    window.setTimeout(() => setTurns((n) => n + 1), 380)
    window.setTimeout(() => setTurning(false), 900)
  }

  return (
    <SheetContext.Provider value={sheetRef}>
      <div className="workspace">
        <div className="sheet-texture" aria-hidden />
        <div className="rules" key={`rules-${turns}`} aria-hidden />
        <div className="notebook">
          <div ref={sheetRef} className={`sheet ${turning ? 'is-turning' : ''}`}>
            <main id="page" className="sheet-body" key={turns}>
              {children}
            </main>
          </div>
        </div>
      </div>
      <button type="button" className="corner" onClick={turnPage} aria-label="Turn the page over and back (replays the page)">
        <span className="corner-fold" aria-hidden />
        <span className="corner-note hand" aria-hidden>
          again?
        </span>
      </button>
    </SheetContext.Provider>
  )
}
