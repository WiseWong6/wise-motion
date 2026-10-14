"""Rasterize only actual, depth-tested projected mesh edges; no drawn stand-ins."""
from pathlib import Path
import gzip,json,math,argparse
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
OUT=Path(__file__).resolve().parents[1];SRC=OUT/'线稿映射'
parser=argparse.ArgumentParser();parser.add_argument('--frame',type=int,default=0);args=parser.parse_args()
if args.frame:SRC=SRC/f'F{args.frame:04d}'
with gzip.open(SRC/'真实投影.json.gz','rt') as stream:data=json.load(stream)
w,h=data['width'],data['height'];ids=np.asarray(Image.open(SRC/'id.png'));depth=np.asarray(Image.open(SRC/'depth.png'),dtype=float)*128/65535
art=Image.new('RGBA',(w*2,h*2),(0,0,0,0));draw=ImageDraw.Draw(art)
visible=0
for group in data['segments']:
    for x1,y1,x2,y2,z1,z2 in group['segments']:
        parts=max(1,min(48,int(math.hypot(x2-x1,y2-y1)/6)+1))
        for i in range(parts):
            t=(i+.5)/parts;x=x1+(x2-x1)*t;y=y1+(y2-y1)*t;z=z1+(z2-z1)*t;ix=int(round(x));iy=int(round(y))
            if not 0<=ix<w or not 0<=iy<h or z>depth[iy,ix]+.026:continue
            a=i/parts;b=(i+1)/parts
            draw.line(((x1+(x2-x1)*a)*2,(y1+(y2-y1)*a)*2,(x1+(x2-x1)*b)*2,(y1+(y2-y1)*b)*2),fill=(46,59,61,225),width=2)
            visible+=1
art=art.resize((w,h),Image.Resampling.LANCZOS)
contour=np.zeros((h,w),dtype=float)
for index in np.unique(ids):
    if index==0:continue
    mask=Image.fromarray(np.uint8(ids==index)*255);inner=np.asarray(mask.filter(ImageFilter.MinFilter(3)),dtype=float)
    contour=np.maximum(contour,(np.asarray(mask,dtype=float)-inner)/255*.54)
rgba=np.zeros((h,w,4),dtype=np.uint8);rgba[:,:,:3]=[46,59,61];rgba[:,:,3]=np.uint8(contour*255)
art=Image.alpha_composite(art,Image.fromarray(rgba))
art.save(SRC/'线稿-透明.png',compress_level=3)
base=Image.new('RGBA',(w,h),(240,240,233,255));grid=Image.new('RGBA',(w,h),(0,0,0,0));gd=ImageDraw.Draw(grid)
for x in range(0,w,48):gd.line((x,0,x,h),fill=(115,139,130,16),width=1)
for y in range(0,h,48):gd.line((0,y,w,y),fill=(115,139,130,16),width=1)
base=Image.alpha_composite(base,grid);base=Image.alpha_composite(base,art).convert('RGB');base.save(SRC/'图纸-陈列-1920.png',compress_level=3)
report=json.loads((SRC/'验证.json').read_text());report.update(visibleDepthTestedSubsegments=visible,plate=str(SRC/'图纸-陈列-1920.png'),overlay=str(SRC/'线稿-透明.png'),flashFrames=[args.frame] if args.frame else [8,9,18,19],sourceGeometryFrame=args.frame,flashRegistration='Plate from the exact frame, camera and product transforms at 1920x1080; initial camera and parts are constant through0–23.')
(SRC/'验证.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('LINE_PLATE_READY',visible,str(SRC/'图纸-陈列-1920.png'))
