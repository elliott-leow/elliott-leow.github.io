import Link from 'next/link'
import type { NoteMeta } from '@/lib/content'

/** the notes as a table of contents: when, what, and a line about it */
export default function NoteList({ notes }: { notes: NoteMeta[] }) {
  return (
    <ol className="note-list">
      {notes.map((n) => (
        <li key={n.slug}>
          <Link href={`/notes/${n.slug}/`}>
            <span className="nl-date">{n.date}</span>
            <span className="nl-title">{n.title}</span>
            <span className="nl-preview">{n.preview}</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
