"""Lock the real barrel bridge fixing, with one axis shared by bore, screw and tool."""
import bpy,sys,json,math,numpy as np
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from common import *
from mathutils import Vector,Matrix
from bpy_extras.object_utils import world_to_camera_view
sys.path.insert(0,str(PROJECT/'修订版/源码'))
import cinematography as c
from geometry import _empty,_mesh,_disc,_poly

# Inherit the exact mechanical root placement and the visible spring interface.
bpy.ops.wm.open_mainfile(filepath=str(R/'模型/entry.blend'));s=bpy.context.scene;s.frame_set(119);bpy.context.view_layer.update()
entry_root=s.objects['MT / shared product root'];root_matrix=entry_root.matrix_world.copy();entry_anchor=json.loads(s['barrelAnchorLocal'])
entry_head_matrices={o.name.removeprefix('FROZEN / '):[list(row) for row in o.matrix_world] for o in s.objects if o.name.startswith('FROZEN / Bridge fixing 2 ')}
bpy.ops.wm.open_mainfile(filepath=str(PROJECT/'修订版/4K双版本/模型/竖屏/assembly.blend'))
s=bpy.context.scene;s.frame_set(253);bpy.context.view_layer.update();clear(s)
root=s.objects['TIME / fully modelled skeleton pocket watch'];root.matrix_world=root_matrix
c.root=root;c.flex=s.objects['Blued overcoil hairspring']
screw=s.objects['Bridge fixing 2'];original=list(screw.location);xy=original[:2];seat=original[2];angle=float(screw.rotation_euler.z)
assert abs(xy[0]+.93)<1e-5 and abs(xy[1]-1.58)<1e-5
bridges=['Great barrel bridge Mirror anglage','Great barrel bridge Geneva-stripe face']
bridge_parent=screw.parent
counter=s.objects['Bridge fixing 2 Countersink'];matrix=counter.matrix_world.copy();counter.parent=bridge_parent;counter.matrix_world=matrix
steel=bpy.data.materials['Mirror polished steel'];radius=.0365
bpy.ops.mesh.primitive_cylinder_add(vertices=80,radius=radius,depth=.34,location=root.matrix_world@Vector((*xy,seat-.04)))
cutter=bpy.context.object;cutter.name='MT / real fixing 2 bore cutter';cutter.rotation_euler=root.rotation_euler
for name in [*bridges,counter.name]:
 ob=s.objects[name];mod=ob.modifiers.new('MT / fixing 2 actual bore','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
 bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cutter,do_unlink=True)
# Pitch and feed use one scalar progress; the head keeps the original size and slot.
_disc('MT / fixing 2 solid shank',(0,0),.027,-.069,.166,steel,screw,.0014,64)
pitch=.018;turns=7.;steps=560;vertices=[];faces=[]
for i in range(steps+1):
 theta=math.tau*7.5*i/steps;z=-.140+pitch*7.5*i/steps
 for r,dz in [(.027,-.005),(.034,0),(.027,.005)]:vertices.append((r*math.cos(theta),r*math.sin(theta),z+dz))
for i in range(steps):
 for j in range(3):faces.append((3*i+j,3*(i+1)+j,3*(i+1)+(j+1)%3,3*i+(j+1)%3))
_mesh('MT / fixing 2 cut helical thread',vertices,faces,steel,screw,.0005,True)
driver=_empty('MT / fixing 2 slotted driver',root)
_poly('MT / ground slotted blade',[(-.052,-.005),(.052,-.005),(.052,.005),(-.052,.005)],.0585,.075,steel,driver,.0013)
_disc('MT / driver shoulder',(0,0),.026,.1435,.095,steel,driver,.002,64)
_disc('MT / driver polished stem',(0,0),.030,.475,.56,steel,driver,.002,64)
visibility={o.name:o.hide_render for o in s.objects};poses=[];start_difference=0
for f in range(60):
 if f<12:
  fall=smooth(f/11);z=seat+.20*(1-fall)+turns*pitch*fall;rotation=angle;feed=0
 else:
  feed=smooth((f-12)/35);z=seat+turns*pitch*(1-feed);rotation=angle-turns*math.tau*feed
 screw.location=(*xy,z);screw.rotation_euler.z=rotation
 for prop in ['location','rotation_euler']:screw.keyframe_insert(prop,frame=f)
 retract=.34*smooth((f-48)/11);driver.location=(*xy,z+retract);driver.rotation_euler=(0,0,rotation)
 for prop in ['location','rotation_euler']:driver.keyframe_insert(prop,frame=f)
 clock=26+.22*smooth((f-48)/11);c.tick(f,clock)
 # Context camera includes the true barrel ruby below the fixing, while focus tracks the head.
 local_camera=(-.40+.025*smooth(f/59),1.00,1.60-.03*smooth(f/59))
 local_target=(xy[0],xy[1]-.15,z+.025)
 camera_pose(s,f,root.matrix_world@Vector(local_camera),root.matrix_world@Vector(local_target),65,3.8)
 focus=s.camera.data.dof.focus_object;focus.location=root.matrix_world@Vector((*xy,z+.030));focus.keyframe_insert('location',frame=f)
 s.frame_set(f);bpy.context.view_layer.update()
 assert visibility=={o.name:o.hide_render for o in s.objects}
 if f==0:
  for name,matrix in entry_head_matrices.items():
   if 'Countersink' not in name:start_difference=max(start_difference,float(abs(np.asarray(s.objects[name].matrix_world)-matrix).max()))
  assert start_difference<1e-5,start_difference
 # Visible blue head corners stay in frame; the long handle intentionally enters from above.
 corners=[]
 for name in ['Bridge fixing 2 Blue head -1','Bridge fixing 2 Blue head 1']:
  ob=s.objects[name]
  for point in ob.bound_box:
   p=world_to_camera_view(s,s.camera,ob.matrix_world@Vector(point));corners.append([p.x,p.y])
 assert min(p[0] for p in corners)>0 and max(p[0] for p in corners)<1 and min(p[1] for p in corners)>0 and max(p[1] for p in corners)<1,(f,corners)
 poses.append(dict(frame=f,screwLocal=list(screw.location),screwAngle=rotation,driverLocal=list(driver.location),driverAngle=driver.rotation_euler.z,feed=feed,mechanismTime=clock,headBounds=corners,camera=list(s.camera.location),focus=list(focus.location)))
 linear(driver);linear(screw);linear(s.camera.data.dof.focus_object)
s['phaseTime']='26 until frame48, then eased startup';s['targetFastener']='Bridge fixing 2';s['barrelAnchorLocal']=json.dumps(entry_anchor)
save(s,'lock')
write_json(R/'数据/锁紧机械对应.json',dict(target='Bridge fixing 2',actualLocalPivot=original,bridgeLayers=bridges,modifiedSurfaces=[*bridges,counter.name],boreRadius=radius,threadPitch=pitch,rotations=turns,feedDistance=turns*pitch,sharedAxis='original product local +Z',originalHeadRadius=.066,sourceEntryHeadMatrixDifference=start_difference,visibilityChanges=0,startupBeginsAfterFrame=48,poses=poses,boundary='Explicit macro cut at the same barrel bridge. Helical geometry is a display construction, not a manufacturing claim.',nextInterface='Lock finishes before the editor cuts to running train and balance. Other macro material is reused with an explicit cut; its original clock phase differs.'))
progress(shot='lock',phase='场景已构建',message='Bridge fixing 2 的桥板两层、孔、螺钉与工具同轴；锁紧完成后才开始运转',next='锁紧代表帧自审，再连续渲染剩余镜头')
print('LOCK_READY',flush=True)
