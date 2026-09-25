import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="lost">
      <p className="hand lost-big">this page was torn out.</p>
      <Link href="/" className="hand ink-blue">
        ← back
      </Link>
    </div>
  )
}
