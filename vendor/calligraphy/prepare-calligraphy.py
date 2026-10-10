# Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
# 字库及派生字形数据保留 GPL-2.0-or-later。
from pathlib import Path
import argparse,hashlib,json
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
base=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description='从已署名的 I.顏體生成四字轮廓和墨点，不联网。')
parser.add_argument('--font',type=Path,default=base/'I.Ngaan.ttf')
parser.add_argument('--output',type=Path,default=base.parents[1]/'catalog/assets/civilization-growth/calligraphy-data.mjs')
parser.add_argument('--check',action='store_true',help='仅比较现有输出，不修改文件')
args=parser.parse_args()
if hashlib.sha256(args.font.read_bytes()).hexdigest()!='7aba8f5bb77ea7e0fc37c0e5e709bd8e1d49b44a3c91eb503f426562602f9c2a':
 raise SystemExit('输入字库与登记版本不一致')
font=TTFont(args.font); gs=font.getGlyphSet()
class Outline(BasePen):
 def __init__(self,gs): super().__init__(gs);self.paths=[];self.p=[];self.points=[];self.polys=[];self.current=None
 def _moveTo(self,p):self.p=[['M',*p]];self.points=[p];self.current=p
 def _lineTo(self,p):self.p.append(['L',*p]);self.points.append(p);self.current=p
 def _qCurveToOne(self,a,b):
  self.p.append(['Q',*a,*b]);p=self.current
  for i in range(1,13):
   t=i/12;q=1-t;self.points.append((q*q*p[0]+2*q*t*a[0]+t*t*b[0],q*q*p[1]+2*q*t*a[1]+t*t*b[1]))
  self.current=b
 def _curveToOne(self,a,b,c):
  self.p.append(['C',*a,*b,*c]);p=self.current
  for i in range(1,17):
   t=i/16;q=1-t;self.points.append((q*q*q*p[0]+3*q*q*t*a[0]+3*q*t*t*b[0]+t*t*t*c[0],q*q*q*p[1]+3*q*q*t*a[1]+3*q*t*t*b[1]+t*t*t*c[1]))
  self.current=c
 def _closePath(self):self.p.append(['Z']);self.paths.append(self.p);self.polys.append(self.points)
 def _endPath(self):self._closePath()
def inside(x,y,ps):
 yes=False
 for poly in ps:
  a=poly[-1]
  for b in poly:
   if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:yes=not yes
   a=b
 return yes
out={}
for char in '火炎焱燚':
 glyph=gs[font.getBestCmap()[ord(char)]];bp=BoundsPen(gs);glyph.draw(bp);x0,y0,x1,y1=bp.bounds;s=246/max(x1-x0,y1-y0);cx=(x0+x1)/2;cy=(y0+y1)/2
 def xy(x,y):return [round(320+(x-cx)*s,4),round(180-(y-cy)*s,4)]
 pen=Outline(gs);glyph.draw(pen)
 paths=[]
 for path in pen.paths:
  commands=[]
  for cmd in path:
   c=[cmd[0]]
   for j in range(1,len(cmd),2):c+=xy(cmd[j],cmd[j+1])
   commands.append(c)
  paths.append(commands)
 polys=[[xy(*p) for p in poly] for poly in pen.polys]
 def unit(x,y):return 0 if char=='火' else (int(y>=180) if char=='炎' else (0 if y<164 else 1+int(x>=320)) if char=='焱' else int(y>=180)*2+int(x>=320))
 points=[]
 for row in range(169):
  y=54+row*1.5
  for col in range(169):
   x=194+col*1.5
   if inside(x,y,polys):points.append({'x':x,'y':y,'unit':unit(x,y)})
 out[char]={'paths':paths,'polys':polys,'points':points,'units':len(set(p['unit'] for p in points)),'glyph':font.getBestCmap()[ord(char)]}
 print(char,'轮廓',len(paths),'墨点',len(points),'火部件',out[char]['units'])
generated=('// I.顏體真实字库轮廓，GPL-2.0-or-later；由prepare-calligraphy.py提取，非手工拼字。\nexport const CALLIGRAPHY='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
if args.check:
 if args.output.read_text()!=generated:raise SystemExit('当前数据与公开生成材料不一致')
 print('四字轮廓和墨点与公开生成材料完全一致。')
else:
 args.output.write_text(generated,encoding='utf-8')
 print(args.output)
