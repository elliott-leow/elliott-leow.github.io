import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { noteBySlug, notes } from '@/lib/content'
import { Hand } from '@/components/Paper'
import { DoodleUnderline } from '@/components/Doodles'

export const dynamicParams = false
export function generateStaticParams() {
  return notes.map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const n = noteBySlug((await params).slug)
  return n ? { title: n.title, description: n.preview } : {}
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const meta = noteBySlug(slug)
  if (!meta) notFound()
  const { default: Body } = await import(`@/content/notes/${slug}.mdx`)
  const i = notes.findIndex((n) => n.slug === slug)
  const older = notes[i + 1]
  return (
    <article className="note-page">
      <Link href="/notes/" className="back-link hand">
        ← all notes
      </Link>
      <header className="note-head">
        <p className="mono note-page-date">{meta.date}</p>
        <Hand as="h1" className="note-page-title" duration={0.8}>
          {meta.title}
        </Hand>
        <DoodleUnderline width={180} ink="red" variant={1} delay={0.6} />
      </header>
      <div className={`note-body ${meta.style}`}>
        <Body />
      </div>
      <footer className="note-end">
        <span className="hand ink-pencil">— E.</span>
        {older && (
          <Link href={`/notes/${older.slug}/`} className="hand">
            older: {older.title} →
          </Link>
        )}
      </footer>
    </article>
  )
}
