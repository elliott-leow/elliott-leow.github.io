/* the line drawings that sit beside each figure, so the orbital picture can be compared with what you'd write */
import type { StickSpec } from './kit'

export const sticks = {
  ethene: {
    pts: [[0, 0], [30, 0], [-16, -14], [-16, 14], [46, -14], [46, 14]],
    bonds: [[0, 1, 2, 1], [0, 2], [0, 3], [1, 4], [1, 5]],
    labels: { 2: 'H', 3: 'H', 4: 'H', 5: 'H' },
  },
  methane: {
    pts: [[0, 0], [0, -26], [-24, 12], [24, 6], [10, 22]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    labels: { 0: 'C', 1: 'H', 2: 'H', 3: 'H', 4: 'H' },
    wedge: { 2: 'wedge', 3: 'hash' },
  },
  ethyne: {
    pts: [[0, 0], [26, 0], [58, 0], [84, 0]],
    bonds: [[0, 1], [1, 2, 3], [2, 3]],
    labels: { 0: 'H', 1: 'C', 2: 'C', 3: 'H' },
  },
  allene: {
    pts: [[0, 0], [32, 0], [64, 0], [-16, -14], [-16, 14], [80, -14], [80, 14]],
    bonds: [[0, 1, 2, 1], [1, 2, 2, 1], [0, 3], [0, 4], [2, 5], [2, 6]],
    labels: { 0: 'C', 1: 'C', 2: 'C', 3: 'H', 4: 'H', 5: 'H', 6: 'H' },
  },
  ethylAnion: {
    pts: [[0, 14], [26, 0]],
    bonds: [[0, 1]],
    notes: [{ i: 1, t: '−', dx: 9, dy: -4 }],
  },
  vinylAnion: {
    pts: [[0, 14], [26, 0]],
    bonds: [[0, 1, 2, -1]],
    notes: [{ i: 1, t: '−', dx: 9, dy: -4 }],
  },
  acetylide: {
    pts: [[0, 0], [24, 0], [54, 0]],
    bonds: [[0, 1], [1, 2, 3]],
    labels: { 0: 'H', 1: 'C', 2: 'C' },
    notes: [{ i: 2, t: '−', dx: 10, dy: -8 }],
  },
  cyclopropane: {
    pts: [[0, 0], [32, 0], [16, -27]],
    bonds: [[0, 1], [1, 2], [2, 0]],
  },
  h2: {
    pts: [[0, 0], [34, 0]],
    bonds: [[0, 1]],
    labels: { 0: 'H', 1: 'H' },
  },
  carbocation: {
    pts: [[0, 0], [-24, 12], [24, 12], [0, -27]],
    bonds: [[0, 1], [0, 2], [0, 3]],
    notes: [{ i: 0, t: '+', dx: 10, dy: 14 }],
  },
  sn2: {
    pts: [[0, 0], [30, 0], [62, 0], [104, 0]],
    bonds: [[2, 3]],
    labels: { 0: 'HO⁻', 1: '+', 2: 'H₃C', 3: 'Br' },
  },
  acetone: {
    pts: [[0, 0], [0, -27], [-24, 12], [24, 12]],
    bonds: [[0, 1, 2, 1], [0, 2], [0, 3]],
    labels: { 1: 'O' },
  },
  amide: {
    pts: [[0, 12], [26, 0], [26, -27], [54, 12]],
    bonds: [[0, 1], [1, 2, 2, 1], [1, 3]],
    labels: { 2: 'O', 3: 'NH₂' },
  },
  allylA: {
    pts: [[0, 14], [26, 0], [52, 14]],
    bonds: [[0, 1, 1], [1, 2, 2, -1]],
    notes: [{ i: 0, t: '−', dx: -9, dy: -4 }],
  },
  allylB: {
    pts: [[0, 14], [26, 0], [52, 14]],
    bonds: [[0, 1, 2, -1], [1, 2, 1]],
    notes: [{ i: 2, t: '−', dx: 9, dy: -4 }],
  },
  allylReal: {
    pts: [[0, 14], [26, 0], [52, 14]],
    bonds: [[0, 1, 1.5, -1], [1, 2, 1.5, -1]],
    notes: [
      { i: 0, t: '½−', dx: -12, dy: -4 },
      { i: 2, t: '½−', dx: 12, dy: -4 },
    ],
  },
} satisfies Record<string, StickSpec>
