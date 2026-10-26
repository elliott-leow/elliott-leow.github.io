"""Turns the raw drawings (art/raw/) into the site's transparent webps, and makes the papers, torn edges, washi tape
and pencil rules, all into public/art/.

    python tools/process-art.py   (needs: pip install pillow numpy)

A drawing on white paper is un-blended from the white (each pixel's ink = how far it is from white, its colour
what the ink must have been), so it lies on any paper as if drawn there; one on black, from the black."""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')
RAW = os.path.join(ROOT, 'art', 'raw')
OUT = os.path.join(ROOT, 'public', 'art')
rng = np.random.default_rng(7)


def save(im, name, q=86):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'WEBP', quality=q, method=6)
    print(name, im.size, os.path.getsize(path) // 1024, 'KB')


def raw(name):
    for n in (f'{name}@2x', name):
        p = os.path.join(RAW, f'{n}.png')
        if os.path.exists(p): return Image.open(p).convert('RGB')
    raise FileNotFoundError(name)


def unwhite(im, floor=0.035, gain=1.08):
    a = np.asarray(im, dtype=np.float32) / 255
    alpha = np.clip((1 - a.min(axis=2)) * gain, 0, 1)
    alpha = np.clip((alpha - floor) / (1 - floor), 0, 1)
    safe = np.maximum(alpha, 1e-4)[..., None]
    rgb = np.clip(1 - (1 - a) * gain / safe / (1 / (1 - floor)), 0, 1)
    rgb = np.where(alpha[..., None] > 0, np.clip((a - (1 - alpha[..., None])) / safe, 0, 1), 1)
    return Image.fromarray(np.dstack([rgb, alpha]).__mul__(255).astype(np.uint8), 'RGBA')


def unblack(im, floor=0.06, gain=1.5):
    a = np.asarray(im, dtype=np.float32) / 255
    alpha = np.clip((a.max(axis=2) - floor) / (1 - floor) * gain, 0, 1)
    safe = np.maximum(a.max(axis=2), 1e-4)[..., None]
    rgb = np.clip(a / safe, 0, 1)
    return Image.fromarray((np.dstack([rgb, alpha]) * 255).astype(np.uint8), 'RGBA')


def crop_box(im, box):
    w, h = im.size
    return im.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))


def fit(im, width):
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS) if im.width > width else im


# ------------------------------------------------------------------------------------------- the drawings
def night():
    """the gel-pen drawings, for the dark sheets"""
    g = dict(floor=0.07, gain=1.7)
    save(fit(unblack(raw('night'), **g), 2880), 'sheets/night.webp', 84)
    save(fit(unblack(raw('night-hero-tall'), **g), 1400), 'hero/night-tall.webp', 84)
    save(fit(crop_box(unblack(raw('night-waves'), **g), (0, 0.58, 1, 1)), 2880), 'sheets/waves.webp', 72)
    save(fit(crop_box(unblack(raw('night-branch'), **g), (0.3, 0, 1, 0.8)), 1600), 'sheets/branch.webp', 84)
    cranes = unblack(raw('night-cranes'), **g)
    save(fit(cranes, 2400), 'sheets/cranes.webp', 84)
    save(fit(crop_box(cranes, (0, 0, 1, 0.27)), 1200), 'sheets/cranes-top.webp', 84)
    save(fit(unblack(raw('night-foot'), **g), 2400), 'sheets/valley.webp', 72)
    p = os.path.join(RAW, 'night-record.png')
    if os.path.exists(p): save(fit(Image.open(p).convert('RGB'), 900), 'cards/record.webp', 86)


# ------------------------------------------------------------------------------------------- papers
def noise(size, scale, octaves=4, seed=0):
    """tileable value noise: sums of wrapped, blurred random fields"""
    r = np.random.default_rng(seed)
    out = np.zeros((size, size), np.float32)
    amp = 1.0
    for o in range(octaves):
        cells = max(2, int(size / scale * 2 ** o))
        g = r.random((cells, cells)).astype(np.float32)
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((cells * 3, cells * 3), Image.NEAREST)
        big = np.tile(np.asarray(im, np.float32), (1, 1))
        tile = Image.fromarray(np.tile(g, (3, 3)) * 255).convert('L').resize((size * 3, size * 3), Image.BICUBIC)
        tile = np.asarray(tile, np.float32)[size:2 * size, size:2 * size] / 255
        out += tile * amp
        amp *= 0.5
    out -= out.min(); out /= out.max()
    return out


def fibres(size, n, length, seed):
    """short pale and dark fibres, wrapped at the tile's edges"""
    r = np.random.default_rng(seed)
    im = Image.new('L', (size * 3, size * 3), 128)
    from PIL import ImageDraw
    d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y = r.random(2) * size + size
        ang = r.random() * np.pi
        L = length * (0.4 + r.random())
        pts = []
        for t in np.linspace(0, 1, 6):
            pts.append((x + np.cos(ang) * L * t + r.normal() * 1.2, y + np.sin(ang) * L * t + r.normal() * 1.2))
        v = int(128 + (r.random() - 0.5) * 120)
        for dx in (-size, 0, size):
            for dy in (-size, 0, size):
                d.line([(px + dx, py + dy) for px, py in pts], fill=v, width=1)
    a = np.asarray(im, np.float32)[size:2 * size, size:2 * size]
    return (a - 128) / 128


def paper(base, grain=0.05, blot=0.04, fib=0.0, fib_n=0, seed=1):
    S = 480
    n = noise(S, 120, 5, seed) - 0.5
    fine = rng.normal(0, 1, (S, S)).astype(np.float32)
    fine = np.asarray(Image.fromarray(((fine * 30) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 128 - 1
    f = fibres(S, fib_n, 22, seed) if fib_n else 0
    shade = 1 + n * blot + fine * grain + f * fib
    rgb = np.clip(np.array(base, np.float32)[None, None, :] / 255 * shade[..., None], 0, 1)
    return Image.fromarray((rgb * 255).astype(np.uint8), 'RGB')


def overlay_grid(im, step, color, width=1, dots=False, alpha=1.0, major=0):
    from PIL import ImageDraw
    over = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    S = im.size[0]
    for i in range(0, S, step):
        if dots:
            for j in range(0, S, step):
                d.ellipse((i + step / 2 - 1.3, j + step / 2 - 1.3, i + step / 2 + 1.3, j + step / 2 + 1.3), fill=color)
        else:
            c = color if not (major and (i // step) % major == 0) else tuple(list(color[:3]) + [min(255, color[3] * 2)])
            d.line((i, 0, i, S), fill=c, width=width)
            d.line((0, i, S, i), fill=c, width=width)
    # a pencil grid is never perfect: the lines break and fade along their length
    a = np.asarray(over, np.float32)
    a[..., 3] *= (0.75 + 0.5 * noise(S, 40, 3, 11)) * alpha
    over = Image.fromarray(a.astype(np.uint8), 'RGBA')
    out = im.convert('RGBA'); out.alpha_composite(over)
    return out.convert('RGB')


def papers():
    save(paper((250, 249, 246), 0.035, 0.01, 0.02, 160, 1), 'paper/white.webp', 82)
    save(paper((201, 168, 128), 0.06, 0.04, 0.05, 900, 2), 'paper/kraft.webp', 82)
    # the notebook: Japanese dot-grid paper, a 5 mm pitch of soft grey-blue dots
    save(overlay_grid(paper((248, 246, 240), 0.03, 0.012, 0.015, 120, 3), 24, (90, 110, 130, 120), dots=True), 'paper/dots.webp', 84)
    save(overlay_grid(paper((245, 247, 242), 0.03, 0.012, 0.015, 120, 4), 24, (110, 160, 150, 70), major=5), 'paper/graph.webp', 84)
    # laid paper: fine laid lines and wider chain lines pressed in
    lp = paper((240, 228, 204), 0.04, 0.02, 0.03, 300, 5)
    a = np.asarray(lp, np.float32)
    y = np.arange(480)[:, None]; x = np.arange(480)[None, :]
    a *= (1 - 0.018 * (np.sin(y * 2 * np.pi / 4) > 0.6))[..., None]
    a *= (1 - 0.016 * (np.abs(((x + 30) % 120) - 60) < 1.0))[..., None]
    save(Image.fromarray(a.clip(0, 255).astype(np.uint8)), 'paper/laid.webp', 84)
    nv = paper((27, 39, 70), 0.05, 0.10, 0.06, 500, 6)
    a = np.asarray(nv, np.float32)
    specks = rng.random((480, 480)) > 0.9993
    a[specks] = [200, 205, 220]
    save(Image.fromarray(a.clip(0, 255).astype(np.uint8)), 'paper/navy.webp', 82)
    # the dark sheets: slate, an indigo dot-grid page, pine-green graph paper, and ink
    save(paper((28, 35, 44), 0.05, 0.07, 0.05, 500, 7), 'paper/slate.webp', 82)
    save(overlay_grid(paper((29, 33, 54), 0.05, 0.06, 0.05, 300, 8), 24, (190, 200, 235, 70), dots=True), 'paper/dusk.webp', 84)
    # (a note's page: the same grid pressed much fainter, so a long read isn't spent among dots as bright as the words)
    save(overlay_grid(paper((29, 33, 54), 0.03, 0.015, 0.03, 300, 8), 24, (190, 200, 235, 30), dots=True), 'paper/dusk-note.webp', 84)
    save(overlay_grid(paper((24, 37, 33), 0.05, 0.06, 0.05, 300, 9), 24, (150, 200, 180, 34), major=5), 'paper/pine.webp', 84)
    ik = np.asarray(paper((17, 20, 30), 0.05, 0.08, 0.05, 400, 10), np.float32)
    ik[rng.random((480, 480)) > 0.9994] = [190, 195, 210]
    save(Image.fromarray(ik.clip(0, 255).astype(np.uint8)), 'paper/ink.webp', 82)


# ------------------------------------------------------------------------------------------- torn edges
def edge_profile(W, kind, seed):
    r = np.random.default_rng(seed)
    x = np.arange(W)
    def periodic(k, amp):
        return sum(amp / (i + 1) ** 1.1 * np.sin(2 * np.pi * (i + 1) * x / W * (k) + r.random() * 6.28) for i in range(8))
    if kind == 'torn':
        y = 20 + periodic(1, 4) + periodic(6, 2.2) + np.convolve(r.normal(0, 1.4, W), np.ones(3) / 3, 'same')
    elif kind == 'perf':  # torn off a pad: little bites at the perforations
        y = 16 + 1.2 * np.sin(2 * np.pi * x / W * 2) + 2.5 * (np.abs(((x) % 12) - 6) < 2.5) + r.normal(0, 0.4, W)
    else:  # deckle: soft and feathery
        y = 18 + periodic(3, 3) + np.convolve(r.normal(0, 2.5, W), np.ones(5) / 5, 'same')
    return np.clip(y, 4, 36)


def edges():
    W, H = 600, 40
    for name, kind, seed in (('kraft', 'torn', 1), ('dots', 'perf', 2), ('graph', 'perf', 3), ('laid', 'deckle', 4), ('navy', 'deckle', 5), ('white', 'torn', 6),
                             ('slate', 'torn', 7), ('dusk', 'perf', 8), ('pine', 'perf', 9), ('ink', 'deckle', 10)):
        y = edge_profile(W, kind, seed)
        Y = np.arange(H)[:, None]
        mask = np.clip((Y - y[None, :]) * 1.2 + 0.5, 0, 1)
        save(Image.fromarray((mask * 255).astype(np.uint8), 'L').convert('RGBA').split()[0].convert('LA').convert('RGBA')
             if False else Image.merge('RGBA', [Image.fromarray((mask * 255).astype(np.uint8))] * 4), f'paper/edge-{name}.webp', 90)
        if name in ('kraft', 'navy', 'slate', 'ink'):
            # the tear's pale fibres: a ragged band of the paper's lighter core just under the edge
            r = np.random.default_rng(seed + 10)
            depth = 2.5 + 2.5 * np.abs(np.convolve(r.normal(0, 1, W), np.ones(9) / 9, 'same')) * 3
            band = np.clip(1 - (Y - y[None, :]) / depth[None, :], 0, 1) * (Y >= y[None, :] - 0.5)
            band *= 0.55 + 0.45 * r.random((H, W))
            col = {'kraft': (236, 222, 200), 'navy': (190, 198, 218), 'slate': (110, 122, 138), 'ink': (90, 98, 120)}[name]
            rgba = np.dstack([np.full((H, W), c, np.float32) for c in col] + [band * 255 * 0.85])
            save(Image.fromarray(rgba.astype(np.uint8), 'RGBA'), f'paper/tear-{name}.webp', 90)


# ------------------------------------------------------------------------------------------- washi tape
def tapes():
    from PIL import ImageDraw
    specs = [  # (w, h, colour, pattern)
        (112, 36, (214, 196, 150), 'plain'),
        (104, 34, (164, 182, 204), 'dots'),
        (118, 38, (226, 178, 170), 'stripes'),
        (108, 36, (196, 214, 186), 'grid'),
        (100, 34, (232, 214, 160), 'plain'),
        (114, 40, (180, 170, 206), 'waves'),
    ]
    for i, (w, h, col, pat) in enumerate(specs, 1):
        r = np.random.default_rng(i)
        W, H = w * 2, h * 2
        im = Image.new('RGBA', (W, H), col + (0,))
        d = ImageDraw.Draw(im)
        a = np.full((H, W), 0.78, np.float32)
        # the ends are torn: a zigzag of little fibres
        for side in (0, 1):
            prof = 8 + np.cumsum(r.normal(0, 1.6, H)); prof = 4 + (prof - prof.min()) / max(1, np.ptp(prof)) * 10
            X = np.arange(W)[None, :]
            if side == 0: a *= np.clip((X - prof[:, None]) / 2, 0, 1)
            else: a *= np.clip(((W - X) - prof[:, None]) / 2, 0, 1)
        a *= 0.9 + 0.1 * noise(max(W, H), 30, 3, i)[:H, :W]
        rgb = np.tile(np.array(col, np.float32), (H, W, 1))
        pat_col = np.array([max(0, c - 70) for c in col], np.float32)
        Y, X = np.mgrid[0:H, 0:W]
        if pat == 'dots': m = ((X % 22 - 11) ** 2 + (Y % 22 - 11) ** 2) < 9
        elif pat == 'stripes': m = ((X + Y) % 20) < 6
        elif pat == 'grid': m = (X % 16 < 2) | (Y % 16 < 2)
        elif pat == 'waves': m = np.abs(((Y + 6 * np.sin(X / 8)) % 18) - 9) < 1.6
        else: m = np.zeros_like(X, bool)
        rgb[m] = rgb[m] * 0.55 + pat_col * 0.45
        rgb *= (0.96 + 0.06 * noise(max(W, H), 12, 2, i + 20)[:H, :W])[..., None]
        out = np.dstack([rgb.clip(0, 255), a * 255]).astype(np.uint8)
        save(Image.fromarray(out, 'RGBA').resize((w * 2, h * 2)), f'ui/tape-{i}.webp', 88)


# ------------------------------------------------------------------------------------------- pencil rules
def rules():
    W, H = 1200, 48
    for name, col, twice in (('red', (150, 50, 35), False), ('red-2', (150, 50, 35), True), ('gold', (240, 180, 106), False), ('gold-2', (240, 180, 106), True), ('blue', (60, 90, 160), False)):
        r = np.random.default_rng(len(name))
        a = np.zeros((H, W), np.float32)
        X = np.arange(W)
        for k in range(2 if twice else 1):
            y0 = 22 + k * 12 + 3 * np.sin(X / W * np.pi * 1.3 + r.random()) + np.cumsum(r.normal(0, 0.05, W))
            y0 -= np.linspace(0, y0[-1] - y0[0], W) * 0.6
            Y = np.arange(H)[:, None]
            thick = 2.6 + 0.6 * np.sin(X / 50 + k)
            line = np.clip(1 - np.abs(Y - y0[None, :]) / thick[None, :], 0, 1)
            grain = (r.random((H, W)) > 0.28).astype(np.float32) * 0.8 + 0.2
            a = np.maximum(a, line * grain * (0.85 + 0.15 * np.sin(X / 23)))
        out = np.dstack([np.full((H, W), c, np.float32) for c in col] + [a * 255]).astype(np.uint8)
        save(Image.fromarray(out, 'RGBA'), f'ui/rule-{name}.webp', 90)


if __name__ == '__main__':
    import sys
    which = sys.argv[1:] or ['night', 'papers', 'edges', 'tapes', 'rules']
    for w in which: globals()[w]()
