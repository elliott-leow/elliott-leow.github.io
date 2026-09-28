'use client'

/* lecture 8: binary heaps and binomial heaps */
import { useMemo, useState, type ReactNode } from 'react'
import { Box, Btn, Cells, Chart, Fig, Line, Seg, Slider, T, r1 } from './kit'
import { buildBySink, buildBySwim, decreaseKey, deleteAt, depthOf, extractMin, insert, potential, sinkBound, swim, sink, bhDecreaseKey, bhExtractMin, bhInsert, bhValid, meld, orders, sizeH, treesIn, freshId, type BH, type BT, type MeldStep } from '@/lib/algos/heaps'
import { rng, shuffle, ri } from '@/lib/algos/rng'

/* ------------------------------------------------------------------ heap as a tree */
function HeapTree({ a, hot = [], picked, onPick }: { a: number[]; hot?: number[]; picked?: number | null; onPick?: (i: number) => void }) {
  const n = a.length
  if (!n) return <svg viewBox="0 0 560 40" className="orb-svg"><T x={280} y={26} size={14}>empty</T></svg>
  const levels = depthOf(n - 1) + 1
  const R = Math.min(15, 250 / Math.pow(2, levels - 1) / 1.1 + 3)
  const pos = (i: number) => {
    const d = depthOf(i)
    const first = 2 ** d - 1
    const cnt = 2 ** d
    return { x: 20 + ((i - first + 0.5) / cnt) * 520, y: 20 + d * 46 }
  }
  return (
    <svg viewBox={`0 0 560 ${levels * 46 + 8}`} className="orb-svg" role="img" aria-label="heap as a binary tree">
      {a.map((_, i) => (i > 0 ? <Line key={`e${i}`} x1={pos(i).x} y1={pos(i).y} x2={pos((i - 1) >> 1).x} y2={pos((i - 1) >> 1).y} tone="pencil" w={1.2} /> : null))}
      {a.map((v, i) => (
        <g key={i} onClick={onPick ? () => onPick(i) : undefined} style={onPick ? { cursor: 'pointer' } : undefined} role={onPick ? 'button' : undefined} aria-label={`heap position ${i} value ${v}`}>
          <circle cx={r1(pos(i).x)} cy={r1(pos(i).y)} r={r1(R)} fill={hot.includes(i) ? 'rgba(238,213,111,0.7)' : 'var(--orb-paper)'} stroke={picked === i ? 'var(--blue-pen)' : 'var(--ink)'} strokeWidth={picked === i ? 3 : 1.4} />
          <text x={r1(pos(i).x)} y={r1(pos(i).y + 4)} textAnchor="middle" fontSize={R > 11 ? 12 : 9} className="orb-t" fill="var(--ink)">
            {v}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* ================================================================== binary heap */

type Frames = { arrs: number[][]; hots: number[][]; label: string; cost: number; dPhi: number }
const start = [6, 10, 8, 17, 11, 25, 12, 21, 18, 19]

export function BinaryHeapLab() {
  const [heap, setHeap] = useState<number[]>(start)
  const [fr, setFr] = useState<Frames | null>(null)
  const [f, setF] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [val, setVal] = useState(7)
  const cur = fr ? fr.arrs[Math.min(f, fr.arrs.length - 1)] : heap
  const hot = fr ? fr.hots[Math.min(f, fr.arrs.length - 1)] : []
  const run = (label: string, first: number[], swaps: { i: number; j: number }[], final: number[], dPhi: number, extra = 0) => {
    const arrs = [first]
    const hots: number[][] = [[]]
    let a = first.slice()
    for (const s of swaps) {
      ;[a[s.i], a[s.j]] = [a[s.j], a[s.i]]
      arrs.push(a.slice())
      hots.push([s.i, s.j])
    }
    setFr({ arrs, hots, label, cost: 1 + swaps.length + extra, dPhi })
    setF(arrs.length - 1)
    setHeap(final)
    setPicked(null)
  }
  const doInsert = () => {
    const r = insert(heap, val)
    run(`insert ${val}: put it at the next open spot, then swim up`, [...heap, val], r.swaps, r.heap, potential(r.heap.length) - potential(heap.length))
  }
  const doExtract = () => {
    if (!heap.length) return
    const r = extractMin(heap)
    const first = heap.slice()
    ;[first[0], first[first.length - 1]] = [first[first.length - 1], first[0]]
    const pre = first.slice(0, -1)
    run(`extract-min: swap the root with the last node, delete it, then sink the new root`, pre, r.swaps, r.heap, potential(r.heap.length) - potential(heap.length))
  }
  const doDecrease = () => {
    if (picked === null) return
    const nv = Math.max(0, heap[picked] - 10)
    const r = decreaseKey(heap, picked, nv)
    const first = heap.slice()
    first[picked] = nv
    run(`decrease-key: ${heap[picked]} → ${nv}, then swim up`, first, r.swaps, r.heap, 0)
  }
  const doDelete = () => {
    if (picked === null) return
    const last = heap.length - 1
    const first = heap.slice()
    first[picked] = first[last]
    const pre = first.slice(0, -1)
    const r = deleteAt(heap, picked)
    run(`delete ${heap[picked]}: move the last node into its place, then swim up or sink down`, picked === last ? heap.slice(0, -1) : pre, r.swaps, r.heap, potential(r.heap.length) - potential(heap.length))
  }
  const phi = potential(cur.length)
  return (
    <Fig
      n={19}
      title="binary heap"
      hint="click a node to pick it. drag the slider to replay the swaps"
      controls={
        <>
          <label className="orb-slider hand">
            <span className="orb-slider-label">value</span>
            <input className="algo-num" value={val} onChange={(e) => setVal(Math.min(99, +e.target.value.replace(/[^0-9]/g, '') || 0))} aria-label="value to insert" />
          </label>
          <Btn onClick={doInsert} disabled={heap.length >= 31}>insert {val}</Btn>
          <Btn onClick={doExtract} disabled={!heap.length}>extract-min</Btn>
          <Btn onClick={doDecrease} disabled={picked === null || heap[picked] === 0}>decrease picked by 10</Btn>
          <Btn onClick={doDelete} disabled={picked === null}>delete picked</Btn>
          <Btn onClick={() => { setHeap(start); setFr(null); setPicked(null) }}>reset</Btn>
          {fr && fr.arrs.length > 1 && <Slider label="replay" value={Math.min(f, fr.arrs.length - 1)} min={0} max={fr.arrs.length - 1} onChange={setF} format={(v) => `${v} / ${fr.arrs.length - 1} swaps`} />}
        </>
      }
      caption={
        fr ? (
          <>
            {fr.label}. {fr.arrs.length - 1} swap{fr.arrs.length === 2 ? '' : 's'}. Φ = Σ depths = {phi}; last op ΔΦ = {fr.dPhi}; amortized ≈ cost + ΔΦ = {fr.cost} + {fr.dPhi} = <b>{fr.cost + fr.dPhi}</b>.
          </>
        ) : (
          <>heap order: every node ≤ its children, so the minimum is the root. the tree is complete, so its height is ≤ log n.</>
        )
      }
    >
      <HeapTree a={cur} hot={hot} picked={picked} onPick={(i) => fr && f < fr.arrs.length - 1 ? undefined : setPicked(i)} />
      <svg viewBox={`0 0 560 40`} className="orb-svg" role="img" aria-label="heap array">
        <Cells x={4} y={6} cw={Math.min(34, Math.floor(552 / Math.max(cur.length, 1)))} ch={26} size={12} items={cur.map((v, i) => ({ label: v, tone: hot.includes(i) ? 'yellow' : 'none', sub: undefined }))} />
      </svg>
      <p className="algo-say" style={{ margin: '0' }}>
        array: children of i are 2i+1 and 2i+2. Φ counts depth, so an insert deepens by d (swims ≤ d) while extract-min removes a depth-d node and sinks ≤ d: <b>extract-min is O(1) amortized</b>.
      </p>
    </Fig>
  )
}

/* ================================================================== build heap */

export function BuildHeap() {
  const [n, setN] = useState(15)
  const [kind, setKind] = useState<'random' | 'desc'>('desc')
  const [seed, setSeed] = useState(1)
  const [k, setK] = useState(0)
  const A = useMemo(() => {
    const base = Array.from({ length: n }, (_, i) => i + 1)
    return kind === 'desc' ? base.slice().reverse() : shuffle(base, rng(seed * 13 + n))
  }, [n, kind, seed])
  const sinkR = useMemo(() => buildBySink(A), [A])
  const swimR = useMemo(() => buildBySwim(A), [A])
  // frames for the bottom-up build
  const frames = useMemo(() => {
    let h = A.slice()
    const out = [{ arr: h, at: -1, sw: 0 }]
    let total = 0
    for (let i = (h.length >> 1) - 1; i >= 0; i--) {
      const r = sink(h, i)
      h = r.heap
      total += r.swaps.length
      out.push({ arr: h, at: i, sw: total })
    }
    return out
  }, [A])
  const fi = Math.min(k, frames.length - 1)
  const fr = frames[fi]
  const ns = [8, 16, 32, 64, 128, 256, 512, 1024]
  const desc = (m: number) => Array.from({ length: m }, (_, i) => m - i)
  return (
    <Fig
      n={20}
      title="building a heap: sink from the bottom vs insert one by one"
      hint="bottom-up: sink every node, last parent first"
      controls={
        <>
          <Btn onClick={() => setK(fi + 1)} disabled={fi >= frames.length - 1}>
            sink next node
          </Btn>
          <Btn onClick={() => setK(frames.length - 1)} disabled={fi >= frames.length - 1}>
            finish
          </Btn>
          <Btn onClick={() => setK(0)}>reset</Btn>
          <Seg label="input" value={kind} onChange={(v) => { setKind(v); setK(0) }} options={[{ k: 'desc', label: 'descending (worst)' }, { k: 'random', label: 'random' }]} />
          <Slider label="n" value={n} min={7} max={63} onChange={(v) => { setN(v); setK(0) }} format={(v) => v} />
          <Btn onClick={() => { setSeed((s) => s + 1); setK(0) }}>reshuffle</Btn>
        </>
      }
      caption={
        <>
          bottom-up: <b>{sinkR.swaps}</b> swaps in total (bound: Σ h·n/2^(h+1) = {sinkBound(n)} ≤ n). one at a time with swim-up: <b>{swimR.swaps}</b> swaps.
          {fr.at >= 0 ? ` just sank position ${fr.at}.` : ''}
        </>
      }
    >
      <HeapTree a={fr.arr} hot={fr.at >= 0 ? [fr.at] : []} />
      <Chart
        series={[
          { label: 'n inserts (descending input)', color: 'red', pts: ns.map((m) => [Math.log2(m), buildBySwim(desc(m)).swaps]) },
          { label: 'sink from bottom', color: 'green', pts: ns.map((m) => [Math.log2(m), buildBySink(desc(m)).swaps]) },
        ]}
        xLabel="log₂ n"
        yLabel="swaps"
        height={190}
        yMin={0}
      />
    </Fig>
  )
}

/* ================================================================== binomial heaps */

type Lay = { t: BT; x: number; y: number; kids: Lay[] }
const U = 26
const unitsOf = (t: BT): number => (t.kids.length ? t.kids.reduce((s, k) => s + unitsOf(k), 0) : 1)
function placeTree(t: BT, x0: number, y: number): Lay {
  let cx = x0
  const kids = t.kids
    .slice()
    .reverse()
    .map((k) => {
      const l = placeTree(k, cx, y + 38)
      cx += unitsOf(k) * U
      return l
    })
  const w = unitsOf(t) * U
  const x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : x0 + w / 2
  return { t, x, y, kids }
}
function BinomialSvg({ heap, hot = [], picked, onPick }: { heap: BH; hot?: number[]; picked?: number | null; onPick?: (id: number) => void }) {
  const ts = heap.map((t, k) => (t ? { t, k } : null)).filter(Boolean) as { t: BT; k: number }[]
  if (!ts.length) return <svg viewBox="0 0 560 40" className="orb-svg"><T x={280} y={26} size={14}>empty heap</T></svg>
  let x = 10
  const placed = ts.map(({ t, k }) => {
    const l = placeTree(t, x, 30)
    x += unitsOf(t) * U + 22
    return { l, k }
  })
  const W = Math.max(560, x)
  const maxK = Math.max(...ts.map((q) => q.k))
  const H = 44 + maxK * 38 + 20
  const nodes: ReactNode[] = []
  const edges: ReactNode[] = []
  const walk = (l: Lay) => {
    l.kids.forEach((c) => {
      edges.push(<Line key={`e${l.t.id}-${c.t.id}`} x1={l.x} y1={l.y} x2={c.x} y2={c.y} tone="pencil" w={1.3} />)
      walk(c)
    })
    nodes.push(
      <g key={l.t.id} onClick={onPick ? () => onPick(l.t.id) : undefined} style={onPick ? { cursor: 'pointer' } : undefined} role={onPick ? 'button' : undefined} aria-label={`node ${l.t.key}`}>
        <circle cx={r1(l.x)} cy={r1(l.y)} r={11} fill={hot.includes(l.t.id) ? 'rgba(238,213,111,0.75)' : 'var(--orb-paper)'} stroke={picked === l.t.id ? 'var(--blue-pen)' : 'var(--ink)'} strokeWidth={picked === l.t.id ? 3 : 1.3} />
        <text x={r1(l.x)} y={r1(l.y + 4)} textAnchor="middle" fontSize={10.5} className="orb-t" fill="var(--ink)">
          {l.t.key}
        </text>
      </g>,
    )
  }
  placed.forEach(({ l }) => walk(l))
  return (
    <div className="algo-scroll">
    <svg viewBox={`0 0 ${W} ${H}`} className="orb-svg" style={{ minWidth: `${Math.round(W * 0.8)}px` }} role="img" aria-label="binomial heap">
      {placed.map(({ l, k }) => (
        <T key={k} x={l.x} y={12} size={13} ink="blue">
          {`B${k}`}
        </T>
      ))}
      {edges}
      {nodes}
    </svg>
    </div>
  )
}

const build = (keys: number[]): BH => keys.reduce<BH>((h, k) => bhInsert(h, k).heap, [])
export function BinomialLab() {
  const [heap, setHeap] = useState<BH>(() => build([31, 12, 45, 7, 22, 18, 50, 3, 27, 9, 36]))
  const [note, setNote] = useState<{ text: string; steps: MeldStep[]; cost: number; dPhi: number } | null>(null)
  const [hot, setHot] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [counter, setCounter] = useState(1)
  const [val, setVal] = useState(5)
  const n = sizeH(heap)
  const bad = bhValid(heap)
  const doInsert = (key: number) => {
    const before = treesIn(heap)
    const id = freshId()
    const r = bhInsert(heap, key, id)
    setHeap(r.heap)
    setHot([id])
    setNote({ text: `insert ${key}: a new B0, then add it like +1 in binary (${r.links} link${r.links === 1 ? '' : 's'})`, steps: r.steps, cost: r.cost, dPhi: treesIn(r.heap) - before })
  }
  const doExtract = () => {
    const r = bhExtractMin(heap)
    if (!r) return
    setHeap(r.heap)
    setHot([])
    setPicked(null)
    setNote({ text: `extract-min: removed the smallest root (${r.min}); its ${r.kids} child trees become a heap, which is melded back`, steps: r.steps, cost: r.cost, dPhi: r.dPhi })
  }
  const doMeld = () => {
    const other = build(Array.from({ length: 7 }, (_, i) => 100 + ((counter * 37 + i * 13) % 60)))
    const before = treesIn(heap)
    const m = meld(heap, other)
    setHeap(m.heap)
    setHot([])
    setCounter(counter + 1)
    setNote({ text: `meld with a 7-item heap (B0 B1 B2): ${n} + 7 = ${n + 7}, added in binary, ${m.links} link${m.links === 1 ? '' : 's'}`, steps: m.steps, cost: m.steps.length, dPhi: treesIn(m.heap) - before })
  }
  const doDecrease = () => {
    if (picked === null) return
    const r = bhDecreaseKey(heap, picked, 0)
    setHeap(r.heap)
    setHot([picked])
    setNote({ text: `decrease-key to 0: swims up ${r.swaps} level${r.swaps === 1 ? '' : 's'} inside its tree (a B_k has height k ≤ log n)`, steps: [], cost: 1 + r.swaps, dPhi: 0 })
  }
  return (
    <Fig
      n={21}
      title="binomial heap: a binary counter made of trees"
      hint="B_k = two B_(k−1)s, one hung under the other's root. the heap has a B_k exactly when bit k of n is 1"
      controls={
        <>
          <label className="orb-slider hand">
            <span className="orb-slider-label">key</span>
            <input className="algo-num" value={val} onChange={(e) => setVal(+e.target.value.replace(/[^0-9]/g, '') || 0)} aria-label="key to insert" />
          </label>
          <Btn onClick={() => doInsert(val)} disabled={n >= 40}>insert {val}</Btn>
          <Btn onClick={() => doInsert(2 + ((counter * 53 + n * 7) % 90)) } disabled={n >= 40}>insert random</Btn>
          <Btn onClick={doExtract} disabled={!n}>extract-min</Btn>
          <Btn onClick={doMeld} disabled={n > 28}>meld with a 7-heap</Btn>
          <Btn onClick={doDecrease} disabled={picked === null}>decrease picked to 0</Btn>
          <Btn onClick={() => { setHeap(build([31, 12, 45, 7, 22, 18, 50, 3, 27, 9, 36])); setNote(null); setHot([]); setPicked(null) }}>reset</Btn>
        </>
      }
      caption={
        note ? (
          <>
            {note.text}. cost {note.cost}, Φ (number of trees) changed by {note.dPhi} ⇒ amortized <b>{note.cost + note.dPhi}</b>.
          </>
        ) : (
          <>click a node to pick it for decrease-key. Φ = number of trees; insert links k times and Φ drops by k − 1, so insert is O(1) amortized.</>
        )
      }
    >
      <BinomialSvg heap={heap} hot={hot} picked={picked} onPick={setPicked} />
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        n = {n} = {n.toString(2)}₂ → trees {orders(n).map((k) => `B${k}`).join(' ') || '—'} ({treesIn(heap)} trees) {bad.length ? `· BROKEN: ${bad[0]}` : '· valid ✓'}
      </p>
      {note && note.steps.length > 0 && (
        <div className="algo-scroll">
          <table className="algo-table" aria-label="the carries">
            <thead>
              <tr>
                <th>order</th>
                <th>trees of that order</th>
                <th>what happens</th>
              </tr>
            </thead>
            <tbody>
              {note.steps.filter((s) => s.have.length).map((s) => (
                <tr key={s.order}>
                  <td>B{s.order}</td>
                  <td>{s.have.join(', ')}</td>
                  <td>{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Fig>
  )
}
