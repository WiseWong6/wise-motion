"""Take saved endpoints, unfold on the mechanical axis, return and approach barrel."""
import bpy,sys,json,math,numpy as np
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from common import *
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

def scene_state(s):
 d=s.camera.data
 return dict(camera=[list(row) for row in s.camera.matrix_world],lens=d.lens,shift=[d.shift_x,d.shift_y],dof=d.dof.use_dof,fstop=d.dof.aperture_fstop,focus=list(d.dof.focus_object.location),objects={o.name:[list(row) for row in o.matrix_world] for o in s.objects},visibility={o.name:o.hide_render for o in s.objects},exposure=s.view_settings.exposure,lights={o.name:o.data.energy for o in s.objects if o.type=='LIGHT'})

def delta(a,b):
 return dict(camera=float(abs(np.array(a['camera'])-b['camera']).max()),lens=abs(a['lens']-b['lens']),shift=float(abs(np.array(a['shift'])-b['shift']).max()),focus=float(abs(np.array(a['focus'])-b['focus']).max()),fstop=abs(a['fstop']-b['fstop']),dofSame=a['dof']==b['dof'],exposure=abs(a['exposure']-b['exposure']),lightEnergy=max(abs(a['lights'][n]-b['lights'][n]) for n in a['lights']),objects=max(float(abs(np.array(a['objects'][n])-b['objects'][n]).max()) for n in a['objects'] if n in b['objects']),visibilitySame=a['visibility']==b['visibility'])

bpy.ops.wm.open_mainfile(filepath=str(R/'模型/opening.blend'));s=bpy.context.scene;s.frame_set(155);bpy.context.view_layer.update()
start=scene_state(s);units=json.loads(s['unitManifest']);root=s.objects['MT / shared product root'];base_rotation=list(root.rotation_euler);yaw=float(root.rotation_euler.z);shift_start=s.camera.data.shift_y
campos=list(s.camera.location);focus=list(s.camera.data.dof.focus_object.location);lens=s.camera.data.lens
objects=[s.objects[n] for u in units for n in u['frozenObjects']];clear(s);poses=[]
for f in range(120):
 opening=smooth(f/54);closing=1-smooth((f-60)/53);amount=opening*closing
 root.rotation_euler=(base_rotation[0],base_rotation[1],yaw-math.radians(45)*math.sin(math.pi*f/119));root.keyframe_insert('rotation_euler',frame=f)
 for u in units:
  ob=s.objects[u['unitObject']];ob.location=(*u['endpointCenter'][:2],u['endZ']+u['layer']*amount);ob.keyframe_insert('location',frame=f)
 if f<=56:
  v=smooth(f/56);pos=mix(campos,(11,3,12),v);target=mix(focus,(0,.7,1.7),v);optics=lens*(1-v)+72*v
 else:
  v=smooth((f-56)/63);pos=mix((11,3,12),(4.5,3.5,16.8),v);target=mix((0,.7,1.7),(0,.95,0),v);optics=72*(1-v)+70*v
 camera_pose(s,f,pos,target,optics,13);s.camera.data.shift_y=shift_start*(1-smooth(f/56));s.camera.data.keyframe_insert('shift_y',frame=f)
 s.frame_set(f);bpy.context.view_layer.update();bb=fit(s,objects,target);s.camera.keyframe_insert('location',frame=f)
 poses.append(dict(frame=f,camera=list(s.camera.location),rotation=list(s.camera.rotation_euler),lens=optics,shiftY=s.camera.data.shift_y,focus=target,amount=amount,rootRotation=list(root.rotation_euler),bounds=bb))
# Smooth the minimal distance margin while preserving both inherited interfaces.
raw=np.array([np.linalg.norm(np.array(p['camera'])-p['focus']) for p in poses]);kernel=np.array([1,2,3,4,3,2,1],dtype=float);kernel/=kernel.sum()
dilated=np.array([raw[max(0,i-3):min(len(raw),i+4)].max() for i in range(len(raw))]);safe=np.convolve(np.pad(dilated,(3,3),mode='edge'),kernel,mode='valid')
# Only the interior changes; the first/last six frames are already slowly moving and fitted.
for i,p in enumerate(poses):
 extra=max(0,float(safe[i]-raw[i]))*smooth(i/10)*smooth((119-i)/10)
 target=np.array(p['focus']);direction=np.array(p['camera'])-target;pos=target+direction/np.linalg.norm(direction)*(raw[i]+extra)
 s.frame_set(i);camera_pose(s,i,pos,p['focus'],p['lens'],13);s.camera.data.shift_y=p['shiftY'];s.camera.data.keyframe_insert('shift_y',frame=i);bpy.context.view_layer.update();p.update(camera=list(s.camera.location),bounds=bounds(s,objects))
s.frame_set(0);bpy.context.view_layer.update();seam=delta(start,scene_state(s));assert all(seam[k]<1e-6 for k in ['camera','objects','shift','focus','fstop','exposure','lightEnergy']) and seam['visibilitySame'] and seam['dofSame'],seam
s['phaseTime']=26.;save(s,'structure');write_json(R/'数据/结构轨迹.json',dict(axis='product local +Z, shared with original model',poses=poses,seamFromOpening=seam,phaseTime=26))
progress(shot='structure',phase='场景已构建',message='已继承开场末状态，沿机械Z轴展开并旋转收拢',next='入口可见发条点检查与代表帧')

bpy.ops.wm.open_mainfile(filepath=str(R/'模型/structure.blend'));s=bpy.context.scene;s.frame_set(119);bpy.context.view_layer.update();start=scene_state(s)
root=s.objects['MT / shared product root'];inverse=np.asarray(root.matrix_world.inverted());campos=list(s.camera.location);focus=list(s.camera.data.dof.focus_object.location);lens=s.camera.data.lens
spring=s.objects['FROZEN / Tempered mainspring'];me=spring.data;me.calc_loop_triangles();co=np.empty(len(me.vertices)*3);me.vertices.foreach_get('co',co);co=co.reshape(-1,3)
triangles=np.array([list(t.vertices) for t in me.loop_triangles]);centers=co[triangles].mean(axis=1);mat=np.asarray(spring.matrix_world);world=(mat[:3,:3]@centers.T).T+mat[:3,3];local=(inverse[:3,:3]@world.T).T+inverse[:3,3]
normal=np.array([list(t.normal) for t in me.loop_triangles]);normals=(inverse[:3,:3]@mat[:3,:3]@normal.T).T
order=np.argsort(np.linalg.norm(local-np.array([-.4837,.7455,.0774]),axis=1)+np.where(normals[:,2]>.65,0,1e6))
pos_a=root.matrix_world@Vector((-.35,1.7,4.2));pos_b=root.matrix_world@Vector((-1.40,1.60,3.20));selected=None
for index in order[:1800:3]:
 point=Vector(world[index]);visible=True
 for fraction in np.linspace(0,1,15):
  origin=Vector(mix(campos,pos_a,smooth(fraction)))
  hit=s.ray_cast(bpy.context.evaluated_depsgraph_get(),origin,(point-origin).normalized(),distance=(point-origin).length+.02)
  if not hit[0] or hit[4].original.name!=spring.name or (hit[1]-point).length>.045:visible=False;break
 if visible:
  for fraction in np.linspace(0,1,8):
   origin=Vector(mix(pos_a,pos_b,fraction));hit=s.ray_cast(bpy.context.evaluated_depsgraph_get(),origin,(point-origin).normalized(),distance=(point-origin).length+.02)
   if not hit[0] or hit[4].original.name!=spring.name or (hit[1]-point).length>.045:visible=False;break
 if visible:selected=local[index].tolist();break
assert selected is not None,'No continuously visible real spring point; choose a different physical approach'
clear(s);visibility={o.name:o.hide_render for o in s.objects};poses=[]
for f in range(120):
 anchor=root.matrix_world@Vector(selected)
 if f<=59:
  v=smooth(f/59);pos=mix(campos,pos_a,v);target=mix(focus,anchor,v);optics=lens;aperture=13*(1-v)+5.6*v
 else:
  v=smooth((f-60)/59);pos=mix(pos_a,pos_b,v);target=list(anchor);optics=70*(1-v)+80*v;aperture=5.6*(1-v)+4.8*v
 camera_pose(s,f,pos,target,optics,aperture);s.frame_set(f);bpy.context.view_layer.update()
 anchor=root.matrix_world@Vector(selected);origin=s.camera.location;hit=s.ray_cast(bpy.context.evaluated_depsgraph_get(),origin,(anchor-origin).normalized(),distance=(anchor-origin).length+.02)
 assert hit[0] and hit[4].original.name==spring.name,(f,'spring obscured');assert visibility=={o.name:o.hide_render for o in s.objects}
 p=world_to_camera_view(s,s.camera,anchor);assert 0<p.x<1 and 0<p.y<1,(f,p)
 poses.append(dict(frame=f,camera=list(s.camera.location),rotation=list(s.camera.rotation_euler),focus=target,lens=optics,anchor=list(anchor),anchorPx=[p.x*540,(1-p.y)*960],firstHit=spring.name,distance=(anchor-origin).length,phaseTime=26))
s.frame_set(0);bpy.context.view_layer.update();seam=delta(start,scene_state(s));assert all(seam[k]<1e-6 for k in ['camera','objects','shift','focus','fstop','exposure','lightEnergy']) and seam['visibilitySame'] and seam['dofSame'],seam
s['barrelAnchorLocal']=json.dumps(selected);s['phaseTime']=26.;save(s,'entry')
write_json(R/'数据/入口轨迹.json',dict(anchorLocal=selected,poses=poses,seamFromStructure=seam,visibilityChanges=0,mechanismBeforeLock='rest phase 26',rubyObject='FROZEN / Great barrel bearing Ruby cabochon',bridgeObjects=['FROZEN / Great barrel bridge Mirror anglage','FROZEN / Great barrel bridge Geneva-stripe face'],blueHandsRetained=True))
progress(shot='entry',phase='场景已构建',message='120帧均命中同一真实发条表面；保留红宝石、桥板、蓝针与全部周边几何',next='同一 Bridge fixing 2 的螺纹/工具与锁紧代表帧')
print('STRUCTURE_ENTRY_READY',flush=True)
