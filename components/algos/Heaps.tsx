'use client'

/* lecture 8: binary heaps and binomial heaps */
import { useMemo, useRef, useState } from 'react'
import { Box, Btn, Chart, Fig, Line, Seg, Slider, T, r1 } from './kit'
import { Edge, Node, Narr, OpLog, PAINT, Pace, Run, Stage, draw, freshKey, randInt, useFrames, useLog, type Speed } from './Live'
import { buildBySink, buildBySwim, byOrder, cloneT, decreaseKey, deleteAt, depthOf, extractMin, findPath, heapKeys, insert, linkSteps, potential, sinkBound, sink, sizeT, toHeap, bhInsert, bhValid, type BH, type BT } from '@/lib/algos/heaps'
import { rng, shuffle } from '@/lib/algos/rng'

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

type Item = { id: number; v: number }
type HF = { a: Item[]; hot: number[]; say: string }
type HeapOp = 'insert' | 'extract' | 'decrease' | 'delete'
const START = [6, 10, 8, 17, 11, 25, 12].map((v, i) => ({ id: i + 1, v }))
const HEAP_MAX = 63
const s = (n: number) => (n === 1 ? '' : 's')
const swapped = (a: Item[], i: number, j: number) => a.map((x, k) => (k === i ? a[j] : k === j ? a[i] : x))

export function BinaryHeapLab() {
  const [share, setShare] = useState(70)
  const [pool, setPool] = useState({ extract: true, decrease: false, delete: false })
  const [speed, setSpeed] = useState<Speed>('normal')
  const [fit, setFit] = useState(false)
  const [last, setLast] = useState<{ cost: number; dPhi: number } | null>(null)
  const nid = useRef(100)
  const fr = useFrames<HF>({ a: START, hot: [], say: '' }, speed)
  const { log, count, add, clear } = useLog()
  const reset = () => {
    fr.play([{ a: START, hot: [], say: '' }])
    clear()
    setLast(null)
  }
  const go = () => {
    const a0 = fr.end.a
    const n = a0.length
    const others = (['extract', 'decrease', 'delete'] as const).filter((k) => pool[k])
    const op: HeapOp =
      draw<HeapOp>([
        { k: 'insert', w: share, ok: n < HEAP_MAX },
        { k: 'extract', w: (100 - share) / others.length, ok: pool.extract && n > 0 },
        { k: 'decrease', w: (100 - share) / others.length, ok: pool.decrease && a0.some((x) => x.v > 1) },
        { k: 'delete', w: (100 - share) / others.length, ok: pool.delete && n > 0 },
      ]) ?? (n < HEAP_MAX ? 'insert' : 'extract')
    const frames: HF[] = []
    let a = a0
    const show = (say: string, ...hot: Item[]) => frames.push({ a, hot: hot.map((x) => x.id), say })
    // the swaps come from the tested heap code; here they are replayed one per frame
    const replay = (swaps: { i: number; j: number }[]) => {
      for (const { i, j } of swaps) {
        const [lo, hi] = i < j ? [i, j] : [j, i]
        const say = i > j ? `${a[i].v} is smaller than its parent ${a[j].v}: swap, one level up.` : `${a[lo].v} is larger than its smaller child ${a[hi].v}: swap, one level down.`
        a = swapped(a, i, j)
        show(say, a[i], a[j])
      }
      return swaps.length
    }
    let text = ''
    let swaps = 0
    if (op === 'insert') {
      const x = { id: nid.current++, v: freshKey(a.map((y) => y.v), 1, 99)! }
      a = [...a, x]
      show(`insert ${x.v}: it takes the next open spot at the bottom, position ${n} of the array. now it swims up while it is smaller than its parent.`, x)
      swaps = replay(insert(a0.map((y) => y.v), x.v).swaps)
      const at = a.indexOf(x)
      show(at === 0 ? `${x.v} reached the root: it is the new minimum. ${swaps} swap${s(swaps)}.` : `${x.v} is not smaller than its parent ${a[(at - 1) >> 1].v}, so it stops. ${swaps} swap${s(swaps)}.`, x)
      text = `insert ${x.v}`
    } else if (op === 'extract') {
      const min = a[0]
      const tail = a[n - 1]
      show(`extract-min: the minimum is always the root, here ${min.v}.`, min)
      if (n > 1) {
        a = swapped(a, 0, n - 1)
        show(`swap it with the last node, ${tail.v}, so that removing it leaves no hole.`, min, tail)
      }
      a = a.slice(0, -1)
      if (n > 1) show(`${min.v} is gone. ${tail.v} sits at the root and sinks while a child is smaller.`, tail)
      swaps = replay(extractMin(a0.map((y) => y.v)).swaps)
      show(n > 1 ? `heap order holds again. ${swaps} swap${s(swaps)}; the new minimum is ${a[0].v}.` : `${min.v} was the only node. the heap is empty.`)
      text = `extract-min → ${min.v}`
    } else if (op === 'decrease') {
      const can = a.map((x, i) => i).filter((i) => a[i].v > 1)
      const i = can[randInt(0, can.length - 1)]
      const old = a[i]
      const x = { id: old.id, v: freshKey(a.map((y) => y.v), 1, old.v - 1) ?? old.v - 1 }
      a = a.map((y) => (y === old ? x : y))
      show(`decrease-key: ${old.v} becomes ${x.v}. a smaller key can only be wrong against its parent, so it swims up.`, x)
      swaps = replay(decreaseKey(a0.map((y) => y.v), i, x.v).swaps)
      show(`${x.v} is in place. ${swaps} swap${s(swaps)}.`, x)
      text = `decrease-key ${old.v} → ${x.v}`
    } else {
      const i = randInt(0, n - 1)
      const gone = a[i]
      const tail = a[n - 1]
      show(`delete ${gone.v} (position ${i}).`, gone)
      a = a.slice(0, -1).map((y) => (y === gone ? tail : y))
      if (i < n - 1) show(`the last node, ${tail.v}, moves into its place. it may be too small for its parent or too big for its children.`, tail)
      swaps = replay(deleteAt(a0.map((y) => y.v), i).swaps)
      show(`heap order holds again. ${swaps} swap${s(swaps)}.`)
      text = `delete ${gone.v}`
    }
    const dPhi = potential(a.length) - potential(n)
    fr.play(frames)
    setLast({ cost: 1 + swaps, dPhi })
    add(`${text}: ${swaps} swap${s(swaps)}, ΔΦ ${dPhi > 0 ? '+' : ''}${dPhi}`)
  }
  const { a, hot } = fr.frame
  const n = a.length
  const levels = n ? depthOf(n - 1) + 1 : 1
  const W = Math.max(520, 2 ** (levels - 1) * 30 + 40)
  const pos = (i: number) => {
    const d = depthOf(i)
    return { x: 20 + ((i - (2 ** d - 1) + 0.5) / 2 ** d) * (W - 40), y: 22 + d * 48 }
  }
  const focus = a.findIndex((x) => hot.includes(x.id))
  const PER = 20
  return (
    <Fig
      n={25}
      title="binary heap"
      hint="one press does one random operation, one swap at a time. yellow = the nodes that step is about"
      controls={
        <>
          <span className="hand">settings:</span>
            <Slider label="how often it inserts" value={share} min={10} max={100} step={5} onChange={setShare} format={(v) => `${v}%`} />
            <span className="hand">the rest is split between:</span>
            <Btn on={pool.extract} onClick={() => setPool({ ...pool, extract: !pool.extract })}>extract-min</Btn>
            <Btn on={pool.decrease} onClick={() => setPool({ ...pool, decrease: !pool.decrease })}>decrease-key</Btn>
            <Btn on={pool.delete} onClick={() => setPool({ ...pool, delete: !pool.delete })}>delete</Btn>
          <Pace speed={speed} setSpeed={setSpeed} fit={fit} setFit={setFit} />
        </>
      }
    >
      <Run onGo={go} onReset={reset} count={count} />
      <Narr step={fr.step} steps={fr.steps}>
        {fr.frame.say ? (
          <>
            {fr.frame.say}
          </>
        ) : (
          <>heap order: every node ≤ its children, so the minimum is the root. the tree is complete, so its height is ≤ log n. press the yellow button.</>
        )}
      </Narr>
      <Stage w={W} h={levels * 48 + 6} focus={focus >= 0 ? pos(focus).x : undefined} fit={fit} speed={speed} label="the heap as a tree">
        {!n && <T x={W / 2} y={28} size={14}>empty</T>}
        {a.map((_, i) => (i > 0 ? <Edge key={i} x1={pos(i).x} y1={pos(i).y} x2={pos((i - 1) >> 1).x} y2={pos((i - 1) >> 1).y} /> : null))}
        {a.map((x, i) => (
          <Node key={x.id} x={pos(i).x} y={pos(i).y} label={x.v} paint={hot.includes(x.id) ? PAINT.hot : PAINT.plain} />
        ))}
      </Stage>
      <svg viewBox={`0 0 560 ${Math.max(1, Math.ceil(n / PER)) * 44 + 4}`} className="orb-svg" role="img" aria-label="the same heap as the array it is stored in">
        {a.map((x, i) => (
          <Box key={i} x={10 + (i % PER) * 27} y={4 + Math.floor(i / PER) * 44} w={27} h={26} size={12} label={x.v} tone={hot.includes(x.id) ? 'yellow' : 'none'} />
        ))}
        {a.map((_, i) => (
          <T key={i} x={23.5 + (i % PER) * 27} y={40 + Math.floor(i / PER) * 44} size={9}>
            {i}
          </T>
        ))}
      </svg>
      <p className="algo-say" style={{ margin: '0' }}>
        {n} node{s(n)} · the array above is the same heap: the children of position i are 2i+1 and 2i+2 · Φ = Σ depths = {potential(n)}
        {last && fr.step === fr.steps ? (
          <>
            {' '}
            · last operation: cost {last.cost} + ΔΦ {last.dPhi} = amortized <b>{last.cost + last.dPhi}</b>
          </>
        ) : null}
      </p>
      <OpLog log={log} />
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
      n={26}
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

const U = 28
const unitsOf = (t: BT): number => (t.kids.length ? t.kids.reduce((sum, k) => sum + unitsOf(k), 0) : 1)
type Spot = { id: number; key: number; x: number; y: number; up: number | null; order: number | null }
/** every node of a row of trees, biggest child leftmost */
function spreadForest(forest: BT[]) {
  const spots: Spot[] = []
  const place = (t: BT, x0: number, y: number, up: number | null): number => {
    let cx = x0
    const xs = t.kids.slice().reverse().map((k) => {
      const x = place(k, cx, y + 40, t.id)
      cx += unitsOf(k) * U
      return x
    })
    const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : x0 + U / 2
    spots.push({ id: t.id, key: t.key, x, y, up, order: up === null ? t.kids.length : null })
    return x
  }
  let x = 14
  for (const t of forest) {
    place(t, x, 34, null)
    x += unitsOf(t) * U + 26
  }
  const w = x - 12
  const off = Math.max(0, (320 - w) / 2)
  spots.forEach((p) => (p.x += off))
  return { spots, w, h: 34 + Math.max(0, ...forest.map((t) => t.kids.length)) * 40 + 22 }
}

type NF = { f: BT[]; hot: number[]; other: number[]; say: string }
type BinOp = 'insert' | 'extract' | 'meld' | 'decrease'
const firstN = (): NF => ({ f: byOrder(([31, 12, 45, 7, 22, 18, 50, 3, 27, 9, 36].reduce<BH>((h, k, i) => bhInsert(h, k, i + 1).heap, []).filter(Boolean) as BT[])), hot: [], other: [], say: '' })
const ids = (t: BT): number[] => [t.id, ...t.kids.flatMap(ids)]
const keysOf = (f: BT[]) => f.flatMap((t) => heapKeys([t]))
const BIN_MAX = 96

export function BinomialLab() {
  const [share, setShare] = useState(60)
  const [pool, setPool] = useState({ extract: true, meld: true, decrease: false })
  const [speed, setSpeed] = useState<Speed>('normal')
  const [fit, setFit] = useState(false)
  const [last, setLast] = useState<{ cost: number; dPhi: number } | null>(null)
  const nid = useRef(100)
  const fr = useFrames<NF>(firstN(), speed)
  const { log, count, add, clear } = useLog()
  const reset = () => {
    fr.play([firstN()])
    clear()
    setLast(null)
  }
  const go = () => {
    const f0 = fr.end.f
    const n = f0.reduce((sum, t) => sum + sizeT(t), 0)
    const others = (['extract', 'meld', 'decrease'] as const).filter((k) => pool[k])
    const inner = f0.flatMap((t) => t.kids.flatMap(ids))
    const op: BinOp =
      draw<BinOp>([
        { k: 'insert', w: share, ok: n < BIN_MAX },
        { k: 'extract', w: (100 - share) / others.length, ok: pool.extract && n > 0 },
        { k: 'meld', w: (100 - share) / others.length, ok: pool.meld && n < BIN_MAX - 7 },
        { k: 'decrease', w: (100 - share) / others.length, ok: pool.decrease && inner.length > 0 },
      ]) ?? (n < BIN_MAX ? 'insert' : 'extract')
    const frames: NF[] = []
    // carries: link the lowest pair until no order appears twice
    const carry = (row: BT[], other: number[]) => {
      const steps = linkSteps(row)
      for (const st of steps) {
        const [top, low] = st.a.key <= st.b.key ? [st.a, st.b] : [st.b, st.a]
        frames.push({ f: st.forest, hot: [top.id, low.id], other, say: `two trees of order ${st.order}, like 1 + 1 in binary: link them. the smaller root ${top.key} stays on top, ${low.key} hangs under it. that carries one B${st.order + 1}.` })
      }
      return steps.length ? steps[steps.length - 1].forest : byOrder(row)
    }
    let end: BT[]
    let cost = 1
    let text = ''
    const fresh = () => freshKey(keysOf(f0), 1, 199)!
    if (op === 'insert') {
      const x: BT = { id: nid.current++, key: fresh(), kids: [] }
      const row = byOrder([...f0, x])
      const pair = f0.some((t) => !t.kids.length)
      frames.push({ f: row, hot: [x.id], other: [], say: `insert ${x.key}: it starts as a one-node tree, a B0. that is adding 1 to n in binary. ${pair ? 'there is a B0 already, so there will be a carry.' : 'there was no B0, so nothing needs linking.'}` })
      end = carry(row, [])
      const links = f0.length + 1 - end.length
      cost = links + 1
      frames.push({ f: end, hot: [x.id], other: [], say: `done: ${links} link${s(links)}, and no order appears twice.` })
      text = `insert ${x.key}: ${links} link${s(links)}`
    } else if (op === 'extract') {
      const m = f0.reduce((b, t) => (t.key < b.key ? t : b))
      frames.push({ f: f0, hot: [m.id], other: [], say: `extract-min: the minimum is one of the ${f0.length} roots. compare them: it is ${m.key}.` })
      const row = byOrder([...f0.filter((t) => t !== m), ...m.kids])
      const k = m.kids.length
      frames.push({ f: row, hot: m.kids.map((c) => c.id), other: [], say: k ? `remove ${m.key}. its ${k} child${k === 1 ? '' : 'ren'} ${k === 1 ? 'is a B0' : `are B0 … B${k - 1}`}: a small heap of ${2 ** k - 1}. meld it back, which is binary addition.` : `remove ${m.key}. it had no children, so nothing is left to do.` })
      end = carry(row, [])
      const links = row.length - end.length
      cost = f0.length + k + links
      if (k) frames.push({ f: end, hot: [], other: [], say: `done: ${links} link${s(links)}. the new minimum is ${end.length ? Math.min(...end.map((t) => t.key)) : '—'}.` })
      text = `extract-min → ${m.key}: ${links} link${s(links)}`
    } else if (op === 'meld') {
      const size = randInt(2, 7)
      const taken = keysOf(f0)
      let h: BH = []
      for (let i = 0; i < size; i++) {
        const key = freshKey(taken, 1, 199)!
        taken.push(key)
        h = bhInsert(h, key, nid.current++).heap
      }
      const guest = h.filter(Boolean) as BT[]
      const other = guest.flatMap(ids)
      const row = byOrder([...f0, ...guest])
      frames.push({ f: row, hot: [], other, say: `meld with another heap of ${size} keys (blue). ${n} + ${size} in binary is ${n.toString(2)} + ${size.toString(2)} = ${(n + size).toString(2)}: wherever both have a tree of the same order, there is a carry.` })
      end = carry(row, other)
      const links = row.length - end.length
      cost = Math.max(1, links)
      frames.push({ f: end, hot: [], other, say: `done: ${links} link${s(links)}. ${n + size} = ${(n + size).toString(2)} in binary, one tree for every 1.` })
      text = `meld with ${size} keys: ${links} link${s(links)}`
    } else {
      const id = inner[randInt(0, inner.length - 1)]
      const pathTo = (r: BT[]) => r.map((t) => findPath(t, id)).find(Boolean)!
      let row = f0.map(cloneT)
      let p = pathTo(row)
      const old = p[p.length - 1].key
      // usually low enough to pass its parent, so there is something to watch
      const key = freshKey(keysOf(f0), 1, Math.random() < 0.7 ? Math.floor((p[0].key + p[p.length - 2].key) / 2) : old - 1) ?? freshKey(keysOf(f0), 1, old - 1) ?? old
      p[p.length - 1].key = key
      frames.push({ f: row, hot: [id], other: [], say: `decrease-key: ${old} becomes ${key}. it swims up inside its own tree while it is smaller than its parent.` })
      let swaps = 0
      for (;;) {
        // a fresh copy of the row per frame, so earlier frames stay as they were
        row = row.map(cloneT)
        p = pathTo(row)
        const [c, par] = [p[p.length - 1], p[p.length - 2]]
        if (!par || c.key >= par.key) break
        const up = par.key
        ;[c.id, c.key, par.id, par.key] = [par.id, par.key, c.id, c.key]
        swaps++
        frames.push({ f: row, hot: [id, c.id], other: [], say: `${key} is smaller than its parent ${up}: the two trade places, one level up.` })
      }
      end = row
      cost = 1 + swaps
      frames.push({ f: row, hot: [id], other: [], say: `${key} is in place after ${swaps} swap${s(swaps)}. a B_k has height k ≤ log n, so that is the most it can take.` })
      text = `decrease-key ${old} → ${key}: ${swaps} swap${s(swaps)}`
    }
    fr.play(frames)
    setLast({ cost, dPhi: end.length - f0.length })
    add(`${text}, trees ${f0.length} → ${end.length}`)
  }
  const { f, hot, other } = fr.frame
  const { spots, w, h } = useMemo(() => spreadForest(f), [f])
  const at = new Map(spots.map((p) => [p.id, p]))
  const n = spots.length
  const settled = new Set(f.map((t) => t.kids.length)).size === f.length
  const bad = settled ? bhValid(toHeap(f)) : []
  const focus = at.get(hot[0] ?? other[0])
  return (
    <Fig
      n={27}
      title="binomial heap: a binary counter made of trees"
      hint="one press does one random operation, one link at a time. yellow = the trees being linked"
      controls={
        <>
          <span className="hand">settings:</span>
            <Slider label="how often it inserts" value={share} min={10} max={100} step={5} onChange={setShare} format={(v) => `${v}%`} />
            <span className="hand">the rest is split between:</span>
            <Btn on={pool.extract} onClick={() => setPool({ ...pool, extract: !pool.extract })}>extract-min</Btn>
            <Btn on={pool.meld} onClick={() => setPool({ ...pool, meld: !pool.meld })}>meld with a small heap</Btn>
            <Btn on={pool.decrease} onClick={() => setPool({ ...pool, decrease: !pool.decrease })}>decrease-key</Btn>
          <Pace speed={speed} setSpeed={setSpeed} fit={fit} setFit={setFit} />
        </>
      }
    >
      <Run onGo={go} onReset={reset} count={count} />
      <Narr step={fr.step} steps={fr.steps}>
        {fr.frame.say ? (
          <>
            {fr.frame.say}
          </>
        ) : (
          <>B_k is two B_(k−1)s, one hung under the other&apos;s root, so it has 2^k nodes. the heap has a B_k exactly when bit k of n is 1. press the yellow button.</>
        )}
      </Narr>
      <Stage w={w} h={h} focus={focus?.x} fit={fit} speed={speed} label="binomial heap">
        {!n && <T x={160} y={28} size={14}>empty heap</T>}
        {spots.map((p) => {
          const up = p.up === null ? null : at.get(p.up)
          return up ? <Edge key={p.id} x1={p.x} y1={p.y} x2={up.x} y2={up.y} /> : null
        })}
        {spots.map((p) => (
          <Node key={p.id} x={p.x} y={p.y} r={12} size={11} label={p.key} paint={hot.includes(p.id) ? PAINT.hot : other.includes(p.id) ? PAINT.path : PAINT.plain} tag={p.order === null ? undefined : `B${p.order}`} />
        ))}
      </Stage>
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        n = {n} = {n.toString(2)}₂ · trees on the page: {f.map((t) => `B${t.kids.length}`).join(' ') || '—'} {settled ? `(one per 1 bit${bad.length ? `, BROKEN: ${bad[0]}` : ', valid ✓'})` : '(an order appears twice: a carry is pending)'} · Φ = number of trees = {f.length}
        {last && fr.step === fr.steps ? (
          <>
            {' '}
            · last operation: cost {last.cost} + ΔΦ {last.dPhi} = amortized <b>{last.cost + last.dPhi}</b>
          </>
        ) : null}
      </p>
      <OpLog log={log} />
    </Fig>
  )
}
