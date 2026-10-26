/* the little things that move, each drawn as the drawings are: a fine white gel-pen line, touched with gold */

export function Petal({ gold }: { gold?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.6c3.3 2.6 4.9 6 4.2 9.6-.6 3.1-2.3 5.6-4.2 7.2-1.9-1.6-3.6-4.1-4.2-7.2C5.1 7.6 6.7 4.2 10 1.6z"
        fill="rgba(242,236,224,0.1)" stroke={gold ? '#f0c88a' : '#f2ece0'} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M10 4.5v11" stroke={gold ? '#f0b46a' : '#e9d8b8'} strokeWidth="0.6" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

export function Blossom() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="12" cy="6.6" rx="3.6" ry="4.6" transform={`rotate(${a} 12 12)`} fill="rgba(242,236,224,0.08)" stroke="#f2ece0" strokeWidth="0.8" />
      ))}
      <circle cx="12" cy="12" r="1.6" fill="#f0b46a" />
    </svg>
  )
}

export function Ginkgo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21.5V13M12 13C8.6 13 4.2 10.4 3 5.6c2.8-1.7 6.2-2.4 9-2.4s6.2.7 9 2.4C19.8 10.4 15.4 13 12 13z"
        fill="rgba(240,180,106,0.12)" stroke="#f0b46a" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12 13 7.4 5M12 13l-2.2-9M12 13V3.6M12 13l2.2-9M12 13l4.6-8" stroke="#f0b46a" strokeWidth="0.45" opacity="0.7" />
    </svg>
  )
}

export function Star() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 0.5v11M0.5 6h11" stroke="#f4efe4" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M2.4 2.4l7.2 7.2M9.6 2.4 2.4 9.6" stroke="#f4efe4" strokeWidth="0.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}
