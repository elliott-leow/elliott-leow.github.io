import { links } from '@/lib/content'
import { Underlined } from '@/components/Doodles'
import { Hand } from '@/components/Paper'
import { InkLink } from '@/components/Ink'
import NoteIndex from '@/components/NoteIndex'
import Music from '@/components/Music'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="page home">
      {/* photos go back here, see content/notes/template.mdx */}
      <header className="pg-intro">
        <h1 className="pg-name" aria-label="Elliott Leow">Elliott.</h1>
        <div className="pg-card">
          <p className="pg-line">Biomedical engineering + computer science, Johns Hopkins</p>
        </div>
        {/* contact sits with the name, so it is the first thing you reach on a phone too */}
        <ul className="pg-links" aria-label="Contact">
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
      </header>

      <section className="pg-section pg-about" aria-labelledby="about-h">
        <Hand as="h2" className="pg-label" trigger="load">
          <span id="about-h">about</span>
        </Hand>
        <p className="pg-prose">
          I'm interested in medical devices and AI in healthcare. I also like (assisting){' '}
          <Link href="/notes/teaching-experience/" className="pg-inline">
            <Underlined>teaching</Underlined>
          </Link>
          .
        </p>
      </section>

      <section className="pg-section pg-music" aria-labelledby="music-h">
        <Hand as="h2" className="pg-label" trigger="load">
          <span id="music-h">listening</span>
        </Hand>
        <Music />
      </section>

      <section className="pg-section pg-notes" aria-labelledby="notes-h">
        <Hand as="h2" className="pg-label" trigger="load">
          <span id="notes-h">notes</span>
        </Hand>
        <div>
          <NoteIndex limit={3} compact />
          <Link href="/notes/" className="pg-notes-all hand">
            all notes →
          </Link>
        </div>
      </section>
    </div>
  )
}
