'use client'

/* lecture 6 and homework 3: search trees */
import { useMemo, useState, type ReactNode } from 'react'
import { Box, Btn, Chart, Fig, Line, Seg, Slider, T, r1 } from './kit'
import { bankRun, bestNextAmortized, bstDepthOf, bstHeight, bstInsert, btHeight, btInsert, btNodes, btValid, canRotate, NAIVE_BAD, rbBlackHeight, rbHeight, rbInsert, rbRotate, rbValid, to234, worstSequence, type BEvent, type BNode, type BST, type RB, type RBStep } from '@/lib/algos/trees'
import { rng, shuffle } from '@/lib/algos/rng'

/* ------------------------------------------------------------------ a multiway tree, drawn */

type Lay = { x: number; y: number; w: number; node: BNode; kids: Lay[] }
const KW = 24
const LH = 56
function layoutB(n: BNode): { w: number; place: (x0: number, y: number) => Lay } {
  const own = Math.max(n.keys.length, 1) * KW + 8
  const kids = n.kids.map(layoutB)
  const gap = 12
  const kidsW = kids.reduce((s, k) => s + k.w, 0) + gap * Math.max(0, kids.length - 1)
  const w = Math.max(own, kidsW)
  return {
    w,
    place: (x0, y) => {
      let cx = x0 + (w - kidsW) / 2
      const placed = kids.map((k) => {
        const l = k.place(cx, y + LH)
        cx += k.w + gap
        return l
      })
      return { x: x0 + (w - own) / 2, y, w: own, node: n, kids: placed }
    },
  }
}
export function BTreeSvg({ root, hi = [], flash = [] }: { root: BNode | null; hi?: string[]; flash?: string[] }) {
  if (!root) return <svg viewBox="0 0 560 40" className="orb-svg"><T x={280} y={26} size={14}>empty</T></svg>
  const L = layoutB(root)
  const tree = L.place(0, 6)
  const H = btHeight(root) * LH + 16
  const W = Math.max(L.w + 10, 300)
  const draw = (l: Lay): ReactNode => (
    <g key={`${l.x}-${l.y}`}>
      {l.kids.map((k, i) => (
        <Line key={i} x1={l.x + 4 + i * KW} y1={l.y + 26} x2={k.x + k.w / 2} y2={k.y} tone="pencil" w={1.2} />
      ))}
      {l.node.keys.map((k, i) => (
        <Box key={k} x={l.x + 4 + i * KW} y={l.y} w={KW} h={26} size={12} label={k} tone={flash.includes(k) ? 'yellow' : hi.includes(k) ? 'green' : 'none'} title={k} />
      ))}
      {l.kids.map(draw)}
    </g>
  )
  const VW = Math.max(W, 560)
  return (
    <div className="algo-scroll">
      <svg viewBox={`0 0 ${VW} ${H}`} className="orb-svg" style={{ minWidth: `${Math.round(VW * 0.85)}px` }} role="img" aria-label="B-tree">
        <g transform={`translate(${r1((VW - W) / 2 + 5)} 0)`}>{draw(tree)}</g>
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ a binary tree, drawn */

type BinT = { key: string; red?: boolean; l: BinT | null; r: BinT | null }
export function BinTreeSvg({ tree, mark = [], onPick, picked, color }: { tree: BinT | null; mark?: string[]; onPick?: (k: string) => void; picked?: string | null; color?: boolean }) {
  if (!tree) return <svg viewBox="0 0 560 40" className="orb-svg"><T x={280} y={26} size={14}>empty</T></svg>
  const pos = new Map<string, { i: number; d: number }>()
  let i = 0
  let maxD = 0
  const walk = (n: BinT | null, d: number) => {
    if (!n) return
    walk(n.l, d + 1)
    pos.set(n.key, { i: i++, d })
    maxD = Math.max(maxD, d)
    walk(n.r, d + 1)
  }
  walk(tree, 0)
  const n = pos.size
  const R = Math.min(15, Math.max(7, 250 / n))
  const dx = Math.min(36, 520 / Math.max(n, 1))
  const dy = Math.min(46, 260 / (maxD + 1) + 6)
  const X = (k: string) => 20 + (560 - 40 - (n - 1) * dx) / 2 + pos.get(k)!.i * dx
  const Y = (k: string) => 18 + pos.get(k)!.d * dy
  const edges: ReactNode[] = []
  const nodes: ReactNode[] = []
  const rec = (t: BinT | null) => {
    if (!t) return
    for (const c of [t.l, t.r]) if (c) edges.push(<Line key={`${t.key}-${c.key}`} x1={X(t.key)} y1={Y(t.key)} x2={X(c.key)} y2={Y(c.key)} tone="pencil" w={color && c.red ? 2.2 : 1.3} />)
    const isRed = color && t.red
    const isMark = mark.includes(t.key)
    nodes.push(
      <g key={t.key} onClick={onPick ? () => onPick(t.key) : undefined} style={onPick ? { cursor: 'pointer' } : undefined} role={onPick ? 'button' : undefined} aria-label={`node ${t.key}${color ? (t.red ? ' red' : ' black') : ''}`}>
        <circle cx={r1(X(t.key))} cy={r1(Y(t.key))} r={r1(R)} fill={color ? (isRed ? 'rgba(192,67,45,0.88)' : 'var(--ink)') : 'var(--orb-paper)'} stroke={isMark || picked === t.key ? 'var(--blue-pen)' : color && isRed ? 'var(--red-pen)' : 'var(--ink)'} strokeWidth={isMark || picked === t.key ? 3 : 1.4} />
        <text x={r1(X(t.key))} y={r1(Y(t.key) + 4)} textAnchor="middle" fontSize={R > 10 ? 12 : 9} className="orb-t" fill={color ? '#fdfcf8' : 'var(--ink)'}>
          {t.key}
        </text>
      </g>,
    )
    rec(t.l)
    rec(t.r)
  }
  rec(tree)
  return (
    <svg viewBox={`0 0 560 ${r1(Y(tree.key) + (maxD + 1) * dy)}`} className="orb-svg" role="img" aria-label="binary tree">
      {edges}
      {nodes}
    </svg>
  )
}

const parseKeys = (s: string) => s.split(/[\s,]+/).filter(Boolean).slice(0, 40)

/* ================================================================== plain BST */

export function BstDegenerate() {
  const [text, setText] = useState('H O P K I N S')
  const keys = parseKeys(text)
  const tree = useMemo(() => keys.reduce<BST | null>((t, k) => bstInsert(t, k), null), [text])
  const h = bstHeight(tree)
  const last = keys[keys.length - 1]
  const distinct = new Set(keys).size
  return (
    <Fig
      n={11}
      title="binary search tree: insert order is everything"
      hint="type keys, or use a preset"
      controls={
        <>
          <Btn onClick={() => setText('H O P K I N S')}>H O P K I N S</Btn>
          <Btn onClick={() => setText('1 2 3 4 5 6 7 8 9 10 11 12')}>sorted</Btn>
          <Btn onClick={() => setText('8 4 12 2 6 10 14 1 3 5 7 9 11 13 15')}>balanced order</Btn>
          <Btn onClick={() => setText(shuffle(Array.from({ length: 15 }, (_, i) => String(i + 1)), rng(Date.now() % 1000 || 5)).join(' '))}>random</Btn>
          <label className="orb-slider hand">
            <span className="orb-slider-label">keys</span>
            <input className="algo-num" style={{ width: '20em' }} value={text} onChange={(e) => setText(e.target.value)} aria-label="keys" />
          </label>
        </>
      }
      caption={
        <>
          {distinct} keys, height <b>{h}</b> (a perfect tree would have {Math.ceil(Math.log2(distinct + 1))}). last insert, <b>{last}</b>, took {tree ? bstDepthOf(tree, last) : 0} steps. sorted input = a linked list: Θ(n) per operation.
        </>
      }
    >
      <BinTreeSvg tree={tree} mark={last ? [last] : []} />
    </Fig>
  )
}

/* ================================================================== B-tree / 2-3-4 */

const describe = (e: BEvent) => (e.type === 'split' ? `split [${e.before.join(' ')}]: ${e.median} moves up${e.root ? ' (new root)' : ''}` : `put ${e.key} → [${e.leaf.join(' ')}]`)

export function BTreeLab() {
  const [t, setT] = useState(2)
  const [root, setRoot] = useState<BNode | null>(() => 'ABCD'.split('').reduce<BNode | null>((r, k) => btInsert(r, k, 2).root, null))
  const [events, setEvents] = useState<BEvent[]>([])
  const [text, setText] = useState('')
  const [queue, setQueue] = useState<string[]>('E F G H I J K L M N O P'.split(' '))
  const fresh = (tt: number) => {
    setRoot('ABCD'.split('').reduce<BNode | null>((r, k) => btInsert(r, k, tt).root, null))
    setEvents([])
    setQueue('E F G H I J K L M N O P'.split(' '))
  }
  const insertKeys = (ks: string[]) => {
    let r = root
    let ev: BEvent[] = []
    for (const k of ks) {
      const x = btInsert(r, k, t)
      r = x.root
      ev = x.events
    }
    setRoot(r)
    setEvents(ev)
  }
  const bad = btValid(root, t)
  const splits = events.filter((e) => e.type === 'split')
  const flashKeys = events.flatMap((e) => (e.type === 'split' ? [e.median] : [e.key]))
  const total = root ? btNodes(root).reduce((s, n) => s + n.keys.length, 0) : 0
  return (
    <Fig
      n={12}
      title={t === 2 ? '2-3-4 tree (B-tree, t = 2)' : `B-tree, t = ${t}`}
      hint="full nodes split on the way down. yellow = what just moved"
      controls={
        <>
          <Btn
            onClick={() => {
              if (!queue.length) return
              insertKeys([queue[0]])
              setQueue(queue.slice(1))
            }}
            disabled={!queue.length}
          >
            insert next: {queue[0] ?? '—'}
          </Btn>
          <Btn onClick={() => fresh(t)}>reset</Btn>
          <Seg label="t" value={String(t) as '2' | '3'} onChange={(v) => { setT(+v); fresh(+v) }} options={[{ k: '2', label: 't = 2  (1–3 keys)' }, { k: '3', label: 't = 3  (2–5 keys)' }]} />
          <label className="orb-slider hand">
            <span className="orb-slider-label">insert</span>
            <input
              className="algo-num"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && text.trim()) {
                  insertKeys(parseKeys(text))
                  setText('')
                }
              }}
              aria-label="key to insert"
              placeholder="key + enter"
            />
          </label>
          <Btn onClick={() => { if (text.trim()) { insertKeys(parseKeys(text)); setText('') } }}>insert</Btn>
        </>
      }
      caption={
        !events.length ? (
          <>each non-root node holds {t - 1} to {2 * t - 1} keys; all leaves are at the same depth. keep inserting E, F, G… and watch it grow up, never down.</>
        ) : (
          <>
            {splits.length ? `${splits.length} split${splits.length > 1 ? 's' : ''}: ` : 'no splits. '}
            {events.map(describe).join(' · ')}
            {bad.length ? ` ⚠ ${bad[0]}` : ''}
          </>
        )
      }
    >
      <BTreeSvg root={root} flash={flashKeys} />
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        {total} keys · height {btHeight(root)} · properties {bad.length ? 'BROKEN' : 'all hold ✓'}
      </p>
    </Fig>
  )
}

/* ================================================================== homework 3: splits, amortized */

type SeqId = 'w1' | 'w2' | 'w3' | 'naive' | 'asc' | 'rand'
export function SplitBank() {
  const [seqId, setSeqId] = useState<SeqId>('w3')
  const [bank, setBank] = useState<[number, number, number]>([0, 1, 2])
  const [applied, setApplied] = useState(false)
  const data = useMemo(() => {
    if (seqId === 'w1' || seqId === 'w2' || seqId === 'w3') {
      const w = worstSequence(seqId === 'w1' ? 1 : seqId === 'w2' ? 2 : 3)
      return { seq: w.seq, next: w.next, label: `${w.n} inserts, then one more` }
    }
    if (seqId === 'naive') return { seq: NAIVE_BAD.map(String), next: null, label: '17 inserts' }
    if (seqId === 'asc') return { seq: Array.from({ length: 60 }, (_, i) => String(i + 1)), next: null, label: '1..60' }
    return { seq: shuffle(Array.from({ length: 60 }, (_, i) => String(i + 1)), rng(9)), next: null, label: '60 random keys' }
  }, [seqId])
  const run = useMemo(() => bankRun(data.next ? [...data.seq, data.next] : data.seq, bank), [data, bank])
  const worstNext = useMemo(() => bestNextAmortized(data.seq, bank), [data, bank])
  const rows = run.rows
  const maxA = Math.max(...rows.map((r) => r.amortized), worstNext.amortized)
  const totalSplits = rows.reduce((s, r) => s + r.splits, 0)
  const lastR = rows[rows.length - 1]
  const before = useMemo(() => {
    let r: BNode | null = null
    for (const k of data.seq) r = btInsert(r, k, 2).root
    return r
  }, [data])
  const after = useMemo(() => (data.next ? btInsert(before, data.next, 2) : null), [before, data])
  const good = maxA <= 1
  return (
    <Fig
      n={17}
      title="splits in a 2-3-4 tree: worst case vs amortized"
      hint="set the bank each node holds, by how many keys it has"
      controls={
        <>
          <Seg label="sequence" value={seqId} onChange={(v) => { setSeqId(v); setApplied(false) }} options={[{ k: 'w1', label: 'worst: 1 split' }, { k: 'w2', label: 'worst: 2' }, { k: 'w3', label: 'worst: 3' }, { k: 'naive', label: 'bad for "1 if full"' }, { k: 'asc', label: '1..60' }, { k: 'rand', label: 'random' }]} />
          <Slider label="bank of a 1-key node" value={bank[0]} min={0} max={3} onChange={(v) => setBank([v, bank[1], bank[2]])} format={(v) => v} />
          <Slider label="bank of a 2-key node" value={bank[1]} min={0} max={3} onChange={(v) => setBank([bank[0], v, bank[2]])} format={(v) => v} />
          <Slider label="bank of a 3-key node (full)" value={bank[2]} min={0} max={3} onChange={(v) => setBank([bank[0], bank[1], v])} format={(v) => v} />
          <Btn onClick={() => setBank([0, 0, 1])}>"1 if full, else 0"</Btn>
          <Btn onClick={() => setApplied((a) => !a)} disabled={!after}>
            {applied ? 'show tree before the last insert' : 'do the last insert'}
          </Btn>
        </>
      }
      caption={
        <>
          amortized cost of an insert = splits + change in bank. worst over this run (and the nastiest next insert): <b className={good ? 'algo-ok' : 'algo-no'}>{maxA}</b>
          {good ? ' — never above 1, so total splits ≤ number of inserts.' : ' — more than a constant can be charged to one insert, so this bank does not prove O(1).'}
          {data.next ? ` the last insert does ${lastR.splits} splits but amortizes to ${lastR.amortized}.` : ''}
        </>
      }
    >
      <BTreeSvg root={applied && after ? after.root : before} flash={applied && after ? after.events.flatMap((e) => (e.type === 'split' ? [e.median] : [e.key])) : []} />
      <Chart
        series={[
          { label: 'splits in that insert', color: 'blue', pts: rows.map((r, i) => [i + 1, r.splits]) },
          { label: 'amortized (splits + Δbank)', color: 'red', pts: rows.map((r, i) => [i + 1, r.amortized]) },
        ]}
        xLabel="insert #"
        height={170}
        yMin={Math.min(0, ...rows.map((r) => r.amortized))}
        yMax={Math.max(3, ...rows.map((r) => r.splits))}
        hline={1}
      />
      <p className="algo-say" style={{ margin: '2px 0 0' }}>
        total splits {totalSplits} · inserts {rows.length} · nodes = 1 + splits, and nodes ≤ keys, so splits ≤ n.
      </p>
    </Fig>
  )
}

/* ================================================================== red-black */

const toBin = (t: RB | null): BinT | null => (t ? { key: String(t.key), red: t.red, l: toBin(t.l), r: toBin(t.r) } : null)
const toBinB = (t: BNode | null) => t

export function RedBlackLab() {
  const seed = () => {
    let t: RB | null = null
    let last: RBStep[] = []
    for (const k of [10, 20, 30]) {
      const r = rbInsert(t, k)
      if (r.steps.length) last = r.steps
      t = r.root
    }
    return { t, last }
  }
  const [tree, setTree] = useState<RB | null>(() => seed().t)
  const [steps, setSteps] = useState<RBStep[]>(() => seed().last)
  const [si, setSi] = useState(() => Math.max(0, seed().last.length - 1))
  const [view, setView] = useState<'rb' | '234'>('rb')
  const [text, setText] = useState('')
  const [queue, setQueue] = useState<number[]>([15, 25, 5, 3, 1, 40, 50, 60, 35])
  const [picked, setPicked] = useState<number | null>(null)
  const add = (ks: number[]) => {
    let t = tree
    let last: RBStep[] = []
    for (const k of ks) {
      const r = rbInsert(t, k)
      if (r.steps.length) last = r.steps
      t = r.root
    }
    setTree(t)
    setSteps(last)
    setSi(Math.max(0, last.length - 1))
    setPicked(null)
  }
  const shown = steps.length ? steps[Math.min(si, steps.length - 1)] : null
  const cur = shown && si < steps.length - 1 ? shown.tree : tree
  const problems = rbValid(cur)
  const b = useMemo(() => to234(cur), [cur])
  return (
    <Fig
      n={13}
      title="red-black trees are 2-3-4 trees in disguise"
      hint="insert, step through the fix-up, flip to the 2-3-4 view, or rotate a node yourself"
      controls={
        <>
          <Btn
            onClick={() => {
              if (!queue.length) return
              add([queue[0]])
              setQueue(queue.slice(1))
            }}
            disabled={!queue.length}
          >
            insert next: {queue[0] ?? '—'}
          </Btn>
          <Btn onClick={() => { const z = seed(); setTree(z.t); setSteps(z.last); setSi(Math.max(0, z.last.length - 1)); setQueue([15, 25, 5, 3, 1, 40, 50, 60, 35]); setPicked(null) }}>reset</Btn>
          <Btn onClick={() => { setTree(null); setSteps([]); setSi(0); setQueue([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]); setPicked(null) }}>start over, sorted input</Btn>
          <Seg label="view" value={view} onChange={setView} options={[{ k: 'rb', label: 'red-black' }, { k: '234', label: '2-3-4 tree' }]} />
          {steps.length > 1 && <Slider label="fix-up step" value={Math.min(si, steps.length - 1)} min={0} max={steps.length - 1} onChange={setSi} format={(v) => `${v + 1} / ${steps.length}`} />}
          <label className="orb-slider hand">
            <span className="orb-slider-label">insert</span>
            <input className="algo-num" value={text} onChange={(e) => setText(e.target.value.replace(/[^0-9 ]/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter') { add(text.split(/\s+/).filter(Boolean).map(Number)); setText('') } }} aria-label="number to insert" placeholder="n + enter" />
          </label>
          <Btn onClick={() => { add(text.split(/\s+/).filter(Boolean).map(Number)); setText('') }}>insert</Btn>
          <Btn onClick={() => picked !== null && setTree(rbRotate(tree, picked, 'L'))} disabled={picked === null || !canRotate(tree, picked, 'L')}>
            rotate {picked ?? '?'} left
          </Btn>
          <Btn onClick={() => picked !== null && setTree(rbRotate(tree, picked, 'R'))} disabled={picked === null || !canRotate(tree, picked, 'R')}>
            rotate {picked ?? '?'} right
          </Btn>
        </>
      }
      caption={
        shown && si < steps.length ? (
          <>
            {shown.note}. {problems.length ? <span className="algo-no">broken so far: {problems[0]}</span> : <span className="algo-ok">all red-black properties hold.</span>}
          </>
        ) : problems.length ? (
          <span className="algo-no">{problems[0]}. a bare rotation moves nodes but not colors.</span>
        ) : (
          <>click a node to select it. rules: root black · no red child of a red node · same number of black nodes on every path.</>
        )
      }
    >
      {view === 'rb' ? <BinTreeSvg tree={toBin(cur)} color mark={shown ? shown.mark.map(String) : []} onPick={(k) => setPicked(Number(k))} picked={picked === null ? null : String(picked)} /> : <BTreeSvg root={toBinB(b)} />}
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        height {rbHeight(cur)} · black height {rbBlackHeight(cur)} · 2-3-4 depth {btHeight(b)} · a red node is a key sharing a 2-3-4 node with its black parent.
      </p>
    </Fig>
  )
}
