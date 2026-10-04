'use client'

/* lectures 9 and 10: union-find, universal hashing, perfect hashing */
import { useMemo, useState } from 'react'
import { Box, Btn, Cells, Fig, Seg, Slider, T, r1, type Tone } from './kit'
import { Edge, Node, Narr, OpLog, PAINT, Pace, Run, Stage, draw, randInt, useFrames, useLog, type Speed } from './Live'
import { components, depth, find, height, makeDSU, union, type DSU, type Opts } from '@/lib/algos/dsu'
import { buildFKS, collisionFree, collisionProbability, collisions, fksLookup, hab, loads, matHash } from '@/lib/algos/hashing'
import { rng, ri } from '@/lib/algos/rng'

/* ================================================================== union-find */

const clone = (d: DSU): DSU => ({ parent: d.parent.slice(), rank: d.rank.slice(), size: d.size.slice() })
const UW = 30
const UF_MAX = 64
/** where every element sits: one tree per set, roots along the top */
function spreadSets(d: DSU) {
  const kids: number[][] = d.parent.map(() => [])
  d.parent.forEach((p, i) => p !== i && kids[p].push(i))
  const units = (v: number): number => (kids[v].length ? kids[v].reduce((sum, k) => sum + units(k), 0) : 1)
  const deep = height(d)
  // a tall tree (no union by rank) gets its levels closer together instead of running off the page
  const dy = Math.min(44, Math.max(28, 400 / Math.max(deep, 1)))
  const spots: { v: number; x: number; y: number }[] = []
  const place = (v: number, x0: number, y: number): number => {
    let cx = x0
    const xs = kids[v].map((k) => {
      const x = place(k, cx, y + dy)
      cx += units(k) * UW
      return x
    })
    const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : x0 + UW / 2
    spots[v] = { v, x, y }
    return x
  }
  let x = 10
  d.parent.forEach((p, i) => {
    if (p !== i) return
    place(i, x, 26)
    x += units(i) * UW + 10
  })
  const off = Math.max(0, (320 - x) / 2)
  spots.forEach((p) => (p.x += off))
  return { spots, w: x, h: 26 + deep * dy + 24 }
}

type UF = { d: DSU; path: number[]; hot: number[]; say: string }
const s = (n: number) => (n === 1 ? '' : 's')

export function UnionFindLab() {
  const [N, setN] = useState(12)
  const [o, setO] = useState<Opts>({ byRank: true, compress: true })
  const [share, setShare] = useState(55)
  const [grow, setGrow] = useState(true)
  const [speed, setSpeed] = useState<Speed>('normal')
  const [fit, setFit] = useState(false)
  const [steps, setSteps] = useState(0)
  const fr = useFrames<UF>({ d: makeDSU(12), path: [], hot: [], say: '' }, speed)
  const { log, count, add, clear } = useLog()
  const reset = (n = N, opts = o) => {
    fr.play([{ d: makeDSU(n), path: [], hot: [], say: '' }])
    clear()
    setSteps(0)
    setN(n)
    setO(opts)
  }
  const go = () => {
    const d0 = fr.end.d
    const sets = components(d0)
    const look = { byRank: o.byRank, compress: false }
    const c = clone(d0)
    const frames: UF[] = []
    const squash = (paths: number[][]) => {
      // only worth a frame when some node was more than one step from its root
      if (!o.compress || paths.every((p) => p.length < 3)) return
      for (const p of paths) find(c, p[0], o)
      frames.push({ d: clone(c), path: [], hot: paths.flatMap((p) => p.slice(0, -2)), say: `path compression: every node on the way now points straight at the root, so the next find from there is one step.` })
    }
    const walk = (f: { path: number[]; hops: number }) => (f.hops ? `${f.path.join(' → ')} (${f.hops} step${s(f.hops)})` : `${f.path[0]} is a root (0 steps)`)
    let cost = 0
    const n = d0.parent.length
    // make-set keeps a long run going: without it, everything ends up in one set and only finds are left
    const op = draw([{ k: 'union', w: share, ok: sets.length > 1 }, { k: 'find', w: (100 - share) * (grow ? 0.5 : 1), ok: true }, { k: 'make', w: sets.length > 1 ? (100 - share) * 0.5 : 100, ok: grow && n < UF_MAX }]) ?? 'find'
    if (op === 'make') {
      c.parent.push(n)
      c.rank.push(0)
      c.size.push(1)
      frames.push({ d: c, path: [], hot: [n], say: `make-set(${n}): a new element, in a set of its own. it is its own parent${o.byRank ? ', with rank 0' : ''}. no pointer is followed.` })
      add(`make-set(${n}): ${sets.length + 1} sets`)
    } else if (op === 'union') {
      const a = randInt(0, n - 1)
      // mostly a pair from two different sets, or late in a run nearly every union would do nothing
      const apart = d0.parent.map((_, i) => i).filter((i) => find(c, i, look).root !== find(c, a, look).root)
      const b = Math.random() < 0.85 ? apart[randInt(0, apart.length - 1)] : (a + randInt(1, n - 1)) % n
      const fa = find(c, a, look)
      const fb = find(c, b, look)
      frames.push({ d: d0, path: [...fa.path, ...fb.path], hot: [a, b], say: `union(${a}, ${b}): first find the root of each. ${walk(fa)}; ${walk(fb)}.` })
      squash([fa.path, fb.path])
      cost = fa.hops + fb.hops
      if (fa.root === fb.root) {
        frames.push({ d: clone(c), path: [], hot: [fa.root], say: `both have root ${fa.root}: ${a} and ${b} are already in the same set, so there is nothing to link.` })
        add(`union(${a}, ${b}): already together, ${cost} step${s(cost)}`)
      } else {
        const [ra, rb] = [c.rank[fa.root], c.rank[fb.root]]
        const r = union(c, fa.root, fb.root, o)
        cost++
        frames.push({
          d: clone(c),
          path: [],
          hot: [r.child, r.top],
          say: !o.byRank
            ? `link: root ${r.child} goes under root ${r.top}. with no rule, the first root always goes under the second, however tall it is.`
            : ra === rb
              ? `link: both roots have rank ${ra}, so either can go on top. ${r.child} goes under ${r.top}, and the rank of ${r.top} goes up to ${ra + 1}.`
              : `link by rank: root ${r.child} (rank ${Math.min(ra, rb)}) goes under root ${r.top} (rank ${Math.max(ra, rb)}). the smaller rank goes underneath, so nothing gets taller.`,
        })
        add(`union(${a}, ${b}): ${r.child} under ${r.top}, ${cost} step${s(cost)}`)
      }
    } else {
      const far = d0.parent.map((_, i) => i).filter((i) => depth(d0, i) > 1)
      const a = far.length && Math.random() < 0.7 ? far[randInt(0, far.length - 1)] : randInt(0, n - 1)
      const fa = find(c, a, look)
      cost = fa.hops
      frames.push({ d: d0, path: fa.path, hot: [a], say: `find(${a}): follow the parent pointers up. ${walk(fa)}. the root ${fa.root} is the name of ${a}'s set.${!o.compress && fa.hops > 1 ? ' nothing changes, so asking again costs the same.' : ''}` })
      squash([fa.path])
      add(`find(${a}) = ${fa.root}: ${cost} step${s(cost)}`)
    }
    fr.play(frames)
    setSteps(steps + cost)
  }
  const { d, path, hot } = fr.frame
  const { spots, w, h } = useMemo(() => spreadSets(d), [d])
  const sets = components(d).length
  const table = useMemo(() => {
    const rows: { label: string; h: number; s: number; f0: number }[] = []
    for (const byRank of [false, true]) for (const compress of [false, true]) {
      const c = makeDSU(64)
      let st = 0
      for (let i = 0; i + 1 < 64; i++) st += union(c, i, i + 1, { byRank, compress }).steps
      const hh = height(c)
      const f = find(c, 0, { byRank, compress })
      rows.push({ label: `${byRank ? 'by rank' : 'naive'}${compress ? ' + compression' : ''}`, h: hh, s: st, f0: f.hops })
    }
    return rows
  }, [])
  return (
    <Fig
      caption={
        <>
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
        rank r ⇒ at least 2^r elements, so height ≤ log n. with compression too, m operations cost O(m log* n) (lecture 9&apos;s proof; the book gets O(m α), even smaller). log* n ≤ 5 for any n you will ever meet.
      </p>
        </>
      }
      n={28}
      title="union-find"
      hint="one press does one random union or find. a line going up is 'my parent is…'. red = the pointers followed, yellow = what that step is about"
      controls={
        <>
          <span className="hand">settings:</span>
            <Btn on={o.byRank} onClick={() => reset(N, { ...o, byRank: !o.byRank })}>union by rank</Btn>
            <Btn on={o.compress} onClick={() => reset(N, { ...o, compress: !o.compress })}>path compression</Btn>
            <Slider label="elements to start with" value={N} min={4} max={32} step={4} onChange={(v) => reset(v)} format={(v) => v} />
            <Slider label="how often it is a union" value={share} min={0} max={100} step={5} onChange={setShare} format={(v) => `${v}%`} />
            <span className="hand">the rest is finds, and:</span>
            <Btn on={grow} onClick={() => setGrow(!grow)}>make-set (new elements, up to {UF_MAX})</Btn>
          <Pace speed={speed} setSpeed={setSpeed} fit={fit} setFit={setFit} />
        </>
      }
    >
      <Run onGo={go} onReset={() => reset()} count={count} />
      <Narr step={fr.step} steps={fr.steps}>
        {fr.frame.say ? (
          <>
            {fr.frame.say}
          </>
        ) : (
          <>{d.parent.length} elements, each in a set of its own: every one is a root. union links one root under another, and find climbs to the root. press the yellow button.</>
        )}
      </Narr>
      <Stage w={w} h={h} focus={hot.length ? spots[hot[0]].x : undefined} fit={fit} speed={speed} label="the forest of sets">
        {spots.map((p) => {
          const up = d.parent[p.v]
          const on = path.includes(p.v)
          return up === p.v ? null : <Edge key={p.v} x1={p.x} y1={p.y} x2={spots[up].x} y2={spots[up].y} stroke={on ? 'var(--red-pen)' : 'var(--pencil)'} w={on ? 2.8 : 1.3} />
        })}
        {spots.map((p) => (
          <Node key={p.v} x={p.x} y={p.y} r={12} label={p.v} paint={hot.includes(p.v) ? PAINT.hot : path.includes(p.v) ? PAINT.bad : PAINT.plain} tag={d.parent[p.v] === p.v && o.byRank ? `r${d.rank[p.v]}` : undefined} />
        ))}
      </Stage>
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        {d.parent.length} elements in {sets} set{s(sets)} · tallest tree {height(d)} · {steps} pointer step{s(steps)} in {count} operation{s(count)}
        {count ? ` = ${r1(steps / count)} each` : ''}
        {sets === 1 && (!grow || d.parent.length >= UF_MAX) ? ' · everything is one set now, so from here on it only does finds' : ''}
      </p>
      <OpLog log={log} />
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
      n={29}
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
      n={31}
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

/* ================================================================== the matrix method */

const LECTURE_H = [0b101, 0b011, 0b011, 0b010]
export function MatrixHash() {
  const U = 4
  const B = 3
  const M = 2 ** B
  const [cols, setCols] = useState(LECTURE_H)
  const [x, setX] = useState([1, 0, 1, 0])
  const [y, setY] = useState([0, 1, 1, 0])
  const [seed, setSeed] = useState(1)
  const hx = matHash(cols, x)
  const hy = matHash(cols, y)
  const di = x.findIndex((v, i) => v !== y[i])
  const same = di < 0
  // the key with a 1 in the column where they differ is the only one that column can move
  const moverIsY = !same && y[di] === 1
  const mover = moverIsY ? y : x
  const rest = same ? 0 : matHash(cols.map((c, i) => (i === di ? 0 : c)), mover)
  const still = moverIsY ? hx : hy
  const sample = useMemo(() => {
    const r = rng(seed * 7919 + 13)
    let hit = 0
    for (let t = 0; t < 400; t++) {
      const c = Array.from({ length: U }, () => ri(r, 0, M - 1))
      if (matHash(c, x) === matHash(c, y)) hit++
    }
    return hit
  }, [x, y, seed, M])
  const flip = (a: number[], i: number) => a.map((v, j) => (j === i ? 1 - v : v))
  const bit = (v: number, r: number) => (v >> (B - 1 - r)) & 1
  const bin = (v: number) => v.toString(2).padStart(B, '0')
  const X0 = 150
  const CW = 40
  const tone = (c: number): Tone => (x[c] && y[c] ? 'yellow' : x[c] ? 'blue' : y[c] ? 'red' : 'none')
  const vec = (v: number, x0: number, t: Tone, name: string) => (
    <g>
      <T x={x0 + 17} y={48} size={14} ink={t === 'blue' ? 'blue' : 'red'}>
        {name}
      </T>
      {[0, 1, 2].map((r) => (
        <Box key={r} x={x0} y={56 + r * 30} w={34} h={26} tone={t} label={bit(v, r)} />
      ))}
      <T x={x0 + 17} y={162} size={12} ink="pencil">
        {`slot ${v}`}
      </T>
    </g>
  )
  return (
    <Fig
      n={30}
      title="the matrix method: h(x) = h·x mod 2"
      hint="click any bit of x, y or the matrix. a key adds up (XOR) the columns where it has a 1"
      controls={
        <>
          <Btn onClick={() => { const r = rng(seed * 104729 + 7); setCols(Array.from({ length: U }, () => ri(r, 0, M - 1))); setSeed((v) => v + 1) }}>draw a random matrix</Btn>
          <Btn onClick={() => { setCols(LECTURE_H); setX([1, 0, 1, 0]); setY([0, 1, 1, 0]) }}>the lecture&apos;s example</Btn>
        </>
      }
      caption={
        same ? (
          <>x and y are the same key, so of course they land together. click a bit to make them differ.</>
        ) : (
          <>
            x and y differ in bit {di + 1}, and {moverIsY ? 'y' : 'x'} has the 1 there. column {di + 1} never moves h({moverIsY ? 'x' : 'y'}) = slot {still}, but each of its {M} settings gives a different h({moverIsY ? 'y' : 'x'}): exactly 1 of {M} collides, so Pr = 1/{M} = 1/M. this matrix: {hx === hy ? <b className="algo-no">collision</b> : <b className="algo-ok">no collision</b>}. in 400 random matrices they collided <b>{sample}</b> times (1/{M} of 400 is {400 / M}).
          </>
        )
      }
    >
      <svg viewBox="0 0 560 250" className="orb-svg" role="img" aria-label="a 3 by 4 binary matrix hashing two 4-bit keys into 8 slots">
        <T x={X0 - 10} y={30} size={14} ink="blue" anchor="end">
          key x
        </T>
        <Cells x={X0} y={10} cw={34} ch={26} gap={CW - 34} items={x.map((v, i) => ({ label: v, tone: (v ? 'blue' : 'none') as Tone, onClick: () => setX(flip(x, i)), title: `bit ${i + 1} of x` }))} />
        <T x={X0 - 10} y={104} size={14} ink="pencil" anchor="end">
          matrix h
        </T>
        {[0, 1, 2].map((r) => (
          <Cells key={r} x={X0} y={56 + r * 30} cw={34} ch={26} gap={CW - 34} items={cols.map((c, i) => ({ label: bit(c, r), tone: tone(i), ring: i === di, onClick: () => setCols(cols.map((v, j) => (j === i ? v ^ (1 << (B - 1 - r)) : v))), title: `row ${r + 1}, column ${i + 1}` }))} />
        ))}
        <T x={X0 - 10} y={176} size={14} ink="red" anchor="end">
          key y
        </T>
        <Cells x={X0} y={156} cw={34} ch={26} gap={CW - 34} items={y.map((v, i) => ({ label: v, tone: (v ? 'red' : 'none') as Tone, onClick: () => setY(flip(y, i)), title: `bit ${i + 1} of y` }))} />
        {vec(hx, 370, 'blue', 'h(x)')}
        {vec(hy, 450, 'red', 'h(y)')}
        {!same && (
          <g>
            <T x={X0 - 10} y={222} size={12} ink="pencil" anchor="end">
              {`column ${di + 1} set to…`}
            </T>
            {Array.from({ length: M }, (_, j) => (
              <Box key={j} x={X0 + j * 44} y={200} w={40} h={34} size={12} tone={(rest ^ j) === still ? 'green' : 'none'} ring={cols[di] === j} label={`slot ${rest ^ j}`} sub={bin(j)} onClick={() => setCols(cols.map((v, i) => (i === di ? j : v)))} title={`set column ${di + 1} to ${bin(j)}`} />
            ))}
          </g>
        )}
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
      n={32}
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
