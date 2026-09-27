import { links } from '@/lib/content'
import Signature from '@/components/Signature'
import { Hand } from '@/components/Paper'
import { InkLink, Typed } from '@/components/Ink'
import NoteIndex from '@/components/NoteIndex'
import Music from '@/components/Music'
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
        <Typed className="mono pg-line" text="almost done with undergrad." speed={20} />
      </div>

      <section className="pg-about" aria-labelledby="about-h">
        <Hand as="h2" className="pg-notes-h" trigger="load">
          <span id="about-h">about me</span>
        </Hand>
        <p className="mono pg-about-text">i study biomedical engineering and computer science at johns hopkins. im interested in medical devices and ai in healthcare.</p>
      </section>

      <section className="pg-music" aria-labelledby="music-h">
        <Hand as="h2" className="pg-notes-h" trigger="load">
          <span id="music-h">music</span>
        </Hand>
        <Music />
      </section>

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
        <Hand as="h2" className="pg-notes-h" trigger="load">
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
