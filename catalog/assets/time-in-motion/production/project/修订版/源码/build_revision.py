"""Revise the frozen baseline without touching it. Run in Blender."""
from pathlib import Path
import sys,math,json,bpy
from mathutils import Vector
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'源码'))
from geometry import _empty,_mesh,_ring,_disc,_poly,_curves
from mechanics import AXES,STAGES,stage_data,outline,phases,FACE_WIDTH

def remove_tree(o):
    for c in list(o.children_recursive):bpy.data.objects.remove(c,do_unlink=True)
    bpy.data.objects.remove(o,do_unlink=True)

def tooth_mesh(name,n,module,phase,z,parent,material,spokes=6):
    contour=outline(n,module,phase);N=len(contour)
    radius=n*module/2;inner=radius*.76 if spokes else radius*.18
    vertices=[];faces=[]
    for zz in (z-FACE_WIDTH/2,z+FACE_WIDTH/2):
        vertices.extend((x,y,zz) for x,y in contour)
        vertices.extend((inner*math.cos(math.atan2(y,x)),inner*math.sin(math.atan2(y,x)),zz) for x,y in contour)
    for i in range(N):
        j=(i+1)%N
        faces.extend([(i,j,j+N,i+N),(i+2*N,i+3*N,j+3*N,j+2*N),
                      (i,i+2*N,j+2*N,j),(i+N,j+N,j+3*N,i+3*N)])
    o=_mesh(name,vertices,faces,material,parent,min(module*.12,.0012))
    o['teeth']=n;o['module']=module;o['phase']=phase;o['z']=z
    o['outline']=json.dumps(contour)
    if spokes:
        for k in range(spokes):
            a=math.tau*k/spokes+.16;c,s=math.cos(a),math.sin(a)
            points=[(.06,-.020),(inner+.008,-.014),(inner+.008,.014),(.06,.020)]
            _poly(name+' spoke '+str(k),[(x*c-y*s,x*s+y*c) for x,y in points],z,.024,material,parent,.004)
        _ring(name+' polished rim',(0,0),inner-.007,inner+.010,z+.012,.010,
              bpy.data.materials['Mirror polished steel'],parent,.0012,144)
        _disc(name+' hub',(0,0),.071,z,.044,material,parent,.003,64)
    return o

def bore(o,xy,radius):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=1.8,location=(*xy,.05))
    cutter=bpy.context.object;cutter.name='temporary engineering bore'
    mod=o.modifiers.new('Actual pivot clearance','BOOLEAN');mod.operation='DIFFERENCE'
    mod.solver='EXACT';mod.object=cutter
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

bpy.ops.wm.open_mainfile(filepath=str(R/'模型/基线怀表.blend'))
s=bpy.context.scene;s.frame_set(180);s.timeline_markers.clear()
for o in s.objects:
    o.animation_data_clear()
    if o.data and hasattr(o.data,'animation_data_clear'):o.data.animation_data_clear()
root=bpy.data.objects['TIME / fully modelled skeleton pocket watch'];root.rotation_euler=(0,0,0)
group_names={'base':'01 / Frosted mainplate','train':'02 / Going train and barrel',
 'winding':'03 / Winding train','oscillator':'04 / Balance and escapement',
 'bridges':'05 / Sculpted and engraved bridges','chapter':'CASEWORK · chapter','hands':'CASEWORK · hands'}
for name in group_names.values():bpy.data.objects[name].location=(0,0,0)
barrel=bpy.data.objects['Great barrel']
for c in list(barrel.children):
    if any(x in c.name for x in ['Cut brass wheel','Faced inner rim','Hub','Staff','Hardened pinion']):remove_tree(c)
for o in [o for o in s.objects if 'tooth_count' in o and o!=barrel]:remove_tree(o)
barrel.name='REV staff barrel';barrel.location=(*AXES['barrel'],0)
for o in list(s.objects):
    if o.name.endswith('Continuous wheel staff'):remove_tree(o)
staffs={'barrel':barrel}
steel=bpy.data.materials['Mirror polished steel'];gold=bpy.data.materials['Satin champagne wheel brass']
train=bpy.data.objects[group_names['train']]
for name,xy in AXES.items():
    if name not in staffs:
        staffs[name]=_empty('REV staff '+name,train);staffs[name].location=(*xy,0)
    if name=='barrel':
        _ring('REV barrel rotating sleeve',(0,0),.0145,.023,.025,.25,steel,staffs[name],.001,64)
    else:
        _disc('REV '+name+' continuous pivot',(0,0),.0125,.025 if name=='fourth' else .120,
              .81 if name=='fourth' else .62,steel,staffs[name],.0013,48)
    # The lower jeweled support is fixed to the mainplate, not a rotating wheel.
    _ring('REV '+name+' lower bearing',xy,.018,.056,-.122,.025,
          bpy.data.materials['Synthetic ruby bearing'],bpy.data.objects[group_names['base']],.003,64)
phase=phases();mesh_records=[]
for i,st in enumerate(STAGES):
    d=stage_data(st)
    for role,axis,n in [('wheel',d['a'],d['n1']),('pinion',d['b'],d['n2'])]:
        o=tooth_mesh('REV stage '+str(i)+' '+role,n,d['module'],phase[i,role],d['z'],staffs[axis],
                     gold if role=='wheel' else steel,6 if role=='wheel' else 0)
        mesh_records.append({'object':o.name,'axis':axis,'stage':i,'role':role,**d})
for name,xy in AXES.items():
    for object_name in ['Movement mainplate','Shadowed recessed floor']:
        bore(bpy.data.objects[object_name],xy,.021)
    # Drill every bridge body that contains the corresponding pivot in plan.
    for o in list(s.objects):
        if o.type=='MESH' and o.name.endswith(('Mirror anglage','Geneva-stripe face')):
            xs=[v.co.x for v in o.data.vertices];ys=[v.co.y for v in o.data.vertices]
            if min(xs)<xy[0]<max(xs) and min(ys)<xy[1]<max(ys):bore(o,xy,.021)
    for o in list(s.objects):
        if 'bearing Ruby oil well' in o.name or 'bearing Mirror pivot' in o.name:
            if any(math.dist((v.co.x,v.co.y),xy)<.10 for v in o.data.vertices):
                o.hide_render=True
# A true escape wheel on the same escape staff; tooth/pallet locking is
# intentionally not asserted as a solved rigid-body simulation.
escape=staffs['escape'];p=[]
for i in range(15):
    for f,r in [(0,.252),(.10,.318),(.24,.321),(.64,.261),(.97,.252)]:
        a=(i+f)*math.tau/15;p.append((r*math.cos(a),r*math.sin(a)))
o=_poly('REV 15-tooth escape wheel',p,.205,.028,gold,escape,.001)
bore(o,(0,0),.035) if False else None
_ring('REV escape relief',(0,0),.073,.094,.224,.014,steel,escape,.002,64)
# Coaxial winding ratchet belongs to the stationary arbor during running.
arbor=_empty('REV stationary barrel arbor',bpy.data.objects[group_names['winding']]);arbor.location=(*AXES['barrel'],0)
tooth_mesh('REV coaxial winding ratchet',48,.015,0,.211,arbor,gold,5)
_disc('REV barrel arbor',(0,0),.0125,.12,.62,steel,arbor,.0013,48)
bpy.context.view_layer.update()
for nm in ['REV stage 0 wheel hub','Barrel dark spring recess']:
    bore(bpy.data.objects[nm],AXES['barrel'],.0145)
cap=bpy.data.objects['Barrel arbor cap'];world=cap.matrix_world.copy();cap.parent=arbor;cap.matrix_world=world
spring=bpy.data.objects['Tempered mainspring'];spring.parent=arbor
spring.location=(0,0,0)
bal=bpy.data.objects['Balance oscillation pivot'];bal.rotation_euler=(0,0,0)
osc=bpy.data.objects[group_names['oscillator']]
for name in ['Blued overcoil hairspring','Breguet raised overcoil']:
    o=bpy.data.objects[name];o.parent=osc;o.location=bal.location
    o['REV flexible spring']=True
spring=bpy.data.objects['Blued overcoil hairspring']
for pnt in spring.data.splines[0].points:pnt.co.z=.121
overcoil=bpy.data.objects['Breguet raised overcoil']
for i,pt in enumerate(overcoil.data.splines[0].points):
    u=i/(len(overcoil.data.splines[0].points)-1);a=math.tau*10.6+.45*u
    pt.co=(.636*math.cos(a),.636*math.sin(a),.121+.015*u,1)
ea=math.tau*10.6+.45
_disc('REV fixed hairspring stud',(-1.29+.636*math.cos(ea),-1.05+.636*math.sin(ea)),.020,.211,.160,steel,osc,.002,32)
fork=_empty('REV pallet pivot',osc);fork.location=(-.56,-1.55,0)
for name in ['Anchor pallet fork','Rectangular pallet ruby','Rectangular pallet ruby.001']:
    o=bpy.data.objects.get(name)
    if o:remove_tree(o)
fork_outline=[(-1.20,-1.09),(-1.15,-1.10),(-1.10,-1.19),(-.58,-1.49),(-.16,-1.43),
 (-.04,-1.33),(.06,-1.33),(.09,-1.39),(-.02,-1.42),(-.07,-1.51),
 (-.02,-1.60),(.09,-1.61),(.06,-1.67),(-.05,-1.67),(-.15,-1.59),
 (-.61,-1.61),(-.65,-1.56),(-1.13,-1.26),(-1.20,-1.27),(-1.23,-1.22),
 (-1.16,-1.20),(-1.14,-1.15),(-1.22,-1.14)]
_poly('REV formed steel pallet fork',[(x+.56,y+1.55) for x,y in fork_outline],.175,.025,steel,fork,.003)
for k,(x,y) in enumerate([(.075,-1.360),(.075,-1.635)]):
    _poly('REV pallet stone '+str(k),[(x+.56+dx,y+1.55+dy) for dx,dy in [(-.026,-.009),(.026,-.009),(.026,.009),(-.026,.009)]],.205,.027,bpy.data.materials['Synthetic ruby bearing'],fork,.002)
_ring('REV balance impulse roller',(0,0),.018,.13,.070,.035,steel,bal,.003,96)
_disc('REV balance impulse jewel',(.106,0),.013,.106,.050,bpy.data.materials['Synthetic ruby bearing'],bal,.001,24)
for nm,xy,parent,local_z in [('balance',(-1.29,-1.05),bal,.041),('pallet',(-.56,-1.55),fork,.115)]:
    _disc('REV '+nm+' continuous pivot',(0,0),.0125,local_z,.61,steel,parent,.0013,48)
    base=bpy.data.objects[group_names['base']]
    _ring('REV '+nm+' lower bearing',xy,.018,.056,-.122,.025,bpy.data.materials['Synthetic ruby bearing'],base,.003,64)
    for object_name in ['Movement mainplate','Shadowed recessed floor']:bore(bpy.data.objects[object_name],xy,.021)
    for ob in list(s.objects):
        if ob.type=='MESH' and ob.name.endswith(('Mirror anglage','Geneva-stripe face')):
            xs=[v.co.x for v in ob.data.vertices];ys=[v.co.y for v in ob.data.vertices]
            if min(xs)<xy[0]<max(xs) and min(ys)<xy[1]<max(ys):bore(ob,xy,.021)
# Seconds display is driven through a real equal-tooth relay at the fourth
# wheel layer. Coaxial minute/hour motion-work is shown behind the center hub.
secxy=(0.,-1.735);d=math.dist(AXES['fourth'],secxy);module=d/(2*48)
ang=math.atan2(secxy[1]-AXES['fourth'][1],secxy[0]-AXES['fourth'][0])
seconds_staff=_empty('REV seconds relay',train);seconds_staff.location=(*secxy,0)
tooth_mesh('REV seconds driver',48,module,ang,-.365,staffs['fourth'],gold,5)
tooth_mesh('REV seconds driven',48,module,ang+math.pi,-.365,seconds_staff,gold,5)
idler=_empty('REV seconds idler',train);idler.location=((AXES['fourth'][0]+secxy[0])/2,(AXES['fourth'][1]+secxy[1])/2,0)
tooth_mesh('REV seconds idler gear',48,module,ang+math.pi-math.pi/48,-.365,idler,gold,5)
_disc('REV seconds continuous pivot',(0,0),.0125,.11,.99,steel,seconds_staff,.001,48)
for nm in ['Movement mainplate','Shadowed recessed floor']:bore(bpy.data.objects[nm],secxy,.021)
# Display gear is under the mainplate to avoid an unsupported collision with
# the going train; motion works is still kinematic, not manufacturing verified.
motion=_empty('REV motion works',train)
tooth_mesh('REV hour wheel',72,.004,0,-.328,motion,gold,5)
_disc('REV hollow cannon sleeve',(0,0),.023,.333,.55,steel,staffs['center'],.001,48)
# Polished hand facets move with their blue leaf instead of remaining on dial.
bpy.context.view_layer.update()
for nm in ['Hour · pierced blue leaf','Minute · pierced blue leaf']:
    edge=bpy.data.objects[nm+' · polished edge'];world=edge.matrix_world.copy()
    edge.parent=bpy.data.objects[nm];edge.matrix_world=world
bpy.data.objects['Fine circular mainplate graining'].hide_render=True
for o in [bpy.data.objects['CASEWORK · glass'],*bpy.data.objects['CASEWORK · glass'].children_recursive]:o.hide_render=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
s.render.engine='CYCLES';s.cycles.device='GPU';s.cycles.samples=48
s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.055;s.cycles.use_denoising=True
s.render.use_persistent_data=True;s.render.threads_mode='FIXED';s.render.threads=6
s.render.resolution_x=1920;s.render.resolution_y=1080;s.render.resolution_percentage=100;s.render.fps=24
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB'
s.render.image_settings.compression=12;s.render.use_motion_blur=False
s['REV mechanism']='Four-stage compound involute train; kinematic escapement; not a manufacture-ready calibre'
root['REV groups']=json.dumps(group_names)
(R/'检查/轮系参数.json').write_text(json.dumps(mesh_records,ensure_ascii=False,indent=2))
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(R/'模型/机械怀表-修订.blend'))
print('REVISION_MODEL_READY',len(s.objects),flush=True)
