/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 雨中曲返场：迁入原伞面、编舞与场景绘制，保留原曲线和落地点；不加载音频。 */
(function(global){
 'use strict';
 const local={};
 function recorder(){
  let state,stack,path,defs,shapes,prefix;
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  const ctx={
   reset(id){prefix=id;state={transform:'',clips:[],globalAlpha:1,fillStyle:'#000',strokeStyle:'#000',lineWidth:1,lineCap:'butt',lineJoin:'miter'};stack=[];path='';defs=[];shapes=[];},
   save(){stack.push({...state,clips:[...state.clips]});},restore(){state=stack.pop();},
   setTransform(a,b,c,d,e,f){state.transform=`matrix(${a} ${b} ${c} ${d} ${e} ${f})`;},
   translate(x,y){state.transform+=` translate(${x} ${y})`;},scale(x,y){state.transform+=` scale(${x} ${y})`;},rotate(a){state.transform+=` rotate(${a*180/Math.PI})`;},
   beginPath(){path='';},moveTo(x,y){path+=`M${x} ${y}`;},lineTo(x,y){path+=`L${x} ${y}`;},
   rect(x,y,w,h){path+=`M${x} ${y}h${w}v${h}h${-w}Z`;},
   ellipse(x,y,rx,ry,rotation,start,end){
    if(rotation!==0||Math.abs(end-start-Math.PI*2)>1e-6)throw Error('雨中曲仅使用完整椭圆。');
    path+=`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0Z`;
   },arc(x,y,r,start,end){ctx.ellipse(x,y,r,r,0,start,end);},
   clip(){const id=prefix+'-clip-'+defs.length;defs.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${path}" transform="${state.transform}"/></clipPath>`);state.clips.push(id);},
   fill(){shape(path,false);},stroke(){shape(path,true);},fillRect(x,y,w,h){shape(`M${x} ${y}h${w}v${h}h${-w}Z`,false);},
   createRadialGradient(x0,y0,r0,x1,y1,r1){
    const id=prefix+'-gradient-'+defs.length,at=defs.length,stops=[];defs.push('');
    return {addColorStop(offset,color){stops.push(`<stop offset="${offset}" stop-color="${esc(color)}"/>`);defs[at]=`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" fx="${x0}" fy="${y0}" fr="${r0}" cx="${x1}" cy="${y1}" r="${r1}" gradientTransform="${state.transform}">${stops.join('')}</radialGradient>`;},toString(){return `url(#${id})`;}};
   },markup(){return `<defs>${defs.join('')}</defs><g data-part="scene">${shapes.join('')}</g>`;}
  };
  for(const key of ['globalAlpha','fillStyle','strokeStyle','lineWidth','lineCap','lineJoin'])Object.defineProperty(ctx,key,{get:()=>state[key],set:v=>{state[key]=v;}});
  function shape(d,stroke){
   const paint=stroke?`fill="none" stroke="${esc(state.strokeStyle)}" stroke-width="${state.lineWidth}" stroke-linecap="${state.lineCap}" stroke-linejoin="${state.lineJoin}"`:`fill="${esc(state.fillStyle)}"`;
   let s=`<path d="${d}" transform="${state.transform}" opacity="${state.globalAlpha}" ${paint}/>`;
   for(const id of state.clips)s=`<g clip-path="url(#${id})">${s}</g>`;shapes.push(s);
  }
  ctx.reset('initial');return ctx;
 }
 const drawing=recorder();
 const sourceCanvas={width:1280,height:800,getContext:()=>drawing};

local.ENCORE_MUSIC={"duration": 28.52, "beats": [0.024, 0.443, 0.867, 1.286, 1.75, 2.134, 2.568, 2.972, 3.376, 3.81, 4.234, 4.678, 5.077, 5.501, 5.916, 6.35, 6.789, 7.233, 7.657, 8.066, 8.555, 8.914, 9.373, 9.847, 10.375, 10.809, 11.233, 11.692, 12.191, 12.61, 13.064, 13.508, 13.962, 14.376, 14.815, 15.244, 15.688, 16.147, 16.571, 17.0, 17.414, 17.808, 18.223, 18.617, 19.041, 19.465, 19.894, 20.333, 20.752, 21.141, 21.525, 21.919, 22.363, 22.827, 23.276, 23.695, 24.129, 24.543, 24.952, 25.396, 25.815, 26.204, 26.618, 27.062, 27.491], "lastAccent": 27.491};

/* 固定尺寸的圆弧伞面。采用同一平行投影，深度只决定遮挡，不改变大小。 */
'use strict';
local.EncoreUmbrella = (() => {
  const L = 240, R = L * .613, H = L * .32, tilt = 1.18;
  const sin = Math.sin(tilt), cos = Math.cos(tilt), crown = -.435 * L;
  const N = 128, M = 20, TAU = 2 * Math.PI, curvature = H / (R * R);
  // 从略高于伞沿的位置看向伞顶。较小的 z 靠近观众。
  const project = (x, q, height) => [x, crown + q * cos + height * sin, -q * sin + height * cos];
  function surface(phi, u, roll = 0) {
    const a = phi + roll, radius = R * u;
    return project(radius * Math.cos(a), radius * Math.sin(a), H * u * u);
  }
  const shaftPoint = y => [0, y, (y - crown) * cos / sin];
  const shaft = Array.from({length:65}, (_, i) => shaftPoint(L / 2 - L * i / 64));
  const hook = Array.from({length:33}, (_, i) => {
    const a = Math.PI * i / 32, y = L * .5 + L * .058 * Math.sin(a);
    return [-L * .058 * (1 - Math.cos(a)), y, (y - crown) * cos / sin];
  });
  hook.push([-L * .116, L * .478, (L * .478 - crown) * cos / sin]);
  const hookCenter = [-L * .058, L * .5];

  // 沿视线与圆抛物面求交，直接找前方伞布，避免粗网格容差造成背线漏出。
  function visible(p) {
    const [x, y, z] = p, a = curvature * sin;
    const discriminant = cos * cos - 4 * a * (a * x * x - (y - crown));
    if (discriminant < -1e-9) return true;
    const root = Math.sqrt(Math.max(0, discriminant));
    for (const q of [(-cos + root) / (2 * a), (-cos - root) / (2 * a)]) {
      if (x * x + q * q > R * R + 1e-7) continue;
      const depth = -q * sin + curvature * (x * x + q * q) * cos;
      if (depth < z - 1e-7) return false;
    }
    return true;
  }
  const vertices = [[0, crown, 0]];
  for (let j = 1; j <= M; j++) for (let k = 0; k < N; k++) vertices.push(surface(k * TAU / N, j / M));
  const outline = [], rim = [], silhouette = [];
  function contour(pointAt, steps, target) {
    let a = pointAt(0); vertices.push(a);
    for (let i = 1; i <= steps; i++) {
      const b = pointAt(i / steps); vertices.push(b);
      const edge = [a, b]; target.push(edge); outline.push(edge); a = b;
    }
  }
  // 真正的外轮廓位于曲面与视线相切处；它不是第二道透过伞布的后伞沿。
  const tangentQ = -cos / (2 * curvature * sin);
  const rimStart = Math.asin(tangentQ / R), tangentX = Math.sqrt(R * R - tangentQ * tangentQ);
  contour(u => surface(rimStart + (Math.PI - 2 * rimStart) * u, 1), 160, rim);
  contour(u => {
    const x = tangentX * (2 * u - 1);
    return project(x, tangentQ, curvature * (x * x + tangentQ * tangentQ));
  }, 96, silhouette);

  function hullOf(points) {
    const list = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const lo = [], hi = [];
    for (const p of list) { while (lo.length > 1 && cross(lo.at(-2), lo.at(-1), p) <= 0) lo.pop(); lo.push(p); }
    for (const p of list.slice().reverse()) { while (hi.length > 1 && cross(hi.at(-2), hi.at(-1), p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  const hull = hullOf([...vertices, ...shaft, ...hook].map(p => p.slice(0, 2)));
  const base = {vertices, hull, outline, visible};
  // 圆弧外形自转后不变，只有布面上的骨线改变位置；不会为了自转重新缩放。
  const geometry = () => base;
  function rotate(p, angle) { const c = Math.cos(angle), s = Math.sin(angle); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  function world(p, pose) { const q = rotate(p, pose.angle); return [q[0] + pose.x, q[1] + pose.y]; }
  function support(angle) {
    let best = [0, -Infinity], local = null;
    for (const p of hull) { const q = rotate(p, angle); if (q[1] > best[1]) { best = q; local = p; } }
    return {x:best[0], y:best[1], local};
  }
  function bounds(pose) {
    const ps = hull.map(p => world(p, pose));
    return {minX:Math.min(...ps.map(p => p[0])), maxX:Math.max(...ps.map(p => p[0])), minY:Math.min(...ps.map(p => p[1])), maxY:Math.max(...ps.map(p => p[1]))};
  }
  function stroke(ctx, pointAt, steps, width, opacity) {
    ctx.globalAlpha = opacity; ctx.lineWidth = width; ctx.beginPath();
    let a = pointAt(0), aVisible = visible(a);
    for (let i = 1; i <= steps; i++) {
      const b = pointAt(i / steps), bVisible = visible(b);
      let start = a, end = b;
      if (aVisible !== bVisible) {
        let lo = (i - 1) / steps, hi = i / steps;
        for (let j = 0; j < 22; j++) {
          const mid = (lo + hi) / 2;
          if (visible(pointAt(mid)) === aVisible) lo = mid; else hi = mid;
        }
        const edge = pointAt((lo + hi) / 2);
        if (aVisible) end = edge; else start = edge;
      }
      if (aVisible || bVisible) { ctx.moveTo(start[0], start[1]); ctx.lineTo(end[0], end[1]); }
      a = b; aVisible = bVisible;
    }
    ctx.stroke();
  }
  function draw(ctx, pose, opacity = 1) {
    const roll = pose.roll || 0;
    ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate(pose.angle);
    ctx.strokeStyle = '#fffcef'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    stroke(ctx, u => shaftPoint(L / 2 - L * u), 96, 2.35, opacity);
    stroke(ctx, u => {
      const i = Math.min(hook.length - 2, Math.floor(u * (hook.length - 1))), t = u * (hook.length - 1) - i;
      return hook[i].map((v, j) => v + (hook[i + 1][j] - v) * t);
    }, 66, 2.65, opacity);
    for (let i = 0; i < 8; i++) {
      stroke(ctx, u => surface(i * TAU / 8, u, roll), 72, i === 0 ? 1.75 : 1.05, opacity * (i === 0 ? .96 : .57));
    }
    ctx.globalAlpha = opacity;
    for (const [edges, width] of [[silhouette, 1.7], [rim, 1.95]]) {
      ctx.lineWidth = width; ctx.beginPath();
      for (const [a, b] of edges) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      ctx.stroke();
    }
    const seam = surface(0, 1, roll);
    if (visible(seam)) { ctx.globalAlpha = opacity; ctx.fillStyle = '#fffcef'; ctx.beginPath(); ctx.arc(seam[0], seam[1], 2.25, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  return Object.freeze({L, R, H, tilt, hookCenter, shaft, hook, hull, outline, surface, geometry, world, rotate, support, bounds, draw});
})();

/* 返场：一把定尺寸的伞，所有姿态均由绝对播放时间计算。 */
'use strict';
local.EncoreDance = (() => {
  const U=local.EncoreUmbrella, music=local.ENCORE_MUSIC, TAU=Math.PI*2;
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

/* 静态相机；画布只在窗口改变时等比适配。雨、水花、轨迹和舞者共用时间。 */
'use strict';
local.EncoreScene = (() => {
  const canvas=sourceCanvas,ctx=sourceCanvas.getContext('2d');
  const D=local.EncoreDance,U=local.EncoreUmbrella,TAU=Math.PI*2;
  const random=i=>{const n=Math.sin(i*127.1+91.7)*43758.5453;return n-Math.floor(n);};
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const emissions=[];
  for(let t=.1;t<D.duration;t+=.071){
    const p=D.sample(t),a=D.sample(Math.max(0,t-.001));
    if(Math.abs((p.angle-a.angle)/.001)<3||p.kind==='ground-roll')continue;
    const i=emissions.length,phi=i%2?0:Math.PI,local=U.surface(phi,1,p.roll),q=U.world(local,p),prev=U.world(U.surface(phi,1,a.roll),a);
    emissions.push({time:t,x:q[0],y:q[1],vx:(q[0]-prev[0])/.001*.28,vy:(q[1]-prev[1])/.001*.28,index:i});
  }
  function resize(){
    const r=canvas.getBoundingClientRect(),dpr=Math.min(local.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));
  }
  function stroke(points,color,width=1,alpha=1){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.beginPath();
    for(let i=0;i<points.length;i++)i?ctx.lineTo(...points[i]):ctx.moveTo(...points[i]);ctx.stroke();
  }
  function rain(t){
    for(let i=0;i<82;i++){
      const speed=170+random(i+600)*140;
      const y=((t*speed+random(i+100)*920)%920)-180;
      const x=random(i+200)*1360-40+(y-300)*-.055;
      stroke([[x,y],[x-1.5,y+10+random(i+300)*12]],'#d1dfff',.8,.09+random(i+400)*.08);
    }
  }
  function water(t){
    ctx.strokeStyle='#c4d3ff';ctx.lineWidth=.75;
    for(const [i,x,r] of [[0,335,152],[1,645,170],[2,945,137]]){
      ctx.globalAlpha=.085;ctx.beginPath();ctx.ellipse(x,D.FLOOR+7+i*2,r,12+i*3,0,0,TAU);ctx.stroke();
      ctx.globalAlpha=.045;ctx.beginPath();ctx.ellipse(x,D.FLOOR+9+i*2,r*.79,8+i*2,0,0,TAU);ctx.stroke();
    }
    for(const hit of [...D.impacts,...D.rollingRipples]){
      const age=t-hit.time;if(age<0||age>1.2)continue;
      const strength=hit.strength,fade=Math.pow(1-age/1.2,2);
      ctx.strokeStyle='#e8eaff';ctx.globalAlpha=.4*strength*fade;ctx.lineWidth=.9;
      ctx.beginPath();ctx.ellipse(hit.x,hit.y+1,4+age*(75+strength*24),2+age*13,0,0,TAU);ctx.stroke();
      if(age>.06){ctx.globalAlpha=.18*strength*fade;ctx.beginPath();ctx.ellipse(hit.x,hit.y+2,age*55,age*8,0,0,TAU);ctx.stroke();}
      if(!hit.rolling&&age<.65)for(let j=0;j<9;j++){
        const seed=hit.time*11+j,vx=(random(seed)-.5)*220*strength,vy=-(85+random(seed+20)*95)*Math.sqrt(strength);
        const x=hit.x+vx*age,y=hit.y+vy*age+310*age*age;
        if(y>hit.y+1)continue;
        stroke([[x,y],[x-vx*.015,y-(vy+620*age)*.015]],'#e7f5ff',1.25,.65*fade*Math.min(1,strength));
      }
    }
  }
  function shedWater(t){
    for(const e of emissions){
      const age=t-e.time;if(age<0||age>.54)continue;
      const x=e.x+e.vx*age,y=e.y+e.vy*age+300*age*age;
      if(y>D.FLOOR)continue;
      stroke([[x,y],[x-e.vx*.01,y-(e.vy+600*age)*.01]],'#d9e7ff',1,.34*(1-age/.54));
    }
  }
  function motionStroke(t,p){
    if(!['hook-spin','flight','return-flight'].includes(p.kind))return;
    const points=[];
    for(let j=0;j<=16;j++){
      const q=D.sample(Math.max(0,t-.17+j*.17/16));
      points.push(U.world([0,-U.L/2-5],q));
    }
    stroke(points,'#bacbff',1,.18);
  }
  function render(t){
    t=clamp(Number.isFinite(t)?t:0,0,D.duration);
    const p=D.sample(t),scale=Math.min(canvas.width/D.W,canvas.height/D.H);
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#100bcc';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(scale,0,0,scale,(canvas.width-D.W*scale)/2,(canvas.height-D.H*scale)/2);
    ctx.save();ctx.beginPath();ctx.rect(0,0,D.W,D.H);ctx.clip();
    const glow=ctx.createRadialGradient(640,590,30,640,590,680);
    glow.addColorStop(0,'#1c23d9');glow.addColorStop(.7,'#130ed0');glow.addColorStop(1,'#100bcc');
    ctx.fillStyle=glow;ctx.fillRect(0,0,D.W,D.H);
    rain(t);water(t);
    // 只有接近地面时出现很淡的倒影；它不是第二把伞。
    const gap=Math.max(0,D.FLOOR-U.bounds(p).maxY),reflection=.055*clamp(1-gap/160);
    if(reflection>0){
      ctx.save();ctx.beginPath();ctx.rect(0,D.FLOOR,D.W,D.H-D.FLOOR);ctx.clip();
      ctx.translate(0,D.FLOOR*1.24);ctx.scale(1,-.24);U.draw(ctx,p,reflection);ctx.restore();
    }
    motionStroke(t,p);shedWater(t);U.draw(ctx,p);ctx.restore();ctx.globalAlpha=1;
  }
  return Object.freeze({duration:D.duration,resize,render});
})();


 const F=global.MotionFactories=global.MotionFactories||{};
 // 独立伞插画直接复用原伞面与遮挡，只绘制物件本身。
 F['encore-umbrella-illustration']=(root,K,def)=>{
  const prefix='encore-umbrella-'+(++serial);
  root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>';
  const svg=root.firstElementChild;let last;
  return ms=>{
   const time=Math.max(0,Math.min(def.duration_ms,ms))/1000;if(time===last)return;last=time;
   const pose=local.EncoreDance.sample(time);drawing.reset(prefix);local.EncoreUmbrella.draw(drawing,pose);
   svg.innerHTML=drawing.markup();svg.dataset.sourceTime=String(time);
  };
 };
 const clips=[['encore-hook',0,3.81],['encore-tap',4.678,9.373],['encore-flight',9.373,13.064],['encore-tip',13.064,17],['encore-roll',17,20.752],['encore-shed',20.752,24.543]];
 let serial=0;
 for(const [id,start,end] of clips)F[id]=(root,K,def)=>{
  const prefix='encore-'+(++serial);
  root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>';
  const svg=root.firstElementChild;let last;
  return ms=>{
   const t=start+Math.min(1,Math.max(0,ms/def.duration_ms))*(end-start);
   if(t===last)return;last=t;drawing.reset(prefix);local.EncoreScene.render(t);
   svg.innerHTML=drawing.markup();const p=local.EncoreDance.sample(t);
   for(const key of ['x','y','angle','roll'])svg.dataset[key]=String(p[key]);svg.dataset.sourceTime=String(t);
  };
 };
})(globalThis);
