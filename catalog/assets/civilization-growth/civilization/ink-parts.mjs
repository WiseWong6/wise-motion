import {drawGridTexture} from '../botanical-texture.mjs';
import {TAU,rand} from '../math.mjs';
export const PLATE={width:1672,height:941,scale:360/941,x:(640-1672*360/941)/2,y:0};
export const INK='#373932',PAPER='#d9d9d2';
export function line(ctx,points,width=1,color=INK){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
export function polygon(ctx,points,fill=PAPER,stroke=INK,width=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
export function ellipse(ctx,x,y,rx,ry,fill=PAPER,stroke=INK,width=1){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
// 原图局部的边界必须回到原位，内部纹理随部件变形，不拉动相邻器物。
export function warpPatch(ctx,image,box,point,cols=8,rows=12){
 const [x,y,w,h]=box;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 drawGridTexture(ctx,image,box,(u,v)=>{const [dx,dy]=point(u,v);return [x+u*w+dx,y+v*h+dy];},cols,rows);ctx.restore();
}
// 在原版画的透视椭圆内旋转纹理，轮缘、圆心、轴座均不改变。
export function rotateDisk(ctx,image,{x,y,rx,ry,tilt=0},angle){
 ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(rx,ry);ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.clip();ctx.rotate(angle);ctx.scale(1/rx,1/ry);ctx.rotate(-tilt);ctx.translate(-x,-y);ctx.drawImage(image,0,0);ctx.restore();
}
export function diskPoint(d,a,phase=0){const x=Math.cos(a+phase)*d.rx,y=Math.sin(a+phase)*d.ry;return [d.x+x*Math.cos(d.tilt||0)-y*Math.sin(d.tilt||0),d.y+x*Math.sin(d.tilt||0)+y*Math.cos(d.tilt||0)];}
// 只修补将由代码接管的细线部件，补纸面积远小于所属器物。
export function paperRepair(ctx,path,box){ctx.save();ctx.beginPath();path(ctx);ctx.clip();ctx.fillStyle=PAPER;ctx.fillRect(...box);ctx.fillStyle='#6c6e60';for(let i=0;i<150;i++){ctx.globalAlpha=.035+rand(i+893)*.055;ctx.fillRect(box[0]+rand(i+174)*box[2],box[1]+rand(i+62)*box[3],.6,.6);}ctx.restore();}
