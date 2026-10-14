"""Approved metal-first inventory, five-frame drawing beat, then real assembly."""
import bpy,sys,json,math,numpy as np
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from mathutils import Matrix,Vector
from common import *

OLD=PROJECT/'竖屏图纸实体开场'
bpy.ops.wm.open_mainfile(filepath=str(OLD/'模型/opening.blend'))
s=bpy.context.scene;s.frame_set(192);bpy.context.view_layer.update()
old_root=s.objects['OPENING / original shared assembly'];inverse=old_root.matrix_world.inverted()
accepted_rotation=list(old_root.rotation_euler)
accepted_camera=dict(position=list(s.camera.location),focus=list(s.camera.data.dof.focus_object.location),lens=s.camera.data.lens,shiftX=s.camera.data.shift_x,shiftY=s.camera.data.shift_y)
accepted_world={0:list(s.world.node_tree.nodes['Background'].inputs[0].default_value),1:s.world.node_tree.nodes['Background'].inputs[1].default_value}
accepted_exposure=s.view_settings.exposure
old_units=json.loads((OLD/'素材/零件映射.json').read_text())['units'];by_key={u['key']:u for u in old_units}
objects=[s.objects[name] for u in old_units for name in u['frozenObjects']]
local={o.name:inverse@o.matrix_world for o in objects}
clear(s)
root=bpy.data.objects.new('MT / shared product root',None);s.collection.objects.link(root)
plan=[('chassis','表壳底板与吊环',['case','mainplate','pendant'],0,48,72,0),
      ('face','章环与小秒盘',['chapter','seconds_dial'],0,78,105,3.6)]
for key,start in [('barrel',55),('center',58),('third',61),('fourth',64),('escape',66)]:plan.append((key,key,[key],1,start,start+25,.9 if key=='barrel' else .65))
for i,key in enumerate(['barrel_bridge','winding_bridge','train_bridge','center_bridge','escape_bridge','balance_bridge','pallet_bridge']):plan.append((key,by_key[key]['label'],[key],2,76+i*2,96+i,2.65))
plan.extend([('balance','摆轮游丝',['balance'],3,68,94,1.9),('seconds_train','小秒传动',['seconds_train'],3,61,88,.55),('motion','时针传动',['motion'],3,54,79,.5),('pallet','叉瓦',['pallet'],3,67,91,1.55),('hands','蓝钢指针',['hour_hand','minute_hand','hand_hub'],3,83,108,4.1),('click','止逆机构',['click'],4,66,92,1.15),('keyless','上链簧',['keyless'],4,68,93,.9),('seconds_hand','小秒针',['seconds_hand'],4,83,106,4.1),('fastener_2','发条盒桥板待锁蓝钢螺钉',[],4,84,102,2.65)])
fastener_names=[n for n in local if n.startswith('FROZEN / Bridge fixing 2 ') and not n.endswith('Countersink')]
units=[];assigned=set()
for index,(key,label,members,row,start,end,layer) in enumerate(plan,1):
 names=[n for k in members for n in by_key[k]['frozenObjects'] if n not in fastener_names]
 if key=='fastener_2':names=fastener_names
 assert names and not assigned.intersection(names);assigned.update(names)
 parent=bpy.data.objects.new('MT UNIT / '+key,None);s.collection.objects.link(parent);parent.parent=root
 points=[]
 for name in names:
  ob=s.objects[name];ob.parent=parent;ob.matrix_basis=local[name];ob.pass_index=index
  co=np.empty(len(ob.data.vertices)*3);ob.data.vertices.foreach_get('co',co);co=co.reshape(-1,3);mat=np.asarray(local[name]);points.append((mat[:3,:3]@co.T).T+mat[:3,3])
 xyz=np.vstack(points);lo=xyz.min(axis=0);hi=xyz.max(axis=0);center=(lo+hi)/2;center[2]=0
 for name in names:s.objects[name].matrix_basis=Matrix.Translation(-Vector(center))@s.objects[name].matrix_basis
 angle=0
 if row in [2,4] or key in ['hands','pallet']:
  x=xyz[:,:2]-center[:2];_,v=np.linalg.eigh(x.T@x);direction=v[:,-1];angle=math.pi/2-math.atan2(direction[1],direction[0])
  while angle>math.pi/2:angle-=math.pi
  while angle< -math.pi/2:angle+=math.pi
 rot=np.array([[math.cos(angle),-math.sin(angle)],[math.sin(angle),math.cos(angle)]])
 xy=(rot@(xyz[:,:2]-center[:2]).T).T;bb=[xy.min(axis=0),xy.max(axis=0)];size=bb[1]-bb[0]
 units.append(dict(key=key,label=label,index=index,unitObject=parent.name,frozenObjects=names,members=members,row=row,moveStart=start,moveEnd=end,layer=layer,endpointCenter=center.tolist(),endZ=.20 if key=='fastener_2' else 0.,initialRotationZ=angle,displaySize=size.tolist(),displayBounds=[b.tolist() for b in bb],trueBounds=[lo.tolist(),hi.tolist()]))
assert assigned==set(local)
for u in old_units:bpy.data.objects.remove(s.objects[u['unitObject']],do_unlink=True)
bpy.data.objects.remove(old_root,do_unlink=True)
accepted_lights=[]
for original in [o for o in s.objects if o.type=='LIGHT']:
 ob=original.copy();ob.data=original.data.copy();ob.name='MT ACCEPTED / '+original.name
 accepted_lights.append((ob,ob.data.energy))
accepted_studio=s.objects['Seamless charcoal studio'].copy();accepted_studio.name='MT / accepted studio';studio_z=accepted_studio.location.z
floor=stage(s)
inventory_lights=[o for o in s.objects if o.type=='LIGHT']
inventory_energy={o.name:o.data.energy for o in inventory_lights}
inventory_world={0:list(s.world.node_tree.nodes['Background'].inputs[0].default_value),1:s.world.node_tree.nodes['Background'].inputs[1].default_value}
inventory_exposure=s.view_settings.exposure
for ob,energy in accepted_lights:s.collection.objects.link(ob);ob.data.energy=0
s.collection.objects.link(accepted_studio);accepted_studio.location.z=studio_z-80
gap=.63;row_gap=.58
rows=[];total=0
for r in range(5):
 group=[u for u in units if u['row']==r];w=sum(u['displaySize'][0] for u in group)+gap*(len(group)-1);h=max(u['displaySize'][1] for u in group);rows.append((group,w,h));total+=h
total+=row_gap*4;top=total/2
for group,width,height in rows:
 x=-width/2;cy=top-height/2
 for u in group:
  w,h=u['displaySize'];bb=u['displayBounds'];cx=x+w/2
  u['initialCenter']=[cx-(bb[0][0]+bb[1][0])/2,cy-(bb[0][1]+bb[1][1])/2,.04-u['trueBounds'][0][2]]
  u['initialFootprint']=[cx-w/2,cy-h/2,cx+w/2,cy+h/2];x+=w+gap
 top-=height+row_gap
initial_width=max(max(w for g,w,h in rows)+1.35,(total+2.0)*9/16);z=initial_width*90/36
for u in units:
 ob=s.objects[u['unitObject']];ob.location=u['initialCenter'];ob.rotation_euler=(0,0,u['initialRotationZ'])
floor.location.z=-.01
apply_budget(s);camera_pose(s,0,(0,.25,z),(0,0,0),90,13)
s.frame_set(0);bpy.context.view_layer.update();fit(s,objects,(0,0,0))
s.render.filepath=str(R/'审核/陈列-代表帧-0000.png')
if not Path(s.render.filepath).exists():bpy.ops.render.render(write_still=True)
progress(shot='opening',phase='代表帧已落盘，继续构建运动',keyFrames=[str(R/'审核/陈列-代表帧-0000.png')],estimatedContinuousRenderMinutes=12,message='暗底金属陈列第0帧已落盘，正在完成同一场景后续动作。',next='查看第0帧，继续结构与入口、真实发条盒锁紧')
rig=[]
for frame in range(156):
 root.rotation_euler=[v*smooth((frame-72)/36) for v in accepted_rotation];root.keyframe_insert('rotation_euler',frame=frame)
 for u in units:
  p=smooth((frame-u['moveStart'])/(u['moveEnd']-u['moveStart']));a=u['initialCenter'];b=[*u['endpointCenter'][:2],u['endZ']]
  loc=mix(a,b,p);loc[2]+=(.55+.09*(u['index']%4))*math.sin(math.pi*p)
  ob=s.objects[u['unitObject']];ob.location=loc;ob.rotation_euler=(0,.12*math.sin(math.pi*p),u['initialRotationZ']*(1-p))
  for prop in ['location','rotation_euler']:ob.keyframe_insert(prop,frame=frame)
 zoom=smooth((frame-48)/60);hold=smooth((frame-108)/47)
 pos=mix((0,.25,z*(1-.012*smooth(frame/47))),accepted_camera['position'],zoom)
 target=mix((0,0,0),accepted_camera['focus'],zoom)
 camera_pose(s,frame,pos,target,90*(1-zoom)+accepted_camera['lens']*zoom,13)
 s.camera.data.shift_x=accepted_camera['shiftX']*zoom;s.camera.data.shift_y=accepted_camera['shiftY']*zoom
 for attr in ['shift_x','shift_y']:s.camera.data.keyframe_insert(attr,frame=frame)
 s.frame_set(frame);bpy.context.view_layer.update();bb=fit(s,objects,target)
 s.camera.keyframe_insert('location',frame=frame)
 restore=smooth((frame-82)/26)
 floor.location.z=-.01-.615*smooth((frame-48)/20)-80*restore;floor.keyframe_insert('location',frame=frame)
 accepted_studio.location.z=studio_z-80*(1-restore);accepted_studio.keyframe_insert('location',frame=frame)
 for ob in inventory_lights:ob.data.energy=inventory_energy[ob.name]*(1-restore);ob.data.keyframe_insert('energy',frame=frame)
 for ob,energy in accepted_lights:ob.data.energy=energy*restore;ob.data.keyframe_insert('energy',frame=frame)
 bg=s.world.node_tree.nodes['Background'];bg.inputs[0].default_value=mix(inventory_world[0],accepted_world[0],restore);bg.inputs[1].default_value=inventory_world[1]*(1-restore)+accepted_world[1]*restore
 for socket in bg.inputs:socket.keyframe_insert('default_value',frame=frame)
 s.view_settings.exposure=inventory_exposure*(1-restore)+accepted_exposure*restore;s.view_settings.keyframe_insert('exposure',frame=frame)
 keylight=s.objects['MT / long neutral silk'];keylight.location.x=-5+.35*hold;keylight.keyframe_insert('location',frame=frame)
 rig.append(dict(frame=frame,camera=list(s.camera.location),desiredCamera=pos,rotation=list(s.camera.rotation_euler),lens=s.camera.data.lens,shiftX=s.camera.data.shift_x,shiftY=s.camera.data.shift_y,focus=target,rootRotation=list(root.rotation_euler),bounds=bb,phase='rest / no mechanism motion'))
# Smooth an upper bound on the extra dolly distance. Every sample in the
# dilated signal contains the original constraint, so the positive Gaussian
# average stays above it. The camera never follows discrete per-frame fit steps.
needed=np.array([max(0.,np.linalg.norm(np.array(r['camera'])-r['focus'])-np.linalg.norm(np.array(r['desiredCamera'])-r['focus'])) for r in rig])
radius=6;padded=np.pad(needed,(radius,radius),mode='edge')
dilated=np.array([padded[i:i+2*radius+1].max() for i in range(len(needed))])
kernel=np.exp(-np.arange(-radius,radius+1,dtype=float)**2/(2*2.4**2));kernel/=kernel.sum()
envelope=np.convolve(np.pad(dilated,(radius,radius),mode='edge'),kernel,mode='valid')
assert np.all(envelope+1e-8>=needed)
for r,extra in zip(rig,envelope):
 f=r['frame'];target=np.array(r['focus']);direction=np.array(r['desiredCamera'])-target;distance=np.linalg.norm(direction)
 pos=target+direction/distance*(distance+extra+.02*(extra>0))
 s.frame_set(f);camera_pose(s,f,pos,r['focus'],r['lens'],13);bpy.context.view_layer.update()
 s.camera.data.shift_x=r['shiftX'];s.camera.data.shift_y=r['shiftY']
 for attr in ['shift_x','shift_y']:s.camera.data.keyframe_insert(attr,frame=f)
 bpy.context.view_layer.update()
 bb=bounds(s,objects);assert bb[0][0]>.045 and bb[0][1]>.045 and bb[1][0]<.955 and bb[1][1]<.955,(f,bb)
 r.update(camera=list(s.camera.location),rotation=list(s.camera.rotation_euler),bounds=bb,safeDollyCorrection=float(extra))
speed=np.linalg.norm(np.diff(np.array([r['camera'] for r in rig]),axis=0),axis=1)
accel=np.linalg.norm(np.diff(np.array([r['camera'] for r in rig]),n=2,axis=0),axis=1)
write_json(R/'审核/开场相机平滑.json',dict(maximumStep=float(speed.max()),maximumSecondDifference=float(accel.max()),safeEnvelope=True,perFrameSteps=speed.tolist(),correction=envelope.tolist(),retimedParts=['face','hands','seconds_hand','fastener_2']))
s['unitManifest']=json.dumps(units,ensure_ascii=False);s['phaseTime']=26.;s['targetFastener']='Bridge fixing 2';s['targetFastenerLooseLift']=.20
write_json(R/'数据/零件与陈列.json',dict(units=units,initialWidth=initial_width,trueScale=1,sourceModel='Original accepted assembly frame 253, evaluated at rest phase 26',frames=156,lineFrames=FLASH,rig=rig))
write_json(R/'数据/认可整表摄影.json',dict(camera=accepted_camera,rotation=accepted_rotation,world=accepted_world,exposure=accepted_exposure,lights=[dict(name=ob.name,energy=energy) for ob,energy in accepted_lights],blendRange=[82,108],source=str(PROJECT/'修订版/4K双版本/模型/竖屏/assembly.blend'),sourceFrame=253))
save(s,'opening')
progress(shot='opening',phase='代表帧渲染',message='已构建暗底真实陈列与汇聚动作；先落盘第0帧',next='查看金属、阴影和排列；继续构建结构、入口与真实发条盒螺钉')
progress(shot='opening',phase='代表帧自审',keyFrames=[str(R/'审核/陈列-代表帧-0000.png')],estimatedContinuousRenderMinutes=12,message='第0帧已落盘。初估四段连续渲染约12分钟，后续代表帧实测修正。',next='查看第0帧后，继续结构和锁紧的代表帧')
print('OPENING_READY',flush=True)
