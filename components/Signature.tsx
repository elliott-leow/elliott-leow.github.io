/*
 * The signature from ../name_animation/index-v3.html: the name in Shantell Sans SemiBold
 * outlines, written in by a pen, with the orange "wet ink" running 120ms ahead of the black.
 *
 * It's played back from frames rather than drawn live. The original animation (an SVG with
 * a mask per letter, revealed by wide pen strokes) was rendered at 60fps and 3x size, and
 * for each frame only what changed since the last one was kept: a patch that, laid over the
 * frame before, makes that frame exactly. The patches are packed into one image,
 * public/signature-frames.png, and each is a plain element that switches on at its moment
 * with a CSS opacity animation.
 *
 * That's deliberate. An opacity animation is played by the system compositor, on its own,
 * which keeps it smooth everywhere, including an iPhone in Low Power Mode. Drawing the pen
 * live needs the page to redraw every frame, and Low Power Mode throttles exactly that
 * (and won't autoplay a video either). The typed line under the name works the same way.
 *
 * Once the last frame is up, the letters themselves take over, as vectors, so the name stays
 * crisp at any zoom. To change the animation, see scripts/signature/.
 */
import type { CSSProperties } from 'react'
import SignatureReplay from './SignatureReplay'

/** Shantell Sans SemiBold outlines, font units (1000/em, y up) */
const glyphs = {
  e: 'M285 -10C436 -10 548 68 548 133C548 162 538 177 514 177C468 177 427 101 276 101C199 101 173 137 173 193C173 195 173 198 173 200C191 190 218 183 254 183C393 183 507 238 507 349C507 457 434 513 327 513C154 513 45 351 45 210C45 82 118 -10 285 -10ZM327 396C368 396 384 378 384 344C384 297 318 265 241 265C215 265 198 268 185 270C208 341 261 396 327 396Z',
  l: 'M220 -11C274 -11 317 22 317 72C317 101 307 123 275 123C263 123 257 117 237 117C213 117 193 143 193 297C193 485 217 576 217 655C217 730 192 760 149 760C116 760 98 742 89 694C70 583 60 474 60 317C60 24 149 -11 220 -11Z',
  i: 'M160 580C219 580 241 617 241 652C241 694 205 743 144 743C93 743 56 714 56 665C56 617 98 580 160 580ZM149 -10C195 -10 216 18 216 56C216 130 226 358 225 427C224 482 198 509 157 509C98 509 74 466 74 413C74 320 77 265 77 80C77 27 98 -10 149 -10Z',
  o: 'M333 -12C478 -12 589 104 589 258C589 411 493 507 333 507C323 507 314 506 304 504C295 509 283 511 271 511C178 511 47 394 47 254C47 99 166 -12 333 -12ZM178 253C178 268 181 283 187 296C190 295 194 295 197 295C227 295 236 311 266 340C293 367 311 384 345 384C414 384 458 334 458 256C458 167 406 109 328 109C237 109 178 165 178 253Z',
  t: 'M292 -13C391 -13 435 31 435 85C435 118 420 134 393 134C365 134 354 116 306 116C230 116 190 161 190 293C190 316 191 337 193 356C253 380 301 391 384 397C416 399 436 416 436 446C436 485 411 513 347 513C303 513 254 506 210 494C212 514 215 535 216 558C222 667 195 712 140 712C100 712 84 686 83 658C82 625 86 593 83 536C79 454 60 390 60 288C60 107 122 -13 292 -13Z',
  period: 'M166 -14C218 -14 243 17 243 55C243 107 207 166 125 166C80 166 50 135 50 89C50 25 93 -14 166 -14Z',
}

/** the written word: [segment, glyph, x offset] */
const marks: [seg: string, glyph: keyof typeof glyphs, x: number][] = [
  ['e', 'e', 43.88],
  ['l1', 'l', 106.63],
  ['l2', 'l', 141.41],
  ['i', 'i', 176.62],
  ['o', 'o', 207.94],
  ['t1', 't', 276.3],
  ['t2', 't', 326.09],
  ['period', 'period', 375.01],
]
const place = (x: number) => `translate(${x} 185) scale(0.108 -0.108)`

/** the frames: 1062x450, 60fps, starting with the pause before the pen (see LEAD) */
const W = 1062
const H = 450
const FPS = 60
/** the frames begin with this much blank paper, the pause before the pen starts on first load */
const LEAD = 250
/** the packed patches, public/signature-frames.png */
const ATLAS = { src: '/signature-frames.png', w: 2048, h: 959 }
/** [frame, x, y, w, h, x in the atlas, y in the atlas], in the frames' pixels */
const patches: [k: number, x: number, y: number, w: number, h: number, ax: number, ay: number][] = [
  [16, 30, 281, 65, 41, 196, 906],
  [17, 76, 265, 63, 56, 1694, 809],
  [18, 102, 218, 55, 98, 1709, 686],
  [19, 45, 203, 100, 55, 1761, 809],
  [20, 0, 213, 79, 93, 1938, 686],
  [21, 0, 252, 72, 117, 209, 686],
  [22, 20, 331, 89, 53, 0, 906],
  [23, 30, 281, 118, 102, 1405, 686],
  [24, 70, 270, 99, 100, 1527, 686],
  [25, 102, 229, 69, 117, 285, 686],
  [26, 42, 203, 112, 115, 489, 686],
  [27, 4, 123, 248, 170, 366, 505],
  [28, 0, 159, 252, 199, 870, 265],
  [29, 8, 199, 239, 185, 1126, 265],
  [30, 79, 290, 180, 93, 0, 809],
  [31, 117, 315, 167, 69, 740, 809],
  [32, 140, 312, 143, 41, 265, 906],
  [33, 0, 203, 171, 181, 1369, 265],
  [34, 197, 123, 159, 75, 439, 809],
  [35, 194, 156, 161, 110, 1095, 686],
  [36, 190, 187, 162, 163, 995, 505],
  [37, 190, 269, 189, 115, 605, 686],
  [38, 208, 330, 180, 54, 1865, 809],
  [39, 190, 123, 94, 261, 0, 0],
  [40, 404, 205, 60, 64, 1234, 809],
  [41, 301, 123, 163, 217, 413, 265],
  [42, 296, 165, 166, 219, 243, 265],
  [43, 294, 219, 56, 116, 429, 686],
  [44, 297, 129, 165, 255, 277, 0],
  [45, 347, 133, 121, 251, 725, 0],
  [46, 294, 123, 175, 261, 98, 0],
  [47, 404, 134, 60, 131, 1577, 505],
  [48, 404, 204, 205, 119, 0, 686],
  [49, 405, 205, 174, 177, 0, 505],
  [50, 413, 219, 163, 165, 828, 505],
  [51, 399, 129, 177, 240, 1804, 0],
  [52, 411, 133, 230, 251, 850, 0],
  [53, 437, 135, 239, 236, 0, 265],
  [54, 399, 129, 275, 255, 446, 0],
  [55, 544, 204, 70, 59, 1552, 809],
  [56, 529, 205, 50, 74, 602, 809],
  [57, 496, 214, 80, 74, 656, 809],
  [58, 490, 256, 75, 99, 1630, 686],
  [59, 511, 139, 249, 245, 1551, 0],
  [60, 599, 173, 161, 208, 705, 265],
  [61, 595, 201, 166, 97, 1768, 686],
  [62, 589, 206, 184, 171, 178, 505],
  [63, 546, 252, 275, 133, 1298, 505],
  [64, 538, 264, 293, 115, 798, 686],
  [65, 490, 204, 186, 180, 1776, 265],
  [66, 748, 210, 24, 52, 93, 906],
  [67, 706, 139, 106, 124, 1728, 505],
  [68, 700, 190, 132, 90, 303, 809],
  [69, 699, 248, 67, 117, 358, 686],
  [70, 721, 139, 189, 246, 1084, 0],
  [71, 789, 174, 121, 209, 580, 265],
  [72, 848, 209, 63, 106, 1338, 686],
  [73, 849, 252, 83, 131, 1641, 505],
  [74, 748, 204, 228, 181, 1544, 265],
  [75, 775, 203, 206, 169, 618, 505],
  [76, 699, 139, 133, 246, 1277, 0],
  [77, 856, 139, 68, 124, 1838, 505],
  [78, 855, 172, 115, 91, 184, 809],
  [79, 848, 146, 133, 152, 1161, 505],
  [80, 848, 270, 74, 107, 1260, 686],
  [81, 887, 316, 171, 69, 911, 809],
  [82, 944, 322, 118, 63, 1430, 809],
  [83, 992, 320, 70, 65, 1160, 809],
  [84, 897, 210, 24, 52, 121, 906],
  [85, 897, 204, 64, 59, 1626, 809],
  [86, 938, 203, 43, 50, 149, 906],
  [87, 848, 139, 133, 246, 1414, 0],
  [88, 992, 316, 65, 64, 1298, 809],
  [89, 1003, 321, 59, 64, 1367, 809],
  [90, 992, 316, 70, 69, 1086, 809],
]

const pc = (n: number) => `${Math.round(n * 10000) / 10000}%`
const at = (ms: number) => ({ '--d': `calc(var(--sig-t0) + ${Math.round(ms * 100) / 100}ms)` }) as CSSProperties
const last = Math.max(...patches.map(([k]) => k))
/** the finished letters go down a frame after the last patch, and the patches are put away a frame after that */
const SETTLED = ((last + 1) * 1000) / FPS
const CLEARED = ((last + 2) * 1000) / FPS

export default function Signature({ className, replayable = true }: { className?: string; replayable?: boolean }) {
  return (
    <SignatureReplay className={`signature ${className ?? ''}`} lead={LEAD} settled={CLEARED} replayable={replayable}>
      <div className="sig-frames" style={at(CLEARED)}>
        {patches.map(([k, x, y, w, h, ax, ay]) => (
          <div
            key={k}
            className="sig-patch"
            style={{
              left: pc((x / W) * 100),
              top: pc((y / H) * 100),
              width: pc((w / W) * 100),
              height: pc((h / H) * 100),
              backgroundImage: `url(${ATLAS.src})`,
              backgroundSize: `${pc((ATLAS.w / w) * 100)} ${pc((ATLAS.h / h) * 100)}`,
              backgroundPosition: `${pc(ATLAS.w === w ? 0 : (ax / (ATLAS.w - w)) * 100)} ${pc(ATLAS.h === h ? 0 : (ay / (ATLAS.h - h)) * 100)}`,
              ...at((k * 1000) / FPS),
            }}
          />
        ))}
      </div>
      {/* the word as the original leaves it: every letter unmasked, the wet ink under the black */}
      <svg className="sig-final" viewBox="48 60 354 150" style={at(SETTLED)} aria-hidden>
        <defs>
          {Object.entries(glyphs).map(([g, d]) => (
            <path key={g} id={`sig-g-${g}`} d={d} />
          ))}
        </defs>
        {['#ffa500', '#111'].map((fill) => (
          <g key={fill} fill={fill}>
            {marks.map(([seg, g, x]) => (
              <use key={seg} href={`#sig-g-${g}`} transform={place(x)} />
            ))}
          </g>
        ))}
      </svg>
    </SignatureReplay>
  )
}
