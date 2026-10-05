import {ROOTS,SEED_DURATION,seedPose,drawOneSeed} from './fire-05.mjs';
import {GROWTH_REGIONS} from './growth-regions.mjs';
import {drawGridTexture} from './botanical-texture.mjs';
import {INK} from './calligraphy.mjs';
import {smooth,mix,rand} from './math.mjs';
export const SPROUT_DURATION=1.5;
export const PLANTS=ROOTS.map((x,c)=>({id:c,x,y:280,height:[64,75,68,71][c],lean:[-13,7,-10,12][c]}));
export function sproutState(t,c){return {stem:smooth(t,.13+c*.035,1.08+c*.04),leaves:smooth(t,.49+c*.035,1.30+c*.045),roots:smooth(t,.12+c*.02,.74+c*.04),crack:smooth(t,.05,.55),shell:1-smooth(t,.60,1.45)*.82};}
export function stemPoint(c,u,{growth=1,elongation=0,clock=9.3}={}){
 const p=PLANTS[c],h=(p.height+elongation*[53,54,57,55][c])*growth,lean=p.lean*(1+elongation*.35),hook=(1-growth)*growth*29*u**3,wind=Math.sin(clock*1.9+c*1.3)*2.6*u*u*growth;
 return [p.x+lean*(3*u*u-2*u*u*u)*growth+Math.sin(Math.PI*u)*(c%2?5:-5)*growth+hook+wind,p.y-h*u+(1-growth)*growth*17*u**4];
}
export function leafPoint(u,v,{length,width,open=1,clock=0,phase=0}={}){const q=1-v,bend=Math.sin(clock*2.2+phase)*length*.095*q*q;return [(u-.5)*width*(.25+.75*open)+bend,-q*length*(.30+.70*open)+(1-open)*q*q*q*length*.34+Math.sin(clock*1.7+phase)*q*q*1.1];}
export function leafPose(c,k,clock,open=1){return {angle:(k===0?-1.05:.91)+Math.sin(clock*1.55+c+k*.7)*.065+(1-open)*(k===0?.48:-.48),phase:c*.8+k*1.7};}
export function drawLeaf(ctx,x,y,length,width,angle,{assets,variant=0,clock=0,open=1,phase=0}={}){
 if(length<=.001||width<=.001||open<=0)return;if(!assets?.growth)throw new Error('叶片版画尚未准备完成');ctx.save();ctx.translate(x,y);ctx.rotate(angle);drawGridTexture(ctx,assets.growth,GROWTH_REGIONS[4+variant%4].source,(u,v)=>leafPoint(u,v,{length,width,open,clock,phase}),3,7);ctx.restore();
}
export function drawRoots(ctx,c,g){
 if(g<=0)return;const p=PLANTS[c];ctx.save();ctx.strokeStyle=INK;ctx.globalAlpha*=.73;ctx.lineCap='round';
 for(let k=0;k<5;k++){const reach=(k-2)*6.8,depth=(k===2?33:18+rand(c*39+k+77)*12)*g;ctx.lineWidth=k===2?.65:.38;ctx.beginPath();ctx.moveTo(p.x,p.y+2);ctx.bezierCurveTo(p.x+reach*.1,p.y+depth*.22,p.x+reach*.7,p.y+depth*.61,p.x+reach*g,p.y+depth);ctx.stroke();
  for(let j=1;j<5;j++){const q=j/6,xx=p.x+reach*q*g,yy=p.y+depth*q;ctx.lineWidth=.24;ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx+(k%2?3:-3)*g,yy+2,xx+(k%2?6:-6)*g,yy+5*g);ctx.stroke();}
 }ctx.restore();
}
export function drawShoot(ctx,c,{growth=1,leaves=1,roots=1,elongation=0,clock=9.3,assets}={}){
 if(growth<=0&&roots<=0)return;drawRoots(ctx,c,roots);if(growth<=0)return;const options={growth,elongation,clock},points=Array.from({length:29},(_,i)=>stemPoint(c,i/28,options));ctx.save();ctx.fillStyle='#434737';ctx.strokeStyle=INK;ctx.lineWidth=.22;ctx.beginPath();
 points.forEach(([x,y],i)=>{const w=(1-i/28)*.62+.21;i?ctx.lineTo(x-w,y):ctx.moveTo(x-w,y);});for(let i=28;i>=0;i--){const [x,y]=points[i],w=(1-i/28)*.62+.21;ctx.lineTo(x+w,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#969b86';ctx.lineWidth=.28;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
 if(leaves>0)for(let k=0;k<2;k++){const u=k===0?.46:.73,[x,y]=stemPoint(c,u,options),pose=leafPose(c,k,clock,leaves);drawLeaf(ctx,x,y,(31+c%2*5)*(1+elongation*.27),(15+c%2*3)*(1+elongation*.18),pose.angle,{assets,variant:c,clock,open:leaves,phase:pose.phase});}
 ctx.restore();
}
export function drawSprouts(ctx,assets,t){
 for(let c=0;c<4;c++){const s=sproutState(t,c);drawOneSeed(ctx,seedPose(SEED_DURATION,c),{opacity:s.shell,crack:s.crack,assets});}
 for(let c=0;c<4;c++){const s=sproutState(t,c);drawShoot(ctx,c,{growth:s.stem,leaves:s.leaves,roots:s.roots,clock:7.8+t,assets});}
}
