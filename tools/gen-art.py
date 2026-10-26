"""Draws the site's art with the OpenAI image API. Key comes from $OPENAI_API_KEY (never stored in the repo).
    OPENAI_API_KEY=... python tools/gen-art.py [name ...]
Raw drawings land in art/raw/; tools/process-art.py turns them into the transparent webps the site uses."""
import base64, json, os, sys, urllib.request, concurrent.futures as cf

OUT = os.path.join(os.path.dirname(__file__), '..', 'art', 'raw')
KEY = os.environ['OPENAI_API_KEY']

PAPER = ("Drawn by hand on a sheet of plain bright white paper; the paper is pure flat white with no texture, "
         "no shadows, no border, no frame, no text, no signature, no watermark. Only the drawing.")
DARK = ("Drawn by hand on pure flat black paper; the background is completely black with no texture, no border, "
        "no frame, no text, no signature. Only the drawing.")
STYLE = ("A delicate hand-drawn illustration in the style of a sketchbook page; quiet, airy and refined, "
         "with the restraint of classical East Asian ink painting in its composition and motifs, but drawn in "
         "western media. Not cartoonish, no outlines of panels.")

ART = {
  'hero-wide': ('1536x1024', f"""{STYLE} Medium: blue ballpoint pen only, one cobalt blue ink, drawn with fine
    loose hatching and cross-hatching, visible pen strokes. Subject: a wide sky. Billowing clouds whose edges curl
    into soft spiral scrolls (like auspicious cloud motifs in old scroll paintings, subtly), heavily hatched on their
    shaded undersides and left as white paper on top. The clouds gather ONLY along the edges: a cluster in the top-left
    corner, a tall bank rising up the left edge into the bottom-left corner, and a bank rising up the right edge into
    the bottom-right corner. Just above the low clouds on the right, the faint tips of two distant mountain peaks drawn
    with a few light lines. A small flight of seven swallows in black ink crosses the upper middle, tiny, and three more
    lower right. The ENTIRE CENTER of the image, a wide band from the middle-left to the middle-right, must be empty
    white paper (a title will be written there). {PAPER}"""),
  'hero-tall': ('1024x1536', f"""{STYLE} Medium: blue ballpoint pen only, one cobalt blue ink, fine loose
    hatching, visible pen strokes. Subject: a tall sky. Billowing clouds whose edges curl into soft spiral scrolls
    (subtle auspicious cloud motifs), hatched on their shaded undersides. Clouds only at the top-left corner, along the
    left edge, and a big bank across the bottom third of the image rising at the right. A few tiny swallows in black
    ink near the top middle. The middle of the image (from 30% to 60% of the height) is empty white paper. {PAPER}"""),
  'plum': ('1536x1024', f"""{STYLE} Medium: coloured pencils, soft and layered, with fine graphite underdrawing
    still visible. Subject: a single gnarled flowering plum branch entering from the top-right corner and reaching
    toward the left across the top quarter of the image, with small five-petal blossoms in pale pink and white,
    a few buds in deep rose, two petals drifting down, and a small white-eye bird (a little olive-green songbird) perched
    on it. Everything stays in the top-right half; the bottom-left two thirds is empty paper. {PAPER}"""),
  'willow': ('1024x1536', f"""{STYLE} Medium: a fine white gel pen only, thin precise white lines, with a few
    touches of pale gold gel pen. Subject: long willow branches hanging straight down from the top edge, slender
    leaves drawn as single strokes, swaying slightly, with a small hanging wind chime (a short metal bell with a paper
    strip) caught among them. The drawing hugs the top and the right edge; the lower-left is empty. {DARK}"""),
  'pond': ('1536x1024', f"""{STYLE} Medium: coloured pencils, rich and layered, with visible pencil strokes.
    Subject: a long low strip of a pond's edge seen from the side, filling ONLY the bottom third of the image and
    spanning its full width: round lotus leaves at the water line, one closed pink lotus bud on a tall stem, tall
    reeds and grasses at the left and right ends bending toward the middle, smooth river stones, a small green frog
    sitting on a stone, a dragonfly above the reeds, a few ripples in blue pencil. The top two thirds of the image is
    empty white paper. {PAPER}"""),
  'ginkgo': ('1536x1024', f"""{STYLE} Medium: coloured pencils and a fine black fineliner. Subject: a scattering of
    ginkgo leaves in golden yellow and fresh green, a few folded paper cranes drawn in fineliner outline, small
    sparkles and tiny drafting marks, all scattered loosely around the EDGES of the image (corners and margins only),
    with the large centre left completely empty. {PAPER}"""),
  'night': ('1536x1024', f"""{STYLE} Medium: white gel pen and pale gold gel pen only, fine lines and stippled dots.
    Subject: a moonlit view, occupying ONLY the bottom half of the image: layered ridges of distant misty mountains,
    the farthest drawn with the faintest lines, a crooked pine leaning out from a rocky cliff at the right, and calm sea
    at the bottom drawn as rows of small curved wave strokes, the moon's reflection in gold strokes. In the top half,
    a gold crescent moon at the upper right and scattered tiny white stars and dots, sparse. The upper-middle is mostly
    empty black. {DARK}"""),
  'card-hello': ('1024x1536', f"""A finished full-bleed illustration (no empty paper): coloured pencil and gouache, warm
    and textured, visible pencil grain. Subject: an open dotted notebook seen from above on a wooden desk at golden hour,
    a folded paper crane just lifting off its page, a fountain pen beside it, a cup of tea casting a soft shadow, a
    ginkgo leaf. Muted rich palette: indigo, ochre, vermilion accents, cream. Calm and lovely. No text, no letters."""),
  'card-quiet': ('1024x1024', f"""A finished full-bleed illustration (no empty paper): coloured pencil, soft and
    textured. Subject: a small record player with its lid open beside an open window at dusk, a sheer curtain lifting in
    the breeze, a potted fern, a stack of records, the sky outside fading from apricot to indigo with one star.
    Muted rich palette. Quiet and cosy. No text, no letters."""),
  'crane-404': ('1024x1024', f"""{STYLE} Medium: blue ballpoint pen. Subject: a single folded paper crane, slightly
    crumpled, sitting on a small tuft of hatched cloud, centered, small. {PAPER}"""),
}


GEL = "Medium: white gel pen and pale gold gel pen only, fine lines and stippled dots, the same hand as a moonlit gel-pen drawing on black paper; delicate, precise, luminous."
ART.update({
  'night-about': ('1536x1024', f"""{STYLE} {GEL} Subject: a lake shore at night, occupying ONLY the bottom third of the image and
    spanning its full width: tall reeds and pampas grass at the left and right ends bending toward the middle, round lotus
    leaves floating on dark water with one closed lotus bud on a tall stem, smooth stones, gentle ripples drawn as short
    curved strokes, a scatter of fireflies as tiny gold dots rising over the reeds. The top two thirds is empty black. {DARK}"""),
  'night-branch': ('1536x1024', f"""{STYLE} {GEL} Subject: a gnarled flowering plum branch entering from the top-right corner and
    reaching left across the top quarter of the image, its bark stippled in white, small five-petal blossoms outlined in
    white with gold centres, a few buds, two petals drifting down, a small songbird perched on the branch singing. Everything
    stays in the top-right half; the rest is empty black. {DARK}"""),
  'night-wind': ('1536x1024', f"""{STYLE} {GEL} Subject: hanging willow branches along the top edge of the image, long slender
    leaves as single strokes swaying in a breeze, a small glass wind chime with a paper strip hanging among them at the right,
    a few loose leaves and soft curling wind lines drifting across the top. Everything hugs the top edge (top 35% only);
    the rest is empty black. {DARK}"""),
  'night-cranes': ('1536x1024', f"""{STYLE} {GEL} Subject: around the MARGINS only (corners and edges, centre left completely
    empty): a few folded paper cranes in flight drawn in fine white outline, small constellations joined by thin gold lines,
    scattered tiny stars and sparkles, a couple of drifting ginkgo leaves outlined in gold. Sparse and airy. {DARK}"""),
  'night-foot': ('1536x1024', f"""{STYLE} {GEL} Subject: a quiet mountain valley at night, occupying ONLY the bottom half of the
    image: a waterfall falling between two stippled cliffs into mist, layered misty ridges behind, a small wooden footbridge
    over the stream, pine trees on the cliffs, rising mist drawn as soft stippling. In the top half, a gold full moon at the
    upper left half-hidden by a thin wisp of cloud, and sparse tiny stars. The upper middle is empty black. {DARK}"""),
  'night-record': ('1024x1024', f"""{STYLE} {GEL} A finished small vignette, centred: a portable record player with its lid open,
    a record on the platter with gold grooves, beside an open window with a sheer curtain lifting in the breeze, a crescent
    moon outside, a potted fern. Fills most of the square. {DARK}"""),
})
ART.update({
  'night-hero-tall': ('1024x1536', f"""{STYLE} {GEL} Subject: a tall moonlit view. The TOP HALF of the image is open night sky:
    empty black with sparse tiny white stars and a small gold crescent moon at the upper right. The BOTTOM HALF: layered
    ridges of distant misty mountains drawn with stippling, a crooked pine leaning out from a rocky cliff at the right
    edge, and a calm sea at the very bottom drawn as rows of small curved wave strokes with the moon's reflection in gold
    strokes. Nothing at all in the top half except stars and the moon. {DARK}"""),
  'night-waves': ('1536x1024', f"""{STYLE} {GEL} Subject: a long low strip of rolling ocean waves filling ONLY the bottom third
    of the image and spanning its full width, drawn like an old woodblock seascape but in fine gel-pen lines: layered
    swells, a few curling crests breaking into lacy foam and stippled spray, a small folded paper boat riding one swell with
    its edges touched in gold, a few gold glints on the water. No plants, no leaves, no land. The top two thirds of the
    image is empty black apart from a few tiny stars. {DARK}"""),
})

HI = {'1536x1024': '3072x2048', '1024x1536': '2048x3072'}

def gen(name):
    hi = name.endswith('@2x')
    size, prompt = ART[name.removesuffix('@2x')]
    if hi: size = HI[size]
    path = os.path.join(OUT, f'{name}.png')
    if os.path.exists(path): return f'{name}: exists'
    body = json.dumps({'model': 'gpt-image-2', 'prompt': ' '.join(prompt.split()), 'size': size, 'quality': 'high', 'n': 1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', body,
                                 {'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=600) as r: data = json.load(r)
    except urllib.error.HTTPError as e:
        return f'{name}: HTTP {e.code} {e.read()[:400]}'
    with open(path, 'wb') as f: f.write(base64.b64decode(data['data'][0]['b64_json']))
    return f'{name}: ok'

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or list(ART)
    with cf.ThreadPoolExecutor(8) as ex:
        for msg in ex.map(gen, names): print(msg, flush=True)

