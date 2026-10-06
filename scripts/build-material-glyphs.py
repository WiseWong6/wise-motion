# Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
"""直接描摹随包宋拓原页中的道字；笔画路径仅控制显现，不重新设计字形。生成需要 OpenCV、NumPy 和 FontTools。"""
import argparse
import json
from pathlib import Path
import cv2
import numpy as np
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
checking = parser.parse_args().check

# 宋拓册页第二开左页，“童遊”下方、“樹”上方的原字。
# 原页随包保留，以下坐标直接截取原页像素；不重新设计字形。
# https://digitalarchive.npm.gov.tw/Collection/Detail/1947?dep=P
DAO_CROP = (811, 902, 144, 143)
SAMPLE = 4
OPENING_FRAMES = [1, 4, 5, 6, 10, 12, 13, 14, 15, 16, 17, 18, 20, 34, 36, 38, 40, 42, 44, 46, 47, 48, 50, 52, 53, 54, 55, 56, 58, 60, 64, 67, 70, 71, 73, 74, 76]
ENDING_FRAMES = [357, 358, 359, 360, 361, 363, 364, 365, 368, 369, 370, 371, 372, 373, 375, 377, 378, 381, 382, 384, 387, 390, 392, 395, 397, 410, 433]
COLORS = ['#c3c3c3', '#8c8c8c', '#5f5f5f', '#505050', '#3c3c3c', '#2d2d2d', '#202020']


def number(n):
    return round(float(n), 3)


def path(points):
    return ''.join(('M' if i == 0 else 'L') + str(number(x)) + ' ' + str(number(y)) for i, (x, y) in enumerate(points)) + 'Z'


def source_masks(filename, crop):
    image = cv2.imread(str(ROOT / 'vendor/duobaota' / filename), cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise SystemExit('缺少随包宋拓原页：' + filename)
    x, y, w, h = crop
    # 轻微平滑只去除扫描采样台阶；七档亮度保留拓本边缘及笔画内部纹理。
    gray = cv2.GaussianBlur(image[y:y+h, x:x+w], (3, 3), .35)
    gray = cv2.resize(gray, (w*SAMPLE, h*SAMPLE), interpolation=cv2.INTER_CUBIC)
    masks = []
    for level in [90, 100, 110, 120, 130, 140, 150]:
        mask = np.uint8(gray >= level)*255
        count, components, stats, _ = cv2.connectedComponentsWithStats(mask)
        for i in range(1, count):
            if stats[i, cv2.CC_STAT_AREA] < 4*SAMPLE*SAMPLE:
                mask[components == i] = 0
        masks.append(mask)
    return masks


def transform_for(mask, width=246, height=246, cx=320, cy=180):
    ys, xs = np.nonzero(mask)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
    scale = min(width/(x1-x0), height/(y1-y0))
    return scale, cx-(x0+x1)*scale/2, cy-(y0+y1)*scale/2


def contours(mask, transform):
    scale, tx, ty = transform
    found, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    result = []
    for contour in found:
        if abs(cv2.contourArea(contour)) < SAMPLE*SAMPLE*.75:
            continue
        points = cv2.approxPolyDP(contour, .55, True).reshape(-1, 2)
        if len(points) >= 3:
            result.append([[number(x*scale+tx), number(y*scale+ty)] for x, y in points])
    return result


# 这些路径只决定原字像素何时显现，不参与可见笔画造型。
# 末帧完整使用原字轮廓；所有相交、粗细、收笔和留白来自拓本。
REVEAL_GUIDES = [
    [(51, 19), (65, 26), (64, 37)],
    [(88, 13), (83, 26), (71, 38)],
    [(41, 42), (69, 36), (104, 27)],
    [(70, 40), (65, 52), (59, 63)],
    [(60, 62), (60, 88), (60, 107)],
    [(63, 61), (91, 54), (98, 60), (97, 82), (95, 111)],
    [(65, 71), (82, 68)],
    [(65, 88), (82, 83)],
    [(60, 105), (96, 94)],
    [(15, 31), (32, 37)],
    [(12, 60), (22, 65)],
    [(27, 79), (22, 82), (28, 97), (38, 102)],
    [(14, 111), (51, 116), (90, 127), (130, 122)],
]


def reveal_times(shape):
    yy, xx = np.indices(shape, dtype=float)
    xx, yy = xx/SAMPLE, yy/SAMPLE
    best = np.full(shape, np.inf)
    times = np.zeros(shape)
    for index, guide in enumerate(REVEAL_GUIDES):
        guide = np.array(guide, dtype=float)
        lengths = np.linalg.norm(np.diff(guide, axis=0), axis=1)
        total, traveled = lengths.sum(), 0.
        for a, b, length in zip(guide[:-1], guide[1:], lengths):
            dx, dy = b-a
            t = np.clip(((xx-a[0])*dx+(yy-a[1])*dy)/(length*length), 0, 1)
            distance = (xx-a[0]-t*dx)**2+(yy-a[1]-t*dy)**2
            take = distance < best
            times[take] = index+(traveled+t[take]*length)/total
            best[take] = distance[take]
            traveled += length
    return times


dao_masks = source_masks('page-02.jpg', DAO_CROP)
dao_transform = transform_for(dao_masks[0])
arrival = reveal_times(dao_masks[0].shape)
opening = []
for frame in OPENING_FRAMES:
    elapsed = min((frame-1)/19, 1)*9 if frame <= 34 else 9+min((frame-34)/32, 1)*4
    visible = arrival <= elapsed
    if frame == 1:
        visible[:] = False
    layers = []
    for color, mask in zip(COLORS, dao_masks):
        revealed = np.where(visible, mask, 0).astype(np.uint8)
        layers.append({'color': color, 'path': ''.join(path(p) for p in contours(revealed, dao_transform))})
    opening.append({'frame': frame, 'layers': layers})

# 片尾一、二、三沿用横笔动画的固定笔形与位置；不再取道字部件拼凑。
def horizontal(xs, top, bottom):
    points = list(zip(xs, top)) + list(zip(xs, bottom))[::-1]
    return {'p': points, 'h': []}

single = horizontal([210,216,223,232,244,262,284,306,328,350,372,390,401,412,422,428,430], [188,182,177,175,175,174,173,171,169,168,167,165,165,168,172,178,184], [197,201,206,208,207,204,202,201,200,199,198,198,200,202,201,195,189])

def shifted_stroke(y, scale=1):
    return {'p': [[number(320+(x-320)*scale), number(y+(v-185)*scale)] for x, v in single['p']], 'h': []}


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
        if i == 1:
            shapes = [{'p': p, 'h': []} for p in contours(dao_masks[0], dao_transform)]
        elif i == 2:
            shapes = [single]
        elif i == 3:
            shapes = [shifted_stroke(132, .55), shifted_stroke(228)]
        else:
            shapes = [shifted_stroke(112, .75), shifted_stroke(182, .6), shifted_stroke(252)]
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
         'source': '道字直接描摹宋拓多宝佛塔碑册第二开左页的道树萌牙原字；原页与截取坐标随包保存，灰度描边不重新设计字形。一二三沿用横笔动画的项目笔形，英文和数字由 Oswald Bold 生成。',
         'traced_character': {'text': '道', 'source_file': 'vendor/duobaota/page-02.jpg', 'crop': DAO_CROP, 'source_url': 'https://digitalarchive.npm.gov.tw/Collection/Detail/1947?dep=P', 'license': 'CC-BY-4.0'},
         'license': 'AGPL-3.0-only; traced rubbing CC-BY-4.0; Oswald font outlines SIL-OFL-1.1',
         'generator': 'scripts/build-material-glyphs.py'}
content = '/* Generated by scripts/build-material-glyphs.py; 描摹道字 CC-BY-4.0（国立故宫博物院，台北）；程序及横笔 AGPL-3.0-only；字体轮廓 SIL-OFL-1.1。 */\nglobalThis.WiseMaterialKeyShapes=' + json.dumps(value, ensure_ascii=False, separators=(',', ':')) + ';\n'
target = ROOT / 'catalog/assets/material-evolution/key-shapes.js'
if checking:
    if target.read_text() != content:
        raise SystemExit('笔画与开放字体生成结果不一致')
else:
    target.write_text(content)
print('37 个古帖描摹姿态及 27 个片尾姿态' + ('已核对' if checking else '已生成'))
