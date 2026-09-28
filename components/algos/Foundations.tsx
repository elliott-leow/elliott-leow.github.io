'use client'

/* lectures 1-3: multiplication tricks, recurrences, asymptotics, proofs */
import { useMemo, useState } from 'react'
import { Box, Btn, Cells, Chart, Fig, Seg, Slider, T, r1, type Tone } from './kit'
import { bitLen, fnById, fns, firstViolation, karatsuba, karatsubaFour, evalRec, levels, master, recurrences, strassenBlocks, thetaText, verdict } from '@/lib/algos/math'

/* ================================================================== Karatsuba */

export function KaratsubaDemo() {
  const [x, setX] = useState(54)
  const [y, setY] = useState(41)
  const X = BigInt(Math.max(0, x))
  const Y = BigInt(Math.max(0, y))
  const t = useMemo(() => karatsuba(X, Y), [x, y])
  const n = Math.max(bitLen(X), bitLen(Y), 2)
  const half = Math.ceil(n / 2)
  const four = karatsubaFour(X, Y, half)
  const ns = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
  const num = (label: string, v: number, set: (n: number) => void) => (
    <label className="orb-slider hand">
      <span className="orb-slider-label">{label}</span>
      <input className="algo-num" inputMode="numeric" value={v} onChange={(e) => set(Math.min(65535, +e.target.value.replace(/[^0-9]/g, '') || 0))} aria-label={label} />
    </label>
  )
  return (
    <Fig
      n={26}
      title="Karatsuba: 3 half-size multiplications, not 4"
      hint="split each number in half. the middle term comes free from one extra product"
      controls={
        <>
          {num('X', x, setX)}
          {num('Y', y, setY)}
          <Btn onClick={() => { setX(54); setY(41) }}>54 × 41</Btn>
          <Btn onClick={() => { setX(51234); setY(40963) }}>bigger</Btn>
        </>
      }
      caption={
        <>
          {x} × {y} = <b>{String(t.result)}</b> {t.result === X * Y ? '✓' : '✗'}. recursing all the way used {t.base} small multiplications; grade school uses ~{n * n / 4} of the same size. T(n) = 3T(n/2) + cn ⇒ Θ(n<sup>1.585</sup>).
        </>
      }
    >
      <div className="algo-scroll">
        <table className="algo-table" aria-label="the split">
          <tbody>
            <tr>
              <td>X = {String(X)} = A·2^{half} + B</td>
              <td>A = {String(four.A)}</td>
              <td>B = {String(four.B)}</td>
            </tr>
            <tr>
              <td>Y = {String(Y)} = C·2^{half} + D</td>
              <td>C = {String(four.C)}</td>
              <td>D = {String(four.D)}</td>
            </tr>
            <tr>
              <td>obvious: AC, AD, BC, BD (4 mults)</td>
              <td colSpan={2}>
                {String(four.AC)}, {String(four.AD)}, {String(four.BC)}, {String(four.BD)}
              </td>
            </tr>
            <tr className="is-good">
              <td>trick: AC, BD, (A+B)(C+D) (3 mults)</td>
              <td colSpan={2}>
                {String(four.AC)}, {String(four.BD)}, {String((four.A + four.B) * (four.C + four.D))}
              </td>
            </tr>
            <tr className="is-good">
              <td>AD + BC = (A+B)(C+D) − AC − BD</td>
              <td colSpan={2}>
                {String((four.A + four.B) * (four.C + four.D) - four.AC - four.BD)} = {String(four.AD + four.BC)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Chart
        series={[
          { label: 'grade school n²', color: 'red', pts: ns.map((m) => [Math.log2(m), m * m]) },
          { label: 'Karatsuba 3^(log n)', color: 'green', pts: ns.map((m) => [Math.log2(m), Math.pow(3, Math.log2(m))]) },
        ]}
        xLabel="log₂ n"
        height={170}
        yMin={0}
        yFmt={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))}
      />
    </Fig>
  )
}

/* ================================================================== Strassen */

export function StrassenDemo() {
  const [v, setV] = useState([1, 2, 3, 4, 5, 6, 7, 8])
  const [A, B, C, D, E, F, G, H] = v
  const s = strassenBlocks(A, B, C, D, E, F, G, H)
  const real = [A * E + B * G, A * F + B * H, C * E + D * G, C * F + D * H]
  const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const forms = ['(A+D)(E+H)', '(C+D)E', 'A(F−H)', 'D(G−E)', '(A+B)H', '(C−A)(E+F)', '(B−D)(G+H)']
  const ks = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
  return (
    <Fig
      n={27}
      title="Strassen: 7 block products, not 8"
      hint="X = [A B; C D], Y = [E F; G H]. edit the entries"
      controls={
        <>
          {names.map((nm, i) => (
            <label key={nm} className="orb-slider hand" style={{ flex: '0 1 auto' }}>
              <span className="orb-slider-label">{nm}</span>
              <input className="algo-num" style={{ width: '3.4em' }} value={v[i]} onChange={(e) => setV(v.map((q, j) => (j === i ? Math.max(-99, Math.min(99, +e.target.value.replace(/[^0-9-]/g, '') || 0)) : q)))} aria-label={nm} />
            </label>
          ))}
          <Btn onClick={() => setV(Array.from({ length: 8 }, () => Math.floor(Math.random() * 19) - 9))}>random</Btn>
        </>
      }
      caption={
        <>
          XY = [{s.out[0]} {s.out[1]}; {s.out[2]} {s.out[3]}] {s.out.every((q, i) => q === real[i]) ? '✓ matches the ordinary product' : '✗'}. T(n) = 7T(n/2) + cn² ⇒ Θ(n<sup>log₂7</sup>) = Θ(n<sup>2.807</sup>) vs n³.
        </>
      }
    >
      <div className="algo-scroll">
        <table className="algo-table" aria-label="the seven products">
          <tbody>
            {forms.map((f, i) => (
              <tr key={f}>
                <td>M{i + 1} = {f}</td>
                <td>{s.M[i]}</td>
              </tr>
            ))}
            <tr className="is-good">
              <td>M1 + M4 − M5 + M7 | M3 + M5</td>
              <td>
                {s.out[0]} | {s.out[1]}
              </td>
            </tr>
            <tr className="is-good">
              <td>M2 + M4 | M1 − M2 + M3 + M6</td>
              <td>
                {s.out[2]} | {s.out[3]}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Chart
        series={[{ label: 'n³ ÷ 7^(log₂ n): how many times fewer multiplications', color: 'green', pts: ks.map((m) => [Math.log2(m), (m ** 3) / Math.pow(7, Math.log2(m))]) }]}
        xLabel="log₂ n"
        height={170}
        yMin={1}
      />
    </Fig>
  )
}

/* ================================================================== recursion tree / master theorem */

const PRESETS: { label: string; a: number; b: number; k: number }[] = [
  { label: 'mergesort', a: 2, b: 2, k: 1 },
  { label: 'binary search', a: 1, b: 2, k: 0 },
  { label: 'quickselect (good pivot)', a: 1, b: 2, k: 1 },
  { label: 'Karatsuba', a: 3, b: 2, k: 1 },
  { label: 'Strassen', a: 7, b: 2, k: 2 },
  { label: 'HW1: 6T(n/4)+n', a: 6, b: 4, k: 1 },
]
export function RecursionTree() {
  const [a, setA] = useState(2)
  const [b, setB] = useState(2)
  const [k, setK] = useState(1)
  const m = master(a, b, k)
  const L = levels(a, b, k, Math.pow(b, 6))
  const mx = Math.max(...L.map((l) => l.total))
  const verdictText = m.kase === 'top' ? 'top level dominates' : m.kase === 'even' ? 'every level costs the same' : 'the leaves dominate'
  return (
    <Fig
      n={28}
      title="recursion tree: T(n) = a·T(n/b) + n^k"
      hint="each bar is the total work at one level. the master theorem is just which end is biggest"
      controls={
        <>
          <Slider label="a  (children)" value={a} min={1} max={9} onChange={setA} format={(v) => v} />
          <Slider label="b  (shrink)" value={b} min={2} max={5} onChange={setB} format={(v) => v} />
          <Slider label="k  (work n^k)" value={k} min={0} max={3} onChange={setK} format={(v) => v} />
          <div className="orb-seg" role="group" aria-label="presets">
            {PRESETS.map((p) => (
              <Btn key={p.label} onClick={() => { setA(p.a); setB(p.b); setK(p.k) }} on={p.a === a && p.b === b && p.k === k}>
                {p.label}
              </Btn>
            ))}
          </div>
        </>
      }
      caption={
        <>
          a / b^k = {a} / {r1(Math.pow(b, k))} = <b>{r1(m.alpha)}</b> ⇒ {verdictText} ⇒ <b>T(n) = Θ({thetaText(a, b, k).replace(/\^([0-9.]+)/g, '^$1')})</b>. {m.kase === 'bottom' ? `leaves: n^(log_${b} ${a}) = n^${r1(m.p)}.` : ''}
        </>
      }
    >
      <svg viewBox={`0 0 560 ${L.length * 30 + 10}`} className="orb-svg" role="img" aria-label="work per level">
        {L.map((l, i) => (
          <g key={i}>
            <T x={4} y={22 + i * 30} anchor="start" size={11} ink="pencil">
              {`${r1(l.nodes)} × n/${r1(Math.pow(b, i))}`}
            </T>
            <Box x={110} y={6 + i * 30} w={Math.max(3, (l.total / mx) * 380)} h={22} tone={m.kase === 'top' ? 'blue' : m.kase === 'even' ? 'yellow' : 'red'} label="" title={`level ${i}`} />
            <T x={120 + Math.max(3, (l.total / mx) * 380)} y={22 + i * 30} anchor="start" size={11} ink="ink">
              {l.total >= 1e6 ? l.total.toExponential(1) : String(Math.round(l.total))}
            </T>
          </g>
        ))}
      </svg>
    </Fig>
  )
}

/* ================================================================== guess and check a recurrence */

export function RecurrenceCheck() {
  const [id, setId] = useState('hw1c')
  const [mine, setMine] = useState(false)
  const [p, setP] = useState(1)
  const [q, setQ] = useState(0)
  const r = recurrences.find((x) => x.id === id)!
  const guess = (n: number) => (mine ? Math.pow(n, p) * Math.pow(Math.log2(n), q) : r.guess(n))
  const pts = useMemo(() => {
    const steps = r.integer ? Math.min(80, Math.round(Math.pow(10, r.hi) - 6)) : 40
    const out: [number, number][] = []
    for (let i = 0; i <= steps; i++) {
      const x = r.lo + ((r.hi - r.lo) * i) / steps
      const e = evalRec(r, x)
      if (r.integer && out.length && out[out.length - 1][0] === Math.log10(e.n)) continue
      out.push([Math.log10(e.n), Math.log10(e.T / guess(e.n))])
    }
    return out
  }, [id, mine, p, q])
  const tail = pts.slice(Math.floor(pts.length / 2))
  // least-squares slope of log10(ratio) against log10(n) over the second half: flat means Θ
  const mx = tail.reduce((a, z) => a + z[0], 0) / tail.length
  const my = tail.reduce((a, z) => a + z[1], 0) / tail.length
  const slope = tail.reduce((a, z) => a + (z[0] - mx) * (z[1] - my), 0) / (tail.reduce((a, z) => a + (z[0] - mx) ** 2, 0) || 1)
  const spread = Math.max(...tail.map((z) => z[1])) - Math.min(...tail.map((z) => z[1]))
  const flat = r.integer ? spread < 0.7 : Math.abs(slope) < 0.045
  return (
    <Fig
      n={29}
      title="guess a Θ, then check the ratio T(n) / guess"
      hint="a right guess makes the ratio flat. too small a guess: it climbs. too big: it falls"
      controls={
        <>
          <div className="orb-seg" role="radiogroup" aria-label="recurrence">
            {recurrences.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={id === x.id} className={`orb-btn hand ${id === x.id ? 'is-on' : ''}`} onClick={() => setId(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
          <Seg label="guess" value={mine ? 'mine' : 'notes'} onChange={(v) => setMine(v === 'mine')} options={[{ k: 'notes', label: `Θ(${r.guessLabel})` }, { k: 'mine', label: 'my own: n^p · log^q n' }]} />
          {mine && <Slider label="p" value={p} min={0} max={4} step={0.05} onChange={setP} format={(v) => r1(v)} />}
          {mine && <Slider label="q" value={q} min={0} max={3} onChange={setQ} format={(v) => v} />}
        </>
      }
      caption={
        <>
          T(n) = 1 for n ≤ 5. guess: <b>{mine ? `n^${r1(p)}${q ? ` log^${q} n` : ''}` : r.guessLabel}</b>. {flat ? <b className="algo-ok">ratio stays level: Θ of that guess.</b> : slope > 0 ? <b className="algo-no">ratio keeps climbing: guess too small.</b> : <b className="algo-no">ratio keeps falling: guess too big.</b>}{id === 'hw1b' ? ' (log log n grows too slowly to see on a plot: divide by n and unroll instead.)' : ''}
        </>
      }
    >
      <Chart series={[{ label: 'log₁₀ ( T(n) / guess )', color: flat ? 'green' : 'red', pts }]} xLabel="log₁₀ n" height={200} hline={0} />
    </Fig>
  )
}

/* ================================================================== big-O, ratio and witnesses */

const HW1: { label: string; f: string; g: string }[] = [
  { label: 'n tan n vs 2ⁿ', f: 'ntan', g: '2n' },
  { label: 'eⁿ vs 2ⁿ', f: 'en', g: '2n' },
  { label: 'n cos n vs n', f: 'ncos', g: 'n' },
  { label: '3ⁿ vs 3^(n+2)', f: '3n', g: '3n2' },
  { label: 'log(n^(1/5)) vs log(n³)', f: 'l15', g: 'l3' },
  { label: 'f+g vs max(f,g)', f: 'n2p', g: 'nmax' },
  { label: '2n²+27 vs n²', f: '2n2p27', g: 'n2' },
  { label: '2^(5 log n) vs n²', f: 'n5', g: 'n2' },
]
export function BigOLab() {
  const [f, setF] = useState('en')
  const [g, setG] = useState('2n')
  const [c, setC] = useState(3)
  const [n0, setN0] = useState(5)
  const F = fnById(f)
  const G = fnById(g)
  const v = useMemo(() => verdict(F, G), [f, g])
  const pts = useMemo(() => {
    const out: [number, number][] = []
    for (let n = 4; n <= 400; n += 2) {
      const l = F.ln(n) - G.ln(n)
      out.push([n, l / Math.LN10])
    }
    return out
  }, [f, g])
  const bad = firstViolation(F, G, c, n0, 400)
  const select = (val: string, set: (s: string) => void, label: string) => (
    <label className="orb-slider hand" style={{ flex: '0 1 auto' }}>
      <span className="orb-slider-label">{label}</span>
      <select className="algo-num" style={{ width: 'auto' }} value={val} onChange={(e) => set(e.target.value)} aria-label={label}>
        {fns.map((q) => (
          <option key={q.id} value={q.id}>
            {q.label}
          </option>
        ))}
      </select>
    </label>
  )
  return (
    <Fig
      n={30}
      title="f = O(g)? watch f/g, and try to find the witness (c, n₀)"
      hint="flat = Θ · falling = o · rising = ω. n is an integer here"
      controls={
        <>
          <div className="orb-seg" role="group" aria-label="statements">
            {HW1.map((h) => (
              <Btn key={h.label} on={h.f === f && h.g === g} onClick={() => { setF(h.f); setG(h.g) }}>
                {h.label}
              </Btn>
            ))}
          </div>
          {select(f, setF, 'f')}
          {select(g, setG, 'g')}
          <Slider label="c" value={c} min={0.1} max={10} step={0.1} onChange={setC} format={(v) => r1(v)} />
          <Slider label="n₀" value={n0} min={1} max={200} onChange={setN0} format={(v) => v} />
        </>
      }
      caption={
        <>
          <b>{F.label}</b> vs <b>{G.label}</b>: <b>{v.text}</b>. witness check f(n) ≤ {r1(c)}·g(n) for all n &gt; {n0}: {bad === 0 ? <b className="algo-ok">holds up to 400</b> : <b className="algo-no">fails at n = {bad}</b>}. O needs f/g bounded above; Ω needs it bounded below by a positive constant.
        </>
      }
    >
      <Chart series={[{ label: 'log₁₀ |f(n) / g(n)|', color: 'blue', pts: pts.filter(([, y]) => Number.isFinite(y)) }]} xLabel="n" height={190} hline={Math.log10(c)} marker={n0} />
    </Fig>
  )
}

/* ================================================================== loop invariants */

type Variant = 'ok' | 'skip'
const runInsertion = (a0: number[], variant: Variant) => {
  const a = a0.slice()
  const states: { a: number[]; i: number }[] = [{ a: a.slice(), i: 1 }]
  for (let i = 1; i < a.length; i++) {
    let j = i
    const lo = variant === 'ok' ? 0 : 1 // the bug: never compares with A[0]
    while (j > lo && a[j] < a[j - 1]) {
      ;[a[j], a[j - 1]] = [a[j - 1], a[j]]
      j--
    }
    states.push({ a: a.slice(), i: i + 1 })
  }
  return states
}
export function InvariantDemo() {
  const [arr, setArr] = useState([5, 2, 4, 6, 1, 3])
  const [variant, setVariant] = useState<Variant>('ok')
  const [step, setStep] = useState(0)
  const states = useMemo(() => runInsertion(arr, variant), [arr, variant])
  const s = states[Math.min(step, states.length - 1)]
  const prefix = s.a.slice(0, s.i)
  const sorted = prefix.every((v, i) => i === 0 || prefix[i - 1] <= v)
  const same = [...prefix].sort((x, y) => x - y).join() === [...arr.slice(0, s.i)].sort((x, y) => x - y).join()
  const holds = sorted && same
  const firstBad = states.findIndex((z) => {
    const p = z.a.slice(0, z.i)
    return !(p.every((v, i) => i === 0 || p[i - 1] <= v) && [...p].sort((x, y) => x - y).join() === [...arr.slice(0, z.i)].sort((x, y) => x - y).join())
  })
  return (
    <Fig
      n={31}
      title="proof by loop invariant: insertion sort"
      hint="at the start of iteration i, A[1..i−1] is sorted and has the original first i−1 elements"
      controls={
        <>
          <Btn onClick={() => setStep(step + 1)} disabled={step >= states.length - 1}>
            next iteration
          </Btn>
          <Btn onClick={() => setStep(0)}>reset</Btn>
          <Seg label="code" value={variant} onChange={(v) => { setVariant(v); setStep(0) }} options={[{ k: 'ok', label: 'correct' }, { k: 'skip', label: 'bug: stops before A[1]' }]} />
          <Btn onClick={() => { setArr([2, 1, 4, 3, 6, 5].map((x) => x)); setStep(0) }}>2 1 4 3 6 5</Btn>
          <Btn onClick={() => { setArr([6, 5, 4, 3, 2, 1]); setStep(0) }}>reversed</Btn>
          <Btn onClick={() => { setArr([5, 2, 4, 6, 1, 3]); setStep(0) }}>5 2 4 6 1 3</Btn>
        </>
      }
      caption={
        holds ? (
          <>
            iteration {s.i}: invariant <b className="algo-ok">holds</b>. initialization: i = 1, one element is sorted. maintenance: the insert keeps the prefix sorted. termination: i = n+1, the whole array.
          </>
        ) : (
          <>
            invariant <b className="algo-no">broken</b> {firstBad === step ? 'right here' : `(first at iteration ${states[firstBad]?.i})`}: the new element was never moved past A[1], so the prefix is not sorted. a proof by invariant fails exactly where the code is wrong.
          </>
        )
      }
    >
      <svg viewBox="0 0 560 70" className="orb-svg" role="img" aria-label="insertion sort state">
        <Cells x={80} y={20} cw={62} ch={34} size={16} items={s.a.map((v, i) => ({ label: v, tone: (i < s.i ? (holds ? 'green' : 'red') : 'none') as Tone, ring: i === s.i - 1 && step > 0 }))} />
        <T x={4} y={42} anchor="start" size={12} ink="pencil">
          {`i = ${s.i}`}
        </T>
        <T x={80 + (s.i * 62) / 2} y={14} size={11} ink={holds ? 'green' : 'red'}>
          {`A[1..${s.i - 1 < 1 ? 1 : s.i}]`}
        </T>
      </svg>
    </Fig>
  )
}
