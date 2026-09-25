import type { MDXComponents } from 'mdx/types'
import { Circled, CrossOut, Highlight, Underlined } from '@/components/Doodles'
import { Hand, MarginNote, Sketch, StickyNote } from '@/components/Paper'
import Photo from '@/components/Photo'
import { photos } from '@/lib/content'

/* things you can use inside a note (see content/notes/template.mdx):
   <Margin>…</Margin>  <Hl>…</Hl>  <X>…</X>  <U>…</U>  <O>…</O>  <Pen>…</Pen>
   <Sticky front="…">…</Sticky>  <Figure src="…" alt="…" caption="…" />
   <Photo id="city" width={220} />  (a taped photo from lib/content.ts that you can pull on) */
const components: MDXComponents = {
  Margin: (p: { children: React.ReactNode; side?: 'left' | 'right' }) => (
    <MarginNote side={p.side ?? 'right'} rotation={-3}>
      {p.children}
    </MarginNote>
  ),
  Hl: (p: { children: React.ReactNode; tone?: 'yellow' | 'pink' | 'green' }) => <Highlight tone={p.tone}>{p.children}</Highlight>,
  X: (p: { children: React.ReactNode }) => <CrossOut>{p.children}</CrossOut>,
  U: (p: { children: React.ReactNode }) => <Underlined>{p.children}</Underlined>,
  O: (p: { children: React.ReactNode }) => <Circled>{p.children}</Circled>,
  Pen: (p: { children: React.ReactNode }) => (
    <Hand ink="blue" rotation={-1.5} className="note-pen">
      {p.children}
    </Hand>
  ),
  Sticky: (p: { front: string; children?: React.ReactNode; tone?: 'yellow' | 'pink' | 'blue' | 'green' }) => (
    <StickyNote front={p.front} tone={p.tone} rotation={2.5} className="note-sticky">
      {p.children}
    </StickyNote>
  ),
  Figure: (p: { src: string; alt: string; caption?: string; width?: number; rotation?: number }) => (
    <Sketch src={p.src} alt={p.alt} width={p.width ?? 420} rotation={p.rotation ?? -1.2} className="note-figure" tape={[{ x: 40, y: -12, w: 80, rot: -3, opacity: 0.7 }]}>
      {p.caption && <figcaption className="hand note-figure-caption">{p.caption}</figcaption>}
    </Sketch>
  ),
  Photo: (p: { id: keyof typeof photos; width?: number }) => <Photo photo={photos[p.id]} width={p.width ?? 200} className="note-photo" />,
  h2: (p) => <h2 className="hand note-h2" {...p} />,
  h3: (p) => <h3 className="hand note-h3" {...p} />,
  blockquote: (p) => <blockquote className="note-quote" {...p} />,
  hr: () => <hr className="note-hr" />,
  pre: (p) => <pre className="note-pre" {...p} />,
  a: (p) => <a className="note-a" {...p} target={p.href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" />,
}

export function useMDXComponents(): MDXComponents {
  return components
}
