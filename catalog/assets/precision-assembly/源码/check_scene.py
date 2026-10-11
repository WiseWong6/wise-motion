"""Check saved assembly, layer separation and camera assignments in Blender."""
import bpy, json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
s=bpy.context.scene
layer_names=['01 / Frosted mainplate','02 / Going train and barrel','03 / Winding train','04 / Balance and escapement','05 / Sculpted and engraved bridges','CASEWORK · chapter','CASEWORK · hands']
result={}
for frame in [1,108,200,340,432,528]:
    s.frame_set(frame)
    result[str(frame)]={'camera':s.camera.name,'layers':{name:round(bpy.data.objects[name].location.z,6) for name in layer_names}}
for name in layer_names:
    assert abs(result['200']['layers'][name]-result['528']['layers'][name])<1e-5,(name,'did not reassemble')
assert result['340']['layers']['CASEWORK · hands']>3
assert result['340']['layers']['CASEWORK · chapter']>2
assert len(set(r['camera'] for r in result.values()))==5
assert s.render.resolution_x==1920 and s.render.resolution_y==1080
assert s.render.fps==24 and s.frame_end==528
assert all(all(math.isfinite(v) for v in o.location) for o in s.objects)
packed_images=[im.name for im in bpy.data.images if im.packed_file]
assert packed_images,'No packed surface texture'
result['checks']={'assembly_resets':True,'camera_cuts':True,'finite_transforms':True,'texture_packed':packed_images,'font_packed':any(f.packed_file for f in bpy.data.fonts if hasattr(f,'packed_file'))}
(ROOT/'检查'/'assembly.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('ASSEMBLY_CHECK_PASSED')
