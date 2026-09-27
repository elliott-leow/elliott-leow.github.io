'use client'

/*
 * One carbon chain, shared by two figures: fig. 3 (tap carbons to break or join
 * the row of p orbitals) and the π MO ladder further down, which is worked out
 * live from whatever chain fig. 3 is showing. Change one and the other follows.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useState, useSyncExternalStore, type CSSProperties } from 'react'
import { Atom, Bond, Fig, Lobe, PH, POrb, Pulse, Seg, Stick, T, zig, type StickSpec } from './kit'

type Hyb = 'sp2' | 'sp3'
const presets: { k: string; label: string; atoms: Hyb[] }[] = [
  { k: 'ethene', label: 'ethene', atoms: ['sp2', 'sp2'] },
  { k: 'allyl', label: 'allyl cation', atoms: ['sp2', 'sp2', 'sp2'] },
  { k: 'butadiene', label: '1,3-butadiene', atoms: ['sp2', 'sp2', 'sp2', 'sp2'] },
  { k: 'pentadiene', label: '1,4-pentadiene', atoms: ['sp2', 'sp2', 'sp3', 'sp2', 'sp2'] },
  { k: 'hexatriene', label: '1,3,5-hexatriene', atoms: ['sp2', 'sp2', 'sp2', 'sp2', 'sp2', 'sp2'] },
]

/* ---------------------------------------------------------------- the shared chain */

let chain: Hyb[] = presets[2].atoms
const subs = new Set<() => void>()
const setChain = (a: Hyb[]) => {
  chain = a
  subs.forEach((f) => f())
}
const subscribe = (f: () => void) => {
  subs.add(f)
  return () => void subs.delete(f)
}
const useChain = () => useSyncExternalStore(subscribe, () => chain, () => chain)

/** unbroken runs of sp² carbons, as [first, last] */
function runs(atoms: Hyb[]) {
  const out: [number, number][] = []
  let s = -1
  atoms.forEach((a, i) => {
    if (a === 'sp2' && s < 0) s = i
    if ((a !== 'sp2' || i === atoms.length - 1) && s >= 0) {
      const e = a === 'sp2' ? i : i - 1
      if (e > s) out.push([s, e])
      s = -1
    }
  })
  return out
}

/** the line drawing: double bonds paired up along each run; a lone leftover sp² carbon is a cation */
function chainStick(atoms: Hyb[]): StickSpec {
  const pts = zig(atoms.length)
  const doubles = new Set<number>()
  const plus: number[] = []
  let i = 0
  while (i < atoms.length) {
    if (atoms[i] !== 'sp2') {
      i++
      continue
    }
    let j = i
    while (j + 1 < atoms.length && atoms[j + 1] === 'sp2') j++
    for (let k = i; k + 1 <= j; k += 2) doubles.add(k)
    if ((j - i + 1) % 2) plus.push(j)
    i = j + 1
  }
  return {
    pts: atoms.length === 1 ? [[0, 0]] : pts,
    bonds: atoms.slice(1).map((_, k) => [k, k + 1, doubles.has(k) ? 2 : 1] as [number, number, 1 | 2]),
    notes: plus.map((p) => ({ i: p, t: '+', dy: -8 })),
  }
}

const presetKey = (atoms: Hyb[]) => presets.find((p) => p.atoms.length === atoms.length && p.atoms.every((a, i) => a === atoms[i]))?.k ?? ''

/* ================================================================== 3. a row of p orbitals */

export function Conjugation() {
  const atoms = useChain()
  const [touched, setTouched] = useState(false)
  const n = atoms.length
  const X = (i: number) => 280 + (i - (n - 1) / 2) * 84
  const Y = (i: number) => (i % 2 ? 200 : 170)
  const rs = runs(atoms)
  const toggle = (i: number) => {
    setTouched(true)
    setChain(atoms.map((a, j) => (j === i ? (a === 'sp2' ? 'sp3' : 'sp2') : a)))
  }
  const sizes = rs.map(([a, b]) => b - a + 1)
  return (
    <Fig
      n={3}
      title="a row of p orbitals"
      hint="tap a carbon: sp² ↔ sp³"
      stick={<Stick spec={chainStick(atoms)} />}
      controls={<Seg label="molecule" value={presetKey(atoms)} options={presets.map((p) => ({ k: p.k, label: p.label }))} onChange={(k) => setChain(presets.find((p) => p.k === k)!.atoms)} />}
      caption={rs.length === 0 ? 'no neighbouring p orbitals: no π system.' : rs.length === 1 ? `one π system, ${sizes[0]} atoms wide.` : `broken by sp³: ${rs.length} separate π systems (${sizes.join(' + ')} atoms).`}
    >
      <svg viewBox="0 0 560 330" className="orb-svg" role="img" aria-label={`A carbon chain: ${atoms.join(', ')}`}>
        {rs.map(([a, b], k) => {
          const x0 = X(a) - 30
          const x1 = X(b) + 30
          const dur = 1.2 + (b - a) * 0.5
          return (
            <motion.g key={`${n}-${a}-${b}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <rect x={x0} y={82} width={x1 - x0} height={46} rx={23} fill={PH.in} fillOpacity={0.12} stroke={PH.in} strokeWidth={1.5} strokeDasharray="6 5" />
              <rect x={x0} y={242} width={x1 - x0} height={46} rx={23} fill={PH.out} fillOpacity={0.12} stroke={PH.out} strokeWidth={1.5} strokeDasharray="6 5" />
              {[0, 1].map((j) => (
                <circle key={j} cx={x0 + 20} cy={j ? 265 : 105} r={4} fill={j ? PH.out : PH.in} className="orb-roam" style={{ '--dx': `${x1 - x0 - 40}px`, '--dur': `${dur}s`, animationDelay: `${-k * 0.4 - j * dur * 0.5}s` } as CSSProperties} />
              ))}
            </motion.g>
          )
        })}
        {atoms.slice(1).map((_, i) => (
          <Bond key={`${n}-${i}`} x1={X(i)} y1={Y(i)} x2={X(i + 1)} y2={Y(i + 1)} />
        ))}
        {atoms.map((a, i) => (
          <g key={`${n}-${i}`} onClick={() => toggle(i)} style={{ cursor: 'pointer' }} role="button" aria-label={`carbon ${i + 1}, ${a}. tap to change`}>
            <motion.g initial={false} animate={{ scale: a === 'sp2' ? 1 : 0, opacity: a === 'sp2' ? 1 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} style={{ originX: `${X(i)}px`, originY: `${Y(i)}px` }}>
              <POrb x={X(i)} y={Y(i)} L={70} W={24} />
            </motion.g>
            <rect x={X(i) - 34} y={Y(i) - 90} width={68} height={180} fill="transparent" />
            <Atom x={X(i)} y={Y(i)} label="C" r={14} size={17} />
            <T x={X(i)} y={i % 2 ? 318 : 60} size={17} ink={a === 'sp2' ? 'blue' : 'red'}>
              {a === 'sp2' ? 'sp²' : 'sp³'}
            </T>
          </g>
        ))}
        <Pulse x={X(1)} y={Y(1)} r={24} show={!touched} />
      </svg>
    </Fig>
  )
}

/* ================================================================== 11. the π MO ladder, worked out live */

export function PiLadder() {
  const atoms = useChain()
  const rs = runs(atoms)
  const longest = rs.reduce((best, r, i) => (r[1] - r[0] > rs[best][1] - rs[best][0] ? i : best), 0)
  const [pick, setPick] = useState<number | null>(null)
  const which = pick !== null && pick < rs.length ? pick : longest
  const run = rs[which]
  const n = run ? run[1] - run[0] + 1 : 0
  const electrons = 2 * Math.floor(n / 2) // neutral polyene, or a cation when n is odd
  const rowH = 74
  const top = 34
  const H = top + n * rowH + 16
  const ax = (j: number) => (n === 1 ? 225 : 100 + (j * 250) / (n - 1))
  const homo = electrons / 2
  const runStick = run ? chainStick(atoms.slice(run[0], run[1] + 1)) : null
  const levels = Array.from({ length: n }, (_, i) => n - i) // highest first
  return (
    <Fig
      n={11}
      title={`the π orbitals of ${presets.find((p) => p.k === presetKey(atoms))?.label ?? 'fig. 3’s chain'}`}
      hint="change the molecule here or in fig. 3"
      stick={runStick ? <Stick spec={runStick} /> : undefined}
      controls={
        <>
          <Seg label="molecule" value={presetKey(atoms)} options={presets.map((p) => ({ k: p.k, label: p.label }))} onChange={(k) => setChain(presets.find((p) => p.k === k)!.atoms)} />
          {rs.length > 1 && (
            <Seg
              label="which π system"
              value={String(which)}
              options={rs.map(([a, b], i) => ({ k: String(i), label: `π system ${i + 1} (C${a + 1}–C${b + 1})` }))}
              onChange={(k) => setPick(+k)}
            />
          )}
        </>
      }
      caption={
        n < 2
          ? 'no π system to draw. go back to fig. 3 and make two neighbouring carbons sp².'
          : `${n} p in → ${n} π out · ${electrons} π electrons.`
      }
    >
      {n >= 2 ? (
        <svg viewBox={`0 0 560 ${H}`} className="orb-svg" role="img" aria-label={`π molecular orbital diagram for ${n} p orbitals with ${electrons} electrons`}>
          <T x={395} y={20} size={15}>
            nodes
          </T>
          <AnimatePresence initial={false}>
            {levels.map((k, row) => {
              const y = top + row * rowH + rowH / 2
              const c = Array.from({ length: n }, (_, j) => Math.sin(((j + 1) * k * Math.PI) / (n + 1)))
              const max = Math.max(...c.map(Math.abs))
              const nodes: number[] = []
              c.forEach((v, j) => {
                if (Math.abs(v) < 1e-6) nodes.push(ax(j))
                else if (j + 1 < n && Math.abs(c[j + 1]) > 1e-6 && v * c[j + 1] < 0) nodes.push((ax(j) + ax(j + 1)) / 2)
              })
              const e = Math.max(0, Math.min(2, electrons - (k - 1) * 2))
              const kind = 2 * k < n + 1 ? 'bonding' : 2 * k === n + 1 ? 'nonbonding' : 'antibonding'
              return (
                <motion.g key={`${n}-${k}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: row * 0.05 }}>
                  <T x={34} y={y + 7} size={20} ink="ink">
                    π{k}
                    {kind === 'antibonding' ? '*' : ''}
                  </T>
                  {c.map((v, j) => {
                    const s = Math.abs(v) / max
                    return (
                      <g key={j}>
                        {s > 0.02 && (
                          <>
                            <Lobe x={ax(j)} y={y} L={8 + 24 * s} W={4 + 10 * s} phase={v > 0 ? 'in' : 'out'} fill={0.3} />
                            <Lobe x={ax(j)} y={y} angle={180} L={8 + 24 * s} W={4 + 10 * s} phase={v > 0 ? 'out' : 'in'} fill={0.3} />
                          </>
                        )}
                        <circle cx={ax(j)} cy={y} r={2.4} fill="var(--ink)" />
                      </g>
                    )
                  })}
                  {nodes.map((x, i) => (
                    <line key={i} x1={x} y1={y - 32} x2={x} y2={y + 32} stroke="var(--red-pen)" strokeWidth={1.4} strokeDasharray="3 4" />
                  ))}
                  <T x={395} y={y + 6} size={17} ink="ink">
                    {nodes.length}
                  </T>
                  <line x1={425} y1={y} x2={485} y2={y} stroke="var(--ink)" strokeWidth={2.2} strokeLinecap="round" />
                  {e >= 1 && <path d={`M 447 ${y + 11} L 447 ${y - 15} M 441 ${y - 8} L 447 ${y - 15} L 453 ${y - 8}`} stroke="var(--blue-pen)" strokeWidth={2} fill="none" strokeLinecap="round" />}
                  {e >= 2 && <path d={`M 463 ${y - 15} L 463 ${y + 11} M 457 ${y + 4} L 463 ${y + 11} L 469 ${y + 4}`} stroke="var(--blue-pen)" strokeWidth={2} fill="none" strokeLinecap="round" />}
                  {k === homo && (
                    <T x={492} y={y + 5} anchor="start" size={15} ink="blue">
                      HOMO
                    </T>
                  )}
                  {k === homo + 1 && (
                    <T x={492} y={y + 5} anchor="start" size={15} ink="red">
                      LUMO
                    </T>
                  )}
                </motion.g>
              )
            })}
          </AnimatePresence>
          <T x={14} y={H - 10} anchor="start" size={13}>
            ↑ energy
          </T>
        </svg>
      ) : (
        <div className="orb-empty hand">no π system</div>
      )}
    </Fig>
  )
}
