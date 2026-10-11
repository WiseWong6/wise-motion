"""One command to render the saved .blend, refresh stills and finish the film."""
import subprocess,sys,json,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
BLENDER='/Applications/Blender.app/Contents/MacOS/Blender'
steps=[
 ('animation',[BLENDER,'-b',str(ROOT/'分秒之间.blend'),'--python-exit-code','1','-t','8','--python',str(ROOT/'源码'/'render.py'),'--','--samples','48','--threshold','0.05']),
 ('stills',[BLENDER,'-b',str(ROOT/'分秒之间.blend'),'--python-exit-code','1','-t','8','--python',str(ROOT/'源码'/'render.py'),'--','--stills','--samples','96','--threshold','0.025','--scale','200']),
 ('compose',[sys.executable,str(ROOT/'源码'/'compose.py')]),
 ('review',[sys.executable,str(ROOT/'源码'/'review.py')]),
]
record=[]
for name,cmd in steps:
    print('START',name,flush=True);start=time.time()
    with (ROOT/'检查'/f'{name}.log').open('w') as log:
        subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,check=True)
    record.append({'stage':name,'seconds':round(time.time()-start,2)})
    (ROOT/'检查'/'production.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    print('DONE',name,record[-1]['seconds'],flush=True)
print('PRODUCTION_COMPLETE',flush=True)
