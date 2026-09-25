# Elliott's notebook

A small personal site: a spiral-bound Japanese dot-grid notebook floating in the
sky, with a signature that writes itself, a few photos held down with washi
tape, and a notes section.

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → out/
```

It's a static export (`output: 'export'`), so `out/` can go straight to GitHub
Pages. `.github/workflows/deploy.yml` does that on every push to `main`
(set Pages → Source to "GitHub Actions"). `public/CNAME` is carried over from
the old site.

## Editing

| to change…            | edit                                 |
| --------------------- | ------------------------------------ |
| photos, links         | `lib/content.ts`                     |
| a note                | `content/notes/<slug>.mdx` + `notes` in `lib/content.ts` |
| what's on the page    | `app/page.tsx` + `styles/page.css`   |
| the notebook and sky  | `components/Notebook.tsx`, `components/Sky.tsx`, `styles/notebook.css` |

`content/notes/template.mdx` uses every feature a note has: `<Margin>`, `<Hl>`
(highlight), `<X>` (cross out), `<U>` (underline), `<O>` (circle), `<Pen>` (blue
handwriting), `<Sticky front="…">`, `<Figure src alt caption>`, plus headings,
lists, quotes, code and rules. Copy it to start a new one.

Rotations, tape and positions are stored, never random, so the page looks the
same every time it's opened.

## How it works

- **Opening**: the notebook drifts in and keeps gently floating, the dot grid
  sweeps across the page, the photo settles and gets taped down, the signature is
  written, a line is typed, then
  the other photos land. Everything runs once, in about 5 seconds.
- **Sky**: `components/Sky.tsx`. Follows the visitor's clock (dawn, day, dusk,
  night); the footer's "sky" button cycles it. Clouds are generated on load from
  tiling fractal noise and drift in three layers; the sun or moon glow and the
  clouds lean toward the cursor. Petals blow through now and then.
- **Signature**: `components/Signature.tsx`, ported from `../name_animation`:
  filled letter outlines revealed through masked pen strokes, each stroke timed by
  its length, with a pen-lift before the t-crosses and a wet "lead" layer 120ms
  ahead of the ink. Click it to rewrite. Routes live in `components/signatureRoutes.ts`.
- **Folded corner**: hovering it turns the corner up further. Clicking it lifts the
  page off the spine and drops it back blank, so everything is written again.
- **Photos**: `components/Photo.tsx`. The tape is a hinge: pull a photo and the
  untaped end stretches and peels up off the page, swinging a little about the
  tape, then springs back flat. On touch screens a tap gives it a tug.
- **Binding**: punched holes and a wire coil (an SVG pattern in
  `components/Notebook.tsx`), over a back cover board.
- **Sticky notes**: click anywhere on one to fold or unfold it.
- **Pencil**: on wide screens it floats beside the notebook and can be picked up
  (or press `p`) to draw on the page; `esc` puts it down.
- **Links**: underlined in red pen on hover (`components/Ink.tsx`).
- Sound is off by default (footer toggle) and synthesised, so there are no audio files.
- `prefers-reduced-motion` turns off writing, typing, springs and the page turn.

## Images

Photos in `public/photos/` are from the old site, resized. The textures in
`public/textures/` (paper grain, pencil, paperclip) were generated with `gpt-image-2`, then cropped and compressed.
