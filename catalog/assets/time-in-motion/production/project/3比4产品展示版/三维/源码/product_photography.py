"""Deterministic product photography using the intact approved pocketwatch.

No geometry replacement, tool insertion, exploded parts, or hidden mechanism.
The original materials, staff locations, bridge and hand visibility are retained.
"""
from pathlib import Path
import argparse, json, math, sys, time, hashlib
sys.dont_write_bytecode=True
import bpy
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parents[1]
SOURCE = PROJECT / '修订版/4K双版本/模型/竖屏/assembly.blend'
sys.path.insert(0, str(PROJECT / '修订版/性能研究'))
from profiles import apply

def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.partial')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    temp.replace(path)

def smooth(t):
    t = max(0., min(1., t))
    return t*t*t*(t*(t*6.-15.)+10.)

def mix(a, b, t):
    return tuple(x*(1-t)+y*t for x,y in zip(a,b))

def aim(obj, target):
    v = (Vector(target)-obj.location).normalized()
    right = v.cross(Vector((0,1,0))).normalized()
    up = right.cross(v).normalized()
    obj.rotation_euler = Matrix((right, up, -v)).transposed().to_euler()

def load():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    scene.frame_set(253)
    bpy.context.view_layer.update()
    # Freeze the fully assembled pose before removing the old animation.
    for obj in scene.objects:
        obj.animation_data_clear()
        if obj.type in {'LIGHT', 'CAMERA'}:
            obj.data.animation_data_clear()
        if obj.type=='MESH' and obj.data.shape_keys:
            obj.data.shape_keys.animation_data_clear()
    scene.animation_data_clear()
    scene.world.animation_data_clear()
    scene.world.node_tree.animation_data_clear()
    root = bpy.data.objects['TIME / fully modelled skeleton pocket watch']
    all_parts = [o for o in root.children_recursive if o.type in {'MESH','CURVE','FONT'}]
    baseline = {o.name: {'hide':o.hide_render,'location':list(o.location),
                         'materials':[m.name if m else None for m in o.data.materials]}
                for o in all_parts}
    return scene, root, baseline

def budget(scene, width=1080, samples=24):
    apply(scene, 'balanced')
    scene.render.resolution_x = width
    scene.render.resolution_y = width*4//3
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 6
    scene.cycles.samples = samples
    scene.render.use_motion_blur = False
    scene.render.dither_intensity = 0
    scene.camera.data.sensor_fit='HORIZONTAL'
    scene.camera.data.sensor_width=36
    scene.camera.data.clip_start=.005
    scene.camera.data.clip_end=100
    scene.camera.data.shift_x=scene.camera.data.shift_y=0
    scene.camera.data.dof.use_dof=True
    scene.view_settings.view_transform='AgX'
    scene.view_settings.look='AgX - Medium High Contrast'
    scene.view_settings.exposure=-.38
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGB'

def photograph(scene, shot, u=0.5):
    # Main case, crown, blue hands, bridge and movement all stay present.
    cam=scene.camera
    root=bpy.data.objects['TIME / fully modelled skeleton pocket watch']
    root.rotation_euler=(0,math.radians(-5),math.radians(-7))
    bpy.context.view_layer.update()
    world=scene.world.node_tree.nodes['Background']
    world.inputs[0].default_value=(.10,.12,.16,1)
    world.inputs[1].default_value=.095
    # Keep the original quiet studio base; improve long rim reflections.
    bpy.data.objects['Key / ivory softbox'].data.energy=690
    bpy.data.objects['Right strip / platinum contour'].data.energy=530
    bpy.data.objects['Right strip / platinum contour'].data.size=1.5
    bpy.data.objects['Movement broad fill'].data.energy=75
    bpy.data.objects['Case shoulder strip'].data.energy=690
    if shot=='hero':
        pos=mix((5.4,2.7,15.4),(3.8,2.3,14.7),smooth(u))
        target=(0,.58,.04)
        cam.data.lens=82
        cam.data.dof.aperture_fstop=12
    elif shot=='balance':
        # A true macro on the visible lower-left oscillator, never below bridges.
        local_target=Vector((-1.24,-1.02,.22))
        target=root.matrix_world @ local_target
        offset=Vector(mix((-1.20,-1.15,4.15),(-.75,-1.0,4.05),smooth(u)))
        pos=target+offset
        cam.data.lens=82
        cam.data.dof.aperture_fstop=6.3
        bpy.data.objects['Low reflection card'].data.energy=145
        bpy.data.objects['Movement broad fill'].data.energy=155
    elif shot=='edge':
        target=root.matrix_world @ Vector((1.68,.36,.12))
        pos=target+Vector((4.7,1.15,3.45))
        cam.data.lens=100
        cam.data.dof.aperture_fstop=6.3
    else: raise ValueError(shot)
    cam.location=pos
    aim(cam,target)
    cam.data.dof.focus_object.location=target
    bpy.context.view_layer.update()
    return {'position':list(cam.location),'target':list(target),
            'lens':cam.data.lens,'fstop':cam.data.dof.aperture_fstop,
            'rootRotation':list(root.rotation_euler)}

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--shots',default='hero,balance')
    p.add_argument('--width',type=int,default=1080)
    p.add_argument('--samples',type=int,default=24)
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
    report={'source':str(SOURCE),'sourceFrame':253,
            'sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            'blender':bpy.app.version_string,
            'officialReferences':[
                'https://docs.staging.blender.org/manual/en/latest/render/cycles/render_settings/sampling.html',
                'https://developer.blender.org/docs/release_notes/4.1/cycles/',
                'https://www.openimagedenoise.org/documentation.html'],
            'shots':[]}
    previous=ROOT/'审核/摄影实测.json'
    if previous.exists():
        prior=json.loads(previous.read_text())
        if prior.get('sourceSHA256')==report['sourceSHA256']:
            report['shots']=prior.get('shots',[])
    scene,root,baseline=load()
    budget(scene,args.width,args.samples)
    report['settings']={'engine':scene.render.engine,'device':scene.cycles.device,
        'samples':scene.cycles.samples,'minSamples':scene.cycles.adaptive_min_samples,
        'threshold':scene.cycles.adaptive_threshold,'denoiser':scene.cycles.denoiser,
        'denoisingUseGPU':scene.cycles.denoising_use_gpu,
        'dimensions':[scene.render.resolution_x,scene.render.resolution_y]}
    for shot in args.shots.split(','):
        pose=photograph(scene,shot)
        scene.render.filepath=str(ROOT/'关键帧'/f'{shot}-1080.png')
        start=time.monotonic()
        bpy.ops.render.render(write_still=True)
        seconds=time.monotonic()-start
        item={'shot':shot,'path':scene.render.filepath,'seconds':seconds,'camera':pose,
              'geometryKept':True,'visibilityChanges':[o.name for o in root.children_recursive
                 if o.name in baseline and o.hide_render!=baseline[o.name]['hide']]}
        report['shots']=[x for x in report['shots'] if x['shot']!=shot]+[item]
        write_json(ROOT/'审核/摄影实测.json',report)
        bpy.context.preferences.filepaths.save_version=0
        bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'模型'/f'{shot}.blend'))
        print('PRODUCT_FRAME '+json.dumps(item,ensure_ascii=False),flush=True)
    write_json(ROOT/'审核/原模型构成.json',baseline)

if __name__=='__main__':main()
