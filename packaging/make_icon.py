"""Draw the AVAS application icon (window, AVAS.exe / AVASGui.exe, installer).

    .venv\\Scripts\\python.exe packaging\\make_icon.py

writes ``frontend/public/avas.ico`` (copied into ``avas/gui/web`` by the front-end
build) and ``frontend/public/avas.png``.  The motif is a linac cell: a beam
envelope through a quadrupole doublet and an RF cavity.
"""
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "frontend", "public")
S = 1024


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))


def draw():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # rounded square with a vertical gradient
    grad = Image.new("RGBA", (S, S))
    top, bottom = (18, 52, 96, 255), (6, 118, 212, 255)
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        gd.line([(0, y), (S, y)], fill=lerp(top, bottom, y / (S - 1)))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([40, 40, S - 40, S - 40], radius=210, fill=255)
    img.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(img)
    cy = S // 2 + 10
    # quadrupole doublet: focusing above, defocusing below
    green = (60, 196, 140, 255)
    d.rounded_rectangle([170, cy - 250, 290, cy - 60], radius=24, fill=green)
    d.rounded_rectangle([330, cy + 60, 450, cy + 250], radius=24, fill=green)
    # RF cavity
    amber = (240, 186, 64, 255)
    d.ellipse([540, cy - 230, 860, cy + 230], fill=amber)
    d.ellipse([610, cy - 150, 790, cy + 150], fill=(250, 214, 120, 255))
    # beam envelope: waist in the doublet, wider in front, focused through the cavity
    import math
    env = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    e = ImageDraw.Draw(env)
    top, bot = [], []
    for i in range(0, 161):
        x = 100 + i * 5.2
        w = 34 + 58 * (0.5 + 0.5 * math.cos((x - 100) / 824 * 2 * math.pi))
        top.append((x, cy - w))
        bot.append((x, cy + w))
    e.polygon(top + bot[::-1], fill=(150, 235, 255, 185))
    env = env.filter(ImageFilter.GaussianBlur(2))
    img.alpha_composite(env)
    d = ImageDraw.Draw(img)
    d.line([(90, cy), (S - 90, cy)], fill=(255, 255, 255, 255), width=20)
    return Image.composite(img, Image.new("RGBA", (S, S), (0, 0, 0, 0)), mask)


def main():
    os.makedirs(OUT, exist_ok=True)
    big = draw()
    big.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "avas.png"))
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    big.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, "avas.ico"), sizes=sizes)
    print("wrote", os.path.join(OUT, "avas.ico"))


if __name__ == "__main__":
    main()
