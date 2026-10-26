import type { Metadata } from 'next'
import { listedNotes } from '@/lib/content'
import NoteList from '@/components/site/NoteList'
import Fall from '@/components/site/Fall'
import { Colophon, TopBar } from '@/components/site/Chrome'

export const metadata: Metadata = { title: 'Notes' }

export default function Notes() {
  return (
    <>
      <TopBar />
      <main className="leaf-wrap">
        <section className="leaf leaf-pine" aria-labelledby="h-notes">
          <img className="deco deco-cranes float" data-reveal src="/art/sheets/cranes.webp" alt="" decoding="async" />
          <img className="deco-m float" data-reveal src="/art/sheets/cranes-top.webp" alt="" decoding="async" />
          <Fall seed={9} n={6} kind="ginkgo" x={[1, 11]} y={[4, 94]} spread={6} />
          <Fall seed={11} n={5} kind="ginkgo" x={[89, 99]} y={[4, 94]} spread={6} />
          <div className="shelf">
            <h1 id="h-notes" className="shelf-title pen" data-reveal>Notes</h1>
            <NoteList notes={listedNotes} />
          </div>
        </section>
      </main>
      <Colophon />
    </>
  )
}
