#!/usr/bin/env python3
"""
Digi-games — per-game Open Graph / Twitter Card image generator.

Regenerates assets/og/<slug>.png (1200x630) for every entry in
data/games.json, in the same dark/starfield/gradient visual language as
the existing assets/og-default.png (used as the site-wide fallback for
index.html/browse.html and any game missing a generated image).

USAGE
  From the project root:  python3 scripts/generate_og_images.py
  Re-run after editing games.json (new game, new poster, new officialScore,
  or a changed accent color) — it's fully deterministic and safe to re-run
  for all 50 games every time; only files whose game data changed will look
  different (a fixed per-slug RNG seed keeps the starfield stable otherwise).

Why generate these instead of reusing the poster / a single default image:
og-default.png is a generic brand card — fine as a site-wide fallback, but
every individual game page deserves its own preview (title, score, poster)
so a shared link on Discord/Twitter/iMessage actually identifies the game,
not just the site. Requested as part of the P1 roadmap's "social share +
auto-generated OG images" item.
"""
import json
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT, "data", "games.json")
OUT_DIR = os.path.join(ROOT, "assets", "og")
POSTER_DIR = os.path.join(ROOT, "assets", "posters")

W, H = 1200, 630
BG = (7, 7, 12)

FONT_DIR_CANDIDATES = [
    "/usr/share/fonts/truetype/liberation",
    "/usr/share/fonts/truetype/dejavu",
]


def find_font(names):
    for d in FONT_DIR_CANDIDATES:
        for n in names:
            p = os.path.join(d, n)
            if os.path.exists(p):
                return p
    return None


FONT_BOLD_PATH = find_font(["LiberationSans-Bold.ttf", "DejaVuSans-Bold.ttf"])
FONT_REG_PATH = find_font(["LiberationSans-Regular.ttf", "DejaVuSans.ttf"])


def font(path, size):
    return ImageFont.truetype(path, size)


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def initials(title):
    import re
    words = re.sub(r"[^A-Za-z0-9 ]", "", title).split()
    if not words:
        return "?"
    if len(words) == 1:
        return words[0][:2].upper()
    return (words[0][0] + words[1][0]).upper()


def draw_starfield(base, rng, count=46):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(count):
        x = rng.randint(0, W)
        y = rng.randint(0, H - 40)  # keep clear of the bottom accent bar
        r = rng.choice([1, 1, 1, 1.4, 1.8])
        a = rng.randint(60, 170)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, a))
    base.alpha_composite(layer)


def draw_glow(base, center, color, radius, alpha=110):
    pad = radius * 2
    layer = Image.new("RGBA", (pad * 2, pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([pad - radius, pad - radius, pad + radius, pad + radius], fill=(*color, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.55))
    base.alpha_composite(layer, (center[0] - pad, center[1] - pad))


def draw_star(draw, center, r, color):
    import math
    cx, cy = center
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.42
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    draw.polygon(pts, fill=(*color, 255))


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def wrap_title(draw, text, f, max_width, max_lines=2):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=f) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
        if len(lines) == max_lines:
            break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    if len(lines) == max_lines:
        last = lines[-1]
        while draw.textlength(last + "…", font=f) > max_width and len(last) > 1:
            last = last[:-1]
        # only add ellipsis if the source text actually got cut
        consumed = " ".join(lines[:-1] + [last])
        if len(consumed) < len(text):
            lines[-1] = last.rstrip() + "…"
    return lines[:max_lines]


def fit_title_lines(draw, text, max_width, max_h_per_line_budget, start_size=64, min_size=40):
    size = start_size
    while size >= min_size:
        f = font(FONT_BOLD_PATH, size)
        lines = wrap_title(draw, text, f, max_width)
        if len(lines) <= 2:
            return f, lines, size
        size -= 4
    f = font(FONT_BOLD_PATH, min_size)
    return f, wrap_title(draw, text, f, max_width), min_size


def build_poster_card(poster_path, box_w, box_h, radius=22):
    im = Image.open(poster_path).convert("RGB")
    im = ImageOps.fit(im, (box_w, box_h), method=Image.LANCZOS)
    card = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 0))
    card.paste(im, (0, 0))
    card.putalpha(rounded_mask((box_w, box_h), radius))
    # thin light edge so it reads as a card, not a floating cutout
    edge = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 0))
    ImageDraw.Draw(edge).rounded_rectangle(
        [0, 0, box_w - 1, box_h - 1], radius=radius, outline=(255, 255, 255, 46), width=2
    )
    card.alpha_composite(edge)
    return card


def build_monogram_card(title, accent, accent2, box_w, box_h, radius=22):
    card = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 0))
    grad = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 255))
    top = hex_to_rgb(accent)
    bot = hex_to_rgb(accent2)
    for y in range(box_h):
        t = y / max(1, box_h - 1)
        grad.putpixel((0, y), (*lerp(top, bot, t), 255))
    grad = grad.resize((box_w, box_h))
    for y in range(box_h):
        row_color = grad.getpixel((0, y))
        ImageDraw.Draw(grad).line([(0, y), (box_w, y)], fill=row_color)
    card.paste(grad, (0, 0))
    card.putalpha(rounded_mask((box_w, box_h), radius))
    d = ImageDraw.Draw(card)
    f = font(FONT_BOLD_PATH, int(box_h * 0.34))
    txt = initials(title)
    bbox = d.textbbox((0, 0), txt, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text((box_w / 2 - tw / 2 - bbox[0], box_h / 2 - th / 2 - bbox[1]), txt, font=f, fill=(6, 6, 10, 235))
    return card


def render_game(game):
    slug = game["slug"]
    accent = game.get("accent", "#7c8cff")
    accent2 = game.get("accent2", "#3ee6c4")

    base = Image.new("RGBA", (W, H), (*BG, 255))
    rng = random.Random(slug)

    draw_glow(base, (120, 90), hex_to_rgb(accent), 260, alpha=70)
    draw_glow(base, (W - 140, H - 40), hex_to_rgb(accent2), 300, alpha=90)
    draw_starfield(base, rng)

    d = ImageDraw.Draw(base)

    # ---- brand mark, top-left ----
    badge = 40
    bx, by = 56, 46
    badge_img = Image.new("RGBA", (badge, badge), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge_img)
    top, bot = hex_to_rgb(accent), hex_to_rgb(accent2)
    for x in range(badge):
        t = x / (badge - 1)
        bd.line([(x, 0), (x, badge)], fill=(*lerp(top, bot, t), 255))
    badge_img.putalpha(rounded_mask((badge, badge), 11))
    base.alpha_composite(badge_img, (bx, by))
    fdg = font(FONT_BOLD_PATH, 15)
    d.text((bx + badge / 2, by + badge / 2), "DG", font=fdg, fill=(8, 8, 12, 255), anchor="mm")
    fbrand = font(FONT_REG_PATH, 20)
    d.text((bx + badge + 12, by + badge / 2), "Digi-games", font=fbrand, fill=(214, 219, 235, 235), anchor="lm")

    # ---- right-side poster / monogram card ----
    card_w, card_h = 340, 476
    card_x = W - card_w - 70
    card_y = (H - card_h) // 2 + 8
    poster_path = None
    if game.get("poster"):
        candidate = os.path.join(ROOT, game["poster"])
        if os.path.exists(candidate):
            poster_path = candidate
    if poster_path:
        card = build_poster_card(poster_path, card_w, card_h)
    else:
        card = build_monogram_card(game["title"], accent, accent2, card_w, card_h)
    # soft shadow behind the card
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [card_x - 6, card_y + 14, card_x + card_w + 6, card_y + card_h + 26], radius=26, fill=(0, 0, 0, 150)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    base.alpha_composite(shadow)
    base.alpha_composite(card, (card_x, card_y))

    # ---- left text block ----
    text_left = 56
    text_max_w = card_x - text_left - 48

    year = game.get("releaseDate", "")[:4]
    genre = (game.get("genres") or ["Game"])[0]
    chip_text = f"{genre}  ·  {year}" if year else genre
    fchip = font(FONT_REG_PATH, 21)
    chip_y = 150
    d.text((text_left, chip_y), chip_text.upper(), font=fchip, fill=hex_to_rgb(accent2) + (255,))

    title_top = chip_y + 40
    ftitle, lines, size = fit_title_lines(d, game["title"], text_max_w, None)
    line_h = int(size * 1.16)
    for i, ln in enumerate(lines):
        d.text((text_left, title_top + i * line_h), ln, font=ftitle, fill=(247, 248, 252, 255))
    title_bottom = title_top + len(lines) * line_h

    tagline = game.get("tagline", "")
    if tagline:
        ftag = font(FONT_REG_PATH, 24)
        # truncate to one line within width
        t = tagline
        while d.textlength(t, font=ftag) > text_max_w and len(t) > 1:
            t = t[:-1]
        if t != tagline:
            t = t.rstrip() + "…"
        d.text((text_left, title_bottom + 18), t, font=ftag, fill=(163, 170, 196, 255))

    os_ = game.get("officialScore")
    meta_y = title_bottom + 66
    if isinstance(os_, dict) and isinstance(os_.get("value"), (int, float)):
        score = round(os_["value"])
        pill_text = f"{score}/100 critic score"
        fpill = font(FONT_BOLD_PATH, 20)
        tw = d.textlength(pill_text, font=fpill)
        pad_x, pad_y = 16, 10
        star_w = 26
        pw, ph = tw + pad_x * 2 + star_w, 20 + pad_y * 2
        pill = Image.new("RGBA", (int(pw), int(ph)), (0, 0, 0, 0))
        pd = ImageDraw.Draw(pill)
        pd.rounded_rectangle([0, 0, pw - 1, ph - 1], radius=ph / 2, fill=(255, 255, 255, 28), outline=(255, 255, 255, 70), width=1)
        draw_star(pd, (pad_x + 9, ph / 2), 8, hex_to_rgb(accent2))
        pd.text((pad_x + star_w, ph / 2), pill_text, font=fpill, fill=(247, 248, 252, 255), anchor="lm")
        base.alpha_composite(pill, (text_left, int(meta_y)))

    # ---- bottom accent bar ----
    bar_h = 10
    bar = Image.new("RGBA", (W, bar_h), (0, 0, 0, 0))
    bd2 = ImageDraw.Draw(bar)
    for x in range(W):
        t = x / (W - 1)
        bd2.line([(x, 0), (x, bar_h)], fill=(*lerp(top, bot, t), 255))
    base.alpha_composite(bar, (0, H - bar_h))

    out = base.convert("RGB")
    out_path = os.path.join(OUT_DIR, f"{slug}.png")
    out.save(out_path, "PNG", optimize=True)
    return out_path


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        games = json.load(f)
    os.makedirs(OUT_DIR, exist_ok=True)
    if not FONT_BOLD_PATH or not FONT_REG_PATH:
        print("ERROR: no usable TrueType fonts found on this system.", file=sys.stderr)
        sys.exit(1)
    for game in games:
        path = render_game(game)
        print("wrote", os.path.relpath(path, ROOT))
    print(f"Done — {len(games)} OG images in assets/og/")


if __name__ == "__main__":
    main()
