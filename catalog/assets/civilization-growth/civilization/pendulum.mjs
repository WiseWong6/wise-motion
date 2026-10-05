import {paperRepair,line,ellipse,polygon,INK} from './ink-parts.mjs';
export const PENDULUM={x:837,y:655,length:149};
export function pendulumPose(t){const angle=.122*Math.sin(t*4.65+.18);return {angle,x:PENDULUM.x+Math.sin(angle)*PENDULUM.length,y:PENDULUM.y+Math.cos(angle)*PENDULUM.length};}
export function drawPendulum(ctx,t){
 paperRepair(ctx,c=>{c.rect(830,658,15,133);c.rect(823,677,28,62);c.moveTo(858,804);c.arc(837,804,21,0,Math.PI*2);},[814,657,47,170]);
 const p=pendulumPose(t);ctx.save();ctx.translate(PENDULUM.x,PENDULUM.y);ctx.rotate(-p.angle);
 line(ctx,[[0,0],[0,149]],2.2);line(ctx,[[-1,0],[-1,149]],.6,'#edece2');
 polygon(ctx,[[-8,26],[-11,31],[-11,76],[-6,82],[6,82],[11,76],[11,31],[8,26]],'#8a8c80',INK,1.1);
 for(let k=-8;k<=8;k+=2)line(ctx,[[k,33],[k,75]],.6,k<0?'#dddcd1':'#4a4d42');
 ellipse(ctx,0,32,10,3,null,INK,.7);ellipse(ctx,0,76,10,3,null,INK,.7);
 ellipse(ctx,0,149,17,19,'#9da091',INK,1.2);ellipse(ctx,-4.4,145,8,12,'#c5c7b9',INK,.35);
 for(let k=0;k<10;k++){const y=136+k*2.5,x=Math.sqrt(Math.max(0,17**2-((y-149)/19*17)**2));line(ctx,[[x*.43,y],[x-.8,y+1]],.55);}
 ellipse(ctx,0,0,3,3,'#55584c',INK,1);ctx.restore();
}
