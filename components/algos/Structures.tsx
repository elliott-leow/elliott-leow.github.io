'use client'

/* lectures 9 and 10: union-find, universal hashing, perfect hashing */
import { useMemo, useState, type ReactNode } from 'react'
import { Box, Btn, Cells, Chart, Fig, Line, Seg, Slider, T, r1, type Tone } from './kit'
import { components, depth, find, height, makeDSU, union, type DSU, type Opts } from '@/lib/algos/dsu'
import { buildFKS, collisionFree, collisionProbability, collisions, fksLookup, hab, loads } from '@/lib/algos/hashing'
import { rng, ri } from '@/lib/algos/rng'

/* ================================================================== union-find */

const clone = (d: DSU): DSU => ({ parent: d.parent.slice(), rank: d.rank.slice(), size: d.size.slice() })
type Lay = { v: number; x: number; y: number; kids: Lay[] }
function forest(d: DSU) {
  const kids: number[][] = d.parent.map(() => [])
  d.parent.forEach((p, i) => p !== i && kids[p].push(i))
  const units = (v: number): number => (kids[v].length ? kids[v].reduce((s, k) => s + units(k), 0) : 1)
  const U = 30
  let x = 10
  const place = (v: number, x0: number, y: number): Lay => {
    let cx = x0
    const ks = kids[v].map((k) => {
      const l = place(k, cx, y + 44)
      cx += units(k) * U
      return l
    })
    const w = units(v) * U
    return { v, x: ks.length ? (ks[0].x + ks[ks.length - 1].x) / 2 : x0 + w / 2, y, kids: ks }
  }
  const roots = d.parent.map((p, i) => (p === i ? i : -1)).filter((i) => i >= 0)
  const out = roots.map((r) => {
    const l = place(r, x, 24)
    x += units(r) * U + 14
    return l
  })
  return { trees: out, width: x }
}

export function UnionFindLab() {
  const N = 12
  const [d, setD] = useState<DSU>(() => makeDSU(N))
  const [o, setO] = useState<Opts>({ byRank: true, compress: true })
  const [sel, setSel] = useState<number[]>([])
  const [path, setPath] = useState<number[]>([])
  const [steps, setSteps] = useState(0)
  const [msg, setMsg] = useState('')
  const reset = (opts = o) => {
    setD(makeDSU(N))
    setSel([])
    setPath([])
    setSteps(0)
    setMsg('')
    setO(opts)
  }
  const pick = (v: number) => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s.slice(-1), v]))
  const doUnion = () => {
    if (sel.length < 2) return
    const c = clone(d)
    const r = union(c, sel[0], sel[1], o)
    setD(c)
    setSteps(steps + r.steps)
    setPath([])
    setMsg(r.linked ? `union(${sel[0]}, ${sel[1]}): root ${r.child} goes under root ${r.top}. ${r.steps} steps` : `${sel[0]} and ${sel[1]} were already together. ${r.steps} steps`)
    setSel([])
  }
  const doFind = () => {
    if (sel.length < 1) return
    const c = clone(d)
    const r = find(c, sel[0], o)
    setD(c)
    setSteps(steps + r.hops)
    setPath(r.path)
    setMsg(`find(${sel[0]}): followed ${r.hops} pointer${r.hops === 1 ? '' : 's'} to root ${r.root}${o.compress ? ', then pointed everything on the path at it' : ''}`)
  }
  const chain = () => {
    const c = makeDSU(N)
    let s = 0
    for (let i = 0; i + 1 < N; i++) s += union(c, i, i + 1, o).steps
    setD(c)
    setSteps(s)
    setPath([])
    setSel([])
    setMsg(`union(0,1), union(1,2), … union(${N - 2},${N - 1}): ${s} steps in all. height now ${height(c)}`)
  }
  const rand = () => {
    const r = rng(Date.now() % 100000)
    const c = clone(d)
    const a = ri(r, 0, N - 1)
    let b = ri(r, 0, N - 1)
    if (b === a) b = (a + 1) % N
    const x = union(c, a, b, o)
    setD(c)
    setSteps(steps + x.steps)
    setMsg(`union(${a}, ${b}): ${x.steps} steps`)
    setPath([])
  }
  const { trees, width } = forest(d)
  const H = Math.max(...d.parent.map((_, i) => depth(d, i))) * 44 + 70
  const nodes: ReactNode[] = []
  const edges: ReactNode[] = []
  const walk = (l: Lay) => {
    l.kids.forEach((k) => {
      edges.push(<Line key={`${l.v}-${k.v}`} x1={l.x} y1={l.y} x2={k.x} y2={k.y} tone={path.includes(l.v) && path.includes(k.v) ? 'red' : 'pencil'} w={path.includes(l.v) && path.includes(k.v) ? 2.6 : 1.3} />)
      walk(k)
    })
    nodes.push(
      <g key={l.v} onClick={() => pick(l.v)} style={{ cursor: 'pointer' }} role="button" aria-label={`element ${l.v}`}>
        <circle cx={r1(l.x)} cy={r1(l.y)} r={12} fill={path.includes(l.v) ? 'rgba(238,213,111,0.75)' : 'var(--orb-paper)'} stroke={sel.includes(l.v) ? 'var(--blue-pen)' : 'var(--ink)'} strokeWidth={sel.includes(l.v) ? 3 : 1.3} />
        <text x={r1(l.x)} y={r1(l.y + 4)} textAnchor="middle" fontSize={12} className="orb-t" fill="var(--ink)">
          {l.v}
        </text>
        {d.parent[l.v] === l.v && o.byRank && (
          <text x={r1(l.x + 15)} y={r1(l.y - 10)} fontSize={10} className="orb-t" fill="var(--blue-pen)">
            r{d.rank[l.v]}
          </text>
        )}
      </g>,
    )
  }
  trees.forEach(walk)
  // the same chain of unions, all four ways
  const table = useMemo(() => {
    const rows: { label: string; h: number; s: number; f0: number }[] = []
    for (const byRank of [false, true]) for (const compress of [false, true]) {
      const c = makeDSU(64)
      let s = 0
      for (let i = 0; i + 1 < 64; i++) s += union(c, i, i + 1, { byRank, compress }).steps
      const h = height(c)
      const f = find(c, 0, { byRank, compress })
      rows.push({ label: `${byRank ? 'by rank' : 'naive'}${compress ? ' + compression' : ''}`, h, s, f0: f.hops })
    }
    return rows
  }, [])
  return (
    <Fig
      n={22}
      title="union-find"
      hint="click two elements, then union. click one, then find. an arrow is 'my parent is…'"
      controls={
        <>
          <Btn onClick={doUnion} disabled={sel.length < 2}>union {sel.length === 2 ? `(${sel[0]}, ${sel[1]})` : ''}</Btn>
          <Btn onClick={doFind} disabled={sel.length < 1}>find {sel.length ? `(${sel[0]})` : ''}</Btn>
          <Btn onClick={rand}>random union</Btn>
          <Btn onClick={chain}>chain: (0,1) (1,2) (2,3)…</Btn>
          <Btn onClick={() => reset()}>reset</Btn>
          <Btn on={o.byRank} onClick={() => reset({ ...o, byRank: !o.byRank })}>union by rank</Btn>
          <Btn on={o.compress} onClick={() => reset({ ...o, compress: !o.compress })}>path compression</Btn>
        </>
      }
      caption={
        <>
          {msg || 'union links one root under the other. find climbs to the root.'} total pointer steps {steps}, height {height(d)}, {components(d).length} set{components(d).length === 1 ? '' : 's'}.
        </>
      }
    >
      <svg viewBox={`0 0 ${Math.max(560, width)} ${H}`} className="orb-svg" role="img" aria-label="the forest">
        {edges}
        {nodes}
      </svg>
      <div className="algo-scroll">
        <table className="algo-table" aria-label="the same 63 unions, four ways">
          <thead>
            <tr>
              <th>63 chained unions on 64 elements</th>
              <th>steps</th>
              <th>height</th>
              <th>find(0)</th>
            </tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={r.label} className={r.h > 8 ? 'is-bad' : 'is-good'}>
                <td>{r.label}</td>
                <td>{r.s}</td>
                <td>{r.h}</td>
                <td>{r.f0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        rank r ⇒ at least 2^r elements, so height ≤ log n. with compression too, m operations cost O(m α(n)): α ≤ 4 for any n you will ever meet.
      </p>
    </Fig>
  )
}

/* ================================================================== universal hashing */

export function UniversalHash() {
  const P = 101
  const [m, setM] = useState(10)
  const [mode, setMode] = useState<'adv' | 'rand'>('adv')
  const [draw, setDraw] = useState(1)
  const keys = useMemo(() => {
    if (mode === 'adv') return Array.from({ length: Math.min(12, Math.floor(100 / m)) }, (_, i) => (i + 1) * m)
    const r = rng(draw * 101 + 7)
    const s = new Set<number>()
    while (s.size < 10) s.add(ri(r, 0, 100))
    return [...s]
  }, [m, mode, draw])
  const { a, b } = useMemo(() => {
    const r = rng(draw * 7919 + m)
    return { a: ri(r, 1, P - 1), b: ri(r, 0, P - 1) }
  }, [draw, m])
  const fixed = (x: number) => x % m
  const rand = hab(a, b, P, m)
  const lf = loads(keys, fixed, m)
  const lr = loads(keys, rand, m)
  const avg = useMemo(() => {
    let tot = 0
    for (let aa = 1; aa < P; aa++) for (let bb = 0; bb < P; bb++) tot += collisions(keys, hab(aa, bb, P, m))
    return tot / ((P - 1) * P)
  }, [keys, m])
  const nk = keys.length
  const expect = (nk * (nk - 1)) / 2 / m
  const bar = (ld: number[], y: number, tone: Tone, label: string) => {
    const mx = Math.max(...lf, ...lr, 1)
    const w = Math.min(34, 480 / m)
    return (
      <g>
        <T x={4} y={y + 30} anchor="start" size={12} ink="pencil">
          {label}
        </T>
        {ld.map((c, i) => (
          <g key={i}>
            <Box x={70 + i * w} y={y + 50 - (c / mx) * 46} w={w - 2} h={Math.max(2, (c / mx) * 46)} tone={c > 1 ? (tone === 'red' ? 'red' : 'pink') : tone} label="" title={`slot ${i}: ${c}`} />
            <T x={70 + i * w + w / 2 - 1} y={y + 64} size={9} ink="pencil">
              {i}
            </T>
          </g>
        ))}
      </g>
    )
  }
  return (
    <Fig
      n={23}
      title="universal hashing: h(x) = ((a·x + b) mod p) mod m"
      hint="keys chosen against the fixed hash x mod m vs a random draw of (a, b)"
      controls={
        <>
          <Seg label="keys" value={mode} onChange={setMode} options={[{ k: 'adv', label: 'multiples of m (the adversary)' }, { k: 'rand', label: 'random keys' }]} />
          <Slider label="table size m" value={m} min={4} max={20} onChange={setM} format={(v) => v} />
          <Btn onClick={() => setDraw((x) => x + 1)}>draw a new (a, b)</Btn>
        </>
      }
      caption={
        <>
          {nk} keys ({keys.join(' ')}). x mod m: <b className={collisions(keys, fixed) > expect * 2 ? 'algo-no' : ''}>{collisions(keys, fixed)}</b> colliding pairs. this draw (a={a}, b={b}): <b>{collisions(keys, rand)}</b>. average over all 10,100 draws: <b className="algo-ok">{r1(avg)}</b> ≤ C({nk},2)/m = {r1(expect)}.
        </>
      }
    >
      <svg viewBox="0 0 560 160" className="orb-svg" role="img" aria-label="slot loads">
        {bar(lf, 0, 'red', 'x mod m')}
        {bar(lr, 80, 'blue', 'random (a,b)')}
      </svg>
    </Fig>
  )
}

type Fam = 'ab' | 'a' | 'fixed'
const famProb = (fam: Fam, x: number, y: number, p: number, m: number) => {
  if (fam === 'ab') return collisionProbability(x, y, p, m)
  if (fam === 'fixed') return { hit: x % m === y % m ? 1 : 0, total: 1, prob: x % m === y % m ? 1 : 0 }
  let hit = 0
  for (let a = 1; a < p; a++) if (((a * x) % p) % m === ((a * y) % p) % m) hit++
  return { hit, total: p - 1, prob: hit / (p - 1) }
}
export function CollisionProb() {
  const p = 11
  const [m, setM] = useState(4)
  const [fam, setFam] = useState<Fam>('ab')
  const [sel, setSel] = useState<[number, number]>([2, 7])
  const grid = useMemo(() => {
    const g: number[][] = []
    for (let x = 0; x < p; x++) {
      g.push([])
      for (let y = 0; y < p; y++) g[x].push(x === y ? NaN : famProb(fam, x, y, p, m).prob)
    }
    return g
  }, [m, fam])
  const worst = Math.max(...grid.flat().filter((v) => !Number.isNaN(v)))
  const c = famProb(fam, sel[0], sel[1], p, m)
  const universal = worst <= 1 / m + 1e-12
  const cw = 30
  return (
    <Fig
      n={24}
      title="exactly how often do two keys collide?"
      hint="every function in a family, p = 11. green: ≤ 1/m. red: worse. click a pair"
      controls={
        <>
          <Seg label="family" value={fam} onChange={setFam} options={[{ k: 'ab', label: 'h(a,b): (ax+b) mod p mod m' }, { k: 'a', label: 'drop the b: (ax) mod p mod m' }, { k: 'fixed', label: 'one fixed x mod m' }]} />
          <Slider label="table size m" value={m} min={2} max={9} onChange={setM} format={(v) => v} />
        </>
      }
      caption={
        <>
          keys {sel[0]} and {sel[1]}: {c.hit} of {c.total} functions collide = <b>{r1(c.prob * 100)}%</b> vs 1/m = {r1(100 / m)}%. worst pair anywhere: {r1(worst * 100)}%. {universal ? <b className="algo-ok">universal: every pair ≤ 1/m.</b> : <b className="algo-no">not universal: some pair collides more than 1/m.</b>}
        </>
      }
    >
      <svg viewBox="0 0 560 360" className="orb-svg" role="img" aria-label="collision probability for each pair of keys">
        {grid.map((row, x) =>
          row.map((v, y) => (
            <Box key={`${x}-${y}`} x={110 + y * cw} y={14 + x * (cw - 2)} w={cw - 2} h={cw - 4} size={8.5} tone={Number.isNaN(v) ? 'grey' : v <= 1 / m + 1e-12 ? 'green' : 'red'} label={Number.isNaN(v) ? '' : `${Math.round(v * 100)}`} ring={(sel[0] === x && sel[1] === y) || (sel[0] === y && sel[1] === x)} onClick={x === y ? undefined : () => setSel([Math.min(x, y), Math.max(x, y)])} title={`keys ${x}, ${y}`} />
          )),
        )}
        <T x={110 + (p * cw) / 2} y={p * (cw - 2) + 32} size={12} ink="pencil">
          key y →   (cell = % of functions that collide)
        </T>
        <T x={92} y={14 + (p * (cw - 2)) / 2} size={12} ink="pencil" anchor="end">
          key x ↓
        </T>
      </svg>
    </Fig>
  )
}

/* ================================================================== perfect hashing */

export function PerfectHash() {
  const P = 101
  const [n, setN] = useState(8)
  const [seed, setSeed] = useState(1)
  const [q, setQ] = useState<number | null>(null)
  const keys = useMemo(() => {
    const r = rng(seed * 977 + n)
    const s = new Set<number>()
    while (s.size < n) s.add(ri(r, 0, 100))
    return [...s].sort((a, b) => a - b)
  }, [n, seed])
  const f = useMemo(() => buildFKS(keys, P, seed * 31 + n), [keys, seed, n])
  const look = q === null ? null : fksLookup(f, q)
  const free = useMemo(() => collisionFree(keys.slice(0, 5), 101, 25), [keys])
  const totalAttempts = f.second.reduce((s, x) => s + x.attempts, 0)
  const rows = f.second.map((s, i) => ({ s, i })).filter((r) => r.s.size > 0)
  const H = rows.length * 34 + 20
  return (
    <Fig
      n={25}
      title="perfect hashing: no collisions, O(n) space, 2 probes"
      hint="hash into n buckets; a bucket with c keys gets its own table of size c², re-drawn until collision-free"
      controls={
        <>
          <Slider label="keys n" value={n} min={4} max={16} onChange={(v) => { setN(v); setQ(null) }} format={(v) => v} />
          <Btn onClick={() => { setSeed((s) => s + 1); setQ(null) }}>build again</Btn>
          <label className="orb-slider hand">
            <span className="orb-slider-label">look up</span>
            <input className="algo-num" value={q ?? ''} placeholder="0–100" onChange={(e) => setQ(e.target.value === '' ? null : Math.min(100, +e.target.value.replace(/[^0-9]/g, '') || 0))} aria-label="key to look up" />
          </label>
          <Btn onClick={() => setQ(keys[Math.floor(Math.random() * keys.length)])}>a key we stored</Btn>
        </>
      }
      caption={
        look ? (
          <>
            look up {q}: first hash → bucket {look.bucket}, second hash → slot {look.slot}. {look.found ? <b className="algo-ok">found: 2 probes</b> : <b className="algo-no">not stored: 2 probes</b>}
          </>
        ) : (
          <>
            first level: {f.firstTries} draw{f.firstTries === 1 ? '' : 's'} until Σc² ≤ 4n. total table space Σc² = <b>{f.space}</b> ≤ 4n = {4 * n}. second level took {totalAttempts} draws in all for {rows.length} buckets.
          </>
        )
      }
    >
      <svg viewBox={`0 0 560 ${H}`} className="orb-svg" role="img" aria-label="two-level perfect hash table">
        {rows.map(({ s, i }, r) => {
          const w = Math.min(24, 380 / s.size)
          return (
            <g key={i}>
              <T x={4} y={22 + r * 34} anchor="start" size={12} ink="pencil">
                {`bucket ${i}`}
              </T>
              <T x={70} y={22 + r * 34} anchor="start" size={11} ink="blue">
                {`c=${f.buckets[i].length} → size ${s.size}`}
              </T>
              <Cells x={170} y={8 + r * 34} cw={w} ch={22} size={w > 16 ? 10 : 7} items={s.slots.map((v, j) => ({ label: v ?? '', tone: (v !== null ? (q === v ? 'yellow' : 'green') : 'none') as Tone, ring: !!look && look.bucket === i && look.slot === j, dashed: v === null }))} />
              <T x={556} y={22 + r * 34} anchor="end" size={10} ink="pencil">
                {`${s.attempts} draw${s.attempts === 1 ? '' : 's'}`}
              </T>
            </g>
          )
        })}
      </svg>
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        why c² slots: c keys have C(c,2) pairs, each collides with chance ≤ 1/c², so expected collisions &lt; ½ and at least half of all draws are collision-free (for 5 of these keys into 25 slots: {free.good} of {free.total}, {r1((free.good / free.total) * 100)}%).
      </p>
    </Fig>
  )
}
