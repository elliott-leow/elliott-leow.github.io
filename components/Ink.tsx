import type { CSSProperties } from 'react'

/*
 * Typed text. Each letter has its own delay, and the caret rides along as a
 * shadow on whichever letter was typed last. Pure CSS, so it renders on the
 * server and never flashes the whole sentence first.
 */
export function Typed({ text, delay = 0, speed = 34, className }: { text: string; delay?: number; speed?: number; className?: string }) {
  const chars = [...text]
  return (
    <p className={`typed-line ${className ?? ''}`} style={{ '--step': `${speed}ms` } as CSSProperties}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {chars.map((c, i) => (
          <span key={i} className="typed-ch" style={{ '--d': `${delay + i * speed}ms` } as CSSProperties}>
            {c}
          </span>
        ))}
        <span className="typed-caret" style={{ '--d': `${delay + chars.length * speed}ms` } as CSSProperties} />
      </span>
    </p>
  )
}

/* a link that gets underlined in pen when you point at it */
const scribbles = [
  'M2 7 C 20 4, 42 9, 62 6 S 88 4, 98 7',
  'M2 6 C 24 9, 46 4, 70 7 C 82 8, 92 6, 98 5',
  'M3 8 C 30 5, 56 9, 98 5',
]

/* little pen sketches to sit beside a link, drawn at 24x24 with the same wobble as the doodles */
const icons = {
  email: [
    'M3.2 6.4 C 8 5.9, 15 6.1, 20.8 6.2 C 21 10, 20.9 14, 20.6 17.8 C 15 18.1, 9 18, 3.4 17.7 C 3.1 14, 3 10, 3.2 6.4 Z',
    'M3.6 6.8 C 7 9.6, 9.6 11.8, 12 12.6 C 14.6 11.6, 17.4 9.4, 20.4 6.6',
  ],
  github: [
    'M6 9.5 C 5.6 7.8, 5.8 6, 6.4 4.6 C 7.8 4.8, 9 5.6, 9.9 6.4 C 11.3 6, 12.8 6, 14.2 6.4 C 15.1 5.5, 16.3 4.8, 17.6 4.6 C 18.2 6, 18.4 7.8, 18 9.5 C 19 10.8, 19.2 12.8, 18.4 14.4 C 17.3 16.4, 14.8 17, 12 17 C 9.2 17, 6.7 16.4, 5.6 14.4 C 4.8 12.8, 5 10.8, 6 9.5 Z',
    'M10 17 C 9.8 18.6, 9.9 19.8, 10 21.2 M 14 17 C 14.2 18.6, 14.1 19.8, 14 21.2',
    'M10 19.2 C 7.8 19.8, 6.4 19, 5.4 17.4',
    'M9.6 11.6 L 9.6 12.4 M 14.4 11.6 L 14.4 12.4',
  ],
  linkedin: [
    'M4 4.4 C 9 3.9, 15 4.1, 19.8 4.3 C 20.1 9, 20 15, 19.7 19.7 C 15 20, 9 19.9, 4.2 19.6 C 3.9 15, 3.9 9, 4 4.4 Z',
    'M8 7.4 L 8 7.9 M 8 10.6 L 8.1 16.4',
    'M11.4 16.4 C 11.4 14, 11.4 12.2, 11.3 10.6 M 11.4 13 C 12 11.2, 13.4 10.4, 14.6 10.6 C 15.9 10.8, 16.3 11.8, 16.3 13.2 L 16.4 16.4',
  ],
} as const
export type InkIcon = keyof typeof icons

export function InkLink({ href, children, i = 0, icon }: { href: string; children: React.ReactNode; i?: number; icon?: InkIcon }) {
  const external = href.startsWith('http')
  return (
    <a className="ink-link hand" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      {icon && (
        <svg className="ink-link-icon" viewBox="0 0 24 24" aria-hidden>
          {icons[icon].map((d, k) => (
            <path key={k} d={d} pathLength={1} style={{ '--k': k } as CSSProperties} />
          ))}
        </svg>
      )}
      <span className="ink-link-text">
        {children}
        <svg className="ink-link-line" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden>
          <path d={scribbles[i % scribbles.length]} pathLength={1} />
        </svg>
      </span>
    </a>
  )
}
