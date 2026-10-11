#!/usr/bin/env python3
"""Freeze the supplied painter's inputs, fixed city strips and regression hashes.

Run only when importing a source: python3 scripts/build-pixel-motion.py /path/r.py
Ordinary catalog builds use the frozen local files and do not require NumPy.
"""
import base64
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

root = Path(__file__).resolve().parents[1]
original = Path(sys.argv[1]).read_text()
source = original.split('import os\n')[0].replace('"NEW BOT"', '"WISE"').replace('lw=7*18-3', 'lw=len("WISE")*18-3')
source = '# Drawing extracted from the user-supplied r.py; branding changed to WISE.\n# SPDX-License-Identifier: Apache-2.0\n' + source
original_drawing = source
original_ns = {}
exec(compile(original_drawing, 'original_drawing.py', 'exec'), original_ns)

# Generate every building and window once, before time or viewport clipping exists.
# Retain the original palette, size ranges, layer order and fixed random seeds.
city_setup = '''BASE_RATE=1.5
def make_city():
    layers=[]
    for L,(sp,c,hh,seed) in enumerate([(8,1,90,3),(20,15,60,4),(45,0,35,5)]):
        rng=np.random.default_rng(seed); xs=0; buildings=[]
        while xs<W+60:
            bw=int(rng.integers(14,30)); bh=int(rng.integers(hh//2,hh)); windows=[]
            for wy in range(H-bh+4,H-4,6):
                for wx in range(3,bw-3,5):
                    if rng.random()<.4: windows.append([wx,wy])
            buildings.append(dict(x=xs,width=bw,height=bh,windows=windows))
            xs+=bw+int(rng.integers(2,10))
        layers.append(dict(speed=sp,color=c,windowColor=4 if L else 3,span=xs,buildings=buildings))
    return layers
CITY=make_city()
def city(img,u):
    for layer in CITY:
        shift=math.floor((u*layer['speed'])%layer['span'])
        for b in layer['buildings']:
            for wrap in [-layer['span'],0,layer['span']]:
                x=b['x']-shift-30+wrap
                if x+b['width']<=0 or x>=W: continue
                rect(img,x,H-b['height'],b['width'],b['height'],layer['color'])
                for wx,wy in b['windows']: rect(img,x+wx,wy,2,2,layer['windowColor'])
'''
start = source.index('        for L,(sp,c,hh,seed) in enumerate(')
end = source.index('        circ(img,260,30,14,14,4)', start)
source = source[:start] + '        city(img,u)\n' + source[end:]
source = source.replace('def frame(f):', city_setup + 'def source_frame(f):')
source = source.replace('W,H,FPS,T=320,180,30,30', 'W,H,FPS,T=320,180,30,20')
source += '\n# The native speed is 1.5 times the original drawing clock.\ndef frame(f):\n    return source_frame(min(899,max(0,math.floor(f*BASE_RATE+1e-9))))\n'
asset = root / 'catalog/assets/pixel-motion'
asset.mkdir(parents=True, exist_ok=True)
(asset / 'drawing.py').write_text(source)
ns = {}
exec(compile(source, 'drawing.py', 'exec'), ns)
rng = np.random.default_rng(1)
stars = [[int(rng.integers(0, 320)), int(rng.integers(0, 180))] for _ in range(60)]
dissolve = {}
for f in range(900):
    t = f / 30
    threshold = (t - 3.6) * 2.5 if 3.6 < t < 4 else (t - 29.5) * 2 if t > 29.5 else 0
    if threshold > 0:
        bits = np.packbits((np.random.default_rng(f).random((180, 320)) < threshold).ravel(), bitorder='little')
        dissolve[str(f)] = base64.b64encode(bits.tobytes()).decode()
data = {'width': 320, 'height': 180, 'fps': 30, 'palette': ns['P'].tolist(), 'glyphs': ns['F'],
        'starts': ns['lstart'], 'delays': ns['ldel'].tolist(), 'confetti': [[float(x), float(y), int(c)] for x, y, c in ns['conf']],
        'stars': stars, 'cityLayers': ns['CITY'], 'dissolve': dissolve}
(root / 'catalog/effects/pixel-motion-data.js').write_text('/* Frozen seeded inputs from drawing.py. SPDX-License-Identifier: Apache-2.0 */\nglobalThis.WisePixelMotionData = ' + json.dumps(data, separators=(',', ':')) + ';\n')
frames = [hashlib.sha256(original_ns['frame'](f)[::4, ::4].tobytes()).hexdigest() for f in range(900)]
(root / 'tests/pixel-motion-baseline.json').write_text(json.dumps({'source_sha256': hashlib.sha256(original_drawing.encode()).hexdigest(), 'frames': frames}, indent=2) + '\n')
city_frames = [hashlib.sha256(ns['source_frame'](f)[::4, ::4].tobytes()).hexdigest() for f in range(300,540)]
(root / 'tests/pixel-motion-city-baseline.json').write_text(json.dumps({'source_sha256': hashlib.sha256(source.encode()).hexdigest(), 'start_source_frame': 300, 'frames': city_frames}, indent=2) + '\n')
(asset / 'SOURCE.json').write_text(json.dumps({'name': 'User-supplied r.py pixel animation', 'original_sha256': hashlib.sha256(original.encode()).hexdigest(),
    'drawing_sha256': hashlib.sha256(source.encode()).hexdigest(), 'changes': ['NEW BOT → WISE in opening and ending', 'Recalculate centered word width from WISE', 'Extract visual painter; omit audio and encoder execution', 'Set native playback rate to 1.5 times the original; duration 20 seconds', 'Freeze building geometry and local window lights once; scroll and wrap complete strips without re-randomizing'],
    'design_size': [320, 180], 'output_size': [1280, 720], 'fps': 30, 'source_duration_seconds': 30, 'base_rate': 1.5, 'duration_seconds': 20, 'license': 'Apache-2.0'}, indent=2) + '\n')
print('Frozen drawing inputs, stable city strips, 900 original hashes and 240 corrected city hashes.')
