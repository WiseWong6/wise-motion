"""Editable, fully geometric pocket watch and Cycles product film.
Blender 4.5 LTS. Run with --background --python build.py -- [--preview].
All dimensions are in a consistent studio scale; watch diameter 6 units.
"""
import bpy, math, sys, json, time
from pathlib import Path
from mathutils import Vector, Matrix

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from movement import build_movement
from casework import build_case

def material(name, color, metal=0., rough=.3):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    return m,p

def finishing(m, p, scale=500., strength=.055, distance=.006):
    n=m.node_tree.nodes; l=m.node_tree.links
    tex=n.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value=scale
    tex.inputs['Detail'].default_value=2.; tex.inputs['Roughness'].default_value=.65
    bump=n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=strength
    bump.inputs['Distance'].default_value=distance
    l.new(tex.outputs['Fac'],bump.inputs['Height']); l.new(bump.outputs['Normal'],p.inputs['Normal'])
    return tex

def materials():
    out={}
    specs={
      'gold':('18K pale gold / polished anglage',(.78,.49,.205),1,.20),
      'brass':('Satin champagne wheel brass',(.66,.405,.14),1,.275),
      'silver':('Warm platinum case',(.79,.765,.705),1,.14),
      'polished':('Mirror polished steel',(.73,.77,.80),1,.105),
      'dark':('Recessed anthracite steel',(.034,.037,.041),.85,.32),
      'blue':('Heat-blued steel',(.006,.031,.095),1,.21),
      'ruby':('Synthetic ruby bearing',(.38,.004,.055),.2,.14),
      'enamel':('Ivory fired enamel',(.69,.60,.465),.03,.24),
      'ink':('Fired black dial printing',(.006,.006,.007),.08,.25),
      'bridge':('Rhodium plated Geneva-striped bridges',(.68,.625,.49),1,.31),
      'perlage':('Fine circular-grained nickel silver',(.205,.18,.145),1,.42),
      'glass':('Sapphire crystal',(.96,.975,1),0,.018),
    }
    for k,(name,c,met,rough) in specs.items():
        m,p=material(name,c,met,rough); out[k]=m
        if k in ['gold','brass','silver','polished','blue']:
            p.inputs['Anisotropic'].default_value=.25 if k=='brass' else .12
            if k=='brass': finishing(m,p,680,.035,.003)
        if k=='enamel': p.inputs['Coat Weight'].default_value=.35
        if k=='ruby':
            p.inputs['Transmission Weight'].default_value=.26
            p.inputs['IOR'].default_value=1.76
            p.inputs['Coat Weight'].default_value=.5
        if k=='glass':
            p.inputs['Transmission Weight'].default_value=1
            p.inputs['IOR'].default_value=1.46
        if k=='bridge':
            p.inputs['Anisotropic'].default_value=.48
            n=m.node_tree.nodes; l=m.node_tree.links
            tc=n.new('ShaderNodeTexCoord')
            mapping=n.new('ShaderNodeVectorMath'); mapping.operation='MULTIPLY'
            mapping.inputs[1].default_value=(1,25,1)
            l.new(tc.outputs['Object'],mapping.inputs[0])
            noise=n.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=170
            noise.inputs['Detail'].default_value=2
            l.new(mapping.outputs[0],noise.inputs['Vector'])
            wave=n.new('ShaderNodeTexWave'); wave.wave_type='BANDS'; wave.bands_direction='X'
            wave.inputs['Scale'].default_value=4.2
            wave.inputs['Distortion'].default_value=.12
            l.new(tc.outputs['Object'],wave.inputs['Vector'])
            ramp=n.new('ShaderNodeValToRGB')
            ramp.color_ramp.elements[0].position=.18
            ramp.color_ramp.elements[0].color=(.46,.42,.345,1)
            ramp.color_ramp.elements[1].position=.82
            ramp.color_ramp.elements[1].color=(.59,.55,.46,1)
            l.new(wave.outputs['Color'],ramp.inputs['Fac'])
            l.new(ramp.outputs['Color'],p.inputs['Base Color'])
            rough=n.new('ShaderNodeMapRange'); rough.inputs['To Min'].default_value=.23; rough.inputs['To Max'].default_value=.39
            l.new(wave.outputs['Fac'],rough.inputs['Value']); l.new(rough.outputs[0],p.inputs['Roughness'])
            bump=n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.08; bump.inputs['Distance'].default_value=.003
            l.new(noise.outputs['Fac'],bump.inputs['Height']); l.new(bump.outputs['Normal'],p.inputs['Normal'])
        if k=='perlage':
            n=m.node_tree.nodes;l=m.node_tree.links
            tc=n.new('ShaderNodeTexCoord');tex=n.new('ShaderNodeTexImage')
            tex.image=bpy.data.images.load(str(ROOT/'材质'/'底板珍珠纹.png'))
            tex.image.colorspace_settings.name='Non-Color'
            l.new(tc.outputs['Generated'],tex.inputs['Vector'])
            b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.25;b.inputs['Distance'].default_value=.018
            l.new(tex.outputs['Color'],b.inputs['Height']);l.new(b.outputs['Normal'],p.inputs['Normal'])
            rough=n.new('ShaderNodeMapRange');rough.inputs['To Min'].default_value=.30;rough.inputs['To Max'].default_value=.44
            l.new(tex.outputs['Color'],rough.inputs['Value']);l.new(rough.outputs[0],p.inputs['Roughness'])
    return out

def empty(name,location=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o)
    o.location=location; o.parent=parent; return o

def aim(obj, point):
    forward=(Vector(point)-obj.location).normalized()
    right=forward.cross(Vector((0,1,0))).normalized()
    up=right.cross(forward).normalized()
    obj.rotation_euler=Matrix((right,up,-forward)).transposed().to_euler()

def area(name,pos,power,size,color,target=(0,0,0),ratio=1):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.color=color
    d.shape='RECTANGLE'; d.size=size; d.size_y=size*ratio
    o=bpy.data.objects.new(name,d); bpy.context.collection.objects.link(o);o.location=pos;aim(o,target)
    o.visible_camera=False
    return o

def camera(name,pos,target,lens=70,fstop=8):
    d=bpy.data.cameras.new(name);d.lens=lens;d.sensor_width=36;d.clip_start=.01;d.clip_end=200
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=pos;aim(o,target)
    focus=empty(name+' / focus',target)
    d.dof.use_dof=True;d.dof.focus_object=focus;d.dof.aperture_fstop=fstop;d.dof.aperture_blades=9
    return o,focus

def key(obj,path,frame): obj.keyframe_insert(data_path=path,frame=frame)
def camera_key(c,f,frame,pos,target):
    c.location=pos;aim(c,target);f.location=target
    key(c,'location',frame);key(c,'rotation_euler',frame);key(f,'location',frame)

def setup():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for d in list(bpy.data.materials): bpy.data.materials.remove(d)
    m=materials();root=empty('TIME / fully modelled skeleton pocket watch')
    movement=build_movement(root,m);case=build_case(root,m)
    bpy.data.objects['Fine circular mainplate graining'].hide_render=True
    bpy.data.objects['Shadowed recessed floor'].data.materials[0]=m['perlage']
    root.rotation_euler=(0,math.radians(-5),math.radians(-5))
    # Quiet seamless studio: the surface has body, but no decorative background.
    floor,p=material('Charcoal velvet studio',(.009,.009,.010),.0,.73)
    finishing(floor,p,55,.11,.018)
    profile=[(-3.08,60),(-3.08,-5)]
    for i in range(1,65):
        t=i/64*math.pi/2;profile.append((-3.08+6*(1-math.cos(t)),-5-6*math.sin(t)))
    profile.append((40,-11))
    verts=[(x,y,z) for x in (-100,100) for y,z in profile];nn=len(profile)
    mesh=bpy.data.meshes.new('Continuous studio cyclorama')
    mesh.from_pydata(verts,[],[(i,i+nn,i+1+nn,i+1) for i in range(nn-1)]);mesh.update()
    ground=bpy.data.objects.new('Seamless charcoal studio',mesh);bpy.context.collection.objects.link(ground)
    ground.data.materials.append(floor)
    for poly in mesh.polygons:poly.use_smooth=True
    world=bpy.data.worlds.new('Dark neutral studio');bpy.context.scene.world=world;world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.14,.16,.20,1)
    world.node_tree.nodes['Background'].inputs[1].default_value=.15
    area('Key / ivory softbox',(-6,6,9),760,6.0,(1,.91,.78),ratio=1.45)
    area('Right strip / platinum contour',(6,2,6),560,2.0,(.84,.91,1),ratio=4.5)
    area('Top silk / bevel definition',(0,8,0),760,5.0,(1,.89,.74),ratio=.7)
    area('Low reflection card',(-1,-2.0,6),90,5.0,(1,.93,.83),ratio=.23)
    area('Back edge separation',(-4,2,-5),540,3.0,(.70,.78,1),ratio=2.0)
    area('Movement broad fill',(0,1,10),120,5.5,(1,.98,.90),ratio=.7)
    area('Case shoulder strip',(7,2,-2),640,3.2,(1,.91,.78),ratio=1.1)
    cams=[]
    # Each shot is a true 3D camera move; no enlarged flat artwork is used.
    c,f=camera('01 / hand-finished bridges',(.55,1.3,5.0),(.05,.75,.35),70,.75)
    camera_key(c,f,1,(.55,1.3,5.0),(.05,.75,.35));camera_key(c,f,72,(.2,1.0,4.6),(-.22,.6,.35));cams.append((1,c))
    c,f=camera('02 / beating balance',(-1.9,-.45,5.5),(-.87,-.90,.25),62,.85)
    camera_key(c,f,73,(-1.9,-.45,5.5),(-.87,-.90,.25));camera_key(c,f,144,(-1.55,-.62,5.2),(-.87,-.90,.25));cams.append((73,c))
    c,f=camera('03 / first complete portrait',(6.5,3.8,34),(-.35,.6,0),70,13)
    camera_key(c,f,145,(6.5,3.8,34),(-.35,.6,0));camera_key(c,f,240,(5.7,3.3,32),(-.3,.6,0));cams.append((145,c))
    c,f=camera('04 / architecture of time',(7,3.8,30),(.25,.5,1),65,16)
    camera_key(c,f,241,(7,3.8,30),(.25,.5,1));camera_key(c,f,310,(16,5,26),(.65,.65,1.5));camera_key(c,f,360,(16.5,4.8,26),(.65,.65,1.5));camera_key(c,f,432,(7,3.8,30),(.1,.6,.3));cams.append((241,c))
    c,f=camera('05 / final portrait',(5.6,3.1,30),(-1.4,.65,0),70,13)
    camera_key(c,f,433,(5.6,3.1,30),(-1.4,.65,0));camera_key(c,f,528,(5.0,2.9,29),(-1.4,.65,0));cams.append((433,c))
    scene=bpy.context.scene
    for start,c in cams:
        marker=scene.timeline_markers.new(c.name,frame=start);marker.camera=c
    scene.camera=cams[0][1]
    # Individual physical layers retain their place in the mechanism when assembled.
    layers=movement.get('assembly',[])
    offsets=[.0,.85,1.45,2.2,3.05]
    exploded=[]
    for i,o in enumerate(layers): exploded.append((o,offsets[min(i,len(offsets)-1)]))
    for name,distance in [('chapter',4.4),('hands',5.3),('glass',5.8)]:
        o=case.get(name)
        if o: exploded.append((o,distance))
    for index,(o,travel) in enumerate(exploded):
        z=o.location.z
        for frame,delta in [(241,0),(252+index*2,0),(305+index*2,travel),(357+index,travel),(405+index*2,0),(432,0)]:
            o.location.z=z+delta;key(o,'location',frame)
    for o in movement.get('wheels',[]):
        base=o.rotation_euler.z;rate=float(o.get('spin_rate',.05))
        o.rotation_euler.z=base;key(o,'rotation_euler',1)
        o.rotation_euler.z=base+rate*22;key(o,'rotation_euler',528)
        if o.animation_data:
            for fc in o.animation_data.action.fcurves:
                for k in fc.keyframe_points:k.interpolation='LINEAR'
    sweep=empty('Subsidiary seconds / continuous sweep',(0,-1.735,0),case['hands'])
    for name in ['Seconds · fine blued needle','Seconds · open counterweight','Seconds · polished pin']:
        o=bpy.data.objects.get(name)
        if o:
            o.parent=sweep;o.location.y+=1.735
    sweep.rotation_euler.z=0;key(sweep,'rotation_euler',1)
    sweep.rotation_euler.z=-math.tau*22/60;key(sweep,'rotation_euler',528)
    for fc in sweep.animation_data.action.fcurves:
        for k in fc.keyframe_points:k.interpolation='LINEAR'
    balance=movement.get('balance')
    if balance:
        base=balance.rotation_euler.z
        for frame in range(1,529):
            balance.rotation_euler.z=base+math.radians(48)*math.sin((frame-1)/24*math.tau*2.5)
            key(balance,'rotation_euler',frame)
    scene.render.engine='CYCLES';scene.cycles.samples=48
    scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.065
    scene.cycles.use_denoising=True;scene.cycles.max_bounces=6
    scene.cycles.diffuse_bounces=2;scene.cycles.glossy_bounces=4;scene.cycles.transmission_bounces=4
    scene.cycles.transparent_max_bounces=4
    scene.cycles.sample_clamp_indirect=3
    scene.render.use_persistent_data=True
    scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
    scene.render.fps=24;scene.frame_start=1;scene.frame_end=528
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
    scene.render.image_settings.color_depth='8';scene.render.image_settings.compression=18
    scene.render.film_transparent=False
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    scene.view_settings.exposure=-.20
    scene.render.use_file_extension=True
    scene.render.filepath='//帧序列/frame_'
    scene.frame_set(200)
    # Pack fonts/textures so the saved scene is portable to another computer.
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'分秒之间.blend'))
    stats={'objects':len(scene.objects),'meshes':len(bpy.data.meshes),'materials':len(bpy.data.materials),'frames':528,'fps':24,'resolution':[1920,1080], 'engine':'Cycles', 'generated_flat_watch_images_used':False}
    (ROOT/'检查'/'scene.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2))
    print('SCENE_READY '+json.dumps(stats),flush=True)

if __name__=='__main__': setup()
