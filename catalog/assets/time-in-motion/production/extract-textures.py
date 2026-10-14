"""Recover the author's packed texture from the source scene without saving that scene."""
# Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
from pathlib import Path
import argparse, hashlib, json, sys
import bpy

root = Path(__file__).resolve().parent / 'project'
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=root / '修订版/模型/基线怀表.blend')
parser.add_argument('--out', type=Path, default=root / '原始建模/材质/底板珍珠纹.png')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
bpy.ops.wm.open_mainfile(filepath=str(args.source.resolve()), load_ui=False)
image = next((image for image in bpy.data.images if image.packed_file and
              '底板珍珠纹' in (image.name + image.filepath)), None)
if image is None:
    raise RuntimeError('基线场景没有打包的底板珍珠纹；请提供对应作者原纹理。')
data = bytes(image.packed_file.data)
if args.out.exists() and args.out.read_bytes() != data:
    raise RuntimeError('目标纹理已有修改，不覆盖：' + str(args.out))
args.out.parent.mkdir(parents=True, exist_ok=True)
if not args.out.exists():
    with args.out.open('xb') as stream:
        stream.write(data)
print(json.dumps({'image': image.name, 'bytes': len(data),
                  'sha256': hashlib.sha256(data).hexdigest(), 'sourceUnchanged': True}))
