'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** marks each thing with data-reveal as seen just before it comes into view (a fifth of a screen early, so it is
    already drawing as it arrives), so it draws (or writes) itself in then; looked
    for again on every page, since moving between pages brings new things without reloading */
export default function Life() {
  const path = usePathname()
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-seen)')
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-seen')); return }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-seen'); io.unobserve(e.target) }
    }, { rootMargin: '0px 0px 20% 0px', threshold: 0 })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [path])
  return null
}
