"""Trace a line-art reference's strokes to centerlines, for redrawing it in the Hand's construction.

    uvx --with scikit-image --with pillow --with numpy python tools/blender/hand/trace/skeleton.py \
        tools/blender/hand/reference/write.quiver.svg

Renders the SVG (Chrome, 20 px per unit), removes filled areas thicker than a stroke (a pen's
barrel), skeletonizes the strokes, and orders the skeleton into branches between junctions. Writes
out/<name>.branches.json (each branch's points in the SVG's units, longest first),
out/<name>.branches.png (the branches numbered over the drawing), and out/<name>.fill.json (the
filled area's principal axis and extent, e.g. a held pen's).
"""

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from skimage.morphology import dilation, disk, erosion, skeletonize

PX = 20  # raster pixels per SVG unit
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def render(svg: Path, out: Path) -> tuple[np.ndarray, list[float]]:
    src = svg.read_text()
    x0, y0, w, h = (float(v) for v in re.search(r'viewBox="([^"]+)"', src).group(1).split())
    sized = re.sub(r"<svg([^>]*)>", lambda m: "<svg" + re.sub(r'\s(width|height|style)="[^"]*"', "", m.group(1))
                   + f' width="{w * PX:.0f}" height="{h * PX:.0f}">', src, count=1)
    tmp = out / f"{svg.stem}.raster.svg"
    tmp.write_text(sized)
    png = out / f"{svg.stem}.raster.png"
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--default-background-color=ffffffff",
                    f"--screenshot={png}", f"--window-size={w * PX:.0f},{h * PX:.0f}", f"file://{tmp}"],
                   check=True, capture_output=True)
    return np.array(Image.open(png).convert("L")), [x0, y0]


def branches(sk: np.ndarray) -> list[list[tuple[int, int]]]:
    pts = set(zip(*np.nonzero(sk)))

    def nb(p):
        y, x = p
        return [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (y + dy, x + dx) in pts]

    nodes = {p for p in pts if len(nb(p)) != 2}
    seen, out = set(), []
    for s in nodes:
        for n in nb(s):
            if (s, n) in seen:
                continue
            path, prev, cur = [s, n], s, n
            seen.add((s, n))
            while cur not in nodes:
                nxt = [q for q in nb(cur) if q != prev and q not in path[-3:]]
                if not nxt:
                    break
                prev, cur = cur, nxt[0]
                path.append(cur)
            seen.add((path[-1], path[-2]))
            out.append(path)
    rest = pts - {p for b in out for p in b}
    while rest:  # closed loops with no junction
        s = rest.pop()
        path, prev, cur = [s], None, s
        while True:
            nxt = [q for q in nb(cur) if q != prev and q in rest]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            rest.discard(cur)
            path.append(cur)
        out.append(path)
    return sorted(out, key=len, reverse=True)


def main():
    svg = Path(sys.argv[1])
    out = Path(__file__).resolve().parent.parent / "out"
    out.mkdir(exist_ok=True)
    img, (x0, y0) = render(svg, out)
    ink = img < 128
    fill = dilation(erosion(ink, disk(PX)), disk(PX + 2))  # anything a stroke-width disc can't fit in
    sk = skeletonize(ink & ~fill)
    kept = [b for b in branches(sk) if len(b) >= 15]
    dense = [[[round(x / PX + x0, 3), round(y / PX + y0, 3)] for y, x in b] for b in kept]
    (out / f"{svg.stem}.branches.json").write_text(json.dumps(dense))
    ys, xs = np.nonzero(dilation(erosion(ink, disk(PX)), disk(PX)))
    if len(xs):
        pts = np.c_[xs, ys] / PX + [x0, y0]
        mid = pts.mean(0)
        u = np.linalg.eigh(np.cov((pts - mid).T))[1][:, -1]
        u = u if u[0] >= 0 else -u
        t = (pts - mid) @ u
        (out / f"{svg.stem}.fill.json").write_text(json.dumps({
            "point": mid.round(3).tolist(), "axis": u.round(4).tolist(),
            "ends": [(mid + u * t.min()).round(3).tolist(), (mid + u * t.max()).round(3).tolist()]}))
    pic = Image.fromarray(np.where(ink, 200, 255).astype(np.uint8)).convert("RGB")
    draw = ImageDraw.Draw(pic)
    for i, b in enumerate(kept):
        draw.line([(x, y) for y, x in b[::4]], fill=(220, 0, 0), width=3)
        y, x = b[len(b) // 2]
        draw.text((x + 6, y), str(i), fill=(0, 0, 255))
    pic.save(out / f"{svg.stem}.branches.png")
    for i, b in enumerate(dense):
        print(i, len(b), "from", b[0], "to", b[-1])


if __name__ == "__main__":
    main()
