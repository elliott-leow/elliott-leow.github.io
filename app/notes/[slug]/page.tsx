import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { noteBySlug, notes } from '@/lib/content'
import { Colophon, TopBar } from '@/components/site/Chrome'

export const dynamicParams = false
export function generateStaticParams() {
  return notes.map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const n = noteBySlug((await params).slug)
  return n ? {
    title: n.title,
    description: n.preview || n.title,
    ...(n.unlisted ? { robots: { index: false, follow: false } } : {}),
  } : {}
}

/* a note is a page of the notebook: indigo dot-grid paper torn off the pad, laid over the top bar's */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const meta = noteBySlug(slug)
  if (!meta) notFound()
  const { default: Body } = await import(`@/content/notes/${slug}.mdx`)
  const i = notes.findIndex((n) => n.slug === slug)
  const older = notes.slice(i + 1).find((n) => !n.unlisted)
  const home = slug === 'teaching-experience'
  return (
    <>
      <TopBar current="Notes" />
      <main className="leaf-wrap">
        <article className="leaf leaf-dusk note-leaf">
          <div className="note-page">
            <header className="note-label">
              <p className="kicker">Note, {meta.date}</p>
              <h1 className="pen" data-reveal>{meta.title}</h1>
              {meta.preview && <p className="line quiet">{meta.preview}</p>}
            </header>
            <div className={`note-body ${meta.style}`}>
              <Body />
            </div>
            <nav className="turn" aria-label="More notes">
              <Link href={home ? '/' : '/notes/'}><span aria-hidden="true">←</span> {home ? 'Home' : 'All notes'}</Link>
              {older && <Link href={`/notes/${older.slug}/`} className="turn-next">{older.title} <span aria-hidden="true">→</span></Link>}
            </nav>
          </div>
        </article>
      </main>
      <Colophon />
    </>
  )
}
