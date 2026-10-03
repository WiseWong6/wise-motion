export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const FOOT_HEIGHT=.035;
export const HOP_SCALE=Object.freeze({orb:3.3});
const smooth=p=>p*p*(3-2*p);
const planCache=new WeakMap();
export function groups(data,staff){
 const result=[];
 for(const e of data.events.filter(e=>e.staff===staff).sort((a,b)=>a.time-b.time||b.pitch-a.pitch)){
  let g=result.at(-1);if(!g||Math.abs(g.time-e.time)>1e-5){g={time:e.time,notes:[],main:e};result.push(g);}g.notes.push(e);
 }
 return result;
}
// One musical onset is one physical footfall. Drawing-specific articulation
// uses the shared supporting foot and continuous flight progress.
export function dancePlan(gs){
 let plan=planCache.get(gs);if(plan)return plan;
 const anchors=gs,steps=[];
 for(let i=0;i<anchors.length-1;i++){
  const a=anchors[i],b=anchors[i+1],duration=b.time-a.time;
  steps.push({a,b,duration,kind:'step',stepIndex:i,foot:i%2?'right':'left',hold:Math.min(.03,duration*.14),height:.72+.46*clamp((duration-.15)/.15)});
 }
 plan={anchors,steps};planCache.set(gs,plan);return plan;
}
export function ballAt(gs,t){
 const plan=dancePlan(gs),first=plan.anchors[0],last=plan.anchors.at(-1);
 if(t<first.time){
  const p=clamp((t-first.time+.166667)/.166667);
  return{x:first.main.x,z:first.main.z,y:FOOT_HEIGHT+1.8*(1-p),alpha:smooth(p),phase:0,flight:0,grounded:false,kind:'entrance',stepIndex:-1,foot:'left',swing:0};
 }
 if(t>=last.time){
  const fade=clamp((t-last.time-Math.max(.35,...last.notes.map(n=>n.duration)))/1.2);
  return{x:last.main.x,z:last.main.z,y:FOOT_HEIGHT,alpha:1-smooth(fade),phase:1,flight:0,grounded:true,kind:'finish',stepIndex:plan.steps.length,foot:plan.steps.length%2?'right':'left',swing:0};
 }
 let i=0;while(i<plan.steps.length-1&&plan.steps[i+1].a.time<=t)i++;
 const step=plan.steps[i],{a,b,duration,height,kind,foot,hold}=step,elapsed=t-a.time,phase=clamp(elapsed/duration);
 if(elapsed<=hold)return{x:a.main.x,z:a.main.z,y:FOOT_HEIGHT,alpha:1,phase,contact:clamp(elapsed/hold),flight:0,grounded:true,kind,stepIndex:i,foot,swing:0};
 const q=clamp((elapsed-hold)/(duration-hold)),travel=smooth(q);
 return{x:a.main.x+(b.main.x-a.main.x)*travel,z:a.main.z+(b.main.z-a.main.z)*travel,y:FOOT_HEIGHT+4*height*q*(1-q),alpha:1,phase,flight:q,grounded:false,kind,stepIndex:i,foot,swing:Math.sin(Math.PI*q)};
}
// All appearances share note times and contact points, but their jump silhouettes
// need different clearance. The same sampler also drives the actual light trail.
export function variantAt(gs,t,variant='butterfly'){
 if(variant==='butterfly')return flightAt(gs,t);
 const state=ballAt(gs,t),scale=HOP_SCALE[variant]??1;
 const index=Math.max(0,Math.min(gs.length-1,state.stepIndex));
 const bearing=k=>{
  const a=gs[Math.max(0,k-1)].main,b=gs[Math.min(gs.length-1,k+1)].main;
  return clamp((b.z-a.z)/Math.max(.001,b.x-a.x),-.65,.65);
 };
 const blend=state.kind==='step'?smooth(state.flight):0;
 const slope=bearing(index)+(bearing(Math.min(gs.length-1,index+1))-bearing(index))*blend;
 return{...state,heading:Math.atan(slope),y:FOOT_HEIGHT+(state.y-FOOT_HEIGHT)*(state.kind==='step'?scale:1)};
}
// Pass over every musical onset without landing, braking or restarting the wings.
// Shape-preserving interpolation gives adjacent segments the same velocity.
export function flightAt(gs,t){
 const first=gs[0],last=gs.at(-1),offset=first.main.staff*.7;
 let i=0;while(i<gs.length-2&&gs[i+1].time<=t)i++;
 const a=gs[i],b=gs[i+1],dt=b.time-a.time,u=clamp((t-a.time)/dt);
 const component=axis=>{
  const speed=k=>(gs[k+1].main[axis]-gs[k].main[axis])/(gs[k+1].time-gs[k].time);
  const slope=k=>{
   if(k===0)return speed(0);if(k===gs.length-1)return speed(k-1);
   const left=speed(k-1),right=speed(k);if(left*right<=0)return 0;
   const prev=gs[k].time-gs[k-1].time,next=gs[k+1].time-gs[k].time;
   return 3*(prev+next)/((2*next+prev)/left+(next+2*prev)/right);
  };
  const p=a.main[axis],q=b.main[axis],m=slope(i)*dt,n=slope(i+1)*dt;
  if(t<first.time)return{value:first.main[axis]+(t-first.time)*slope(0),velocity:slope(0)};
  if(t>last.time)return{value:last.main[axis]+slope(gs.length-1)*.45*(1-Math.exp(-(t-last.time)/.45)),velocity:slope(gs.length-1)*Math.exp(-(t-last.time)/.45)};
  return{value:(2*u*u*u-3*u*u+1)*p+(u*u*u-2*u*u+u)*m+(-2*u*u*u+3*u*u)*q+(u*u*u-u*u)*n,
   velocity:((6*u*u-6*u)*p+(3*u*u-4*u+1)*m+(-6*u*u+6*u)*q+(3*u*u-2*u)*n)/dt};
 };
 const x=component('x'),z=component('z'),end=last.time+Math.max(.35,...last.notes.map(n=>n.duration));
 return{x:x.value,z:z.value,y:1.65+.22*Math.sin(t*2.7+offset),heading:Math.atan2(z.velocity,x.velocity),
  alpha:smooth(clamp((t-first.time+.4)/.4))*(1-smooth(clamp((t-end)/1.2))),
  phase:u,flight:u,grounded:false,kind:'fly',stepIndex:i,foot:'left',swing:0};
}
// A continuous score cursor drives the camera independently of the dancer's holds and jumps.
function scoreCursor(gs,t){
 if(t<=gs[0].time)return gs[0].main.x;
 if(t>=gs.at(-1).time)return gs.at(-1).main.x;
 let i=0;while(i<gs.length-2&&gs[i+1].time<=t)i++;
 const a=gs[i],b=gs[i+1],dt=b.time-a.time,p=clamp((t-a.time)/dt),p2=p*p,p3=p2*p;
 const speed=k=>(gs[k+1].main.x-gs[k].main.x)/(gs[k+1].time-gs[k].time);
 const slope=k=>{if(k===0||k===gs.length-1)return 0;const u=speed(k-1),v=speed(k);return u*v<=0?0:2*u*v/(u+v);};
 return(2*p3-3*p2+1)*a.main.x+(p3-2*p2+p)*dt*slope(i)+(-2*p3+3*p2)*b.main.x+(p3-p2)*dt*slope(i+1);
}
export function cameraPose(data,t){
 const voices=[groups(data,1),groups(data,2)];let cx=0;
 for(let j=0;j<25;j++)for(const gs of voices)cx+=scoreCursor(gs,clamp(t+(j-12)*.04,0,data.musicEnd))/50;
 // Only advance along the score; keep the composition steady through every jump.
 const cz=(Math.min(...data.events.map(e=>e.z))+Math.max(...data.events.map(e=>e.z)))/2;
 return{position:[cx-10,42,cz+54],target:[cx,0,cz],fov:42,roll:-.16};
}
