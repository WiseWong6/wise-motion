import {line,polygon,ellipse} from './ink-parts.mjs';
export const PISTON={x:712,y:733,radius:25,length:136};
export function pistonPose(t){const a=t*1.4,cx=PISTON.x+Math.cos(a)*PISTON.radius,cy=PISTON.y+Math.sin(a)*PISTON.radius,sx=cx-Math.sqrt(PISTON.length**2-(cy-PISTON.y)**2);return {crank:[cx,cy],slider:[sx,PISTON.y],angle:Math.atan2(cy-PISTON.y,cx-sx)};}
export function drawPiston(ctx,t){
 const p=pistonPose(t),[sx,sy]=p.slider,[cx,cy]=p.crank;
 ctx.save();polygon(ctx,[[sx-8,sy-9],[sx+9,sy-9],[sx+9,sy+9],[sx-8,sy+9]],'#92958a','#3b3e35',1.2);
 for(let y=sy-6;y<=sy+6;y+=3)line(ctx,[[sx-6,y],[sx+6,y]],.6,'#d8d9cb');
 ctx.translate(sx,sy);ctx.rotate(p.angle);polygon(ctx,[[-1,-2.4],[PISTON.length-2,-3.1],[PISTON.length+2,0],[PISTON.length-2,3.1],[-1,2.4]],'#b5b8ab','#383b32',1.05);line(ctx,[[4,-.8],[PISTON.length-5,-.8]],.75,'#eeeee4');ctx.restore();
 ellipse(ctx,sx,sy,4.5,4.5,'#767a6c','#33362e',1);ellipse(ctx,cx,cy,5.2,5.2,'#727567','#33362e',1);ellipse(ctx,cx,cy,1.6,1.6,'#c9cbbd','#33362e',.6);
}
