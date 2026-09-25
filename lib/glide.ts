'use client'

import { useEffect, type RefObject } from 'react'

/** the pieces of each page that move on their own when the window changes size; none sits inside another */
const PIECES = [
  '.pg-name',
  '.pg-line',
  '.pg-links li',
  '.pg-notes',
  '.pg-photos',
  '.notes-page > *',
  '.note-page > *',
  '.lost > *',
].join(',')

/** where the layout puts an element, ignoring any transform, translate or rotate on it or above it */
function place(el: HTMLElement) {
  let x = 0
  let y = 0
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) {
    x += e.offsetLeft
    y += e.offsetTop
  }
  return { x, y }
}

/**
 * When the window is resized, things on the page slide over to where the new layout
 * puts them instead of jumping there. Each resize measures the new layout, then starts
 * every piece from wherever it currently is on screen, so a drag of the window edge
 * reads as one continuous glide.
 */
export function useGlide(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current
    if (!host || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const last = new WeakMap<Element, { x: number; y: number }>()
    const running = new WeakMap<Element, Animation>()
    const pieces = () => Array.from(host.querySelectorAll<HTMLElement>(PIECES))

    // layout can change without a resize too (a note preview opening, a new page): just take note of it
    const remember = () => pieces().forEach((el) => last.set(el, place(el)))

    const onResize = () => {
      const els = pieces()
      // where each piece is drawn right now, part way through any glide it is already on
      const drawn = els.map((el) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
        return { dx: m.m41, dy: m.m42 }
      })
      els.forEach((el, i) => {
        const now = place(el)
        const was = last.get(el)
        last.set(el, now)
        if (!was) return
        const dx = was.x - now.x + drawn[i].dx
        const dy = was.y - now.y + drawn[i].dy
        running.get(el)?.cancel()
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
        running.set(
          el,
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
            duration: 520,
            easing: 'cubic-bezier(0.22, 0.7, 0.2, 1)',
          }),
        )
      })
    }

    remember()
    const ro = new ResizeObserver(remember)
    ro.observe(host)
    window.addEventListener('resize', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [root])
}
