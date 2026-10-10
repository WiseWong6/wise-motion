/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
 * 自有织风原作：完整固定节拍与绘制函数随包提供，无声音或外部文件依赖。
 */
/* 晴天前奏实际发音分组，来自音符跳动已确认的演奏。 */
(function(root){
  const data={"duration":25.8,"entrance":0.4,"musicEnd":24.4,"tempo":80,"voices":[[{"time":0.775,"pitches":[55],"count":1,"duration":0.375},{"time":1.15,"pitches":[62],"count":1,"duration":0.375},{"time":1.525,"pitches":[55],"count":1,"duration":0.375},{"time":2.65,"pitches":[62],"count":1,"duration":0.375},{"time":3.025,"pitches":[55],"count":1,"duration":0.375},{"time":4.15,"pitches":[62],"count":1,"duration":0.375},{"time":4.525,"pitches":[55],"count":1,"duration":0.375},{"time":5.275,"pitches":[62],"count":1,"duration":0.375},{"time":6.025,"pitches":[62],"count":1,"duration":0.375},{"time":6.775,"pitches":[55],"count":1,"duration":0.375},{"time":7.15,"pitches":[62],"count":1,"duration":0.375},{"time":7.525,"pitches":[55],"count":1,"duration":0.375},{"time":8.65,"pitches":[62],"count":1,"duration":0.375},{"time":9.025,"pitches":[55],"count":1,"duration":0.375},{"time":10.15,"pitches":[62],"count":1,"duration":0.375},{"time":10.525,"pitches":[55],"count":1,"duration":0.375},{"time":11.275,"pitches":[62],"count":1,"duration":0.375},{"time":11.837,"pitches":[55],"count":1,"duration":0.187},{"time":12.025,"pitches":[62],"count":1,"duration":0.375},{"time":13.15,"pitches":[55,59,64],"count":3,"duration":0.562},{"time":13.712,"pitches":[64,59],"count":2,"duration":0.187},{"time":14.087,"pitches":[64,60],"count":2,"duration":0.187},{"time":14.65,"pitches":[55,60,64],"count":3,"duration":0.375},{"time":15.212,"pitches":[64,60],"count":2,"duration":0.187},{"time":15.4,"pitches":[55,59,67],"count":3,"duration":0.75},{"time":16.15,"pitches":[55,59,67],"count":3,"duration":0.562},{"time":16.9,"pitches":[55,59,67],"count":3,"duration":0.187},{"time":17.087,"pitches":[67,59],"count":2,"duration":0.187},{"time":17.65,"pitches":[57,62,66],"count":3,"duration":0.375},{"time":18.025,"pitches":[57,62,66],"count":3,"duration":0.187},{"time":18.212,"pitches":[66,62],"count":2,"duration":0.187},{"time":19.15,"pitches":[55,59,64],"count":3,"duration":0.562},{"time":20.087,"pitches":[64],"count":1,"duration":0.187},{"time":20.275,"pitches":[60],"count":1,"duration":0.375},{"time":21.025,"pitches":[55],"count":1,"duration":0.187},{"time":21.212,"pitches":[60,64],"count":2,"duration":0.187},{"time":22.15,"pitches":[55,59,67],"count":3,"duration":0.562},{"time":22.712,"pitches":[67,59],"count":2,"duration":0.187},{"time":23.087,"pitches":[67],"count":1,"duration":0.187},{"time":23.275,"pitches":[59,55],"count":2,"duration":0.375},{"time":23.65,"pitches":[57,62,66],"count":3,"duration":0.75}],[{"time":0.4,"pitches":[52],"count":1,"duration":0.375},{"time":1.9,"pitches":[48],"count":1,"duration":0.375},{"time":2.275,"pitches":[50],"count":1,"duration":0.187},{"time":2.462,"pitches":[52],"count":1,"duration":0.187},{"time":3.4,"pitches":[43],"count":1,"duration":0.375},{"time":3.775,"pitches":[50],"count":1,"duration":0.375},{"time":4.9,"pitches":[43],"count":1,"duration":0.375},{"time":5.65,"pitches":[42],"count":1,"duration":0.375},{"time":6.4,"pitches":[52],"count":1,"duration":0.375},{"time":7.9,"pitches":[48],"count":1,"duration":0.375},{"time":8.275,"pitches":[50],"count":1,"duration":0.187},{"time":8.462,"pitches":[52],"count":1,"duration":0.187},{"time":9.4,"pitches":[43],"count":1,"duration":0.375},{"time":9.775,"pitches":[50],"count":1,"duration":0.375},{"time":10.9,"pitches":[43],"count":1,"duration":0.375},{"time":11.65,"pitches":[42],"count":1,"duration":0.187},{"time":12.4,"pitches":[40],"count":1,"duration":0.75},{"time":13.9,"pitches":[48],"count":1,"duration":0.187},{"time":14.275,"pitches":[52],"count":1,"duration":0.375},{"time":15.025,"pitches":[48],"count":1,"duration":0.187},{"time":15.4,"pitches":[43,47,50],"count":3,"duration":0.75},{"time":16.712,"pitches":[50],"count":1,"duration":0.187},{"time":17.275,"pitches":[43],"count":1,"duration":0.375},{"time":17.65,"pitches":[50],"count":1,"duration":0.375},{"time":18.4,"pitches":[40],"count":1,"duration":0.75},{"time":19.712,"pitches":[47],"count":1,"duration":0.187},{"time":19.9,"pitches":[48],"count":1,"duration":0.187},{"time":20.65,"pitches":[52],"count":1,"duration":0.375},{"time":21.4,"pitches":[43],"count":1,"duration":0.75},{"time":22.9,"pitches":[50],"count":1,"duration":0.187},{"time":23.65,"pitches":[50],"count":1,"duration":0.75}]]};
  if(typeof module!=="undefined" && module.exports) module.exports=data;
  else root.WeaveRhythm=data;
})(typeof window!=="undefined" ? window : globalThis);

/* 织风：所有形状都由作品时间求值，暂停和倒拖不依赖上一帧。 */
(function (root) {
  'use strict';
  const rhythm = typeof module !== 'undefined' && module.exports
    ? require('../assets/rhythm.js') : root.WeaveRhythm;
  const W = 1080, H = 1440, TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mix = (a, b, u) => a + (b - a) * u;
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };
  const v = (x, y, z = 0) => ({ x, y, z });
  const lerp = (a, b, u) => v(mix(a.x, b.x, u), mix(a.y, b.y, u), mix(a.z, b.z, u));
  const add = (a, b) => v(a.x + b.x, a.y + b.y, a.z + b.z);
  const scale = (a, k) => v(a.x * k, a.y * k, a.z * k);

  function bezier(points, u) {
    const k = 1 - u, [a, b, c, d] = points;
    return v(k*k*k*a.x+3*k*k*u*b.x+3*k*u*u*c.x+u*u*u*d.x,
      k*k*k*a.y+3*k*k*u*b.y+3*k*u*u*c.y+u*u*u*d.y,
      k*k*k*a.z+3*k*k*u*b.z+3*k*u*u*c.z+u*u*u*d.z);
  }

  function spine(u) {
    return v(-132 + 278*u + 37*Math.sin(TAU*u-.35), 430-834*u,
      23*Math.sin(Math.PI*u) - 15*Math.sin(TAU*u));
  }

  // 一条羽枝向上弯起；根部接羽轴，末梢留有细微不齐。
  function barbCurve(u, side, seed = 0, loose = false) {
    const s = clamp((u-.025)/1.01), envelope = Math.pow(Math.sin(Math.PI*s), .72);
    const scallop = 1 - .08*Math.pow(.5+.5*Math.sin(u*38 + side*.7), 8);
    const width = (side < 0 ? 225 : 183) * envelope * scallop * (1+.028*(hash(seed)-.5));
    const rise = 116*Math.pow(envelope, .72) + 12;
    const p = spine(u), curl = 11*Math.sin(u*11 + side*.6);
    const length = loose ? 1.14+.2*hash(seed+7) : 1;
    return [p,
      add(p, v(side*width*.3, 16-rise*.12, 14+side*8)),
      add(p, v(side*width*.96*length, -rise*.40+curl, 37+side*14)),
      add(p, v(side*width*length, -rise+curl + (hash(seed+13)-.5)*5, 17+side*8))];
  }

  const voices = rhythm.voices.map((events, voice) => events.map((event, index) => ({
    ...event, voice, index, side: voice === 0 ? 1 : -1,
    u: .064 + .879 * clamp((event.time-rhythm.entrance)/(23.65-rhythm.entrance)),
    strength: .6 + Math.min(4,event.count)*.14,
  })));
  const events = voices.flat().sort((a,b) => a.time-b.time || a.voice-b.voice);
  for (const voice of voices) for (const event of voice) {
    event.anchor = barbCurve(event.u, event.side, event.index+event.voice*300)[3];
  }

  const fibers = [];
  for (const voice of voices) {
    for (const event of voice) {
      const prev = voice[event.index-1], next = voice[event.index+1];
      const low = prev ? (prev.u+event.u)/2 : .035;
      const high = next ? (next.u+event.u)/2 : .986;
      const count = Math.max(11,Math.ceil((high-low)*640));
      for (let j=0;j<count;j++) {
        const seed = event.voice*9200 + event.index*147 + j;
        const u = mix(low, high, (j+.35+hash(seed)*.3)/count);
        const loose = u<.16 && (j%5===0 || u<.07);
        const curve = barbCurve(u,event.side,seed,loose);
        const points = Array.from({length:17},(_,k)=>bezier(curve,k/16));
        fibers.push({event,u,side:event.side,seed,points,curve,loose,
          width: .44 + hash(seed+90)*.40,
          brightness:.56+hash(seed+21)*.44,
          delay:j/count*.047,
        });
      }
    }
  }
  // 极细的羽小枝，让密集银丝形成织物感；它们随母羽枝一起出现。
  const barbules = fibers.filter((_,i)=>i%6===0).flatMap(fiber => [5,8,11,14].map((k,index)=>({
    fiber, point:fiber.points[k], tip:add(fiber.points[k],v(fiber.side*(4+index),-8-index*1.2,-1)),
  })));

  function deformation(point,u,t,side=0,edge=0) {
    const finish=smooth((t-23.45)/2.35);
    const wind=Math.sin(t*1.05-u*5.8)*2.7+Math.sin(t*.54+u*12)*1.1;
    let pluck=0;
    const lane = side > 0 ? voices[0] : voices[1];
    if (side) for (const e of lane) {
      const age=t-e.time;
      if(age<0 || age>1.3) continue;
      const spread=Math.exp(-Math.pow((u-e.u)/.052,2));
      pluck+=Math.sin(age*24)*Math.exp(-age*5.5)*spread*e.strength*5.5;
    }
    return v(point.x + wind*edge*.42,
      point.y + (wind+pluck)*edge - finish*22,
      point.z + Math.sin(t*.76-u*7)*3.6*edge + pluck*.65 + finish*edge*10);
  }

  function camera(t) {
    const finish=smooth((t-23.45)/2.35);
    return {yaw:-.20+Math.sin(t*.23)*.038+finish*.50,
      roll:.015+Math.sin(t*.19)*.015-finish*.063,
      pitch:.11+finish*.05, x:521+finish*5, y:727-finish*13};
  }

  function project(p,cam) {
    const cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);
    const xx=p.x*cy+p.z*sy, zz=p.z*cy-p.x*sy;
    const yy=p.y*cp-zz*sp, z=p.y*sp+zz*cp;
    const size=1500/(1500-z), cr=Math.cos(cam.roll),sr=Math.sin(cam.roll);
    return {x:cam.x+(xx*cr-yy*sr)*size,y:cam.y+(xx*sr+yy*cr)*size,z,size};
  }

  // 银梭在发音时抵达羽枝尖端；两次发音之间走弧线，不在端点换轨或清空拖尾。
  function shuttleAt(voice,t) {
    const lane=voices[voice],side=voice===0?1:-1,first=lane[0],last=lane[lane.length-1];
    const home=add(first.anchor,v(side*66,88,40));
    if(t<=first.time) {
      const p=smooth(t/first.time);
      return {point:lerp(home,first.anchor,p),u:first.u,side,energy:0,alpha:smooth(t/.30)};
    }
    if(t>last.time) {
      const u=smooth((t-last.time)/1.55), point=add(last.anchor,v(side*100*u, -28*u,45*u));
      return {point,u:last.u,side,energy:Math.exp(-(t-last.time)*5),alpha:1-smooth((t-24.55)/1.25)};
    }
    let i=1;while(i<lane.length && lane[i].time<t) i++;
    const a=lane[i-1],b=lane[i],raw=clamp((t-a.time)/(b.time-a.time));
    // 保留快速拨弦的清晰到点，并让长音的穿行更舒展。
    const u=mix(raw,smooth(raw),.38),p=lerp(a.anchor,b.anchor,u);
    const arch=Math.sin(Math.PI*u),height=28+Math.min(56,(b.time-a.time)*49);
    p.x+=side*height*arch;p.y-=Math.sin(TAU*u)*9;p.z+=arch*45;
    return {point:p,u:mix(a.u,b.u,u),side,energy:Math.exp(-(t-a.time)*11)*a.strength,alpha:1};
  }

  function fiberProgress(f,t) {
    const age=t-f.event.time-f.delay;
    return {growth:smooth((age+.12)/.32),opacity:smooth((age+.10)/.21),age};
  }

  function stateAt(t) {
    t=clamp(t,0,rhythm.duration);
    return {time:t,camera:camera(t),wovenEvents:events.filter(e=>e.time<=t).length,
      fiberCount:fibers.filter(f=>fiberProgress(f,t).growth>=.999).length,
      totalFibers:fibers.length,
      shuttles:[0,1].map(voice=>{
        const s=shuttleAt(voice,t);
        return {...s,screen:project(deformation(s.point,s.u,t,s.side,1),camera(t))};
      })};
  }

  function create(canvas, view = {}) {
    const viewWidth=view.width||W,viewHeight=view.height||H,zoom=view.zoom||1;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx) throw new Error('浏览器不支持画布');
    let pixels=1;
    const background=document.createElement('canvas');background.width=W;background.height=H;
    const bg=background.getContext('2d');
    bg.fillStyle='#123deb';bg.fillRect(0,0,W,H);
    const wash=bg.createRadialGradient(660,470,60,510,630,1060);
    wash.addColorStop(0,'rgba(48,86,253,.44)');wash.addColorStop(.5,'rgba(18,59,237,.10)');wash.addColorStop(1,'rgba(7,33,195,.36)');
    bg.fillStyle=wash;bg.fillRect(0,0,W,H);
    // 极低强度、固定不闪烁的底色颗粒。
    for(let i=0;i<14000;i++) {
      bg.fillStyle=i%2?'rgba(209,227,255,.028)':'rgba(0,20,108,.022)';
      bg.fillRect(hash(i*3+1)*W,hash(i*3+2)*H,.6,.6);
    }
    const palettes = [[],[]];
    for(let side=0;side<2;side++)for(let i=0;i<32;i++){
      const k=i/31;
      palettes[side].push(`rgb(${Math.round(mix(58,side?247:234,k))},${Math.round(mix(94,side?244:250,k))},${Math.round(mix(182,side?240:255,k))})`);
    }

    function path(points, growth=1) {
      const n=(points.length-1)*growth,last=Math.floor(n);
      ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
      for(let k=1;k<=last;k++)ctx.lineTo(points[k].x,points[k].y);
      if(last<points.length-1 && n>last){const p=lerp(points[last],points[last+1],n-last);ctx.lineTo(p.x,p.y);}
    }

    function glow(x,y,r,alpha,warm=false) {
      if(alpha<=.002)return;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,warm?`rgba(255,249,218,${alpha*.26})`:`rgba(227,246,255,${alpha*.29})`);
      g.addColorStop(.26,`rgba(164,204,255,${alpha*.10})`);g.addColorStop(1,'rgba(131,187,255,0)');
      ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }

    function glint(x,y,alpha,size=1,warm=false) {
      if(alpha<.02)return;
      glow(x,y,15*size,alpha,warm);
      ctx.save();ctx.globalAlpha=alpha;
      const color=warm?'255,247,221':'235,249,255';
      for(const [angle,len,width]of [[-.18,12*size,.60],[Math.PI/2-.18,6*size,.50]]){
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);
        const g=ctx.createLinearGradient(-len,0,len,0);
        g.addColorStop(0,`rgba(${color},0)`);g.addColorStop(.46,`rgba(${color},.7)`);g.addColorStop(.5,`rgba(255,255,255,1)`);g.addColorStop(.54,`rgba(${color},.7)`);g.addColorStop(1,`rgba(${color},0)`);
        ctx.strokeStyle=g;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(len,0);ctx.stroke();ctx.restore();
      }
      ctx.fillStyle='#faffff';ctx.beginPath();ctx.ellipse(x,y,1.05*size,.75*size,0,0,TAU);ctx.fill();ctx.restore();
    }

    function drawSpine(t,cam,underlay) {
      const last=events.filter(e=>e.time<=t).at(-1);
      const limit=last ? Math.min(1,last.u+.06) : .06;
      const amount=mix(.12,limit,smooth(t/.75));
      const points=Array.from({length:101},(_,i)=>{
        const u=mix(-.09,amount,i/100),p=spine(u);
        return project(deformation(p,u,t),cam);
      });
      const a=points[0],b=points[100];
      ctx.save();ctx.lineCap='round';
      if(underlay){
        path(points);ctx.strokeStyle='rgba(10,29,125,.40)';ctx.lineWidth=5.2;ctx.stroke();
      }else{
        // 羽轴不是一根白线：多层偏移提供金属的暗侧与窄亮面。
        const gradient=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
        gradient.addColorStop(0,'#7897cd');gradient.addColorStop(.12,'#cbd5e1');gradient.addColorStop(.34,'#6b87b3');gradient.addColorStop(.46,'#edf4f5');gradient.addColorStop(.66,'#a8bbd5');gradient.addColorStop(.84,'#f5f7ee');gradient.addColorStop(1,'#8bafe7');
        for(let j=0;j<100;j++){
          ctx.beginPath();ctx.moveTo(points[j].x,points[j].y);ctx.lineTo(points[j+1].x,points[j+1].y);
          ctx.strokeStyle=gradient;ctx.lineWidth=mix(4.8,.55,j/100);ctx.stroke();
        }
        ctx.translate(1.15,-.2);path(points);ctx.strokeStyle='rgba(250,253,255,.69)';ctx.lineWidth=.65;ctx.stroke();
      }
      ctx.restore();
    }

    function drawFeather(t,cam) {
      drawSpine(t,cam,true);
      ctx.lineCap='round';
      const finish=smooth((t-23.65)/1.8);
      // 宽丝束的底色非常轻，只负责托住形状，不能成为白色实心剪影。
      for(const voice of voices)for(const e of voice){
        const g=smooth((t-e.time+.10)/.32);if(g<.001)continue;
        const a=barbCurve(e.u-.009,e.side,e.index),b=barbCurve(e.u+.009,e.side,e.index);
        const pts=[];
        for(let k=0;k<=12;k++){const p=bezier(a,k/12*g);pts.push(project(deformation(p,e.u,t,e.side,k/12*g),cam));}
        for(let k=12;k>=0;k--){const p=bezier(b,k/12*g);pts.push(project(deformation(p,e.u,t,e.side,k/12*g),cam));}
        path(pts);ctx.closePath();ctx.fillStyle='rgba(132,177,245,.055)';ctx.fill();
      }
      for(const f of fibers){
        const {growth,opacity,age}=fiberProgress(f,t);if(growth<=.002)continue;
        const pts=f.points.map((p,k)=>project(deformation(p,f.u,t,f.side,k/16),cam));
        const reflection=Math.pow(.5+.5*Math.cos(f.u*10+f.side*.7-t*.13-cam.yaw*3),7);
        const reveal=Math.exp(-Math.max(0,age)*7)*.19;
        const brightness=clamp((.37+reflection*.56+reveal+finish*.03)*f.brightness);
        const palette=palettes[f.side<0?1:0];
        path(pts,growth);ctx.strokeStyle=palette[Math.min(31,Math.round(brightness*31))];
        ctx.lineWidth=f.width;ctx.globalAlpha=opacity*(f.loose?.62:.86);ctx.stroke();
        // 非均匀掠光：同一根丝只有其中一小截反光，粗亮整条会丢失金属质感。
        const grazing=.55+.22*Math.sin(f.u*7+t*.29+f.side);
        if(reflection>.16 || age<.28){
          const lo=clamp(grazing-.10),hi=Math.min(growth,grazing+.12);
          if(hi>lo){
            const gl=[];for(let k=0;k<=4;k++){
              const q=mix(lo,hi,k/4),p=bezier(f.curve,q);
              gl.push(project(deformation(p,f.u,t,f.side,q),cam));
            }
            path(gl);ctx.strokeStyle=f.side<0?'#edf0dd':'#e3f1ff';
            ctx.lineWidth=f.width*.86;ctx.globalAlpha=opacity*(reflection*.58+reveal)*f.brightness;ctx.stroke();
          }
        }
      }
      ctx.globalAlpha=1;
      for(const b of barbules){
        const f=b.fiber,p=fiberProgress(f,t);if(p.growth<.96)continue;
        const a=project(deformation(b.point,f.u,t,f.side,.6),cam),z=project(deformation(b.tip,f.u,t,f.side,.6),cam);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(z.x,z.y);ctx.lineWidth=.35;
        ctx.strokeStyle='rgba(164,197,238,.15)';ctx.stroke();
      }
      drawSpine(t,cam,false);
      // 成束扫弦只让局部羽根闪过，高低声部各自发生。
      for(const e of events){
        const age=t-e.time;if(age<0 || age>.46)continue;
        const p=project(deformation(e.anchor,e.u,t,e.side,1),cam);
        const peak=smooth(age/.028)*Math.exp(-age*11);
        glint(p.x,p.y,peak*(.44+e.count*.09),.62+e.count*.09,e.side<0);
        if(e.count>1){
          for(let k=1;k<Math.min(e.count,4);k++){
            const delayed=age-k*.025;if(delayed<0)continue;
            const p2=bezier(barbCurve(e.u+(k-1)*.01,e.side,e.index),.65+k*.08);
            const q=project(deformation(p2,e.u,t,e.side,.8),cam);
            glint(q.x,q.y,smooth(delayed/.025)*Math.exp(-delayed*13)*.42,.52,e.side<0);
          }
        }
      }
      // 尾音中的高光沿羽轴向上走，羽毛整体轻微倾转。
      if(t>23.65){
        const u=clamp((t-23.65)/1.6),p=project(deformation(spine(u),u,t),cam);
        glint(p.x,p.y,Math.sin(Math.PI*u)*.82,.85);
      }
    }

    function drawNeedle(t,voice,cam) {
      const s=shuttleAt(voice,t);if(s.alpha<.002)return;
      const drawPoint=raw=>project(deformation(raw.point,raw.u,t,raw.side,1),cam);
      const p=drawPoint(s),before=drawPoint(shuttleAt(voice,Math.max(0,t-.012))),after=drawPoint(shuttleAt(voice,Math.min(rhythm.duration,t+.012)));
      let dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy);
      if(len<.001){dx=s.side*.4;dy=-1;len=Math.hypot(dx,dy);}
      const angle=Math.atan2(dy/len,dx/len);
      ctx.save();ctx.globalAlpha=s.alpha;
      // 持续的牵丝：羽轴到银梭的连线不因下一音出现而被清掉。
      const stem=project(deformation(spine(s.u),s.u,t,s.side,0),cam);
      const c1={x:mix(stem.x,p.x,.31)+s.side*12,y:stem.y+24};
      const c2={x:mix(stem.x,p.x,.76),y:p.y+30};
      const g=ctx.createLinearGradient(stem.x,stem.y,p.x,p.y);
      g.addColorStop(0,'rgba(173,200,253,.06)');g.addColorStop(.5,'rgba(203,225,255,.44)');g.addColorStop(1,voice?'rgba(255,246,219,.9)':'rgba(242,252,255,.92)');
      ctx.beginPath();ctx.moveTo(stem.x,stem.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,p.x,p.y);
      ctx.strokeStyle=g;ctx.lineWidth=.82;ctx.stroke();
      // 沿实际走过的路径保留约 1.7 秒，按距离柔和消退；跨过到点时刻仍连续。
      const history=Math.min(t,1.7),segments=54;
      for(let k=0;k<segments;k++){
        const a=shuttleAt(voice,t-history+history*k/segments),b=shuttleAt(voice,t-history+history*(k+1)/segments);
        const aa=drawPoint(a),bb=drawPoint(b),opacity=Math.pow(k/segments,1.75)*.49*s.alpha;
        ctx.strokeStyle=voice?`rgba(246,234,200,${opacity})`:`rgba(213,237,255,${opacity})`;
        ctx.lineWidth=.64;ctx.beginPath();ctx.moveTo(aa.x,aa.y);ctx.lineTo(bb.x,bb.y);ctx.stroke();
      }
      glow(p.x,p.y,15,.26+s.energy*.12,voice===1);
      // 两个立体梭面与中空针眼，不用平面发光圆球充当工具。
      ctx.translate(p.x,p.y);ctx.rotate(angle);
      const size=.86+p.size*.11;ctx.scale(size,size);
      const metal=ctx.createLinearGradient(-17,-5,18,6);
      metal.addColorStop(0,'#c6d5e8');metal.addColorStop(.20,'#627791');metal.addColorStop(.42,'#ebeff2');metal.addColorStop(.51,'#f8ffff');metal.addColorStop(.57,'#8c9dad');metal.addColorStop(.8,'#3b5380');metal.addColorStop(1,'#cce7ff');
      ctx.beginPath();ctx.moveTo(20,0);ctx.bezierCurveTo(7,-4,-5,-4.4,-19,0);ctx.bezierCurveTo(-5,4.4,7,4,20,0);ctx.fillStyle=metal;ctx.fill();
      ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(19,0);ctx.strokeStyle='rgba(250,254,255,.82)';ctx.lineWidth=.56;ctx.stroke();
      ctx.beginPath();ctx.ellipse(-1,0,4.6,1.25,0,0,TAU);ctx.fillStyle='#3159b1';ctx.fill();
      ctx.beginPath();ctx.ellipse(-1,-.35,4.2,.8,0,Math.PI,TAU);ctx.strokeStyle='rgba(252,255,255,.78)';ctx.lineWidth=.52;ctx.stroke();
      ctx.restore();
    }

    function render(time) {
      const t=clamp(Number.isFinite(time)?time:0,0,rhythm.duration),cam=camera(t);
      ctx.setTransform(pixels,0,0,pixels,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      ctx.drawImage(background,0,0,viewWidth,viewHeight);
      ctx.save();ctx.translate(viewWidth/2-W*zoom/2,viewHeight/2-H*zoom/2);ctx.scale(zoom,zoom);
      drawFeather(t,cam);
      drawNeedle(t,1,cam);drawNeedle(t,0,cam);
      ctx.restore();
    }
    function resize(cssWidth,cssHeight,dpr=1) {
      const width=Math.max(1,Math.round(cssWidth*Math.min(2.5,Math.max(1,dpr))));
      canvas.width=width;canvas.height=Math.round(width*viewHeight/viewWidth);pixels=width/viewWidth;
    }
    return {render,resize,destroy(){background.width=background.height=1;}};
  }
  const api={duration:rhythm.duration,width:W,height:H,create,
    // 纯时间函数同时用于检查，浏览器里也可据此制作准确的后续导出。
    inspect:{stateAt,shuttleAt,fiberProgress,barbCurve,spine,project,camera,events,voices,fibers}};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.WeaveArtwork=api;
})(typeof window!=='undefined'?window:globalThis);

/* 横版接入：背景适配画板；羽丝、双梭、相机和原时间函数保持等比。 */
(function(global){
 'use strict';
 const F=global.MotionFactories=global.MotionFactories||{};
 F['thread-weave']=(root,K,def)=>{
  root.dataset.art='original';
  const canvas=root.ownerDocument.createElement('canvas');canvas.className='pattern-canvas';
  canvas.style.cssText='width:640px;height:360px;display:block';canvas.width=640;canvas.height=360;root.replaceChildren(canvas);
  if(!canvas.getContext('2d'))return ()=>{};
  const painter=global.WeaveArtwork.create(canvas,{width:640,height:360,zoom:.34});
  painter.resize(640,360,Math.min(2,global.devicePixelRatio||1));let dead=false;
  const render=ms=>{if(dead)return;const t=Math.max(0,Math.min(23.9,(ms-150)/1000));painter.render(t);canvas.dataset.sourceTime=String(t);};
  render.frameRate=30;
  render.destroy=preserve=>{if(dead)return;dead=true;painter.destroy();if(!preserve)canvas.width=canvas.height=1;};
  return render;
 };
})(globalThis);
