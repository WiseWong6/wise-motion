"""Render any explicit subset of one saved global timeline, with measured costs."""
from pathlib import Path
import argparse,sys,json,time,hashlib
sys.dont_write_bytecode=True
from datetime import datetime
from zoneinfo import ZoneInfo
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parent))
import product_photography as p

def main():
    a=argparse.ArgumentParser()
    a.add_argument('--frames',required=True,help='Comma-separated global frame numbers, or start:end:step')
    a.add_argument('--width',type=int,default=540)
    a.add_argument('--samples',type=int,default=8)
    a.add_argument('--name',default='representatives')
    args=a.parse_args(sys.argv[sys.argv.index('--')+1:])
    frames=list(range(*[int(x) for x in args.frames.split(':')])) if ':' in args.frames else [int(x) for x in args.frames.split(',')]
    assert frames and min(frames)>=0 and max(frames)<672
    model=p.ROOT/'模型/product-film.blend'
    bpy.ops.wm.open_mainfile(filepath=str(model))
    scene=bpy.context.scene
    p.budget(scene,args.width,args.samples)
    scene.cycles.adaptive_min_samples=min(8,args.samples)
    output=p.ROOT/'渲染'/args.name
    output.mkdir(parents=True,exist_ok=True)
    report={'model':str(model),'modelSHA256':hashlib.sha256(model.read_bytes()).hexdigest(),
            'width':args.width,'height':args.width*4//3,'samples':args.samples,'frames':[],
            'everyFrameRendered':len(frames)==672,'renderedFrameSubset':frames}
    report_path=p.ROOT/'审核'/f'{args.name}-渲染.json'
    if report_path.exists():
        previous=json.loads(report_path.read_text())
        if any(previous.get(k)!=report[k] for k in ['modelSHA256','width','height','samples']):
            raise RuntimeError('Existing cache does not match this saved scene and render budget')
        report['frames']=previous.get('frames',[])
        report['renderedFrameSubset']=sorted(set(previous.get('renderedFrameSubset',[])+frames))
    for f in frames:
        path=output/f'{f:04d}.png'
        if path.exists():continue
        scene.frame_set(f)
        scene.render.filepath=str(path)
        start=time.monotonic();bpy.ops.render.render(write_still=True);seconds=time.monotonic()-start
        item={'frame':f,'seconds':seconds,'path':str(path)};report['frames'].append(item)
        p.write_json(report_path,report)
        p.write_json(p.ROOT/'进度.json',{'stage':'rendering','cache':args.name,'frame':f,
            'targetFrames':672,'completedFrames':len(list(output.glob('*.png'))),
            'lastFrameSeconds':seconds,'width':args.width,'samples':args.samples,
            'updatedAt':datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(),
            'meanFrameSeconds':sum(x['seconds'] for x in report['frames'])/len(report['frames'])})
        print('PRODUCT_RENDER '+json.dumps(item,ensure_ascii=False),flush=True)
    report['everyFrameRendered']=len(list(output.glob('*.png')))==672
    p.write_json(report_path,report)
    print('GLOBAL_RENDER_READY '+args.name,flush=True)

if __name__=='__main__':main()
