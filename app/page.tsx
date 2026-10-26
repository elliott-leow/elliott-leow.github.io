import Link from 'next/link'
import { links, listedNotes } from '@/lib/content'
import { Colophon, TopNav } from '@/components/site/Chrome'
import NoteList from '@/components/site/NoteList'
import NowPlaying from '@/components/site/NowPlaying'
import Sky from '@/components/site/Sky'
import Fall from '@/components/site/Fall'

const name = 'Elliott Leow'

export default function Home() {
  return (
    <div className="home">
      <a className="skip" href="#about">Skip to the page</a>
      {/* the front: the moonlit sea, in white and gold gel pen on navy; the name in the sky above it */}
      {/* (--nx: where across each drawing the name goes, in its open sky; it's pinned there however the drawing is cropped) */}
      <header className="front" style={{ '--nx-w': 0.46, '--nx-t': 0.5 } as React.CSSProperties}>
        <picture>
          <source media="(max-width: 700px)" srcSet="/art/hero/night-tall.webp" />
          <img className="sky" src="/art/sheets/night.webp" alt="" fetchPriority="high" decoding="async" />
        </picture>
        <Sky />
        <TopNav />
        <div className="title">
          {/* the name inks in a letter at a time */}
          <h1 className="name" aria-label={name}>
            {[...name].map((c, i) => <span key={i} aria-hidden="true" style={{ '--i': i } as React.CSSProperties}>{c}</span>)}
          </h1>
          <p className="role">Biomedical engineering + computer science, Johns Hopkins</p>
        </div>
      </header>

      <main>
        {/* about: slate, the sea rolling along its foot with a paper boat riding it */}
        <div className="leaf-wrap">
          <section className="leaf leaf-slate" id="about" aria-labelledby="h-about">
            <img className="deco deco-waves draw-lr" data-reveal src="/art/sheets/waves.webp" alt="" loading="lazy" decoding="async" />
            <Fall seed={3} n={10} kind="firefly" x={[4, 96]} y={[92, 58]} rise />
            <div className="shelf about">
              <h2 id="h-about" className="pen" data-reveal>About</h2>
              <p className="about-words rise" data-reveal>
                I’m interested in medical devices and AI in healthcare, particularly how patients interact with LLMs and how
                those interactions could be improved. I also enjoy{' '}
                <Link href="/notes/teaching-experience/" className="link">teaching</Link> and exploring ways to make technology
                more intuitive to use.
              </p>
              <ul className="contact rise" data-reveal aria-label="Contact">
                <li><a className="link" href={`mailto:${links.email}`}>{links.email}</a></li>
                <li><a className="link" href={links.github} rel="me">GitHub</a></li>
                <li><a className="link" href={links.linkedin} rel="me">LinkedIn</a></li>
              </ul>
            </div>
          </section>
        </div>

        {/* listening: an indigo page of the dot-grid notebook, a plum branch and a singing bird over its corner */}
        <div className="leaf-wrap">
          <section className="leaf leaf-dusk" id="listening" aria-labelledby="h-listening">
            <img className="deco deco-branch draw-rl" data-reveal src="/art/sheets/branch.webp" alt="" loading="lazy" decoding="async" />
            <Fall seed={5} n={8} kind="petal" x={[62, 94]} y={[14, 93]} spread={30} />
            <div className="shelf">
              <h2 id="h-listening" className="pen" data-reveal>Listening</h2>
              <div className="rise" data-reveal><NowPlaying /></div>
            </div>
          </section>
        </div>

        {/* notes: dark green graph paper, paper cranes and constellations about its margins */}
        <div className="leaf-wrap">
          <section className="leaf leaf-pine" id="notes" aria-labelledby="h-notes">
            <img className="deco deco-cranes float" data-reveal src="/art/sheets/cranes.webp" alt="" loading="lazy" decoding="async" />
            <img className="deco-m float" data-reveal src="/art/sheets/cranes-top.webp" alt="" loading="lazy" decoding="async" />
            <Fall seed={9} n={6} kind="ginkgo" x={[1, 11]} y={[4, 94]} spread={6} />
            <Fall seed={11} n={5} kind="ginkgo" x={[89, 99]} y={[4, 94]} spread={6} />
            <div className="shelf">
              <h2 id="h-notes" className="pen" data-reveal>Notes</h2>
              <div className="rise" data-reveal><NoteList notes={listedNotes.slice(0, 3)} /></div>
              <p className="shelf-more"><Link className="board-link" href="/notes/"><span>All notes</span> <span aria-hidden="true">→</span></Link></p>
            </div>
          </section>
        </div>
      </main>
      <Colophon />
    </div>
  )
}
