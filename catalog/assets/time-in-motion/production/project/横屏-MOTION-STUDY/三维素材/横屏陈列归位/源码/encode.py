"""Publish the registered line flash and clean beauty with explicit BT.709."""
from pathlib import Path
import argparse,hashlib,json,os,subprocess
from PIL import Image,ImageDraw,ImageFont
import numpy as np
OUT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--preview',action='store_true');args=parser.parse_args()
geometry=json.loads((OUT/'几何二次复核.json').read_text()) if (OUT/'几何二次复核.json').exists() else None
if not args.preview:assert geometry and geometry['passed'],'Saved-scene geometry review must pass before final publication.'
meta=json.loads((OUT/('当前预览缓存.json' if args.preview else '当前正式缓存.json')).read_text());raw=Path(meta['path'])
width=meta['width'];height=meta['height'];flash={8,9,18,19,72,73}
plate=OUT/'线稿映射/图纸-陈列-1920.png'
if width!=1920:
    smaller=OUT/'线稿映射'/f'图纸-陈列-{width}.png';Image.open(plate).resize((width,height),Image.Resampling.LANCZOS).save(smaller);plate=smaller
composition=OUT/'缓存'/('preview-composition' if args.preview else 'final-composition');composition.mkdir(exist_ok=True)
for f in range(144):
    source=plate if f in flash else raw/f'F{(f//4*4 if args.preview else f):04d}.png'
    if f in {72,73}:
        source=OUT/'线稿映射'/f'F{f:04d}'/'图纸-陈列-1920.png'
        if width!=1920:
            smaller=source.parent/f'图纸-陈列-{width}.png';Image.open(source).resize((width,height),Image.Resampling.LANCZOS).save(smaller);source=smaller
    assert source.exists(),source
    target=composition/f'F{f:04d}.png'
    if target.is_symlink() and target.resolve()!=source.resolve():target.unlink()
    if not target.exists():target.symlink_to(os.path.relpath(source,target.parent))
dest=OUT/('审核' if args.preview else '交付');dest.mkdir(exist_ok=True)
def encode(folder,name):
    path=dest/(name+'.mp4')
    subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-start_number','0','-i',str(folder/'F%04d.png'),'-frames:v','144','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709','-c:v','libx264','-threads','2','-crf','16','-preset','fast','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-movflags','+faststart',str(path)],check=True)
    stream=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_streams','-of','json',str(path)]))['streams'][0]
    assert stream['nb_read_frames']=='144' and stream['avg_frame_rate']=='24/1' and stream['width']==width and stream['height']==height,stream
    assert stream['color_primaries']==stream['color_transfer']==stream['color_space']=='bt709' and stream['color_range']=='tv',stream
    return dict(path=str(path),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),width=width,height=height,frames=144,fps=24,duration=6,fullDecode=True,colorValidated=True,sourceCache=str(folder))
records=[encode(composition,'横屏陈列归位-线稿短闪-'+('6fps采样预览' if args.preview else '1080'))]
if not args.preview:records.append(encode(raw,'横屏陈列归位-纯实体-1080'))
keyframes=[0,8,72,73,108,143];sheet=Image.new('RGB',(1440,600),(16,19,22));draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20)
mae=[]
for i,f in enumerate(keyframes):
    data=subprocess.check_output(['ffmpeg','-v','error','-i',records[0]['path'],'-vf',f'select=eq(n\\,{f})','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-threads','1','-'])
    decoded=np.frombuffer(data,dtype=np.uint8).reshape(height,width,3)
    source=np.asarray(Image.open(composition/f'F{f:04d}.png').convert('RGB'));mae.append(dict(frame=f,mae=float(np.mean(np.abs(decoded.astype(float)-source)))))
    image=Image.fromarray(decoded).resize((480,270),Image.Resampling.LANCZOS);x=i%3*480;y=i//3*300;sheet.paste(image,(x,y));draw.text((x+12,y+271),f'F{f:03} | {f/24:.2f}s',font=font,fill='white')
sheet.save(dest/'最终编码联系表.jpg',quality=94)
result=dict(ready=True,colorValidated=True,geometryVerified=bool(geometry and geometry['passed']),previewMotionSamplingFps=6 if args.preview else 24,clips=records,flashFrames=sorted(flash),flashProjection=[json.loads(p.read_text()) for p in [OUT/'线稿映射/验证.json',OUT/'线稿映射/F0072/验证.json',OUT/'线稿映射/F0073/验证.json']],decodedRgbComparison=mae,contact=str(dest/'最终编码联系表.jpg'),note='No captions. All product geometry and materials from accepted original; each line flash uses its exact frame camera and depth-tested mesh projection. Original beauty and caches retained for review.')
(OUT/('预览索引.json' if args.preview else '交付索引.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('WIDE_ENCODED',json.dumps(result,ensure_ascii=False))
