"""Read-only second pass: mesh/material identity, seated end state and flash registration."""
from pathlib import Path
import bpy,json,hashlib,numpy as np
from mathutils import Vector
OUT=Path(__file__).resolve().parents[1];PROJECT=OUT.parents[2]
NEW=OUT/'模型/wide-inventory.blend';OLD=PROJECT/'竖屏金属闪回版/三维/模型/opening.blend'
def signature(obj):
    vertices=np.empty(len(obj.data.vertices)*3,dtype=np.float32);obj.data.vertices.foreach_get('co',vertices)
    return dict(vertices=len(obj.data.vertices),polygons=len(obj.data.polygons),vertexSHA256=hashlib.sha256(vertices.tobytes()).hexdigest(),materials=[m.name if m else None for m in obj.data.materials],hidden=obj.hide_render)
bpy.ops.wm.open_mainfile(filepath=str(NEW));s=bpy.context.scene;units=json.loads(s['wideUnitManifest']);names=[n for u in units for n in u['frozenObjects']]
s.frame_set(143);bpy.context.view_layer.update();new={n:dict(signature=signature(s.objects[n]),matrix=np.asarray(s.objects[n].matrix_world).copy()) for n in names}
root=s.objects['MT / shared product root'];normal=np.asarray(root.matrix_world.to_3x3()@Vector((0,0,.2)))
fasteners=set(next(u['frozenObjects'] for u in units if u['key']=='fastener_2'))
s.frame_set(0);bpy.context.view_layer.update();first_cam=np.asarray(s.camera.matrix_world).copy();first_objects={n:np.asarray(s.objects[n].matrix_world).copy() for n in names}
flash=[]
for f in [8,9,18,19]:
    s.frame_set(f);bpy.context.view_layer.update()
    flash.append(dict(frame=f,cameraMatrixMaxDelta=float(np.max(np.abs(np.asarray(s.camera.matrix_world)-first_cam))),objectMatrixMaxDelta=max(float(np.max(np.abs(np.asarray(s.objects[n].matrix_world)-first_objects[n]))) for n in names)))
bpy.ops.wm.open_mainfile(filepath=str(OLD));s=bpy.context.scene;s.frame_set(155);bpy.context.view_layer.update()
changed=[];matrix_errors=[]
for n in names:
    old=s.objects[n]
    if signature(old)!=new[n]['signature']:changed.append(n)
    expected=np.asarray(old.matrix_world).copy()
    if n in fasteners:expected[:3,3]-=normal
    matrix_errors.append(float(np.max(np.abs(expected-new[n]['matrix']))))
report=dict(geometryObjects=len(names),units=len(units),meshOrMaterialOrVisibilityChanges=changed,maximumEndpointMatrixError=max(matrix_errors),seatedFastener2Correction=[float(x) for x in normal],flashMatrices=flash,source=str(OLD),sourceSHA256=hashlib.sha256(OLD.read_bytes()).hexdigest(),newScene=str(NEW),newSceneSHA256=hashlib.sha256(NEW.read_bytes()).hexdigest(),readOnly=True)
assert not changed,changed
assert max(matrix_errors)<2e-5,max(matrix_errors)
assert all(x['cameraMatrixMaxDelta']<1e-8 and x['objectMatrixMaxDelta']<1e-8 for x in flash),flash
report['passed']=True
(OUT/'几何二次复核.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('GEOMETRY_VERIFIED',json.dumps(report,ensure_ascii=False),flush=True)
