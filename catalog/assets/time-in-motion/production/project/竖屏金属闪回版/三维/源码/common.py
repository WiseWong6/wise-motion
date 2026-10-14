"""Shared physical rig, camera optics, stage and atomic state files."""
from pathlib import Path
import sys,math,json,os
sys.dont_write_bytecode=True
R=Path(__file__).resolve().parents[1];PROJECT=R.parents[1]
COUNTS={'opening':156,'structure':120,'entry':120,'lock':60}
FILES={'opening':'开场-金属与图纸短闪.mp4','structure':'结构展开与旋转收拢.mp4','entry':'3号入口与同一发条盒.mp4','lock':'发条盒桥板锁紧.mp4'}
FLASH=[35,36,37,43,44]

def write_json(path,value):
 path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix(path.suffix+'.partial');tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2));tmp.replace(path)

def progress(**values):
 from datetime import datetime
 from zoneinfo import ZoneInfo
 p=R/'进度.json';d=json.loads(p.read_text()) if p.exists() else {}
 d.update(values);d['updatedAt']=datetime.now(ZoneInfo('Asia/Shanghai')).isoformat();write_json(p,d)

def smooth(u):
 u=max(0.,min(1.,u));return u*u*u*(10+u*(-15+6*u))

def mix(a,b,u):return [x*(1-u)+y*u for x,y in zip(a,b)]

def linear(ob):
 action=ob.animation_data.action if ob.animation_data else None
 if action:
  for layer in action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for fc in bag.fcurves:
      for pt in fc.keyframe_points:pt.interpolation='LINEAR'

def aim(ob,target):
 from mathutils import Vector,Matrix
 v=(Vector(target)-ob.location).normalized();right=v.cross(Vector((0,1,0))).normalized();up=right.cross(v)
 ob.rotation_euler=Matrix((right,up,-v)).transposed().to_euler()

def camera_pose(s,f,pos,target,lens=80,fstop=13):
 cam=s.camera;cam.location=pos;aim(cam,target);focus=cam.data.dof.focus_object;focus.location=target
 cam.data.lens=lens;cam.data.shift_x=cam.data.shift_y=0
 cam.data.dof.use_dof=True;cam.data.dof.aperture_fstop=fstop
 for ob,props in [(cam,['location','rotation_euler']),(focus,['location']),(cam.data,['lens','shift_x','shift_y','dof.aperture_fstop'])]:
  for p in props:ob.keyframe_insert(p,frame=f)
 return cam

def apply_budget(s):
 import bpy
 sys.path.insert(0,str(PROJECT/'修订版/性能研究'))
 from profiles import apply
 apply(s,'balanced');s.render.resolution_x=2160;s.render.resolution_y=3840;s.render.resolution_percentage=25
 s.render.fps=24;s.render.threads_mode='FIXED';s.render.threads=4;s.render.dither_intensity=0;s.render.use_motion_blur=False
 s.camera.data.clip_end=500

def bounds(s,objects):
 import bpy,numpy as np
 xyz=[]
 for ob in objects:
  mat=np.asarray(ob.matrix_world);p=np.asarray(ob.bound_box);xyz.append((mat[:3,:3]@p.T).T+mat[:3,3])
 xyz=np.vstack(xyz);cam=s.camera
 projection=np.asarray(cam.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=540,y=960,scale_x=1,scale_y=1))
 clip=(projection@np.linalg.inv(np.asarray(cam.matrix_world))@np.column_stack((xyz,np.ones(len(xyz)))).T).T
 xy=(clip[:,:2]/clip[:,3,None]+1)/2
 return [*xy.min(axis=0).tolist(),float(clip[:,3].min())],[*xy.max(axis=0).tolist(),float(clip[:,3].max())]

def fit(s,objects,target,margin=.048):
 import bpy
 from mathutils import Vector
 for _ in range(100):
  bpy.context.view_layer.update();lo,hi=bounds(s,objects)
  if lo[0]>=margin and lo[1]>=margin and hi[0]<=1-margin and hi[1]<=1-margin:return [lo,hi]
  s.camera.location=Vector(target)+(s.camera.location-Vector(target))*1.017
  s.camera.keyframe_insert('location',frame=s.frame_current)
 raise RuntimeError('Camera cannot contain actual model at '+str(s.frame_current)+' '+str([lo,hi,list(s.camera.location)]))

def stage(s):
 import bpy
 from mathutils import Vector
 for ob in list(s.objects):
  if ob.type=='LIGHT' or ob.name=='Seamless charcoal studio':bpy.data.objects.remove(ob,do_unlink=True)
 mat=bpy.data.materials.new('MT / fine charcoal photographic stage');mat.use_nodes=True;p=mat.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(.012,.016,.019,1);p.inputs['Roughness'].default_value=.51;p.inputs['Metallic'].default_value=.12
 noise=mat.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=155;noise.inputs['Detail'].default_value=2
 bump=mat.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.08;bump.inputs['Distance'].default_value=.004
 mat.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);mat.node_tree.links.new(bump.outputs[0],p.inputs['Normal'])
 bpy.ops.mesh.primitive_plane_add(size=160,location=(0,0,-.625));floor=bpy.context.object;floor.name='MT / charcoal contact stage';floor.data.materials.append(mat)
 for name,pos,energy,size,ratio,color in [
  ('MT / long neutral silk',(-5,-2,12),1300,9,.22,(1,.95,.88)),
  ('MT / cold silver strip',(7,4,10),1250,7,.12,(.75,.87,1)),
  ('MT / amber edge',(-6,7,6),600,5,.17,(1,.77,.45)),
  ('MT / inventory overhead',(0,1,15),260,9,.45,(.90,.94,1)),
  ('MT / lower cold grazing',(4,-8,6),340,6,.18,(.48,.72,1))]:
  d=bpy.data.lights.new(name,'AREA');d.shape='RECTANGLE';d.energy=energy;d.size=size;d.size_y=size*ratio;d.color=color
  ob=bpy.data.objects.new(name,d);s.collection.objects.link(ob);ob.location=pos;aim(ob,(1.5,-6.5,.03) if 'lower cold' in name else (0,.6,0))
 bg=s.world.node_tree.nodes['Background'];bg.inputs[0].default_value=(.045,.055,.073,1);bg.inputs[1].default_value=.13
 s.view_settings.exposure=-.15
 return floor

def clear(s):
 for ob in s.objects:
  ob.animation_data_clear()
  if ob.type in {'CAMERA','LIGHT'}:ob.data.animation_data_clear()
  if ob.type=='MESH' and ob.data.shape_keys:ob.data.shape_keys.animation_data_clear()
 s.animation_data_clear();s.world.animation_data_clear();s.world.node_tree.animation_data_clear()

def save(s,shot):
 import bpy
 s.frame_start=0;s.frame_end=COUNTS[shot]-1;apply_budget(s)
 for ob in s.objects:linear(ob)
 linear(s.camera.data)
 s.frame_set(0);bpy.context.preferences.filepaths.save_version=0
 bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=False,do_recursive=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(R/'模型'/f'{shot}.blend'))
