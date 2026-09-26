import { links } from '@/lib/content'
import Signature from '@/components/Signature'
import { Hand } from '@/components/Paper'
import { InkLink, Typed } from '@/components/Ink'
import NoteIndex from '@/components/NoteIndex'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="page">
      {/* photos go back here, see content/notes/template.mdx */}
      <div className="pg-intro">
        <h1 className="sr-only">Elliott Leow</h1>
        <div className="pg-name">
          <Signature />
        </div>
        <Typed className="mono pg-line" text="almost done with undergrad." delay={1550} speed={20} />
      </div>

      <ul className="pg-links">
        <li>
          <InkLink href={`mailto:${links.email}`} icon="email">email</InkLink>
        </li>
        <li>
          <InkLink href={links.github} i={1} icon="github">
            github
          </InkLink>
        </li>
        <li>
          <InkLink href={links.linkedin} i={2} icon="linkedin">
            linkedin
          </InkLink>
        </li>
      </ul>

      <section className="pg-notes" aria-labelledby="notes-h">
        <Hand as="h2" className="pg-notes-h" write={false}>
          <span id="notes-h">notes</span>
        </Hand>
        <NoteIndex limit={3} compact />
        <Link href="/notes/" className="pg-notes-all hand">
          all of them →
        </Link>
      </section>

    </div>
  )
}
