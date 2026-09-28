'use client'

/* lecture 4: quickselect, median of medians, why groups of five */
import { useMemo, useState } from 'react'
import { Box, Btn, Cells, Chart, Fig, Say, Seg, Slider, T, r1 } from './kit'
import { bfprtTop, quickselect, recursionSum, worstFraction, type PivotRule } from '@/lib/algos/select'
import { rng, shuffle, ri } from '@/lib/algos/rng'

type Kind = 'random' | 'sorted' | 'reverse'
const makeArray = (n: number, kind: Kind, seed: number) => {
  const r = rng(seed * 7919 + n)
  const base = Array.from({ length: n }, (_, i) => (i + 1) * 4 - ri(r, 0, 2))
  return kind === 'sorted' ? base : kind === 'reverse' ? base.slice().reverse() : shuffle(base, r)
}
const RULES: { k: PivotRule; label: string }[] = [
  { k: 'first', label: 'first' },
  { k: 'last', label: 'last' },
  { k: 'middle', label: 'middle' },
  { k: 'median3', label: 'median of 3' },
  { k: 'mom', label: 'median of medians' },
]

/* ================================================================== quickselect */

export function QuickselectLab() {
  const [n, setN] = useState(16)
  const [kind, setKind] = useState<Kind>('random')
  const [seed, setSeed] = useState(1)
  const [rule, setRule] = useState<PivotRule>('first')
  const [k0, setK] = useState(8)
  const [shown, setShown] = useState(1)
  const k = Math.min(k0, n)
  const A = useMemo(() => makeArray(n, kind, seed), [n, kind, seed])
  const res = useMemo(() => quickselect(A, k, rule), [A, k, rule])
  const all = useMemo(() => RULES.map((r) => ({ ...r, res: quickselect(A, k, r.k) })), [A, k])
  const rows = res.rounds
  const vis = Math.min(shown, rows.length)
  const cw = Math.min(26, Math.floor(410 / n))
  const rh = 25
  const H = vis * rh + 14
  const reset = () => setShown(1)
  return (
    <Fig
      n={1}
      title="quickselect: find the kth smallest"
      hint="pick a pivot rule, then step through the rounds"
      controls={
        <>
          <Btn onClick={() => setShown((s) => s + 1)} disabled={vis >= rows.length}>
            next round
          </Btn>
          <Btn onClick={() => setShown(rows.length)} disabled={vis >= rows.length}>
            all rounds
          </Btn>
          <Btn onClick={reset}>reset</Btn>
          <Btn
            onClick={() => {
              setKind('sorted')
              setRule('first')
              setN(16)
              setK(16)
              setShown(99)
            }}
          >
            make it quadratic
          </Btn>
          <Seg label="input" value={kind} onChange={(v) => { setKind(v); reset() }} options={[{ k: 'random', label: 'random' }, { k: 'sorted', label: 'sorted' }, { k: 'reverse', label: 'reversed' }]} />
          <Seg label="pivot" value={rule} onChange={(v) => { setRule(v); reset() }} options={RULES.map((r) => ({ k: r.k, label: r.label }))} />
          <Slider label="n" value={n} min={4} max={30} onChange={(v) => { setN(v); reset() }} format={(v) => v} />
          <Slider label="k" value={k} min={1} max={n} onChange={(v) => { setK(v); reset() }} format={(v) => v} />
          <Btn onClick={() => { setSeed((s) => s + 1); reset() }}>reshuffle</Btn>
        </>
      }
      caption={
        vis < rows.length ? (
          <>round {vis} of {rows.length}. blue = smaller than the pivot, red = larger. only one side survives.</>
        ) : (
          <>
            found <b>{res.value}</b> (the {k}th smallest) in {rows.length} rounds, <b>{res.comps}</b> comparisons
            {res.comps > 3 * n ? ' — that is far more than n.' : ' — about linear.'}
          </>
        )
      }
    >
      <svg viewBox={`0 0 560 ${H}`} className="orb-svg" role="img" aria-label="quickselect rounds">
        {rows.slice(0, vis).map((rd, i) => {
          const y = 6 + i * rh
          const x0 = 8
          const dir = rd.size === 1 ? 'found' : rd.L.length === rd.k - 1 ? 'found' : rd.L.length > rd.k - 1 ? 'go left' : 'go right'
          return (
            <g key={i}>
              <Cells
                x={x0}
                y={y}
                cw={cw}
                ch={rh - 4}
                size={cw >= 20 ? 11 : 8.5}
                items={rd.arr.map((v) => ({ label: cw >= 14 ? v : '', tone: v === rd.pivot ? 'yellow' : v < rd.pivot ? 'blue' : 'red', bold: v === rd.pivot, title: String(v) }))}
              />
              <T x={x0 + n * cw + 8} y={y + 14} anchor="start" size={12} ink={dir === 'found' ? 'green' : 'pencil'}>
                {rd.size === 1 ? `only ${rd.pivot} left` : `p=${rd.pivot}  ${rd.L.length}|${rd.G.length}  ${dir}`}
              </T>
            </g>
          )
        })}
      </svg>
      <div className="algo-scroll">
        <table className="algo-table" aria-label="comparisons by pivot rule">
          <thead>
            <tr>
              <th>pivot rule on this input</th>
              <th>rounds</th>
              <th>comparisons</th>
            </tr>
          </thead>
          <tbody>
            {all.map((r) => (
              <tr key={r.k} className={r.k === rule ? 'is-good' : ''}>
                <td>{r.label}</td>
                <td>{r.res.rounds.length}</td>
                <td>{r.res.comps}</td>
              </tr>
            ))}
            <tr>
              <td>
                n = {n}, n²/2 = {(n * n) / 2}
              </td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </Fig>
  )
}

/* ================================================================== median of medians */

export function MedianOfMedians() {
  const [n, setN] = useState(25)
  const [g, setG] = useState(5)
  const [seed, setSeed] = useState(2)
  const [kind, setKind] = useState<Kind>('random')
  const [k, setK] = useState(13)
  const nn = Math.max(g, Math.round(n / g) * g)
  const A = useMemo(() => makeArray(nn, kind, seed), [nn, kind, seed])
  const top = useMemo(() => bfprtTop(A, g), [A, g])
  const kk = Math.min(k, nn)
  const rank = top.L.length + 1
  const cols = top.cols.length
  const cw = Math.min(34, Math.floor(520 / cols))
  const ch = 24
  const x0 = (560 - cols * cw) / 2
  const y0 = 44
  const H = y0 + g * ch + 44
  const side = top.L.length === kk - 1 ? 'the pivot is the answer' : top.L.length > kk - 1 ? `recurse on L (${top.L.length} left)` : `recurse on G (${top.G.length} left)`
  return (
    <Fig
      n={2}
      title="median of medians"
      hint="columns are the groups. each is sorted, then lined up by its median"
      controls={
        <>
          <Seg label="group size" value={String(g) as '3' | '5' | '7'} onChange={(v) => setG(+v)} options={[{ k: '3', label: 'groups of 3' }, { k: '5', label: 'groups of 5' }, { k: '7', label: 'groups of 7' }]} />
          <Slider label="n" value={nn} min={15} max={70} step={5} onChange={setN} format={(v) => v} />
          <Slider label="k" value={kk} min={1} max={nn} onChange={setK} format={(v) => v} />
          <Seg label="input" value={kind} onChange={setKind} options={[{ k: 'random', label: 'random' }, { k: 'sorted', label: 'sorted' }, { k: 'reverse', label: 'reversed' }]} />
          <Btn onClick={() => setSeed((s) => s + 1)}>reshuffle</Btn>
        </>
      }
      caption={
        <>
          p = <b>{top.p}</b> is only rank {rank} of {nn}, not the median. but at least {top.smaller.size} are surely smaller and {top.larger.size} surely larger, so {side}.
        </>
      }
    >
      <svg viewBox={`0 0 560 ${H}`} className="orb-svg" role="img" aria-label="groups sorted into columns, ordered by their medians">
        {top.cols.map((c, ci) => {
          const mi = top.mi(c)
          // biggest at the top
          const desc = c.slice().reverse()
          const missing = g - c.length
          return (
            <g key={ci}>
              {desc.map((v, ri2) => {
                const isMed = c.length - 1 - ri2 === mi
                const tone = v === top.p ? 'yellow' : top.smaller.has(v) ? 'blue' : top.larger.has(v) ? 'red' : 'none'
                return <Box key={v} x={x0 + ci * cw} y={y0 + (ri2 + missing) * ch} w={cw - 2} h={ch - 2} label={cw >= 22 ? v : ''} size={cw >= 28 ? 11.5 : 9} tone={tone} ring={isMed} title={`${v}${isMed ? ' (median of its group)' : ''}`} />
              })}
            </g>
          )
        })}
        <T x={280} y={y0 - 24} size={13} ink="pencil">
          each column is a group, biggest on top
        </T>
        <T x={280} y={y0 - 8} size={13} ink="pencil">
          red ring = its median · columns ordered by median →
        </T>
        <T x={280} y={y0 + g * ch + 20} size={14} ink="blue">
          {`blue: ≤ their group's median ≤ p  (${top.smaller.size})`}
        </T>
        <T x={280} y={y0 + g * ch + 38} size={14} ink="red">
          {`red: ≥ their group's median ≥ p  (${top.larger.size})`}
        </T>
      </svg>
      <p className="algo-say" style={{ margin: '4px 0 0' }}>
        really smaller |L| = <b>{top.L.length}</b> · larger |G| = <b>{top.G.length}</b> · promised worst side ≤ {r1(worstFraction(g) * 100)}% of n = {r1(worstFraction(g) * nn)} ·{' '}
        <span className={Math.max(top.L.length, top.G.length) <= worstFraction(g) * nn + 1 ? 'algo-ok' : 'algo-no'}>worst side is {Math.max(top.L.length, top.G.length)}</span>
      </p>
    </Fig>
  )
}

/* ================================================================== why 5 */

const Tfrac = (f1: number, f2: number) => {
  const M = new Map<string, number>()
  const t = (n: number): number => {
    if (n <= 5) return 1
    const key = n.toPrecision(9)
    let v = M.get(key)
    if (v === undefined) {
      v = t(f1 * n) + t(f2 * n) + n
      M.set(key, v)
    }
    return v
  }
  return t
}

export function WhyFive() {
  const [g, setG] = useState(5)
  const f1 = worstFraction(g)
  const f2 = 1 / g
  const s = recursionSum(g)
  const pts = (gg: number) => {
    const t = Tfrac(worstFraction(gg), 1 / gg)
    return Array.from({ length: 22 }, (_, i) => {
      const x = 1 + (i * 7) / 21
      return [x, t(Math.pow(10, x)) / Math.pow(10, x)] as [number, number]
    })
  }
  const lin = Math.abs(s - 1) > 1e-9 && s < 1
  const bars = Array.from({ length: 10 }, (_, i) => Math.pow(s, i))
  return (
    <Fig
      n={3}
      title="why groups of 5, not 3"
      hint="T(n) ≤ T(worst side) + T(n/g) + cn"
      controls={<Seg label="group size" value={String(g) as '3' | '5' | '7' | '9'} onChange={(v) => setG(+v)} options={[3, 5, 7, 9].map((x) => ({ k: String(x) as '3', label: `g = ${x}` }))} />}
      caption={
        lin ? (
          <>
            {r1(f1)}n + {r1(f2)}n = <b>{r1(s)}n &lt; n</b>: each level does less work than the one above, so the top level wins. <b>Θ(n)</b>.
          </>
        ) : (
          <>
            {r1(f1)}n + {r1(f2)}n = <b>n</b>: every level does the same work, and there are log n levels. <b>Θ(n log n)</b>.
          </>
        )
      }
    >
      <svg viewBox="0 0 560 110" className="orb-svg" role="img" aria-label="work per level of the recursion tree">
        <T x={8} y={16} anchor="start" size={13} ink="pencil">
          work at each level, as a multiple of cn:
        </T>
        {bars.map((b, i) => (
          <g key={i}>
            <Box x={12 + i * 54} y={92 - Math.max(3, b * 60)} w={44} h={Math.max(3, b * 60)} tone={lin ? 'green' : 'red'} label="" />
            <T x={34 + i * 54} y={106} size={11} ink="pencil">
              {`${r1(b)}`}
            </T>
          </g>
        ))}
      </svg>
      <Chart
        series={[
          { label: `g = ${g}`, color: lin ? 'green' : 'red', pts: pts(g) },
          ...(g !== 5 ? [{ label: 'g = 5', color: 'pencil' as const, pts: pts(5), dash: '5 4' }] : []),
        ]}
        xLabel="log₁₀ n"
        yLabel="T(n) / n"
        height={190}
        yMin={0}
      />
    </Fig>
  )
}

/* ================================================================== quicksort with a perfect pivot, stopped early */

export function MedianQuicksort() {
  const [n, setN] = useState(16)
  const [depth, setDepth] = useState(2)
  const [seed, setSeed] = useState(3)
  const A = useMemo(() => makeArray(n, 'random', seed), [n, seed])
  const d = Math.min(depth, Math.log2(n))
  // split every block at its median, `d` times
  const blocks = useMemo(() => {
    let bs: number[][] = [A]
    const levels: number[][][] = [bs]
    for (let i = 0; i < Math.floor(d); i++) {
      bs = bs.flatMap((b) => {
        if (b.length <= 1) return [b]
        const s = b.slice().sort((x, y) => x - y)
        const p = s[Math.floor((b.length - 1) / 2)]
        return [b.filter((x) => x <= p), b.filter((x) => x > p)]
      })
      levels.push(bs)
    }
    return levels
  }, [A, d])
  const cw = Math.min(30, Math.floor(520 / n))
  const rh = 32
  const groupSorted = (bs: number[][]) => bs.every((b, i) => i === 0 || Math.min(...b) > Math.max(...bs[i - 1]))
  const final = blocks[blocks.length - 1]
  return (
    <Fig
      n={4}
      title="median quicksort, stopped after d levels"
      hint="every level costs O(n) with median-of-medians"
      controls={
        <>
          <Slider label="levels d" value={Math.floor(d)} min={0} max={Math.floor(Math.log2(n))} onChange={setDepth} format={(v) => `${v}  (k = ${2 ** v} groups)`} />
          <Slider label="n" value={n} min={4} max={32} step={4} onChange={setN} format={(v) => v} />
          <Btn onClick={() => setSeed((s) => s + 1)}>reshuffle</Btn>
        </>
      }
      caption={
        <>
          after {Math.floor(d)} levels: <b>{2 ** Math.floor(d)}</b>-group sorted{groupSorted(final) ? ' ✓' : ' ✗'}, cost ≈ {Math.floor(d)}·n = O(n log k). the last level, d = log n, is a full sort.
        </>
      }
    >
      <svg viewBox={`0 0 560 ${blocks.length * rh + 6}`} className="orb-svg" role="img" aria-label="blocks after each median split">
        {blocks.map((bs, li) => {
          let x = (560 - n * cw) / 2
          return (
            <g key={li}>
              {bs.map((b, bi) => {
                const gx = x
                x += b.length * cw + 4
                return (
                  <Cells
                    key={bi}
                    x={gx - (bi * 4) / 2 + (bs.length * 2 - 2) / 2 * 0}
                    y={4 + li * rh}
                    cw={cw}
                    ch={rh - 8}
                    size={cw >= 22 ? 11 : 8}
                    items={b.map((v) => ({ label: cw >= 14 ? v : '', tone: (['blue', 'red', 'green', 'yellow', 'pink', 'grey', 'blue', 'red'] as const)[bi % 8] }))}
                  />
                )
              })}
            </g>
          )
        })}
      </svg>
    </Fig>
  )
}
