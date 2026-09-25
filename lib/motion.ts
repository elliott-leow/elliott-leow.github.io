import type { Transition } from 'motion/react'

/** the spring for things you can pick up */
export const paperSpring: Transition = { type: 'spring', stiffness: 350, damping: 28, mass: 0.7 }
/** a heavier, slower settle, for things being set down */
export const settleSpring: Transition = { type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }
/** a pen moving: fast in the middle, slows as it lifts */
export const penEase = [0.55, 0.05, 0.35, 1] as const
