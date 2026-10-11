"""Render a frame or native 24-fps sequence using the installed Blender."""
import bpy, sys, json, time
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def arg(k,default):
    return args[args.index(k)+1] if k in args else default
scene=bpy.context.scene
devices=[]
try:
    p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='METAL';p.get_devices()
    for d in p.devices:
        d.use=d.type=='METAL';devices.append({'name':d.name,'type':d.type,'enabled':bool(d.use)})
    scene.cycles.device='GPU' if any(d['enabled'] for d in devices) else 'CPU'
except Exception as e:
    scene.cycles.device='CPU'
    print('GPU_INFO',str(e),'Using CPU',flush=True)
scene.cycles.samples=int(arg('--samples',48))
scene.cycles.adaptive_threshold=float(arg('--threshold',.05))
scene.render.resolution_percentage=int(arg('--scale',100))
scene.render.threads_mode='FIXED';scene.render.threads=8
scene.render.use_persistent_data=True
scene.render.use_overwrite=False
if '--engine' in args: scene.render.engine=arg('--engine','CYCLES')
if '--stills' in args:
    measurements=[]
    for frame,name in [(200,'整表.png'),(108,'机芯.png'),(340,'分层.png')]:
        scene.frame_set(frame);scene.render.filepath=str(ROOT/'成片'/name)
        start=time.time();bpy.ops.render.render(write_still=True)
        measurements.append({'frame':frame,'file':name,'seconds':time.time()-start})
        print('STILL_READY '+json.dumps(measurements[-1]),flush=True)
    (ROOT/'检查'/'stills.json').write_text(json.dumps({'renders':measurements,'samples':scene.cycles.samples,'scale':scene.render.resolution_percentage,'devices':devices},ensure_ascii=False,indent=2))
elif '--frame' in args:
    frame=int(arg('--frame',200));scene.frame_set(frame)
    scene.render.filepath=str(ROOT/'成片'/arg('--name',f'frame-{frame:04d}.png'))
    start=time.time();bpy.ops.render.render(write_still=True)
    stats={'seconds':time.time()-start,'frame':frame,'samples':scene.cycles.samples,'scale':scene.render.resolution_percentage,'devices':devices,'path':scene.render.filepath}
    (ROOT/'检查'/f'render-{frame:04d}.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2));print('FRAME_READY '+json.dumps(stats),flush=True)
else:
    (ROOT/'帧序列').mkdir(exist_ok=True)
    scene.frame_start=int(arg('--start',1));scene.frame_end=int(arg('--end',528))
    scene.render.filepath=str(ROOT/'帧序列'/'frame_')
    bpy.ops.render.render(animation=True)
