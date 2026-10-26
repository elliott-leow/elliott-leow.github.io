import Link from 'next/link'

export type Tape = 'top' | 'corners'
const TAPES: Record<number, [number, number]> = { 1: [112, 36], 2: [104, 34], 3: [118, 38], 4: [108, 36], 5: [100, 34], 6: [114, 40] }

/** one strip of washi tape, from public/art/ui */
export function TapeStrip({ n, className }: { n: number; className: string }) {
  const [w, h] = TAPES[n]
  return (
    <span className={`wt ${className}`} style={{ '--tw': w, '--th': h, '--tape': `url(/art/ui/tape-${n}.webp)` } as React.CSSProperties}>
      <img src={`/art/ui/tape-${n}.webp`} width={w} height={h} alt="" loading="lazy" decoding="async" />
    </span>
  )
}

/** a picture with the white edge the scissors leave, taped to the sheet a little askew; its title and a line under it */
export default function Print({ href, src, title, meta, r, tape = 1, corners, wide, external, lightbox, alt = '', children }: {
  href: string; src: string; title: React.ReactNode; meta?: React.ReactNode; r: number; tape?: number; corners?: [number, number]
  wide?: boolean; external?: boolean; lightbox?: string; alt?: string; children?: React.ReactNode
}) {
  const inner = (
    <>
      <span className="pic" style={{ '--r': `${r}deg` } as React.CSSProperties}>
        {corners ? <><TapeStrip n={corners[0]} className="wt-l" /><TapeStrip n={corners[1]} className="wt-r" /></> : <TapeStrip n={tape} className="wt-top" />}
        <span className="pic-paper">
          <img className={`pic-img ${wide ? 'pic-wide' : ''}`} src={src} alt={alt} loading="lazy" decoding="async" />
        </span>
      </span>
      <span className="pic-title">{title}</span>
      {meta && <span className="pic-meta">{meta}</span>}
      {children}
    </>
  )
  return (
    <li className="print">
      {lightbox ? <a href={lightbox} data-lightbox data-alt={alt}>{inner}</a> : external ? <a href={href} target="_blank" rel="noreferrer">{inner}</a> : <Link href={href}>{inner}</Link>}
    </li>
  )
}
