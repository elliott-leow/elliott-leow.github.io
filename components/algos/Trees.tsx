'use client'

/* lecture 6 and homework 3: search trees */
import { useMemo, useState, type ReactNode } from 'react'
import { Box, Btn, Chart, Fig, Line, Seg, Slider, T, r1 } from './kit'
import { Edge, Node, Narr, OpLog, PAINT, Pace, Run, Stage, Tile, freshKey, randInt, useFrames, useLog, type Paint, type Speed } from './Live'
import { bankRun, bestNextAmortized, bstDepthOf, bstHeight, bstInsert, btHeight, btInsert, btKeys, btNodes, btPath, btValid, NAIVE_BAD, rbBlackHeight, rbHeight, rbInsert, rbValid, to234, worstSequence, type BNode, type BST, type RB } from '@/lib/algos/trees'
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
      n={17}
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

/* ------------------------------------------------------------------ a multiway tree on a stage, moving */

const TW = 30
const GAPB = 14
function spreadB(root: BNode | null) {
  const cells: { key: string; x: number; y: number }[] = []
  const links: { id: string; x1: number; y1: number; x2: number; y2: number }[] = []
  if (!root) return { cells, links, w: 0, h: 44 }
  const memo = new Map<BNode, number>()
  const kidsW = (n: BNode): number => n.kids.reduce((s, k) => s + width(k), 0) + GAPB * Math.max(0, n.kids.length - 1)
  const width = (n: BNode): number => {
    if (!memo.has(n)) memo.set(n, Math.max(n.keys.length * TW, kidsW(n)))
    return memo.get(n)!
  }
  const place = (n: BNode, x0: number, y: number): number => {
    const own = n.keys.length * TW
    const x = x0 + (width(n) - own) / 2
    n.keys.forEach((k, i) => cells.push({ key: k, x: x + i * TW, y }))
    let cx = x0 + (width(n) - kidsW(n)) / 2
    n.kids.forEach((c, i) => {
      links.push({ id: c.keys[0], x1: x + i * TW, y1: y + 26, x2: place(c, cx, y + LH), y2: y + LH })
      cx += width(c) + GAPB
    })
    return x + own / 2
  }
  const w = width(root) + 24
  place(root, 12 + Math.max(0, (320 - w) / 2), 8)
  return { cells, links, w, h: (btHeight(root) - 1) * LH + 44 }
}
function BTreeStage({ root, paint, at, fit, speed, label }: { root: BNode | null; paint: (key: string) => Paint; at?: string; fit: boolean; speed: Speed; label: string }) {
  const { cells, links, w, h } = useMemo(() => spreadB(root), [root])
  const f = cells.find((c) => c.key === at)
  return (
    <Stage w={w} h={h} focus={f ? f.x + TW / 2 : undefined} fit={fit} speed={speed} label={label}>
      {!root && <T x={160} y={28} size={14}>empty</T>}
      {links.map((l) => (
        <Edge key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
      {cells.map((c) => (
        <Tile key={c.key} x={c.x} y={c.y} w={TW} label={c.key} size={c.key.length > 3 ? 10.5 : 12} paint={paint(c.key)} />
      ))}
    </Stage>
  )
}

/* ================================================================== B-tree / 2-3-4 */

type BF = { root: BNode | null; hot: string[]; path: string[]; full: string[]; say: string; at?: string }
const SEED_B = ['50', '20', '80', '35']
const firstB = (t: number): BF => ({ root: SEED_B.reduce<BNode | null>((r, k) => btInsert(r, k, t).root, null), hot: [], path: [], full: [], say: '' })
const s = (n: number) => (n === 1 ? '' : 's')

export function BTreeLab() {
  const [t, setT] = useState(2)
  const [order, setOrder] = useState<'random' | 'up'>('random')
  const [speed, setSpeed] = useState<Speed>('normal')
  const [fit, setFit] = useState(false)
  const [splits, setSplits] = useState(0)
  const fr = useFrames<BF>(firstB(2), speed)
  const { log, count, add, clear } = useLog()
  const reset = (tt = t) => {
    fr.play([firstB(tt)])
    clear()
    setSplits(0)
  }
  const go = () => {
    const root = fr.end.root
    const have = btKeys(root).map(Number)
    const num = order === 'random' ? freshKey(have, 1, 999) : Math.max(0, ...have) + randInt(1, 5)
    if (num === null) return
    const k = String(num)
    const path = btPath(root, k)
    const full = path.filter((n) => n.keys.length === 2 * t - 1)
    const x = btInsert(root, k, t)
    const frames: BF[] = [
      {
        root,
        hot: [],
        path: path.flatMap((n) => n.keys),
        full: full.flatMap((n) => n.keys),
        at: path[path.length - 1]?.keys[0],
        say: `insert ${k}: walk down from the root as a lookup would (blue). ${full.length ? `${full.length} node${s(full.length)} on the way ${full.length === 1 ? 'is' : 'are'} full (red): each splits before we step into it.` : 'no node on the way is full, so nothing will split.'}`,
      },
    ]
    x.events.forEach((e, i) =>
      frames.push(
        e.type === 'split'
          ? { root: x.snaps[i], hot: [e.median], path: [], full: [], at: e.median, say: `[${e.before.join(' ')}] is full. its middle key ${e.median} moves up${e.root ? ' into a brand new root, so the whole tree is one level taller' : ' into the parent'}, and the other ${2 * t - 2} keys become two nodes of ${t - 1}.` }
          : { root: x.snaps[i], hot: [e.key], path: [], full: [], at: e.key, say: `${e.key} goes into the leaf, which is now [${e.leaf.join(' ')}]. ${x.splits} split${s(x.splits)} for this insert.` },
      ),
    )
    fr.play(frames)
    setSplits(splits + x.splits)
    add(`insert ${k}: ${x.splits ? `${x.splits} split${s(x.splits)}` : 'no split'}, height ${btHeight(x.root)}`)
  }
  const { frame } = fr
  const bad = btValid(frame.root, t)
  const nodes = btNodes(frame.root)
  const total = nodes.reduce((sum, n) => sum + n.keys.length, 0)
  const paint = (k: string) => (frame.hot.includes(k) ? PAINT.hot : frame.full.includes(k) ? PAINT.bad : frame.path.includes(k) ? PAINT.path : PAINT.plain)
  return (
    <Fig
      n={18}
      title={t === 2 ? '2-3-4 tree (B-tree, t = 2)' : `B-tree, t = ${t}`}
      hint="one press inserts one random key. blue = the way down, red = full, yellow = what just moved"
      controls={
        <>
          <span className="hand">settings:</span>
            <Seg label="t" value={String(t) as '2' | '3' | '4'} onChange={(v) => { setT(+v); reset(+v) }} options={[{ k: '2', label: 't = 2  (1–3 keys)' }, { k: '3', label: 't = 3  (2–5 keys)' }, { k: '4', label: 't = 4  (3–7 keys)' }]} />
            <Seg label="keys arrive" value={order} onChange={setOrder} options={[{ k: 'random', label: 'random keys' }, { k: 'up', label: 'increasing keys' }]} />
          <Pace speed={speed} setSpeed={setSpeed} fit={fit} setFit={setFit} />
        </>
      }
    >
      <Run onGo={go} onReset={() => reset()} count={count} />
      <Narr step={fr.step} steps={fr.steps}>
        {frame.say ? (
          <>
            {frame.say}
          </>
        ) : (
          <>each node other than the root holds {t - 1} to {2 * t - 1} keys, and all leaves are at the same depth. press the yellow button and watch where the key goes.</>
        )}
      </Narr>
      <BTreeStage root={frame.root} paint={paint} at={frame.at} fit={fit} speed={speed} label="B-tree" />
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        {total} keys in {nodes.length} nodes · height {btHeight(frame.root)} · {splits} split{s(splits)} in {count} insert{s(count)} · properties {bad.length ? `BROKEN: ${bad[0]}` : 'all hold ✓'}
      </p>
      <OpLog log={log} />
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
      n={23}
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

const DX = 32
const DY = 46
const RED: Paint = { fill: 'rgba(192, 67, 45, 0.9)', stroke: 'var(--red-pen)', ink: '#fdfcf8' }
const BLACK: Paint = { fill: 'var(--ink)', ink: '#fdfcf8' }
function spreadRB(t: RB | null) {
  const nodes: { key: number; red: boolean; x: number; y: number; up: number | null }[] = []
  let i = 0
  let deep = 0
  const walk = (n: RB | null, d: number, up: number | null) => {
    if (!n) return
    walk(n.l, d + 1, n.key)
    nodes.push({ key: n.key, red: n.red, x: i++ * DX, y: 22 + d * DY, up })
    deep = Math.max(deep, d)
    walk(n.r, d + 1, n.key)
  }
  walk(t, 0, null)
  const w = (nodes.length - 1) * DX + 48
  const x0 = 24 + Math.max(0, (320 - w) / 2)
  nodes.forEach((n) => (n.x += x0))
  return { nodes, w, h: deep * DY + 46 }
}

type RF = { t: RB | null; mark: number[]; path: number[]; say: string; at?: number }
const firstRB = (): RF => ({ t: [50, 20, 80].reduce<RB | null>((t, k) => rbInsert(t, k).root, null), mark: [], path: [], say: '' })
const rbKeys = (t: RB | null): number[] => (t ? [...rbKeys(t.l), t.key, ...rbKeys(t.r)] : [])

export function RedBlackLab() {
  const [order, setOrder] = useState<'random' | 'up'>('random')
  const [twin, setTwin] = useState(true)
  const [speed, setSpeed] = useState<Speed>('normal')
  const [fit, setFit] = useState(false)
  const [work, setWork] = useState({ recolor: 0, rotate: 0 })
  const fr = useFrames<RF>(firstRB(), speed)
  const { log, count, add, clear } = useLog()
  const reset = () => {
    fr.play([firstRB()])
    clear()
    setWork({ recolor: 0, rotate: 0 })
  }
  const go = () => {
    const tree = fr.end.t
    const have = rbKeys(tree)
    const k = order === 'random' ? freshKey(have, 1, 999) : Math.max(0, ...have) + randInt(1, 5)
    if (k === null) return
    const path: number[] = []
    for (let n = tree; n; n = k < n.key ? n.l : n.r) path.push(n.key)
    const { steps } = rbInsert(tree, k)
    const frames: RF[] = [{ t: tree, mark: [], path, at: path[path.length - 1], say: `insert ${k}: walk down like any binary search tree (${path.join(' → ')}). ${k} will hang under ${path[path.length - 1]}.` }]
    steps.forEach((st, i) =>
      frames.push({
        t: st.tree,
        mark: st.mark,
        path: [],
        at: st.mark[0],
        say: i > 0 ? `${st.note}.` : steps.length === 1 ? `${k} goes in as a red leaf. its parent is black, so no rule is broken: done.` : `${k} goes in as a red leaf, but its parent is red too. two reds in a row is not allowed, so fix it:`,
      }),
    )
    const recolor = steps.filter((x) => x.note.startsWith('uncle red')).length
    const rotate = steps.filter((x) => x.note.includes('rotate')).length
    fr.play(frames)
    setWork({ recolor: work.recolor + recolor, rotate: work.rotate + rotate })
    add(`insert ${k}: ${recolor || rotate ? [recolor && `${recolor} recolor${s(recolor)}`, rotate && `${rotate} rotation${s(rotate)}`].filter(Boolean).join(', ') : 'nothing to fix'}, height ${rbHeight(steps[steps.length - 1].tree)}`)
  }
  const { frame } = fr
  const { nodes, w, h } = useMemo(() => spreadRB(frame.t), [frame.t])
  const at = new Map(nodes.map((n) => [n.key, n]))
  const problems = rbValid(frame.t)
  const b = useMemo(() => to234(frame.t), [frame.t])
  const n = nodes.length
  return (
    <Fig
      n={19}
      title="red-black trees are 2-3-4 trees in disguise"
      hint="one press inserts one random key, then repairs the colors one step at a time. blue ring = the nodes that step is about"
      controls={
        <>
          <span className="hand">settings:</span>
            <Seg label="keys arrive" value={order} onChange={setOrder} options={[{ k: 'random', label: 'random keys' }, { k: 'up', label: 'increasing keys' }]} />
            <Btn on={twin} onClick={() => setTwin(!twin)}>show the 2-3-4 tree underneath</Btn>
          <Pace speed={speed} setSpeed={setSpeed} fit={fit} setFit={setFit} />
        </>
      }
    >
      <Run onGo={go} onReset={reset} count={count} />
      <Narr step={fr.step} steps={fr.steps}>
        {frame.say ? (
          <>
            {frame.say} {fr.step > 1 && (problems.length ? <span className="algo-no">broken right now: {problems[0]}.</span> : <span className="algo-ok">all red-black rules hold.</span>)}
          </>
        ) : (
          <>rules: the root is black · a red node never has a red child · every path down has the same number of black nodes. press the yellow button.</>
        )}
      </Narr>
      <Stage w={w} h={h} focus={frame.at !== undefined ? at.get(frame.at)?.x : undefined} fit={fit} speed={speed} label="red-black tree">
        {nodes.map((c) => {
          const p = c.up === null ? null : at.get(c.up)
          return p ? <Edge key={c.key} x1={c.x} y1={c.y} x2={p.x} y2={p.y} stroke={c.red ? 'var(--red-pen)' : 'var(--pencil)'} w={c.red ? 2.6 : 1.3} /> : null
        })}
        {nodes.map((c) => (
          <Node key={c.key} x={c.x} y={c.y} label={c.key} size={c.key > 999 ? 9.5 : 11.5} paint={{ ...(c.red ? RED : BLACK), ...(frame.mark.includes(c.key) || frame.path.includes(c.key) ? { stroke: 'var(--blue-pen)', sw: 3.4 } : {}) }} />
        ))}
      </Stage>
      {twin && (
        <>
          <p className="algo-say" style={{ margin: '6px 0 0' }}>
            the same keys as a 2-3-4 tree: every black node swallows its red children.
          </p>
          <BTreeStage root={b} paint={(k) => (frame.mark.includes(+k) ? PAINT.hot : PAINT.plain)} at={frame.at !== undefined ? String(frame.at) : undefined} fit={fit} speed={speed} label="the same keys as a 2-3-4 tree" />
        </>
      )}
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        {n} keys · height {rbHeight(frame.t)} (limit 2 log(n + 1) = {r1(2 * Math.log2(n + 1))}) · black height {rbBlackHeight(frame.t)} · {work.recolor} recolor{s(work.recolor)} and {work.rotate} rotation{s(work.rotate)} in {count} insert{s(count)}
      </p>
      <OpLog log={log} />
    </Fig>
  )
}
