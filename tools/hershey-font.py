"""Builds the site's two hands from Hershey's public-domain engraving faces: each single-line stroke is
drawn with a round pen of a fixed width (shapely buffer) and the ink outlines become a woff2.

    python tools/hershey-font.py   (needs: pip install Hershey-Fonts shapely fonttools brotli)
"""
import os, sys
import HersheyFonts as H
from shapely.geometry import LineString, Point, Polygon, MultiPolygon
from shapely.ops import unary_union
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'fonts')
S = 33          # font units per Hershey unit: caps (21 units) come out at ~700 of 1000
UPM = 1000

def strokes_of(font_name):
    f = H.HersheyFonts(); f.load_default_font(font_name)
    out = {}
    for ch in (chr(c) for c in range(32, 127)):
        g = next(iter(f.glyphs_for_text(ch)), None)
        if g is None: continue
        out[ch] = (g.left_offset, g.char_width, [list(s) for s in g.strokes])
    return out

def derived(src):
    """typographers' punctuation the Hershey sets lack, made from what they have"""
    d = {}
    def tf(ch, fn, w=None):
        if ch not in src: return None
        lo, cw, ss = src[ch]
        return (lo, w or cw, [[fn(x, y) for x, y in s] for s in ss])
    if "'" in src:
        d['’'] = src["'"]; d['‘'] = tf("'", lambda x, y: (-x, -y - 21 + 0))
        d['‘'] = (src["'"][0], src["'"][1], [[(-x, (-12 - 9) - y + 0) for x, y in s] for s in src["'"][2]])
    if '"' in src:
        d['”'] = src['"']; d['“'] = src['"']
    if '-' in src:
        lo, cw, ss = src['-']
        d['–'] = (lo - 3, cw + 6, [[(x * 1.6, y) for x, y in s] for s in ss])
        d['—'] = (lo - 5, cw + 10, [[(x * 2.0, y) for x, y in s] for s in ss])
    if '.' in src:
        lo, cw, ss = src['.']
        d['·'] = (lo, cw, [[(x, y - 6) for x, y in s] for s in ss])
        d['…'] = (lo - 8, cw + 16, [[(x + dx, y) for x, y in s] for dx in (-8, 0, 8) for s in ss])
    d['→'] = (-12, 24, [[(-9, 0), (9, 0)], [(4, -5), (9, 0), (4, 5)]])
    d['←'] = (-12, 24, [[(9, 0), (-9, 0)], [(-4, -5), (-9, 0), (-4, 5)]])
    d['×'] = (-9, 18, [[(-5, -4), (5, 6)], [(5, -4), (-5, 6)]])
    return d

def ink(strokes, pen):
    shapes = []
    for s in strokes:
        if len(s) == 1: shapes.append(Point(s[0]).buffer(pen / 2, 8)); continue
        shapes.append(LineString(s).buffer(pen / 2, quad_segs=6, cap_style='round', join_style='round'))
    return unary_union(shapes) if shapes else None

def draw_poly(pen, ring, lo, reverse):
    pts = [((x - lo) * S, (9 - y) * S) for x, y in ring.coords[:-1]]
    if reverse: pts = pts[::-1]
    pen.moveTo(tuple(round(v) for v in pts[0]))
    for p in pts[1:]: pen.lineTo(tuple(round(v) for v in p))
    pen.closePath()

def sides(geom, sb):
    """each side's bearing: the full sb against a flat side (a stem, a serif's foot), less against a round one, whose
    ink only touches the edge at a point and so already stands further off the next letter by eye"""
    from shapely.geometry import box
    x0, y0, x1, y1 = geom.bounds
    h = max(y1 - y0, 1)
    def flat(xa, xb):
        cut = geom.intersection(box(xa, y0 - 1, xb, y1 + 1))
        if cut.is_empty: return 0
        return min(1, (cut.bounds[3] - cut.bounds[1]) / min(h, 14))
    return sb * (0.62 + 0.38 * flat(x0, x0 + 1.2)), sb * (0.62 + 0.38 * flat(x1 - 1.2, x1))


def build(face, family, style, pen_w, sb=None, space=None):
    """sb: the bearing each side of a letter, from its ink, in Hershey units. Hershey's own left and right bounds sit on
    whole units of a 21-unit cap grid, which leaves ~3 units (~14% of the cap height) of air each side of every letter,
    about three times a text face's; that air, not the letters, is what reads as stretched. None keeps Hershey's."""
    src = strokes_of(face)
    src.update({k: v for k, v in derived(src).items() if v})
    names = {' ': 'space'}
    order, glyphs, metrics, cmap = ['.notdef'], {}, {}, {}
    p = TTGlyphPen(None); glyphs['.notdef'] = p.glyph(); metrics['.notdef'] = (500, 0)
    for ch, (lo, cw, ss) in src.items():
        gname = names.get(ch, 'uni%04X' % ord(ch))
        order.append(gname); cmap[ord(ch)] = gname
        p = TTGlyphPen(None)
        geom = ink(ss, pen_w)
        if geom is not None and not geom.is_empty:
            polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
            # (y flips, so a ring's winding flips too: outer rings go clockwise as TrueType wants)
            for poly in polys:
                draw_poly(p, poly.exterior, lo, reverse=poly.exterior.is_ccw)
                for hole in poly.interiors: draw_poly(p, hole, lo, reverse=not hole.is_ccw)
        adv = cw
        if sb is not None and geom is not None and not geom.is_empty:
            l, r = sides(geom, sb)
            x0, _, x1, _ = geom.bounds
            lo, adv = x0 - l, (x1 - x0) + l + r
            p = TTGlyphPen(None)
            for poly in (geom.geoms if isinstance(geom, MultiPolygon) else [geom]):
                draw_poly(p, poly.exterior, lo, reverse=poly.exterior.is_ccw)
                for hole in poly.interiors: draw_poly(p, hole, lo, reverse=not hole.is_ccw)
        elif ch == ' ' and space is not None:
            adv = space
        g = p.glyph()
        glyphs[gname] = g
        metrics[gname] = (round(adv * S), 0)
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order); fb.setupCharacterMap(cmap); fb.setupGlyf(glyphs)
    for n in order:
        g = glyphs[n]; g.recalcBounds(fb.font['glyf']) if hasattr(g, 'recalcBounds') else None
        metrics[n] = (metrics[n][0], getattr(g, 'xMin', 0))
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=860, descent=-300)
    fb.setupNameTable({'familyName': family, 'styleName': style})
    fb.setupOS2(sTypoAscender=860, sTypoDescender=-300, sTypoLineGap=0, usWinAscent=900, usWinDescent=340,
                usWeightClass=700 if style == 'Bold' else 400, sCapHeight=700, sxHeight=460)
    fb.setupPost()
    fb.font.flavor = 'woff2'
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{family.replace(' ', '')}-{style}.woff2")
    fb.save(path); print(path, os.path.getsize(path))

build('timesr', 'Leow Serif', 'Regular', 1.3, sb=1.7, space=7)
build('timesrb', 'Leow Serif', 'Bold', 1.15)
# (the pen sets the weight: one Hershey unit is 0.033em, so a 2.1-unit pen draws a 0.07em stroke, a text face's regular
# stem. Thinner reads well dark-on-light at large sizes, but at body size it falls under a pixel, renders as grey, and
# light-on-dark text all but disappears into the paper)
build('futural', 'Leow Sans', 'Regular', 2.1, sb=1.9, space=7.2)
build('futuram', 'Leow Sans', 'Bold', 2.9, sb=2.0, space=7.4)
