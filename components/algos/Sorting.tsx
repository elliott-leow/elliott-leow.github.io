'use client'

/* lecture 5 and homework 2: lower bounds, counting sort, radix sort, strings */
import { useMemo, useState } from 'react'
import { Box, Btn, Cells, Chart, Fig, Line, Num, Say, Seg, Slider, T, r1, type Tone } from './kit'
import { adversary, bestQuery, countingSort, factorial, groupBound, groupOutcomes, keyCount, lowerBound, makeGame, radixCost, radixLSD, radixMSD, sortStrings, split, type CRec, type Game, type Mode } from '@/lib/algos/sorting'
import { rng, shuffle, ri } from '@/lib/algos/rng'

/* ================================================================== the game */

type Preset = { id: string; label: string; mode: Mode; n: number; k?: number }
const PRESETS: Preset[] = [
  { id: 's3', label: 'sort 3', mode: 'sort', n: 3 },
  { id: 's4', label: 'sort 4', mode: 'sort', n: 4 },
  { id: 's5', label: 'sort 5', mode: 'sort', n: 5 },
  { id: 'g42', label: '2-group-sort 4', mode: 'group', n: 4, k: 2 },
  { id: 'g62', label: '2-group-sort 6', mode: 'group', n: 6, k: 2 },
  { id: 'g63', label: '3-group-sort 6', mode: 'group', n: 6, k: 3 },
  { id: 'd2', label: 'dumbbells 2', mode: 'dumbbell', n: 2 },
  { id: 'd3', label: 'dumbbells 3', mode: 'dumbbell', n: 3 },
  { id: 'd4', label: 'dumbbells 4', mode: 'dumbbell', n: 4 },
  { id: 'f9', label: 'find the index (9)', mode: 'search', n: 9 },
]
const letters = 'ABCDEFGH'
const pretty = (g: Game, key: string) => {
  const v = key.split(',').map(Number)
  if (g.mode === 'sort') return v.map((x) => x + 1).join('')
  if (g.mode === 'group') return v.map((x) => letters[x]).join('')
  if (g.mode === 'dumbbell') return v.map((x) => x + 1).join('')
  return String(v[0] + 1)
}

type TreeNode = { q: number; kids: { out: number; node: TreeNode | null; key: string | null }[] }
function buildTree(g: Game, alive: number[], asked: Set<number>): TreeNode | null {
  if (keyCount(g, alive) <= 1) return null
  const q = bestQuery(g, alive, asked)
  const a2 = new Set(asked).add(q)
  const parts = split(g, alive, q).filter((p) => p.alive.length)
  return {
    q,
    kids: parts.map((p) => {
      const sub = buildTree(g, p.alive, a2)
      return { out: p.out, node: sub, key: sub ? null : g.key(g.inputs[p.alive[0]]) }
    }),
  }
}
type Placed = { x: number; y: number; label: string; leaf: boolean; kids: { to: Placed; out: string; out_i: number }[]; id: string }
function layout(g: Game, t: TreeNode, W: number): { root: Placed; depth: number; leaves: number } {
  let leaf = 0
  let depth = 0
  const total = (function count(n: TreeNode): number { return n.kids.reduce((s, k) => s + (k.node ? count(k.node) : 1), 0) })(t)
  const step = W / total
  const rec = (n: TreeNode | null, key: string | null, d: number, id: string): Placed => {
    depth = Math.max(depth, d)
    if (!n) {
      const x = step * (leaf++ + 0.5)
      return { x, y: d, label: pretty(g, key!), leaf: true, kids: [], id }
    }
    const kids = n.kids.map((k, i) => ({ to: rec(k.node, k.key, d + 1, id + i), out: g.outLabels[k.out], out_i: k.out }))
    return { x: kids.reduce((s, k) => s + k.to.x, 0) / kids.length, y: d, label: g.queries[n.q].label, leaf: false, kids, id }
  }
  const root = rec(t, null, 0, 'r')
  return { root, depth, leaves: total }
}

export function LowerBoundGame() {
  const [pid, setPid] = useState('s3')
  const P = PRESETS.find((p) => p.id === pid)!
  const g = useMemo(() => makeGame(P.mode, P.n, P.k), [P.mode, P.n, P.k])
  const all = useMemo(() => g.inputs.map((_, i) => i), [g])
  const [log, setLog] = useState<{ q: number; out: number; alive: number[]; before: number }[]>([])
  const alive = log.length ? log[log.length - 1].alive : all
  const keys = keyCount(g, alive)
  const keys0 = useMemo(() => keyCount(g, all), [g, all])
  const asked = new Set(log.map((l) => l.q))
  const lb = lowerBound(keys0, g.outcomes)
  const done = keys <= 1
  const tree = useMemo(() => {
    const t = keys0 <= 12 ? buildTree(g, all, new Set()) : null
    return t ? layout(g, t, 520) : null
  }, [g, all, keys0])
  const ask = (q: number) => {
    if (done || asked.has(q)) return
    const a = adversary(g, alive, q)
    setLog([...log, { q, out: a.out, alive: a.alive, before: keys }])
  }
  const smart = () => {
    let cur = log.slice()
    let al = alive
    const as = new Set(asked)
    while (keyCount(g, al) > 1) {
      const q = bestQuery(g, al, as)
      if (q < 0) break
      as.add(q)
      const a = adversary(g, al, q)
      cur = [...cur, { q, out: a.out, alive: a.alive, before: keyCount(g, al) }]
      al = a.alive
    }
    setLog(cur)
  }
  const pathIds = useMemo(() => {
    if (!tree) return new Set<string>()
    const ids = new Set<string>(['r'])
    let node = tree.root
    for (const l of log) {
      const kid = node.kids.find((k) => k.out_i === l.out)
      if (!kid || node.label !== g.queries[l.q].label) break
      ids.add(kid.to.id)
      node = kid.to
    }
    return ids
  }, [tree, log, g])
  const th = tree ? 34 + tree.depth * 46 : 0
  return (
    <Fig
      n={11}
      title="you are the algorithm. an adversary answers."
      hint={`goal: pin down ${g.what}. each answer keeps as many possibilities alive as it can`}
      controls={
        <>
          <Btn onClick={smart} disabled={done}>
            let a smart algorithm finish
          </Btn>
          <Btn onClick={() => setLog(log.slice(0, -1))} disabled={!log.length}>
            undo
          </Btn>
          <Btn onClick={() => setLog([])} disabled={!log.length}>
            reset
          </Btn>
          <div className="orb-seg" role="radiogroup" aria-label="problem">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={pid === p.id} className={`orb-btn hand ${pid === p.id ? 'is-on' : ''}`} onClick={() => { setPid(p.id); setLog([]) }}>
                {p.label}
              </button>
            ))}
          </div>
        </>
      }
      caption={
        done ? (
          <>
            done in <b>{log.length}</b> questions. no algorithm can do it in fewer than ⌈log<sub>{g.outcomes}</sub> {keys0}⌉ = <b>{lb}</b>.
          </>
        ) : (
          <>
            {keys} of {keys0} possible answers left. every question has {g.outcomes} outcomes, so it can shrink them by at most ÷{g.outcomes}: you need ≥ ⌈log<sub>{g.outcomes}</sub> {keys0}⌉ = <b>{lb}</b> in all.
          </>
        )
      }
    >
      <div className="orb-seg" style={{ margin: '4px 0 8px' }} role="group" aria-label="questions">
        {g.queries.map((q, i) => (
          <Btn key={i} on={asked.has(i)} onClick={() => ask(i)} disabled={done || asked.has(i)}>
            {q.label}
          </Btn>
        ))}
      </div>
      <div className="algo-scroll">
        <table className="algo-table" aria-label="the questions so far">
          <thead>
            <tr>
              <th>question</th>
              <th>adversary says</th>
              <th>answers left</th>
            </tr>
          </thead>
          <tbody>
            {log.map((l, i) => (
              <tr key={i}>
                <td>{g.queries[l.q].label}</td>
                <td>{g.outLabels[l.out]}</td>
                <td>
                  {l.before} → {keyCount(g, l.alive)}
                </td>
              </tr>
            ))}
            {!log.length && (
              <tr>
                <td colSpan={3}>{keys0} possible answers ({P.mode === 'sort' ? `${P.n}!` : P.mode === 'group' ? `${P.n}!/(${P.n / (P.k ?? 1)}!)^${P.k}` : P.mode === 'dumbbell' ? `${P.n}! matchings` : `${P.n} indices`}). pick a question.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {tree && (
        <svg viewBox={`0 0 560 ${th + 10}`} className="orb-svg" role="img" aria-label="an optimal decision tree; the path your answers took is in red">
          <g transform="translate(20 8)">
            {(function draw(n: Placed): React.ReactNode {
              return (
                <g key={n.id}>
                  {n.kids.map((k) => (
                    <g key={k.to.id}>
                      <Line x1={n.x} y1={n.y * 46 + 12} x2={k.to.x} y2={k.to.y * 46 + 12} tone={pathIds.has(k.to.id) && pathIds.has(n.id) ? 'red' : 'pencil'} w={pathIds.has(k.to.id) && pathIds.has(n.id) ? 2.6 : 1.2} />
                      <T x={(n.x + k.to.x) / 2} y={(n.y * 46 + k.to.y * 46) / 2 + 20} size={10.5} ink="pencil">
                        {k.out}
                      </T>
                    </g>
                  ))}
                  <Box x={n.x - (n.leaf ? 20 : 30)} y={n.y * 46} w={n.leaf ? 40 : 60} h={24} size={n.leaf ? 11 : 10.5} tone={n.leaf ? (pathIds.has(n.id) && done ? 'yellow' : 'green') : pathIds.has(n.id) ? 'yellow' : 'none'} label={n.label} />
                  {n.kids.map((k) => draw(k.to))}
                </g>
              )
            })(tree.root)}
          </g>
        </svg>
      )}
    </Fig>
  )
}

/* ================================================================== how many answers? group sorting */

export function GroupBound() {
  const [lgN, setLgN] = useState(6)
  const [lgK, setLgK] = useState(3)
  const n = 2 ** lgN
  const k = 2 ** Math.min(lgK, lgN)
  const b = groupBound(n, k)
  const curve = Array.from({ length: lgN + 1 }, (_, i) => i).filter((i) => i >= 1)
  return (
    <Fig
      n={12}
      title="how many answers does k-group-sorting have?"
      hint="fewer than sorting. log of that count is the lower bound"
      controls={
        <>
          <Slider label="n = 2^" value={lgN} min={2} max={14} onChange={(v) => { setLgN(v); setLgK((x) => Math.min(x, v)) }} format={(v) => `${v}  (n = ${2 ** v})`} />
          <Slider label="k = 2^" value={Math.min(lgK, lgN)} min={0} max={lgN} onChange={setLgK} format={(v) => `${v}  (k = ${2 ** v})`} />
        </>
      }
      caption={
        <>
          answers = n! / ((n/k)!)<sup>k</sup>. log₂ of it is <b>{r1(b.bits)}</b> bits ≈ {k > 1 ? `${r1(b.frac * 100)}% of` : ''} n log₂ k = {r1(b.nlogk)}. so Ω(n log k) comparisons.
        </>
      }
    >
      <Chart
        series={[
          { label: 'log₂(answers)', color: 'red', pts: curve.map((i) => [i, groupBound(n, 2 ** i).bits]) },
          { label: 'n log₂ k', color: 'blue', pts: curve.map((i) => [i, groupBound(n, 2 ** i).nlogk]), dash: '5 4' },
        ]}
        xLabel="log₂ k"
        height={210}
        marker={Math.min(lgK, lgN)}
        yMin={0}
      />
      <p className="algo-say" style={{ margin: '2px 0 0' }}>
        why it works: each comparison has 2 outcomes, so ≥ log₂(answers) comparisons. log n! ≈ n log n, and each of the k groups still hides (n/k)! orders that we do <i>not</i> need: subtract k·(n/k)log(n/k), and n log n − n log(n/k) = n log k.
      </p>
    </Fig>
  )
}

/* ================================================================== counting sort */

const KEY_TONE: Tone[] = ['blue', 'red', 'green', 'yellow', 'pink']
export function CountingSortDemo() {
  const [seed, setSeed] = useState(4)
  const [stable, setStable] = useState(true)
  const [step, setStep] = useState(0)
  const K = 4
  const recs: CRec[] = useMemo(() => {
    const r = rng(seed * 31)
    return Array.from({ length: 9 }, (_, i) => ({ key: ri(r, 0, K - 1), id: 'abcdefghi'[i] }))
  }, [seed])
  const cs = useMemo(() => countingSort(recs, K, stable), [recs, stable])
  const s = Math.min(step, cs.steps.length)
  const placed: (CRec | null)[] = Array(recs.length).fill(null)
  cs.steps.slice(0, s).forEach((st) => (placed[st.slot] = st.rec))
  const cur = s > 0 ? cs.steps[s - 1] : null
  const prefix = cur ? cur.prefix : cs.cum
  const cw = 44
  const x0 = 38
  const tied = K
  const orderOK = (() => {
    for (let i = 1; i < cs.out.length; i++) if (cs.out[i].key === cs.out[i - 1].key && cs.out[i].id < cs.out[i - 1].id) return false
    return true
  })()
  return (
    <Fig
      n={13}
      title="counting sort"
      hint="count, prefix-sum, then drop each item into its slot"
      controls={
        <>
          <Btn onClick={() => setStep(s + 1)} disabled={s >= recs.length}>
            place next item
          </Btn>
          <Btn onClick={() => setStep(recs.length)} disabled={s >= recs.length}>
            finish
          </Btn>
          <Btn onClick={() => setStep(0)}>reset</Btn>
          <Btn onClick={() => { setSeed((x) => x + 1); setStep(0) }}>new input</Btn>
          <Seg label="scan" value={stable ? 's' : 'u'} onChange={(v) => { setStable(v === 's'); setStep(0) }} options={[{ k: 's', label: 'right → left (stable)' }, { k: 'u', label: 'left → right' }]} />
        </>
      }
      caption={
        s < recs.length ? (
          <>each key v goes to slot prefix[v]−1, then prefix[v] shrinks. {stable ? 'scanning from the right keeps equal keys in their original order.' : 'scanning from the left flips equal keys.'}</>
        ) : orderOK ? (
          <>sorted, and equal keys kept their order (a before b before c…): <b>stable</b>. cost O(n + k).</>
        ) : (
          <>sorted by key, but equal keys got <b>reversed</b>: not stable. radix sort would break.</>
        )
      }
    >
      <svg viewBox="0 0 560 250" className="orb-svg" role="img" aria-label="counting sort state">
        <T x={4} y={22} anchor="start" size={13} ink="pencil">
          in
        </T>
        <Cells x={x0} y={6} cw={cw} ch={30} size={13} items={recs.map((r, i) => ({ label: `${r.key}${r.id}`, tone: KEY_TONE[r.key], ring: !!cur && cur.i === i, faint: cs.steps.slice(0, s).some((st) => st.i === i) }))} />
        <T x={4} y={92} anchor="start" size={13} ink="pencil">
          key
        </T>
        {Array.from({ length: K }, (_, v) => (
          <g key={v}>
            <Box x={x0 + v * 70} y={70} w={60} h={26} tone={KEY_TONE[v]} label={v} title={`key ${v}`} />
            <T x={x0 + v * 70 + 30} y={112} size={12} ink="blue">
              {`count ${cs.counts[v]}`}
            </T>
            <T x={x0 + v * 70 + 30} y={130} size={12} ink="red">
              {`prefix ${prefix[v]}`}
            </T>
          </g>
        ))}
        <T x={330} y={90} anchor="start" size={13} ink="pencil">
          prefix[v] = where key v&apos;s block ends
        </T>
        <T x={4} y={192} anchor="start" size={13} ink="pencil">
          out
        </T>
        <Cells x={x0} y={176} cw={cw} ch={30} size={13} items={placed.map((r, i) => ({ label: r ? `${r.key}${r.id}` : '', tone: r ? KEY_TONE[r.key] : 'none', dashed: !r, ring: !!cur && cur.slot === i }))} />
        {Array.from({ length: recs.length }, (_, i) => (
          <T key={i} x={x0 + i * cw + cw / 2} y={226} size={11} ink="pencil">
            {i}
          </T>
        ))}
      </svg>
    </Fig>
  )
}

/* ================================================================== radix sort */

export function RadixDemo() {
  const [text, setText] = useState('353 457 657 839 436 720 355')
  const [stable, setStable] = useState(true)
  const [pass, setPass] = useState(0)
  const [mode, setMode] = useState<'lsd' | 'msd'>('lsd')
  const nums = useMemo(() => text.split(/[\s,]+/).map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x) && x >= 0 && x < 1000).slice(0, 12), [text])
  const d = 3
  const lsd = useMemo(() => radixLSD(nums, 10, d, stable), [nums, stable])
  const p = Math.min(pass, d)
  const rows: number[][] = [nums, ...lsd.passes.map((q) => q.order)]
  const cur = rows[p]
  const digitAt = (v: number, i: number) => Math.floor(v / 10 ** i) % 10
  const sortedOK = lsd.out.every((v, i) => i === 0 || lsd.out[i - 1] <= v)
  const msd = useMemo(() => radixMSD(nums, 10, d), [nums])
  const cw = 46
  return (
    <Fig
      n={14}
      title="radix sort, one digit at a time"
      hint="least significant first. then try it with a sort that is not stable"
      controls={
        <>
          <Seg label="direction" value={mode} onChange={setMode} options={[{ k: 'lsd', label: 'least digit first' }, { k: 'msd', label: 'most digit first (buckets)' }]} />
          <Btn onClick={() => setPass(p + 1)} disabled={p >= d || mode === 'msd'}>
            next pass
          </Btn>
          <Btn onClick={() => setPass(0)}>reset</Btn>
          <Seg label="inner sort" value={stable ? 's' : 'u'} onChange={(v) => { setStable(v === 's'); setPass(0) }} options={[{ k: 's', label: 'stable' }, { k: 'u', label: 'scrambles ties' }]} />
          <label className="orb-slider hand">
            <span className="orb-slider-label">numbers</span>
            <input className="algo-num" style={{ width: '16em' }} value={text} onChange={(e) => { setText(e.target.value); setPass(0) }} aria-label="numbers" />
          </label>
          <Btn onClick={() => { setText('123 112'); setPass(0); setStable(false) }}>break it: 123 112</Btn>
        </>
      }
      caption={
        mode === 'msd' ? (
          <>bucket by the biggest digit, sort inside each bucket by the next, and so on. it works, but you have to keep every bucket around.</>
        ) : p < d ? (
          <>pass {p + 1}: look only at the {['ones', 'tens', 'hundreds'][p]} digit (blue). ties must keep the order the earlier passes made.</>
        ) : sortedOK ? (
          <>sorted. by induction: after pass i the numbers are sorted by their last i digits, and stability keeps that when a tie appears.</>
        ) : (
          <>wrong! an unstable inner sort threw away the order from the earlier passes.</>
        )
      }
    >
      <svg viewBox={`0 0 560 ${mode === 'lsd' ? (p + 1) * 46 + 6 : 200}`} className="orb-svg" role="img" aria-label="radix sort passes">
        {mode === 'lsd' ? (
          rows.slice(0, p + 1).map((row, ri2) => (
            <g key={ri2}>
              <T x={4} y={24 + ri2 * 46} anchor="start" size={12} ink="pencil">
                {ri2 === 0 ? 'input' : `pass ${ri2}`}
              </T>
              {row.map((v, i) => {
                const s = String(v).padStart(d, '0')
                return (
                  <g key={i}>
                    <Box x={70 + i * cw} y={6 + ri2 * 46} w={cw - 4} h={34} tone="none" label="" title={s} />
                    {s.split('').map((ch, ci) => {
                      const pos = d - 1 - ci // digit index from least significant
                      const hot = ri2 < d + 1 && pos === ri2 - 1 // digit sorted in this pass
                      const next = ri2 === p && pos === ri2 && p < d
                      return (
                        <text key={ci} x={r1(70 + i * cw + 8 + ci * 11)} y={r1(28 + ri2 * 46)} fontSize={15} className="orb-t" fill={hot ? 'var(--red-pen)' : next ? 'var(--blue-pen)' : 'var(--ink)'} fontWeight={hot || next ? 700 : 400}>
                          {ch}
                        </text>
                      )
                    })}
                  </g>
                )
              })}
            </g>
          ))
        ) : (
          <g>
            <T x={4} y={24} anchor="start" size={12} ink="pencil">
              buckets
            </T>
            {Array.from({ length: 10 }, (_, dg) => {
              const inB = nums.filter((v) => digitAt(v, 2) === dg)
              return (
                <g key={dg}>
                  <Box x={70 + (dg % 5) * 96} y={6 + Math.floor(dg / 5) * 80} w={90} h={22} tone={inB.length ? 'yellow' : 'grey'} label={`hundreds = ${dg}`} size={11} />
                  <T x={70 + (dg % 5) * 96 + 45} y={48 + Math.floor(dg / 5) * 80} size={12} ink="blue">
                    {radixMSD(inB, 10, d).join(' ')}
                  </T>
                </g>
              )
            })}
            <T x={280} y={190} size={13} ink="green">
              {`result: ${msd.join(' ')}`}
            </T>
          </g>
        )}
      </svg>
    </Fig>
  )
}

/* ================================================================== radix cost */

export function RadixCost() {
  const [n, setN] = useState(1000)
  const [c, setC] = useState(3)
  const U = Math.pow(n, c)
  const pts = Array.from({ length: 30 }, (_, i) => {
    const lb = 1 + (i * (Math.log2(n) + 4)) / 29
    const base = 2 ** lb
    return [lb, radixCost(n, U, base).cost] as [number, number]
  })
  const best = pts.reduce((a, b) => (b[1] < a[1] ? b : a))
  const at = radixCost(n, U, n)
  const bin = radixCost(n, U, 2)
  return (
    <Fig
      n={15}
      title="how big a base?"
      hint="numbers up to n^c, radix sort with base b: passes × (n + b)"
      controls={
        <>
          <Slider label="n" value={n} min={100} max={100000} step={100} onChange={setN} format={(v) => v} />
          <Slider label="c  (numbers < n^c)" value={c} min={1} max={6} onChange={setC} format={(v) => v} />
        </>
      }
      caption={
        <>
          base 2: {bin.passes} passes, cost {bin.cost.toLocaleString()}. base n: <b>{at.passes} passes</b>, cost <b>{at.cost.toLocaleString()} = {r1(at.cost / n)}n</b>. constant c ⇒ O(n). a bigger base costs n + b per pass, so stop near b ≈ n.
        </>
      }
    >
      <Chart series={[{ label: 'total work', color: 'red', pts }]} xLabel="log₂ b" yLabel="passes × (n + b)" height={200} marker={Math.log2(n)} yFmt={(v) => (v >= 1000 ? `${r1(v / 1000)}k` : String(Math.round(v)))} yMin={0} />
      <Say>
        best on the plot: b ≈ 2^{r1(best[0])}. recitation: d passes of O(n) each can only tell apart n^d values, so a constant number of passes ⇔ a polynomial universe.
      </Say>
    </Fig>
  )
}

/* ================================================================== homework 2: strings */

export function StringSort() {
  const [text, setText] = useState('b ab a ba abc bb c a')
  const [pos, setPos] = useState(0)
  const strs = useMemo(() => text.toLowerCase().split(/\s+/).filter((s) => /^[a-c]+$/.test(s)).slice(0, 60), [text])
  const res = useMemo(() => sortStrings(strs, 'abc'), [strs])
  const shown = Math.min(pos, res.passes.length)
  const ok = JSON.stringify(res.out) === JSON.stringify([...strs].sort())
  return (
    <Fig
      n={16}
      title="strings of different lengths, sorted in O(total length)"
      hint="the last position first; only strings that reach it join in"
      controls={
        <>
          <Btn onClick={() => setPos(shown + 1)} disabled={shown >= res.passes.length}>
            next position
          </Btn>
          <Btn onClick={() => setPos(res.passes.length)} disabled={shown >= res.passes.length}>
            finish
          </Btn>
          <Btn onClick={() => setPos(0)}>reset</Btn>
          <label className="orb-slider hand">
            <span className="orb-slider-label">strings over a b c</span>
            <input className="algo-num" style={{ width: '18em' }} value={text} onChange={(e) => { setText(e.target.value); setPos(0) }} aria-label="strings" />
          </label>
          <Btn onClick={() => { setText(`${'a '.repeat(20)}${'ab'.repeat(20)}`); setPos(0) }}>one long, many short</Btn>
        </>
      }
      caption={
        shown < res.passes.length ? (
          <>{shown === 0 ? 'strings of length L wait in a bucket. ' : ''}position {res.passes[shown]?.pos}: sort the strings that have that position, stably, on that letter. shorter strings that end here go in front (they are smaller).</>
        ) : (
          <>
            {ok ? 'sorted ✓' : 'not sorted ✗'}. work = <b>{res.cost}</b> ≈ total length ({res.total}) + small terms. padding every string to length L would cost <b>{res.padded}</b>.
          </>
        )
      }
    >
      <div className="algo-scroll">
        <table className="algo-table" aria-label="passes">
          <thead>
            <tr>
              <th>after position</th>
              <th>strings in play</th>
              <th>list</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>start</td>
              <td>0 of {strs.length}</td>
              <td>{strs.join(' ')}</td>
            </tr>
            {res.passes.slice(0, shown).map((q) => (
              <tr key={q.pos}>
                <td>{q.pos}</td>
                <td>
                  {q.participants} of {strs.length}
                </td>
                <td>{q.list.join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fig>
  )
}
