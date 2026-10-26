import { between, rng } from './rng'
import { Blossom, Petal, Star } from './Marks'

/*
 * What moves in the front drawing. Everything is placed by where it is in the drawing (--ax, --ay, as fractions of
 * it), the way the name is, so the shimmer stays on the moon's path on the water and the petals land on the sea
 * however the drawing is cropped. The wide drawing and the tall one (a phone's) each get their own places.
 */
const r = rng(26)
type At = { w: [number, number]; t: [number, number] }
const at = ({ w, t }: At) => ({ '--ax-w': w[0], '--ay-w': w[1], '--ax-t': t[0], '--ay-t': t[1] }) as React.CSSProperties

// stars that twinkle, in the open sky (the drawing's own stars stay still; these are a few more, catching the light)
const stars = Array.from({ length: 26 }, () => ({
  at: { w: [between(r, 0.02, 0.98), between(r, 0.03, 0.5)], t: [between(r, 0.04, 0.96), between(r, 0.04, 0.48)] } as At,
  s: between(r, 5, 11), d: between(r, 0, 6), p: between(r, 2.6, 5.5),
}))
// the moon's path on the water: short gold strokes that catch the light and let it go
const glints = Array.from({ length: 16 }, () => ({
  at: { w: [between(r, 0.5, 0.62), between(r, 0.8, 0.93)], t: [between(r, 0.44, 0.62), between(r, 0.84, 0.96)] } as At,
  w: between(r, 6, 16), d: between(r, 0, 4), p: between(r, 1.8, 3.6),
}))
// blossom carried in on the wind, down onto the sea, where each one leaves a ring as it lands
const petals = Array.from({ length: 9 }, (_, i) => ({
  at: { w: [between(r, 0.08, 0.72), between(r, 0.8, 0.9)], t: [between(r, 0.1, 0.7), between(r, 0.86, 0.95)] } as At,
  dx: between(r, -90, -260), s: between(r, 11, 17), d: i * 2.3 + between(r, 0, 2), p: between(r, 13, 19), turn: between(r, 180, 520),
  blossom: i % 4 === 1,
}))

export default function Sky() {
  return (
    <div className="sky-life" aria-hidden="true">
      {stars.map((s, i) => (
        <span key={`s${i}`} className="spot twinkle" style={{ ...at(s.at), '--s': `${s.s}px`, animationDelay: `${s.d}s`, animationDuration: `${s.p}s` } as React.CSSProperties}><Star /></span>
      ))}
      {glints.map((g, i) => (
        <span key={`g${i}`} className="spot glint" style={{ ...at(g.at), '--w': `${g.w}px`, animationDelay: `${g.d}s`, animationDuration: `${g.p}s` } as React.CSSProperties} />
      ))}
      <span className="shooting" />
      {/* a little one on the ledge by the pine, waving at whoever finds it */}
      <span className="spot critter" style={at({ w: [0.876, 0.583], t: [0.785, 0.668] })}>
        <img src="/art/hero/critter.webp" width={320} height={307} alt="" decoding="async" />
      </span>
      {petals.map((p, i) => (
        <span key={`p${i}`} className="spot drift" style={{ ...at(p.at), '--dx': `${p.dx}px`, '--s': `${p.s}px`, '--turn': `${p.turn}deg`, '--d': `${p.d}s`, '--p': `${p.p}s` } as React.CSSProperties}>
          <span className="drift-fall">{p.blossom ? <Blossom /> : <Petal />}</span>
          <span className="drift-ring" />
        </span>
      ))}
    </div>
  )
}
