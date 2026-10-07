/* 返场：一把定尺寸的伞，所有姿态均由绝对播放时间计算。 */
'use strict';
window.EncoreDance = (() => {
  const U=window.EncoreUmbrella, music=window.ENCORE_MUSIC, TAU=Math.PI*2;
  const W=1280,H=800,FLOOR=650,duration=music.duration;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,u)=>a+(b-a)*u;
  const smooth=u=>{u=clamp(u);return u*u*u*(10+u*(-15+6*u));};
  const easeRun=(u,r=.18)=>{
    u=clamp(u);
    if(u<r)return (u-r/Math.PI*Math.sin(Math.PI*u/r))/(2*(1-r));
    if(u>1-r)return 1-easeRun(1-u,r);
    return (u-r/2)/(1-r);
  };
  const beat=target=>music.beats.reduce((a,b)=>Math.abs(b-target)<Math.abs(a-target)?b:a,music.beats[0]);
  const pace=duration/26.97;
  const T={twirl:beat(3.55*pace),drop:beat(4.44*pace),tap:beat(8.94*pace),throw:beat(12.50*pace),pin:beat(16.0*pace),roll:beat(19.6*pace),final:music.lastAccent};
  const pieces=[],impacts=[],rollingRipples=[],markers=[];
  const pose=(x,y,angle,roll=0)=>({x,y,angle,roll});
  const ground=(x,angle,roll=0)=>pose(x,FLOOR-U.support(angle,roll).y,angle,roll);
  const pivotPose=(pivot,local,angle,roll=0)=>{const q=U.rotate(local,angle);return pose(pivot[0]-q[0],pivot[1]-q[1],angle,roll);};
  const add=(name,start,end,fn,kind)=>{
    const item={name,start,end,fn,kind};pieces.push(item);markers.push({name,start,end,kind});return fn(end);
  };
  const note=(time,p,strength=1)=>{const s=U.support(p.angle,p.roll);impacts.push({time,x:p.x+s.x,y:p.y+s.y,strength});};
  let current=add('绕钩三连转',0,T.twirl,t=>{
    const u=t/T.twirl,e=smooth(u),angle=mix(-.32,3*TAU+.15,easeRun(u));
    return pivotPose([mix(480,440,e),mix(352,365,e)],U.hookCenter,angle);
  },'hook-spin');
  function descend(name,start,end,a,b){
    const dt=end-start;
    const result=add(name,start,end,t=>{const u=clamp((t-start)/dt);return pose(mix(a.x,b.x,smooth(u)),mix(a.y,b.y,u*u),mix(a.angle,b.angle,smooth(u)),a.roll);},'descent');
    note(end,b,1.3);return result;
  }
  current=descend('顺势落地',T.twirl,T.drop,current,ground(480,3*TAU+.26));
  function taps(name,start,end,a,toX,finalAngle){
    const times=[start,...music.beats.filter(t=>t>start+.15&&t<end-.1),end];
    const positions=times.map((t,i)=>{
      const u=i/(times.length-1),x=mix(a.x,toX,smooth(u))+(i===0||i===times.length-1?0:(i%2?-12:12));
      const angle=i===0?a.angle:i===times.length-1?finalAngle:(Math.round(a.angle/TAU)*TAU+(i%2?-.34:.38));
      return ground(x,angle,a.roll);
    });
    for(let i=1;i<times.length;i++)note(times[i],positions[i],i===times.length-1?1.2:.6+(i%3)*.12);
    return add(name,start,end,t=>{
      let i=0;while(i+2<times.length&&t>=times[i+1])i++;
      const p=positions[i],q=positions[i+1],hold=.045,dt=times[i+1]-times[i],u=clamp((t-times[i]-hold)/(dt-hold));
      const e=smooth(u),height=17+(i%3)*9;
      return pose(mix(p.x,q.x,e),mix(p.y,q.y,e)-4*height*u*(1-u),mix(p.angle,q.angle,e),a.roll);
    },'tap');
  }
  current=taps('碎步踩水',T.drop,T.tap,current,870,3*TAU+.12);
  function flight(name,start,end,a,b,height,kind='flight'){
    const dt=end-start;
    const result=add(name,start,end,t=>{
      const u=clamp((t-start)/dt),e=easeRun(u,.22);
      // 恒定重力的抛物线；旋转不改变质心路径，也不修改伞的尺寸。
      return pose(mix(a.x,b.x,u),mix(a.y,b.y,u)-4*height*u*(1-u),mix(a.angle,b.angle,e),mix(a.roll,b.roll,smooth(u)));
    },kind);
    if(Math.abs(U.bounds(b).maxY-FLOOR)<.01)note(end,b,1.65);
    return result;
  }
  current=flight('腾空翻转，伞尖落点',T.tap,T.throw,current,ground(350,5.5*TAU),235);
  const pinStart=current,tip=[0,-U.L/2],pin=[current.x,FLOOR];
  current=add('伞尖支撑，伞面回旋',T.throw,T.pin,t=>{
    const u=clamp((t-T.throw)/(T.pin-T.throw));
    const wobble=.125*Math.sin(4*Math.PI*u)*Math.sin(Math.PI*u)**2;
    return pivotPose(pin,tip,pinStart.angle+wobble,pinStart.roll+4*TAU*easeRun(u));
  },'tip-spin');
  // 依照实际外轮廓滚动。位移是接触点高度对转角的积分，不能原地擦地旋转。
  const rollStart=current,rollAngle=1.5*Math.PI,steps=1800,dist=[0];
  for(let i=1;i<=steps;i++){
    const a=rollStart.angle+rollAngle*(i-.5)/steps;
    dist.push(dist.at(-1)+U.support(a,rollStart.roll).y*rollAngle/steps);
  }
  const distance=u=>{const n=clamp(u)*steps,i=Math.min(steps-1,Math.floor(n));return mix(dist[i],dist[i+1],n-i);};
  current=add('沿伞沿滚过水面',T.pin,T.roll,t=>{
    const u=clamp((t-T.pin)/(T.roll-T.pin)),e=easeRun(u,.2),angle=rollStart.angle+rollAngle*e;
    return ground(rollStart.x+distance(e),angle,rollStart.roll);
  },'ground-roll');
  for(let t=T.pin+.15;t<T.roll;t+=.16){const p=pieces.at(-1).fn(t),s=U.support(p.angle,p.roll);rollingRipples.push({time:t,x:p.x+s.x,y:FLOOR,strength:.16,rolling:true});}
  const settle=beat(23.13*pace);
  current=flight('反弹飞旋，回到中央落地',T.roll,settle,current,ground(650,9*TAU+.20,current.roll),235,'return-flight');
  current=taps('轻踏尾句，收住最后一拍',settle,T.final,current,630,9*TAU-.08);
  const bow=current,bowSupport=U.support(bow.angle,bow.roll);
  current=add('鞠躬与余韵',T.final,duration,t=>{
    const u=clamp((t-T.final)/(duration-T.final)),angle=bow.angle-.24*Math.sin(Math.PI*smooth(u))**2;
    // 沿弯钩小幅滚动完成鞠躬，竖向始终由同一外轮廓决定。
    return ground(bow.x+bowSupport.y*(angle-bow.angle),angle,bow.roll);
  },'bow');
  function sample(t){
    t=clamp(Number.isFinite(t)?t:0,0,duration);
    const part=pieces.find(p=>t<p.end)||pieces.at(-1);
    return {...part.fn(t),time:t,phase:part.name,kind:part.kind};
  }
  return Object.freeze({duration,W,H,FLOOR,T,markers,impacts,rollingRipples,sample,pieces});
})();
