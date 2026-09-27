'use client'

/* figures for the middle of the note: allene, s character, bent bonds, bonding vs antibonding */
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import Scene3D, { type Item, type V3 } from './Scene3D'
import { Atom, Btn, Fig, LobeDots, Lobe, Meter, PH, Pulse, Seg, Slider, Stick, T, flip, useSpringValue, type Phase } from './kit'
import { sticks } from './sticks'

/* ================================================================== 7. allene */

type AlleneView = 'free' | 'side' | 'axis'
const views: Record<AlleneView, { yaw: number; pitch: number }> = {
  free: { yaw: 0.6, pitch: 0.35 },
  side: { yaw: 0, pitch: 0 },
  axis: { yaw: -Math.PI / 2 + 0.001, pitch: 0 },
}

export function Allene() {
  const [showP, setShowP] = useState(true)
  const [showPi, setShowPi] = useState(false)
  const [view, setView] = useState<AlleneView>('free')
  const [n, setN] = useState(0)
  const go = (v: AlleneView) => {
    setView(v)
    setN((k) => k + 1)
  }
  const C1: V3 = [-1.31, 0, 0]
  const C2: V3 = [0, 0, 0]
  const C3: V3 = [1.31, 0, 0]
  const p = (o: V3, d: V3, tag: 1 | 2): Item[] =>
    showP
      ? [
          { k: 'lobe', o, d, L: 70, W: 22, phase: 'in', opacity: tag === 1 ? 1 : 0.95 },
          { k: 'lobe', o, d: [-d[0], -d[1], -d[2]], L: 70, W: 22, phase: 'out' },
        ]
      : []
  const band = (a: V3, b: V3, d: V3): Item[] =>
    showPi
      ? [
          { k: 'band', a: [a[0] + d[0] * 0.45, a[1] + d[1] * 0.45, a[2] + d[2] * 0.45], b: [b[0] + d[0] * 0.45, b[1] + d[1] * 0.45, b[2] + d[2] * 0.45], w: 30, phase: 'in', opacity: 0.3 },
          { k: 'band', a: [a[0] - d[0] * 0.45, a[1] - d[1] * 0.45, a[2] - d[2] * 0.45], b: [b[0] - d[0] * 0.45, b[1] - d[1] * 0.45, b[2] - d[2] * 0.45], w: 30, phase: 'out', opacity: 0.3 },
        ]
      : []
  const Z: V3 = [0, 0, 1]
  const Y: V3 = [0, 1, 0]
  const items: Item[] = [
    { k: 'bond', a: C1, b: C3, w: 2.4 },
    // left CH2 lies in the xy plane, right CH2 in the xz plane
    ...([-1, 1] as const).flatMap((s): Item[] => [
      { k: 'bond', a: C1, b: [-1.86, 0.93 * s, 0] },
      { k: 'atom', p: [-1.86, 0.93 * s, 0], label: 'H', r: 11 },
      { k: 'bond', a: C3, b: [1.86, 0, 0.93 * s] },
      { k: 'atom', p: [1.86, 0, 0.93 * s], label: 'H', r: 11 },
    ]),
    ...p(C1, Z, 1),
    ...p(C2, Z, 1),
    ...p(C2, Y, 2),
    ...p(C3, Y, 2),
    ...band(C1, C2, Z),
    ...band(C2, C3, Y),
    { k: 'atom', p: C1, label: 'C', tag: 'sp²', tagInk: 'blue' },
    { k: 'atom', p: C2, label: 'C', tag: 'sp', tagInk: 'red' },
    { k: 'atom', p: C3, label: 'C', tag: 'sp²', tagInk: 'blue' },
  ]
  return (
    <Fig
      n={7}
      stick={<Stick spec={sticks.allene} />}
      title="allene, CH₂=C=CH₂"
      hint="drag to turn it, or pick a view"
      controls={
        <>
          <Seg
            label="view"
            value={view}
            options={[
              { k: 'free', label: 'spinning' },
              { k: 'side', label: 'from the side' },
              { k: 'axis', label: 'down the C=C=C' },
            ]}
            onChange={go}
          />
          <Btn on={showP} onClick={() => setShowP(!showP)}>
            p orbitals
          </Btn>
          <Btn on={showPi} onClick={() => setShowPi(!showPi)}>
            π bonds
          </Btn>
        </>
      }
      caption={
        view === 'axis'
          ? 'down the axis: the two CH₂ ends make a +.'
          : view === 'side'
            ? 'side on: one CH₂ flat, the other end-on.'
            : 'two p orbitals at 90° on the middle carbon → two π bonds at 90°.'
      }
    >
      <Scene3D items={items} view={{ ...views[view], n }} spin={view === 'free'} height={300} scale={84} label="Allene in 3D: the two terminal CH2 groups lie in perpendicular planes" onGrab={() => view !== 'free' && setView('free')} />
    </Fig>
  )
}

/* ================================================================== 8. s character and acidity */

type Hy = 'sp3' | 'sp2' | 'sp'
const sc: Record<Hy, { name: string; s: number; L: number; W: number; r: number; base: string; acid: string; pKa: number }> = {
  sp3: { name: 'sp³', s: 25, L: 150, W: 30, r: 84, base: 'CH₃CH₂⁻', acid: 'ethane', pKa: 50 },
  sp2: { name: 'sp²', s: 33, L: 128, W: 38, r: 70, base: 'CH₂=CH⁻', acid: 'ethene', pKa: 44 },
  sp: { name: 'sp', s: 50, L: 100, W: 48, r: 54, base: 'HC≡C⁻', acid: 'ethyne', pKa: 25 },
}

export function SCharacter() {
  const [h, setH] = useState<Hy>('sp3')
  const d = sc[h]
  const L = useSpringValue(d.L, 160, 16)
  const W = useSpringValue(d.W, 160, 16)
  const R = useSpringValue(d.r, 160, 18)
  const S = useSpringValue(d.s, 160, 20)
  const cx = 110
  const cy = 170
  // the s-character pie
  const a = (S / 100) * Math.PI * 2
  const px = 250
  const py = 60
  const pr = 26
  return (
    <Fig
      n={8}
      stick={<Stick spec={{ sp3: sticks.ethylAnion, sp2: sticks.vinylAnion, sp: sticks.acetylide }[h]} />}
      title="where the lone pair lives"
      hint="compare the three conjugate bases"
      controls={<Seg label="conjugate base" value={h} options={(['sp3', 'sp2', 'sp'] as Hy[]).map((k) => ({ k, label: <span className="orb-formula">{sc[k].base.slice(0, -1)}<sup>−</sup></span> }))} onChange={setH} />}
      caption={
        h === 'sp'
          ? '50% s: hugs the nucleus. most stable anion, most acidic.'
          : h === 'sp2'
            ? '33% s: a bit closer in.'
            : '25% s: reaches far out. least stable anion, least acidic.'
      }
    >
      <svg viewBox="0 0 560 320" className="orb-svg" role="img" aria-label={`${d.base}: lone pair in an ${d.name} orbital, ${d.s} percent s character, pKa about ${d.pKa}`}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--pencil)" strokeWidth={1.2} strokeDasharray="3 5" />
        <T x={cx} y={cy - R - 8} size={14}>
          how far out, on average
        </T>
        <Lobe x={cx} y={cy} angle={90} L={L} W={W} phase="in" fill={0.16} />
        <LobeDots x={cx} y={cy} angle={90} L={L} W={W} n={46} phase="in" seed={21} />
        <Lobe x={cx} y={cy} angle={270} L={L * 0.22} W={W * 0.5} phase="out" fill={0.12} />
        <circle cx={cx} cy={cy} r={12} fill="var(--orb-paper)" stroke="var(--ink)" strokeWidth={1.6} />
        <T x={cx} y={cy + 6} size={18} ink="ink">
          +
        </T>
        <T x={cx + 44} y={cy + 66} size={17} ink="blue" anchor="start">
          lone pair ( − )
        </T>

        {/* how much s is in the mix */}
        <circle cx={px} cy={py} r={pr} fill={PH.in} fillOpacity={0.12} stroke="var(--ink)" strokeWidth={1.4} />
        <path d={`M ${px} ${py} L ${px} ${py - pr} A ${pr} ${pr} 0 ${a > Math.PI ? 1 : 0} 1 ${px + Math.sin(a) * pr} ${py - Math.cos(a) * pr} Z`} fill={PH.hyb} fillOpacity={0.55} stroke="var(--ink)" strokeWidth={1.2} />
        <T x={px + 36} y={py - 4} anchor="start" size={17} ink="green">
          {Math.round(S)}% s
        </T>
        <T x={px + 36} y={py + 16} anchor="start" size={15}>
          {100 - Math.round(S)}% p
        </T>

        {/* the pKa ladder */}
        <T x={330} y={124} anchor="start" size={16}>
          pKa of the C–H
        </T>
        <T x={330} y={144} anchor="start" size={14}>
          (lower = more acidic)
        </T>
        {(['sp3', 'sp2', 'sp'] as Hy[]).map((k, i) => {
          const on = k === h
          const w = (sc[k].pKa / 50) * 190
          return (
            <g key={k} opacity={on ? 1 : 0.45}>
              <rect x={330} y={160 + i * 44} width={w} height={22} rx={4} fill={on ? PH.in : 'var(--pencil)'} fillOpacity={on ? 0.3 : 0.18} stroke={on ? PH.in : 'var(--pencil)'} strokeWidth={1.3} />
              <T x={336} y={176 + i * 44} anchor="start" size={15} ink="ink">
                {sc[k].acid}
              </T>
              <T x={330 + w + 8} y={177 + i * 44} anchor="start" size={16} ink={on ? 'blue' : 'pencil'}>
                ~{sc[k].pKa}
              </T>
            </g>
          )
        })}
      </svg>
    </Fig>
  )
}

/* ================================================================== 9. cyclopropane's bent bonds */

export function BentBonds() {
  const [theta, setTheta] = useState(109.5)
  const [touched, setTouched] = useState(false)
  const C = [
    [280, 92],
    [190, 248],
    [370, 248],
  ]
  const G = [280, 196]
  const delta = (theta - 60) / 2
  const side = 180
  const bulge = (side / 2) * Math.tan((delta * Math.PI) / 180)
  const n = -1 / Math.cos((theta * Math.PI) / 180)
  const pChar = n / (1 + n)
  const lobeFor = (i: number, j: number) => {
    const [x1, y1] = C[i]
    const [x2, y2] = C[j]
    const base = Math.atan2(x2 - x1, -(y2 - y1)) * (180 / Math.PI) // lobe angle is clockwise from up
    const cand = [base + delta, base - delta]
    const tip = (a: number) => [x1 + Math.sin((a * Math.PI) / 180) * 50, y1 - Math.cos((a * Math.PI) / 180) * 50]
    const dist = (a: number) => Math.hypot(tip(a)[0] - G[0], tip(a)[1] - G[1])
    return dist(cand[0]) > dist(cand[1]) ? cand[0] : cand[1]
  }
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 0],
  ]
  const top = [lobeFor(0, 1), lobeFor(0, 2)]
  const arcR = 36
  const pt = (a: number) => [C[0][0] + Math.sin((a * Math.PI) / 180) * arcR, C[0][1] - Math.cos((a * Math.PI) / 180) * arcR]
  const [lo, hi] = top[0] < top[1] ? [top[0], top[1]] : [top[1], top[0]]
  return (
    <Fig
      n={9}
      stick={<Stick spec={sticks.cyclopropane} />}
      title="cyclopropane's banana bonds"
      hint="squeeze the angle between each carbon's orbitals"
      controls={
        <>
          <Slider
            label="angle between one carbon's two ring orbitals"
            value={theta}
            min={92}
            max={109.5}
            step={0.5}
            onChange={(v) => {
              setTouched(true)
              setTheta(v)
            }}
            format={(v) => `${v.toFixed(1)}°`}
          />
          <Meter label={`p character (sp${n > 20 ? '∞' : n.toFixed(1)})`} value={pChar} tone="green" right={`${Math.round(pChar * 100)}%`} />
        </>
      }
      caption={
        theta > 107
          ? 'orbitals ~109.5° apart, ring 60°: they meet outside the line. bent bond.'
          : theta > 101
            ? '~104°: real cyclopropane. squeezing = more p character.'
            : 'nearly pure p (90°). strain either way.'
      }
    >
      <svg viewBox="0 0 560 320" className="orb-svg" role="img" aria-label={`Cyclopropane with bonding orbitals ${theta} degrees apart, bent outward`}>
        {edges.map(([i, j], k) => {
          const [x1, y1] = C[i]
          const [x2, y2] = C[j]
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2
          let nx = my - y1
          let ny = -(mx - x1)
          const l = Math.hypot(nx, ny)
          nx /= l
          ny /= l
          if ((mx + nx - G[0]) ** 2 + (my + ny - G[1]) ** 2 < (mx - G[0]) ** 2 + (my - G[1]) ** 2) {
            nx = -nx
            ny = -ny
          }
          return (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--pencil)" strokeWidth={1.2} strokeDasharray="4 6" />
              <path d={`M ${x1} ${y1} Q ${mx + nx * bulge} ${my + ny * bulge} ${x2} ${y2}`} fill="none" stroke={PH.hyb} strokeWidth={9} strokeOpacity={0.28} strokeLinecap="round" />
              <path d={`M ${x1} ${y1} Q ${mx + nx * bulge} ${my + ny * bulge} ${x2} ${y2}`} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
            </g>
          )
        })}
        {edges.flatMap(([i, j]) => [
          <Lobe key={`${i}${j}`} x={C[i][0]} y={C[i][1]} angle={lobeFor(i, j)} L={52} W={17} phase="hyb" fill={0.2} />,
          <Lobe key={`${j}${i}`} x={C[j][0]} y={C[j][1]} angle={lobeFor(j, i)} L={52} W={17} phase="hyb" fill={0.2} />,
        ])}
        <path d={`M ${pt(lo)[0]} ${pt(lo)[1]} A ${arcR} ${arcR} 0 0 1 ${pt(hi)[0]} ${pt(hi)[1]}`} fill="none" stroke="var(--red-pen)" strokeWidth={1.6} />
        <T x={C[0][0]} y={C[0][1] + 64} size={16} ink="red">
          {theta.toFixed(1)}°
        </T>
        <T x={G[0]} y={G[1] + 26} size={15}>
          ring: 60°
        </T>
        {C.map(([x, y], i) => (
          <Atom key={i} x={x} y={y} label="C" r={14} size={17} />
        ))}
        <T x={470} y={80} size={15} anchor="middle">
          dashed = the
        </T>
        <T x={470} y={98} size={15} anchor="middle">
          straight line
        </T>
        <T x={470} y={130} size={15} anchor="middle" ink="green">
          green = where the
        </T>
        <T x={470} y={148} size={15} anchor="middle" ink="green">
          bond actually is
        </T>
        <Pulse x={C[0][0]} y={C[0][1]} r={40} show={!touched} />
      </svg>
    </Fig>
  )
}

/* ================================================================== 10. bonding and antibonding */

export function MODiagram() {
  const [b, setB] = useState<Phase>('in')
  const [e, setE] = useState(2)
  const [touched, setTouched] = useState(false)
  const match = b === 'in'
  const sigmaE = Math.min(2, e)
  const starE = Math.max(0, e - 2)
  const order = (sigmaE - starE) / 2
  const yS = 272
  const yA = 190
  const yX = 96
  const homo = e === 0 ? null : starE > 0 ? yX : yS
  const lumo = e === 0 ? yS : e < 3 ? yX : null
  const arrows = (y: number, k: number, cx: number) => (
    <g>
      <AnimatePresence>
        {k >= 1 && <motion.path key="u" d={`M ${cx - 9} ${y + 12} L ${cx - 9} ${y - 18} M ${cx - 15} ${y - 11} L ${cx - 9} ${y - 18} L ${cx - 3} ${y - 11}`} stroke="var(--blue-pen)" strokeWidth={2} fill="none" strokeLinecap="round" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} />}
        {k >= 2 && <motion.path key="d" d={`M ${cx + 9} ${y - 18} L ${cx + 9} ${y + 12} M ${cx + 3} ${y + 5} L ${cx + 9} ${y + 12} L ${cx + 15} ${y + 5}`} stroke="var(--blue-pen)" strokeWidth={2} fill="none" strokeLinecap="round" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} />}
      </AnimatePresence>
    </g>
  )
  const msg = [
    'empty orbitals, no bond.',
    'one electron: half a bond.',
    'two electrons in σ: a full bond (H₂).',
    '3rd electron goes into σ*: cancels half the bond.',
    'σ and σ* both full: no bond. (why He₂ doesn’t exist.)',
  ][e]
  return (
    <Fig
      n={10}
      stick={<Stick spec={sticks.h2} />}
      title="two orbitals in, two orbitals out"
      hint="flip atom B's phase, and add electrons"
      controls={
        <>
          <Btn
            onClick={() => {
              setTouched(true)
              setB(flip(b))
            }}
          >
            flip atom B&apos;s phase
          </Btn>
          <Btn onClick={() => setE(Math.max(0, e - 1))} disabled={e === 0}>
            − electron
          </Btn>
          <Btn onClick={() => setE(Math.min(4, e + 1))} disabled={e === 4}>
            + electron
          </Btn>
          <Meter label="bond strength" value={order} tone={order >= 1 ? 'blue' : order > 0 ? 'yellow' : 'red'} right={order === 1 ? 'full' : order === 0.5 ? 'half' : 'none'} />
        </>
      }
      caption={
        <>
          {match ? 'same phase → σ. ' : 'opposite phase → σ*. '}
          {msg}
        </>
      }
    >
      <svg viewBox="0 0 560 330" className="orb-svg" role="img" aria-label={`Molecular orbital diagram with ${e} electrons. Bond strength ${order}`}>
        {/* energy axis */}
        <path d="M 34 312 L 34 36 M 27 46 L 34 36 L 41 46" stroke="var(--pencil)" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <T x={24} y={176} rotate={-90} size={15}>
          energy
        </T>

        {/* the two atomic orbitals */}
        <line x1={78} y1={yA} x2={146} y2={yA} stroke="var(--ink)" strokeWidth={2.4} strokeLinecap="round" />
        <line x1={414} y1={yA} x2={482} y2={yA} stroke="var(--ink)" strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={112} cy={yA - 34} r={18} fill={PH.in} fillOpacity={0.2} stroke={PH.in} strokeWidth={1.6} />
        <g onClick={() => (setTouched(true), setB(flip(b)))} style={{ cursor: 'pointer' }}>
          <circle cx={448} cy={yA - 34} r={18} fill={PH[b]} fillOpacity={0.2} stroke={PH[b]} strokeWidth={1.6} />
          <rect x={420} y={yA - 60} width={56} height={52} fill="transparent" />
        </g>
        <Pulse x={448} y={yA - 34} r={26} show={!touched} />
        <T x={112} y={yA + 24} size={15}>
          atom A
        </T>
        <T x={448} y={yA + 24} size={15}>
          atom B
        </T>
        {[yS, yX].map((y) => (
          <g key={y} stroke="var(--pencil)" strokeWidth={1.1} strokeDasharray="3 5">
            <line x1={146} y1={yA} x2={246} y2={y} />
            <line x1={414} y1={yA} x2={314} y2={y} />
          </g>
        ))}

        {/* the molecular orbitals */}
        {[
          { y: yS, on: match, label: 'σ', sub: 'bonding', k: sigmaE },
          { y: yX, on: !match, label: 'σ*', sub: 'antibonding', k: starE },
        ].map((m) => (
          <g key={m.label}>
            <motion.rect x={236} y={m.y - 26} width={88} height={40} rx={8} fill="var(--highlight)" initial={false} animate={{ opacity: m.on ? 1 : 0 }} />
            <line x1={246} y1={m.y} x2={314} y2={m.y} stroke="var(--ink)" strokeWidth={2.4} strokeLinecap="round" />
            {arrows(m.y, m.k, 280)}
            <T x={222} y={m.y + 6} anchor="end" size={22} ink="ink">
              {m.label}
            </T>
          </g>
        ))}
        {/* what each one looks like */}
        <g transform={`translate(280 ${yS + 36})`} opacity={match ? 1 : 0.4}>
          <path d="M -30 0 C -30 -14, -12 -14, 0 -8 C 12 -14, 30 -14, 30 0 C 30 14, 12 14, 0 8 C -12 14, -30 14, -30 0 Z" fill={PH.in} fillOpacity={0.22} stroke={PH.in} strokeWidth={1.5} />
          <T x={46} y={5} anchor="start" size={14}>
            same phase: merged
          </T>
        </g>
        <g transform={`translate(280 ${yX - 42})`} opacity={match ? 0.4 : 1}>
          <circle cx={-15} cy={0} r={12} fill={PH.in} fillOpacity={0.22} stroke={PH.in} strokeWidth={1.5} />
          <circle cx={15} cy={0} r={12} fill={PH.out} fillOpacity={0.22} stroke={PH.out} strokeWidth={1.5} />
          <line x1={0} y1={-18} x2={0} y2={18} stroke="var(--red-pen)" strokeDasharray="3 3" />
          <T x={34} y={5} anchor="start" size={14}>
            opposite: node
          </T>
        </g>

        {/* the HOMO and LUMO flags */}
        {homo !== null && (
          <motion.g initial={false} animate={{ y: homo }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
            <T x={330} y={5} anchor="start" size={16} ink="blue">
              ← HOMO
            </T>
          </motion.g>
        )}
        {lumo !== null && (
          <motion.g initial={false} animate={{ y: lumo }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
            <T x={330} y={homo === lumo ? 26 : 5} anchor="start" size={16} ink="red">
              ← LUMO
            </T>
          </motion.g>
        )}
        <T x={540} y={40} anchor="end" size={16}>
          {e} electron{e === 1 ? '' : 's'}
        </T>
      </svg>
    </Fig>
  )
}
