"""Native 24 fps Cycles/Metal product photography; deterministic frame poses."""
from pathlib import Path
import argparse,sys,math,json,time,bpy
from mathutils import Vector,Matrix
from bpy_extras.object_utils import world_to_camera_view
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'源码'))
from geometry import _empty,_ring,_disc,_poly
from mechanics import state,smooth,camera_path,layer_offsets,AXES
COUNTS={'opening':84,'screw':96,'train':48,'balance':54,'barrel':30,'components':60,'assembly':348}
START={'opening':0,'screw':84,'train':180,'balance':228,'barrel':282,'components':312,'assembly':372}

def aim(ob,target):
    v=(Vector(target)-ob.location).normalized();right=v.cross(Vector((0,1,0))).normalized()
    up=right.cross(v).normalized();ob.rotation_euler=Matrix((right,up,-v)).transposed().to_euler()

def camera(s,pos,target,lens=70,fstop=8):
    d=bpy.data.cameras.new('Revision optical camera');d.lens=lens;d.sensor_width=36;d.clip_start=.005;d.clip_end=300
    ob=bpy.data.objects.new('Revision optical camera',d);bpy.context.collection.objects.link(ob)
    focus=_empty('Revision optical focus',None);focus.location=target
    d.dof.use_dof=True;d.dof.focus_object=focus;d.dof.aperture_fstop=fstop;d.dof.aperture_blades=9
    ob.location=pos;aim(ob,target);s.camera=ob;return ob,focus

def material(name,color,rough=.5,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    return m

def light(name,pos,energy,size,color,target=(0,0,0),ratio=1):
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='RECTANGLE';d.size=size;d.size_y=size*ratio;d.color=color
    ob=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(ob);ob.location=pos;aim(ob,target);return ob

def group(s,key):return bpy.data.objects[json.loads(root['REV groups'])[key]]

def spring_keys():
    o=bpy.data.objects['Blued overcoil hairspring']
    # Curves become a real mesh with flexible shape keys. The outer stud stays
    # fixed; the inner attachment follows the balance. No spinning spiral decal.
    for ob in bpy.context.selected_objects:ob.select_set(False)
    o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    o=bpy.context.object;base=o.shape_key_add(name='Fixed outer stud')
    # Adjacent angular samples keep the inner collet radius within 0.32%.
    # Blending only +/-145-degree extremes would collapse it along a chord.
    for step in range(33):
        angle=-145+290*step/32
        key=o.shape_key_add(name='Elastic twist '+str(angle))
        for v,k in zip(base.data,key.data):
            r=math.hypot(v.co.x,v.co.y);u=max(0,min(1,(r-.115)/.521))
            a=math.radians(angle)*(1-u)**2;c,ss=math.cos(a),math.sin(a)
            k.co=(v.co.x*c-v.co.y*ss,v.co.x*ss+v.co.y*c,v.co.z)
    return o

def tick(frame,t):
    q=state(t)
    for name,theta in q['angles'].items():
        o=bpy.data.objects['REV staff '+name];o.rotation_euler.z=theta;o.keyframe_insert('rotation_euler',frame=frame)
    bal=bpy.data.objects['Balance oscillation pivot'];bal.rotation_euler.z=q['balance'];bal.keyframe_insert('rotation_euler',frame=frame)
    fork=bpy.data.objects['REV pallet pivot'];fork.rotation_euler.z=q['fork'];fork.keyframe_insert('rotation_euler',frame=frame)
    relay=bpy.data.objects['REV seconds relay'];relay.rotation_euler.z=q['angles']['fourth'];relay.keyframe_insert('rotation_euler',frame=frame)
    idler=bpy.data.objects['REV seconds idler'];idler.rotation_euler.z=-q['angles']['fourth'];idler.keyframe_insert('rotation_euler',frame=frame)
    motion=bpy.data.objects['REV motion works'];motion.rotation_euler.z=q['hour'];motion.keyframe_insert('rotation_euler',frame=frame)
    for name,theta,offset in [('Hour · pierced blue leaf',q['hour'],math.radians(55)),('Minute · pierced blue leaf',q['minute'],math.radians(-60))]:
        o=bpy.data.objects[name];o.rotation_euler.z=offset+theta;o.keyframe_insert('rotation_euler',frame=frame)
    o=bpy.data.objects['Subsidiary seconds / continuous sweep'];o.rotation_euler.z=q['seconds'];o.keyframe_insert('rotation_euler',frame=frame)
    value=(q['balance']/math.radians(145)+1)*16
    lo=min(32,max(0,math.floor(value)));hi=min(32,lo+1);weight=value-lo
    for i in range(33):
        v=(1-weight if i==lo else 0)+(weight if i==hi else 0)
        k=flex.data.shape_keys.key_blocks[i+1];k.value=v;k.keyframe_insert('value',frame=frame)

def pose(cam,focus,frame,pos,target,fstop=None):
    cam.location=pos;aim(cam,target);focus.location=target
    for ob,paths in [(cam,['location','rotation_euler']),(focus,['location'])]:
        for p in paths:ob.keyframe_insert(p,frame=frame)
    if fstop:cam.data.dof.aperture_fstop=fstop;cam.data.dof.keyframe_insert('aperture_fstop',frame=frame)

def opening(s):
    cam,focus=camera(s,(7.,4.,29),(-.2,.65,0),70,12)
    data=[]
    for frame in range(1,85):
        t=(frame-1)/24;u=smooth(t/1.45);v=smooth((t-1.55)/1.9)
        root.rotation_euler=(math.radians(2),math.radians(-12+15*u),math.radians(-4+3*u));root.keyframe_insert('rotation_euler',frame=frame)
        p=(7-6.95*v,4-2.15*v,29-25.55*v);target=(-.2-.51*v,.65+.37*v,.13*v)
        pose(cam,focus,frame,p,target,12-8.8*v);tick(frame,t)
        s.frame_set(frame);bpy.context.view_layer.update()
        nodes=[]
        for axis in ['barrel','center','third','fourth','escape']:
            pt=world_to_camera_view(s,cam,bpy.data.objects['REV staff '+axis].matrix_world.translation)
            nodes.append([float(pt.x*1920),float((1-pt.y)*1080)])
        data.append(nodes)
    (R/'public/素材/图谱投影.json').write_text(json.dumps(data))
    return cam

def macro(s,kind):
    if kind=='train':
        for ob in group(s,'bridges').children_recursive:ob.hide_render=True
        for ob in group(s,'hands').children_recursive:ob.hide_render=True
        for ob in group(s,'chapter').children_recursive:ob.hide_render=True
        for ob in group(s,'oscillator').children_recursive:ob.hide_render=True
        for name in ['REV 15-tooth escape wheel','REV escape relief']:
            bpy.data.objects[name].hide_render=True
        cam,focus=camera(s,(1.00,-1.92,2.45),(.44,-1.42,.12),83,4)
        for f in range(1,49):
            u=smooth((f-1)/47);pose(cam,focus,f,(1.00-.22*u,-1.92+.17*u,2.45-.14*u),(.44,-1.42,.12),4)
            tick(f,(180+f-1)/24)
    elif kind=='balance':
        for ob in group(s,'hands').children_recursive:ob.hide_render=True
        # Side orbit exposes the rim height; focus moves from ruby to spring.
        cam,focus=camera(s,(-2.4,-2.5,3.0),(-1.29,-1.05,.195),76,3.8)
        for f in range(1,55):
            u=smooth((f-1)/53);angle=-.55+.38*u
            p=(-1.29+1.9*math.sin(angle),-1.05-1.25*math.cos(angle),3.0-.45*u)
            pose(cam,focus,f,p,(-1.29+.20*u,-1.05+.12*u,.23-.07*u),3.8)
            tick(f,(228+f-1)/24)
    else:
        for ob in group(s,'hands').children_recursive:ob.hide_render=True
        cam,focus=camera(s,(-1.45,1.2,2.75),(-.80,1.06,.14),80,3.2)
        for f in range(1,31):
            u=smooth((f-1)/29);pose(cam,focus,f,(-1.45+.20*u,1.2+.10*u,2.75-.15*u),(-.80,1.06,.14),3.2)
            tick(f,(282+f-1)/24)
    return cam

def components(s):
    # An exploded calibre at its true relative XY positions, supported by a
    # sculpted dark tray. Pieces keep the same scale and have separate Z levels.
    for o in s.objects:
        if o.type=='LIGHT':o.hide_render=True
    bpy.data.objects['Seamless charcoal studio'].hide_render=True
    for name in ['case','crown','bow']:
        o=bpy.data.objects['CASEWORK · '+name]
        for c in [o,*o.children_recursive]:c.hide_render=True
    tablemat=material('Micro-grained graphite ceramic',(.065,.073,.080),.52,.08)
    n=tablemat.node_tree.nodes;l=tablemat.node_tree.links
    tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=140;tex.inputs['Detail'].default_value=3
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.009
    l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],n['Principled BSDF'].inputs['Normal'])
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,-.58));tray=bpy.context.object;tray.name='Revision solid graphite tray'
    tray.scale=(10.6,8.0,.32);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    tray.data.materials.append(tablemat);mod=tray.modifiers.new('Machined tray edge','BEVEL');mod.width=.12;mod.segments=6
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.76));bpy.context.object.name='Revision textured graphite ground';bpy.context.object.data.materials.append(tablemat)
    # Fine perimeter hardware rather than a rectangular inventory grid.
    steel=bpy.data.materials['Mirror polished steel']
    _ring('Revision assembly seat',(0,0),2.46,2.61,-.33,.15,steel,None,.025,192)
    offsets={'base':0,'train':.20,'winding':.45,'oscillator':.90,'bridges':1.65,'chapter':2.32,'hands':2.55}
    light('Components silk key',(-4,5,10),750,7,(1,.92,.81),(0,0,1),.65)
    light('Components cold edge',(6,1,5),450,3,(.77,.87,1),(0,0,1),.30)
    light('Components vertical rim',(-5,-3,4),300,2,(1,.80,.55),(0,0,1),3)
    s.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.19,.23,1)
    s.world.node_tree.nodes['Background'].inputs[1].default_value=.22
    s.view_settings.exposure=-.35
    root.rotation_euler=(0,0,math.radians(-20))
    cam,focus=camera(s,(10.,-10.,21.),(-1.4,.8,.8),60,8)
    for f in range(1,61):
        u=smooth((f-1)/59)
        for i,(k,delta) in enumerate(offsets.items()):
            g=group(s,k);g.location.z=delta+.16*(1-smooth((f-1-i*2)/25));g.keyframe_insert('location',frame=f)
        pose(cam,focus,f,(10.-2*u,-10.+1.0*u,21.-.7*u),(-1.4,.8,.95),8)
        tick(f,(312+f-1)/24)
    return cam

def assembly(s):
    cam,focus=camera(s,*camera_path(0),70,13)
    path=[]
    for f in range(1,349):
        t=(f-1)/24;pos,target=camera_path(t);pose(cam,focus,f,pos,target,13)
        for k,z in layer_offsets(t).items():g=group(s,k);g.location.z=z;g.keyframe_insert('location',frame=f)
        # The root turns during the side reveal, then returns continuously.
        u=smooth((t-1.5)/3.5)*(1-smooth((t-5.5)/2.5))
        root.rotation_euler=(0,math.radians(-5+7*u),math.radians(-4));root.keyframe_insert('rotation_euler',frame=f)
        tick(f,(372+f-1)/24)
        path.append(dict(frame=372+f-1,position=pos,target=target,lens=70,layers=layer_offsets(t)))
    (R/'检查/连续镜头轨迹.json').write_text(json.dumps(path,ensure_ascii=False,indent=2))
    return cam

def screw(s):
    # Reuse the already-authored real screw/thread/driver construction, loading
    # it as definitions only. Its old model loader and CLI never execute.
    import screw_geometry as legacy
    def linear(ob):
        a=ob.animation_data.action if ob.animation_data else None
        if not a:return
        curves=getattr(a,'fcurves',None)
        if curves is None:
            curves=[fc for layer in a.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]
        for fc in curves:
            for pt in fc.keyframe_points:pt.interpolation='LINEAR'
    legacy.linear_keys=linear;legacy.screw(s)
    for f in range(1,97):tick(f,(84+f-1)/24)
    return s.camera

def main():
    global root,flex
    parser=argparse.ArgumentParser();parser.add_argument('--shot',choices=COUNTS,required=True)
    parser.add_argument('--frames');parser.add_argument('--preview',action='store_true');parser.add_argument('--build-only',action='store_true')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    bpy.ops.wm.open_mainfile(filepath=str(R/'模型/机械怀表-修订.blend'))
    s=bpy.context.scene;root=bpy.data.objects['TIME / fully modelled skeleton pocket watch']
    flex=spring_keys()
    cam=globals()[args.shot](s) if args.shot in ['opening','screw','components','assembly'] else macro(s,args.shot)
    s.frame_start=1;s.frame_end=COUNTS[args.shot];s.render.resolution_percentage=50 if args.preview else 100
    s.cycles.samples=24 if args.preview else 48;s.cycles.adaptive_threshold=.08 if args.preview else .045
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='METAL'
    s.cycles.device='GPU';s.render.use_persistent_data=True
    directory=R/'.制作缓存/三维'/args.shot;directory.mkdir(parents=True,exist_ok=True)
    if not args.preview:
        bpy.context.preferences.filepaths.save_version=0;s.frame_set(1)
        bpy.ops.wm.save_as_mainfile(filepath=str(R/'模型'/(args.shot+'.blend')))
    if not args.build_only:
        frames=[int(x) for x in args.frames.split(',')] if args.frames else range(1,s.frame_end+1)
        for f in frames:
            out=directory/(('preview_' if args.preview else 'frame_')+str(f).zfill(4)+'.png')
            if out.exists() and not args.preview:continue
            s.frame_set(f);s.render.filepath=str(out);begin=time.monotonic();bpy.ops.render.render(write_still=True)
            print(f'PHOTOGRAPHY {args.shot} {f}/{s.frame_end} {time.monotonic()-begin:.2f}s',flush=True)
    print('SHOT_FINISHED '+args.shot,flush=True)

if __name__=="__main__":main()
