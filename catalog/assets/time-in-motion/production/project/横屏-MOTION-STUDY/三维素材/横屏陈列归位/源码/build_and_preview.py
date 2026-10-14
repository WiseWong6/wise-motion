"""A wide, registered inventory-to-assembly shot from the accepted real geometry.

No product mesh or material is edited. Source scenes remain read-only.
"""
from pathlib import Path
import argparse, hashlib, json, math, sys, time
import bpy
import numpy as np
from mathutils import Vector, Matrix

sys.dont_write_bytecode = True
OUT = Path(__file__).resolve().parents[1]
PROJECT = OUT.parents[2]
SOURCE = PROJECT / '竖屏金属闪回版/三维/模型/opening.blend'
MANIFEST = PROJECT / '竖屏金属闪回版/三维/数据/零件与陈列.json'
sys.path.insert(0, str(PROJECT / '修订版/性能研究'))
from profiles import apply

def smooth(x):
    x = max(0., min(1., x))
    return x*x*x*(10+x*(-15+6*x))

def mix(a,b,u):
    return np.asarray(a)*(1-u)+np.asarray(b)*u

def aim(camera, target):
    forward = (Vector(target)-camera.location).normalized()
    right = forward.cross(Vector((0,1,0))).normalized()
    up = right.cross(forward).normalized()
    camera.rotation_euler = Matrix((right,up,-forward)).transposed().to_euler()

def linear(ob):
    act = ob.animation_data.action if ob.animation_data else None
    if act:
        for layer in act.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:
                            key.interpolation='LINEAR'

def bounds(scene, objects):
    points = np.vstack([np.asarray(o.bound_box)@np.asarray(o.matrix_world)[:3,:3].T+np.asarray(o.matrix_world)[:3,3] for o in objects])
    projection=np.asarray(scene.camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(), x=scene.render.resolution_x,y=scene.render.resolution_y,scale_x=1,scale_y=1))
    clip=(projection@np.linalg.inv(np.asarray(scene.camera.matrix_world))@np.column_stack((points,np.ones(len(points)))).T).T
    xy=(clip[:,:2]/clip[:,3,None]+1)/2
    return [*xy.min(axis=0).tolist(),*xy.max(axis=0).tolist()]

def row_layout(keys, cx, cy, lookup, gap=.38):
    width=sum(lookup[k]['displaySize'][0] for k in keys)+gap*(len(keys)-1)
    x=cx-width/2
    for key in keys:
        w=lookup[key]['displaySize'][0]
        lookup[key]['wideCenter']=[x+w/2,cy]
        x+=w+gap

def create_light(scene,name,location,energy,size,ratio,color):
    data=bpy.data.lights.new(name,'AREA');data.shape='RECTANGLE'
    data.energy=energy;data.size=size;data.size_y=size*ratio;data.color=color
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj)
    obj.location=location;aim(obj,(0,0,0));return obj

def build():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene=bpy.context.scene;scene.frame_set(155);bpy.context.view_layer.update()
    units=json.loads(MANIFEST.read_text())['units'];lookup={u['key']:u for u in units}
    objects=[scene.objects[n] for u in units for n in u['frozenObjects']]
    original_materials={o.name:[m.name if m else None for m in o.data.materials] for o in objects}
    root=scene.objects['MT / shared product root'];end_rotation=list(root.rotation_euler)
    camera=scene.camera;focus=camera.data.dof.focus_object
    for obj in scene.objects:
        obj.animation_data_clear()
        if obj.type in {'CAMERA','LIGHT'}:obj.data.animation_data_clear()
    scene.animation_data_clear();scene.world.animation_data_clear();scene.world.node_tree.animation_data_clear()
    scene.render.use_compositing=False
    for obj in list(scene.objects):
        if obj.type=='LIGHT' or obj.name in {'MT / charcoal contact stage','MT / accepted studio','Seamless charcoal studio'}:
            bpy.data.objects.remove(obj,do_unlink=True)
    floor_mat=bpy.data.materials.new('WIDE / quiet charcoal stage');floor_mat.use_nodes=True
    bsdf=floor_mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value=(.005,.006,.008,1)
    bsdf.inputs['Roughness'].default_value=.58;bsdf.inputs['Metallic'].default_value=.08
    bpy.ops.mesh.primitive_plane_add(size=180,location=(0,0,-.625))
    floor=bpy.context.object;floor.name='WIDE / nonproduct studio';floor.data.materials.append(floor_mat)
    lights=[]
    for spec in [
        ('WIDE / long silver',(-9,-3,16),1550,14,.18,(1,.95,.87)),
        ('WIDE / cool outline',(10,6,13),1350,12,.13,(.79,.89,1)),
        ('WIDE / amber',(-7,8,8),650,7,.15,(1,.80,.52)),
        ('WIDE / broad soft',(0,0,18),420,17,.5,(.90,.96,1)),
        ('WIDE / lower graze',(6,-9,8),450,8,.17,(.67,.82,1))]:
        lights.append(create_light(scene,*spec))
    bg=scene.world.node_tree.nodes['Background'];bg.inputs[0].default_value=(.04,.049,.062,1);bg.inputs[1].default_value=.075
    scene.view_settings.view_transform='AgX';scene.view_settings.exposure=-.15
    positions={'chassis':(-6.3,.3),'face':(.1,.9),'barrel':(4.4,3.1),'center':(7,3.1),'third':(9.6,3.1),'fourth':(4.4,.3),'balance':(7,.3),'seconds_train':(9.6,.3),'hands':(-1.15,-3.5)}
    for key,xy in positions.items():lookup[key]['wideCenter']=xy
    row_layout(['barrel_bridge','winding_bridge','train_bridge','center_bridge','escape_bridge','balance_bridge','pallet_bridge'],6.65,-2.5,lookup,.32)
    row_layout(['escape','motion','pallet','click','keyless','seconds_hand','fastener_2'],6.65,-4.55,lookup,.38)
    footprints=[]
    for u in units:
        cx,cy=u['wideCenter'];w,h=u['displaySize'];bb=u['displayBounds']
        u['wideInitial']=[cx-(bb[0][0]+bb[1][0])/2,cy-(bb[0][1]+bb[1][1])/2,-.57-u['trueBounds'][0][2]]
        footprints.append([u['key'],cx-w/2,cy-h/2,cx+w/2,cy+h/2])
    overlaps=[]
    for i,a in enumerate(footprints):
        for b in footprints[i+1:]:
            if min(a[3],b[3])-max(a[1],b[1])>1e-5 and min(a[4],b[4])-max(a[2],b[2])>1e-5:overlaps.append([a[0],b[0]])
    assert not overlaps, overlaps
    # Chassis first, train and oscillator next, bridges, chapter and hands last.
    timings={'chassis':(26,63),'face':(94,126),'barrel':(41,73),'center':(44,77),'third':(47,81),'fourth':(50,85),'escape':(53,87),'balance':(56,89),'seconds_train':(48,83),'motion':(37,69),'pallet':(55,89),'click':(54,87),'keyless':(57,90),'hands':(105,132),'seconds_hand':(104,129),'fastener_2':(89,111)}
    for i,key in enumerate(['barrel_bridge','winding_bridge','train_bridge','center_bridge','escape_bridge','balance_bridge','pallet_bridge']):timings[key]=(70+i*3,99+i*2)
    apply(scene,'balanced');scene.render.resolution_x=960;scene.render.resolution_y=540;scene.render.resolution_percentage=100
    scene.render.fps=24;scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=False
    scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.use_motion_blur=False;scene.render.dither_intensity=0
    camera.data.sensor_fit='HORIZONTAL';camera.data.sensor_width=36;camera.data.shift_x=camera.data.shift_y=0
    camera.data.clip_end=500;camera.data.dof.use_dof=True;camera.data.dof.aperture_fstop=16
    rig=[]
    for f in range(144):
        root.rotation_euler=[v*smooth((f-105)/34) for v in end_rotation];root.keyframe_insert('rotation_euler',frame=f)
        for u in units:
            start,end=timings[u['key']];v=smooth((f-start)/(end-start));b=[*u['endpointCenter'][:2],0]
            loc=mix(u['wideInitial'],b,v);loc[2]+=(.40+.06*(u['index']%4))*math.sin(math.pi*v)
            obj=scene.objects[u['unitObject']];obj.location=loc;obj.rotation_euler=(0,.08*math.sin(math.pi*v),u['initialRotationZ']*(1-v))
            obj.keyframe_insert('location',frame=f);obj.keyframe_insert('rotation_euler',frame=f)
        transition=smooth((f-41)/99)
        target=mix((.55,-.6,0),(-.1,.65,.1),transition)
        position=mix((.55,-.6,62),(7,3.8,31.0),transition)
        camera.location=position;aim(camera,target);focus.location=target
        camera.data.lens=90*(1-transition)+70*transition
        camera.data.dof.aperture_fstop=16-3*transition
        for obj,attrs in [(camera,['location','rotation_euler']),(focus,['location']),(camera.data,['lens','dof.aperture_fstop'])]:
            for attr in attrs:obj.keyframe_insert(attr,frame=f)
        scene.frame_set(f);bpy.context.view_layer.update();required=0.
        for _ in range(100):
            box=bounds(scene,objects)
            if box[0]>=.07 and box[1]>=.07 and box[2]<=.93 and box[3]<=.93:break
            camera.location=Vector(target)+(camera.location-Vector(target))*1.01;bpy.context.view_layer.update()
        else:raise RuntimeError(('Cannot fit geometry',f,box))
        required=float(np.linalg.norm(np.asarray(camera.location)-target)-np.linalg.norm(position-target))
        rig.append(dict(frame=f,target=target.tolist(),desired=position.tolist(),lens=camera.data.lens,extra=required))
    # A smooth safety envelope avoids camera pumping when different parts cross.
    need=np.asarray([r['extra'] for r in rig]);rad=8
    padded=np.pad(need,(rad,rad),mode='edge');dilated=np.array([padded[i:i+2*rad+1].max() for i in range(144)])
    kernel=np.exp(-np.arange(-rad,rad+1,dtype=float)**2/(2*3**2));kernel/=kernel.sum()
    envelope=np.convolve(np.pad(dilated,(rad,rad),mode='edge'),kernel,mode='valid')
    for r,extra in zip(rig,envelope):
        f=r['frame'];scene.frame_set(f);target=np.asarray(r['target']);desired=np.asarray(r['desired']);v=desired-target
        camera.location=target+v/np.linalg.norm(v)*(np.linalg.norm(v)+extra+.01);aim(camera,target)
        camera.keyframe_insert('location',frame=f);camera.keyframe_insert('rotation_euler',frame=f)
        bpy.context.view_layer.update();box=bounds(scene,objects);assert min(box[:2])>=.068 and max(box[2:])<=.932,(f,box)
        r.update(camera=list(camera.location),bounds=box,safeEnvelopeExtra=float(extra))
    for obj in [root,camera,camera.data,focus,*[scene.objects[u['unitObject']] for u in units]]:linear(obj)
    assert all(original_materials[o.name]==[m.name if m else None for m in o.data.materials] for o in objects)
    scene['wideUnitManifest']=json.dumps(units,ensure_ascii=False);scene['wideProductObjects']=json.dumps([o.name for o in objects]);scene['sourceGeometrySHA']=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    scene.frame_start=0;scene.frame_end=143;scene.frame_set(0)
    (OUT/'模型').mkdir(exist_ok=True);bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'模型/wide-inventory.blend'))
    record=dict(source=str(SOURCE),sourceSHA256=scene['sourceGeometrySHA'],frames=144,fps=24,preview=[960,540],units=units,geometryObjectCount=len(objects),footprintOverlap=overlaps,productMaterialsUnchanged=True,geometryUnchanged=True,fastener2='Seated to original assembly local Z=0 by the end; source display hold used +0.20 loose lift.',rig=rig)
    (OUT/'构图与对应.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    return scene

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--frames',default='0,36,72,108,143');parser.add_argument('--reuse',action='store_true');parser.add_argument('--width',type=int,default=960)
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    if args.reuse:
        bpy.ops.wm.open_mainfile(filepath=str(OUT/'模型/wide-inventory.blend'));scene=bpy.context.scene;apply(scene,'balanced')
    else:scene=build()
    scene.render.resolution_x=args.width;scene.render.resolution_y=args.width*9//16;scene.render.resolution_percentage=100
    fingerprint=hashlib.sha256((hashlib.sha256((OUT/'模型/wide-inventory.blend').read_bytes()).hexdigest()+str(args.width)).encode()).hexdigest()[:12]
    folder=OUT/'缓存'/f'{args.width}-{fingerprint}';folder.mkdir(parents=True,exist_ok=True)
    (OUT/('当前预览缓存.json' if args.width==960 else '当前正式缓存.json')).write_text(json.dumps(dict(path=str(folder),fingerprint=fingerprint,width=args.width,height=args.width*9//16,frames=144),ensure_ascii=False,indent=2))
    timings=json.loads((folder/'耗时.json').read_text()) if (folder/'耗时.json').exists() else []
    for f in map(int,args.frames.split(',')):
        file=folder/f'F{f:04d}.png'
        if file.exists():continue
        scene.frame_set(f);scene.render.filepath=str(file);start=time.monotonic();bpy.ops.render.render(write_still=True)
        rec=dict(frame=f,seconds=time.monotonic()-start,path=str(file));timings.append(rec)
        print('WIDE_FRAME '+json.dumps(rec),flush=True)
        (folder/'耗时.json').write_text(json.dumps(timings,ensure_ascii=False,indent=2))
    print('WIDE_READY',flush=True)

if __name__=='__main__':main()
