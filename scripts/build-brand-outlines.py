# Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
"""用随包 Oswald Bold 生成三个固定字标；原字体许可见 catalog/fonts/OFL-Oswald.txt。"""
import argparse
import json
import re
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
font = TTFont(root / 'catalog/fonts/Oswald-Bold.woff2')
assert font['head'].unitsPerEm == 1000 and font['OS/2'].sCapHeight == 810
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()


class Outline(BasePen):
    def __init__(self):
        super().__init__(glyph_set)
        self.path = []

    def _moveTo(self, p): self.path.append(['M', *p])
    def _lineTo(self, p): self.path.append(['L', *p])
    def _qCurveToOne(self, a, b): self.path.append(['Q', *a, *b])
    def _curveToOne(self, a, b, c): self.path.append(['C', *a, *b, *c])
    def _closePath(self): self.path.append(['Z'])
    def _endPath(self): self._closePath()


def glyph(char, canvas=False):
    source = glyph_set[cmap[ord(char)]]
    bounds = BoundsPen(glyph_set)
    source.draw(bounds)
    pen = Outline() if canvas else SVGPathPen(glyph_set)
    source.draw(pen)
    return {
        'advance' if canvas else 'width': source.width,
        'bounds': list(bounds.bounds),
        'path': pen.path if canvas else pen.getCommands(),
    }


def literal(source, name):
    start = re.search(r'const ' + name + r'\s*=\s*', source).end()
    value, length = json.JSONDecoder().raw_decode(source[start:])
    return value, start, start + length


def output(relative, name, value):
    path = root / relative
    source = path.read_text()
    _, start, end = literal(source, name)
    generated = source[:start] + json.dumps(value, ensure_ascii=False, separators=(',', ':')) + source[end:]
    if args.check:
        if source != generated:
            raise SystemExit(relative + ' 的字标与随包 Oswald Bold 不一致')
    elif generated != source:
        path.write_text(generated)
    print(relative + '：Oswald Bold 固定字标已核对')


output('catalog/effects/glass-light.js', 'wordmarkGlyphs',
       {c: glyph(c, canvas=True) for c in dict.fromkeys('WISEMOTION')})
output('catalog/effects/reel-opening.js', 'glyphs',
       {c: glyph(c) for c in dict.fromkeys('MOTION')})

relative = 'catalog/effects/reel-prompt-outro.js'
art, _, _ = literal((root / relative).read_text(), 'artwork')
row = art['credits'][0]
row['font'] = 'Oswald-Bold'
# 保持原大写字高与基线，按新字体的字宽重新居中。
row['size'] = 230 * 714 / 810
row['weight'] = 700
widths = {c: glyph(c)['width'] for c in dict.fromkeys(row['text'])}
row['width'] = sum(widths[c] * row['size'] / 1000 for c in row['text']) + row['track'] * (len(row['text']) - 1)
row['x0'] = (1920 - row['width']) / 2
x = row['x0']
row['letters'] = []
for c in row['text']:
    row['letters'].append({'ch': c, 'x': x})
    x += widths[c] * row['size'] / 1000 + row['track']
art['glyphs'].pop('HelveticaNeue-Bold', None)
art['glyphs']['Oswald-Bold'].update({c: glyph(c)['path'] for c in widths})
output(relative, 'artwork', art)
