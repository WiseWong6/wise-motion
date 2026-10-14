"""Two intact watch cutouts from the saved scene; no model/material edits."""
from pathlib import Path
import bpy,json,hashlib,math,time,sys
from mathutils import Vector,Matrix
from bpy_extras.object_utils import world_to_camera_view
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parents[1]
MODEL=ROOT/'3比4产品展示版/三维/模型/product-film.blend'

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def aim(ob,target):
    forward=(Vector(target)-ob.location).normalized()
    right=forward.cross(Vector((0,1,0))).normalized()
    up=right.cross(forward).normalized()
    ob.rotation_euler=Matrix((right,up,-forward)).transposed().to_euler()

def main():
    digest=sha(MODEL)
    bpy.ops.wm.open_mainfile(filepath=str(MODEL))
    scene=bpy.context.scene
    scene.frame_set(648);bpy.context.view_layer.update()
    root=bpy.data.objects['TIME / fully modelled skeleton pocket watch']
    parts=[o for o in root.children_recursive if o.type in {'MESH','CURVE','FONT'}]
    baseline={o.name:{'hide':o.hide_render,'materials':[m.name if m else None for m in o.data.materials]} for o in parts}
    scene.camera.animation_data_clear();scene.camera.data.animation_data_clear()
    scene.camera.data.dof.focus_object.animation_data_clear()
    floor=bpy.data.objects['Seamless charcoal studio'];floor.hide_render=True
    scene.render.film_transparent=True
    scene.render.engine='CYCLES'
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='METAL';prefs.get_devices()
    devices=[d for d in prefs.devices if d.type=='METAL']
    if not devices: raise RuntimeError('Metal GPU is required; no silent CPU fallback')
    for d in prefs.devices:d.use=d.type=='METAL'
    scene.cycles.device='GPU';scene.cycles.samples=24
    scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_min_samples=8;scene.cycles.adaptive_threshold=.05
    scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE'
    scene.cycles.denoising_use_gpu=True;scene.cycles.denoising_quality='HIGH'
    scene.cycles.denoising_prefilter='ACCURATE';scene.cycles.denoising_input_passes='RGB_ALBEDO_NORMAL'
    scene.cycles.seed=41;scene.cycles.use_animated_seed=False
    scene.render.use_persistent_data=True;scene.render.threads_mode='FIXED';scene.render.threads=6
    scene.render.resolution_x=1800;scene.render.resolution_y=2400;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
    scene.render.image_settings.color_depth='8';scene.render.image_settings.compression=25
    scene.render.use_motion_blur=False;scene.render.dither_intensity=0
    scene.camera.data.sensor_fit='HORIZONTAL';scene.camera.data.sensor_width=36
    scene.camera.data.shift_x=scene.camera.data.shift_y=0
    scene.camera.data.lens=82;scene.camera.data.dof.use_dof=True;scene.camera.data.dof.aperture_fstop=13
    target=Vector((0,.58,.04))
    scene.camera.data.dof.focus_object.location=target
    dg=bpy.context.evaluated_depsgraph_get()
    points=[]
    for obj in parts:
        if obj.hide_render:continue
        evaluated=obj.evaluated_get(dg)
        points.extend(evaluated.matrix_world@Vector(corner) for corner in evaluated.bound_box)
    record={'model':str(MODEL),'modelSHA256':digest,'sourceFrame':648,'blender':bpy.app.version_string,'format':[1800,2400],'alpha':'Blender film_transparent RGBA, no chroma key or AI cutout','hiddenNonProductObjects':[floor.name],'originalPartsUnchanged':True,'samples':24,'minSamples':8,'device':[d.name for d in devices],'denoiser':'GPU OIDN HIGH','views':[]}
    for name,pos in [('整表-正三分之四',(4.6,2.5,15.05)),('整表-斜三分之四',(9.2,3.05,13.8))]:
        cam=scene.camera;cam.location=Vector(pos)
        for attempt in range(30):
            aim(cam,target);bpy.context.view_layer.update()
            projected=[world_to_camera_view(scene,cam,p) for p in points]
            bounds=[min(p.x for p in projected),min(p.y for p in projected),max(p.x for p in projected),max(p.y for p in projected)]
            if min(bounds[0],bounds[1])>=.055 and max(bounds[2],bounds[3])<=.945:break
            cam.location=target+(cam.location-target)*1.018
        else: raise RuntimeError('Could not fit complete product including bow')
        file=OUT/(name+'.png');scene.render.filepath=str(file)
        started=time.monotonic();bpy.ops.render.render(write_still=True);elapsed=time.monotonic()-started
        changed=[o.name for o in parts if {'hide':o.hide_render,'materials':[m.name if m else None for m in o.data.materials]}!=baseline[o.name]]
        if changed:raise RuntimeError('Product visibility/materials changed: '+str(changed))
        record['views'].append({'id':name,'path':str(file),'sha256':sha(file),'bytes':file.stat().st_size,'seconds':elapsed,'camera':{'position':list(cam.location),'target':list(target),'lens':cam.data.lens,'fstop':cam.data.dof.aperture_fstop},'productBoundsNormalized':bounds,'viewTransform':scene.view_settings.view_transform,'look':scene.view_settings.look,'exposure':scene.view_settings.exposure,'visibilityOrMaterialChanges':changed})
        (OUT/'透明整表渲染.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
        print('CUTOUT_RENDERED '+json.dumps(record['views'][-1],ensure_ascii=False),flush=True)
    assert sha(MODEL)==digest
    print('CUTOUTS_READY',flush=True)

if __name__=='__main__':main()
