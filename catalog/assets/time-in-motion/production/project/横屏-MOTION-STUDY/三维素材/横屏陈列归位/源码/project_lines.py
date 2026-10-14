"""Export registered feature edges, depth and unit IDs from the actual wide scene."""
from pathlib import Path
import bpy, numpy as np, json, gzip, sys, time, argparse
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
sys.dont_write_bytecode=True
parser=argparse.ArgumentParser();parser.add_argument('--frame',type=int,default=0);parser.add_argument('--data-only',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
OUT=Path(__file__).resolve().parents[1];DEST=OUT/'线稿映射'
if args.frame:DEST=DEST/f'F{args.frame:04d}'
DEST.mkdir(parents=True,exist_ok=True)
PROJECT=OUT.parents[2];sys.path.insert(0,str(PROJECT/'修订版/性能研究'))
from profiles import apply
bpy.ops.wm.open_mainfile(filepath=str(OUT/'模型/wide-inventory.blend'))
s=bpy.context.scene;apply(s,'balanced');s.render.resolution_x=1920;s.render.resolution_y=1080;s.render.resolution_percentage=100
s.frame_set(args.frame);bpy.context.view_layer.update();width,height=1920,1080
units=json.loads(s['wideUnitManifest']);layer=s.view_layers[0];layer.use_pass_object_index=True;layer.use_pass_z=True;layer.update()
if args.data_only:
    layer.use_pass_combined=False;layer.update();s.cycles.samples=1;s.cycles.use_adaptive_sampling=False;s.cycles.use_denoising=False
tree=bpy.data.node_groups.new('WIDE / true projection passes','CompositorNodeTree');s.compositing_node_group=tree
tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');output=tree.nodes.new('NodeGroupOutput')
rl=tree.nodes.new('CompositorNodeRLayers');rl.scene=s;rl.layer=layer.name;tree.links.new(rl.outputs['Depth'] if args.data_only else rl.outputs['Image'],output.inputs[0])
def pass_output(name,socket,divisor,depth):
    math_node=tree.nodes.new('ShaderNodeMath');math_node.operation='DIVIDE';math_node.inputs[1].default_value=divisor;tree.links.new(socket,math_node.inputs[0])
    node=tree.nodes.new('CompositorNodeOutputFile');node.directory=str(DEST);node.file_name=name
    node.file_output_items.clear();item=node.file_output_items.new('FLOAT','Value');item.save_as_render=False
    node.format.media_type='IMAGE';node.format.file_format='PNG';node.format.color_mode='BW';node.format.color_depth=depth;node.format.compression=15
    node.format.color_management='OVERRIDE';node.format.view_settings.view_transform='Raw';node.format.view_settings.look='None';node.format.view_settings.exposure=0;node.format.view_settings.gamma=1
    tree.links.new(math_node.outputs[0],node.inputs[0])
pass_output('id',rl.outputs.get('Object Index') or rl.outputs['IndexOB'],255.,'8')
pass_output('depth',rl.outputs['Depth'],128.,'16')
s.render.use_compositing=True;s.render.filepath=str(DEST/'同帧实体.png');started=time.monotonic();bpy.ops.render.render(write_still=not args.data_only)
for label in ['id','depth']:
    target=DEST/(label+'.png')
    if not target.exists():
        candidates=list(DEST.glob(label+'*.png'));assert len(candidates)==1,[str(x) for x in candidates];candidates[0].replace(target)
deps=bpy.context.evaluated_depsgraph_get();camera=s.camera;cm=np.asarray(camera.matrix_world)
projection=np.asarray(camera.calc_matrix_camera(deps,x=width,y=height,scale_x=1,scale_y=1));pv=projection@np.linalg.inv(cm);cam_pos=cm[:3,3]
segments=[];error=0.
for u in units:
    for name in u['frozenObjects']:
        obj=s.objects[name];mesh=obj.data;mat=np.asarray(obj.matrix_world)
        co=np.empty(len(mesh.vertices)*3,dtype=float);mesh.vertices.foreach_get('co',co);co=co.reshape(-1,3)
        xyz=co@mat[:3,:3].T+mat[:3,3]
        edges=np.empty(len(mesh.edges)*2,dtype=np.int32);mesh.edges.foreach_get('vertices',edges);edges=edges.reshape(-1,2)
        normals=np.empty(len(mesh.polygons)*3,dtype=float);mesh.polygons.foreach_get('normal',normals);normals=normals.reshape(-1,3)
        adj={}
        for poly in mesh.polygons:
            for edge in poly.edge_keys:adj.setdefault(tuple(sorted(edge)),[]).append(poly.index)
        first=np.zeros(len(edges),dtype=np.int32);second=np.zeros(len(edges),dtype=np.int32);boundary=np.zeros(len(edges),dtype=bool)
        for i,pair in enumerate(edges):
            faces=adj.get(tuple(sorted(map(int,pair))),[])
            if faces:first[i]=faces[0];second[i]=faces[-1];boundary[i]=len(faces)==1
        n1=normals[first]@mat[:3,:3].T;n2=normals[second]@mat[:3,:3].T
        direction=cam_pos-(xyz[edges[:,0]]+xyz[edges[:,1]])*.5;direction/=np.maximum(np.linalg.norm(direction,axis=1)[:,None],1e-12)
        f1=(n1*direction).sum(axis=1);f2=(n2*direction).sum(axis=1)
        selected=(boundary|((normals[first]*normals[second]).sum(axis=1)<.75)|((f1>0)!=(f2>0)))&((f1>-.02)|(f2>-.02))
        ee=edges[selected]
        if not len(ee):continue
        clip=(pv@np.column_stack((xyz,np.ones(len(xyz)))).T).T;ndc=clip[:,:3]/clip[:,3,None]
        pixels=np.column_stack(((ndc[:,0]+1)*width/2,(1-ndc[:,1])*height/2));z=np.linalg.norm(xyz-cam_pos,axis=1)
        xy=pixels[ee];zz=z[ee];keep=np.linalg.norm(xy[:,1]-xy[:,0],axis=1)>.14
        data=np.concatenate((xy[keep].reshape(-1,4),zz[keep]),axis=1)
        segments.append(dict(unit=u['index'],object=name,segments=np.round(data,4).tolist()))
        sample=world_to_camera_view(s,camera,Vector(xyz[0]));error=max(error,abs(sample.x*width-pixels[0,0]),abs((1-sample.y)*height-pixels[0,1]))
payload=dict(frame=args.frame,width=width,height=height,segments=segments,registrationErrorPx=error,cameraMatrix=cm.tolist(),units=units,validUnchangedFrames=[args.frame,args.frame] if args.frame else [0,23])
with gzip.open(DEST/'真实投影.json.gz','wt') as stream:json.dump(payload,stream,ensure_ascii=False,separators=(',',':'))
(DEST/'验证.json').write_text(json.dumps(dict(frame=args.frame,size=[1920,1080],registrationErrorPx=error,geometrySource=str(OUT/'模型/wide-inventory.blend'),objects=len(segments),units=len(units),totalSeconds=time.monotonic()-started,validUnchangedFrames=[args.frame,args.frame] if args.frame else [0,23],dataOnly=args.data_only,beautyOutput=not args.data_only),ensure_ascii=False,indent=2))
assert error<.002,error
print('TRUE_LINES_READY',error,time.monotonic()-started,flush=True)
