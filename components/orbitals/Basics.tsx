'use client'

/* figures for the first half of the note: p orbitals, pi bonds, conjugation, hybridization, rotation */
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import Scene3D, { type Item, type V3 } from './Scene3D'
import { Atom, Bond, Btn, Fig, LobeDots, Lobe, Meter, PH, POrb, Pulse, Seg, Slider, Stick, T, flip, useSpringValue, type Phase } from './kit'
import { sticks } from './sticks'

/* ================================================================== 1. one p orbital */

export function POrbital() {
  const [e, setE] = useState(0)
  const [turned, setTurned] = useState(false)
  const [full, setFull] = useState(0)
  const ang = useSpringValue(turned ? 180 : 0, 120, 16)
  const cx = 210
  const cy = 160
  const upIsIn = Math.abs(((ang % 360) + 360) % 360) < 90 || ((ang % 360) + 360) % 360 > 270
  const add = () => (e < 2 ? setE(e + 1) : setFull((f) => f + 1))
  return (
    <Fig
      n={1}
      title="one p orbital"
      hint="add electrons, then turn it around"
      controls={
        <>
          <Btn onClick={add}>+ electron</Btn>
          <Btn onClick={() => setE(Math.max(0, e - 1))} disabled={e === 0}>
            − electron
          </Btn>
          <Btn onClick={() => setTurned((t) => !t)}>turn it upside down</Btn>
        </>
      }
      caption={
        e === 0
          ? 'empty.'
          : e === 1
            ? 'one electron, in the whole hourglass.'
            : full
              ? 'full. two max.'
              : 'two electrons, opposite spins: full.'
      }
    >
      <svg viewBox="0 0 560 320" className="orb-svg" role="img" aria-label={`A p orbital shaped like an hourglass, holding ${e} electron${e === 1 ? '' : 's'}`}>
        <g transform={`rotate(${ang} ${cx} ${cy})`}>
          <Lobe x={cx} y={cy} L={120} W={50} phase="in" fill={e ? 0.12 : 0.05} dashed={!e} />
          <Lobe x={cx} y={cy} L={120} W={50} angle={180} phase="out" fill={e ? 0.12 : 0.05} dashed={!e} />
          <AnimatePresence>
            {e > 0 && (
              <motion.g key={e} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <LobeDots x={cx} y={cy} L={120} W={50} n={e * 34} phase="in" seed={3} />
                <LobeDots x={cx} y={cy} L={120} W={50} angle={180} n={e * 34} phase="out" seed={9} />
              </motion.g>
            )}
          </AnimatePresence>
        </g>
        <Atom x={cx} y={cy} label="C" r={13} size={16} />

        {/* which half is which */}
        <path d={`M ${cx + 62} ${cy - 78} C ${cx + 90} ${cy - 92}, ${cx + 110} ${cy - 96}, ${cx + 128} ${cy - 96}`} stroke="var(--pencil)" fill="none" strokeWidth={1.2} />
        <T x={cx + 134} y={cy - 90} anchor="start" ink={upIsIn ? 'blue' : 'red'}>
          {upIsIn ? 'in phase' : 'out of phase'}
        </T>
        <path d={`M ${cx + 62} ${cy + 78} C ${cx + 90} ${cy + 92}, ${cx + 110} ${cy + 96}, ${cx + 128} ${cy + 96}`} stroke="var(--pencil)" fill="none" strokeWidth={1.2} />
        <T x={cx + 134} y={cy + 102} anchor="start" ink={upIsIn ? 'red' : 'blue'}>
          {upIsIn ? 'out of phase' : 'in phase'}
        </T>

        {/* a brace: the whole thing is one orbital */}
        <path d={`M ${cx - 78} ${cy - 118} C ${cx - 92} ${cy - 118}, ${cx - 88} ${cy - 10}, ${cx - 100} ${cy} C ${cx - 88} ${cy + 10}, ${cx - 92} ${cy + 118}, ${cx - 78} ${cy + 118}`} stroke="var(--blue-pen)" fill="none" strokeWidth={1.6} strokeLinecap="round" />
        <T x={cx - 112} y={cy - 4} anchor="end" ink="blue" size={19}>
          one orbital,
        </T>
        <T x={cx - 112} y={cy + 18} anchor="end" ink="blue" size={19}>
          not two
        </T>

        {/* the box you'd draw on an exam */}
        <g transform="translate(476 172)">
          <rect x={-30} y={-24} width={60} height={40} fill="none" stroke="var(--ink)" strokeWidth={1.6} rx={3} />
          <AnimatePresence>
            {e >= 1 && (
              <motion.path key="up" d="M -10 10 L -10 -16 M -16 -9 L -10 -16 L -4 -9" stroke="var(--blue-pen)" strokeWidth={2} fill="none" strokeLinecap="round" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} />
            )}
            {e >= 2 && (
              <motion.path key="down" d="M 10 -16 L 10 10 M 4 3 L 10 10 L 16 3" stroke="var(--blue-pen)" strokeWidth={2} fill="none" strokeLinecap="round" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} />
            )}
          </AnimatePresence>
          <T x={0} y={40} size={16}>
            {e}/2 electrons
          </T>
          {full > 0 && (
            <motion.g key={full} initial={{ x: 0 }} animate={{ x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.4 }}>
              <T x={0} y={-36} ink="red" size={18}>
                full!
              </T>
            </motion.g>
          )}
        </g>
      </svg>
    </Fig>
  )
}

/* ================================================================== 2. two p orbitals make a pi bond */

export function PiBond() {
  const [right, setRight] = useState<Phase>('out')
  const [touched, setTouched] = useState(false)
  const match = right === 'in'
  const m = useSpringValue(match ? 1 : 0, 140, 18)
  const x1 = 210
  const x2 = 350
  const cy = 165
  const lean = (1 - m) * 11 // mismatched lobes lean away from each other
  const flipIt = () => {
    setTouched(true)
    setRight(flip(right))
  }
  const cloudTop = `M ${x1 - 26} ${cy - 16} C ${x1 - 58} ${cy - 118}, ${x2 + 58} ${cy - 118}, ${x2 + 26} ${cy - 16} C ${x2 - 10} ${cy - 30}, ${x1 + 10} ${cy - 30}, ${x1 - 26} ${cy - 16} Z`
  return (
    <Fig
      n={2}
      stick={<Stick spec={sticks.ethene} />}
      title="ethene: a σ bond and a π bond"
      hint="tap the right-hand p orbital to flip its phase"
      controls={<Btn onClick={flipIt}>flip the right p orbital</Btn>}
      caption={match ? 'same phase: merged above and below σ. that’s π.' : 'opposite phase: a node, no π bond.'}
    >
      <svg viewBox="0 0 560 330" className="orb-svg" role="img" aria-label={match ? 'Ethene with a pi bond formed above and below the sigma bond' : 'Ethene with mismatched p orbitals and no pi bond'}>
        {/* the pi cloud */}
        <g opacity={m}>
          <path d={cloudTop} fill={PH.in} fillOpacity={0.16} stroke={PH.in} strokeWidth={1.8} />
          <path d={cloudTop} transform={`translate(0 ${cy * 2}) scale(1 -1)`} fill={PH.out} fillOpacity={0.16} stroke={PH.out} strokeWidth={1.8} />
          <T x={(x1 + x2) / 2} y={cy - 70} ink="blue" size={22}>
            π
          </T>
        </g>
        {/* the p orbitals themselves */}
        <g opacity={1 - m * 0.75}>
          <POrb x={x1} y={cy} L={92} W={36} angle={-lean} top="in" />
          <g onClick={flipIt} style={{ cursor: 'pointer' }}>
            <POrb x={x2} y={cy} L={92} W={36} angle={lean} top={right} />
          </g>
        </g>
        <Pulse x={x2} y={cy - 56} r={30} show={!touched} />
        {/* the node you get when they don't match */}
        <line x1={(x1 + x2) / 2} y1={cy - 110} x2={(x1 + x2) / 2} y2={cy + 110} stroke="var(--red-pen)" strokeWidth={1.4} strokeDasharray="4 6" opacity={1 - m} />
        <T x={(x1 + x2) / 2} y={cy + 132} ink="red" size={16} opacity={1 - m}>
          node
        </T>

        {/* the sigma framework */}
        <Bond x1={x1} y1={cy} x2={x2} y2={cy} w={2.4} />
        <T x={(x1 + x2) / 2 + 16} y={cy + 22} size={17} ink="ink">
          σ
        </T>
        {[
          [x1, -1, -1],
          [x1, -1, 1],
          [x2, 1, -1],
          [x2, 1, 1],
        ].map(([x, sx, sy], i) => (
          <g key={i}>
            <Bond x1={x} y1={cy} x2={x + sx * 62} y2={cy + sy * 30} w={1.8} />
            <Atom x={x + sx * 72} y={cy + sy * 35} label="H" r={11} size={15} />
          </g>
        ))}
        <Atom x={x1} y={cy} label="C" />
        <Atom x={x2} y={cy} label="C" />
        <T x={70} y={40} anchor="start" size={16} ink={match ? 'blue' : 'red'}>
          {match ? 'phases match ✓' : 'phases don’t match ✗'}
        </T>
      </svg>
    </Fig>
  )
}

/* ================================================================== 4. hybridization: the recipe and the shape */

type H = 'sp3' | 'sp2' | 'sp'
const hyb: Record<H, { name: string; mixed: number; angle: string; shape: string; s: string }> = {
  sp3: { name: 'sp³', mixed: 4, angle: '109.5°', shape: 'tetrahedral', s: '25%' },
  sp2: { name: 'sp²', mixed: 3, angle: '120°', shape: 'trigonal planar', s: '33%' },
  sp: { name: 'sp', mixed: 2, angle: '180°', shape: 'linear', s: '50%' },
}

function hybridItems(h: H): Item[] {
  const t = 1 / Math.sqrt(3)
  const dirs: V3[] =
    h === 'sp3'
      ? [
          [t, t, t],
          [t, -t, -t],
          [-t, t, -t],
          [-t, -t, t],
        ]
      : h === 'sp2'
        ? [0, 120, 240].map((a) => [Math.cos((a * Math.PI) / 180), 0, Math.sin((a * Math.PI) / 180)] as V3)
        : [
            [1, 0, 0],
            [-1, 0, 0],
          ]
  const ps: V3[] = h === 'sp3' ? [] : h === 'sp2' ? [[0, 1, 0]] : [[0, 1, 0], [0, 0, 1]]
  const items: Item[] = [{ k: 'atom', p: [0, 0, 0], label: 'C', r: 16 }]
  dirs.forEach((d) => items.push({ k: 'lobe', o: [0, 0, 0], d, L: 118, W: 40, phase: 'hyb' }))
  ps.forEach((d) => {
    items.push({ k: 'lobe', o: [0, 0, 0], d, L: 96, W: 28, phase: 'in' })
    items.push({ k: 'lobe', o: [0, 0, 0], d: [-d[0], -d[1], -d[2]], L: 96, W: 28, phase: 'out' })
  })
  return items
}

export function Hybridization() {
  const [h, setH] = useState<H>('sp3')
  const info = hyb[h]
  const boxes = Array.from({ length: 4 }, (_, i) => (i < info.mixed ? 'hyb' : 'p'))
  return (
    <Fig
      n={4}
      stick={<Stick spec={{ sp3: sticks.methane, sp2: sticks.ethene, sp: sticks.ethyne }[h]} />}
      title="hybridization: mix, then look what's left"
      hint="pick one, and drag the drawing to turn it"
      controls={<Seg label="hybridization" value={h} options={(['sp3', 'sp2', 'sp'] as H[]).map((k) => ({ k, label: hyb[k].name }))} onChange={setH} />}
      caption={`${info.mixed} hybrids + ${4 - info.mixed} p left for π bonds.`}
    >
      <div className="orb-recipe" aria-hidden>
        <div className="orb-boxes">
          {['s', 'p', 'p', 'p'].map((b, i) => (
            <span key={i} className={`orb-box orb-box--${i === 0 ? 's' : 'p'} hand`}>
              {b}
            </span>
          ))}
        </div>
        <span className="orb-recipe-arrow hand">mix {info.mixed} →</span>
        <div className="orb-boxes">
          {boxes.map((b, i) => (
            <motion.span key={`${h}-${i}`} className={`orb-box orb-box--${b} hand`} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.07 }}>
              {b === 'hyb' ? info.name : 'p'}
              {b === 'p' && (
                <svg className="orb-box-ring" viewBox="0 0 60 50" preserveAspectRatio="none">
                  <motion.path d="M14 8 C 34 0, 58 10, 55 28 C 52 46, 16 50, 6 34 C -2 20, 12 6, 30 5" fill="none" stroke="var(--red-pen)" strokeWidth={1.8} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35 + i * 0.1, duration: 0.45 }} />
                </svg>
              )}
            </motion.span>
          ))}
        </div>
        <span className="orb-recipe-note hand">{4 - info.mixed === 0 ? 'nothing left for π bonds' : `${4 - info.mixed} left for π bonds`}</span>
      </div>
      <Scene3D items={hybridItems(h)} view={{ yaw: 0.5, pitch: 0.38, n: 0 }} height={290} label={`A ${info.name} carbon: ${info.shape}`}>
        <T x={20} y={272} anchor="start" size={20} ink="green">
          {info.name} · {info.shape} · {info.angle}
        </T>
      </Scene3D>
    </Fig>
  )
}

/* ================================================================== 5. twist a double bond */

export function Twist() {
  const [deg, setDeg] = useState(0)
  const th = (deg * Math.PI) / 180
  const c = Math.cos(th)
  const s = Math.sin(th)
  const tw = (p: V3): V3 => [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]
  // past 90° the right p orbital pairs up the other way round: phase is only a label
  const top: Phase = c >= 0 ? 'in' : 'out'
  const pUp: V3 = tw([0, 1, 0])
  const C1: V3 = [-0.7, 0, 0]
  const C2: V3 = [0.7, 0, 0]
  const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]
  const overlap = Math.abs(c)
  const items: Item[] = [
    { k: 'bond', a: C1, b: C2, w: 2.4 },
    ...([1, -1] as const).flatMap((z): Item[] => {
      const h1: V3 = [-1.25, 0, 0.9 * z]
      const h2: V3 = tw([1.25, 0, 0.9 * z])
      return [
        { k: 'bond', a: C1, b: h1, w: 1.8 },
        { k: 'atom', p: h1, label: 'H', r: 11 },
        { k: 'bond', a: C2, b: h2, w: 1.8 },
        { k: 'atom', p: h2, label: 'H', r: 11 },
      ]
    }),
    { k: 'lobe', o: C1, d: [0, 1, 0], L: 78, W: 26, phase: 'in' },
    { k: 'lobe', o: C1, d: [0, -1, 0], L: 78, W: 26, phase: 'out' },
    { k: 'lobe', o: C2, d: pUp, L: 78, W: 26, phase: top },
    { k: 'lobe', o: C2, d: [-pUp[0], -pUp[1], -pUp[2]], L: 78, W: 26, phase: flip(top) },
    { k: 'band', a: add(C1, [0, 1, 0], 0.5), b: add(C2, c >= 0 ? pUp : [0, -pUp[1], -pUp[2]], 0.5), w: 22, phase: 'in', opacity: overlap * overlap * 0.3 },
    { k: 'band', a: add(C1, [0, -1, 0], 0.5), b: add(C2, c >= 0 ? pUp : [0, -pUp[1], -pUp[2]], -0.5), w: 22, phase: 'out', opacity: overlap * overlap * 0.3 },
    { k: 'atom', p: C1, label: 'C' },
    { k: 'atom', p: C2, label: 'C' },
  ]
  const msg =
    overlap > 0.9
      ? deg > 90
        ? 'flat again: π bond back, but the H’s swapped sides (cis ⇄ trans).'
        : 'parallel p orbitals: full overlap, full π bond.'
      : overlap < 0.15
        ? '90°: zero overlap, no π bond (costs ~65 kcal/mol).'
        : 'less overlap, weaker π bond.'
  return (
    <Fig
      n={6}
      stick={<Stick spec={sticks.ethene} />}
      title="try to rotate a double bond"
      hint="drag the slider; drag the drawing to look around"
      controls={
        <>
          <Slider label="twist the right carbon" value={deg} min={0} max={180} onChange={setDeg} format={(v) => `${v}°`} />
          <Meter label="p-orbital overlap (π bond)" value={overlap} tone={overlap > 0.5 ? 'blue' : 'red'} right={`${Math.round(overlap * 100)}%`} />
        </>
      }
      caption={msg}
    >
      <Scene3D items={items} view={{ yaw: 0.35, pitch: 0.5, n: 0 }} spin={false} height={300} label={`Ethene twisted by ${deg} degrees; p orbital overlap ${Math.round(overlap * 100)} percent`} />
    </Fig>
  )
}

/* ================================================================== 5. the shapes, as real molecules */

const t3 = 1 / Math.sqrt(3)
const shapes: Record<H, { mol: string; items: Item[]; note: string }> = {
  sp3: {
    mol: 'methane',
    note: 'every H is as far from the others as it can get. that\u2019s a tetrahedron, not a flat cross.',
    items: [
      ...([
        [t3, t3, t3],
        [t3, -t3, -t3],
        [-t3, t3, -t3],
        [-t3, -t3, t3],
      ] as V3[]).flatMap((d): Item[] => {
        const h: V3 = [d[0] * 1.15, d[1] * 1.15, d[2] * 1.15]
        return [
          { k: 'bond', a: [0, 0, 0], b: h },
          { k: 'atom', p: h, label: 'H', r: 12 },
        ]
      }),
      { k: 'atom', p: [0, 0, 0], label: 'C', r: 16 },
    ],
  },
  sp2: {
    mol: 'ethene',
    note: 'all six atoms sit in one flat plane, and the p orbitals stick straight up out of it.',
    items: [
      { k: 'bond', a: [-0.67, 0, 0], b: [0.67, 0, 0], w: 2.4 },
      { k: 'bond', a: [-0.67, 0.07, 0], b: [0.67, 0.07, 0], w: 1.4, opacity: 0.5 },
      ...([-1, 1] as const).flatMap((x) =>
        ([-1, 1] as const).flatMap((z): Item[] => [
          { k: 'bond', a: [0.67 * x, 0, 0], b: [1.22 * x, 0, 0.93 * z] },
          { k: 'atom', p: [1.22 * x, 0, 0.93 * z], label: 'H', r: 12 },
        ]),
      ),
      ...([-1, 1] as const).flatMap((x): Item[] => [
        { k: 'lobe', o: [0.67 * x, 0, 0], d: [0, 1, 0], L: 62, W: 20, phase: 'in', opacity: 0.8 },
        { k: 'lobe', o: [0.67 * x, 0, 0], d: [0, -1, 0], L: 62, W: 20, phase: 'out', opacity: 0.8 },
      ]),
      { k: 'atom', p: [-0.67, 0, 0], label: 'C', r: 15 },
      { k: 'atom', p: [0.67, 0, 0], label: 'C', r: 15 },
    ],
  },
  sp: {
    mol: 'ethyne',
    note: 'a straight line. each carbon keeps two p orbitals, at right angles to each other, for its two π bonds.',
    items: [
      { k: 'bond', a: [-1.66, 0, 0], b: [1.66, 0, 0], w: 2.2 },
      { k: 'atom', p: [-1.66, 0, 0], label: 'H', r: 12 },
      { k: 'atom', p: [1.66, 0, 0], label: 'H', r: 12 },
      ...([-1, 1] as const).flatMap((x): Item[] =>
        ([
          [0, 1, 0],
          [0, 0, 1],
        ] as V3[]).flatMap((d): Item[] => [
          { k: 'lobe', o: [0.6 * x, 0, 0], d, L: 58, W: 18, phase: 'in', opacity: 0.8 },
          { k: 'lobe', o: [0.6 * x, 0, 0], d: [-d[0], -d[1], -d[2]], L: 58, W: 18, phase: 'out', opacity: 0.8 },
        ]),
      ),
      { k: 'atom', p: [-0.6, 0, 0], label: 'C', r: 15 },
      { k: 'atom', p: [0.6, 0, 0], label: 'C', r: 15 },
    ],
  },
}

export function Shapes() {
  const [h, setH] = useState<H>('sp3')
  const s = shapes[h]
  return (
    <Fig
      n={5}
      stick={<Stick spec={{ sp3: sticks.methane, sp2: sticks.ethene, sp: sticks.ethyne }[h]} />}
      title="the shapes, in 3D"
      hint="switch molecules; drag to turn"
      controls={<Seg label="molecule" value={h} options={(['sp3', 'sp2', 'sp'] as H[]).map((k) => ({ k, label: `${shapes[k].mol} (${hyb[k].name})` }))} onChange={setH} />}
      caption={s.note}
    >
      <Scene3D items={s.items} view={{ yaw: 0.4, pitch: 0.3, n: 0 }} height={290} label={`${s.mol}: ${hyb[h].shape}, about ${hyb[h].angle}`}>
        <T x={20} y={272} anchor="start" size={20} ink="green">
          {hyb[h].shape} · {hyb[h].angle}
        </T>
      </Scene3D>
    </Fig>
  )
}
