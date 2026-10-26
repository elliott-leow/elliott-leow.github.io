import Link from 'next/link'
import { links } from '@/lib/content'
import Fall from './Fall'

export const sections = [
  { href: '/#about', label: 'About' },
  { href: '/#listening', label: 'Listening' },
  { href: '/#notes', label: 'Notes' },
]

export function TopNav({ current }: { current?: string }) {
  return (
    <nav className="topnav" aria-label="Sections">
      {sections.map((s) => (
        <a key={s.href} href={s.href} aria-current={current === s.label ? 'page' : undefined}>{s.label}</a>
      ))}
      <a href={`mailto:${links.email}`} className="tagged">Say hello</a>
    </nav>
  )
}

/** the bar across the top of every page but the front: the name, home, and the sections */
export function TopBar({ current }: { current?: string }) {
  return (
    <header className="top">
      <Link href="/" className="home-link">Elliott Leow</Link>
      <TopNav current={current} />
    </header>
  )
}

/** the foot of every page: a sheet of night with the waterfall in the valley drawn on it, and nothing else */
export function Colophon() {
  return (
    <div className="leaf-wrap">
      <footer className="colophon leaf leaf-ink">
        <img className="colophon-art draw-up" data-reveal src="/art/sheets/valley.webp" width={2400} height={1600} alt="" loading="lazy" decoding="async" />
        <Fall seed={21} n={9} kind="firefly" x={[10, 70]} y={[96, 55]} rise />
      </footer>
    </div>
  )
}
