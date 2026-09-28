'use client'

/* lecture 7 and homework 3: amortized analysis */
import { useMemo, useState } from 'react'
import { Box, Btn, Cells, Chart, Fig, Num, Say, Seg, Slider, T, r1, type Tone } from './kit'
import { bestStatic, dictInsert, dictLookup, increment, listCost, mtfRun, pushCosts, type Dict, type Growth } from '@/lib/algos/amort'
import { rng, ri, shuffle } from '@/lib/algos/rng'

/* ================================================================== array stack */

export function ArrayGrowth() {
  const [growth, setGrowth] = useState<Growth>('double')
  const [n, setN] = useState(128)
  const [charge, setCharge] = useState(3)
  const { costs } = useMemo(() => pushCosts(n, growth), [n, growth])
  const total = costs.reduce((a, b) => a + b, 0)
  const bank: number[] = []
  let b = 0
  costs.forEach((c) => bank.push((b += charge - c)))
  const minBank = Math.min(...bank)
  const ok = minBank >= 0
  const running = costs.map((_, i) => costs.slice(0, i + 1).reduce((a, x) => a + x, 0) / (i + 1))
  const xs = costs.map((_, i) => i + 1)
  return (
    <Fig
      n={14}
      title="a stack in an array: when it fills up, how big is the new array?"
      hint="a copy costs the current size. pay a flat charge per push into a bank"
      controls={
        <>
          <Seg label="grow by" value={growth} onChange={setGrowth} options={[{ k: 'plus1', label: '+1' }, { k: 'double', label: '×2' }, { k: 'x1.5', label: '×1.5' }, { k: 'x3', label: '×3' }]} />
          <Slider label="pushes" value={n} min={16} max={512} step={16} onChange={setN} format={(v) => v} />
          <Slider label="charge per push" value={charge} min={1} max={8} onChange={setCharge} format={(v) => v} />
        </>
      }
      caption={
        <>
          {n} pushes cost <b>{total}</b> = {r1(total / n)} each, but one push cost {Math.max(...costs)}. with a charge of {charge}, the bank {ok ? <span className="algo-ok">never goes negative: amortized O({charge}) = O(1)</span> : <span className="algo-no">goes negative (lowest {minBank}): {charge} per push is not enough</span>}.
        </>
      }
    >
      <Chart
        series={[
          { label: 'cost of each push', color: 'blue', pts: xs.map((x, i) => [x, costs[i]]) },
          { label: 'average so far', color: 'red', pts: xs.map((x, i) => [x, running[i]]) },
        ]}
        xLabel="push #"
        height={180}
        yMin={0}
        yMax={Math.max(8, Math.min(Math.max(...costs), n))}
      />
      <Chart series={[{ label: `bank (charge ${charge})`, color: ok ? 'green' : 'red', pts: xs.map((x, i) => [x, bank[i]]) }]} height={140} hline={0} xLabel="push #" />
    </Fig>
  )
}

/* ================================================================== binary counter */

export function CounterDemo() {
  const W = 8
  const [bits, setBits] = useState<number[]>(Array(W).fill(0))
  const [hist, setHist] = useState<{ cost: number; phi: number; amort: number; down: number }[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const bump = (times: number) => {
    let b = bits
    let h = hist
    let f: number[] = []
    for (let t = 0; t < times; t++) {
      const before = b.reduce((s, x) => s + x, 0)
      const r = increment(b)
      const nb = r.bits.slice(0, W)
      f = Array.from({ length: r.down }, (_, i) => i).concat([r.i])
      h = [...h, { cost: r.cost, phi: r.phi, amort: r.cost + r.phi - before, down: r.down }]
      b = nb
      if (r.bits.length > W) b = Array(W).fill(0)
    }
    setBits(b)
    setHist(h)
    setFlipped(f)
  }
  const ones = bits.reduce((s, x) => s + x, 0)
  const total = hist.reduce((s, x) => s + x.cost, 0)
  const last = hist[hist.length - 1]
  const value = parseInt([...bits].reverse().join(''), 2)
  return (
    <Fig
      n={15}
      title="binary counter: three ways to see amortized 2"
      hint="pay 2 to turn a 0 into a 1: one for the flip, one saved on the bit for its flip back"
      controls={
        <>
          <Btn onClick={() => bump(1)}>+1</Btn>
          <Btn onClick={() => bump(7)}>+7</Btn>
          <Btn onClick={() => bump(64)}>+64</Btn>
          <Btn onClick={() => { setBits(Array(W).fill(0)); setHist([]); setFlipped([]) }}>reset</Btn>
        </>
      }
      caption={
        last ? (
          <>
            that increment: {last.down} bit{last.down === 1 ? '' : 's'} 1→0, one 0→1: cost {last.cost}. tokens on the bits (Φ = number of 1s) = {ones}. amortized = cost + ΔΦ = <b>{last.amort}</b>. total {total} over {hist.length} increments = {r1(total / hist.length)} each.
          </>
        ) : (
          <>each 1 carries a token. a 1→0 flip is paid by its token; only one bit per increment goes 0→1.</>
        )
      }
    >
      <svg viewBox="0 0 560 130" className="orb-svg" role="img" aria-label="an 8-bit counter">
        {bits
          .slice()
          .reverse()
          .map((b, i) => {
            const idx = W - 1 - i
            return (
              <g key={idx}>
                <Box x={40 + i * 56} y={30} w={48} h={48} label={b} size={24} tone={b ? 'yellow' : 'none'} ring={flipped.includes(idx)} title={`bit ${idx} = ${b}`} />
                {b === 1 && <circle cx={r1(64 + i * 56)} cy={94} r={8} fill="var(--red-pen)" opacity={0.85} />}
                <T x={64 + i * 56} y={22} size={11} ink="pencil">
                  {`2^${idx}`}
                </T>
              </g>
            )
          })}
        <T x={40} y={124} anchor="start" size={14} ink="blue">
          {`value ${value}`}
        </T>
        <T x={520} y={124} anchor="end" size={14} ink="red">
          {`${ones} token${ones === 1 ? '' : 's'} in the bank`}
        </T>
      </svg>
      {hist.length > 1 && (
        <Chart
          series={[
            { label: 'cost of each increment', color: 'blue', pts: hist.map((h, i) => [i + 1, h.cost]) },
            { label: 'average so far', color: 'red', pts: hist.map((_, i) => [i + 1, hist.slice(0, i + 1).reduce((s, x) => s + x.cost, 0) / (i + 1)]) },
          ]}
          xLabel="increment #"
          height={160}
          yMin={0}
          hline={2}
        />
      )}
    </Fig>
  )
}

/* ================================================================== the sorted-arrays dictionary */

export function LogDictionary() {
  const [dict, setDict] = useState<Dict>([])
  const [count, setCount] = useState(0)
  const [costs, setCosts] = useState<number[]>([])
  const [last, setLast] = useState<{ merges: number[]; cost: number; landed: number } | null>(null)
  const [probe, setProbe] = useState<{ found: boolean; probes: number; x: number } | null>(null)
  const ins = (times: number) => {
    let d = dict
    let c = count
    let cs = costs
    let l = last
    const r = rng(c * 17 + 3)
    for (let t = 0; t < times; t++) {
      const x = ri(r, 1, 999) * 1000 + c
      const out = dictInsert(d, x)
      d = out.dict
      c++
      cs = [...cs, out.cost]
      l = { merges: out.merges, cost: out.cost, landed: out.landed }
    }
    setDict(d)
    setCount(c)
    setCosts(cs)
    setLast(l)
  }
  const total = costs.reduce((a, b) => a + b, 0)
  const nonEmpty = dict.flatMap((a) => (a ? a : []))
  const cw = Math.min(22, Math.floor(440 / Math.max(count, 1)))
  return (
    <Fig
      n={16}
      title="a dictionary from sorted arrays of size 1, 2, 4, 8…"
      hint="inserting is adding 1 in binary; a carry is a merge"
      controls={
        <>
          <Btn onClick={() => ins(1)}>insert 1</Btn>
          <Btn onClick={() => ins(7)}>insert 7</Btn>
          <Btn onClick={() => ins(32)}>insert 32</Btn>
          <Btn
            onClick={() => {
              if (!nonEmpty.length) return
              const x = nonEmpty[Math.floor(Math.random() * nonEmpty.length)]
              setProbe({ ...dictLookup(dict, x), x })
            }}
            disabled={!nonEmpty.length}
          >
            look up something
          </Btn>
          <Btn onClick={() => { setDict([]); setCount(0); setCosts([]); setLast(null); setProbe(null) }}>reset</Btn>
        </>
      }
      caption={
        last ? (
          <>
            {count} items = {count.toString(2)} in binary. last insert merged {last.merges.length ? last.merges.map((m) => `${m}+${m}`).join(', then ') : 'nothing'} and landed in A[{last.landed}]: cost {last.cost}. total {total} = {r1(total / count)} per insert ≤ 2 log n + 1 = {r1(2 * Math.log2(Math.max(count, 2)) + 1)}.
            {probe ? ` lookup: ${probe.probes} probes (binary search in each non-empty array, ~log² n).` : ''}
          </>
        ) : (
          <>insert some items. a merge of two arrays of size m costs 2m, and the bit i is flipped only every 2^i inserts.</>
        )
      }
    >
      <svg viewBox={`0 0 560 ${Math.max(60, dict.length * 34 + 20)}`} className="orb-svg" role="img" aria-label="the arrays">
        {dict.map((a, i) => (
          <g key={i}>
            <T x={6} y={26 + i * 34} anchor="start" size={13} ink="pencil">
              {`A[${i}]`}
            </T>
            {a ? <Cells x={48} y={8 + i * 34} cw={Math.max(6, Math.min(cw, 440 / a.length))} ch={26} size={9} items={a.map((v) => ({ label: a.length <= 16 ? Math.floor(v / 1000) : '', tone: 'green' as Tone, ring: probe?.x === v }))} /> : <Box x={48} y={8 + i * 34} w={30} h={26} tone="none" dashed label="" />}
          </g>
        ))}
        {!dict.length && <T x={280} y={30} size={14}>empty</T>}
      </svg>
    </Fig>
  )
}

/* ================================================================== homework 3: move to front */

export function MoveToFront() {
  const [text, setText] = useState('1 1 2 2 2 3 4 4 4 4')
  const [refKind, setRefKind] = useState<'init' | 'best'>('init')
  const [shown, setShown] = useState(3)
  const items = [1, 2, 3, 4, 5, 6]
  const ops = text.split(/[\s,]+/).map(Number).filter((x) => x >= 1 && x <= 6).slice(0, 40)
  const ref = refKind === 'init' ? items : bestStatic(items, ops)
  const run = useMemo(() => mtfRun(items, ops, ref), [text, refKind])
  const upto = Math.min(shown, run.rows.length)
  const rows = run.rows.slice(0, upto)
  const c = rows.reduce((s, r) => s + r.cost, 0)
  const cr = rows.reduce((s, r) => s + r.refCost, 0)
  const phi = upto ? run.phi0 + rows.reduce((s, r) => s + r.dPhi, 0) : run.phi0
  const row = rows[rows.length - 1]
  return (
    <Fig
      n={18}
      title="move-to-front vs a fixed list"
      hint="potential Φ = number of pairs that are in a different order than in the fixed list"
      controls={
        <>
          <Btn onClick={() => setShown(upto + 1)} disabled={upto >= run.rows.length}>
            next lookup
          </Btn>
          <Btn onClick={() => setShown(run.rows.length)} disabled={upto >= run.rows.length}>
            all
          </Btn>
          <Btn onClick={() => setShown(0)}>reset</Btn>
          <Seg label="compare with" value={refKind} onChange={(v) => { setRefKind(v); setShown(0) }} options={[{ k: 'init', label: 'the starting list' }, { k: 'best', label: 'best fixed list' }]} />
          <label className="orb-slider hand">
            <span className="orb-slider-label">lookups (1–6)</span>
            <input className="algo-num" style={{ width: '18em' }} value={text} onChange={(e) => { setText(e.target.value); setShown(0) }} aria-label="lookups" />
          </label>
          <Btn onClick={() => { const r = rng(Date.now() % 9973); setText(Array.from({ length: 20 }, () => (r() < 0.6 ? ri(r, 1, 2) + 3 * ri(r, 0, 1) : ri(r, 1, 6))).join(' ')); setShown(0) }}>random</Btn>
        </>
      }
      caption={
        row ? (
          <>
            looked up x{row.x} at position {row.cost} (fixed list: {row.refCost}). A={row.A} were ahead in both lists, B={row.B} were only ahead here. moving x to the front: Φ changes by A − B = {row.dPhi}, so cost + ΔΦ = {row.cost} + {row.dPhi} = <b>{row.amortized} = 1 + 2A ≤ 2·{row.refCost} − 1</b>.
          </>
        ) : (
          <>fixed list: x{ref.join(' x')}. total for the fixed list: {run.refTotal}. pick lookups and step through.</>
        )
      }
    >
      <svg viewBox="0 0 560 76" className="orb-svg" role="img" aria-label="the list before and after">
        <T x={4} y={22} anchor="start" size={12} ink="pencil">
          fixed
        </T>
        <Cells x={60} y={6} cw={44} ch={24} size={12} items={ref.map((x) => ({ label: `x${x}`, tone: 'grey' as Tone }))} />
        <T x={4} y={58} anchor="start" size={12} ink="pencil">
          MTF
        </T>
        <Cells x={60} y={42} cw={44} ch={24} size={12} items={(row ? row.after : items).map((x) => ({ label: `x${x}`, tone: (row && x === row.x ? 'yellow' : 'none') as Tone }))} />
      </svg>
      <div className="algo-scroll">
        <table className="algo-table" aria-label="cost accounting">
          <thead>
            <tr>
              <th>after {upto} lookups</th>
              <th>MTF cost</th>
              <th>fixed-list cost</th>
              <th>Φ</th>
              <th>MTF ≤ 2·fixed + Φ₀ − Φ ?</th>
            </tr>
          </thead>
          <tbody>
            <tr className={c <= 2 * cr + run.phi0 - phi ? 'is-good' : 'is-bad'}>
              <td>totals</td>
              <td>{c}</td>
              <td>{cr}</td>
              <td>{phi}</td>
              <td>
                {c} ≤ {2 * cr + run.phi0 - phi} {c <= 2 * cr + run.phi0 - phi ? '✓' : '✗'}
              </td>
            </tr>
            <tr>
              <td>Φ₀ (start)</td>
              <td colSpan={4}>
                {run.phi0} {refKind === 'init' ? '— same list, so 0: C_MTF ≤ 2 C_init' : `— at most n(n−1)/2, so C_MTF ≤ 2 C_static + n²`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Fig>
  )
}
