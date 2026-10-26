import Link from 'next/link'
import { Colophon, TopBar } from '@/components/site/Chrome'

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main className="leaf-wrap">
        <section className="leaf leaf-dusk">
          <div className="lost-leaf">
            <h1>This page was torn out.</h1>
            <p><Link className="link" href="/">Back to the front page</Link></p>
          </div>
        </section>
      </main>
      <Colophon />
    </>
  )
}
