import type { ReactNode } from 'react'

/* what a problem takes and returns. the questions you answer before you look are in Learn.tsx */

export function Spec({ name, input, output, note }: { name: string; input: ReactNode; output: ReactNode; note?: ReactNode }) {
  return (
    <div className="algo-spec">
      <div className="algo-spec-name hand">{name}</div>
      <dl>
        <dt>input</dt>
        <dd>{input}</dd>
        <dt>output</dt>
        <dd>{output}</dd>
        {note && (
          <>
            <dt>note</dt>
            <dd>{note}</dd>
          </>
        )}
      </dl>
    </div>
  )
}
