/*
 * Everything on the page that isn't layout lives here.
 * Rotations and tape are fixed on purpose: the page should look the same
 * every time you open it, the way a real page does.
 */

export type Tape = {
  /** position relative to the photo, in % of its width / px from its top */
  x: number
  y: number
  w: number
  rot: number
  opacity?: number
  tone?: 'masking' | 'clear' | 'dark'
}

export type Photo = {
  id: string
  src: string
  alt: string
  caption: string
  rotation: number
  aspect: number // width / height
  tape: Tape[]
  variant: 'polaroid' | 'print' | 'instant'
}

export const photos: Record<'me' | 'city' | 'moon' | 'dusk', Photo> = {
  me: {
    id: 'me',
    src: '/photos/me.jpg',
    alt: 'Elliott, in a black hoodie, standing on a tree-lined sidewalk on a sunny day',
    caption: 'me',
    rotation: -3,
    aspect: 1,
    variant: 'polaroid',
    tape: [
      { x: -6, y: -12, w: 74, rot: -34, opacity: 0.72 },
      { x: 70, y: -8, w: 64, rot: 28, opacity: 0.62 },
    ],
  },
  city: {
    id: 'city',
    src: '/photos/city.jpg',
    alt: 'City lights spread across a valley at night, framed by pine branches',
    caption: 'up the hill',
    rotation: 2.5,
    aspect: 1100 / 618,
    variant: 'print',
    tape: [{ x: 36, y: -12, w: 70, rot: -3, opacity: 0.7 }],
  },
  moon: {
    id: 'moon',
    src: '/photos/moon.jpg',
    alt: 'A full moon over dark water, seen from a wooden railing at night',
    caption: 'moon',
    rotation: -4,
    aspect: 1100 / 825,
    variant: 'print',
    tape: [{ x: 70, y: -8, w: 54, rot: 36, opacity: 0.6, tone: 'clear' }],
  },
  dusk: {
    id: 'dusk',
    src: '/photos/dusk.jpg',
    alt: 'A pink and grey evening sky over a parking lot with bare trees',
    caption: 'pink hour',
    rotation: 3,
    aspect: 618 / 1100,
    variant: 'instant',
    tape: [{ x: 22, y: -10, w: 62, rot: 4, opacity: 0.74, tone: 'dark' }],
  },
}

export const links = {
  email: 'eleow1@jhu.edu',
  github: 'https://github.com/elliott-leow',
  linkedin: 'https://www.linkedin.com/in/elliott-leow-205242198/',
}

export type NoteMeta = {
  slug: string
  date: string // mm.dd.yy, the way it's written on the page
  title: string
  /** shown in pen next to the title when you hover it in the list */
  preview: string
  /** typewriter or book type for the body */
  style: 'typed' | 'serif'
  /** kept out of the list and the build. still opens under `next dev` */
  private?: boolean
}

/** newest first. each one needs a matching content/notes/<slug>.mdx */
const allNotes: NoteMeta[] = [
  {
    slug: 'hello-world',
    date: '09.25.26',
    title: 'hello world',
    preview: 'the first one',
    style: 'typed',
  },
  {
    slug: 'template',
    date: '09.23.26',
    title: 'a template note',
    preview: 'everything a note can do, in one place',
    style: 'typed',
    private: true,
  },
]

const showPrivate = process.env.NODE_ENV === 'development'
export const notes = allNotes.filter((n) => showPrivate || !n.private)

export const noteBySlug = (slug: string) => notes.find((n) => n.slug === slug)
