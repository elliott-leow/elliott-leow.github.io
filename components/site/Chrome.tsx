import Link from 'next/link'
import Fall from './Fall'

/** the bar across the top of every page but the front: the name, the way home */
export function TopBar() {
  return (
    <header className="top">
      <Link href="/" className="home-link">Elliott Leow</Link>
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
