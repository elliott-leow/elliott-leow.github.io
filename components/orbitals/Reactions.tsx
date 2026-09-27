'use client'

/* figures for the reaction half of the note: HOMO meets LUMO */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Atom, Bond, Btn, CurlyArrow, Fig, LobeDots, Lobe, Meter, PH, POrb, Pulse, Seg, Slider, T, clamp, mix, svgPoint, useProgress } from './kit'

const sub = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1)

/** a mechanism arrow from s to e, bowed to one side by `bend` */
function curly(sx: number, sy: number, ex: number, ey: number, bend: number) {
  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2
  const dx = ex - sx
  const dy = ey - sy
  const l = Math.hypot(dx, dy) || 1
  const cx = mx + (-dy / l) * bend
  const cy = my + (dx / l) * bend
  const tx = ex - cx
  const ty = ey - cy
  const tl = Math.hypot(tx, ty) || 1
  const a = Math.atan2(ty / tl, tx / tl)
  const h = (s: number) => [ex - Math.cos(a + s) * 11, ey - Math.sin(a + s) * 11]
  const [h1x, h1y] = h(0.45)
  const [h2x, h2y] = h(-0.45)
  return { d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`, head: `M ${h1x} ${h1y} L ${ex} ${ey} L ${h2x} ${h2y}` }
}

/** a nucleophile: an atom with a charge and a filled lone pair pointing at its target */
/** `spent` (0 → 1) fades the lone pair and the charge once they've become the new bond */
function Nu({ x, y, toward, label = 'Nu', dots = true, spent = 0 }: { x: number; y: number; toward: number; label?: string; dots?: boolean; spent?: number }) {
  return (
    <g>
      <g opacity={1 - spent}>
        <Lobe x={x} y={y} angle={toward} L={46} W={20} phase="in" fill={0.22} />
        {dots && <LobeDots x={x} y={y} angle={toward} L={46} W={20} n={16} phase="in" seed={5} />}
      </g>
      <Atom x={x} y={y} label={label} r={17} size={label.length > 1 ? 15 : 19} />
      <T x={x + 17} y={y - 12} size={18} ink="ink" opacity={1 - spent}>
        −
      </T>
    </g>
  )
}

/* ================================================================== 11. carbocation */

export function Carbocation() {
  const [side, setSide] = useState<'top' | 'bottom' | null>(null)
  const [tried, setTried] = useState<Set<string>>(new Set())
  const p = useProgress(side !== null, 1500)
  const q = sub(p, 0.55, 1)
  const cx = 280
  const cy = 165
  const dir = side === 'bottom' ? 1 : -1
  const nuY = mix(cy + dir * 210, cy + dir * 88, sub(p, 0, 0.6))
  const bend = dir === -1 ? 1 : -1 // the R groups fold away from the new bond
  const R: [number, number, string][] = [
    [185, 172, 'R'],
    [360, 196, 'R'],
    [350, 138, 'R'],
  ]
  const attack = (s: 'top' | 'bottom') => {
    setSide(null)
    setTried((t) => new Set(t).add(s))
    requestAnimationFrame(() => setSide(s))
  }
  return (
    <Fig
      n={11}
      title="a carbocation's empty p orbital"
      hint="send a nucleophile in"
      controls={
        <>
          <Btn onClick={() => attack('top')}>attack from the top</Btn>
          <Btn onClick={() => attack('bottom')}>attack from the bottom</Btn>
          <Btn onClick={() => setSide(null)} disabled={!side}>
            reset
          </Btn>
        </>
      }
      caption={
        tried.size === 2
          ? 'both lobes are equally open, so both sides work. that’s why these reactions often give a mix of both 3D products.'
          : side === null
            ? 'sp² carbon, three groups flat, one empty p orbital: a LUMO waiting for electrons.'
            : q < 0.5
              ? 'the nucleophile’s lone pair (its HOMO) lines up with the empty p lobe (the LUMO)…'
              : 'electrons flow in, the new bond forms, and the carbon puckers into sp³.'
      }
    >
      <svg viewBox="0 0 560 330" className="orb-svg" role="img" aria-label="A planar carbocation with an empty p orbital, attacked by a nucleophile">
        {/* the empty p orbital, filling from the attacked side */}
        <Lobe x={cx} y={cy} L={92} W={34} phase="in" fill={side === 'top' ? 0.05 + q * 0.2 : 0.03} dashed={!(side === 'top' && q > 0.3)} opacity={side === 'bottom' ? 1 - q * 0.8 : 1} />
        <Lobe x={cx} y={cy} angle={180} L={92} W={34} phase="out" fill={side === 'bottom' ? 0.05 + q * 0.2 : 0.03} dashed={!(side === 'bottom' && q > 0.3)} opacity={side === 'top' ? 1 - q * 0.8 : 1} />
        {R.map(([x, y, l], i) => {
          const yy = y + bend * q * 24
          return (
            <g key={i} opacity={i === 2 ? 0.75 : 1}>
              <Bond x1={cx} y1={cy} x2={x} y2={yy} />
              <Atom x={x} y={yy} label={l} r={13} size={16} />
            </g>
          )
        })}
        {side && (
          <>
            <Bond x1={cx} y1={cy} x2={cx} y2={nuY - dir * 17} opacity={q} w={2.2} />
            <Nu x={cx} y={nuY} toward={side === 'top' ? 180 : 0} spent={q} />
          </>
        )}
        <Atom x={cx} y={cy} label="C" r={16} size={20} />
        <T x={cx + 20} y={cy - 14} size={20} ink="red" opacity={1 - q}>
          +
        </T>
        <T x={cx + 70} y={cy - 92} anchor="start" size={16} ink="red" opacity={side ? 1 - p : 1}>
          empty p orbital = LUMO
        </T>
        <T x={70} y={300} anchor="start" size={18} ink={q > 0.5 ? 'green' : 'blue'}>
          {q > 0.5 ? 'sp³, tetrahedral' : 'sp², flat'}
        </T>
      </svg>
    </Fig>
  )
}

/* ================================================================== 12. SN2 */

const C0 = { x: 300, y: 165 }
const start = { x: 96, y: 76 }

export function SN2() {
  const svg = useRef<SVGSVGElement>(null)
  const [pos, setPos] = useState(start)
  const [dragging, setDragging] = useState(false)
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState<{ x: number; y: number; ov: number } | null>(null)
  const q = useProgress(done !== null, 1100)
  const auto = useRef(0)

  const vx = pos.x - C0.x
  const vy = pos.y - C0.y
  const d = Math.hypot(vx, vy) || 1
  const cos = -vx / d // 1 when coming straight in from the back
  const ov = done ? 1 : Math.pow(Math.max(0, cos), 3) * clamp((240 - d) / 150, 0, 1)
  const front = !done && cos < -0.3 && d < 170

  useEffect(() => {
    if (!done && ov > 0.8 && d < 118) setDone({ x: pos.x, y: pos.y, ov })
  }, [done, ov, d, pos.x, pos.y])

  const reset = () => {
    cancelAnimationFrame(auto.current)
    setDone(null)
    setPos(start)
  }
  const showMe = () => {
    reset()
    setTouched(true)
    const from = { x: 60, y: 90 }
    const to = { x: C0.x - 105, y: C0.y }
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 1300)
      const e = 1 - Math.pow(1 - t, 3)
      setPos({ x: mix(from.x, to.x, e), y: mix(from.y, to.y, e) + Math.sin(t * Math.PI) * 30 * (1 - t) })
      if (t < 1) auto.current = requestAnimationFrame(step)
    }
    auto.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(auto.current), [])

  // where everything is
  const u = done ? mix(1 - 0.55 * done.ov, -1, q) : 1 - 0.55 * ov // the umbrella: 1 open to the left, -1 flipped right
  const nu = done ? { x: mix(done.x, C0.x - 80, q), y: mix(done.y, C0.y, q) } : pos
  const brX = C0.x + 92 + ov * 18 + (done ? q * 150 : 0)
  const brA = done ? 1 - sub(q, 0.6, 1) * 0.6 : 1
  const toward = (Math.atan2(C0.x - nu.x, -(C0.y - nu.y)) * 180) / Math.PI
  const Hs: [number, number, number][] = [
    [-56, 1, 0],
    [48, 1, 0],
    [12, 0.7, 1],
  ]
  return (
    <Fig
      n={12}
      title={<>SN2: OH<sup>−</sup> meets CH₃Br</>}
      hint={<>drag the OH<sup>−</sup> toward the carbon. try the front too</>}
      controls={
        <>
          <Btn onClick={showMe}>show me</Btn>
          <Btn onClick={reset}>reset</Btn>
          <Meter label={<>electrons into σ*<sub>C–Br</sub></>} value={ov} tone={ov > 0.6 ? 'red' : 'blue'} right={`${Math.round(ov * 100)}%`} />
        </>
      }
      caption={
        done
          ? q < 1
            ? 'the C–Br σ* fills, the C–Br bond breaks, and the three H’s flip over like an umbrella in the wind.'
            : 'done: C–O made, bromide gone, carbon inverted. (hit reset to go again.)'
          : front
            ? 'bromine is in the way on this side, and the useful part of σ* isn’t here. no reaction.'
            : ov > 0.3
              ? 'good: from the back, the lone pair (HOMO) overlaps the big lobe of σ*C–Br (LUMO). watch the C–Br bond stretch.'
              : 'the big lobe of the empty σ*C–Br sticks out the back of the carbon, opposite the bromine.'
      }
    >
      <svg ref={svg} viewBox="0 0 560 330" className="orb-svg" role="img" aria-label="Hydroxide attacking methyl bromide from the back side">
        {/* the LUMO */}
        <g opacity={done ? 1 - q : 1}>
          <Lobe x={C0.x} y={C0.y} angle={-90} L={92} W={40} phase="in" fill={0.04 + ov * 0.24} dashed={ov < 0.4} />
          <Lobe x={brX} y={C0.y} angle={90} L={48} W={24} phase="out" fill={0.05} dashed />
          <line x1={(C0.x + brX) / 2} y1={C0.y - 34} x2={(C0.x + brX) / 2} y2={C0.y + 34} stroke="var(--red-pen)" strokeDasharray="3 4" strokeWidth={1.2} />
          <T x={172} y={C0.y + 70} size={15} ink="red">
            σ*C–Br (empty LUMO)
          </T>
        </g>

        {/* the old bond and the new one */}
        <Bond x1={C0.x} y1={C0.y} x2={brX} y2={C0.y} w={2.4 * (1 - 0.6 * ov)} dash={ov > 0.5 ? '5 5' : undefined} opacity={done ? 1 - q : 1} />
        <Bond x1={nu.x} y1={nu.y} x2={C0.x} y2={C0.y} w={2.2} dash={done && q > 0.7 ? undefined : '4 6'} opacity={done ? 1 : ov} />

        {Hs.map(([dy, s, back], i) => {
          const x = C0.x - u * 36 * s
          const y = C0.y + dy
          return (
            <g key={i} opacity={back ? 0.7 : 1}>
              <Bond x1={C0.x} y1={C0.y} x2={x} y2={y} w={1.8} />
              <Atom x={x} y={y} label="H" r={11} size={14} />
            </g>
          )
        })}
        <Atom x={C0.x} y={C0.y} label="C" r={16} size={20} />
        <g opacity={brA}>
          <Atom x={brX} y={C0.y} label="Br" r={20} size={17} />
          {done && q > 0.5 && (
            <T x={brX + 22} y={C0.y - 16} size={18} ink="ink">
              −
            </T>
          )}
        </g>

        {/* the nucleophile, which you can hold */}
        <g
          className={`orb-grab ${dragging ? 'is-dragging' : ''}`}
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            if (done) return
            cancelAnimationFrame(auto.current)
            e.currentTarget.setPointerCapture(e.pointerId)
            setDragging(true)
            setTouched(true)
          }}
          onPointerMove={(e) => {
            if (!dragging || !svg.current) return
            const p = svgPoint(svg.current, e)
            setPos({ x: clamp(p.x, 24, 536), y: clamp(p.y, 24, 306) })
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <circle cx={nu.x} cy={nu.y} r={34} fill="transparent" />
          <Bond x1={nu.x} y1={nu.y} x2={nu.x - Math.sin((toward * Math.PI) / 180) * 34} y2={nu.y + Math.cos((toward * Math.PI) / 180) * 34} w={1.8} />
          <Atom x={nu.x - Math.sin((toward * Math.PI) / 180) * 40} y={nu.y + Math.cos((toward * Math.PI) / 180) * 40} label="H" r={10} size={13} />
          <Nu x={nu.x} y={nu.y} toward={toward} label="O" dots spent={done ? q : 0} />
        </g>
        <Pulse x={nu.x} y={nu.y} r={28} show={!touched} />
        {!touched && (
          <T x={start.x + 38} y={start.y + 50} size={15} anchor="start" rotate={-4}>
            ↖ grab me
          </T>
        )}
      </svg>
    </Fig>
  )
}

/* ================================================================== 13. carbonyl */

export function Carbonyl() {
  const [p100, setP] = useState(0)
  const [show, setShow] = useState<'pi' | 'pistar' | 'arrows'>('pistar')
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    const t0 = performance.now()
    const from = p100 >= 100 ? 0 : p100
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 1800)
      setP(Math.round(mix(from, 100, t)))
      if (t < 1) raf = requestAnimationFrame(step)
      else setPlaying(false)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])
  const p = p100 / 100
  const q = sub(p, 0.5, 1)
  const C = { x: 250, y: 200 }
  const O = { x: 360, y: 200 }
  const a = (107 * Math.PI) / 180
  const dir = { x: Math.cos(a), y: -Math.sin(a) }
  const dist = mix(190, 74, sub(p, 0, 0.7))
  const nu = { x: C.x + dir.x * dist, y: C.y + dir.y * dist }
  const arrow1 = curly(C.x + dir.x * 150 + 16, C.y + dir.y * 150 + 10, C.x + 8, C.y - 20, -26)
  const arrow2 = curly(C.x + 55, C.y - 10, O.x + 6, O.y - 26, -30)
  const R: [number, number][] = [
    [180, 150],
    [180, 250],
  ]
  return (
    <Fig
      n={13}
      title="a nucleophile adds to C=O"
      hint="scrub the reaction, and switch what's drawn"
      controls={
        <>
          <Seg
            label="draw"
            value={show}
            options={[
              { k: 'pi', label: 'π (full)' },
              { k: 'pistar', label: 'π* (the LUMO)' },
              { k: 'arrows', label: 'curved arrows' },
            ]}
            onChange={setShow}
          />
          <Slider label="reaction" value={p100} min={0} max={100} onChange={(v) => (setPlaying(false), setP(v))} format={(v) => `${v}%`} />
          <Btn onClick={() => setPlaying(true)}>play</Btn>
        </>
      }
      caption={
        show === 'pi'
          ? 'the filled π orbital leans toward oxygen (it’s more electronegative). that’s where the π electrons mostly are.'
          : show === 'arrows'
            ? 'the same event in arrows: lone pair to carbon, and the π bond onto oxygen. the two arrows are one orbital story.'
            : p < 0.5
              ? 'the empty π* is the opposite: its big lobe is on carbon. that’s why nucleophiles hit the carbon. they come in at ~107°, not straight down.'
              : 'electrons pour into π*, so the π bond breaks. its electrons end up on oxygen as a negative charge.'
      }
    >
      <svg viewBox="0 0 560 330" className="orb-svg" role="img" aria-label="A nucleophile approaching a carbonyl carbon at about 107 degrees">
        {/* the orbitals */}
        <AnimatePresence mode="wait">
          {show === 'pi' && (
            <motion.g key="pi" initial={{ opacity: 0 }} animate={{ opacity: 1 - q }} exit={{ opacity: 0 }}>
              <POrb x={C.x} y={C.y} L={54} W={20} top="in" fill={0.2} />
              <POrb x={O.x} y={O.y} L={78} W={30} top="in" fill={0.2} />
              <LobeDots x={O.x} y={O.y} L={78} W={30} n={24} seed={11} />
              <LobeDots x={O.x} y={O.y} angle={180} L={78} W={30} n={24} phase="out" seed={12} />
              <T x={O.x + 50} y={O.y - 60} anchor="start" size={16} ink="blue">
                π: bigger on O
              </T>
            </motion.g>
          )}
          {show === 'pistar' && (
            <motion.g key="ps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Lobe x={C.x} y={C.y} L={84} W={32} phase="in" fill={0.04 + p * 0.26} dashed={p < 0.3} />
              <Lobe x={C.x} y={C.y} angle={180} L={84} W={32} phase="out" fill={0.04} dashed opacity={1 - q * 0.7} />
              <POrb x={O.x} y={O.y} L={50} W={20} top="out" fill={0.04} dashed opacity={1 - q * 0.7} />
              <line x1={(C.x + O.x) / 2 + 8} y1={C.y - 50} x2={(C.x + O.x) / 2 + 8} y2={C.y + 50} stroke="var(--red-pen)" strokeDasharray="3 4" strokeWidth={1.2} opacity={1 - q} />
              <T x={O.x + 40} y={O.y - 60} anchor="start" size={16} ink="red" opacity={1 - q}>
                π*: bigger on C
              </T>
            </motion.g>
          )}
        </AnimatePresence>

        {/* the approach path and its angle */}
        <line x1={C.x} y1={C.y} x2={C.x + dir.x * 220} y2={C.y + dir.y * 220} stroke="var(--pencil)" strokeWidth={1.1} strokeDasharray="2 6" />
        <path d={`M ${C.x + 30} ${C.y} A 30 30 0 0 0 ${C.x + dir.x * 30} ${C.y + dir.y * 30}`} fill="none" stroke="var(--pencil)" strokeWidth={1.3} />
        <T x={C.x + 30} y={C.y - 34} anchor="start" size={15}>
          ~107°
        </T>

        {/* the carbonyl */}
        <Bond x1={C.x} y1={C.y} x2={O.x} y2={O.y} />
        <Bond x1={C.x + 6} y1={C.y + 8} x2={O.x - 6} y2={O.y + 8} opacity={1 - q} />
        {R.map(([x, y], i) => {
          const yy = y + q * 22
          return (
            <g key={i}>
              <Bond x1={C.x} y1={C.y} x2={x} y2={yy} />
              <Atom x={x} y={yy} label="R" r={13} size={16} />
            </g>
          )
        })}
        <Bond x1={nu.x} y1={nu.y} x2={C.x} y2={C.y} opacity={q} />
        <Atom x={C.x} y={C.y} label="C" r={16} size={20} />
        <Atom x={O.x} y={O.y} label="O" r={16} size={20} />
        {/* oxygen's new lone pair and charge */}
        <g opacity={sub(q, 0.4, 1)}>
          <circle cx={O.x + 22} cy={O.y + 14} r={2.6} fill="var(--ink)" />
          <circle cx={O.x + 26} cy={O.y + 5} r={2.6} fill="var(--ink)" />
          <T x={O.x + 22} y={O.y - 14} size={20} ink="red" anchor="start">
            −
          </T>
        </g>
        <Nu x={nu.x} y={nu.y} toward={(Math.atan2(-dir.x, dir.y) * 180) / Math.PI} spent={q} />
        <CurlyArrow d={arrow1.d} head={arrow1.head} show={show === 'arrows'} />
        <CurlyArrow d={arrow2.d} head={arrow2.head} show={show === 'arrows'} delay={0.45} />
        <T x={70} y={312} anchor="start" size={17} ink={q > 0.5 ? 'green' : 'blue'}>
          carbon: {q > 0.5 ? 'sp³' : 'sp²'}
        </T>
      </svg>
    </Fig>
  )
}

/* ================================================================== 14. amide */

export function Amide() {
  const [mode, setMode] = useState<'p' | 'sp3'>('sp3')
  const [twist, setTwist] = useState(0)
  const t = useProgress(twist > 0, mode === 'p' ? 1300 : 1600)
  useEffect(() => {
    if (t >= 1) setTwist(0)
  }, [t])
  const ang = twist ? (mode === 'p' ? 60 * Math.sin(Math.PI * t) : 360 * t) : 0
  const c = Math.cos((ang * Math.PI) / 180)
  const s = Math.sin((ang * Math.PI) / 180)
  const O = { x: 150, y: 175 }
  const C = { x: 262, y: 175 }
  const N = { x: 374, y: 175 }
  const conj = mode === 'p'
  const x0 = O.x - 30
  const x1 = (conj ? N.x : C.x) + 30
  return (
    <Fig
      n={14}
      title="an amide's nitrogen lone pair"
      hint="put the lone pair in a p orbital, then try to twist"
      controls={
        <>
          <Seg
            label="nitrogen lone pair"
            value={mode}
            options={[
              { k: 'sp3', label: 'in an sp³ orbital' },
              { k: 'p', label: 'in a p orbital' },
            ]}
            onChange={(k) => {
              setTwist(0)
              setMode(k)
            }}
          />
          <Btn onClick={() => setTwist((n) => n + 1)} disabled={twist > 0}>
            twist the C–N bond
          </Btn>
        </>
      }
      caption={
        conj
          ? twist
            ? 'twisting pulls nitrogen’s p orbital out of line with the others, so it snaps back. amides stay flat.'
            : 'the lone pair joins the C=O π system: three p orbitals in a row, electrons spread over O, C and N. the C–N bond is now part double bond.'
          : twist
            ? 'with the lone pair stuck on nitrogen, nothing holds the bond flat. it spins like any single bond.'
            : 'lone pair stuck in an sp³ orbital on nitrogen: it can’t line up with the C=O p orbitals, so it’s left out of the π system.'
      }
    >
      <svg viewBox="0 0 560 320" className="orb-svg" role="img" aria-label={conj ? 'Amide with the nitrogen lone pair conjugated into the carbonyl' : 'Amide with the nitrogen lone pair isolated in an sp3 orbital'}>
        {/* the shared cloud */}
        <motion.g initial={false} animate={{ opacity: 1 }} key={mode}>
          <rect x={x0} y={82} width={x1 - x0} height={40} rx={20} fill={PH.in} fillOpacity={0.12} stroke={PH.in} strokeDasharray="6 5" strokeWidth={1.4} />
          <rect x={x0} y={228} width={x1 - x0} height={40} rx={20} fill={PH.out} fillOpacity={0.12} stroke={PH.out} strokeDasharray="6 5" strokeWidth={1.4} />
          {[0, 1].map((j) => (
            <circle key={j} cx={x0 + 20} cy={j ? 248 : 102} r={4} fill={j ? PH.out : PH.in} className="orb-roam" style={{ '--dx': `${x1 - x0 - 40}px`, '--dur': conj ? '2.2s' : '1.3s', animationDelay: `${-j * 1.1}s` } as React.CSSProperties} />
          ))}
        </motion.g>
        <POrb x={O.x} y={O.y} L={66} W={24} />
        <POrb x={C.x} y={C.y} L={66} W={24} />
        {conj ? (
          /* turning about the C–N axis tips the p orbital toward you, so it looks shorter */
          <g>
            <POrb x={N.x} y={N.y} L={72 * Math.max(0.2, Math.abs(c))} W={26} fill={0.24} />
            <LobeDots x={N.x} y={N.y} L={72 * Math.max(0.2, Math.abs(c))} W={26} n={18} seed={31} />
            <LobeDots x={N.x} y={N.y} angle={180} L={72 * Math.max(0.2, Math.abs(c))} W={26} n={18} phase="out" seed={32} />
          </g>
        ) : (
          <g transform={`rotate(${ang} ${N.x} ${N.y})`}>
            <Lobe x={N.x} y={N.y} angle={24} L={70} W={26} phase="hyb" fill={0.24} />
            <LobeDots x={N.x} y={N.y} angle={24} L={70} W={26} n={26} phase="hyb" seed={33} />
          </g>
        )}
        <Bond x1={O.x} y1={O.y} x2={C.x} y2={C.y} />
        <Bond x1={O.x + 6} y1={O.y + 7} x2={C.x - 6} y2={C.y + 7} />
        <Bond x1={C.x} y1={C.y} x2={N.x} y2={N.y} />
        <Bond x1={C.x + 6} y1={C.y + 7} x2={N.x - 6} y2={N.y + 7} dash="4 5" opacity={conj ? Math.max(0, c) : 0} />
        <Bond x1={C.x} y1={C.y} x2={C.x + 20} y2={C.y + 58} />
        <Atom x={C.x + 24} y={C.y + 68} label="R" r={12} size={15} />
        {[
          [1, -1],
          [1, 1],
        ].map(([, k], i) => {
          const hy = conj ? N.y + k * 30 * Math.max(0.3, Math.abs(c)) : N.y + (k > 0 ? 44 : -8) * c + s * 20 * k
          const hx = N.x + 62
          return (
            <g key={i}>
              <Bond x1={N.x} y1={N.y} x2={hx} y2={hy} w={1.8} />
              <Atom x={hx + 8} y={hy} label="H" r={11} size={14} />
            </g>
          )
        })}
        <Atom x={O.x} y={O.y} label="O" r={16} size={19} />
        <Atom x={C.x} y={C.y} label="C" r={16} size={19} />
        <Atom x={N.x} y={N.y} label="N" r={16} size={19} />
        <T x={(C.x + N.x) / 2 + 22} y={C.y + 30} size={14} opacity={conj ? 1 : 0}>
          partial double
        </T>
        <T x={60} y={306} anchor="start" size={17} ink={conj ? 'blue' : 'red'}>
          π system: {conj ? 'O, C and N (3 atoms)' : 'O and C only (2 atoms)'}
        </T>
      </svg>
    </Fig>
  )
}

/* ================================================================== 15. allyl anion */

type AllylView = 'A' | 'B' | 'real'

export function Allyl() {
  const [view, setView] = useState<AllylView>('A')
  const [flicking, setFlicking] = useState(false)
  useEffect(() => {
    if (!flicking) return
    let k = 0
    const id = window.setInterval(() => {
      k++
      if (k > 6) {
        window.clearInterval(id)
        setFlicking(false)
        setView('real')
        return
      }
      setView(k % 2 ? 'B' : 'A')
    }, 380)
    return () => window.clearInterval(id)
  }, [flicking])
  const X = [170, 280, 390]
  const Y = [205, 175, 205]
  const dens = view === 'A' ? [2, 1, 1] : view === 'B' ? [1, 1, 2] : [1.5, 1, 1.5]
  const spread = view === 'real'
  return (
    <Fig
      n={15}
      title="the allyl anion: where's the charge?"
      hint="flip between the drawings, then see the real thing"
      controls={
        <>
          <Seg
            label="picture"
            value={flicking ? ('' as AllylView) : view}
            options={[
              { k: 'A', label: 'drawing A' },
              { k: 'B', label: 'drawing B' },
              { k: 'real', label: 'what’s really there' },
            ]}
            onChange={(k) => {
              setFlicking(false)
              setView(k)
            }}
          />
          <Btn onClick={() => setFlicking(true)} disabled={flicking}>
            flip back and forth
          </Btn>
          <Meter label="room for the charge" value={spread ? 1 : 0.34} tone={spread ? 'green' : 'red'} right={spread ? '2 ends, shared' : '1 atom'} />
        </>
      }
      caption={
        flicking
          ? 'this is NOT what the molecule does. it doesn’t switch back and forth…'
          : spread
            ? '…it’s always this one blend: the charge is shared by both ends, half each. more room, lower energy. that’s resonance stabilisation.'
            : `drawing ${view} puts the whole negative charge on carbon ${view === 'A' ? 1 : 3}. it’s a fine drawing, but it isn’t the real molecule.`
      }
    >
      <svg viewBox="0 0 560 320" className="orb-svg" role="img" aria-label={spread ? 'Allyl anion with charge shared across both ends' : `Allyl anion resonance drawing ${view}`}>
        {/* the line drawing, in pen, top left */}
        <g transform="translate(56 34) scale(1.5)">
          <T x={30} y={-8} size={10}>
            the drawing
          </T>
          <path d="M 0 30 L 30 10 L 60 30" stroke="var(--ink)" strokeWidth={2} fill="none" strokeLinecap="round" />
          {view === 'A' && <path d="M 32 16 L 56 32" stroke="var(--ink)" strokeWidth={2} />}
          {view === 'B' && <path d="M 4 32 L 28 16" stroke="var(--ink)" strokeWidth={2} />}
          {spread && (
            <>
              <path d="M 4 34 L 28 18" stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="3 4" />
              <path d="M 32 18 L 56 34" stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="3 4" />
            </>
          )}
          {view !== 'B' && (
            <T x={-6} y={24} size={spread ? 13 : 17} ink="red" anchor="end">
              {spread ? '½−' : '−'}
            </T>
          )}
          {view !== 'A' && (
            <T x={66} y={24} size={spread ? 13 : 17} ink="red" anchor="start">
              {spread ? '½−' : '−'}
            </T>
          )}
        </g>

        {spread && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <path d={`M ${X[0] - 28} ${Y[0] - 40} C ${X[0] - 40} ${Y[0] - 120}, ${X[2] + 40} ${Y[2] - 120}, ${X[2] + 28} ${Y[2] - 40} C ${X[1] + 40} ${Y[1] - 50}, ${X[1] - 40} ${Y[1] - 50}, ${X[0] - 28} ${Y[0] - 40} Z`} fill={PH.in} fillOpacity={0.1} stroke={PH.in} strokeWidth={1.4} strokeDasharray="6 5" />
            <path d={`M ${X[0] - 28} ${Y[0] + 40} C ${X[0] - 40} ${Y[0] + 110}, ${X[2] + 40} ${Y[2] + 110}, ${X[2] + 28} ${Y[2] + 40} C ${X[1] + 40} ${Y[1] + 80}, ${X[1] - 40} ${Y[1] + 80}, ${X[0] - 28} ${Y[0] + 40} Z`} fill={PH.out} fillOpacity={0.1} stroke={PH.out} strokeWidth={1.4} strokeDasharray="6 5" />
          </motion.g>
        )}
        <Bond x1={X[0]} y1={Y[0]} x2={X[1]} y2={Y[1]} />
        <Bond x1={X[1]} y1={Y[1]} x2={X[2]} y2={Y[2]} />
        {X.map((x, i) => (
          <g key={i}>
            <POrb x={x} y={Y[i]} L={70} W={26} fill={0.08 + dens[i] * 0.05} />
            <LobeDots key={`${view}-${i}-u`} x={x} y={Y[i]} L={70} W={26} n={Math.round(dens[i] * 14)} seed={40 + i} />
            <LobeDots key={`${view}-${i}-d`} x={x} y={Y[i]} angle={180} L={70} W={26} n={Math.round(dens[i] * 14)} phase="out" seed={50 + i} />
            <Atom x={x} y={Y[i]} label="C" r={15} size={18} />
            <T x={x + 26} y={Y[i] + 8} size={22} anchor="start" ink="red">
              {dens[i] === 2 ? '−' : dens[i] === 1.5 ? 'δ−' : ''}
            </T>
          </g>
        ))}
        <T x={520} y={300} anchor="end" size={15}>
          C1 · C2 · C3
        </T>
      </svg>
    </Fig>
  )
}

/* ================================================================== 16. quiz */

type Q = { rxn: string; homo: string[]; lumo: string[]; why: string }
const quiz: Q[] = [
  { rxn: 'OH⁻ + CH₃Br', homo: ['O lone pair', 'C–H σ bond', 'C–Br σ*'], lumo: ['C–Br σ*', 'C–Br σ', 'O lone pair'], why: 'SN2: the oxygen lone pair pushes into σ*C–Br, from the back.' },
  { rxn: 'H₂C=CH₂ + H–Br', homo: ['C=C π', 'C=C π*', 'C–H σ'], lumo: ['H–Br σ*', 'C=C π*', 'Br lone pair'], why: 'the alkene’s π bond is the donor. electrons into σ*H–Br break the H–Br bond.' },
  { rxn: 'H₂O + (CH₃)₃C⁺', homo: ['O lone pair', 'O–H σ*', 'the empty p orbital'], lumo: ['the empty p orbital on C⁺', 'O–H σ', 'C–H σ'], why: 'water’s lone pair fills the carbocation’s empty p orbital.' },
  { rxn: 'CN⁻ + a ketone (C=O)', homo: ['C lone pair of CN⁻', 'C=O π', 'C≡N π*'], lumo: ['C=O π*', 'C=O π', 'C≡N π*'], why: 'cyanide’s lone pair goes into the ketone’s π*, so the C=O π bond breaks onto oxygen.' },
]
// the answer isn't always the first chip
const order = [
  [1, 0, 2],
  [2, 1, 0],
  [0, 2, 1],
  [1, 2, 0],
]

export function HomoLumoQuiz() {
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<{ homo?: number; lumo?: number }>({})
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const q = quiz[i]
  const right = pick.homo === 0 && pick.lumo === 0
  const answered = pick.homo !== undefined && pick.lumo !== undefined
  const wrongOnce = useRef(false)
  const choose = (k: 'homo' | 'lumo', j: number) => {
    if (pick[k] === 0) return
    setPick({ ...pick, [k]: j })
  }
  const next = () => {
    const firstTry = right && !wrongOnce.current
    if (firstTry) setScore((s) => s + 1)
    wrongOnce.current = false
    setPick({})
    if (i === quiz.length - 1) setFinished(true)
    else setI(i + 1)
  }
  useEffect(() => {
    if ((pick.homo !== undefined && pick.homo !== 0) || (pick.lumo !== undefined && pick.lumo !== 0)) wrongOnce.current = true
  }, [pick])

  const row = (k: 'homo' | 'lumo', label: string, opts: string[]) => (
    <div className="orb-quiz-row">
      <span className="orb-quiz-q hand">{label}</span>
      <div className="orb-quiz-opts">
        {order[i].map((j) => {
          const chosen = pick[k] === j
          const state = chosen ? (j === 0 ? 'is-right' : 'is-wrong') : ''
          return (
            <button key={j} type="button" className={`orb-chip ${state}`} onClick={() => choose(k, j)} disabled={pick[k] === 0 && !chosen}>
              {opts[j]}
              {chosen && j === 0 && (
                <svg className="orb-chip-mark" viewBox="0 0 30 24" aria-hidden>
                  <motion.path d="M 3 13 C 6 15, 9 19, 11 21 C 15 13, 21 7, 28 2" fill="none" stroke="var(--orb-hyb)" strokeWidth={2.4} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
                </svg>
              )}
              {chosen && j !== 0 && (
                <svg className="orb-chip-x" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
                  <motion.path d="M 2 12 C 30 8, 60 13, 98 8" fill="none" stroke="var(--red-pen)" strokeWidth={2} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25 }} />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <Fig n={16} title="find the HOMO, find the LUMO" hint={finished ? undefined : `${i + 1} of ${quiz.length}`} tape={2}>
      <div className="orb-quiz">
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div key="done" className="orb-quiz-done hand" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="orb-quiz-score">
                {score} / {quiz.length} on the first try
              </p>
              <p>{score === quiz.length ? 'that’s the whole trick. find the electrons, find the empty orbital.' : 'every one was the same question: where are the electrons, and where can they go?'}</p>
              <Btn
                onClick={() => {
                  setI(0)
                  setScore(0)
                  setFinished(false)
                }}
              >
                again
              </Btn>
            </motion.div>
          ) : (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <p className="orb-quiz-rxn">{q.rxn}</p>
              {row('homo', 'the electrons come from (HOMO):', q.homo)}
              {row('lumo', 'the electrons go into (LUMO):', q.lumo)}
              <div className="orb-quiz-foot">
                <span className="hand orb-quiz-why">{right ? q.why : answered ? 'not quite. try another one.' : ''}</span>
                <Btn onClick={next} disabled={!right}>
                  {i === quiz.length - 1 ? 'finish' : 'next →'}
                </Btn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Fig>
  )
}
