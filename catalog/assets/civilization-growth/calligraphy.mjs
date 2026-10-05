import {CALLIGRAPHY} from './calligraphy-data.mjs';
import {rand} from './math.mjs';
export {CALLIGRAPHY};
export const INK='#151610';
export function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function contains(glyph,x,y){let yes=false;for(const poly of CALLIGRAPHY[glyph].polys)if(inside(x,y,poly))yes=!yes;return yes;}
export function glyphPath(ctx,glyph){ctx.beginPath();for(const path of CALLIGRAPHY[glyph].paths)for(const [op,...a] of path){if(op==='M')ctx.moveTo(...a);else if(op==='L')ctx.lineTo(...a);else if(op==='Q')ctx.quadraticCurveTo(...a);else if(op==='C')ctx.bezierCurveTo(...a);else ctx.closePath();}}
export function drawCalligraphy(ctx,glyph,{opacity=1,reveal=1}={}){
 if(opacity<=0||reveal<=0)return;
 ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle=INK;
 if(reveal<1){ctx.beginPath();ctx.rect(180,45,285,275*reveal);ctx.clip();}
 glyphPath(ctx,glyph);ctx.fill('evenodd');
 // 细纸纹仅作用在真实字体内部，边缘始终采用原始贝塞尔轮廓。
 ctx.clip('evenodd');ctx.globalAlpha=opacity*.16;ctx.fillStyle='#e8e7df';ctx.beginPath();
 const ps=CALLIGRAPHY[glyph].points;
 for(let i=0;i<ps.length;i+=13){const p=ps[i];ctx.rect(p.x,p.y,.10+rand(i+713)*.22,1+rand(i+51)*2.8);}
 ctx.fill();ctx.restore();
}
