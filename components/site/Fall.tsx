import { between, rng } from './rng'
import { Blossom, Ginkgo, Petal } from './Marks'

/*
 * Things that fall into place on a sheet: each comes down from where it grows (x0..x1, y0, as % of the sheet), turns
 * and sways on the way, lands at the sheet's foot (yEnd) and lies there a while before it's gone and another falls.
 * Or, for fireflies, rises from the drawing and fades.
 */
export default function Fall({ seed, n, kind, x: [x0, x1], y: [y0, y1], spread = 18, rise }: {
  seed: number; n: number; kind: 'petal' | 'ginkgo' | 'firefly'; x: [number, number]; y: [number, number]; spread?: number; rise?: boolean
}) {
  const r = rng(seed)
  const items = Array.from({ length: n }, (_, i) => {
    const x = between(r, x0, x1)
    return {
      x, y0, y1: between(r, y1 - 3, y1 + 3), land: x + between(r, -spread, spread * 0.4),
      s: kind === 'firefly' ? between(r, 3, 5) : between(r, 12, 20), turn: between(r, 120, 420) * (r() > 0.5 ? 1 : -1),
      d: i * (kind === 'firefly' ? 1.3 : 2.7) + between(r, 0, 2), p: kind === 'firefly' ? between(r, 6, 10) : between(r, 14, 22),
      alt: i % 3 === 1,
    }
  })
  return (
    <div className={`fall ${rise ? 'fall-rise' : ''}`} aria-hidden="true">
      {items.map((it, i) => (
        <span key={i} className={kind === 'firefly' ? 'firefly' : 'faller'}
          style={{ '--x': `${it.x}%`, '--x1': `${it.land}%`, '--y0': `${it.y0}%`, '--y1': `${it.y1}%`, '--s': `${it.s}px`, '--turn': `${it.turn}deg`,
            '--d': `${it.d}s`, '--p': `${it.p}s` } as React.CSSProperties}>
          {kind === 'petal' && (it.alt ? <Blossom /> : <Petal />)}
          {kind === 'ginkgo' && <Ginkgo />}
        </span>
      ))}
    </div>
  )
}
