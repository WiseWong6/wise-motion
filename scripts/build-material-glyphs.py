# Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
"""生成古帖参考的独立笔画与开放字体字标；不读取宣传片或其轮廓。"""
import argparse
import json
import math
import re
from pathlib import Path
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
checking = parser.parse_args().check

# 参考颜真卿《多宝塔碑》的道字结构及起收笔，自行定义动画笔画。
# https://digitalarchive.npm.gov.tw/Collection/Detail/36759?dep=P
# 馆藏图像开放条件：低阶 CC0、中阶 CC BY 4.0；本程序不取原图像素。
# 四点是三次曲线的起点、控制点、控制点、终点；后三数为起、中、末宽。
STROKES = [
    ((286, 44), (294, 49), (301, 58), (302, 69), (9, 17, 11)),
    ((353, 44), (351, 52), (344, 63), (331, 76), (14, 16, 4)),
    ((271, 90), (296, 89), (339, 86), (378, 85), (11, 14, 18)),
    ((303, 94), (298, 102), (291, 109), (282, 114), (12, 11, 5)),
    ((274, 116), (272, 141), (272, 190), (274, 225), (14, 18, 17)),
    ((278, 115), (303, 111), (342, 111), (369, 113), (12, 13, 18)),
    ((373, 116), (374, 149), (374, 197), (371, 228), (17, 18, 21)),
    ((278, 148), (301, 145), (336, 145), (366, 145), (9, 11, 13)),
    ((278, 183), (301, 180), (337, 180), (366, 180), (9, 11, 13)),
    ((278, 220), (302, 217), (339, 218), (367, 219), (12, 14, 17)),
    ((207, 117), (221, 120), (232, 128), (233, 139), (7, 18, 10)),
    ((207, 164), (219, 162), (234, 161), (241, 163), (10, 14, 17)),
    ((239, 166), (235, 188), (218, 210), (229, 240), (17, 14, 16)),
    ((219, 245), (258, 280), (329, 311), (445, 289), (10, 24, 3)),
]
OPENING_FRAMES = [1, 4, 5, 6, 10, 12, 13, 14, 15, 16, 17, 18, 20, 34, 36, 38, 40, 42, 44, 46, 47, 48, 50, 52, 53, 54, 55, 56, 58, 60, 64, 67, 70, 71, 73, 74, 76]
ENDING_FRAMES = [357, 358, 359, 360, 361, 363, 364, 365, 368, 369, 370, 371, 372, 373, 375, 377, 378, 381, 382, 384, 387, 390, 392, 395, 397, 410, 433]
COLORS = ['#c3c3c3', '#8c8c8c', '#5f5f5f', '#505050', '#3c3c3c', '#2d2d2d', '#202020']


def number(n):
    return round(n, 3)


def path(points):
    return ''.join(('M' if i == 0 else 'L') + str(number(x)) + ' ' + str(number(y)) for i, (x, y) in enumerate(points)) + 'Z'


def brush(stroke, progress, inset):
    a, b, c, d, widths = stroke
    left, right = [], []
    for i in range(41):
        t = progress * i / 40
        q = 1 - t
        x, y = [q**3*a[j] + 3*q*q*t*b[j] + 3*q*t*t*c[j] + t**3*d[j] for j in [0, 1]]
        dx, dy = [3*q*q*(b[j]-a[j]) + 6*q*t*(c[j]-b[j]) + 3*t*t*(d[j]-c[j]) for j in [0, 1]]
        length = math.hypot(dx, dy)
        nx, ny = -dy/length, dx/length
        width = (q*q*widths[0] + 2*q*t*widths[1] + t*t*widths[2]) / 2 - inset
        width = max(.5, width)
        # 固定细微毛边及提按；没有随机源，也没有从原片采样。
        edge = .3*math.sin(i*1.8 + a[0])
        left.append((x + nx*(width + edge), y + ny*(width + edge)))
        right.append((x - nx*(width - edge), y - ny*(width - edge)))
    return path(left + right[::-1])


opening = []
for frame in OPENING_FRAMES:
    # 首部在前段接续，中段短停，走之旁随后接上；末态仍供粒子采样。
    elapsed = min((frame-1)/19, 1)*10 if frame <= 34 else 10 + min((frame-34)/32, 1)*4
    layers = []
    for j, color in enumerate(COLORS):
        strokes = [brush(s, min(1, elapsed-i), j*.45) for i, s in enumerate(STROKES) if elapsed > i]
        layers.append({'color': color, 'path': ''.join(strokes)})
    opening.append({'frame': frame, 'layers': layers})


class Polygons(BasePen):
    def __init__(self, glyph_set):
        super().__init__(glyph_set)
        self.contours, self.current = [], []

    def _moveTo(self, p):
        self.current = [p]

    def _lineTo(self, p):
        self.current.append(p)

    def _qCurveToOne(self, a, b):
        start = self.current[-1]
        for i in range(1, 17):
            t = i/16
            self.current.append(tuple((1-t)**2*start[j] + 2*(1-t)*t*a[j] + t*t*b[j] for j in [0, 1]))

    def _curveToOne(self, a, b, c):
        start = self.current[-1]
        for i in range(1, 25):
            t = i/24
            self.current.append(tuple((1-t)**3*start[j] + 3*(1-t)**2*t*a[j] + 3*(1-t)*t*t*b[j] + t**3*c[j] for j in [0, 1]))

    def _closePath(self):
        if len(self.current) >= 3:
            self.contours.append(self.current)
        self.current = []

    def _endPath(self):
        self._closePath()


fonts = {}
for name in ['Oswald-Bold.woff2']:
    f = TTFont(ROOT / 'catalog/fonts' / name)
    fonts[name] = (f, f.getGlyphSet(), f.getBestCmap())


def text(text, size, baseline, spacing=1):
    font, glyph_set, cmap = fonts['Oswald-Bold.woff2']
    factor = size / font['head'].unitsPerEm
    width = sum(glyph_set[cmap[ord(ch)]].width*factor for ch in text) + spacing*(len(text)-1)
    x = (640-width)/2
    shapes = []
    for char in text:
        glyph = glyph_set[cmap[ord(char)]]
        pen = Polygons(glyph_set)
        glyph.draw(pen)
        for points in pen.contours:
            shapes.append({'p': [[number(x+px*factor), number(baseline-py*factor)] for px, py in points], 'h': []})
        x += glyph.width*factor + spacing
    return shapes


labels = ['_', '道', '一', '二', '三', '7', '6', '5', '4', '3', '2', '1', '0', 'WISE', 'MOTION', 'WISE', 'MOTION', 'WISE MOTION', 'WISE MOTION', 'WISE MOTION', 'WISE MOTION', 'WISE MOTION', 'WISE MOTION', 'WISE MOTION', 'WISE MOTION', 'WISE MOTION / OPEN SOURCE', 'WISE MOTION']
ending = []
for i, (frame, label) in enumerate(zip(ENDING_FRAMES, labels)):
    if i == 0:
        shapes = [{'p': [[267.3, 212.3], [280.3, 212.3], [280.3, 215.8], [267.3, 215.8]], 'h': []}]
    elif i < 5:
        # 试样继续使用同一独立书法笔画，不临时掺入现代书法字库。
        selected = STROKES if i == 1 else [STROKES[2]] if i == 2 else [STROKES[2], STROKES[9]] if i == 3 else [STROKES[2], STROKES[8], STROKES[9]]
        shapes = []
        for stroke in selected:
            points = brush(stroke, 1, 0)
            values = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', points)]
            shapes.append({'p': [values[j:j+2] for j in range(0, len(values), 2)], 'h': []})
    elif i == 25:
        shapes = text('WISE MOTION', 30, 164) + text('OPEN SOURCE', 24, 207)
    elif i == 24:
        shapes = text(label, 30, 164)
    elif i == 26:
        shapes = text(label, 72, 209, spacing=2)
    else:
        shapes = text(label, 65 if i < 13 else 42+(i%3)*6, 209, spacing=1+(i%3))
    ending.append({'frame': frame, 'label': label, 'shapes': shapes})

value = {'opening': opening, 'ending': ending,
         'source': '开头依据颜真卿《多宝塔碑》结构独立定义笔画；结尾书法试样复用这些笔画，英文与数字由随包 Oswald Bold 生成；无原片提取轮廓。',
         'license': 'AGPL-3.0-only; Oswald font outlines SIL-OFL-1.1',
         'generator': 'scripts/build-material-glyphs.py'}
content = '/* Generated by scripts/build-material-glyphs.py; 自有笔画 AGPL-3.0-only；字体轮廓 SIL-OFL-1.1。 */\nglobalThis.WiseMaterialKeyShapes=' + json.dumps(value, ensure_ascii=False, separators=(',', ':')) + ';\n'
target = ROOT / 'catalog/assets/material-evolution/key-shapes.js'
if checking:
    if target.read_text() != content:
        raise SystemExit('笔画与开放字体生成结果不一致')
else:
    target.write_text(content)
print('37 个独立书法姿态及 27 个开放字体收尾姿态' + ('已核对' if checking else '已生成'))
