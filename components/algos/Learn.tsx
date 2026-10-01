'use client'

/* what turns the note from something you read into something you do: lectures that fold away and remember they are done, one-tap questions, proofs you step through. progress lives in this browser only */
import { Children, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Btn } from './kit'
import { rng, shuffle } from '@/lib/algos/rng'

export const LECTURES = [
  { n: 1, short: 'multiply' },
  { n: 2, short: 'big-O' },
  { n: 3, short: 'proofs' },
  { n: 4, short: 'select' },
  { n: 5, short: 'sorting' },
  { n: 6, short: 'trees' },
  { n: 7, short: 'amortized' },
  { n: 8, short: 'heaps' },
  { n: 9, short: 'union-find' },
  { n: 10, short: 'hashing' },
] as const

/* ------------------------------------------------------------------ progress, kept in localStorage */

const KEY = 'algo-notes-progress-v1'
type Progress = Record<string, number>
const EMPTY: Progress = {}
let cache: Progress | null = null
const subs = new Set<() => void>()
const read = (): Progress => {
  if (cache) return cache
  let v: unknown = null
  try {
    v = JSON.parse(window.localStorage.getItem(KEY) ?? '{}')
  } catch {
    /* private mode or a mangled value: start empty */
  }
  cache = v && typeof v === 'object' ? (v as Progress) : {}
  return cache
}
const save = (changes: Progress) => {
  cache = { ...read(), ...changes }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* still works for this visit */
  }
  subs.forEach((f) => f())
}
const subscribe = (f: () => void) => {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}
const useProgress = () => useSyncExternalStore(subscribe, read, () => EMPTY)

/* ------------------------------------------------------------------ lectures */

const LecCtx = createContext<{ n: number; register: (id: string) => void } | null>(null)
const OPEN = 'algo-open-lecture'
const openLecture = (n: number) => window.dispatchEvent(new CustomEvent(OPEN, { detail: n }))

/** one lecture: closed until you open it, done when every quick check inside is right */
export function Lecture({ n, title, tldr, children }: { n: number; title: string; tldr: ReactNode; children: ReactNode }) {
  const p = useProgress()
  const [open, setOpen] = useState(false)
  const [ids, setIds] = useState<string[]>([])
  const register = useCallback((id: string) => setIds((a) => (a.includes(id) ? a : [...a, id])), [])
  const ctx = useMemo(() => ({ n, register }), [n, register])
  const solved = ids.filter((id) => p[id] === 1).length
  const done = p[`done:${n}`] === 1
  const all = ids.length > 0 && solved === ids.length

  useEffect(() => {
    // pick up where you left off: a linked lecture, or else the first one not done
    const first = LECTURES.find((l) => read()[`done:${l.n}`] !== 1)?.n
    if (window.location.hash === `#lecture-${n}` || (!window.location.hash && first === n)) setOpen(true)
    const on = (e: Event) => {
      if ((e as CustomEvent<number>).detail !== n) return
      setOpen(true)
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(() => document.getElementById(`lecture-${n}`)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' }))
    }
    window.addEventListener(OPEN, on)
    return () => window.removeEventListener(OPEN, on)
  }, [n])
  useEffect(() => {
    if (all) save({ [`done:${n}`]: 1 })
  }, [all, n])

  const redo = () => save({ [`done:${n}`]: 0, ...Object.fromEntries(ids.map((id) => [id, 0])) })
  return (
    <section id={`lecture-${n}`} className={`algo-lec ${done ? 'is-done' : ''}`}>
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>
          <h2 className="hand note-h2">
            lecture {n}: {title}
          </h2>
          <span className="algo-lec-tldr">{tldr}</span>
          <span className="algo-lec-meta hand">
            {done ? '✓ done' : ids.length ? `${solved} / ${ids.length} checks` : ''}
            <span className="algo-lec-toggle">{open ? 'close' : 'open'}</span>
          </span>
        </summary>
        <LecCtx.Provider value={ctx}>
          <div className="algo-lec-body">{children}</div>
        </LecCtx.Provider>
        <div className="algo-lec-end">
          {done ? (
            <Btn onClick={redo}>✓ done. redo its checks</Btn>
          ) : (
            <Btn onClick={() => save({ [`done:${n}`]: 1 })}>
              mark lecture {n} done{ids.length ? ` (${solved} / ${ids.length} checks right)` : ''}
            </Btn>
          )}
          {n < LECTURES.length && (
            <Btn
              onClick={() => {
                setOpen(false)
                openLecture(n + 1)
              }}
            >
              next: lecture {n + 1} →
            </Btn>
          )}
        </div>
      </details>
    </section>
  )
}

/** the strip at the top: jump to a lecture, see which are done */
export function LectureNav() {
  const p = useProgress()
  const done = LECTURES.filter((l) => p[`done:${l.n}`] === 1).length
  return (
    <nav className="algo-nav" aria-label="lectures">
      <span className="algo-nav-count hand">
        {done} / {LECTURES.length} done
      </span>
      {LECTURES.map((l) => {
        const d = p[`done:${l.n}`] === 1
        return (
          <button key={l.n} type="button" className={`algo-nav-chip hand ${d ? 'is-done' : ''}`} onClick={() => openLecture(l.n)} aria-label={`lecture ${l.n}, ${l.short}${d ? ', done' : ''}`}>
            <b>{l.n}</b> <span className="algo-nav-name">{l.short}</span>
            {d ? ' ✓' : ''}
          </button>
        )
      })}
    </nav>
  )
}

/* ------------------------------------------------------------------ questions */

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** one tap, instant answer. write the right option first: the order shown is shuffled, the same way every time */
export function Check({ q, options, why }: { q: string; options: string[]; why: ReactNode }) {
  const lec = useContext(LecCtx)
  const id = `c:${lec?.n ?? 0}:${q}`
  const p = useProgress()
  const [wrong, setWrong] = useState<number[]>([])
  const register = lec?.register
  useEffect(() => register?.(id), [register, id])
  const order = useMemo(() => shuffle(options.map((_, i) => i), rng(hash(q))), [options, q])
  const solved = p[id] === 1
  return (
    <div className={`algo-check ${solved ? 'is-solved' : ''}`}>
      <span className="algo-check-tag hand">quick check{solved ? '' : ': tap an answer'}</span>
      <div className="algo-check-q">{q}</div>
      <div className="orb-quiz-opts" role="group" aria-label="answers">
        {order.map((k) => (
          <button
            key={k}
            type="button"
            className={`orb-chip ${solved && k === 0 ? 'is-right' : wrong.includes(k) ? 'is-wrong' : ''}`}
            disabled={solved ? k !== 0 : wrong.includes(k)}
            onClick={() => {
              if (solved) return
              if (k === 0) {
                setWrong([])
                save({ [id]: 1 })
              } else setWrong((w) => [...w, k])
            }}
          >
            {options[k]}
          </button>
        ))}
      </div>
      <div className="algo-check-why hand" aria-live="polite">
        {solved ? <>✓ {why}</> : wrong.length ? 'not that one. try another.' : ''}
      </div>
    </div>
  )
}

/** answer it in your head first, then open it and grade yourself */
export function Recall({ q, children }: { q: string; children: ReactNode }) {
  const lec = useContext(LecCtx)
  const id = `r:${lec?.n ?? 0}:${q}`
  const v = useProgress()[id]
  return (
    <details className="algo-recall">
      <summary>
        <span className="hand">recall{v === 1 ? ' ✓' : v === 0 ? ' ↻' : ''}</span> {q}
      </summary>
      <div className="algo-recall-a">
        {children}
        <div className="algo-recall-grade">
          <span className="hand">did you have it?</span>
          <Btn on={v === 1} onClick={() => save({ [id]: 1 })}>
            knew it
          </Btn>
          <Btn on={v === 0} onClick={() => save({ [id]: 0 })}>
            missed it
          </Btn>
        </div>
      </div>
    </details>
  )
}

/* ------------------------------------------------------------------ reading in small pieces */

/** a proof or derivation, one step per click */
export function Steps({ children, title }: { children: ReactNode; title?: string }) {
  const items = Children.toArray(children).filter(isValidElement)
  const [k, setK] = useState(1)
  const shown = Math.min(k, items.length)
  return (
    <div className="algo-steps">
      <div className="algo-steps-title hand">step through it{title ? `: ${title}` : ''}</div>
      <ol>
        {items.slice(0, shown).map((it, i) => (
          <li key={i} className={i === shown - 1 ? 'is-new' : ''}>
            {it}
          </li>
        ))}
      </ol>
      <div className="algo-steps-ctl">
        <span className="algo-steps-dots" aria-hidden>
          {items.map((_, i) => (
            <i key={i} className={i < shown ? 'is-on' : ''} />
          ))}
        </span>
        {shown < items.length ? (
          <>
            <Btn onClick={() => setK(shown + 1)}>
              next step ({shown} / {items.length})
            </Btn>
            <Btn onClick={() => setK(items.length)}>show all</Btn>
          </>
        ) : (
          items.length > 1 && <Btn onClick={() => setK(1)}>↺ again from step 1</Btn>
        )}
      </div>
    </div>
  )
}
export function Step({ children }: { children: ReactNode }) {
  return <>{children}</>
}

/** goes in front of a figure: what it is, what the colours mean, and what to press, in order. tap a step to tick it off */
export function Guide({ fig, shows, children }: { fig: string; shows: ReactNode; children: ReactNode }) {
  return (
    <div className="algo-guide" onClick={(e) => (e.target as HTMLElement).closest('.algo-guide-do li')?.classList.toggle('is-ticked')}>
      <div className="algo-guide-head hand">before you touch it: {fig}</div>
      <p className="algo-guide-shows">
        <b>what you are looking at.</b> {shows}
      </p>
      <div className="algo-guide-do">
        <span className="hand">do this, in order (tap a step to tick it off):</span>
        {children}
      </div>
    </div>
  )
}

/** reference material that stays out of the way until you want it */
export function Fold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="algo-fold">
      <summary className="hand">{title}</summary>
      <div className="algo-fold-body">{children}</div>
    </details>
  )
}
