"""One UI app icons: a flat icon made into frosted glass or a 3D glyph.

The flat icon is the template every Arc app starts from: a 1280 x 1280 PNG
with a 1024 px rounded box (radius 220) in a slate gradient, a white glyph and
one red detail. The glyph is taken out of it exactly - each pixel solved as the
box's gradient plus some white plus some red - and drawn again in the style
asked for, so the artwork itself never changes.

    python app-icon.py --style glyph-3d my-app.png -o my-app-icon.png

Styles:
    frosted      the box as frosted glass: see-through, milky, a fine grain,
                 a glow along the edges and a bright rim
    frosted-3d   the same, with the glyph standing off the glass and the box
                 showing its thickness, with a shadow under it
    glyph-3d     no box: the glyph alone, larger, with a white face in a slate
                 outline over a dark side, so it reads on white and on dark

Needs Python 3 with Pillow and NumPy.
"""
import argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

N = 1280                       # the canvas
BOX = (128, 128, 1152, 1152)   # the template's box
RADIUS = 220
TL, BR = (95, 108, 132), (52, 61, 79)
WHITE = np.array([255., 255., 255.])
RED = np.array([255., 0., 0.])

PRESETS = {
    'frosted': dict(tint=0.45, frost=0.14, grain=0.05, glow=0.35, rim=0.9, shadow=0.5,
                    depth=0, bevel=0, slab=0, drop=0),
    'frosted-3d': dict(tint=0.45, frost=0.14, grain=0.05, glow=0.35, rim=0.9, shadow=0.5,
                       depth=6, bevel=0.8, slab=12, drop=0.25),
    'glyph-3d': dict(fill=0.72, outline=14, depth=16, shadow=0.30, bevel=0.9),
}


def layer(rgb, alpha):
    l = Image.new('RGBA', alpha.size, tuple(int(c) for c in rgb) + (0,))
    l.putalpha(alpha)
    return l


def shifted(im, dx, dy):
    return im.transform(im.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy))


# ---- the glyph, out of the flat icon ------------------------------------------

def extract_glyph(path):
    a = np.asarray(Image.open(path).convert('RGBA').resize((N, N), Image.LANCZOS)).astype(float)
    rgb, alpha = a[..., :3], a[..., 3]
    yy, xx = np.mgrid[0:N, 0:N]
    # Away from the box's own anti-aliased edge, whose pixels are blended
    # toward the background and would read as glyph.
    inside = np.asarray(Image.fromarray(((alpha == 255) * 255).astype(np.uint8), 'L')
                        .filter(ImageFilter.MinFilter(25))) == 255

    # The box's gradient, fitted on what is clearly box: blue-grey and dark.
    # Fitted twice, the second time without the glyph edges the first caught.
    bgm = inside & (rgb[..., 2] - rgb[..., 0] > 15) & (rgb.sum(-1) < 450)
    X = np.stack([np.ones(bgm.sum()), xx[bgm], yy[bgm]], 1)
    coef = [np.linalg.lstsq(X, rgb[..., c][bgm], rcond=None)[0] for c in range(3)]
    keep = np.abs(np.stack([X @ k for k in coef], 1) - rgb[bgm]).max(1) < 3
    coef = [np.linalg.lstsq(X[keep], rgb[..., c][bgm][keep], rcond=None)[0] for c in range(3)]
    bg = np.stack([k[0] + k[1] * xx + k[2] * yy for k in coef], -1)

    # Each pixel as bg + a_w * (white - bg) + a_r * (red - bg), least squares.
    d = rgb - bg
    vw, vr = WHITE - bg, RED - bg
    a11 = (vw * vw).sum(-1); a12 = (vw * vr).sum(-1); a22 = (vr * vr).sum(-1)
    b1 = (vw * d).sum(-1); b2 = (vr * d).sum(-1)
    det = a11 * a22 - a12 * a12
    with np.errstate(divide='ignore', invalid='ignore'):
        aw = (a22 * b1 - a12 * b2) / det
        ar = (a11 * b2 - a12 * b1) / det
        neg_r, neg_w = ar < 0, aw < 0
        aw = np.where(neg_r, b1 / a11, aw); ar = np.where(neg_r, 0, ar)
        ar = np.where(neg_w & ~neg_r, b2 / a22, ar); aw = np.where(neg_w & ~neg_r, 0, aw)
        aw = np.clip(np.nan_to_num(aw), 0, 1); ar = np.clip(np.nan_to_num(ar), 0, 1)
        tot = aw + ar
        aw = np.where(tot > 1, aw / tot, aw); ar = np.where(tot > 1, ar / tot, ar)
    tot = np.clip(aw + ar, 0, 1)
    tot = np.where(inside, tot, 0)
    tot = np.where(tot < 0.02, 0, tot)
    col = np.where(tot[..., None] > 0,
                   (aw[..., None] * WHITE + ar[..., None] * RED) / np.maximum(aw + ar, 1e-6)[..., None], 0)
    return Image.fromarray(np.dstack([col, tot * 255]).round().clip(0, 255).astype(np.uint8), 'RGBA')


# ---- frosted and frosted-3d ---------------------------------------------------

def frosted(glyph, p):
    S = 3                       # drawn at 3x and scaled down, for smooth edges
    C = N * S
    sc = lambda v: int(round(v * S))

    def box(inset=0):
        m = Image.new('L', (C, C), 0)
        x0, y0, x1, y1 = BOX
        ImageDraw.Draw(m).rounded_rectangle(
            (sc(x0 + inset), sc(y0 + inset), sc(x1 - inset) - 1, sc(y1 - inset) - 1),
            radius=sc(RADIUS - inset), fill=255)
        return m

    def down(stops):
        # An alpha that changes down the icon: stops are (y on the 1280 canvas, 0..1).
        ys = np.linspace(0, N, 256)
        a = np.interp(ys, [s[0] for s in stops], [s[1] for s in stops])
        return Image.fromarray((a * 255).astype(np.uint8)[:, None], 'L').resize((C, C), Image.BILINEAR)

    body = box()
    img = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    if p['drop']:
        # A shadow under the box, outside it only, so the glass stays clear.
        drop = shifted(body, 0, sc(p['slab'] + 14)).filter(ImageFilter.GaussianBlur(sc(26)))
        drop = ImageChops.subtract(drop.point(lambda v: int(v * p['drop'])), body)
        img = Image.alpha_composite(img, layer((10, 15, 30), drop))
    if p['slab']:
        # The glass's thickness: its lower edge below the face, with a bright lip.
        side = ImageChops.subtract(shifted(body, 0, sc(p['slab'])), body)
        img = Image.alpha_composite(img, layer((118, 132, 158), side.point(lambda v: int(v * 0.78))))
        lip = ImageChops.subtract(side, shifted(side, 0, -sc(3)))
        img = Image.alpha_composite(img, layer((255, 255, 255), lip.point(lambda v: int(v * 0.35))))

    # The tint: the template's gradient, see-through.
    t = (np.add.outer(np.arange(256), np.arange(256)) / 510.0)[..., None]
    grad = np.array(TL) + (np.array(BR) - np.array(TL)) * t
    tint = Image.fromarray(grad.astype(np.uint8), 'RGB').resize((C, C), Image.BILINEAR).convert('RGBA')
    tint.putalpha(body.point(lambda v: int(v * p['tint'])))
    img = Image.alpha_composite(img, tint)

    # Frost: milky and a touch cool, a little stronger at the top.
    f = p['frost']
    img = Image.alpha_composite(img, layer((236, 244, 255), ImageChops.multiply(
        body, down([(0, f * 1.25), (128, f * 1.25), (1152, f * 0.8), (N, f * 0.8)]))))
    # Grain: a fine speckle, as on etched glass.
    g = np.random.default_rng(7).random((N, N))
    g = np.asarray(Image.fromarray((g * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.8))).astype(float)
    g = (g - g.mean()) / (g.std() + 1e-6)
    speck = Image.fromarray(np.clip(g * p['grain'] * 255, 0, 255).astype(np.uint8), 'L').resize((C, C), Image.NEAREST)
    img = Image.alpha_composite(img, layer((255, 255, 255), ImageChops.multiply(speck, body)))
    # Glow: light caught by the edges, stronger at the top.
    gl = p['glow']
    edge = ImageChops.subtract(body, box(28)).filter(ImageFilter.GaussianBlur(sc(26)))
    edge = ImageChops.multiply(ImageChops.multiply(edge, body),
                               down([(0, gl), (128, gl), (1152, gl * 0.45), (N, gl * 0.45)]))
    img = Image.alpha_composite(img, layer((255, 255, 255), edge))
    # Sheen over the top half, and the rim.
    img = Image.alpha_composite(img, layer((255, 255, 255), ImageChops.multiply(
        body, down([(0, 0.30), (128, 0.30), (520, 0.10), (760, 0.0), (N, 0.0)]))))
    r = p['rim']
    rim = ImageChops.multiply(ImageChops.subtract(body, box(7)),
                              down([(0, r), (128, r), (640, r * 0.3), (1152, r * 0.16), (N, r * 0.16)]))
    img = Image.alpha_composite(img, layer((255, 255, 255), rim))
    img = img.resize((N, N), Image.LANCZOS)
    body = body.resize((N, N), Image.LANCZOS)

    # The glyph's shadow on the glass.
    depth = p['depth']
    sh = glyph.getchannel('A').filter(ImageFilter.GaussianBlur(10 + depth * 0.6))
    sh = ImageChops.multiply(sh.point(lambda v: int(v * p['shadow'])), body)
    img = Image.alpha_composite(img, shifted(layer((15, 20, 30), sh), depth * 0.5, 6 + depth))
    if depth:
        # The glyph's side: copies stepping down and a little right, in its own
        # colour darkened - white to a cool slate, red to deep red.
        side = np.asarray(glyph).astype(float)
        side[..., :3] *= np.array([0.62, 0.68, 0.80])
        side = Image.fromarray(side.round().astype(np.uint8), 'RGBA')
        for k in range(int(round(depth)), 0, -1):
            img = Image.alpha_composite(img, shifted(side, k * 0.35, k))
    if p['bevel']:
        glyph = bevel(glyph, p['bevel'], blur=4, offset=3, lift=0.45)
    return Image.alpha_composite(img, glyph)


def bevel(glyph, strength, blur, offset, lift):
    # Light from the top left: lower-right edges darker, upper-left lighter
    # (seen on the red; white cannot go lighter).
    a = np.asarray(glyph.getchannel('A').filter(ImageFilter.GaussianBlur(blur))).astype(float) / 255
    d = a - np.roll(np.roll(a, offset, 0), offset, 1)
    g = np.asarray(glyph).astype(float)
    rgb = g[..., :3]
    dn = np.clip(-d * 2.2, 0, 1)[..., None] * strength
    up = np.clip(d * 2.2, 0, 1)[..., None] * strength
    rgb = rgb * (1 - dn * np.array([0.30, 0.26, 0.18]))
    rgb = rgb + (255 - rgb) * up * lift
    return Image.fromarray(np.dstack([rgb, g[..., 3]]).round().clip(0, 255).astype(np.uint8), 'RGBA')


# ---- glyph-3d -----------------------------------------------------------------

def glyph_3d(glyph, p):
    S = 2
    C = N * S

    def grow(alpha, px):
        # A rounded thickening: blur, then a steep ramp around a low threshold.
        b = np.asarray(alpha.filter(ImageFilter.GaussianBlur(px * 0.75))).astype(float) / 255
        a = np.clip((b - 0.06) / 0.10, 0, 1)
        return Image.fromarray((np.maximum(a, np.asarray(alpha) / 255) * 255).astype(np.uint8), 'L')

    # Scaled so its longer side is `fill` of the canvas, centred, and raised by
    # half the depth so the side and shadow are centred with it.
    depth = p['depth']
    x0, y0, x1, y1 = glyph.getbbox()
    gw, gh = x1 - x0, y1 - y0
    scale = p['fill'] * C / max(gw, gh)
    tw, th = int(round(gw * scale)), int(round(gh * scale))
    big = glyph.crop((x0, y0, x1, y1)).convert('RGBa').resize((tw, th), Image.LANCZOS).convert('RGBA')
    ox = (C - tw) // 2 - int(depth * S * 0.18)
    oy = (C - th) // 2 - int(depth * S * 0.5)
    g = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    g.alpha_composite(big, (ox, oy))

    sil = grow(g.getchannel('A'), p['outline'] * S)        # the glyph and its outline
    out = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    sh = shifted(sil, depth * S * 0.35, depth * S + 10 * S).filter(ImageFilter.GaussianBlur(14 * S))
    out = Image.alpha_composite(out, layer((10, 14, 24), sh.point(lambda v: int(v * p['shadow']))))
    side = layer((38, 45, 60), sil)
    for k in range(int(round(depth * S)), 0, -1):
        out = Image.alpha_composite(out, shifted(side, k * 0.35, k))
    out = Image.alpha_composite(out, layer((70, 82, 104), sil))

    # The face: white to a cool grey down the glyph, red where it is red.
    a = np.asarray(g).astype(float)
    red = np.clip(1 - a[..., 1] / 255, 0, 1)[..., None]       # white has G=255, red G=0
    t = np.clip((np.arange(C)[:, None, None] - oy) / max(th, 1), 0, 1)
    white = np.array([255, 255, 255.]) + (np.array([222, 229, 240.]) - 255) * t
    redc = np.array([255, 52, 52.]) + (np.array([214, 0, 0.]) - np.array([255, 52, 52.])) * t
    face = Image.fromarray(np.dstack([white * (1 - red) + redc * red, a[..., 3]]).round().clip(0, 255).astype(np.uint8), 'RGBA')
    if p['bevel']:
        face = bevel(face, p['bevel'], blur=5 * S, offset=4 * S, lift=0.5)
    out = Image.alpha_composite(out, face)
    return out.resize((N, N), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser(description='Make a One UI app icon from a flat one.')
    ap.add_argument('source', help='the flat icon: 1280 px, slate box, white glyph, red detail')
    ap.add_argument('-o', '--out', required=True, help='where to write the PNG')
    ap.add_argument('--style', choices=PRESETS, default='glyph-3d')
    ap.add_argument('--fill', type=float, help='glyph-3d: the glyph\'s size, as a share of the icon (0.72)')
    args = ap.parse_args()

    p = dict(PRESETS[args.style])
    if args.fill:
        p['fill'] = args.fill
    glyph = extract_glyph(args.source)
    icon = glyph_3d(glyph, p) if args.style == 'glyph-3d' else frosted(glyph, p)
    icon.save(args.out, optimize=True)


if __name__ == '__main__':
    main()
