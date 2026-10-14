"""One Cycles pass supplies reusable metal, unit ID, depth and real mesh edges."""
from pathlib import Path
import argparse, bpy, sys, time, json, math, gzip
import numpy as np
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

R=Path(__file__).resolve().parents[1]
PROJECT=R.parents[1]
sys.path.insert(0,str(Path(__file__).resolve().parent))
sys.path.insert(0,str(PROJECT/'修订版/性能研究'))
sys.dont_write_bytecode=True
from common import FLASH,COUNTS,progress,write_json,bounds as scene_bounds
from profiles import apply
p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--frames',default='1')
p.add_argument('--native',action='store_true');p.add_argument('--probe',action='store_true')
p.add_argument('--shot',default='opening')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.open_mainfile(filepath=str(R/'模型'/f'{a.shot}.blend'))
s=bpy.context.scene;apply(s,'balanced');s.render.resolution_percentage=100 if a.native else 25
s.render.dither_intensity=0
out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
width=2160 if a.native else 540;height=3840 if a.native else 960
if a.probe:
    print('SCENE_COMPOSITOR',[(x.identifier,x.type) for x in s.bl_rna.properties if any(k in x.identifier for k in ['node','compos'])])
    tree=bpy.data.node_groups.new('Probe','CompositorNodeTree')
    node=tree.nodes.new('CompositorNodeOutputFile')
    print('OUTPUT_PROPERTIES',[(x.identifier,x.type) for x in node.bl_rna.properties])
    print('FORMAT',[(x.identifier,x.type) for x in node.format.bl_rna.properties])
    print('FORMAT_ENUMS',{x.identifier:[i.identifier for i in x.enum_items] for x in node.format.bl_rna.properties if x.type=='ENUM'})
    print('ITEMS_FUNCTIONS',[(x.identifier,[(y.identifier,y.type) for y in x.parameters]) for x in node.file_output_items.bl_rna.functions])
    print('SCENE_CAMERA',s.camera.name,s.camera.data.lens)
    sys.exit()

layer=s.view_layers[0];layer.use_pass_object_index=True;layer.use_pass_z=True;layer.update()
s.render.use_compositing=True
if hasattr(s,'compositing_node_group'):
    tree=bpy.data.node_groups.new('OPENING / cache outputs','CompositorNodeTree')
    s.compositing_node_group=tree
    tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor')
    output=tree.nodes.new('NodeGroupOutput')
else:
    s.use_nodes=True;tree=s.node_tree;tree.nodes.clear();output=tree.nodes.new('CompositorNodeComposite')
nodes=tree.nodes;links=tree.links
rl=nodes.new('CompositorNodeRLayers');rl.scene=s;rl.layer=layer.name
print('RENDER_OUTPUTS',[(x.name,x.identifier) for x in rl.outputs],flush=True)
print('COMPOSITOR_ENABLED',s.render.use_compositing,s.use_nodes,flush=True)
links.new(rl.outputs['Image'],output.inputs[0])

def file_output(label,socket,depth):
    node=nodes.new('CompositorNodeOutputFile')
    if hasattr(node,'directory'):node.directory=str(out);node.file_name=label
    else:node.base_path=str(out);node.file_slots[0].path=label+'_'
    if hasattr(node,'file_output_items'):
        node.file_output_items.clear();item=node.file_output_items.new('FLOAT','Value');item.save_as_render=False
    node.format.media_type='IMAGE';node.format.file_format='PNG';node.format.color_mode='BW';node.format.color_depth=depth
    node.format.compression=15
    node.format.color_management='OVERRIDE'
    node.format.view_settings.view_transform='Raw'
    node.format.view_settings.look='None';node.format.view_settings.exposure=0;node.format.view_settings.gamma=1
    links.new(socket,node.inputs[0]);return node

id_math=nodes.new('ShaderNodeMath');id_math.operation='DIVIDE';id_math.inputs[1].default_value=255.
links.new(rl.outputs.get('Object Index') or rl.outputs.get('IndexOB'),id_math.inputs[0]);id_out=file_output('id',id_math.outputs[0],'8')
z_math=nodes.new('ShaderNodeMath');z_math.operation='DIVIDE';z_math.inputs[1].default_value=128.
links.new(rl.outputs['Depth'],z_math.inputs[0]);z_out=file_output('depth',z_math.outputs[0],'16')

settings={k:getattr(s.cycles,k) for k in ['device','samples','adaptive_min_samples','adaptive_threshold','denoiser','denoising_use_gpu','denoising_quality']}
settings.update(width=width,height=height,fps=24,metalDevices=[d.name for d in bpy.context.preferences.addons['cycles'].preferences.devices if d.type=='METAL' and d.use],blender=bpy.app.version_string)
assert settings['device']=='GPU' and settings['samples']==24 and settings['adaptive_min_samples']==8 and settings['denoising_use_gpu']
(out/'设置.json').write_text(json.dumps(settings,ensure_ascii=False,indent=2))

# Face adjacency and normals come from the exact evaluated frozen meshes.
requested=list(map(int,a.frames.split(',')))
units=json.loads(s['unitManifest']) if a.shot=='opening' and any(f in FLASH for f in requested) else []
geometry=[]
for u in units:
    for name in u['frozenObjects']:
        ob=s.objects[name];me=ob.data
        co=np.empty(len(me.vertices)*3,dtype=np.float64);me.vertices.foreach_get('co',co);co=co.reshape(-1,3)
        edges=np.empty(len(me.edges)*2,dtype=np.int32);me.edges.foreach_get('vertices',edges);edges=edges.reshape(-1,2)
        normals=np.empty(len(me.polygons)*3,dtype=np.float64);me.polygons.foreach_get('normal',normals);normals=normals.reshape(-1,3)
        adjacency={}
        for face in me.polygons:
            for edge in face.edge_keys:adjacency.setdefault(tuple(sorted(edge)),[]).append(face.index)
        first=np.zeros(len(edges),dtype=np.int32);second=np.zeros(len(edges),dtype=np.int32);boundary=np.zeros(len(edges),dtype=bool)
        for i,(v1,v2) in enumerate(edges):
            faces=adjacency.get(tuple(sorted((int(v1),int(v2)))),[])
            if not faces:continue
            first[i]=faces[0];second[i]=faces[-1];boundary[i]=len(faces)==1
        n1=normals[first];n2=normals[second]
        crease=(n1*n2).sum(axis=1)<.75
        geometry.append(dict(ob=ob,unit=u['index'],co=co,edges=edges,n1=n1,n2=n2,boundary=boundary,crease=crease))
timings=json.loads((out/'耗时.json').read_text()) if (out/'耗时.json').exists() else []
registration_error=0
frame_states=[]
for frame in requested:
    target=out/f'metal_{frame:04d}.png'
    is_line=a.shot=='opening' and frame in FLASH
    if target.exists() and (not is_line or ((out/f'id_{frame:04d}.png').exists() and (out/f'edges_{frame:04d}.json.gz').exists())):continue
    s.frame_set(frame);bpy.context.view_layer.update();s.render.use_compositing=is_line
    for label,node in [('id',id_out),('depth',z_out)]:
        if hasattr(node,'file_name'):node.file_name=f'{label}_{frame:04d}_'
    s.render.filepath=str(out/f'metal_{frame:04d}.partial.png')
    begin=time.monotonic();bpy.ops.render.render(write_still=True)
    render_seconds=time.monotonic()-begin
    Path(s.render.filepath).replace(target)
    # Blender 5's default File Output naming contains socket suffixes.
    for label in (['id','depth'] if is_line else []):
        expected=out/f'{label}_{frame:04d}.png'
        candidates=[f for f in out.glob(f'{label}_{frame:04d}*.png') if f!=expected]
        if not expected.exists():
            assert len(candidates)==1,(label,[str(f) for f in candidates]);candidates[0].replace(expected)
    if is_line:
        deps=bpy.context.evaluated_depsgraph_get()
        camera=s.camera;cm=np.asarray(camera.matrix_world)
        projection=np.asarray(camera.calc_matrix_camera(deps,x=width,y=height,scale_x=1,scale_y=1))
        pv=projection@np.linalg.inv(cm)
        cam_pos=cm[:3,3];segments=[];bounds=[]
        for g in geometry:
            ob=g['ob'];matrix=np.asarray(ob.matrix_world)
            xyz=(matrix[:3,:3]@g['co'].T).T+matrix[:3,3]
            e=g['edges'];mids=(xyz[e[:,0]]+xyz[e[:,1]])*.5
            directions=cam_pos-mids;directions/=np.maximum(np.linalg.norm(directions,axis=1)[:,None],1e-12)
            n1=g['n1']@matrix[:3,:3].T;n2=g['n2']@matrix[:3,:3].T
            front1=(n1*directions).sum(axis=1);front2=(n2*directions).sum(axis=1)
            selected=(g['boundary'] | g['crease'] | ((front1>0)!=(front2>0))) & ((front1>-.02)|(front2>-.02))
            selected_edges=e[selected]
            if not len(selected_edges):continue
            clip=(pv@np.column_stack((xyz,np.ones(len(xyz)))).T).T
            ndc=clip[:,:3]/clip[:,3,None]
            pixel=np.column_stack(((ndc[:,0]+1)*width/2,(1-ndc[:,1])*height/2))
            depth=np.linalg.norm(xyz-cam_pos,axis=1)
            xy=pixel[selected_edges];zz=depth[selected_edges]
            lengths=np.linalg.norm(xy[:,1]-xy[:,0],axis=1)
            keep=lengths>.14
            data=np.concatenate((xy[keep].reshape(-1,4),zz[keep]),axis=1)
            segments.append(dict(unit=g['unit'],object=ob.name,segments=np.round(data,4).tolist()))
            bounds.append(dict(unit=g['unit'],object=ob.name,bounds=[pixel.min(axis=0).tolist(),pixel.max(axis=0).tolist()]))
            sample=world_to_camera_view(s,camera,Vector(xyz[0]))
            registration_error=max(registration_error,abs(sample.x*width-pixel[0,0]),abs((1-sample.y)*height-pixel[0,1]))
        data=dict(frame=frame,width=width,height=height,segments=segments,bounds=bounds,
                  registrationErrorPx=registration_error,
                  cameraMatrix=cm.tolist(),unitMatrices={u['key']:[list(row) for row in s.objects[u['unitObject']].matrix_world] for u in units})
        with gzip.open(out/f'edges_{frame:04d}.json.gz','wt') as stream:json.dump(data,stream,separators=(',',':'),ensure_ascii=False)
    rec=dict(frame=frame,seconds=render_seconds,totalSeconds=time.monotonic()-begin,registrationErrorPx=registration_error)
    timings.append(rec);(out/'耗时.json').write_text(json.dumps(timings,indent=2))
    cam=s.camera
    all_objects=[o for o in s.objects if o.type in {'MESH','CURVE','FONT'} and not o.hide_render and o.name not in {'MT / charcoal contact stage','MT / accepted studio','Seamless charcoal studio'}]
    frame_states.append(dict(frame=frame,camera=[list(row) for row in cam.matrix_world],lens=cam.data.lens,focus=list(cam.data.dof.focus_object.location),line=is_line,bounds=scene_bounds(s,all_objects)))
    write_json(out/'帧状态.json',frame_states)
    state=json.loads((R/'进度.json').read_text());state['shots'][a.shot]['rendered']=len(list(out.glob('metal_*.png')));state['shots'][a.shot]['status']='rendering'
    progress(shot=a.shot,phase='代表帧或连续渲染',shots=state['shots'],completedFrames=sum(x['rendered'] for x in state['shots'].values()),message=a.shot+' 已渲染 '+str(state['shots'][a.shot]['rendered'])+'/'+str(COUNTS[a.shot]),currentCache=str(out))
    print('FRAME_DONE',json.dumps(rec),flush=True)
print('RENDER_FINISHED',flush=True)
