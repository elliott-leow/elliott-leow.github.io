'use client'

/* ten fresh exam-style questions, every time */
import { useMemo, useState } from 'react'
import { Btn, Fig } from './kit'
import { makeSet } from '@/lib/algos/quiz'

export function ExamDrill() {
  const [seed, setSeed] = useState(1)
  const qs = useMemo(() => makeSet(seed, 10), [seed])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const done = i >= qs.length
  const q = qs[Math.min(i, qs.length - 1)]
  const choose = (k: number) => {
    if (picked !== null) return
    setPicked(k)
    if (k === q.answer) setScore((s) => s + 1)
  }
  const next = () => {
    setPicked(null)
    setI(i + 1)
  }
  const again = () => {
    setSeed((s) => s + 1)
    setI(0)
    setPicked(null)
    setScore(0)
  }
  return (
    <Fig n={32} title="exam drill" hint="ten new questions every round, computed from the same code as the figures" controls={done ? <Btn onClick={again}>ten new questions</Btn> : picked !== null ? <Btn onClick={next}>{i === qs.length - 1 ? 'see score' : 'next question'}</Btn> : undefined}>
      <div className="orb-quiz">
        {done ? (
          <>
            <div className="orb-quiz-score hand">
              {score} / {qs.length}
            </div>
            <div className="orb-quiz-done hand">{score === qs.length ? 'all of them. go to sleep.' : score >= 7 ? 'solid. redo the figures for what you missed.' : 'go back to the figures for the topics you missed, then try again.'}</div>
          </>
        ) : (
          <>
            <span className="orb-quiz-q hand">
              {i + 1} of {qs.length} · {q.topic}
            </span>
            <div className="orb-quiz-rxn" style={{ fontSize: 16 }}>
              {q.q}
            </div>
            <div className="orb-quiz-opts" role="group" aria-label="answers">
              {q.options.map((o, k) => (
                <button key={k} type="button" className={`orb-chip ${picked !== null ? (k === q.answer ? 'is-right' : k === picked ? 'is-wrong' : '') : ''}`} disabled={picked !== null && k !== q.answer && k !== picked} onClick={() => choose(k)}>
                  {o}
                </button>
              ))}
            </div>
            <div className="orb-quiz-foot">
              <span className="orb-quiz-why hand">{picked === null ? '' : picked === q.answer ? `✓ ${q.why}` : `✗ ${q.why}`}</span>
            </div>
          </>
        )}
      </div>
    </Fig>
  )
}
