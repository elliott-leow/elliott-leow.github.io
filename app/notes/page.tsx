import type { Metadata } from 'next'
import Link from 'next/link'
import NoteIndex from '@/components/NoteIndex'
import { Hand } from '@/components/Paper'
import { DoodleUnderline } from '@/components/Doodles'

export const metadata: Metadata = { title: 'notes' }

export default function Notes() {
  return (
    <div className="notes-page">
      <Link href="/" className="back-link hand">
        ← back
      </Link>
      <header className="notes-head">
        <Hand as="h1" className="page-title">
          notes
        </Hand>
        <DoodleUnderline width={110} ink="blue" variant={2} delay={0.4} />
      </header>
      <NoteIndex />
    </div>
  )
}
