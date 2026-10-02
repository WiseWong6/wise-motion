/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 原作几何、事件与光照计算的独立提炼；原月貌来源：NASA/GSFC/Arizona State University。
 * 仅含必要绘制，不加载原工程、页面控件、字体或音频。 */
(function(global){
 'use strict';
 const F=global.MotionFactories=global.MotionFactories||{};let serial=0;
 class Path2D{constructor(d=''){this.d=d;}}
 // 原画布的路径、变换、透明度和渐变，在相同坐标关系下写成矢量节点。
 function recorder(prefix,strokeScale=1){
  let state={transform:'',clips:[],globalAlpha:1,fillStyle:'#000',strokeStyle:'#000',lineWidth:1,lineCap:'butt',lineJoin:'miter'},stack=[],path='',defs=[],shapes=[];
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  const ctx={
   save(){stack.push({...state,clips:[...state.clips]});},restore(){state=stack.pop();},
   translate(x,y){state.transform+=` translate(${x} ${y})`;},scale(x,y){state.transform+=` scale(${x} ${y})`;},rotate(a){state.transform+=` rotate(${a*180/Math.PI})`;},
   beginPath(){path='';},moveTo(x,y){path+=`M${x} ${y}`;},lineTo(x,y){path+=`L${x} ${y}`;},quadraticCurveTo(...n){path+='Q'+n.join(' ');},bezierCurveTo(...n){path+='C'+n.join(' ');},closePath(){path+='Z';},
   rect(x,y,w,h){path+=`M${x} ${y}h${w}v${h}h${-w}Z`;},
   ellipse(x,y,rx,ry,rotation,start,end,ccw=false){
    const point=a=>[x+rx*Math.cos(a)*Math.cos(rotation)-ry*Math.sin(a)*Math.sin(rotation),y+rx*Math.cos(a)*Math.sin(rotation)+ry*Math.sin(a)*Math.cos(rotation)];
    let span=end-start,full=Math.abs(span)>=Math.PI*2-1e-8;
    if(!full){span=ccw?-((start-end)%(2*Math.PI)+2*Math.PI)%(2*Math.PI):((end-start)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);}
    const p=point(start),q=point(start+(full?(ccw?-1:1)*Math.PI:span)),sweep=ccw?0:1;
    path+=(path?'L':'M')+p.join(' ')+`A${rx} ${ry} ${rotation*180/Math.PI} ${full?0:Number(Math.abs(span)>Math.PI)} ${sweep} `+q.join(' ');
    if(full)path+=`A${rx} ${ry} ${rotation*180/Math.PI} 0 ${sweep} `+p.join(' ');
   },arc(x,y,r,start,end,ccw){ctx.ellipse(x,y,r,r,0,start,end,ccw);},
   clip(p){const id=prefix+'-clip-'+defs.length;defs.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${esc(p?.d||path)}" transform="${state.transform}"/></clipPath>`);state.clips.push(id);},
   fill(p){shape(p?.d||path,false);},stroke(p){shape(p?.d||path,true);},fillRect(x,y,w,h){shape(`M${x} ${y}h${w}v${h}h${-w}Z`,false);},
   createLinearGradient(x0,y0,x1,y1){return gradient('linearGradient',`x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"`);},
   createRadialGradient(x0,y0,r0,x1,y1,r1){return gradient('radialGradient',`fx="${x0}" fy="${y0}" fr="${r0}" cx="${x1}" cy="${y1}" r="${r1}"`);},
   markup(){return `<defs>${defs.join('')}</defs><g data-part="source-art">${shapes.join('')}</g>`;}
  };
  for(const key of Object.keys(state))if(!['transform','clips'].includes(key))Object.defineProperty(ctx,key,{get:()=>state[key],set:v=>{if(key==='globalAlpha'&&(!Number.isFinite(v)||v<0||v>1))return;state[key]=v;}});
  function gradient(tag,attributes){const id=prefix+'-gradient-'+defs.length,at=defs.length,stops=[];defs.push('');return {addColorStop(offset,color){stops.push(`<stop offset="${offset}" stop-color="${esc(color)}"/>`);defs[at]=`<${tag} id="${id}" gradientUnits="userSpaceOnUse" ${attributes}>${stops.join('')}</${tag}>`;},toString:()=>`url(#${id})`};}
  function shape(d,stroke){
   const paint=stroke?`fill="none" stroke="${esc(state.strokeStyle)}" stroke-width="${state.lineWidth*strokeScale}" stroke-linecap="${state.lineCap}" stroke-linejoin="${state.lineJoin}"`:`fill="${esc(state.fillStyle)}"`;
   let s=`<path d="${esc(d)}" transform="${state.transform}" opacity="${state.globalAlpha}" ${paint}/>`;
   for(const id of state.clips)s=`<g clip-path="url(#${id})">${s}</g>`;shapes.push(s);
  }
  return ctx;
 }
 function svgFactory(root,def,paint,viewBox='0 0 640 360',strokeScale=1){
  const prefix='source-art-'+(++serial);root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="${viewBox}" aria-hidden="true"></svg>`;
  const svg=root.firstElementChild;let last;
  const render=ms=>{const time=Math.min(def.duration_ms,Math.max(0,ms));if(last===time)return;last=time;const ctx=recorder(prefix,strokeScale);paint(ctx,time/1000,svg);svg.innerHTML=ctx.markup();};
  return render;
 }

/* 原木船和黄纸飞机 */
(()=>{
  const C = {
    rim: '#f0cd92', edge: '#fff6dc', wood: '#a45f3c', dark: '#53352f',
    deck: '#d5a16a', seam: '#75462f', blue: '#428a99', lightBlue: '#86c7cc',
    gold: '#ffbd67', sail: '#f3deb3',
  };
  const phaseOf = motion => Number.isFinite(motion?.phase) ? motion.phase : (motion?.t || 0) * Math.PI / 2;
  const path = (ink, d, fill, width = 1.3, color = C.edge, alpha = .85) => {
    ink.wash(d, { color: fill, alpha: 1 });
    ink.line(d, { color, width, alpha, glow: .22 });
  };
  const gradient = (ctx, x0, y0, x1, y1, stops) => {
    const value = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([at, color]) => value.addColorStop(at, color));
    return value;
  };

  function hull(ctx, ink) {
    // 船尾横板与下方船壳分别填色，明确这是一条有厚度的木船。
    path(ink,
      'M 0 -126 C 24 -111 46 -67 57 -17 C 66 27 66 74 57 112 L 49 131 Q 0 144 -49 131 L -57 112 C -66 74 -66 27 -57 -17 C -46 -67 -24 -111 0 -126 Z',
      gradient(ctx, -62, 0, 62, 0, [[0, '#b97b4e'], [.34, '#9f573b'], [1, '#704432']]),
      1.55, '#efd2a2', .92);
    path(ink,
      'M 0 -115 C 20 -96 38 -55 47 -12 C 55 27 55 70 48 103 Q 0 117 -48 103 C -55 70 -55 27 -47 -12 C -38 -55 -20 -96 0 -115 Z',
      '#654a3b', 1.3, C.rim, .83);
    // 舱底浅木色，阴影留在两侧船舷下，俯后视能读出内外两层。
    path(ink,
      'M 0 -104 C 17 -85 31 -48 39 -8 C 45 29 46 64 40 93 Q 0 105 -40 93 C -46 64 -45 29 -39 -8 C -31 -48 -17 -85 0 -104 Z',
      gradient(ctx, -40, -70, 43, 98, [[0, '#c08b59'], [.56, '#d7ac75'], [1, '#bf8f5d']]),
      .75, '#e0bb86', .42);
    // 尖头前甲板，以及近处较宽的尾甲板；横向接缝区别于叶片形轮廓。
    path(ink,
      'M 0 -115 C 12 -102 25 -78 33 -54 Q 0 -45 -33 -54 C -25 -78 -12 -102 0 -115 Z',
      '#d5a16b', 1, '#f5dbad', .78);
    path(ink,
      'M -49 84 Q 0 99 49 84 L 48 104 Q 0 117 -48 104 Z',
      '#d8a770', 1.1, C.rim, .86);
    path(ink, 'M -57 112 Q 0 129 57 112 L 49 131 Q 0 144 -49 131 Z',
      '#8a4e34', 1.05, '#d3a477', .7);
    ink.line('M -48 104 Q 0 117 48 104 M -54 116 Q 0 130 54 116',
      { color: '#fff0cc', width: 1.4, alpha: .85, glow: .28 });
    ink.line('M 0 -110 L 0 -52 M -16 -82 Q 0 -77 16 -82 M -26 -63 Q 0 -57 26 -63 M -20 93 L -20 109 M 0 96 L 0 112 M 20 93 L 20 109',
      { color: C.seam, width: 1, alpha: .61, glow: 0 });
    // 两条边缘亮线，保留第一版白线的清晰感。
    ink.line('M 0 -124 C -25 -105 -46 -62 -56 -15 C -64 27 -64 71 -56 108 M 0 -124 C 25 -105 46 -62 56 -15 C 64 27 64 71 56 108',
      { color: C.edge, width: 1.45, alpha: .94, glow: .36 });
  }

  function openCabin(ink) {
    ink.line('M 0 -41 L 0 82 M -18 -39 Q -22 20 -22 85 M 18 -39 Q 22 20 22 85',
      { color: C.seam, width: .95, alpha: .5, glow: 0 });
    ink.line('M -42 -3 L -35 5 M 42 -3 L 35 5 M -49 45 L -41 51 M 49 45 L 41 51 M -49 75 L -39 82 M 49 75 L 39 82',
      { color: '#ead0a0', width: 2, alpha: .72, glow: 0 });
    path(ink, 'M -43 -24 Q 0 -15 43 -24 L 45 -9 Q 0 0 -45 -9 Z',
      '#a86843', 1.05, '#ebc994', .9);
    path(ink, 'M -51 42 Q 0 54 51 42 L 51 57 Q 0 69 -51 57 Z',
      '#a86843', 1.1, '#ebc994', .9);
    ink.line('M -43 -21 Q 0 -12 43 -21 M -50 45 Q 0 57 50 45',
      { color: '#f6dbae', width: .9, alpha: .65, glow: .08 });
  }

  function lantern(ctx, ink, x, y, phase, delay = 0) {
    // 灯挂在短支架上；支架固定，灯身独立慢摆。
    ink.line(`M ${x - 5} ${y + 29} L ${x - 5} ${y - 2} Q ${x - 5} ${y - 8} ${x + 2} ${y - 8} L ${x + 8} ${y - 8}`,
      { color: '#9c714f', width: 2.2, alpha: 1, glow: 0 });
    ctx.save();
    ctx.translate(x + 8, y - 8);
    ctx.rotate(.17 * Math.sin(phase + delay));
    ink.line('M 0 0 L 0 9', { color: '#efd5a3', width: 1, alpha: .86, glow: .1 });
    ink.dot(0, 19, 12, { color: '#ffbb5e', alpha: .055, glow: .2 });
    path(ink, 'M -5 10 Q -9 19 -5 28 L 5 28 Q 9 19 5 10 Z',
      gradient(ctx, -7, 19, 7, 19, [[0, '#e88d47'], [.5, '#ffe0a0'], [1, '#efad58']]),
      1.05, '#fff0bc', .98);
    ink.line('M -5 10 L 5 10 M -5 28 L 5 28 M 0 28 L 0 33',
      { color: '#ffd68a', width: 1.35, alpha: .98, glow: .6 });
    ink.line('M -2 12 Q -4 19 -2 26 M 2 12 Q 4 19 2 26',
      { color: '#bf713c', width: .7, alpha: .6, glow: 0 });
    ink.dot(0, 18, 1.4, { color: '#fff8dc', alpha: .95, glow: .65 });
    ctx.restore();
  }


const WHITE='#fff9ee',TAU=Math.PI*2;
function inkFor(ctx) {
    return {
      line(data,{width=1.6,alpha=1,color=WHITE,glow=.35,fill,fillAlpha=.04}={}) {
        const path=new Path2D(data);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
        if(fill){ctx.save();ctx.globalAlpha*=fillAlpha;ctx.fillStyle=fill;ctx.fill(path);ctx.restore();}
        if(glow>0){ctx.save();ctx.strokeStyle=color;ctx.globalAlpha*=alpha*glow*.15;ctx.lineWidth=width*3.8;ctx.stroke(path);ctx.restore();}
        ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(path);ctx.restore();
      },
      wash(data,{color=WHITE,alpha=.04}={}) {ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle=color;ctx.fill(new Path2D(data));ctx.restore();},
      dot(x,y,r,{color=WHITE,alpha=1,glow=.4}={}) {
        ctx.save();ctx.fillStyle=color;ctx.globalAlpha*=alpha;
        if(glow>0){ctx.save();ctx.globalAlpha*=glow*.15;ctx.beginPath();ctx.arc(x,y,r*3.4,0,TAU);ctx.fill();ctx.restore();}
        ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();
      },
    };
  }
const planeDraw=(()=>{
  const WHITE = "#fffaf0";
  const round = (n) => Math.round(n * 1000) / 1000;
  const point = (p) => `${round(p[0])} ${round(p[1])}`;
  const path = (points) => `M ${points.map(point).join(" L ")} Z`;
  const stroke = (points) => `M ${points.map(point).join(" L ")}`;

  function paperGradient(ctx, colors, side) {
    const gradient = ctx.createLinearGradient(side * 15, -125, side * 120, 115);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.64, colors[1]);
    gradient.addColorStop(1, colors[2]);
    return gradient;
  }

  function face(ink, points, color, options = {}) {
    ink.line(path(points), {
      fill: color,
      fillAlpha: 0.98,
      width: 1.55,
      color: WHITE,
      alpha: 0.94,
      glow: 0.16,
      ...options,
    });
  }

  function drawPaper(ctx, ink, motion, spec) {
    const phase = Number.isFinite(motion.phase) ? motion.phase : motion.t * Math.PI / 2;
    const nose = [0, spec.nose];
    const inner = (side) => [side * spec.rootX, spec.rootY];
    const keel = [0, spec.keelY + Math.sin(phase * 2) * 1.1];

    // 翼根固定；越靠外缘才越明显抬起，不能把整片机翼从中心缩放。
    // 左右有小量错拍，完整四秒后位置、速度均连续。
    function wingPoint(side, xy) {
      const flex = 0.5 + 0.36 * Math.sin(phase + side * 0.32)
        + 0.12 * Math.sin(phase * 2 + side * 0.56);
      const amount = Math.pow(Math.min(1, xy[0] / spec.width), 1.2);
      return [
        side * (xy[0] - spec.width * 0.073 * flex * amount),
        xy[1] - spec.lift * flex * amount,
      ];
    }

    // 两张大纸面有明确亮暗，折脊稍深。先画面，最后收白色外缘。
    for (const side of [-1, 1]) {
      const outer = spec.outer.map((p) => wingPoint(side, p));
      const root = inner(side);
      const colors = side < 0 ? spec.left : spec.right;
      face(ink, [nose, ...outer, root], paperGradient(ctx, colors, side));

      if (spec.corner) {
        const corner = spec.corner.map((p) => wingPoint(side, p));
        face(ink, corner, side < 0 ? spec.cornerLeft : spec.cornerRight, {
          width: 1.05,
          alpha: 0.84,
          glow: 0.06,
        });
      }

      if (spec.leadingFold) {
        const fold = spec.leadingFold.map((p) => wingPoint(side, p));
        face(ink, [nose, ...fold], side < 0 ? spec.foldLeft : spec.foldRight, {
          width: 1.05,
          alpha: 0.9,
          glow: 0.06,
        });
      }

      face(ink, [nose, root, keel], side < 0 ? spec.spineLeft : spec.spineRight, {
        width: 1.15,
        alpha: 0.97,
        glow: 0.1,
      });
      ink.line(stroke([nose, ...outer, root, keel]), {
        color: WHITE,
        width: 1.9,
        alpha: 0.93,
        glow: 0.32,
      });
    }

    ink.line(stroke([nose, keel]), { width: 1.15, color: "#fffef6", alpha: 0.93, glow: 0.1 });
    // 仅沿折脊一侧留一道纸张厚度，缩小时也能看出中间是折面。
    ink.line(`M 1 ${spec.nose + 27} L 2 ${spec.keelY - 14}`, {
      width: 0.65,
      color: spec.spineRight,
      alpha: 0.64,
      glow: 0,
    });
  }


function planeDraw(ctx,ink,motion) {
      drawPaper(ctx, ink, motion, {
        nose: -111, rootX: 19, rootY: 88, keelY: 117,
        width: 136, lift: 9,
        outer: [[136, 60], [124, 85]],
        leadingFold: [[136, 60], [112, 57], [12, -67]],
        foldLeft: "#fff0bf", foldRight: "#ffd68e",
        left: ["#fff1c4", "#ffdf93", "#eaba70"],
        right: ["#ffe2a0", "#efb06b", "#d28d58"],
        spineLeft: "#ecaf67", spineRight: "#b96b48",
      });
    }
return planeDraw;})();

 F['forward-boat-illustration']=(root,K,def)=>svgFactory(root,def,(ctx,t,svg)=>{
  const phase=t*Math.PI/2;ctx.translate(320,162);ctx.scale(.78,.78);ctx.rotate(Math.sin(phase-.35)*.018);
  const ink=inkFor(ctx);hull(ctx,ink);openCabin(ink);lantern(ctx,ink,-8,82,phase,1.1);
  svg.dataset.phase=String(phase);svg.dataset.sail='removed';
 });
 F['forward-plane-illustration']=(root,K,def)=>svgFactory(root,def,(ctx,t,svg)=>{
  const phase=t*Math.PI/2;ctx.translate(320,162);ctx.scale(.9,.9);ctx.rotate(Math.sin(phase-.35)*.05);
  planeDraw(ctx,inkFor(ctx),{t,phase});svg.dataset.phase=String(phase);
 });
})();

/* 原蓝色敞篷车与逐只脱离的气球 */
(()=>{
let ctx,drawingContext;
const W=900,H=1200,DURATION=14,BLUE='#0e3cf1',WHITE='#ffffff';
const BALLOON_COUNT=35;
const CAR_SCALE=.64;
const COLORS=['#ff6862','#ffad46','#ffe365','#68d694','#67c9ed','#758be9','#ba91df'];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const ease=(t,a,b)=>smooth((t-a)/(b-a));
const pt=(x,y)=>({x,y});
const blend=(a,b,t)=>pt(mix(a.x,b.x,t),mix(a.y,b.y,t));
const ground=x=>1090-6*Math.sin(Math.PI*x/W);
// 先跟车；气球清空后镜头逐渐落后，汽车仍保持同一实际速度。
const DRIVE_SPEED=360,DEPART_SCREEN_SPEED=210,START_X=470,CAMERA_RELEASE_SECONDS=.7;
function driveDistance(t){return DRIVE_SPEED*t}
function cameraLag(t){
  const elapsed=Math.max(0,t-DEPART_AT),u=clamp(elapsed/CAMERA_RELEASE_SECONDS);
  // 平滑增加车在画面中的速度，积分后使位置与速度都连续。
  return DEPART_SCREEN_SPEED*(elapsed<CAMERA_RELEASE_SECONDS
    ?CAMERA_RELEASE_SECONDS*(u*u*u-.5*u*u*u*u):elapsed-CAMERA_RELEASE_SECONDS/2);
}
function carX(t){return START_X+cameraLag(t)}
function cameraTravel(t){return driveDistance(t)-cameraLag(t)}

const variation=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)};
const balloonSize=i=>.76+variation(i+41)*.45;

function vehicleBob(t){return Math.sin(t*9)*.7+Math.sin(t*3.2)*.45}
function vehiclePose(t){const x=carX(t),bob=vehicleBob(t);return {x,y:ground(x)+bob,bob,angle:0}}
function trackedTether(t){return pt(START_X-152*CAR_SCALE,ground(START_X)+vehicleBob(t)-177*CAR_SCALE)}
function world(t,p){const car=vehiclePose(t);return pt(car.x+p.x*CAR_SCALE,car.y+p.y*CAR_SCALE)}
function tether(t){return world(t,pt(-152,-177))}
function release(i){return 1.1+Math.floor(i/7)*1.5+(i%7)*.105}
function attachedTilt(i,t){return -.38+(variation(i+19)-.5)*.22+Math.sin(t*1.3+i)*.055}
function balloonTilt(i,t){
  const r=release(i);
  if(t<=r)return attachedTilt(i,t);
  const free=-.13+Math.sin(t*1.15+i)*.13;
  return mix(attachedTilt(i,r),free,ease(t,r,r+1.6));
}
function attached(i,t){
  const anchor=trackedTether(t),r=Math.sqrt((i+.6)/BALLOON_COUNT);
  const a=i*2.39996+(variation(i+7)-.5)*.65;
  // 整簇被迎面风向左带起，绳子斜向后方；每只仍有独立轻摆。
  return pt(anchor.x-116+Math.cos(a)*94*r+(variation(i+51)-.5)*12+Math.sin(t*1.7)*6+Math.sin(t*(1.2+variation(i))+i)*3,
    anchor.y-285+Math.sin(a)*139*r+(variation(i+81)-.5)*20+Math.sin(t*.95+i*1.7)*4);
}
function attachedVelocity(i,t){
  const dt=.0001,before=attached(i,t-dt),after=attached(i,t+dt);
  return pt((after.x-before.x)/(2*dt),(after.y-before.y)/(2*dt));
}
function trackedBalloonState(i,t){
  const r=release(i);
  if(t<=r)return {p:attached(i,t),age:0,flight:0};
  const age=t-r,start=attached(i,r),velocity=attachedVelocity(i,r);
  // 向后漂移的速度换算到跟车镜头中，车与气球的相对运动保持连贯。
  const wind=-(DRIVE_SPEED*.6+variation(i+92)*32),rise=-68-variation(i+123)*23;
  // 松开时保留原速度，再受风与浮力影响向左上飘，位置和速度都不跳变。
  const dragX=.55,dragY=.42;
  const dx=wind*age+(velocity.x-wind)*dragX*(1-Math.exp(-age/dragX));
  const dy=rise*age+(velocity.y-rise)*dragY*(1-Math.exp(-age/dragY));
  return {p:pt(start.x+dx,start.y+dy),age,flight:1-Math.exp(-age/.8)};
}
function trackedBalloonString(i,t){
  const s=trackedBalloonState(i,t),size=balloonSize(i),tilt=balloonTilt(i,t),r=release(i);
  const tip=pt(s.p.x-Math.sin(tilt)*34*size,s.p.y+Math.cos(tilt)*34*size);
  const freeEnd=pt(s.p.x+22+Math.sin(t*1.4+i)*12,s.p.y+(100+variation(i+67)*28)*size);
  // 绳尾从车尾松开后自然垂落，不再跟着车走，也不随升空凭空消失。
  const end=t<=r?trackedTether(t):blend(trackedTether(r),freeEnd,ease(t,r,r+.9));
  return {tip,end,opacity:1};
}
function trackedBalloonRightEdge(i,t){
  const {p}=trackedBalloonState(i,t),string=trackedBalloonString(i,t);
  return Math.max(p.x+40*balloonSize(i),string.tip.x+10,string.end.x)+2;
}
function findDepartureTime(){
  const lastRelease=release(BALLOON_COUNT-1);
  for(let frame=0;frame<Math.ceil((DURATION-lastRelease)*120);frame++){
    const t=lastRelease+frame/120;
    if(Array.from({length:BALLOON_COUNT},(_,i)=>trackedBalloonRightEdge(i,t)).every(x=>x<-8))return t;
  }
  return DURATION;
}
function balloonState(i,t){
  const state=trackedBalloonState(i,t);
  return {...state,p:pt(state.p.x+cameraLag(t),state.p.y)};
}
function balloonString(i,t){
  const string=trackedBalloonString(i,t),dx=cameraLag(t);
  return {...string,tip:pt(string.tip.x+dx,string.tip.y),end:pt(string.end.x+dx,string.end.y)};
}
function drawBalloon(i,t,layer='both'){
  const s=balloonState(i,t),p=s.p,color=COLORS[i%7];
  if(layer!=='body'){
    const string=balloonString(i,t),from=string.end,to=string.tip;
    noFill();stroke(255,255,255,178);strokeWeight(.95);
    bezier(from.x,from.y,from.x-20,from.y+(to.y-from.y)*.36,to.x+10,to.y-(to.y-from.y)*.27,to.x,to.y);
  }
  if(layer==='strings')return;
  // 始终保留完整球形、结口和反光，只随风离开画面。
  const size=balloonSize(i),tilt=balloonTilt(i,t),rx=26*size,ry=34*size;
  push();translate(p.x,p.y);rotate(tilt);
  noStroke();fill(color);
  const g=drawingContext.createRadialGradient(-rx*.35,-ry*.48,1,0,0,ry*1.25);
  g.addColorStop(0,tintHex(color,.16));g.addColorStop(.65,color);g.addColorStop(1,tintHex(color,-.04));
  drawingContext.fillStyle=g;
  beginShape();for(let j=0;j<96;j++){
    const q=j/96*Math.PI*2;vertex(Math.cos(q)*rx*(1-.14*Math.sin(q)),Math.sin(q)*ry);
  }endShape(CLOSE);
  fill(color);triangle(0,ry-1,-3*size,ry+3*size,4*size,ry+3*size);
  push();translate(-rx*.35,-ry*.53);rotate(-.5);
  fill(255,255,255,155);ellipse(0,0,6*size,12*size);pop();pop();
}
function tintHex(hex,k){
  const a=[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16));
  return '#'+a.map(v=>Math.round(k>=0?mix(v,255,k):v*(1+k)).toString(16).padStart(2,'0')).join('');
}
const DEPART_AT=findDepartureTime();
/* 小葵与敞篷车：按 xiaokui-car-arm-trimmed.png 的批准造型转绘。
 * 只用 p5.js 曲线，轮胎底为本地 y=0；整车位移由 scene.js 控制。
 */
const XIAOKUI_EXHAUST_PORT = {x: -253, y: -47};
function xiaokuiSteering(t) {
  return Math.sin(t * 2.1) * .14 + Math.sin(t * .85) * .035;
}
function drawXiaokuiCar(t, travel = t * 360, meow = 0) {
  const WHITE = '#FFFFFF';
  const FUR = '#958878';
  const INNER_EAR = '#78634E';
  const INK = '#09244F';
  const BLUE = '#0077FF';
  const DEEP_BLUE = '#064DDD';
  const EDGE = '#87BFFF';

  // 沿用批准图比例，每个闭合形状都恢复填充，避免受前一条线影响。
  function path(commands, color, outline, weight = 1) {
    if (color) fill(color); else noFill();
    if (outline) { stroke(outline); strokeWeight(weight); } else noStroke();
    beginShape();
    for (const [op, ...p] of commands) {
      if (op === 'M' || op === 'L') vertex(...p);
      else if (op === 'C') bezierVertex(...p);
    }
    if (color) endShape(CLOSE); else endShape();
  }

  function wheel(cx) {
    push();
    translate(cx, 1078);
    // 车轮转角跟随累计路程，速度变化时仍与行驶距离一致。
    rotate(travel / (96 * 0.52));
    noStroke();
    fill(DEEP_BLUE); ellipse(0, 0, 192, 192);
    fill(BLUE); ellipse(0, 0, 188, 188);
    fill(WHITE); ellipse(0, 0, 96, 96);
    // 三个较大的蓝色轮毂孔在小尺寸下也能读出转动。
    fill(BLUE);
    for (let i = 0; i < 3; i++) {
      push();
      rotate(i * Math.PI * 2 / 3);
      ellipse(0, -28, 18, 26);
      pop();
    }
    ellipse(0, 0, 15, 15);
    // 两侧短亮纹交替露出，车身遮到上沿时下半轮仍有运动标记。
    noFill(); stroke('#D9F4FF'); strokeWeight(9);
    arc(0, 0, 166, 166, 0.55, 0.88);
    stroke('#69CFFF'); strokeWeight(7);
    arc(0, 0, 166, 166, Math.PI + 0.58, Math.PI + 0.85);
    pop();
  }

  function cat() {
    // 圆润挺直的身体，白色胸腹分开灰色腰侧与短前臂。
    path([
      ['M', 600, 759], ['C', 579, 779, 574, 822, 582, 852],
      ['C', 586, 867, 592, 878, 614, 886],
      ['L', 760, 886], ['C', 778, 869, 779, 845, 768, 827],
      ['C', 769, 804, 759, 781, 744, 764],
      ['C', 702, 750, 645, 751, 600, 759]
    ], WHITE);
    path([
      ['M', 600, 759], ['C', 579, 779, 574, 822, 582, 852],
      ['C', 586, 867, 592, 878, 614, 886], ['L', 638, 883],
      ['C', 627, 859, 624, 841, 621, 819],
      ['C', 621, 796, 620, 783, 608, 776]
    ], FUR);

    // 前臂、前爪和方向盘一同轻摆，握持位置始终连在一起。
    const steering = xiaokuiSteering(t);
    push();translate(763, 854);rotate(steering * .55);translate(-763, -854);
    // 远侧短前臂自然搭向方向盘。
    path([
      ['M', 746, 768], ['C', 761, 774, 770, 792, 778, 803],
      ['C', 787, 806, 797, 812, 798, 824],
      ['C', 797, 841, 787, 854, 778, 861],
      ['C', 764, 864, 754, 851, 756, 837],
      ['C', 762, 815, 750, 804, 746, 768]
    ], FUR);

    // 小块灰色前臂止于白爪前，与灰色腰侧分开。
    path([
      ['M', 649, 811], ['C', 658, 814, 670, 819, 681, 823],
      ['C', 676, 832, 674, 841, 677, 850],
      ['C', 660, 848, 648, 839, 646, 827],
      ['C', 645, 821, 646, 816, 649, 811]
    ], FUR);
    path([
      ['M', 649, 839], ['C', 656, 848, 667, 854, 680, 856],
      ['C', 689, 856, 700, 851, 708, 844]
    ], null, '#E8E4DF', 1.8);

    // 方向盘位于两只白爪后方。
    push();
    translate(763, 854);
    rotate(-0.20);
    noFill(); stroke(DEEP_BLUE); strokeWeight(17);
    ellipse(0, 0, 96, 68);
    stroke(BLUE); strokeWeight(12);
    ellipse(0, -3, 96, 68);
    // 轮辐在椭圆轮圈内转动，缩小后也能看清轻微修正方向的动作。
    push();translate(0, -3);scale(1, .7);rotate(steering * 1.8);
    strokeWeight(8);
    for(let i=0;i<3;i++){
      const a=-Math.PI/2+i*Math.PI*2/3;
      line(0, 0, Math.cos(a)*40, Math.sin(a)*40);
    }
    noStroke();fill(BLUE);circle(0, 0, 17);pop();
    pop();
    path([
      ['M', 692, 822], ['C', 704, 817, 719, 820, 727, 831],
      ['C', 735, 841, 730, 854, 719, 861],
      ['C', 708, 869, 690, 868, 679, 861],
      ['C', 670, 852, 675, 832, 692, 822]
    ], WHITE);
    path([
      ['M', 785, 803], ['C', 799, 799, 812, 805, 816, 818],
      ['C', 821, 831, 812, 841, 800, 843],
      ['C', 787, 845, 774, 838, 775, 826],
      ['C', 778, 818, 776, 808, 785, 803]
    ], WHITE);
    pop();

    // 头部与不对称花纹一起轻微转动。
    push();
    translate(670, 776);
    rotate(Math.sin(t * 0.72) * 0.007);
    translate(-670, -776);
    path([
      ['M', 583, 656], ['C', 576, 637, 576, 609, 590, 595],
      ['C', 599, 589, 626, 607, 641, 622],
      ['C', 662, 614, 684, 613, 706, 620],
      ['C', 720, 607, 739, 594, 750, 594],
      ['C', 760, 603, 761, 636, 756, 656],
      ['C', 772, 675, 780, 695, 780, 714],
      ['C', 780, 745, 765, 764, 742, 776],
      ['C', 706, 792, 651, 792, 609, 778],
      ['C', 577, 767, 561, 747, 560, 725],
      ['C', 558, 701, 568, 676, 583, 656]
    ], FUR);
    path([
      ['M', 589, 651], ['C', 585, 635, 587, 617, 594, 608],
      ['C', 606, 610, 617, 619, 627, 630],
      ['C', 612, 635, 600, 643, 589, 651]
    ], INNER_EAR);
    path([
      ['M', 718, 627], ['C', 727, 616, 739, 607, 747, 606],
      ['C', 753, 617, 754, 632, 750, 646],
      ['C', 741, 638, 728, 631, 718, 627]
    ], INNER_EAR);
    path([
      ['M', 560, 725], ['C', 580, 742, 603, 751, 629, 752],
      ['C', 649, 753, 665, 746, 674, 733],
      ['C', 687, 718, 680, 701, 675, 686],
      ['C', 669, 675, 678, 651, 682, 639],
      ['C', 690, 659, 696, 678, 705, 693],
      ['C', 714, 709, 720, 724, 733, 732],
      ['C', 746, 740, 761, 742, 775, 738],
      ['C', 765, 764, 739, 780, 710, 784],
      ['C', 678, 792, 641, 786, 609, 778],
      ['C', 581, 768, 562, 748, 560, 725]
    ], WHITE);

    const cycle = ((t % 7.2) + 7.2) % 7.2;
    const blink = Math.max(0, 1 - Math.abs(cycle - 4.3) / 0.14);
    noStroke(); fill(INK);
    ellipse(663, 715, 30, 31 * (1 - blink) + 3 * blink);
    ellipse(744, 710, 26, 29 * (1 - blink) + 3 * blink);
    path([
      ['M', 702, 728], ['C', 707, 725, 716, 725, 720, 730],
      ['C', 722, 735, 716, 741, 712, 742],
      ['C', 707, 741, 699, 734, 702, 728]
    ], INK);
    noStroke(); fill(FUR); ellipse(726, 747, 21, 19);
    const opening = Math.max(0, Math.min(1, meow));
    if(opening > .01){
      // 嘴、舌尖与下巴围绕上唇一起收小，保留原来的开合节奏。
      push();translate(708, 747);scale(.75);translate(-708, -747);
      const mouthWidth = 10 + 28 * opening, mouthHeight = 3 + 39 * opening;
      const mouthTop = 747, mouthBottom = mouthTop + mouthHeight;
      path([
        ['M', 686, 770], ['C', 685, 777, 688, mouthBottom + 8, 706, mouthBottom + 9],
        ['C', 724, mouthBottom + 10, 735, 781, 732, 769],
        ['C', 720, 765, 698, 765, 686, 770]
      ], WHITE);
      path([
        ['M', 708 - mouthWidth / 2, mouthTop + 5],
        ['C', 708 - mouthWidth / 2, mouthTop - 3, 708 + mouthWidth / 2, mouthTop - 3, 708 + mouthWidth / 2, mouthTop + 5],
        ['C', 708 + mouthWidth / 2, mouthBottom - 5, 718, mouthBottom, 708, mouthBottom],
        ['C', 698, mouthBottom, 708 - mouthWidth / 2, mouthBottom - 5, 708 - mouthWidth / 2, mouthTop + 5]
      ], INK);
      noStroke();fill('#B9DDFF');
      ellipse(708, mouthBottom - 7 * opening, 21 * opening, 9 * opening);
      pop();
    }else{
      path([
        ['M', 712, 740], ['C', 716, 745, 715, 751, 711, 754],
        ['C', 708, 757, 704, 757, 701, 755]
      ], null, INK, 4.3);
    }
    pop();
  }

  // 小排气管藏在后保险杠下，尾气使用同一出口坐标。
  push();strokeCap(ROUND);strokeWeight(6);stroke('#8AC9FF');
  line(XIAOKUI_EXHAUST_PORT.x+22, XIAOKUI_EXHAUST_PORT.y,
    XIAOKUI_EXHAUST_PORT.x, XIAOKUI_EXHAUST_PORT.y);
  noStroke();fill('#D9F4FF');
  ellipse(XIAOKUI_EXHAUST_PORT.x, XIAOKUI_EXHAUST_PORT.y, 4, 7);
  pop();

  push();
  scale(0.52);
  translate(-710, -1174);
  strokeCap(ROUND);
  strokeJoin(ROUND);

  // 内饰与座椅位于小葵和车门后方。
  path([
    ['M', 504, 837], ['C', 528, 810, 568, 810, 605, 818],
    ['L', 805, 838], ['L', 849, 888], ['L', 526, 904],
    ['C', 510, 886, 502, 862, 504, 837]
  ], DEEP_BLUE);
  path([
    ['M', 547, 790], ['C', 565, 786, 582, 800, 588, 821],
    ['L', 598, 891], ['L', 544, 891],
    ['C', 529, 868, 519, 831, 524, 809],
    ['C', 526, 797, 535, 791, 547, 790]
  ], '#0765ED');
  path([
    ['M', 541, 793], ['C', 564, 790, 575, 808, 576, 832],
    ['L', 581, 883], ['L', 537, 880],
    ['C', 524, 866, 518, 837, 521, 816],
    ['C', 523, 802, 530, 794, 541, 793]
  ], BLUE);
  cat();

  // 淡蓝玻璃、白色窗框与一道清晰反光。
  path([
    ['M', 843, 881], ['L', 810, 776],
    ['C', 804, 755, 809, 741, 827, 738],
    ['C', 845, 735, 857, 742, 869, 757],
    ['L', 934, 854], ['L', 862, 881]
  ], WHITE);
  path([
    ['M', 864, 855], ['L', 828, 773],
    ['C', 821, 756, 827, 746, 840, 745],
    ['C', 851, 744, 858, 752, 866, 763],
    ['L', 922, 850], ['L', 882, 859]
  ], '#51CBF5');
  path([
    ['M', 859, 758], ['C', 877, 783, 892, 811, 902, 840]
  ], null, WHITE, 7.5);

  // 轮拱衬底在车身下方，轮胎底部对齐本地 y=0。
  path([
    ['M', 282, 1040], ['L', 334, 997], ['L', 512, 986],
    ['L', 542, 1099], ['L', 865, 1099], ['L', 895, 987],
    ['L', 1073, 987], ['L', 1123, 1076], ['L', 1063, 1104],
    ['L', 354, 1104], ['L', 288, 1084]
  ], DEEP_BLUE);
  wheel(426);
  wheel(976);

  // 白色车身为轮胎留出弧形缺口，车门遮住坐姿下半身。
  path([
    ['M', 367, 869], ['C', 406, 843, 469, 834, 511, 828],
    ['C', 505, 850, 511, 862, 534, 866], ['L', 838, 869],
    ['C', 847, 856, 860, 850, 883, 850],
    ['C', 958, 846, 1034, 864, 1090, 892],
    ['C', 1138, 916, 1157, 958, 1166, 1015],
    ['C', 1174, 1055, 1166, 1087, 1128, 1094],
    ['C', 1105, 1098, 1090, 1098, 1087, 1072],
    ['C', 1079, 1010, 1037, 968, 976, 968],
    ['C', 916, 968, 875, 1009, 867, 1073],
    ['C', 865, 1096, 857, 1102, 838, 1102],
    ['L', 559, 1102], ['C', 541, 1102, 536, 1099, 533, 1074],
    ['C', 525, 1012, 484, 968, 426, 968],
    ['C', 368, 968, 326, 1008, 317, 1068],
    ['C', 314, 1084, 307, 1089, 294, 1086],
    ['C', 269, 1086, 255, 1067, 255, 1038],
    ['C', 250, 1000, 262, 949, 286, 921],
    ['C', 306, 898, 336, 881, 367, 869]
  ], WHITE);

  // 细蓝色边线让缩小后的白色车身仍然清楚。
  path([
    ['M', 368, 868], ['C', 407, 857, 450, 853, 488, 854]
  ], null, EDGE, 4.8);
  path([
    ['M', 309, 1034], ['C', 327, 973, 373, 942, 426, 942],
    ['C', 492, 942, 538, 986, 552, 1068]
  ], null, EDGE, 5);
  path([
    ['M', 326, 998], ['C', 350, 960, 386, 942, 426, 942],
    ['C', 462, 942, 499, 960, 522, 998]
  ], null, EDGE, 11);
  path([
    ['M', 848, 1066], ['C', 859, 988, 908, 942, 975, 942],
    ['C', 1039, 942, 1088, 988, 1102, 1061]
  ], null, EDGE, 5);
  path([
    ['M', 876, 992], ['C', 901, 959, 938, 942, 975, 942],
    ['C', 1013, 942, 1050, 960, 1074, 992]
  ], null, EDGE, 11);
  path([
    ['M', 558, 883], ['C', 540, 917, 539, 954, 550, 994],
    ['C', 560, 1034, 581, 1064, 621, 1068],
    ['C', 670, 1074, 759, 1073, 798, 1068],
    ['C', 818, 1066, 826, 1059, 830, 1037],
    ['C', 838, 990, 840, 930, 841, 886]
  ], null, EDGE, 4.5);
  path([
    ['M', 559, 875], ['L', 835, 875]
  ], null, '#A7D8FF', 10);
  path([
    ['M', 874, 876], ['C', 946, 876, 1021, 886, 1074, 909]
  ], null, EDGE, 4.1);

  // 车门把手、尾灯、椭圆前灯与圆润保险杠。
  noStroke();
  fill('#086BFC'); ellipse(601, 921, 60, 27);
  fill('#8CCEFF'); ellipse(601, 917, 55, 22);
  fill('#B9E8FF'); ellipse(592, 913, 24, 7);
  push(); translate(277, 954); rotate(0.39);
  fill('#FF7451'); ellipse(0, 0, 25, 69);
  fill('#FF9472'); ellipse(-5, -8, 5, 38);
  pop();
  push(); translate(1125, 942); rotate(-0.18);
  fill('#176FFE'); ellipse(0, 0, 57, 94);
  fill('#A0D1FF'); ellipse(5, -1, 43, 83);
  fill(WHITE); ellipse(8, -2, 29, 66);
  pop();
  path([
    ['M', 252, 1013], ['C', 242, 1016, 236, 1028, 237, 1045],
    ['C', 237, 1061, 247, 1067, 262, 1068],
    ['L', 282, 1070], ['C', 294, 1070, 298, 1061, 298, 1049],
    ['C', 298, 1035, 292, 1024, 281, 1021]
  ], '#8AC9FF');
  path([
    ['M', 1136, 1033], ['C', 1124, 1036, 1118, 1048, 1119, 1063],
    ['C', 1120, 1077, 1130, 1081, 1144, 1079],
    ['L', 1163, 1075], ['C', 1178, 1071, 1184, 1061, 1183, 1049],
    ['C', 1182, 1036, 1174, 1026, 1163, 1028]
  ], '#8AC9FF');
  pop();
}

const CLOSE = 1, ROUND = 'ROUND';
const TAU = Math.PI * 2;
const styleStack = [];
let doFill = true, doStroke = false, firstVertex = true;
const colorOf = c => c.length >= 3
  ? `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c.length > 3 ? c[3] / 255 : 1})`
  : String(c[0]);
function fill(...c) { doFill = true; if (c.length) ctx.fillStyle = colorOf(c); }
function stroke(...c) { doStroke = true; if (c.length) ctx.strokeStyle = colorOf(c); }
function noFill() { doFill = false; }
function noStroke() { doStroke = false; }
function strokeWeight(w) { ctx.lineWidth = w; }
function strokeCap(v) { ctx.lineCap = { ROUND: 'round', PROJECT: 'square', SQUARE: 'butt' }[v] || 'butt'; }
function strokeJoin(v) { ctx.lineJoin = { ROUND: 'round', MITER: 'miter', BEVEL: 'bevel' }[v] || 'miter'; }
function push() { styleStack.push([doFill, doStroke]); ctx.save(); }
function pop() { const s = styleStack.pop(); if (s) { doFill = s[0]; doStroke = s[1]; } ctx.restore(); }
function translate(x, y) { ctx.translate(x, y); }
function rotate(a) { ctx.rotate(a); }
function scale(x, y) { ctx.scale(x, y ?? x); }
function beginShape() { ctx.beginPath(); firstVertex = true; }
function vertex(x, y) { if (firstVertex) { ctx.moveTo(x, y); firstVertex = false; } else ctx.lineTo(x, y); }
function bezierVertex(a, b, c, d, e, f) { if (firstVertex) { ctx.moveTo(a, b); firstVertex = false; } ctx.bezierCurveTo(a, b, c, d, e, f); }
function endShape(close) { if (close) ctx.closePath(); if (doFill) ctx.fill(); if (doStroke) ctx.stroke(); }
function ellipse(x, y, w, h) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, TAU); if (doFill) ctx.fill(); if (doStroke) ctx.stroke(); }
function circle(x, y, d) { ellipse(x, y, d, d); }
function triangle(a, b, c, d, e, f) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.lineTo(e, f); ctx.closePath(); if (doFill) ctx.fill(); if (doStroke) ctx.stroke(); }
function line(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); if (doStroke) ctx.stroke(); }
function arc(x, y, w, h, a0, a1) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(w) / 2, Math.abs(h) / 2, 0, a0, a1); if (doFill) ctx.fill(); if (doStroke) ctx.stroke(); }
function bezier(a, b, c, d, e, f, g, h) { ctx.beginPath(); ctx.moveTo(a, b); ctx.bezierCurveTo(c, d, e, f, g, h); if (doFill) ctx.fill(); if (doStroke) ctx.stroke(); }
function background(c) { ctx.fillStyle = colorOf([c]); ctx.fillRect(0, 0, W, H); }





 function drawDrive(target,t,vehicleOnly){
  ctx=drawingContext=target;ctx.lineCap='round';ctx.lineJoin='round';doFill=true;doStroke=false;styleStack.length=0;

  if(vehicleOnly){translate(320,260);scale(CAR_SCALE);drawXiaokuiCar(2,0,0);return;}
  for(let i=BALLOON_COUNT-1;i>=0;i--)drawBalloon(i,t,'strings');
  for(let i=BALLOON_COUNT-1;i>=0;i--)drawBalloon(i,t,'body');
  const car=vehiclePose(t);push();translate(car.x,car.y);scale(CAR_SCALE);drawXiaokuiCar(t,driveDistance(t)/CAR_SCALE,0);pop();
 }
 F['drive-balloon-release']=(root,K,def)=>svgFactory(root,def,(ctx,t,svg)=>{
  ctx.fillStyle=BLUE;ctx.fillRect(0,0,900,1200);drawDrive(ctx,t,false);
  svg.dataset.released=String(Array.from({length:BALLOON_COUNT},(_,i)=>t>release(i)).filter(Boolean).length);
  svg.dataset.firstX=String(balloonState(0,t).p.x);svg.dataset.firstY=String(balloonState(0,t).p.y);
  svg.dataset.firstEndX=String(balloonString(0,t).end.x);svg.dataset.firstEndY=String(balloonString(0,t).end.y);
 },'0 360 900 850');
 F['drive-car-illustration']=(root,K,def)=>{
  const render=svgFactory(root,def,ctx=>drawDrive(ctx,2,true));render(0);return ()=>{};
 };
})();

/* 原蒲公英主体、种子、开场气流与青蛙落水 */
(()=>{
 const TAU=Math.PI*2,OPENING_BURST=1.65;
 const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};const mod=(a,b)=>((a%b)+b)%b;
 class DandelionJourney{
    constructor() {

      this.threads=Array.from({length:5600},(_,i)=>({
        x:mod(i*557.731,1100)-100, y:mod(i*331.793,1480),
        phase:i*2.39996, length:12+mod(i*7.37,36), tone:i%5,
      }));
      this.openingMotes=Array.from({length:760},(_,i)=>({
        x:mod(i*557.731,1120)-110,y:mod(i*331.793,1480)-140,
        phase:i*2.39996,radius:0.65+mod(i*1.73,1.05),tone:i%3,
      }));
      let seed=76139;
      const random=(a,b)=>{seed=seed*16807%2147483647;return a+(b-a)*seed/2147483647;};

      this.leaves=[];
      for(let attempt=0;this.leaves.length<18&&attempt<500;attempt++){
        const leaf={x:random(45,855),y:random(0,2600),r:random(28,61),phase:random(0,TAU)};
        if(this.leaves.some(other=>Math.hypot(leaf.x-other.x,Math.min(Math.abs(leaf.y-other.y),2600-Math.abs(leaf.y-other.y)))<leaf.r+other.r+26))continue;
        leaf.flower=[1,6,12,16].includes(this.leaves.length);
        this.leaves.push(leaf);
      }
      this.pondEvents=null;

      this.wheat=Array.from({length:480},()=>({x:random(18,882),y:random(0,2200),
        height:random(46,105),ear:random(14,26),phase:random(0,TAU),tone:Math.floor(random(0,3))}));
      this.slopeGrass=Array.from({length:1800},()=>({x:random(-30,930),y:random(0,2200),
        length:random(8,25),phase:random(0,TAU),tone:Math.floor(random(0,3))}));
      this.mountains=Array.from({length:5},(_,i)=>({phase:i*1.73,peak:random(270,650)}));
      this.rocks=Array.from({length:90},(_,i)=>({band:i%5,x:random(-20,920),offset:random(100,470),r:random(3,14),phase:random(0,TAU)}));
      this.trees=[];
      for(let attempt=0;this.trees.length<23&&attempt<500;attempt++){
        const tree={x:random(50,850),y:random(0,2600),size:random(0.75,1.2),phase:random(0,TAU)};
        if(this.trees.some(other=>Math.hypot(tree.x-other.x,Math.min(Math.abs(tree.y-other.y),2600-Math.abs(tree.y-other.y)))<155))continue;
        this.trees.push(tree);
      }
      this.trees.forEach((tree,i)=>{
        tree.band=i%5;tree.y=this.ridgeY(tree.x,tree.band)+random(140,370);
        tree.form=i%2;tree.adultHeight=random(85,245);tree.width=random(28,82);
        tree.stretch=random(0.75,1.55);tree.lean=random(-28,28);tree.tone=i%3;
        tree.lobes=Array.from({length:Math.floor(random(6,13))},()=>({
          x:random(-0.7,0.7),y:random(-0.6,0.5),r:random(0.32,0.56)}));
      });
      this.openingSeeds=Array.from({length:96},(_,i)=>{
        const angle=i*2.39996,r=112*Math.sqrt((i+0.5)/96);
        return {id:i,angle,x:Math.cos(angle)*r,y:Math.sin(angle)*r,radius:7+2*r/112};
      });
      this.heroSeed=this.openingSeeds.reduce((best,seed)=>
        Math.hypot(seed.x-78,seed.y+65)<Math.hypot(best.x-78,best.y+65)?seed:best);

      this.filaments=Array.from({length:137},(_,i)=>({id:i,angle:-Math.PI+i*Math.PI/136,dropAt:Infinity}));
      this.drifters=Array.from({length:44},(_,i)=>{
        const slot=(i*29)%this.filaments.length,born=4.65+i*0.485;
        this.filaments[slot].dropAt=born;
        return {slot,born,size:5.8+mod(i*1.73,4.2),side:i%2?1:-1,phase:i*2.39996};
      });
      this.sowing=[];
      for(const filament of this.filaments.filter(f=>!Number.isFinite(f.dropAt))){

        const a=random(0,TAU),r=Math.sqrt(random(0,1));
        const x=720+Math.cos(a)*145*r,y=1000+Math.sin(a)*140*r;
        const delay=random(0,0.18),reach=Math.hypot(x-710,y-875);
        const flight=0.85+reach/520+random(0,0.16);
        this.sowing.push({slot:filament.id,x,y,angle:Math.atan2(y-875,x-710),
          size:random(4.5,7),delay,born:27.65+delay,flight,
          wake:0.12+random(0,0.25),growDuration:random(0.8,1.15),phase:random(0,TAU)});
      }
    }
    ridgeY(x,band) {
      const m=this.mountains[mod(band,5)];

      return band*600+(x-450)*0.17-150*Math.exp(-(((x-m.peak)/160)**2))
        +28*Math.sin(x*0.014+m.phase)+18*Math.sin(x*0.033+m.phase);
    }
    shedCount(t) { return this.drifters.reduce((n,seed)=>n+smooth(seed.born,seed.born+0.12,t),0); }
    tuftRadius(t) { return 42-this.shedCount(t)*0.22; }
    filamentShape(f,thinning) {
      const rank=mod(f.id*0.618034,1);

      return {angle:f.angle,length:1-thinning*(0.025+rank*0.13),
        tip:1-thinning*(0.3+rank*0.5),weight:1-thinning*rank*0.16};
    }
    filamentState(t) {
      const thinning=this.shedCount(t)/this.drifters.length;
      return this.filaments.map(f=>{
        const final=this.sowing.find(seed=>seed.slot===f.id);
        const born=final?final.born:f.dropAt;
        return Object.assign({},this.filamentShape(f,thinning),{opacity:1-smooth(born,born+0.12,t)});
      });
    }
    gustAt(t,x) {
      const front=710+(t-27.65)*1000;
      return Math.exp(-(((x-front)/205)**2))*smooth(26.6,27,t)*(1-smooth(28.1,28.6,t));
    }
    openingGrowth(seed,t) {
      const rank=Math.hypot(seed.x,seed.y)/112;
      return smooth(0.62+rank*0.18,0.92+rank*0.5,t);
    }
    openingEvent(t) {
      const age=Math.max(0,t-OPENING_BURST);
      return {age,
        cx:450+Math.sin(Math.min(t,OPENING_BURST)*1.3)*7,cy:530+this.distance(t)*0.72,
        color:smooth(OPENING_BURST,OPENING_BURST+0.24,t),
        settle:smooth(2.08,3.15,t),
        release:smooth(OPENING_BURST,OPENING_BURST+0.18,t),
        radius:355*smooth(0,0.62,age)+Math.max(0,age-0.62)*78,
        recoil:28*Math.sin(Math.max(0,age-0.48)*13)*Math.exp(-Math.max(0,age-0.48)*3.1)*smooth(0.48,0.58,age),
        field:smooth(0.03,0.5,t)*(1-smooth(2.65,4.65,t)),
        water:smooth(2.65,4.65,t),
        motes:smooth(0.02,0.32,t)*(1-smooth(2.25,3.75,t)),
        leaves:smooth(2.75,3.65,t),
      };
    }
    openingDisplacement(x,y,event) {
      const rx=x-event.cx,ry=y-event.cy,r=Math.max(1,Math.hypot(rx,ry));
      const nx=rx/r,ny=ry/r,angle=Math.atan2(ry,rx);
      const roughness=1+0.026*Math.sin(angle*7+event.age*2.1)+0.018*Math.sin(angle*13-event.age*1.7);
      const cleared=Math.max(0,(event.radius+event.recoil)*roughness);

      const outward=Math.hypot(r,cleared)-r;
      const edge=Math.hypot(r,cleared)-cleared;
      const jet=Math.exp(-((edge/145)**2))*event.release;
      return {x:x+nx*outward,y:y+ny*outward,nx,ny,jet};
    }
    openingAir(ctx,s,event) {
      const t=s.time,d=this.distance(t);
      ctx.save();ctx.lineCap='round';
      for(let tone=0;tone<5;tone++){
        ctx.strokeStyle=['#b2bca6','#d0dac5','#e0e9d5','#f2f1d9','#8ba897'][tone];
        ctx.globalAlpha=[0.13,0.22,0.28,0.43,0.12][tone]*event.field;
        ctx.lineWidth=tone===3?1.05:0.7;ctx.beginPath();
        for(let i=tone;i<this.threads.length;i+=5){
          const f=this.threads[i],y=mod(f.y+d,1480)-140;
          const x=f.x+37*Math.sin(y*0.004-t*0.7)+18*Math.sin(f.phase+t*0.6);
          const p=this.openingDisplacement(x,y,event);
          const winding=-0.9+0.65*Math.sin(y*0.004+0.7*Math.sin(x*0.005))+0.5*Math.sin(x*0.004-y*0.002+t*0.3);
          const vx=Math.sin(winding)*(1-p.jet)+p.nx*p.jet*1.65;
          const vy=Math.cos(winding)*(1-p.jet)+p.ny*p.jet*1.65;
          const length=f.length*(0.48+smooth(0.1,1.45,t)*0.68)*(1+p.jet*1.55);
          const bend=Math.sin(f.phase+t*0.65)*2.2;
          ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo(p.x+vx*length*0.45+bend,p.y+vy*length*0.45,p.x+vx*length,p.y+vy*length);
        }ctx.stroke();
      }

      for(let tone=0;tone<3;tone++){
        ctx.fillStyle=['#f4efd3','#d9e5d2','#b2c7b6'][tone];
        ctx.globalAlpha=[0.72,0.48,0.32][tone]*event.motes;ctx.beginPath();
        for(let i=tone;i<this.openingMotes.length;i+=3){
          const f=this.openingMotes[i];
          const x=f.x+18*Math.sin(t*0.4+f.phase)-t*9;
          const y=mod(f.y+140+t*12+d,1480)-140;
          const p=this.openingDisplacement(x,y,event);
          const angle=Math.atan2(p.ny,p.nx),r=f.radius;
          ctx.moveTo(p.x+Math.cos(angle)*r*(1+p.jet*2.1),p.y+Math.sin(angle)*r*(1+p.jet*2.1));
          ctx.ellipse(p.x,p.y,r*(1+p.jet*2.1),r,angle,0,TAU);
        }ctx.fill();
      }
      ctx.restore();
    }
    openingPose(seed,t) {
      const burst=smooth(OPENING_BURST,2.6,t),growth=this.openingGrowth(seed,t);
      const drift=Math.max(0,t-2.3);

      const release=seed.id===this.heroSeed.id?burst:
        1-Math.exp(-Math.max(0,t-OPENING_BURST)*5.2)*(1-smooth(OPENING_BURST,2.6,t));
      const reach=seed.id===this.heroSeed.id?1:1.55;
      const travel=release*(44+mod(seed.id*31,95))*reach+76*(1-Math.exp(-drift*0.8))*smooth(2.3,2.65,t);
      return {x:450+Math.sin(Math.min(t,1.65)*1.3)*7+seed.x*growth+Math.cos(seed.angle)*travel+burst*45,
        y:530+seed.y*growth+Math.sin(seed.angle)*travel,
        radius:seed.radius*growth,angle:seed.angle+Math.PI/2+burst*Math.sin(seed.id)*0.7};
    }
    entryProgress(t) { return smooth(2.35,4.75,t); }
    entryPose(t,courseAt) {
      const start=2.28,end=4.75,span=end-start;
      const source=this.openingPose(this.heroSeed,start),target=this.flightPose(end,courseAt);
      const turn=TAU*Math.round((source.angle-target.angle)/TAU);
      if(t<=start)return this.openingPose(this.heroSeed,t);
      if(t>=end){const pose=this.flightPose(t,courseAt);return Object.assign({},pose,{angle:pose.angle+turn});}
      const sourceBefore=this.openingPose(this.heroSeed,start-0.002),sourceAfter=this.openingPose(this.heroSeed,start+0.002);
      const targetBefore=this.flightPose(end-0.002,courseAt),targetAfter=this.flightPose(end+0.002,courseAt);
      const u=(t-start)/span,u2=u*u,u3=u2*u;

      const join=(key,offset=0)=>
        (2*u3-3*u2+1)*source[key]+(u3-2*u2+u)*span*(sourceAfter[key]-sourceBefore[key])/0.004
        +(-2*u3+3*u2)*(target[key]+offset)+(u3-u2)*span*(targetAfter[key]-targetBefore[key])/0.004;
      return {x:join('x'),y:join('y'),angle:join('angle',turn)};
    }
    subjectPose(t,courseAt) {
      const source=this.openingPose(this.heroSeed,t),pose=this.entryPose(t,courseAt);
      const follow=this.entryProgress(t),settle=smooth(26.1,27.15,t),strength=this.gustAt(t,710);
      const restingAngle=settle>0?this.entryPose(26.1,courseAt).angle:pose.angle;
      return {x:pose.x*(1-settle)+710*settle+strength*30,
        y:pose.y*(1-settle)+875*settle-strength*10,
        radius:source.radius+(this.tuftRadius(t)-source.radius)*follow,
        angle:pose.angle+(restingAngle-pose.angle)*settle-strength*0.16};
    }
    flightPose(t,courseAt) {
      const x=courseAt(t)+Math.sin(t*1.12)*32+Math.sin(t*2.07+0.6)*12;
      const y=470+Math.sin(t*0.86)*27+Math.sin(t*1.83)*13;
      const vx=(courseAt(t+0.04)-courseAt(t-0.04))/0.08+Math.cos(t*1.12)*35.84+Math.cos(t*2.07+0.6)*24.84;
      const gust=Math.sin(t*0.66-0.8)*0.9+Math.sin(t*1.73+0.6)*0.3;

      const roll=TAU*smooth(7.2,9.1,t)-Math.PI*0.45*Math.sin(Math.PI*smooth(16.1,18.2,t));
      return {x,y,angle:-0.15+Math.atan2(vx,125)*0.85+gust+roll};
    }
    distance(t) {

      const integral=(v)=>{const u=Math.max(0,Math.min(1,v));return u*u*u-u*u*u*u/2;};
      const ramp=2.6*integral((t-2.2)/2.6)+Math.max(0,t-4.8);
      const brake=3.5*integral((t-25)/3.5)+Math.max(0,t-28.5);
      return (ramp-brake)*620;
    }
    floret(ctx,x,y,r,angle,alpha=1,filaments=null,stemAlpha=1) {
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);
      ctx.globalAlpha=alpha*stemAlpha;ctx.strokeStyle='#fffde9';ctx.lineWidth=0.85;ctx.beginPath();
      ctx.moveTo(0,0);ctx.quadraticCurveTo(r*0.2,r,0,r*2.1);ctx.stroke();
      const hairs=filaments?filaments.length:(r>20?37:11);
      for(let j=0;j<hairs;j++){
        const opacity=filaments?filaments[j].opacity:1;
        if(opacity<=0)continue;
        ctx.globalAlpha=alpha*opacity;
        const a=filaments?filaments[j].angle:-Math.PI+j*Math.PI/(hairs-1);
        const strand=filaments&&filaments[j],length=r*(strand&&strand.length!=null?strand.length:1),tip=strand&&strand.tip!=null?strand.tip:1;
        const dx=Math.cos(a)*length,dy=Math.sin(a)*length;
        ctx.lineWidth=0.85*(strand&&strand.weight!=null?strand.weight:1);
        ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(dx*0.5,dy*0.7,dx,dy);
        ctx.moveTo(dx-2*tip,dy-2*tip);ctx.lineTo(dx+2*tip,dy+tip);ctx.stroke();
      }
      ctx.globalAlpha=alpha*stemAlpha;ctx.fillStyle='#dec39a';ctx.beginPath();ctx.ellipse(0,r*2.15,1.9,r*0.26,0,0,TAU);ctx.fill();ctx.restore();
    }
    lotus(ctx,x,y,r,growth,phase) {
      ctx.save();ctx.translate(x,y);ctx.rotate(phase*0.1);
      ctx.fillStyle='#064d44';ctx.beginPath();ctx.ellipse(5,10,r*1.08,r*0.82,0,0,TAU);ctx.fill();
      ctx.fillStyle='#66b94d';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,0.16,TAU-0.21);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#b1d87a';ctx.lineWidth=0.7;ctx.beginPath();
      for(let j=1;j<12;j++){const a=j*TAU/12;ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a+0.2)*r*0.55,Math.sin(a+0.2)*r*0.55,Math.cos(a)*r*0.92,Math.sin(a)*r*0.92);}ctx.stroke();
      if(growth>0){
        ctx.translate(-r*0.25,-r*0.1);
        for(let ring=0;ring<2;ring++)for(let j=0;j<8;j++) {
          ctx.save();ctx.rotate(j*TAU/8+ring*0.4);ctx.fillStyle=ring?'#fff0d8':'#f6aeb5';
          const length=(ring?22:36)*growth;
          ctx.beginPath();ctx.moveTo(0,5);ctx.bezierCurveTo(-14*growth,-length*0.4,-9*growth,-length*0.8,0,-length);ctx.bezierCurveTo(9*growth,-length*0.8,14*growth,-length*0.4,0,5);ctx.fill();ctx.restore();
        }
        ctx.fillStyle='#f4cc55';ctx.beginPath();ctx.arc(0,0,5*growth,0,TAU);ctx.fill();
      }ctx.restore();
    }
    leafPosition(leaf,t) {
      return {x:leaf.x+Math.sin(t+leaf.phase)*8,
        y:mod(leaf.y+this.distance(t)-this.distance(3.5),2600)-180};
    }
    frogEvents(courseAt) {
      if(this.pondEvents&&this.pondEvents.courseAt===courseAt)return this.pondEvents.events;
      const candidates=[];

      for(const leaf of this.leaves){
        if(leaf.flower)continue;
        for(let step=0;step<=290;step++){
          const at=3.8+step*0.02,p=this.leafPosition(leaf,at),body=this.subjectPose(at,courseAt);
          const dx=p.x-body.x,dy=p.y-body.y,distance=Math.hypot(dx,dy);
          if(distance>175||dy>25||p.y<100)continue;
          const length=leaf.r+65,normal=distance||1;
          candidates.push({leaf,at,x:p.x,y:p.y,dx:dx/normal*length,dy:dy/normal*length,
            duration:0.46,size:13+leaf.r*0.04});break;
        }
      }
      const events=[];
      for(const event of candidates.sort((a,b)=>a.at-b.at)){
        if(events.every(other=>Math.abs(event.at-other.at)>1.05))events.push(event);
        if(events.length===3)break;
      }
      this.pondEvents={courseAt,events};return events;
    }
    frogPose(event,t) {
      const age=t-event.at,drift=this.distance(t)-this.distance(event.at);
      const u=Math.max(0,Math.min(1,age/event.duration)),lift=Math.sin(u*Math.PI)*64;
      const resting=this.leafPosition(event.leaf,t);
      return {age,u,x:age<0?resting.x:event.x+event.dx*u,
        y:age<0?resting.y:event.y+drift+event.dy*u-lift,
        surfaceY:event.y+drift+event.dy*u,landX:event.x+event.dx,
        landY:event.y+drift+event.dy,angle:Math.atan2(event.dy,event.dx)+Math.PI/2};
    }
    frog(ctx,size,stretch,t,phase) {
      const breath=1+Math.sin(t*1.6+phase)*0.035;
      ctx.scale(breath*(1-stretch*0.22),1+stretch*0.45);
      ctx.strokeStyle='#406c35';ctx.lineWidth=size*0.23;ctx.lineCap='round';
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(side*size*0.45,size*0.4);
        ctx.lineTo(side*size*(0.95-stretch*0.22),size*(0.45+stretch*0.65));
        ctx.lineTo(side*size*0.53,size*(0.9+stretch*0.52));ctx.stroke();
        ctx.beginPath();ctx.moveTo(side*size*0.38,-size*0.3);
        ctx.lineTo(side*size*0.82,-size*0.06);ctx.lineTo(side*size*0.94,-size*0.38);ctx.stroke();
      }
      ctx.fillStyle='#86b64d';ctx.beginPath();ctx.ellipse(0,0,size*0.58,size*0.83,0,0,TAU);ctx.fill();
      ctx.fillStyle='#bed779';ctx.beginPath();ctx.ellipse(-size*0.12,-size*0.1,size*0.2,size*0.6,-0.15,0,TAU);ctx.fill();
      for(const side of [-1,1]){
        ctx.fillStyle='#a4c566';ctx.beginPath();ctx.arc(side*size*0.4,-size*0.59,size*0.23,0,TAU);ctx.fill();
        ctx.fillStyle='#254d31';ctx.beginPath();ctx.arc(side*size*0.4,-size*0.65,size*0.1,0,TAU);ctx.fill();
        ctx.fillStyle='#edebba';ctx.beginPath();ctx.arc(side*size*0.4+1,-size*0.69,size*0.035,0,TAU);ctx.fill();
      }
    }
    pondAnimals(ctx,s) {
      const visibility=s.time<3.65?this.openingEvent(s.time).leaves:1;
      for(const event of this.frogEvents(s.courseAt)){
        const p=this.frogPose(event,s.time),after=p.age-event.duration;
        if(p.y<-90||p.landY>1370||after>1.2)continue;
        if(after<0){

          const crouch=smooth(-0.13,0,p.age)*(1-smooth(0,0.08,p.age));
          if(p.age>=0){ctx.save();ctx.globalAlpha=0.2*(1-p.u)*visibility;ctx.fillStyle='#044d45';
            ctx.beginPath();ctx.ellipse(p.x+5,p.surfaceY+8,event.size*0.8,event.size*0.42,0,0,TAU);ctx.fill();ctx.restore();}
          ctx.save();ctx.globalAlpha=(1-smooth(0.86,1,p.u))*visibility;ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(1+crouch*0.15,1-crouch*0.2);
          this.frog(ctx,event.size,Math.sin(p.u*Math.PI),s.time,event.leaf.phase);ctx.restore();
        }else{
          ctx.save();ctx.strokeStyle='#a7d6ad';ctx.fillStyle='#c8e1bd';ctx.lineWidth=1.25;
          for(let ring=0;ring<3;ring++){
            const age=after-ring*0.11;if(age<0)continue;
            const radius=5+age*49;ctx.globalAlpha=(1-smooth(0.08,0.9,age))*0.52*visibility;
            ctx.beginPath();ctx.ellipse(p.landX,p.landY,radius,radius*0.61,0,0,TAU);ctx.stroke();
          }
          for(let i=0;i<7&&after<0.4;i++){
            const a=i*2.39996,reach=10+after*53;
            ctx.globalAlpha=(1-smooth(0.08,0.4,after))*0.75*visibility;
            ctx.beginPath();ctx.ellipse(p.landX+Math.cos(a)*reach,p.landY+Math.sin(a)*reach*0.58-Math.sin(after/0.4*Math.PI)*18,1.1,2.4,a,0,TAU);ctx.fill();
          }ctx.restore();
        }
      }
    }
}
 const C={cream:'#fffde9'};const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},ramp=(t,a,b)=>ease((t-a)/(b-a));
  const COURSE = [[0,454],[.5,476],[1.5,495],[2.1,484],[3,487],[3.5,497],[4,512],[4.5,533],[5,555],[5.5,563],[6,559],[7,521],[8,451],[9.5,347],[11.5,326],[13.5,463],[15.5,524],[17.5,481],[18.5,428],[19.5,438],[21.5,454],[24,487],[28.8,470]];

function course(t){
    if(t<=0)return COURSE[0][1];if(t>=28.8)return COURSE.at(-1)[1];
    const i=COURSE.findIndex(p=>p[0]>=t),[a,x]=COURSE[i-1],[b,y]=COURSE[i];
    const prev=COURSE[Math.max(0,i-2)],next=COURSE[Math.min(COURSE.length-1,i+1)];
    const u=(t-a)/(b-a),span=b-a;
    return (2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*(y-prev[1])/(b-prev[0])*span+(-2*u**3+3*u*u)*y+(u**3-u*u)*(next[1]-x)/(next[0]-a)*span;
  }
function waveform(ctx,x,y,age){
    const a=ramp(age,0,.1)*(1-ramp(age,.45,1.15));if(a<=0)return;
    ctx.save();ctx.translate(x,y);ctx.strokeStyle=C.cream;ctx.globalAlpha=.75*a;ctx.lineWidth=1.5;ctx.beginPath();
    for(let i=0;i<=40;i++){const px=i*1.6-32,py=Math.sin(i*.65-age*18)*Math.sin(i/40*Math.PI)*8*a;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();ctx.restore();
  }
 let journey;const J=()=>journey??=new DandelionJourney();
 F['dandelion-radial-release']=(root,K,def)=>svgFactory(root,def,(ctx,t,svg)=>{
  const j=J(),sourceTime=1.4+t,state={time:sourceTime,courseAt:course},event=j.openingEvent(sourceTime);
  ctx.fillStyle='#526957';ctx.fillRect(0,200,900,660);j.openingAir(ctx,state,event);
  for(const seed of j.openingSeeds){const p=j.openingPose(seed,sourceTime);j.floret(ctx,p.x,p.y,p.radius,p.angle,j.openingGrowth(seed,sourceTime));}
  svg.dataset.radius=String(event.radius);svg.dataset.sourceTime=String(sourceTime);
 },'0 200 900 660');
 // 独立插画放大几何时，冠毛仍保持细线；下方留出播放条区域。
 F['dandelion-subject-illustration']=(root,K,def)=>{
  const render=svgFactory(root,def,ctx=>{const j=J();ctx.translate(320,116);ctx.scale(1.25,1.25);j.floret(ctx,0,0,42,0,1,j.filamentState(4.5));},'0 0 640 360',.5);render(0);return ()=>{};
 };
 F['dandelion-seed-illustration']=(root,K,def)=>{
  const render=svgFactory(root,def,ctx=>{const j=J();ctx.translate(320,128);ctx.scale(6,6);j.floret(ctx,0,0,8,0,1);},'0 0 640 360',1/9);render(0);return ()=>{};
 };
 F['frog-impact-ripple']=(root,K,def)=>{
  const j=J(),event=j.frogEvents(course)[0],one=Object.create(j);one.frogEvents=()=>[event];
  return svgFactory(root,def,(ctx,t,svg)=>{
   const sourceTime=event.at-.4+t,p=j.frogPose(event,sourceTime),age=sourceTime-event.at-event.duration;
   ctx.fillStyle='#07796a';ctx.fillRect(0,0,640,360);ctx.translate(320,240);ctx.scale(1.8,1.8);ctx.translate(-p.landX,-p.landY);
   const leaf=j.leafPosition(event.leaf,sourceTime);j.lotus(ctx,leaf.x,leaf.y,event.leaf.r,0,event.leaf.phase);
   one.pondAnimals(ctx,{time:sourceTime,courseAt:course});waveform(ctx,p.landX,p.landY+38,age);
   svg.dataset.age=String(age);svg.dataset.sourceTime=String(sourceTime);svg.dataset.eventAt=String(event.at);svg.dataset.eventDuration=String(event.duration);
  });
 };
})();

/* 原 NASA 正面月貌与蝴蝶抵达月面的事件时钟 */
(()=>{
/* NASA/GSFC/Arizona State University：LunarNearside，北向上。
 * 从真实正面月貌提取的低分辨率明暗数据；来源与处理见 README。
 * 用于代码绘制月面，避免随机虚构月海。 */
const NightMoonMap={size:128,values:new Uint8Array([
0,2,3,3,1,1,6,10,10,17,14,12,8,12,16,13,11,8,14,16,20,25,24,26,27,20,32,31,31,35,32,33,26,28,31,39,36,38,32,38,40,50,39,41,39,53,49,55,44,50,51,43,54,41,33,40,39,35,40,31,34,22,52,44,45,45,35,19,31,55,41,50,33,31,39,38,50,46,73,41,28,18,32,54,42,32,31,45,57,47,46,71,62,44,38,41,35,36,31,17,18,25,18,7,9,16,24,37,55,39,30,23,29,34,33,24,25,33,36,29,29,38,45,29,43,47,32,28,
0,0,2,3,2,1,1,7,10,10,18,16,12,9,15,14,13,10,12,16,11,15,24,29,26,24,28,40,36,39,34,29,31,24,30,35,37,39,41,34,31,50,48,44,46,44,59,51,34,39,40,41,44,43,33,40,54,50,47,50,53,52,57,60,68,72,58,80,100,50,83,55,38,30,38,43,49,42,67,37,24,17,34,67,56,35,52,40,44,50,46,60,51,58,31,36,39,30,28,21,21,22,8,8,16,22,32,42,42,31,28,28,33,29,37,25,29,33,29,29,30,45,29,38,47,32,28,33,
0,0,0,2,3,3,4,1,7,9,12,18,12,8,8,15,14,10,8,14,11,13,21,27,29,22,22,34,31,33,40,32,33,26,28,31,38,35,40,34,31,41,59,42,53,43,51,61,59,32,66,58,64,70,80,91,89,82,84,89,89,90,93,81,108,88,85,96,85,84,89,81,78,92,85,79,72,71,62,39,22,40,35,51,52,39,49,47,54,46,52,61,44,38,41,35,36,28,22,18,27,16,9,12,17,28,32,41,30,28,32,33,28,18,23,29,33,34,30,30,45,45,37,47,32,28,33,29,
0,0,0,0,2,3,3,4,6,6,9,9,8,17,8,10,15,14,7,10,13,11,14,25,24,32,27,23,34,36,39,28,29,31,24,30,35,39,38,40,36,35,42,39,41,34,58,50,73,71,81,90,89,104,101,106,98,104,113,113,116,117,120,117,121,129,121,121,115,117,115,111,106,87,85,81,80,85,72,54,70,35,53,42,32,25,43,46,53,55,71,51,58,31,36,39,35,28,21,24,15,7,9,16,24,38,33,36,31,27,26,36,33,23,28,22,30,30,34,37,45,37,47,32,28,33,29,28,
0,0,0,0,0,2,3,3,0,6,6,9,12,13,10,8,12,15,13,11,10,9,16,23,24,29,26,26,32,35,33,40,24,39,26,29,33,38,39,37,32,34,48,63,69,65,80,97,96,107,128,129,117,123,132,125,139,169,150,158,150,146,133,139,146,135,128,131,124,121,113,113,105,111,112,109,106,110,103,92,105,90,86,92,52,48,61,40,50,55,61,69,45,41,51,33,28,22,17,22,10,8,13,22,30,55,44,29,23,29,25,33,26,28,29,37,30,34,37,31,37,47,32,28,33,29,36,30,
0,0,0,0,0,0,2,3,3,0,7,7,7,12,17,12,10,12,16,13,10,12,16,20,21,27,29,26,25,32,35,33,40,29,31,24,34,38,33,41,32,57,88,94,95,95,105,107,110,130,115,133,131,141,140,150,156,157,161,154,148,162,179,171,154,133,133,130,127,122,134,117,114,112,131,127,110,113,116,106,104,99,111,94,105,85,73,47,54,74,54,69,31,36,39,30,24,21,25,19,10,12,17,28,31,42,31,28,28,34,33,35,32,36,37,27,21,39,31,37,47,32,28,33,29,30,30,38,
0,0,0,0,0,0,0,2,3,3,0,5,8,7,17,14,12,8,15,14,10,8,14,16,16,25,24,23,24,28,28,34,39,36,23,26,29,33,40,68,90,88,95,114,113,112,117,120,121,131,148,162,157,157,162,166,168,171,176,178,178,178,166,150,151,159,154,143,147,143,134,133,127,133,139,122,127,122,129,132,121,122,118,113,116,96,112,98,76,62,66,45,41,43,39,24,20,18,22,8,7,16,24,27,64,30,28,32,33,29,24,25,33,36,27,34,44,31,37,47,32,28,33,29,30,46,38,36,
0,0,0,0,0,0,0,0,2,3,3,1,5,8,16,17,16,12,9,13,14,7,10,14,16,23,24,20,22,22,34,31,31,40,29,31,44,73,82,99,114,111,117,122,120,123,128,127,136,144,144,154,152,165,161,163,158,166,180,187,187,173,181,171,165,148,151,154,149,149,142,145,135,153,140,121,122,126,137,132,133,124,127,143,148,124,127,115,91,100,85,57,36,39,30,17,18,27,16,9,11,22,30,55,39,31,27,26,31,37,25,29,36,33,34,44,37,37,47,32,28,33,29,30,46,38,29,28,
0,0,0,0,0,0,0,0,0,0,3,0,1,6,7,10,18,12,8,10,15,13,11,10,16,11,21,19,26,27,23,34,36,32,35,84,90,81,105,120,107,105,121,130,128,127,131,143,146,149,137,147,155,152,152,153,158,165,161,188,189,177,168,155,159,150,143,156,153,153,147,149,149,147,135,138,130,131,136,137,137,132,135,156,145,137,113,126,101,92,86,74,61,45,28,21,24,15,7,9,16,28,42,42,29,23,37,36,33,23,29,33,29,21,31,37,38,47,31,28,33,29,30,33,44,29,28,20,
0,0,0,0,0,0,0,0,0,0,0,5,2,1,6,10,10,18,17,8,12,16,13,10,14,11,16,25,21,23,26,32,37,50,71,74,95,105,111,120,121,123,124,122,120,133,137,139,150,145,148,147,131,155,146,154,156,164,164,171,170,170,154,159,169,158,164,155,176,154,143,144,148,154,136,146,152,172,146,156,164,172,180,171,167,142,164,115,117,101,98,125,86,60,35,20,22,10,7,16,24,27,41,30,28,28,34,33,26,28,33,29,29,31,46,34,45,31,28,29,29,30,33,44,32,20,20,26,
0,0,0,0,0,0,0,0,0,0,0,0,5,2,1,6,10,12,13,10,8,12,14,10,8,13,16,20,24,20,22,40,62,76,104,107,107,111,124,113,112,131,105,119,131,128,136,138,156,130,151,126,126,129,163,137,154,159,163,177,161,163,169,169,172,163,159,161,175,162,159,145,145,147,159,157,174,157,158,160,167,166,173,175,182,160,153,154,153,117,104,79,96,89,62,21,18,9,11,22,37,55,36,28,32,33,33,26,28,29,34,29,38,46,34,45,37,28,29,29,30,33,33,32,20,24,26,19,
3,1,0,0,0,0,0,0,0,0,0,0,0,5,2,4,6,9,9,13,12,8,15,11,7,8,9,11,21,33,54,82,91,113,98,113,112,115,123,115,123,124,132,129,115,129,116,103,111,103,107,121,121,126,129,152,151,137,129,141,153,150,159,163,152,155,152,147,173,157,155,152,154,153,151,170,161,165,154,152,154,168,160,167,174,185,165,152,152,136,149,136,103,85,88,77,21,16,21,28,42,44,30,27,34,29,24,32,29,30,30,38,39,34,45,37,28,33,28,37,49,40,27,20,23,26,22,23,
5,3,3,0,0,0,0,0,0,0,0,0,0,0,5,2,4,7,9,12,14,12,9,13,13,11,12,15,37,64,79,102,87,108,108,105,124,121,138,134,112,120,124,124,116,107,111,105,108,124,113,132,120,113,121,129,109,99,115,125,139,148,171,169,157,150,146,149,147,163,148,152,166,151,153,142,148,149,149,149,141,135,155,175,170,181,176,165,146,144,137,123,135,102,82,91,95,62,40,33,54,31,23,37,31,37,25,33,37,30,30,39,34,45,37,28,33,28,29,49,40,30,22,24,20,20,23,26,
13,9,5,5,0,0,0,0,0,0,0,0,0,0,0,5,0,1,6,17,12,14,8,10,15,13,10,19,46,77,94,91,106,104,108,102,119,106,110,113,132,124,135,125,117,120,121,104,118,114,112,128,118,116,116,124,108,115,120,130,137,130,137,144,158,151,153,133,135,147,144,141,130,134,149,122,123,141,121,133,145,149,146,156,166,178,180,174,177,161,144,136,137,138,132,103,106,82,69,77,73,36,28,25,33,23,33,29,30,34,45,39,45,37,28,33,28,29,45,30,30,22,24,22,23,22,28,38,
3,17,5,5,3,0,0,0,0,0,0,0,0,0,0,0,5,1,1,6,7,17,12,8,12,3,15,50,80,90,88,89,99,96,105,85,80,89,89,86,110,129,140,132,128,137,108,118,116,120,112,124,116,138,148,140,124,123,119,141,143,136,139,154,143,155,166,151,140,136,139,134,121,152,129,122,119,116,111,104,115,116,153,134,160,164,154,167,176,167,193,116,98,135,154,131,111,113,86,75,75,64,52,33,23,29,36,27,34,45,29,45,37,28,33,28,29,45,30,34,31,26,25,21,22,29,36,40,
0,1,18,16,3,5,0,0,0,0,0,0,0,0,0,0,0,5,1,6,8,7,18,17,5,12,52,80,85,80,85,72,80,91,91,93,92,102,100,108,121,158,141,134,129,133,139,136,110,114,129,152,171,162,166,177,163,165,158,151,143,146,135,140,143,156,151,150,140,146,149,135,125,124,133,124,122,117,112,114,116,106,113,131,135,157,172,158,166,151,150,188,125,130,152,126,111,122,115,85,74,75,65,54,28,33,27,34,37,29,45,37,28,33,28,29,48,36,28,20,26,19,25,29,27,41,39,35,
0,0,1,11,13,5,3,1,0,0,0,0,0,0,0,0,0,0,5,1,7,8,10,19,20,43,52,70,68,67,87,72,87,135,122,116,116,118,144,149,155,156,144,136,156,160,133,170,163,154,175,171,154,164,162,158,171,171,174,187,160,146,140,150,152,153,140,144,141,138,132,138,138,136,137,132,127,123,117,128,120,124,123,142,156,169,174,175,164,159,168,126,165,149,154,154,111,116,134,112,98,69,67,58,52,29,34,39,29,45,37,28,33,28,37,48,36,28,20,26,22,23,19,38,38,39,43,32,
0,0,0,0,6,13,5,3,3,0,0,0,0,0,0,0,0,0,0,3,1,5,16,23,42,43,54,44,34,52,62,80,101,131,124,123,145,168,151,154,152,151,144,153,140,127,148,161,191,212,188,162,167,147,167,152,159,170,197,205,151,124,144,171,148,150,159,159,147,145,130,148,145,138,143,154,140,129,129,127,129,121,124,164,152,169,173,172,164,166,157,155,146,146,132,140,137,113,134,124,95,109,90,88,66,61,44,29,43,37,28,33,28,30,38,29,20,24,26,20,23,26,38,45,40,38,38,36,
0,0,0,0,0,3,17,9,5,5,0,0,0,0,0,0,0,0,0,0,2,10,26,33,45,56,63,40,39,52,70,94,111,151,150,148,164,157,153,149,156,149,152,142,150,157,144,127,139,175,172,169,93,77,134,158,178,179,207,206,186,184,179,170,146,169,198,158,152,158,179,191,201,160,167,140,150,130,139,146,160,150,130,147,173,173,172,178,167,158,162,161,169,147,141,116,116,133,119,124,132,131,106,102,95,60,67,37,37,28,33,28,30,38,32,20,23,22,23,22,28,36,40,35,39,40,33,33,
0,0,0,0,0,0,1,9,16,3,3,0,0,0,0,0,0,0,0,0,2,18,31,43,52,63,55,43,54,71,83,102,137,154,147,141,162,149,143,135,148,153,156,153,140,124,83,86,107,137,153,164,123,139,172,148,179,176,196,199,228,192,191,185,173,158,170,167,167,163,184,199,187,171,165,152,150,163,142,166,158,135,130,160,181,161,173,172,168,179,183,166,171,163,149,124,112,120,125,130,137,110,112,113,104,91,76,61,39,33,28,30,44,32,31,24,22,21,29,27,43,39,43,32,32,31,37,34,
0,0,0,0,0,0,0,0,11,13,3,5,0,0,0,0,0,0,0,0,16,25,41,48,52,66,56,77,82,96,113,140,150,151,146,177,174,154,148,136,142,166,147,112,108,113,105,92,147,123,124,137,139,156,175,182,180,190,183,207,205,194,200,187,173,161,149,153,168,164,178,174,167,171,165,160,170,169,174,175,150,140,143,167,191,175,181,169,194,165,180,182,154,194,171,142,133,132,101,101,130,145,108,107,123,112,95,74,59,35,30,33,30,22,24,19,25,29,38,38,40,38,38,32,30,34,35,35,
0,0,0,0,0,0,0,0,0,3,13,5,3,0,0,0,0,0,0,7,20,33,44,52,63,93,79,122,127,128,149,139,157,162,175,138,112,108,103,157,158,131,105,99,107,120,105,100,114,160,129,144,123,110,112,127,152,207,211,205,204,188,211,200,185,162,166,174,179,165,172,163,172,175,177,176,174,179,158,159,147,142,151,181,174,156,180,178,189,174,165,159,166,172,197,150,139,124,125,115,115,125,107,74,114,106,93,118,73,69,40,30,22,26,19,23,26,38,40,45,39,40,33,30,26,35,31,31,
0,0,0,0,0,0,0,0,0,0,1,17,9,5,3,0,0,12,1,17,29,34,55,59,67,56,82,116,129,147,138,139,167,157,92,87,100,102,90,106,126,88,88,96,98,104,99,108,109,135,137,118,129,118,122,131,150,139,161,186,186,191,195,205,182,185,169,173,198,171,166,171,176,188,213,189,172,156,154,155,182,178,161,177,167,154,158,177,160,164,158,160,166,171,179,155,144,155,143,144,116,115,137,93,101,116,122,116,98,75,58,20,26,20,22,28,36,39,43,32,32,31,37,34,33,37,34,34,
0,0,0,0,0,0,0,0,0,0,0,0,9,16,5,5,0,0,12,28,31,52,54,33,40,49,101,126,128,146,129,138,186,100,79,85,101,97,86,88,75,65,66,81,95,103,100,115,119,123,118,126,168,128,121,131,134,125,170,192,174,182,233,214,196,203,189,187,202,199,200,247,227,188,197,203,190,173,161,158,169,173,155,195,160,165,149,151,163,158,152,155,161,164,169,169,154,151,157,145,145,122,123,125,109,118,112,123,124,90,70,55,23,22,27,43,46,38,38,32,33,38,38,37,31,32,28,43,
0,0,0,0,0,0,0,0,0,0,0,0,0,6,13,0,0,7,19,31,36,41,37,38,42,47,96,108,124,132,132,157,149,94,75,85,108,107,98,78,69,63,61,85,97,108,118,105,106,110,111,119,112,119,114,130,139,131,169,217,171,190,211,197,198,200,190,181,182,195,200,215,215,202,182,188,174,165,152,150,152,151,179,187,176,199,174,161,171,165,160,153,158,166,170,182,171,147,142,171,182,142,116,137,131,119,116,102,134,111,98,82,62,38,45,45,39,40,31,37,34,36,37,34,34,42,44,41,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,15,22,30,47,37,45,46,48,99,102,124,119,123,135,166,99,84,78,82,89,97,85,55,61,65,68,71,92,105,109,104,103,124,129,117,146,119,126,124,137,133,137,169,191,198,184,213,211,200,203,193,225,217,207,211,212,188,204,184,183,176,173,155,169,158,201,192,173,165,175,166,167,166,164,172,173,162,184,201,175,154,132,138,164,163,139,128,152,140,125,103,108,107,95,70,76,66,43,32,36,30,34,35,37,31,32,41,43,49,46,31,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,12,19,22,39,35,47,55,45,59,126,124,117,127,120,143,144,99,87,69,62,69,71,67,74,72,64,66,85,82,107,106,115,114,121,119,115,106,117,123,135,145,142,155,157,217,194,178,200,213,233,209,174,213,191,197,194,198,191,185,189,144,155,146,139,145,173,168,166,165,167,171,153,170,150,178,196,180,179,178,178,188,172,145,159,149,160,155,149,158,148,125,116,106,98,86,81,76,84,34,33,30,34,36,37,34,34,42,44,41,46,34,46,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,15,26,46,38,33,42,43,41,83,120,121,122,114,135,123,110,121,77,63,52,56,57,67,78,83,67,82,92,81,97,103,111,122,113,104,121,113,120,122,143,147,152,170,156,169,174,204,214,190,211,203,226,211,227,186,201,210,204,182,194,165,158,151,145,139,153,155,150,156,163,153,143,133,161,139,184,171,164,177,173,165,149,154,159,161,169,159,165,177,139,123,128,105,84,101,89,76,82,74,35,35,35,31,32,29,43,47,49,41,39,42,40,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,18,28,36,49,32,39,61,63,63,108,111,108,126,133,109,86,66,73,73,58,61,55,63,60,71,77,91,92,86,78,101,104,108,133,116,113,113,110,126,136,135,153,160,169,169,171,170,186,210,184,184,199,212,225,214,169,169,215,209,197,190,181,165,147,137,146,142,153,145,167,184,164,154,117,118,139,181,185,195,188,160,170,173,180,164,172,167,173,154,169,164,145,146,121,113,107,91,90,71,89,43,37,34,29,43,49,46,46,42,41,40,38,35,
0,0,0,0,0,0,0,0,0,0,0,0,0,2,15,28,36,41,34,32,51,67,62,89,103,89,93,107,149,91,68,78,87,87,87,81,64,59,58,63,66,73,70,77,83,90,109,108,129,118,106,110,121,139,143,152,159,179,195,181,172,167,167,182,184,185,241,214,219,218,219,205,210,207,192,196,195,188,139,130,132,148,151,147,143,141,161,143,121,120,132,175,210,194,173,159,184,177,174,181,161,166,171,162,201,176,140,134,123,115,109,106,95,91,82,66,44,29,43,41,46,34,46,45,38,47,37,53,
0,0,0,0,0,0,0,0,0,0,0,0,0,6,27,42,33,29,41,43,60,61,59,91,91,103,122,96,103,76,73,83,83,90,80,66,66,61,63,65,91,73,72,93,84,85,119,111,120,117,110,119,119,144,139,159,168,190,180,168,181,152,162,189,183,200,234,204,221,195,170,137,142,166,192,187,189,182,158,140,126,170,166,135,141,152,136,128,128,123,135,145,179,187,203,184,227,188,194,179,145,166,164,160,187,219,181,157,130,123,128,105,123,108,87,83,59,49,49,41,39,44,44,47,37,45,44,48,
0,0,0,0,0,0,0,0,0,0,0,7,10,17,33,28,29,34,38,52,61,62,65,83,98,94,123,112,84,70,71,79,77,78,69,64,70,75,66,64,74,74,96,92,82,87,112,120,125,128,113,120,123,138,138,150,167,162,157,154,159,129,171,184,203,204,208,213,208,172,138,101,107,101,122,146,165,155,170,180,184,140,109,117,138,152,176,143,139,118,134,139,157,148,196,203,200,201,181,198,173,162,169,165,160,190,172,150,131,118,112,130,126,112,107,86,75,64,42,41,40,38,40,45,54,48,44,36,
9,0,0,0,0,0,0,0,0,0,0,32,22,26,20,29,28,29,38,59,67,64,74,70,75,78,101,76,67,69,72,95,100,100,87,87,82,82,67,65,69,82,89,92,100,103,112,111,116,115,112,104,113,137,144,139,153,162,153,165,152,145,160,159,184,198,241,214,143,112,116,108,115,105,114,126,136,159,169,154,153,115,107,125,123,184,161,136,139,136,145,154,160,143,167,202,218,187,194,184,182,185,162,175,188,173,173,143,140,125,110,109,126,125,100,95,85,62,46,38,35,41,45,48,44,36,33,41,
0,5,9,0,0,0,0,0,0,0,12,15,0,15,22,33,31,32,44,69,63,64,68,68,72,90,86,64,60,76,90,103,98,83,79,80,79,77,78,70,76,75,88,90,105,106,107,118,122,114,97,84,103,143,134,131,153,167,153,199,176,153,150,163,159,201,224,229,153,115,125,127,122,114,119,127,134,133,124,110,135,126,107,125,122,168,201,173,159,146,159,166,188,201,196,195,213,186,198,213,183,186,184,180,178,166,186,152,147,122,142,111,124,141,119,108,96,76,57,44,45,54,44,44,33,41,36,42,
0,0,0,5,9,0,0,0,0,0,0,0,5,10,37,38,32,51,61,71,63,71,65,72,77,84,90,63,78,93,98,97,99,82,74,79,76,89,69,81,78,74,87,104,101,99,88,89,104,114,112,87,90,138,132,128,160,168,172,184,189,160,144,145,149,178,201,206,119,107,116,124,124,128,114,114,120,122,109,117,132,128,111,114,134,166,197,217,165,148,174,200,202,208,198,204,209,194,199,210,213,188,177,179,179,179,165,147,154,146,119,141,130,127,121,112,104,88,78,65,44,45,33,41,36,42,34,29,
0,0,0,0,0,5,9,0,8,7,8,2,10,14,41,49,46,65,56,69,76,77,75,80,87,93,79,71,90,93,119,96,81,71,72,74,95,72,74,91,77,70,81,112,101,77,85,91,109,105,113,99,96,99,113,136,157,155,167,178,177,152,148,162,174,186,186,180,114,99,95,113,107,116,118,113,109,102,101,124,137,110,102,98,129,194,209,207,181,178,178,189,218,204,205,218,211,205,210,203,229,189,200,186,179,186,194,185,143,153,158,142,135,116,126,111,116,98,89,69,33,41,36,39,34,29,35,32,
0,0,0,0,0,0,0,14,31,13,16,9,9,17,26,52,64,65,70,86,82,77,75,91,97,101,84,78,91,92,100,99,78,72,70,58,67,73,76,83,84,81,85,95,104,107,108,115,116,108,105,105,105,102,120,145,141,161,180,181,180,181,165,160,155,208,144,146,115,105,88,82,111,112,110,100,100,107,107,129,135,111,105,89,99,159,193,216,183,184,194,212,201,220,219,208,209,222,235,198,209,203,220,203,169,190,196,147,184,152,169,142,165,144,123,107,119,113,93,79,66,39,35,34,35,32,27,31,
0,0,0,0,0,0,0,7,18,13,8,9,12,18,50,70,38,68,95,82,83,74,91,89,82,97,81,107,95,88,88,83,89,87,87,74,75,81,88,94,88,91,99,89,101,105,108,116,120,101,108,114,111,148,165,167,161,176,184,204,192,189,179,156,148,175,153,128,132,106,95,108,128,115,111,108,100,104,112,131,130,116,125,87,90,93,127,157,178,184,198,212,221,218,213,215,208,215,209,219,218,229,221,195,189,182,152,164,154,163,181,152,129,140,139,100,138,95,93,106,62,37,35,32,29,22,29,28,
0,0,0,0,0,0,0,14,22,5,17,10,21,33,58,54,57,62,99,110,100,90,80,73,74,76,93,100,99,109,92,86,93,89,90,89,88,91,113,82,80,83,124,94,96,104,114,113,107,106,106,121,128,168,147,152,182,189,190,184,184,187,163,147,152,134,130,118,133,112,111,120,107,103,103,109,114,98,115,132,125,113,112,90,85,88,98,133,160,189,197,214,229,195,219,216,205,216,208,201,201,241,228,175,195,192,155,123,145,145,145,128,120,140,132,129,140,119,100,102,86,38,27,26,35,33,46,48,
7,0,0,0,0,0,14,7,0,3,18,19,21,46,41,53,87,101,91,90,85,82,108,80,74,86,103,130,102,109,82,75,93,97,84,106,105,87,104,97,96,97,136,105,99,112,111,113,111,104,110,129,140,167,152,156,155,173,193,199,193,196,164,162,159,146,117,117,136,124,121,111,105,102,112,116,111,100,117,113,131,112,101,89,74,74,79,111,146,188,203,235,228,233,231,217,205,206,203,193,195,203,194,179,188,185,178,163,153,141,147,153,134,117,156,139,102,113,97,103,109,60,31,38,49,49,51,49,
15,1,7,4,0,0,28,0,0,3,20,12,26,40,48,68,99,130,110,86,93,108,100,85,85,103,112,136,110,93,80,70,95,96,137,101,107,91,107,86,79,89,123,103,107,112,130,131,123,104,143,169,190,158,162,173,151,159,165,180,204,199,171,213,165,165,122,112,128,133,145,112,100,103,112,135,113,112,130,110,138,110,99,96,94,70,71,86,93,182,206,226,242,255,252,212,214,235,198,184,207,192,168,175,176,175,146,177,165,135,134,119,93,123,159,98,115,111,108,92,98,69,48,45,46,51,35,35,
5,11,5,10,6,24,30,11,1,12,12,16,34,43,58,74,109,146,109,95,111,111,90,81,91,93,98,92,87,90,86,73,82,108,98,92,109,105,94,88,81,87,114,98,108,179,169,150,120,161,148,166,173,183,170,172,153,150,154,134,148,176,197,223,183,155,138,96,108,117,110,107,105,100,117,118,106,117,117,112,117,102,98,105,106,79,79,98,122,161,197,221,228,242,254,228,214,207,216,205,173,157,185,161,154,161,148,190,177,149,118,81,94,95,136,93,90,105,119,100,87,75,52,51,36,29,27,27,
0,12,10,3,4,12,14,8,17,16,20,19,37,52,75,100,112,93,115,95,111,116,93,76,85,81,76,69,67,90,85,72,80,99,116,91,86,92,106,92,84,106,120,103,111,162,164,153,123,141,176,179,177,183,195,181,180,168,155,121,108,125,167,183,156,147,123,102,96,108,107,111,103,105,115,116,111,118,132,122,116,99,107,114,107,102,79,101,135,173,173,230,206,242,222,219,227,200,200,205,169,155,181,171,156,186,151,158,178,100,99,80,75,68,101,88,71,80,104,115,92,88,58,25,24,31,26,16,
0,0,2,0,10,0,4,24,21,15,22,30,37,46,83,108,218,130,111,109,109,111,90,71,92,67,80,74,74,86,91,76,79,98,92,94,111,104,113,90,75,111,118,101,114,114,120,131,108,121,165,187,179,181,197,202,182,159,139,145,141,165,190,182,187,198,112,89,96,92,80,101,103,103,113,113,106,135,120,120,118,93,93,108,111,102,64,85,139,157,167,191,208,202,202,195,223,203,209,193,138,175,185,171,180,181,148,159,107,103,85,99,86,72,65,63,92,120,86,115,95,86,61,30,16,11,13,13,
0,0,0,0,0,2,41,29,4,12,11,31,42,62,106,145,152,110,110,86,95,92,72,66,70,71,71,86,80,80,129,88,73,85,100,103,115,117,122,101,90,122,111,102,105,107,117,122,123,107,146,162,174,191,184,178,176,186,177,141,185,223,215,229,163,152,87,100,90,92,79,82,103,111,105,107,116,146,118,108,106,93,95,99,110,105,73,82,106,155,189,174,195,201,178,159,175,209,218,187,170,189,173,203,157,167,174,109,104,104,100,99,84,76,51,52,40,72,91,103,116,73,71,6,13,20,18,16,
0,0,0,0,0,0,38,7,4,2,14,22,44,74,93,86,91,97,113,96,73,78,67,61,65,80,81,91,79,108,170,105,81,88,119,123,107,100,101,126,105,118,109,99,111,122,124,129,110,96,99,125,175,197,187,190,191,205,183,243,220,194,205,213,171,143,79,92,91,87,84,89,104,112,97,99,133,152,116,109,90,90,90,98,110,108,80,76,163,155,186,188,201,182,171,129,145,196,251,193,189,205,191,196,189,194,180,93,103,101,98,80,78,63,50,45,35,57,123,105,124,67,80,10,22,11,12,8,
0,0,0,0,0,0,15,5,8,10,27,33,40,54,71,79,84,84,96,98,79,91,86,80,88,85,96,98,114,117,149,120,96,95,125,124,112,119,97,143,118,135,116,113,116,123,119,117,97,95,105,123,104,123,130,173,196,210,213,248,248,210,191,203,164,134,101,71,76,91,79,100,102,106,97,103,151,137,123,111,98,92,99,106,108,101,94,95,42,139,157,180,179,183,175,136,148,185,227,218,193,196,205,192,195,188,172,114,113,92,84,75,69,60,55,42,39,35,78,109,119,81,71,43,4,5,0,0,
2,0,0,0,0,15,5,0,1,11,19,37,41,50,65,73,78,76,91,103,90,65,87,112,73,119,98,117,116,142,136,129,140,120,106,97,99,142,109,139,108,124,128,103,120,119,137,125,109,116,116,105,109,111,118,169,191,193,234,240,248,209,186,169,141,131,109,79,63,86,100,107,111,107,103,112,147,125,120,102,108,102,96,101,104,92,77,73,102,144,196,182,180,146,157,151,148,183,186,182,227,218,217,207,214,219,199,152,108,94,89,85,68,65,51,35,48,36,48,118,133,75,69,52,0,0,0,0,
0,0,0,23,0,21,0,0,3,12,18,33,42,53,63,68,74,76,80,100,109,82,78,86,91,89,94,104,140,137,141,119,114,113,127,108,105,182,105,124,112,113,131,116,129,129,136,119,127,127,118,105,104,112,127,172,218,215,231,219,229,187,191,170,154,141,130,158,66,79,121,90,92,95,102,111,132,123,121,107,105,107,97,123,107,82,69,79,124,152,165,180,170,136,132,140,127,124,127,124,185,230,235,248,231,233,203,149,100,93,93,79,68,66,52,39,38,56,42,100,130,93,42,46,0,0,0,0,
1,0,0,9,5,0,0,1,0,16,41,31,40,38,51,60,57,65,69,106,105,92,93,79,71,81,85,93,118,113,131,118,120,124,141,123,114,103,117,116,126,129,125,126,119,137,118,123,142,146,95,111,124,124,152,219,200,205,205,196,208,195,156,188,159,102,91,114,105,103,129,83,82,84,100,113,118,118,122,107,100,98,100,95,81,66,70,70,115,111,160,168,163,132,114,139,107,88,107,143,175,184,219,248,252,249,248,190,142,102,85,76,63,62,47,39,44,54,55,93,137,127,63,56,15,0,0,0,
4,3,5,0,1,3,12,0,7,17,30,27,42,37,48,51,61,60,73,101,111,80,90,99,85,69,86,120,121,91,116,109,158,137,134,127,128,121,140,126,138,148,144,122,140,128,127,154,160,116,112,123,113,179,188,180,185,199,208,184,155,180,169,111,119,116,155,141,128,148,123,158,124,99,95,110,109,122,107,107,102,89,77,56,70,100,91,81,69,80,113,127,151,127,128,114,98,72,112,176,176,181,182,196,241,255,231,179,153,94,75,64,73,64,57,52,44,107,117,99,119,110,97,41,37,0,0,0,
0,0,7,0,3,19,19,11,8,8,20,35,42,45,61,65,61,61,111,101,123,118,110,67,76,114,88,110,140,140,123,130,158,167,152,137,118,117,142,123,132,153,131,162,146,143,137,159,143,120,125,208,182,205,191,203,213,185,201,199,145,159,189,156,174,150,127,83,126,117,142,148,130,139,95,123,92,92,106,111,76,78,53,54,64,85,87,90,64,61,94,109,139,131,116,105,95,78,86,144,178,178,183,180,197,231,225,167,143,96,82,72,75,66,63,46,40,76,137,102,116,108,95,92,48,24,11,14,
5,2,29,7,5,14,18,12,12,9,14,33,30,45,58,56,56,74,97,105,126,138,109,79,61,75,105,110,130,137,145,163,169,163,167,140,124,129,164,136,146,175,163,163,144,141,152,156,149,148,161,198,206,187,180,197,231,187,159,173,156,139,162,148,137,148,129,114,104,137,116,101,151,133,218,254,187,136,139,135,150,99,80,119,73,67,87,71,73,53,60,84,91,124,101,85,83,87,77,99,157,176,188,177,187,228,221,229,155,113,87,72,84,66,60,50,52,83,143,151,78,108,83,87,64,23,28,16,
28,25,20,5,10,20,19,6,8,12,12,29,23,43,54,53,61,70,82,101,112,144,122,84,86,102,101,139,176,208,189,185,175,175,198,171,162,174,167,162,173,189,170,165,195,165,153,183,186,181,168,164,179,213,169,184,192,180,133,126,129,112,119,110,109,124,140,156,179,174,172,152,117,105,176,233,215,196,149,154,154,75,89,148,93,58,54,64,76,69,76,63,71,76,100,71,89,60,46,95,162,173,182,177,171,198,236,239,194,135,122,79,75,66,60,66,51,120,141,118,121,109,108,92,68,45,12,15,
29,29,15,27,9,11,19,9,10,15,17,24,21,50,62,64,60,57,87,111,109,147,114,85,71,139,151,112,143,194,170,179,159,165,206,191,178,177,186,174,172,174,186,184,202,167,180,137,131,130,124,119,171,177,189,168,189,153,116,112,122,121,120,113,112,103,142,218,255,214,143,76,97,110,143,147,177,172,159,109,104,54,55,67,57,55,52,67,71,76,62,79,59,47,58,63,89,67,50,47,150,176,173,170,171,192,216,196,222,168,131,99,72,65,65,63,88,130,129,125,136,78,108,90,63,44,16,15,
36,33,37,27,8,18,21,12,14,10,30,39,34,40,68,72,56,81,88,114,120,110,123,93,80,116,108,115,145,169,184,169,162,178,185,212,199,199,209,198,188,179,167,192,190,157,196,146,136,134,129,123,149,140,138,131,154,135,132,112,132,130,124,110,117,113,113,150,219,201,173,99,133,159,168,145,174,142,154,92,51,51,41,53,60,61,59,58,74,93,85,105,52,46,46,45,50,58,51,37,58,68,71,154,169,168,171,209,199,190,166,145,95,68,106,98,139,103,137,133,85,90,96,88,71,60,14,15,
48,44,36,42,8,15,19,16,10,27,30,41,35,38,60,65,63,90,96,115,109,120,138,126,105,95,101,141,190,174,192,196,187,176,175,209,231,204,210,205,189,190,191,197,181,169,180,160,161,146,135,130,124,93,99,107,124,159,125,127,130,121,114,105,98,92,110,115,145,147,161,134,146,167,177,200,186,100,90,76,51,52,48,64,54,58,65,74,66,88,83,66,63,52,48,46,44,48,43,41,60,65,48,69,94,150,171,197,204,198,183,184,158,123,137,150,149,127,125,111,79,110,76,103,76,65,26,20,
52,52,61,32,5,18,19,19,27,12,25,27,35,44,40,47,54,84,88,119,143,129,146,131,101,88,101,121,165,179,203,228,209,192,184,180,216,214,219,207,194,185,187,173,195,184,176,158,158,153,126,118,125,92,52,63,95,132,107,117,106,103,102,105,90,73,88,111,147,127,108,120,138,149,202,216,112,92,87,58,54,68,73,53,43,63,87,114,80,108,60,44,52,54,49,53,44,52,57,55,90,59,107,115,154,127,185,205,202,185,183,184,160,138,153,152,143,89,118,146,43,79,77,90,96,84,36,24,
46,52,69,45,16,22,16,28,25,29,30,23,40,43,43,39,56,88,90,110,156,144,146,139,104,77,90,102,162,197,188,216,202,193,192,200,232,255,226,194,185,189,191,177,190,177,166,147,145,143,140,124,118,84,49,75,132,135,134,125,110,91,87,103,70,73,52,99,134,102,114,161,157,170,193,209,183,93,66,55,72,58,60,49,41,57,92,116,101,68,54,53,69,62,47,67,55,55,54,105,65,75,149,142,146,139,137,166,200,182,185,176,167,156,150,148,129,119,85,94,52,83,52,93,95,105,30,11,
55,67,58,38,8,21,29,42,34,38,28,40,41,37,37,44,75,85,117,141,174,170,149,144,108,95,115,167,152,184,192,188,192,194,206,249,255,255,255,197,189,190,185,180,183,189,178,167,159,138,124,123,108,68,94,92,111,150,167,164,155,121,88,112,86,53,58,73,114,128,115,192,186,197,195,155,182,139,91,63,43,53,48,43,47,54,56,74,65,63,60,57,79,61,55,61,44,47,62,77,74,106,156,158,129,111,101,123,137,179,175,186,174,150,158,164,146,168,126,86,74,79,86,111,100,86,24,0,
48,60,69,48,29,20,69,51,35,42,41,34,41,27,32,37,77,89,135,156,172,177,173,168,109,133,104,124,131,134,159,193,194,205,234,255,255,255,251,220,191,188,173,193,187,182,168,167,143,125,105,114,112,108,143,159,161,183,182,201,178,172,132,100,118,97,93,103,131,146,168,220,220,216,187,167,169,137,90,45,45,45,46,58,83,84,48,52,62,62,65,63,62,65,65,52,57,72,55,63,70,128,107,135,128,125,117,121,116,139,170,171,177,173,142,150,179,145,135,105,96,76,132,109,116,76,48,4,
50,74,76,80,24,21,29,33,48,32,50,46,59,39,55,61,90,97,138,162,206,179,170,163,118,113,115,136,143,147,153,183,193,202,198,224,248,242,208,187,192,186,185,176,181,184,159,151,139,115,106,146,144,142,172,200,182,207,189,205,187,172,161,143,171,148,136,135,140,153,158,234,216,209,214,194,171,133,82,55,56,59,55,67,92,110,82,67,62,58,75,76,57,67,73,57,63,64,58,63,89,111,92,107,121,152,157,130,119,111,115,165,173,164,175,154,144,154,145,104,78,91,110,89,92,71,38,0,
52,66,93,79,42,30,14,26,31,39,43,49,42,45,55,65,97,97,138,165,176,193,191,158,146,106,106,109,100,124,129,154,175,180,177,171,188,191,178,170,180,161,146,122,155,170,165,158,101,94,92,107,133,137,175,199,186,181,200,220,214,205,176,179,195,156,173,179,177,167,170,207,211,217,249,209,177,156,86,68,63,65,75,78,83,102,70,60,51,65,78,93,75,70,68,54,90,88,92,83,89,82,96,128,143,158,150,148,98,92,66,103,160,151,157,158,160,141,145,110,112,108,84,71,71,71,37,0,
47,58,86,86,47,21,7,20,30,39,50,42,38,51,52,51,67,92,116,146,164,179,171,137,138,135,136,143,141,177,150,175,197,202,177,179,168,168,158,171,172,154,143,137,159,160,160,124,106,80,78,90,99,158,186,231,233,203,206,228,205,211,216,212,173,173,171,160,201,207,196,218,245,235,235,202,176,152,119,75,73,98,118,83,93,83,70,85,60,56,71,88,71,74,88,70,88,105,105,93,92,85,96,122,139,141,156,115,89,79,61,63,105,139,148,138,137,103,148,73,114,121,110,58,73,77,18,0,
53,68,95,91,44,28,9,16,30,29,42,44,48,57,46,55,56,97,113,131,133,175,155,115,108,126,125,148,169,157,155,165,182,160,161,174,181,165,152,163,134,98,85,131,141,134,143,93,58,42,63,95,123,147,208,218,223,195,204,215,193,206,220,250,223,199,174,220,224,225,238,238,246,221,225,208,186,164,116,85,90,91,90,92,77,62,57,90,71,66,80,78,69,103,90,95,116,87,97,78,104,125,115,134,133,100,123,88,80,68,52,51,52,48,97,62,86,102,137,54,87,96,102,83,73,78,3,0,
60,62,91,84,34,31,9,15,24,24,48,44,66,56,40,48,46,83,118,100,105,194,150,101,106,114,146,132,154,161,169,173,207,176,188,157,164,146,160,155,162,90,78,114,103,129,156,100,46,38,67,113,123,146,176,194,205,203,180,222,172,198,245,255,255,231,233,239,255,243,255,247,227,234,210,207,194,183,133,104,99,72,87,84,72,74,62,90,87,64,78,76,99,86,83,98,109,102,96,65,83,102,120,146,150,100,124,80,74,77,52,52,37,45,53,67,84,84,95,60,96,106,95,95,97,72,12,0,
67,66,91,73,26,31,7,16,20,20,46,44,44,41,37,46,45,63,122,88,99,140,111,91,106,124,141,111,124,131,142,160,190,165,203,174,163,143,154,147,127,110,91,116,113,124,138,103,65,60,89,119,141,141,159,188,195,217,202,239,213,209,255,255,233,216,223,255,255,255,255,240,255,228,214,216,172,165,126,123,92,69,79,67,63,84,82,74,86,76,78,103,118,111,124,97,89,76,82,79,88,93,124,155,133,78,108,90,75,72,74,59,48,46,39,65,88,91,111,93,85,102,93,100,90,77,18,0,
57,71,83,77,32,27,16,18,25,24,42,48,44,40,41,42,41,58,107,103,99,181,95,84,112,136,128,125,102,120,129,157,168,158,169,194,195,159,158,170,117,103,130,145,147,161,137,132,113,94,87,111,111,105,131,167,150,178,194,215,215,226,227,243,229,240,232,253,255,255,255,255,255,235,219,205,176,238,179,152,107,69,68,72,77,99,109,82,68,83,92,145,97,105,192,130,150,96,75,88,87,118,155,133,95,65,95,92,70,90,91,55,40,50,49,75,93,90,103,97,120,111,96,94,94,72,16,2,
46,64,97,69,45,22,23,22,32,29,40,44,40,37,51,56,42,52,111,101,118,98,103,100,109,109,124,121,112,132,139,158,176,154,156,214,199,166,152,167,140,116,98,132,123,145,104,124,127,94,142,137,114,109,116,175,144,163,163,165,193,221,235,240,240,243,253,245,255,255,255,255,255,255,241,218,213,196,188,154,138,136,77,73,82,104,104,90,79,86,93,88,99,114,221,213,181,125,149,134,106,118,154,82,86,93,82,93,67,67,76,43,46,60,58,73,75,92,110,95,129,112,110,94,75,75,12,10,
13,39,89,63,56,26,27,31,21,23,35,48,40,44,49,46,48,41,99,70,87,112,101,94,103,100,116,150,142,146,125,129,158,157,173,201,175,196,213,173,156,123,110,105,114,155,125,113,125,123,143,148,150,109,155,154,135,146,163,175,178,210,244,254,248,252,255,255,255,255,255,255,255,253,246,227,214,200,202,185,139,142,90,91,85,84,105,87,88,87,101,90,104,194,248,214,205,194,189,198,164,175,168,93,96,94,74,96,70,62,66,52,62,69,80,83,92,99,116,142,116,123,94,102,81,85,8,6,
32,58,86,83,58,27,25,25,13,26,30,43,42,39,42,34,46,35,69,54,74,81,89,97,100,96,138,109,126,141,150,122,145,151,172,183,153,188,227,173,170,121,129,120,117,129,129,122,129,123,150,167,185,158,189,141,133,137,156,179,194,208,212,255,255,255,255,255,255,255,255,255,254,244,255,252,245,220,226,145,154,146,117,113,100,100,94,90,72,93,105,94,151,223,255,217,226,217,198,172,182,200,131,88,95,97,96,125,68,62,66,71,67,68,87,96,96,78,116,120,122,103,89,92,79,50,3,0,
45,61,60,81,75,68,20,19,19,29,31,50,42,34,45,36,38,27,76,64,70,68,79,94,96,82,87,100,97,134,154,146,113,143,158,178,145,146,184,182,173,160,140,124,138,127,138,141,129,162,196,214,199,194,190,154,141,139,137,179,219,235,252,254,244,253,255,255,255,255,255,255,247,244,246,255,255,230,224,224,229,222,206,153,193,130,142,138,88,109,97,118,198,209,215,192,203,197,218,196,169,167,126,95,106,89,89,90,71,73,77,68,63,81,91,94,97,89,108,118,99,100,81,94,67,53,15,28,
48,51,31,52,86,71,2,15,18,25,56,65,45,34,58,34,29,40,98,67,63,63,76,84,106,96,93,109,112,102,129,141,134,131,126,137,141,121,161,179,177,168,147,145,147,143,134,145,150,177,200,221,214,202,209,187,158,149,171,205,210,221,240,255,248,248,255,255,255,246,255,252,255,255,255,252,244,237,254,246,236,238,232,217,227,217,154,128,101,116,101,119,223,230,190,198,186,190,203,186,185,166,168,88,95,90,102,90,74,83,76,65,86,88,108,92,78,90,112,107,109,94,84,95,71,87,43,42,
59,58,22,19,79,83,29,20,21,22,61,68,47,38,35,39,22,59,82,71,53,59,62,83,103,104,135,109,107,160,118,145,124,121,110,122,125,124,146,169,182,175,146,168,155,163,143,148,183,191,176,182,214,206,210,239,217,194,194,203,205,229,233,245,252,254,255,255,243,247,252,251,251,255,245,250,255,247,254,240,255,255,253,247,243,243,180,157,126,115,114,128,197,197,208,212,193,203,188,185,189,175,197,137,103,96,86,88,81,82,64,86,75,85,112,98,84,117,109,103,129,113,126,84,74,71,46,44,
62,61,29,9,103,77,56,27,21,29,37,59,62,39,44,56,33,50,65,65,53,55,61,77,91,94,141,99,105,150,143,114,133,99,104,108,119,129,148,167,172,179,153,168,161,187,158,176,201,211,209,206,244,251,228,209,214,216,222,209,216,231,231,245,255,255,255,255,240,235,245,252,255,255,248,252,241,255,250,255,255,255,255,255,255,216,231,146,139,143,153,181,215,212,201,222,201,186,185,183,184,167,160,158,109,91,82,92,77,81,61,77,75,76,98,96,142,174,152,124,140,97,117,103,68,71,51,50,
48,48,51,0,133,95,60,32,20,23,34,63,47,45,66,50,62,57,56,57,63,56,71,80,93,95,97,95,116,109,110,102,141,98,104,138,169,127,162,177,181,195,203,140,157,181,207,237,243,252,237,217,253,255,223,225,234,229,224,231,227,240,238,239,255,255,252,255,235,255,255,243,255,240,253,249,247,255,255,255,255,255,255,255,232,184,154,143,133,152,173,169,208,218,216,200,211,226,205,183,167,160,122,135,100,96,79,87,87,75,78,81,108,101,119,123,164,188,174,124,127,101,98,120,91,60,55,54,
51,53,56,67,122,89,67,53,27,28,27,42,78,51,61,44,64,61,41,85,92,56,70,85,119,93,92,109,168,116,136,124,101,110,105,103,173,163,180,202,182,189,190,150,162,133,184,228,255,255,249,229,228,231,237,249,241,232,243,241,239,253,228,249,255,249,248,255,239,243,249,244,252,241,247,255,255,254,255,255,255,255,255,231,203,171,132,149,155,154,155,163,207,208,207,203,212,232,254,200,188,187,152,122,114,105,92,85,83,62,65,88,90,101,125,149,159,184,167,128,134,110,98,85,100,56,54,54,
49,50,61,74,115,87,90,75,34,33,26,33,53,53,38,50,50,54,63,73,80,75,78,91,114,92,84,129,144,133,165,124,117,118,110,123,181,149,169,190,182,174,178,130,142,123,141,190,232,246,246,244,233,221,243,244,255,246,246,232,229,241,227,251,255,243,255,255,255,255,255,252,255,244,250,239,252,255,255,255,255,255,255,227,214,196,158,155,182,157,157,168,205,210,226,201,229,237,255,226,209,202,165,133,122,108,97,81,70,74,71,91,106,118,126,155,166,204,134,142,139,97,103,84,67,64,49,53,
67,65,63,65,86,110,96,76,45,50,40,29,37,52,57,50,41,65,57,63,102,77,67,83,88,108,95,141,190,164,188,133,99,99,111,116,146,129,169,182,181,181,182,161,143,122,138,184,215,213,235,228,220,240,253,229,255,251,235,228,243,244,239,246,255,255,255,255,255,255,255,255,255,250,255,245,255,255,255,255,255,255,246,206,216,194,181,183,170,156,171,185,203,205,224,208,207,233,255,223,252,177,156,181,172,163,101,81,107,85,95,107,119,128,128,158,169,146,126,128,114,105,94,86,70,53,62,72,
65,63,70,71,83,103,88,86,60,34,53,31,44,58,62,56,49,42,60,64,64,65,75,87,90,138,122,140,202,176,177,109,88,97,106,117,151,145,165,176,181,209,201,163,134,93,128,181,189,193,216,224,219,231,239,238,241,233,235,236,240,252,240,236,250,255,255,255,255,255,255,255,255,255,255,234,252,255,255,255,255,255,234,228,222,199,183,213,191,166,173,191,184,200,227,212,223,239,209,213,254,216,224,179,154,123,128,98,119,97,94,105,112,107,115,126,147,124,150,137,110,108,85,82,63,54,54,59,
63,67,63,75,84,107,97,104,71,38,50,73,80,54,55,59,65,45,62,66,84,71,78,67,83,96,118,148,150,174,146,93,81,93,108,111,114,124,130,173,190,231,204,135,113,79,115,129,144,161,209,212,221,230,231,199,211,224,224,217,249,240,250,232,250,255,255,255,255,255,254,243,239,255,239,248,255,254,254,255,255,255,255,254,235,219,241,224,213,188,170,179,176,194,184,188,192,213,198,201,225,219,237,180,137,145,139,97,121,92,107,119,111,106,122,109,132,123,134,130,103,103,89,76,63,55,50,54,
65,58,66,68,99,80,117,124,92,51,49,110,75,44,76,45,61,47,67,76,79,72,81,65,82,98,104,121,144,197,105,96,91,86,107,103,109,117,102,146,191,188,194,160,112,94,109,120,125,159,200,222,227,240,220,200,208,214,205,208,255,223,247,243,236,240,255,255,244,252,252,241,250,255,237,248,255,255,255,255,255,255,255,255,255,252,255,244,245,183,173,242,174,154,150,134,155,166,192,203,214,238,209,185,152,108,144,144,122,123,135,125,99,105,121,121,146,126,125,106,104,95,106,68,51,53,50,55,
69,75,80,70,74,89,104,146,114,78,56,118,99,62,76,79,77,59,78,128,95,65,78,72,93,109,90,97,115,157,104,88,91,84,100,102,104,109,109,126,152,161,176,190,141,111,98,106,122,158,193,212,222,255,233,200,201,211,197,209,224,223,216,222,210,243,255,239,248,255,238,255,255,255,254,255,255,255,255,255,255,255,255,255,255,255,255,255,234,191,222,230,215,206,169,136,134,151,169,153,217,235,207,186,193,159,185,176,143,145,136,119,104,105,122,145,117,103,124,111,86,99,88,84,76,73,83,52,
73,80,73,77,67,90,86,152,135,114,79,102,96,79,79,107,97,114,91,126,174,78,79,79,65,74,77,88,116,116,84,96,98,79,90,99,103,112,103,109,137,150,200,198,185,133,135,108,129,194,193,212,226,228,229,231,218,215,217,229,220,227,227,218,215,235,255,244,237,238,237,238,242,239,255,255,255,255,255,255,255,255,255,255,255,255,255,255,252,232,221,211,188,179,144,129,144,150,139,158,217,216,187,190,201,179,176,166,189,164,161,105,100,104,137,126,117,101,127,106,90,100,75,72,66,67,70,71,
77,64,71,64,75,67,84,101,124,109,106,120,103,43,80,90,105,102,102,117,154,106,82,98,76,73,75,72,107,119,100,83,102,80,82,99,105,117,99,122,124,149,169,216,190,125,142,116,132,169,198,212,211,211,228,237,247,234,228,217,218,227,220,224,223,249,255,229,237,243,253,243,255,255,253,255,255,253,255,248,254,255,255,255,255,255,255,255,229,237,214,201,175,154,128,129,150,150,165,181,205,239,211,211,202,130,190,165,185,190,144,104,111,110,134,107,88,103,109,96,80,101,86,78,59,65,68,66,
64,62,73,63,70,67,70,100,112,111,114,119,92,87,123,120,112,126,122,141,162,150,119,78,80,89,75,74,103,103,107,88,97,112,128,142,110,125,113,144,165,127,136,208,192,135,110,110,131,141,171,184,145,212,222,215,227,212,241,213,218,247,245,234,255,235,233,229,232,255,242,240,253,235,231,255,255,255,250,247,249,255,255,255,255,255,255,255,255,227,193,170,154,148,139,147,150,162,169,185,199,207,213,204,165,202,190,154,146,149,113,114,112,120,136,109,107,101,104,86,91,71,90,68,65,82,70,59,
70,70,68,60,63,63,60,97,102,108,104,122,97,69,103,110,110,127,128,145,158,153,127,116,130,87,74,60,60,78,114,111,181,163,181,172,128,152,135,158,171,125,118,181,147,129,89,109,134,177,155,139,131,172,204,219,214,214,239,216,228,228,229,255,243,219,224,242,242,252,253,235,231,242,255,250,255,255,236,237,251,255,255,255,255,255,255,255,255,227,194,163,152,137,141,134,140,156,137,199,238,213,160,131,201,198,164,140,138,156,111,142,122,110,134,135,116,120,101,104,89,84,84,73,67,63,72,76,
62,58,52,54,56,67,76,102,110,108,101,123,104,101,99,91,118,130,140,130,161,163,113,88,151,106,80,61,64,69,84,141,134,154,193,181,97,111,133,143,141,127,128,150,139,128,88,123,157,222,155,186,157,191,214,255,229,230,239,218,228,229,210,227,222,228,239,235,255,255,248,255,245,242,255,241,230,230,231,245,252,255,255,255,255,255,255,255,255,226,195,169,148,159,138,133,141,120,128,192,236,226,156,160,188,177,154,142,116,122,118,145,140,164,142,115,121,116,94,94,93,73,73,78,77,69,65,68,
58,56,66,66,71,75,67,113,106,112,108,112,105,106,120,116,137,129,126,139,141,132,135,82,117,74,72,133,129,74,91,128,162,164,199,174,110,114,117,128,140,125,107,127,131,134,97,110,116,141,154,170,158,204,212,240,219,222,246,235,231,222,219,249,229,230,244,243,253,255,255,254,255,255,238,217,240,228,229,249,255,250,255,255,255,255,255,255,255,237,195,190,159,139,147,159,123,120,116,174,211,194,168,184,177,178,177,100,119,105,120,164,207,169,150,116,112,112,97,94,88,67,74,82,77,78,78,76,
67,67,70,74,82,93,100,102,104,133,114,111,118,120,132,112,146,147,151,143,159,166,148,95,86,158,97,93,113,74,72,98,185,183,175,162,106,129,123,114,154,137,135,140,135,137,148,105,91,90,103,133,172,205,214,230,244,225,238,219,239,251,250,255,239,234,241,255,255,255,255,250,227,241,236,239,227,224,254,255,237,242,239,250,255,255,255,255,252,220,191,175,170,151,132,123,129,100,103,174,186,177,182,144,134,185,175,138,113,101,132,179,174,161,140,118,122,107,99,91,82,75,74,75,77,75,71,73,
67,73,86,89,102,98,93,91,106,125,115,117,104,112,129,127,178,184,154,139,107,120,143,88,64,73,63,79,100,138,141,128,139,181,144,136,114,114,110,116,143,107,117,128,121,127,135,131,99,95,113,179,226,221,216,235,238,252,241,224,228,240,255,255,255,240,241,221,242,224,236,235,238,245,226,240,233,233,253,253,231,234,237,253,243,255,254,255,255,245,221,202,216,179,155,129,137,138,140,154,167,178,168,195,143,140,182,135,119,125,152,167,173,171,136,122,116,100,95,95,70,58,71,75,79,67,77,76,
84,92,102,93,87,88,68,80,126,126,128,114,113,109,133,124,149,191,136,103,73,47,41,48,39,81,63,118,153,146,152,158,158,166,137,120,119,123,114,131,121,117,114,103,97,68,92,130,132,103,141,214,229,244,217,231,237,255,250,229,230,226,234,252,231,255,254,219,212,219,235,240,227,246,217,228,235,246,242,242,231,239,243,255,250,237,253,241,247,243,233,247,167,160,191,158,179,222,197,163,162,184,177,176,153,171,182,153,145,146,163,165,164,139,153,129,112,109,90,84,56,47,56,54,67,75,75,80,
100,93,86,83,68,67,63,67,109,142,146,125,135,116,122,129,144,153,131,105,68,64,43,54,46,57,81,118,183,153,156,106,170,161,140,134,192,157,127,124,130,122,100,99,86,107,131,138,133,99,151,196,233,240,228,244,239,249,219,212,214,227,240,241,238,250,226,210,214,220,227,235,238,234,243,229,244,254,229,248,241,213,244,247,234,246,237,238,244,251,253,202,183,169,205,214,233,205,180,143,163,197,184,162,196,183,171,173,165,163,152,178,150,152,152,134,119,95,83,74,63,61,52,47,54,60,67,71,
86,83,73,67,63,67,74,76,95,133,154,156,146,147,130,125,158,138,118,81,65,61,52,53,74,50,83,76,169,160,153,121,163,149,147,143,187,209,151,129,119,126,107,95,97,109,129,109,108,92,132,175,214,223,232,248,248,237,214,210,213,222,222,219,235,250,220,211,219,234,240,239,255,245,246,254,243,233,240,229,213,214,233,247,237,243,245,245,255,255,231,204,184,204,212,210,234,201,176,149,177,207,181,198,208,183,175,186,169,158,177,141,179,152,152,121,141,87,68,71,65,67,63,61,52,46,54,60,
73,67,63,67,72,76,86,75,75,120,149,137,142,137,160,139,130,148,128,91,70,63,59,55,58,48,60,55,158,147,127,111,136,117,128,150,116,164,138,129,113,123,126,97,105,90,120,114,93,108,160,175,192,220,255,238,232,232,221,218,218,250,223,220,242,232,222,224,228,233,246,237,235,249,248,253,240,231,237,221,220,214,215,236,235,248,251,255,255,237,215,218,207,228,208,200,208,192,174,217,219,203,179,196,199,194,188,196,168,162,161,164,160,180,147,134,131,83,77,54,60,68,65,68,63,61,52,46,
63,67,70,76,80,75,72,82,71,73,123,130,126,143,150,140,131,146,176,120,81,70,94,64,57,58,53,46,117,136,133,114,162,95,109,141,126,134,128,129,108,100,129,170,113,103,90,103,94,103,175,168,177,215,214,247,252,231,227,231,243,247,241,232,234,220,218,230,222,236,255,243,252,255,255,251,255,219,229,209,224,233,227,220,255,255,255,255,235,223,209,204,211,226,195,219,191,178,181,222,209,197,208,206,185,206,195,199,175,172,181,172,174,153,135,128,121,76,50,47,55,59,60,68,65,62,63,61,
70,76,77,87,72,80,73,70,63,67,78,118,116,135,131,157,155,123,141,141,101,87,83,67,64,60,57,59,62,91,116,137,106,106,92,150,169,124,123,116,112,92,98,106,92,101,86,93,96,100,138,140,158,180,219,228,235,221,210,239,240,247,255,255,218,233,219,245,255,248,251,247,242,255,242,245,236,229,222,203,212,232,245,239,255,255,255,239,240,229,227,226,238,222,221,214,195,199,179,206,206,211,208,204,200,216,194,211,199,187,163,182,151,139,144,110,82,74,68,65,51,42,53,56,68,70,65,62,
77,74,72,76,76,74,66,65,64,58,59,85,124,106,131,137,183,154,122,146,106,97,100,69,74,61,82,64,81,94,103,136,143,124,100,96,141,153,124,120,108,98,90,86,84,100,94,90,107,101,116,130,150,178,228,237,229,212,221,233,255,255,255,237,226,231,240,248,255,255,255,255,252,250,244,247,233,233,215,210,229,229,245,255,255,255,241,255,236,252,230,255,232,208,218,195,201,188,184,210,209,203,203,216,224,197,218,202,187,187,172,160,146,144,139,108,82,63,63,67,69,58,49,43,52,56,63,70,
74,76,76,71,67,66,63,59,57,63,63,77,102,107,143,130,165,158,157,124,127,67,92,73,76,70,68,73,94,132,123,104,178,172,104,94,110,153,123,138,113,93,86,91,82,94,96,94,116,103,112,131,152,208,226,235,237,220,222,245,255,255,255,224,224,226,255,255,255,255,255,255,250,251,226,220,242,224,229,237,240,224,247,255,251,234,228,238,231,240,238,238,222,212,196,204,191,200,194,220,181,175,218,228,223,207,217,195,208,186,177,137,162,142,116,99,93,80,73,59,59,65,65,55,47,43,52,57,
82,71,70,63,67,66,54,59,63,63,72,67,90,97,118,124,121,175,160,157,141,139,115,119,52,84,91,79,91,130,165,135,133,167,125,121,112,120,160,118,136,100,82,93,95,101,101,91,115,93,124,137,149,201,213,240,255,240,255,255,255,255,255,255,249,238,255,245,255,255,255,232,234,246,213,220,226,213,248,249,255,255,253,235,226,229,239,213,233,235,239,220,202,201,205,221,198,192,210,198,194,194,183,222,211,221,218,204,199,194,160,154,164,134,113,79,77,86,80,83,63,56,67,68,65,51,47,55,
70,68,65,64,58,59,63,63,63,69,66,68,63,81,124,115,130,160,161,142,153,165,150,116,127,86,109,95,118,120,144,160,157,152,139,117,127,110,193,158,128,139,110,120,135,144,152,144,171,160,182,164,183,237,241,255,255,250,255,255,255,255,255,255,255,240,246,255,255,250,254,241,241,215,225,232,218,229,239,255,255,237,226,224,255,231,225,222,231,205,230,237,199,206,207,231,199,209,196,186,207,197,197,220,240,229,202,188,206,178,155,154,133,99,85,66,74,79,83,82,80,73,62,63,67,69,56,51,
66,63,59,57,62,64,66,72,67,66,65,61,65,70,82,107,109,140,155,182,174,161,149,98,127,85,92,151,114,166,152,193,135,88,97,146,156,156,155,192,164,145,141,153,150,167,149,136,173,203,215,225,229,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,239,250,227,221,220,224,241,220,239,255,255,241,247,207,223,220,231,231,210,218,208,228,222,194,218,233,243,208,196,179,183,188,196,199,217,229,200,226,201,222,164,141,129,110,96,80,64,60,74,85,77,86,87,85,70,59,59,65,65,
61,54,59,61,71,69,69,70,68,62,63,68,63,70,81,92,114,132,126,163,172,182,161,148,126,146,113,140,118,155,166,170,110,86,128,187,174,171,161,192,228,195,203,167,208,200,143,137,163,212,235,225,251,255,255,255,255,227,252,255,255,255,255,255,255,255,255,247,248,233,222,220,231,226,214,234,219,243,254,249,226,210,225,229,235,242,236,208,208,203,197,201,184,207,213,210,214,192,184,174,203,217,202,226,197,202,194,196,153,148,123,104,89,79,86,78,67,57,64,74,84,83,89,86,75,63,56,58,
57,62,64,66,72,67,66,65,63,65,66,66,71,68,63,84,83,80,113,122,127,154,142,125,129,142,132,136,114,163,174,133,95,82,88,110,125,142,134,169,232,247,212,228,206,198,213,208,240,229,252,255,255,255,255,255,255,255,255,255,255,254,255,255,255,255,253,255,251,249,238,228,229,224,230,235,255,255,255,237,227,230,247,244,246,220,220,202,205,203,202,202,195,201,206,197,195,198,203,188,204,211,209,196,201,191,180,148,149,135,124,107,76,68,74,89,86,68,61,65,74,85,77,86,87,85,70,59,
63,66,69,69,70,71,63,65,63,68,69,74,65,68,64,61,80,104,113,117,113,120,126,150,109,129,149,159,156,134,163,173,123,108,97,148,149,125,131,176,205,230,255,234,229,221,238,221,234,237,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,249,243,248,239,232,248,252,242,248,254,244,232,240,230,227,207,220,213,222,217,194,193,219,190,186,192,198,210,200,195,197,186,194,180,180,199,187,182,185,141,124,133,115,113,90,72,61,66,65,90,87,78,60,61,67,80,84,83,89,84,83,
66,72,67,63,65,63,65,62,63,70,69,63,68,64,59,63,65,91,119,114,122,130,146,137,106,98,130,132,140,161,160,161,142,87,109,159,158,113,146,184,201,231,238,248,241,221,205,249,232,227,255,255,255,255,255,255,255,255,255,255,254,255,255,255,255,253,255,250,249,237,245,242,246,224,255,255,249,230,238,219,212,231,216,232,209,211,199,201,215,199,191,194,198,209,199,197,188,188,169,149,177,196,185,189,165,163,149,129,120,115,95,74,63,63,61,60,67,74,86,78,61,61,65,74,75,77,86,87,
69,66,63,64,61,65,66,66,71,69,63,68,61,62,63,61,57,63,112,119,111,125,141,132,128,118,98,103,138,143,144,141,169,176,165,150,151,195,204,188,206,207,195,230,252,242,245,243,248,255,255,255,255,255,255,255,255,255,255,255,255,255,255,254,255,255,243,252,242,255,255,251,255,255,220,221,213,209,211,201,223,221,218,203,198,205,202,194,194,194,202,203,192,198,195,185,177,191,161,192,190,192,181,148,145,163,128,118,102,82,63,75,68,64,64,70,56,68,76,89,86,68,64,60,70,78,76,83,
66,68,62,63,63,68,69,69,69,63,63,61,62,65,61,57,62,67,71,101,107,100,107,101,105,130,124,100,128,162,160,154,161,159,177,195,165,164,194,193,210,215,190,211,235,228,232,249,243,246,255,255,255,255,255,255,255,255,255,255,255,255,255,246,245,255,254,249,249,255,252,249,230,216,224,228,226,242,214,207,204,203,203,198,201,190,214,208,220,208,198,199,180,188,187,185,176,189,181,186,183,161,140,129,128,109,116,103,69,62,63,58,75,68,62,64,73,53,68,74,78,87,78,60,57,64,74,79,
65,63,65,62,63,70,69,65,68,63,61,62,61,57,57,64,67,72,86,87,100,106,109,119,120,122,141,134,136,150,172,168,184,170,180,175,178,194,202,189,206,222,214,216,219,241,238,239,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,250,243,242,234,249,250,246,239,219,218,229,245,247,227,216,216,209,203,205,227,219,216,214,220,201,205,201,201,187,194,187,177,228,181,180,185,166,133,134,121,125,102,104,92,59,54,61,63,62,68,96,69,61,65,53,66,65,74,86,78,61,61,65,74,
65,65,66,66,67,69,63,68,64,61,62,61,63,57,69,67,75,86,79,77,81,98,94,95,130,134,138,145,144,149,150,165,164,161,165,164,128,158,159,207,210,199,202,209,204,219,243,241,243,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,243,237,210,216,226,213,212,226,231,230,232,227,234,234,240,248,222,208,188,191,198,199,224,211,205,205,183,207,192,175,199,169,136,129,125,118,131,114,101,59,52,46,54,61,63,66,68,80,68,61,72,61,60,67,76,84,86,68,64,61,
68,68,69,69,68,63,68,61,59,63,60,63,57,69,67,75,86,79,77,74,80,80,98,53,78,120,128,135,143,145,165,158,184,193,206,167,178,176,188,149,161,175,202,225,239,246,253,250,255,248,255,255,255,255,255,255,255,255,255,255,255,255,255,255,252,255,242,245,235,237,233,215,217,227,247,233,223,208,229,225,227,216,213,199,192,188,189,193,204,201,191,200,191,187,209,187,186,182,154,169,134,128,111,114,121,106,78,54,54,52,46,54,61,63,66,59,80,77,63,63,70,56,68,74,78,87,78,67,
63,70,69,69,63,66,61,61,63,65,55,58,63,67,75,86,79,77,80,80,78,96,81,95,61,95,126,113,114,114,135,157,166,184,160,189,178,192,211,186,202,205,214,220,220,232,238,249,255,240,235,244,248,251,254,255,255,255,255,255,255,255,233,246,242,238,243,251,240,243,239,232,237,237,255,230,210,218,218,219,241,213,199,186,206,189,186,194,210,178,187,193,193,220,197,196,169,160,171,126,123,119,109,109,108,64,71,52,54,54,52,46,54,61,69,65,63,70,74,63,71,70,61,68,74,74,86,78,
67,69,66,68,63,61,62,63,65,55,58,63,69,75,86,79,77,80,80,83,96,89,81,76,111,88,101,110,118,120,114,139,152,162,169,169,165,173,189,177,178,200,198,204,206,213,244,235,240,231,243,255,252,255,240,252,255,255,255,255,246,251,255,253,255,255,255,255,255,241,224,222,218,234,255,229,199,202,224,222,212,193,183,182,186,187,203,197,197,173,186,197,188,209,215,179,168,147,123,131,112,120,118,93,60,63,66,71,82,54,54,52,46,54,61,67,65,63,70,74,64,64,73,53,66,71,74,84,
69,63,67,64,61,60,63,55,54,58,70,69,75,86,79,77,80,80,78,90,89,86,75,83,81,103,114,75,119,108,103,114,150,152,167,158,175,173,172,191,182,177,197,207,223,212,216,247,255,241,242,255,255,252,240,242,250,255,255,254,255,245,255,243,248,255,250,255,247,223,207,218,201,207,188,190,197,193,215,203,203,194,197,201,207,212,232,204,183,180,197,198,224,204,158,142,132,138,126,122,140,114,78,59,55,50,72,66,75,54,54,54,52,46,54,61,67,62,56,73,80,64,71,65,61,56,67,76,
63,68,64,61,62,61,61,57,58,70,69,75,86,79,77,80,79,78,90,98,83,79,83,81,79,89,85,105,116,107,104,110,118,140,126,140,165,175,165,173,178,163,177,192,217,206,205,231,252,233,225,236,234,238,234,242,249,247,247,250,237,235,245,253,236,236,236,245,221,223,194,184,187,189,212,201,200,194,188,188,196,186,202,193,204,197,196,196,200,201,201,197,171,139,163,126,124,146,129,117,83,84,82,56,62,55,45,60,74,75,54,62,54,52,46,54,61,67,62,56,75,68,69,61,72,61,60,68,
68,61,59,64,61,61,57,63,66,69,75,86,79,77,80,78,83,83,100,84,79,78,86,78,100,73,80,80,99,94,93,102,100,124,118,146,146,154,184,179,163,161,187,183,192,198,198,225,240,255,232,241,241,238,246,247,253,255,249,251,242,248,251,241,238,231,212,228,220,203,211,191,188,191,188,181,182,176,192,182,187,180,191,197,185,189,190,186,177,185,178,161,163,165,143,137,160,129,101,71,74,61,77,78,56,67,55,45,72,59,64,74,55,54,52,46,54,61,67,63,63,75,68,69,57,63,70,56,
61,61,63,61,63,57,63,66,70,75,86,79,77,80,78,83,86,100,82,81,78,81,79,100,74,86,68,68,86,94,101,94,101,113,113,118,136,149,155,166,168,171,179,167,182,185,184,169,224,222,235,229,239,241,243,237,231,224,240,251,251,251,247,241,234,238,246,243,216,204,216,237,211,203,208,224,197,190,200,190,189,184,181,181,180,171,170,164,171,175,159,158,134,126,118,121,118,106,72,59,76,67,67,85,80,58,57,48,56,65,59,73,74,55,54,52,46,54,61,63,63,63,67,80,68,63,71,70,
62,63,60,63,57,62,73,71,78,84,79,77,80,78,80,86,95,82,81,73,82,81,82,78,74,71,68,80,89,100,95,93,108,110,84,117,138,134,132,153,161,160,151,164,182,197,184,196,208,208,210,229,227,238,243,240,230,236,246,244,247,219,242,235,233,227,231,210,210,225,222,196,204,217,186,178,189,194,186,186,187,183,205,196,184,184,168,166,170,173,147,150,115,134,111,103,91,79,82,60,64,73,63,68,85,69,59,57,49,56,71,66,73,50,55,54,52,46,36,55,61,69,58,68,80,77,63,64,
63,65,63,57,64,73,71,78,84,79,78,80,78,80,78,95,81,81,76,82,81,78,89,75,75,67,77,92,93,96,96,94,101,101,87,83,100,143,136,144,139,147,155,154,159,180,209,220,225,199,201,214,235,234,230,225,232,214,229,241,216,201,190,237,233,240,215,217,214,209,206,185,180,184,193,190,188,194,197,182,199,184,171,165,192,162,177,166,128,152,154,141,131,110,121,102,90,78,81,73,55,66,74,62,79,82,64,59,57,60,63,64,66,56,50,55,54,47,46,36,55,61,69,62,68,80,74,64,
65,55,57,64,73,71,78,83,79,78,86,78,82,78,86,81,81,75,83,81,85,100,73,78,68,68,86,97,99,99,99,93,98,95,105,107,89,92,114,153,147,153,146,148,158,165,184,194,185,184,185,201,216,222,221,224,220,223,220,218,221,209,214,225,238,214,194,208,205,195,193,187,194,191,192,201,189,194,180,178,158,160,165,187,192,171,139,152,141,137,138,115,116,116,119,101,98,90,78,84,65,59,76,74,56,77,78,63,62,55,50,63,64,60,56,73,66,52,47,46,56,55,61,69,62,59,70,74,
55,57,69,68,71,78,83,79,82,86,75,82,80,96,91,86,81,78,86,78,88,74,84,74,68,86,89,100,95,94,93,96,99,96,105,106,104,102,106,112,127,135,140,142,155,162,167,185,184,168,179,194,192,200,183,203,204,204,197,203,216,197,190,190,205,207,199,201,195,190,181,176,174,188,198,183,185,169,175,167,159,170,158,155,147,146,141,137,137,114,119,105,96,112,119,123,102,93,80,79,82,60,66,73,68,65,85,76,56,67,55,59,72,76,71,78,73,58,52,52,46,56,55,61,63,66,59,70,
58,69,68,71,78,83,79,82,86,75,74,80,96,89,86,79,78,81,79,82,78,74,75,74,77,92,100,96,97,94,99,99,91,99,110,116,113,106,114,124,133,160,145,121,130,143,159,175,162,162,185,182,187,208,215,188,195,181,201,204,199,201,182,187,196,194,196,196,204,193,176,186,190,176,176,173,162,170,173,157,161,163,155,156,157,130,145,146,127,108,105,99,97,118,115,122,110,102,91,77,81,67,55,66,82,62,68,85,69,58,57,55,45,72,66,71,78,47,58,52,52,46,56,55,61,63,66,63,
69,67,71,78,83,79,82,86,75,74,78,85,89,84,80,78,93,81,78,89,75,80,68,73,86,92,100,95,91,91,97,102,96,105,106,111,114,112,115,136,148,131,133,134,135,136,158,147,161,150,184,197,186,194,197,210,199,189,202,192,178,174,176,190,189,167,182,189,200,187,192,178,176,181,188,168,155,163,146,150,134,150,133,147,139,129,121,122,115,120,103,108,102,96,112,119,124,100,90,86,79,69,65,59,74,74,61,79,82,64,59,69,48,62,72,66,61,52,47,58,52,52,46,56,55,61,63,66,
67,72,78,83,79,82,86,75,74,83,90,100,84,81,73,82,81,79,92,73,78,68,68,86,89,101,96,96,94,97,96,94,102,100,116,113,107,112,122,143,139,120,131,136,122,129,147,143,164,180,162,142,161,196,212,209,233,206,187,175,175,171,170,169,175,174,201,173,177,189,172,167,155,160,156,179,154,151,153,138,126,125,146,145,150,147,129,118,116,120,105,102,99,97,112,112,119,113,99,90,78,86,68,60,66,73,67,56,77,68,56,59,57,49,56,72,59,75,82,47,58,52,52,46,56,55,65,63,
72,78,83,79,82,86,75,80,83,90,100,82,74,76,83,81,85,88,74,84,71,67,76,92,100,98,99,99,93,98,95,97,105,106,111,116,111,115,138,137,123,127,133,129,120,124,127,136,124,141,139,168,180,181,179,173,173,165,183,181,174,170,178,183,172,178,173,168,160,175,165,170,148,145,141,148,148,138,141,132,126,144,149,143,139,158,141,114,113,108,114,101,106,102,96,112,120,120,101,98,90,78,80,67,55,65,68,63,65,85,76,63,62,55,60,48,65,59,75,82,67,58,52,52,46,56,55,61,
78,83,79,82,86,75,80,78,83,100,82,81,75,83,76,84,82,78,74,75,67,71,86,92,100,95,94,93,96,96,94,104,111,116,112,116,112,119,142,140,116,126,139,127,121,121,119,132,127,110,114,138,140,133,151,157,159,156,171,162,179,147,156,157,154,168,154,146,151,180,157,141,152,163,158,146,129,135,132,122,128,142,147,142,140,151,140,121,120,119,113,105,103,103,97,109,115,119,113,102,93,80,79,69,65,59,68,74,62,68,85,69,66,59,55,50,63,71,59,64,54,67,58,52,52,46,56,55,
83,79,82,86,76,80,78,83,95,81,81,81,78,86,79,82,89,75,80,68,68,82,89,94,96,97,94,92,98,95,97,105,106,111,116,111,113,133,143,132,119,134,134,125,128,128,124,129,113,112,112,139,129,107,122,116,138,130,137,139,152,150,150,138,135,144,143,156,135,153,149,132,126,154,125,135,135,137,134,127,131,139,144,145,155,147,148,125,118,116,111,109,101,106,102,96,112,109,120,101,92,91,77,86,77,60,60,76,74,61,79,82,69,58,67,55,59,63,64,66,64,54,54,59,52,52,46,56,
79,82,86,74,80,78,86,95,81,86,79,78,81,81,78,92,73,86,74,68,80,92,100,99,99,97,91,96,99,100,104,111,116,112,116,112,115,150,148,121,135,134,129,120,121,118,131,127,115,110,116,139,129,108,120,120,139,129,124,144,161,145,141,124,132,148,137,148,141,165,132,134,127,156,127,132,133,139,126,131,128,118,146,147,143,139,161,139,118,122,116,120,101,103,103,97,109,115,115,123,102,90,86,78,84,67,55,64,73,68,67,77,68,64,59,57,55,45,72,64,66,73,54,54,54,52,52,46])};

 const globalThis={NightMoonMap};const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
 const moon={r:90},VIEW={scale:1},arrivals=[{"start":11.863645239775874,"end":12.080956241432798},{"start":12.105213897976299,"end":12.471839895191172},{"start":11.606585445334769,"end":12.071850564665782},{"start":12.989813616061937,"end":13.160505494902381},{"start":13.072126630576474,"end":13.26936474926749},{"start":13.451392768308857,"end":13.761189225448458},{"start":12.896751209749418,"end":13.235553488199589},{"start":12.978378568147585,"end":13.43463890376616},{"start":11.692789139150792,"end":11.845622115846},{"start":12.438187313010161,"end":12.704065366990282},{"start":12.530793194297665,"end":12.860686072418257},{"start":12.925305921019792,"end":13.090938127245792},{"start":13.473214639577922,"end":13.660723810917549},{"start":12.947314115065746,"end":13.354113947071673},{"start":13.354087173924789,"end":13.57033903139586},{"start":13.421443179277553,"end":13.976732708308692},{"start":12.582913925380696,"end":12.7838372385055},{"start":12.274269252219698,"end":12.72111569409043},{"start":13.292611564219943,"end":13.510747676971034},{"start":13.453867836307047,"end":13.633946255819765},{"start":13.200167394554168,"end":13.407022021249155},{"start":13.618366793034333,"end":13.844097219461073},{"start":13.720229023707045,"end":14.261962216063523},{"start":13.825116891046846,"end":14.02851540438357},{"start":13.173624666984978,"end":13.394325546231556},{"start":13.328857882536848,"end":13.60530538364344},{"start":13.706042258525589,"end":13.924263215807763},{"start":12.517804638151649,"end":12.975184620001162},{"start":13.556166008286308,"end":13.741789063873654},{"start":13.375385249824248,"end":13.876186228778899},{"start":13.992746898932499,"end":14.345698042195117},{"start":14.709206434611701,"end":14.982845548182087},{"start":14.6909719275403,"end":14.898202032811751},{"start":13.186567376169553,"end":13.406190431918079},{"start":13.173481024334517,"end":13.393935518307746},{"start":13.3119372479585,"end":13.677741526210971},{"start":13.880460783220324,"end":14.202947811410837},{"start":14.122946657606875,"end":14.656815166775552},{"start":14.326771321452684,"end":14.737932705597771},{"start":14.587579414024681,"end":15.008543268693636},{"start":14.262938112432318,"end":14.86100336919481},{"start":13.432524620516213,"end":13.58849103668488},{"start":13.514999676865912,"end":13.970409324037822},{"start":13.593841605185172,"end":13.813760241707373},{"start":14.129129754218098,"end":14.59762890980224},{"start":14.738591741815327,"end":14.92102901315928},{"start":14.60893317753002,"end":15.182427081194657},{"start":14.340446558032607,"end":14.527922824027087},{"start":14.805399078789383,"end":15.312320298564194},{"start":13.507157719361869,"end":13.8919475527898},{"start":13.90255286361447,"end":14.210054874614649},{"start":14.415313792451913,"end":14.57528660180366},{"start":14.371107843203996,"end":14.78585967757483},{"start":14.873904693581817,"end":15.351637760639669},{"start":14.966463981896418,"end":15.30202738788405},{"start":14.593082128347778,"end":14.787159188875119},{"start":15.27467015112447,"end":15.62900662970484},{"start":13.83115308716088,"end":14.274766257901598},{"start":14.414101795210955,"end":14.574535293493176},{"start":14.692779477787077,"end":14.901075153107918},{"start":14.46466909183224,"end":14.798572502475636},{"start":14.46907350139637,"end":14.857665833533712},{"start":14.018281563197139,"end":14.554281622382167},{"start":15.427217334475909,"end":15.984887209005436},{"start":15.620897828106525,"end":16.04179696143604},{"start":15.778555532574096,"end":16.03006091064904},{"start":15.169850235959744,"end":15.3816751575435},{"start":14.14727679179693,"end":14.30893642863203},{"start":14.78023925694172,"end":15.033267497883358},{"start":15.074181684139347,"end":15.287105971192812},{"start":15.311645146196568,"end":15.491607287416155},{"start":15.39766564377804,"end":15.740535417067466},{"start":16.159403937725735,"end":16.41721157472189},{"start":16.572821845278035,"end":17.164706667063818},{"start":13.779950245236133,"end":14.213605493739916},{"start":14.899296309167482,"end":15.08695187638958},{"start":15.051296463924146,"end":15.251930041000803},{"start":15.551065229778846,"end":15.942244447564093},{"start":15.866119733583194,"end":16.04820835378168},{"start":16.2730908701606,"end":16.50891750588104},{"start":16.382233559988556,"end":16.94331380254694},{"start":15.456405631798944,"end":16.037492550190464},{"start":14.943500783689565,"end":15.260007790975983},{"start":15.13618528698984,"end":15.551966852558017}];
function lunarPixel(x,y){
  const rr=x*x+y*y;if(rr>=1)return [0,0,0,0];
  const map=globalThis.NightMoonMap,n=map.size;
  const px=clamp((x+1)/2)*(n-1),py=clamp((y+1)/2)*(n-1);
  const ix=Math.floor(px),iy=Math.floor(py),jx=Math.min(n-1,ix+1),jy=Math.min(n-1,iy+1);
  const at=(a,b)=>map.values[b*n+a]/255;
  const tone=mix(mix(at(ix,iy),at(jx,iy),px-ix),mix(at(ix,jy),at(jx,jy),px-ix),py-iy);
  const dark=[176,168,149],light=[255,247,218];
  // 只均匀提亮原月貌，不叠亮边，沿用原有轮廓透明度。
  return [...dark.map((v,i)=>Math.round(Math.min(255,mix(v,light[i],tone)*1.06))),Math.round(255*clamp((1-Math.sqrt(rr))*192))];
}
function createMoonRaster(pixelRatio,displayScale=1,screenRatio=pixelRatio){
  const sampling=VIEW.scale*pixelRatio*4;
  // 过渡宽度以最终屏幕像素计，避免整幅画布经页面缩小后边缘又变硬。
  const edge=1.2/(moon.r*VIEW.scale*displayScale*screenRatio);
  const padding=Math.max(3/(VIEW.scale*pixelRatio),edge*moon.r);
  const size=Math.ceil((moon.r+padding)*2*sampling/2)*2,span=size/sampling;
  const step=span/size/moon.r,base=new Float32Array(size*size*6);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=((x+.5)/size-.5)*span/moon.r,ny=((y+.5)/size-.5)*span/moon.r;
    const radius=Math.hypot(nx,ny),i=(y*size+x)*6,coverage=smooth((1-radius)/edge+.5);
    if(!coverage)continue;
    const inset=Math.max(1,radius/.999999),rgb=lunarPixel(nx/inset,ny/inset);
    base.set([rgb[0],rgb[1],rgb[2],coverage,nx,ny],i);
  }
  return {size,span,step,edge,base,pixels:new Uint8ClampedArray(size*size*4)};
}
function paintMoonRaster(raster,progress){
  const {base,pixels,edge}=raster,p=clamp(progress),k=1-2*p;
  const softness=.055*Math.sin(Math.PI*p);
  for(let j=0,i=0;j<pixels.length;j+=4,i+=6){
    const coverage=base[i+3];if(!coverage||p===0){pixels[j+3]=0;continue;}
    const x=base[i+4],y=base[i+5],arc=Math.sqrt(Math.max(0,1-y*y));
    const distance=(x-k*arc)/Math.sqrt(1+(k*y/Math.max(arc,.00001))**2);
    const lit=p===1?1:smooth(distance/edge+.5);
    const shade=softness>1e-8?1-.24*(1-smooth(Math.max(0,x-k*arc)/softness)):1;
    for(let c=0;c<3;c++)pixels[j+c]=Math.round(base[i+c]*shade);
    // 未受光区域透明，直接露出纯黑页面，不再出现蓝灰色圆盘。
    pixels[j+3]=Math.round(coverage*lit*255);
  }
  return pixels;
}
 function moonProgress(t){return arrivals.reduce((sum,e)=>sum+smooth((t-e.start)/(e.end-e.start)),0)/arrivals.length;}
 function moonFactory(root,K,def,still){
  root.innerHTML='<canvas class="pattern-canvas" width="640" height="360" aria-hidden="true"></canvas>';
  const canvas=root.firstElementChild,density=Math.min(4,Math.max(1,global.devicePixelRatio||1));canvas.width=640*density;canvas.height=360*density;
  const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};ctx.setTransform(density,0,0,density,0,0);
  const raster=createMoonRaster(1,1,density),texture=document.createElement('canvas');texture.width=texture.height=raster.size;
  const tc=texture.getContext('2d'),image=tc.createImageData(raster.size,raster.size);let last=-1;
  const render=ms=>{const progress=still?1:moonProgress(11.5+Math.min(def.duration_ms,Math.max(0,ms))/1000);if(progress===last)return;last=progress;
   image.data.set(paintMoonRaster(raster,progress));tc.putImageData(image,0,0);ctx.clearRect(0,0,640,360);
   ctx.drawImage(texture,320-raster.span/2,162-raster.span/2,raster.span,raster.span);canvas.dataset.progress=String(progress);
  };render(0);render.destroy=()=>{texture.width=texture.height=1;};return render;
 }
 F['moon-event-fill']=(root,K,def)=>moonFactory(root,K,def,false);
 F['osmanthus-moon-illustration']=(root,K,def)=>moonFactory(root,K,def,true);
})();

/* 原夕阳与波面受光倒影 */
(()=>{
const SCENE_STYLES = {
  blue: {
    sky: [[0, '#1265f3'], [1, '#1977f8']],
    sea: [[0, '#1469ee'], [1, '#2987fa']],
    sun: [[0, '#ff9a3a'], [.20, '#ff812b'], [.48, '#ff6023'], [.72, '#ff4420'], [.9, '#ff3520'], [1, '#ff4027']],
    reflection: [[255, 88, 34], [255, 172, 39], [255, 235, 112]],
    reflectionTail: [255, 245, 222],
    highlight: [255, 252, 238], trough: [18, 75, 183], ambient: [114, 187, 255],
    waveContrast: .23,
    glow: [255, 157, 71], skyGlow: [.18, .2, .045], seaGlow: [.28, .65, .035],
    nightSky: [6, 15, 49], nightSea: [6, 21, 50],
    nightHorizon: [31, 53, 92], horizonGlow: .15,
    board: [[224, 237, 255], [75, 113, 178], [43, 70, 128]],
    star: [243, 249, 255]
  },
  warm: {
    sky: [[0, '#f69b18'], [.36, '#e88d30'], [.67, '#ba6c50'], [.88, '#785b71'], [1, '#57576e']],
    sea: [[0, '#716470'], [.2, '#5b5e70'], [.6, '#414f65'], [1, '#2b4056']],
    sun: [[0, '#f8d379'], [.14, '#f5c454'], [.34, '#efac32'], [.58, '#eb8b2b'], [.8, '#dd602c'], [1, '#c84635']],
    reflection: [[230, 112, 49], [245, 177, 76], [247, 213, 146]],
    highlight: [255, 238, 200], trough: [17, 30, 43], ambient: [186, 151, 126],
    waveContrast: .38,
    glow: [255, 184, 111], skyGlow: [.58, .48, .065], seaGlow: [.58, .8, .09],
    nightSky: [12, 22, 39], nightSea: [10, 24, 38],
    nightHorizon: [99, 70, 66], horizonGlow: .105,
    board: [[255, 242, 213], [148, 137, 133], [85, 84, 99]],
    star: [255, 250, 239]
  }
};

const SUN_MOTION = Object.freeze({strength: 1, stretch: .06, squash: .09, rebound: .022,
  legLag: .14, emptyTilt: Math.PI / 36, ropeSlack: .015});

const WATER_FIELD = Object.freeze({rows: 72, columns: 192, pixelsWide: 384, pixelsHigh: 192,
  indexOfRefraction: 1.333, exposureBlue: 3.4, exposureWarm: 2.1});


 const width=900,height=1200,horizonY=912,sunR=41.04,sunX=450,sunY=horizonY-sunR*.76,SCENE_DURATION=65,AFTERGLOW_SECONDS=8,sunExitTime=53.7;
 const document={body:{dataset:{aspect:'3:4'}},createElement:tag=>global.document.createElement(tag)};
 const sceneStyle='warm',palette=SCENE_STYLES.warm,waterContacts=[];let waterReflectionField,sunBrush;
 const window={devicePixelRatio:1};const pixelDensity=()=>1;
function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function smoothstep(a, b, value) {
  const u = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return u * u * (3 - 2 * u);
}
function rgba(r, g, b, alpha) {
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}
function waveAt(x, row, time, scale) {
  const d = row.depth, u = x / (25 + d * 110);
  const a = u * .85 + d * 43 - time * .46;
  const b = u * 1.53 - d * 67 + time * .32;
  const c = u * 3.7 + d * 115 - time * .61;
  const swell = Math.sin(a) * .6 + Math.sin(b) * .28 + Math.sin(c) * .12;
  const facing = Math.cos(a) * .5 + Math.cos(b) * .32 + Math.cos(c) * .18;
  const patch = smoothstep(-.65, .65, Math.sin(u * .57 - d * 29 + time * .17)
    * .65 + Math.sin(u * 2.17 + d * 81 - time * .29) * .35);
  return {y: horizonY + d * (height - horizonY) + swell * (.2 + d * 4) * scale, facing, patch};
}
function waterFacet(ctx, x1, y1, x2, y2, thickness, color) {
  ctx.fillStyle = color;ctx.beginPath();ctx.moveTo(x1, y1);ctx.lineTo(x2, y2);
  ctx.lineTo(x2, y2 + thickness);ctx.lineTo(x1, y1 + thickness);ctx.closePath();ctx.fill();
}
function waterFresnel(cosine) {
  const c = Math.max(0, Math.min(1, cosine)), eta = WATER_FIELD.indexOfRefraction;
  const transmitted = Math.sqrt(Math.max(0, 1 - (1 - c * c) / (eta * eta)));
  const perpendicular = (c - eta * transmitted) / (c + eta * transmitted);
  const parallel = (eta * c - transmitted) / (eta * c + transmitted);
  return (perpendicular * perpendicular + parallel * parallel) * .5;
}
function buildWaterReflection() {
  let field = waterReflectionField;
  if (!field) {
    const canvas = document.createElement('canvas');
    canvas.width = WATER_FIELD.pixelsWide;canvas.height = WATER_FIELD.pixelsHigh;
    const ctx = canvas.getContext('2d');
    field = waterReflectionField = {canvas, ctx, image: ctx.createImageData(canvas.width, canvas.height),
      alpha: new Float32Array(WATER_FIELD.rows * WATER_FIELD.columns),
      depth: new Float32Array(WATER_FIELD.rows),
      rowAt: new Uint8Array(canvas.height), rowMix: new Float32Array(canvas.height),
      color: new Float32Array(canvas.height * 3)};
  }
  // 尺寸和配色改变只重算映射与颜色，像素缓冲继续复用。
  Object.assign(field, {width, height, horizon: horizonY, radius: sunR, style: sceneStyle, rows: waterRows});
  const canvas = field.canvas;
  for (let r = 0; r < WATER_FIELD.rows; r++) {
    // 保留现有 72 行的远密近疏位置，并为地平线/画面底端保留采样边界。
    field.depth[r] = r === 0 ? 0 : r === WATER_FIELD.rows - 1 ? 1 : waterRows[r].depth;
  }
  let row = 0;
  for (let y = 0; y < canvas.height; y++) {
    const d = y / (canvas.height - 1);
    while (row < WATER_FIELD.rows - 2 && field.depth[row + 1] < d) row++;
    field.rowAt[y] = row;
    field.rowMix[y] = (d - field.depth[row]) / (field.depth[row + 1] - field.depth[row]);
    const colorPhase = smoothstep(0, .98, d) * 2;
    const band = Math.min(1, Math.floor(colorPhase));
    const mix = colorPhase - band;
    // 奶白只落在最末端的一小段，不把整片近水洗成亮白色。
    const tailMix = palette.reflectionTail ? smoothstep(.88, 1, d) * .18 : 0;
    for (let channel = 0; channel < 3; channel++) {
      const color = palette.reflection[band][channel]
        + (palette.reflection[band + 1][channel] - palette.reflection[band][channel]) * mix;
      field.color[y * 3 + channel] = color + ((palette.reflectionTail || palette.reflection[2])[channel] - color) * tailMix;
    }
  }
  waterReflectionField = field;
  return field;
}
function drawWaterReflection(ctx, story, time) {
  let field = waterReflectionField;
  if (!field || field.width !== width || field.height !== height || field.horizon !== horizonY
    || field.radius !== sunR || field.style !== sceneStyle || field.rows !== waterRows) field = buildWaterReflection();
  const visibility = Math.max(0, Math.min(1, story.reflection));
  if (visibility < .001) return;
  const blue = sceneStyle === 'blue';
  const elevation = Math.max(0, story.light.elevation);
  const lifted = smoothstep(.012, .23, elevation);
  const reach = 1.14 - lifted * .76;
  // 计算范围始终围绕太阳，越界部分交给现有海面裁剪。
  // 两版沿用同样的波面散射范围，蓝橙不再额外放大成宽亮块。
  const halfWidth = sunR * 8.2 * (1 + elevation * .2);
  const left = story.sunX - halfWidth;
  const columns = WATER_FIELD.columns, rows = WATER_FIELD.rows;
  const localStep = halfWidth * 2 / sunR / (columns - 1);
  const localStart = -halfWidth / sunR;
  const lightY = .065 + elevation * .62;
  const lightInv = 1 / Math.sqrt(1 + lightY * lightY);
  const ly = lightY * lightInv, lz = -lightInv;
  const exposure = blue ? WATER_FIELD.exposureBlue : WATER_FIELD.exposureWarm;
  for (let r = 0; r < rows; r++) {
    const d = field.depth[r];
    const depthFade = 1 - smoothstep(Math.max(.04, reach - .27), reach, d);
    const rowEnergy = visibility * depthFade * (1 - d * .11);
    const vY = .025 + d * .46;
    const viewXScale = .0065 + d * .011;
    const roughX = .065 + d * .05;
    // 地平线内几像素包含许多波面：扩大法线分布来积分远处细波，
    // 避免单个相位刚好背光时，在太阳底部留下黑缝。
    const distantFootprint = 1 - smoothstep(.015, .13, d);
    const roughZ = .074 + d * .018 + distantFootprint * .20;
    const slopeFilter = 1 - distantFootprint * .70;
    // 亮蓝底上宽而透明的红色散射会混成灰紫色。只在远水区域收住日盘投影，
    // 保留较实的橙红亮核与短柔边，逐渐接回下方的波面反射；暖色仍用原响应。
    const blueDistance = blue ? (1 - smoothstep(.03, .18, d)) * (1 - lifted * .65) : 0;
    const rippleDetail = smoothstep(.002, .018, d);
    const solarWidth = (.72 + d * 5.2) * (1 + rippleDetail
      * (.16 * Math.sin(d * 147 - time * .21) + .10 * Math.sin(d * 83 + time * .17)));
    const solarDrift = (.14 * Math.sin(d * 29 - time * .18) + .08 * Math.sin(d * 107 + time * .27))
      * smoothstep(0, .12, d) + rippleDetail
      * (.28 * Math.sin(d * 165 - time * .29) + .12 * Math.sin(d * 79 + time * .19));
    // 细波来自不同波长的叠加；相位轻微弯曲，间距和朝向都不再排成等距横线。
    const ripplePhase = 52 * Math.log1p(d * 7.5) - time * .50
      + 1.3 * Math.sin(d * 53 - time * .17) + .6 * Math.sin(d * 119 + time * .23);
    const rippleCrossPhase = d * 487 + time * .38 + .7 * Math.sin(d * 73);
    const rippleTilt = .5 + .8 * Math.sin(d * 71 - time * .20);
    // 四组解析高度波的偏导给出法线；横向尺度补偿海面透视压缩。
    const phaseA = d * 63 - time * .43 + .44 * Math.sin(d * 13);
    const phaseB = d * 107 + time * .27;
    const phaseC = d * 29 - time * .18;
    const phaseD = d * 17 - time * .19;
    const depthWarp = 1 + 5.72 * Math.cos(d * 13) / 63;
    let sinA = Math.sin(phaseA + localStart * .105), cosA = Math.cos(phaseA + localStart * .105);
    let sinB = Math.sin(phaseB - localStart * .21), cosB = Math.cos(phaseB - localStart * .21);
    let sinC = Math.sin(phaseC + localStart * .36), cosC = Math.cos(phaseC + localStart * .36);
    let sinD = Math.sin(phaseD + localStart * .25), cosD = Math.cos(phaseD + localStart * .25);
    const sa = Math.sin(localStep * .105), ca = Math.cos(localStep * .105);
    const sb = Math.sin(-localStep * .21), cb = Math.cos(-localStep * .21);
    const sc = Math.sin(localStep * .36), cc = Math.cos(localStep * .36);
    const sd = Math.sin(localStep * .25), cd = Math.cos(localStep * .25);
    for (let x = 0; x < columns; x++) {
      const localX = localStart + x * localStep;
      const vx = -localX * viewXScale, vi = 1 / Math.sqrt(vx * vx + vY * vY + 1);
      const hx = vx * vi, hy = vY * vi + ly, hz = vi + lz;
      const hi = 1 / Math.sqrt(hx * hx + hy * hy + hz * hz);
      const slopeX = 70 * slopeFilter * (.215 * .105 / 63 * cosA - .068 * .21 / 107 * cosB
        + .038 * .36 / 29 * cosC + .055 * .25 / 17 * cosD);
      const slopeZ = cosA * .215 * depthWarp + cosB * .068 + cosC * .038 + cosD * .055;
      // 半角方向恰好是把太阳反射向观者的法线；斜率偏差决定受光。
      const errorX = (slopeX - hx / hy) / roughX;
      const errorZ = (slopeZ - hz / hy) / roughZ;
      const distribution = Math.exp(-.5 * (errorX * errorX + errorZ * errorZ));
      const fresnel = waterFresnel((ly * hy + lz * hz) * hi);
      const energy = distribution * fresnel * exposure;
      // 先算能量，再映射透明度；没有以透明度推导笔触宽度的步骤。
      // 采样范围外缘留足衰减距离，最后只收去已很弱的远尾，防止矩形截边。
      const viewportFeather = 1 - smoothstep(.70, 1, Math.abs(localX) / (halfWidth / sunR));
      const scattered = 1 - Math.exp(-energy);
      let reflection = scattered;
      if (blueDistance > 0) {
        const solarEdge = 1 - smoothstep(solarWidth * .60, solarWidth * 1.28, Math.abs(localX - solarDrift));
        // 细波留下蓝水缝，避免集中后的亮核变成太阳下面的一块实心梯形。
        const crest = .68 * Math.cos(ripplePhase + localX * rippleTilt
          + .3 * Math.sin(localX * 2.7 + d * 39 - time * .26))
          + .32 * Math.cos(rippleCrossPhase + localX * 1.7);
        const ripple = .14 + .86 * smoothstep(-.65, .75, crest);
        const fineRipples = 1 + (ripple - 1) * smoothstep(.002, .012, d);
        const blueCore = (1 - Math.exp(-energy * 1.45)) * solarEdge * fineRipples;
        reflection += (blueCore - scattered) * blueDistance;
      }
      field.alpha[r * columns + x] = reflection * rowEnergy * viewportFeather;
      let next = sinA * ca + cosA * sa;cosA = cosA * ca - sinA * sa;sinA = next;
      next = sinB * cb + cosB * sb;cosB = cosB * cb - sinB * sb;sinB = next;
      next = sinC * cc + cosC * sc;cosC = cosC * cc - sinC * sc;sinC = next;
      next = sinD * cd + cosD * sd;cosD = cosD * cd - sinD * sd;sinD = next;
    }
  }
  const pixels = field.image.data, pixelWidth = field.canvas.width, pixelHeight = field.canvas.height;
  const xRatio = (columns - 1) / (pixelWidth - 1);
  for (let y = 0; y < pixelHeight; y++) {
    const top = field.rowAt[y] * columns, bottom = top + columns, blend = field.rowMix[y];
    const red = field.color[y * 3], green = field.color[y * 3 + 1], blueChannel = field.color[y * 3 + 2];
    for (let x = 0; x < pixelWidth; x++) {
      const column = x * xRatio, x0 = Math.floor(column), x1 = Math.min(columns - 1, x0 + 1), dx = column - x0;
      const upper = field.alpha[top + x0] + (field.alpha[top + x1] - field.alpha[top + x0]) * dx;
      const lower = field.alpha[bottom + x0] + (field.alpha[bottom + x1] - field.alpha[bottom + x0]) * dx;
      const alpha = Math.max(0, Math.min(1, upper + (lower - upper) * blend));
      const index = (y * pixelWidth + x) * 4;
      pixels[index] = red;pixels[index + 1] = green;pixels[index + 2] = blueChannel;pixels[index + 3] = alpha * 255;
    }
  }
  field.ctx.putImageData(field.image, 0, 0);
  ctx.save();ctx.imageSmoothingEnabled = true;ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(field.canvas, left, horizonY, halfWidth * 2, height - horizonY);
  ctx.restore();
}
function findPickupTime() {
  const deepY = horizonY + sunR * .55;
  const raisedY = horizonY - Math.max(sunR * 1.6, height * .065);
  const contactY = sunY + sunR;
  let low = 18.35, high = 24;
  for (let i = 0; i < 36; i++) {
    const mid = (low + high) / 2;
    const seatY = deepY + (raisedY - deepY) * smoothstep(18.35, 24, mid);
    if (seatY > contactY) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
function flightAt(time) {
  const t = Math.max(0, Math.min(time, SCENE_DURATION));
  const unit = Math.max(5, Math.min(24, sunR * 0.34));
  // 飞机到画框边缘时已经在飞行，进入后再逐渐减速靠近太阳。
  const approachTime = Math.max(0, Math.min(1, (t - 2) / 12.5));
  const approach = 1 - (1 - approachTime) ** 2;
  const depart = smoothstep(32, 58, t);
  const aboard = t >= pickupTime && t < 62;
  const board = aboard ? 1 : 0;
  const deploy = smoothstep(14, 18, t);
  const x = -unit * 1.41 + (sunX + unit * 1.41) * approach
    + (width + sunR * 2.5 - sunX) * depart;

  // 降低巡航高度，登板后先被重量拽下，再恢复并抬头爬升。
  const cruiseY = height * .22;
  const loadTime = 24.5; // 收绳已把太阳带离水面一段，再承受完整重量。
  const impactTime = waterContacts[0]?.time ?? 18;
  const awake = t < 62 ? smoothstep(impactTime, impactTime + .65, t) : 0;
  // 触水后才开始抓绳，手掌和绳线共用握点；空绳不会提前向隐形的手折弯。
  const ropeGrip = awake;
  const eyeOpen = awake * (.65 + .35 * smoothstep(impactTime + .7, impactTime + 1.7, t));
  const tug = smoothstep(loadTime, loadTime + 1.1, t) * (1 - smoothstep(loadTime + 1.1, loadTime + 5.5, t));
  const recovery = Math.sin(Math.max(0, t - (loadTime + 1.1)) * 2.1)
    * Math.exp(-Math.max(0, t - (loadTime + 1.1)) * .85) * smoothstep(loadTime + 1.1, loadTime + 1.7, t);
  const y = cruiseY + height * (.038 * tug + .005 * recovery) - height * .15 * depart;
  const pitch = .065 * tug - .12 * smoothstep(loadTime + 2, loadTime + 6, t) * (1 - smoothstep(52, 58, t));
  const pivotY = y + unit * .65;
  const seatY = horizonY - Math.max(sunR * 1.6, height * .065);
  const fullLength = seatY - (cruiseY + unit * .65);
  const releaseAge = Math.max(0, t - 14);
  const lowering = smoothstep(14, 15, t) * (1 - smoothstep(17, 18, t));
  const payout = Math.sin(releaseAge * 3.2) * sunR * .08 * lowering;
  const stretch = sunR * .08 * tug;
  // 只下探到太阳底部稍下方，座板被海水遮住；停顿 0.35 秒便收绳。
  const deepLength = horizonY + sunR * .55 - (cruiseY + unit * .65);
  const retrieve = smoothstep(18.35, 24, t);
  const length = Math.max(unit * .25,
    deepLength * deploy + (fullLength - deepLength) * retrieve + payout + stretch);
  const releaseSwing = Math.sin(releaseAge * 2.2) * .13 * Math.exp(-releaseAge * .18) * lowering;
  const loadAge = Math.max(0, t - loadTime);
  const loadSwing = Math.sin(loadAge * 1.75) * .055 * Math.exp(-loadAge * .3) * smoothstep(loadTime, loadTime + .5, t);
  const cruisingSwing = Math.sin((t - 32) * .85) * .035 * smoothstep(32, 36, t);
  const angle = releaseSwing + loadSwing + cruisingSwing;
  const emptyMotion = smoothstep(14, 14.7, t) * (1 - smoothstep(17.2, 18.25, t));
  const seatTilt = Math.sin((releaseAge - .22) * 2.6) * SUN_MOTION.emptyTilt
    * Math.exp(-releaseAge * .1) * emptyMotion;
  const ropeSlack = SUN_MOTION.ropeSlack * smoothstep(14, 14.6, t)
    * (1 - smoothstep(16.5, 17.8, t));
  const body = sunDeformationAt(t);
  // 变形围绕座板接触点发生；身体中心上移/下移，底部不会离板。
  const riderX = x - Math.sin(angle) * (length - sunR * body.y);
  const riderY = pivotY + Math.cos(angle) * (length - sunR * body.y);
  const lightX = t >= pickupTime ? riderX : sunX;
  const lightY = t >= pickupTime ? riderY : sunY;
  const light = sunlightAt(lightX, lightY, t);
  const darkness = light.darkness;
  return {t, unit, x, y, pitch, pivotY, length, angle, board, deploy, darkness, strain: tug,
    body, seatTilt, ropeSlack,
    eyeOpen, armOpacity: awake, ropeGrip,
    aboard, visible: t >= 2 && t < 62,
    restOpacity: t < pickupTime ? 1 : 0,
    sunX: lightX, sunY: lightY, light,
    reflection: light.reflection
  };
}
function sunDeformationAt(time) {
  // 下坠、托住、一次回弹，全部从剧情时间求值，拖动不积累弹簧状态。
  const stretch = smoothstep(24.5, 24.95, time) * (1 - smoothstep(24.95, 25.5, time));
  const squash = smoothstep(25.15, 25.6, time) * (1 - smoothstep(25.6, 26.35, time));
  const rebound = smoothstep(26.15, 26.65, time) * (1 - smoothstep(26.65, 27.6, time));
  const y = 1 + SUN_MOTION.strength * (SUN_MOTION.stretch * stretch
    - SUN_MOTION.squash * squash + SUN_MOTION.rebound * rebound);
  return {x: 1 / y, y};
}
function sunlightAt(x, y, time) {
  const elevation = Math.max(0, (sunY - y) / height);
  const travel = Math.hypot((x - sunX) / (width * .56),
    Math.max(0, elevation - .16) / .65);
  const drift = smoothstep(.12, .98, travel);
  const leavingFrame = smoothstep(width - sunR, width + sunR, x);
  const exit = sceneTimeForAction(sunExitTime);
  const afterglow = smoothstep(exit, exit + AFTERGLOW_SECONDS, sceneTimeForAction(time));
  // 离框只消退少量直射光；天空与海面还有八秒余晖，不在边缘突然切到黑夜。
  const darkness = .2 * drift + .8 * (.22 * leavingFrame + .78 * afterglow);
  return {darkness, elevation,
    reflection: (1 - darkness) * (1 - .35 * smoothstep(.12, .4, elevation))};
}
function sceneTimeForAction(time) {
  const portrait = document.body.dataset.aspect === '3:4';
  const arrival = portrait ? 6.5 : 14.5;
  if (time <= 2) return time * .5 / 2;
  if (time <= 14.5) return .5 + (time - 2) * (arrival - .5) / 12.5;
  if (!portrait) return time;
  if (time <= 32) return time - 8;
  if (time <= 58) return 24 + (time - 32) / 2;
  return time - 21;
}
function sunRasterMetrics() {
  const screenRatio = Math.max(1, window.devicePixelRatio || 1);
  const density = Math.max(1, (typeof pixelDensity === 'function' && pixelDensity())
    || Math.min(screenRatio, 2));
  const surface = typeof drawingContext !== 'undefined' ? drawingContext.canvas : null;
  const rect = surface && typeof surface.getBoundingClientRect === 'function'
    ? surface.getBoundingClientRect() : null;
  const displayScale = rect && rect.width > 0 && width > 0 ? rect.width / width : 1;
  const sampling = density * 4;
  // 和金叶化蝶的月亮一致：透明过渡按最终屏幕物理像素计算。
  const edge = 1.2 / (sunR * displayScale * screenRatio);
  const padding = Math.max(sunR * .065, 3 / density, sunR * edge);
  const size = Math.ceil((sunR + padding) * sampling) * 2;
  const extent = size / (2 * sampling * sunR);
  return {radius: sunR, density, screenRatio, displayScale, sampling, edge, size, extent,
    key: [sceneStyle, sunR, density, screenRatio, displayScale].join(':')};
}
function makeSunBrush() {
  const metrics = sunRasterMetrics();
  const {size, extent, edge} = metrics;
  const canvas = document.createElement('canvas');canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), image = ctx.createImageData(size, size);
  const pixels = image.data, blue = sceneStyle === 'blue';
  const stops = palette.sun.map(([at, hex]) => [at,
    [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16))]);
  const haloRGB = [255, 112, 47], edgeRGB = [255, 133, 47];
  // 颜色和圆周覆盖率一次合成，绘制时只缩放这张圆盘，避免二次裁剪的硬边。
  for (let y = 0; y < size; y++) {
    const ny = ((y + .5) / size * 2 - 1) * extent;
    const position = Math.max(0, Math.min(1, (ny + 1) / (blue ? 2 : 1.76)));
    let next = 1;
    while (next < stops.length - 1 && position > stops[next][0]) next++;
    const [a, rgbA] = stops[next - 1], [b, rgbB] = stops[next];
    const mix = (position - a) / (b - a);
    const rowRGB = rgbA.map((value, i) => value + (rgbB[i] - value) * mix);
    for (let x = 0; x < size; x++) {
      const nx = ((x + .5) / size * 2 - 1) * extent, radial = Math.hypot(nx, ny);
      const coverage = smoothstep(0, 1, (1 - radial) / edge + .5);
      const haloPosition = Math.max(0, Math.min(1, (radial - .985) / .08));
      const halo = blue ? haloPosition < .35
        ? .12 + (.045 - .12) * haloPosition / .35
        : .045 * (1 - (haloPosition - .35) / .65) : 0;
      const alpha = coverage + halo * (1 - coverage);
      if (alpha <= 0) continue;
      const rimPosition = Math.max(0, Math.min(1, (radial - .68) / .32));
      const rim = blue ? rimPosition < .75 ? .025 * rimPosition / .75
        : .025 + (.09 - .025) * (rimPosition - .75) / .25 : 0;
      const offset = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        const color = rowRGB[c] + (edgeRGB[c] - rowRGB[c]) * rim;
        pixels[offset + c] = (color * coverage + haloRGB[c] * halo * (1 - coverage)) / alpha;
      }
      pixels[offset + 3] = alpha * 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return {canvas, ...metrics};
}
function drawSun(ctx, x, y, opacity, behindHorizon = false, eyeOpen = 0, body = {x: 1, y: 1}) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  if (behindHorizon) {
    ctx.beginPath(); ctx.rect(0, 0, width, horizonY); ctx.clip();
  }
  const reach = sunR * sunBrush.extent;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sunBrush.canvas, x - reach * body.x, y - reach * body.y,
    reach * 2 * body.x, reach * 2 * body.y);
  // 入水时逐渐睁眼，此后保持平静的圆眼睛。
  if (eyeOpen > 0) {
    ctx.fillStyle = '#151515';
    const radius = Math.max(1.25, sunR * .085);
    for (const eyeX of [-.48, .18]) {
      ctx.beginPath();
      ctx.ellipse(x + eyeX * sunR * body.x, y - sunR * .24 * body.y,
        radius, radius * eyeOpen, 0, 0, Math.PI * 2);
      ctx.fill();
    }

  }
  ctx.restore();
}
 const next=seededRandom(860214),waterRows=Array.from({length:72},(_,i)=>({depth:Math.pow((i+.15+next()*.7)/72,1.7),phase:next()*Math.PI*2,weight:.65+next()*.7})),pickupTime=findPickupTime();
 function paintSea(ctx,time){
  const story=flightAt(time);ctx.clearRect(0,0,900,1200);
  const sky=ctx.createLinearGradient(0,0,0,horizonY);for(const [at,color] of palette.sky)sky.addColorStop(at,color);ctx.fillStyle=sky;ctx.fillRect(0,0,width,horizonY);
  const sea=ctx.createLinearGradient(0,horizonY,0,height);for(const [at,color] of palette.sea)sea.addColorStop(at,color);ctx.fillStyle=sea;ctx.fillRect(0,horizonY,width,height-horizonY);
  sunBrush??=makeSunBrush();drawSun(ctx,story.sunX,story.sunY,1,true,0,story.body);
  ctx.save();ctx.beginPath();ctx.rect(0,horizonY,width,height-horizonY);ctx.clip();
  const scale=Math.max(.55,Math.min(1.5,height/900));
  for(const row of waterRows){const d=row.depth,cell=Math.max(6,width/65)*(.6+d*1.5),thickness=(.45+Math.pow(d,1.2)*3.4)*scale*row.weight;let left=waveAt(0,row,time,scale);
   for(let x=0;x<width;){const end=Math.min(width,x+cell),right=waveAt(end,row,time,scale),facing=(left.facing+right.facing)*.5,patch=(left.patch+right.patch)*.5;
    waterFacet(ctx,x,left.y+thickness*.45,end,right.y+thickness*.45,thickness,rgba(...palette.trough,(.025+d*.055)*(.75-facing*.25)*(.2+.8*patch)*palette.waveContrast));
    waterFacet(ctx,x,left.y,end,right.y,thickness*.36,rgba(...palette.ambient,(.015+Math.max(0,facing)*.05)*patch*palette.waveContrast));left=right;x=end;
   }
  }
  drawWaterReflection(ctx,story,time);ctx.restore();return story;
 }
 F['sunset-water-reflection']=(root,K,def)=>{
  root.innerHTML='<canvas class="pattern-canvas" width="900" height="506" aria-hidden="true"></canvas>';
  const canvas=root.firstElementChild,ctx=canvas.getContext('2d');if(!ctx)return ()=>{};let last=-1;
  const render=ms=>{const time=12+Math.min(def.duration_ms,Math.max(0,ms))/1000*1.5;if(last===time)return;last=time;
   ctx.save();ctx.translate(0,-694);const story=paintSea(ctx,time);ctx.restore();canvas.dataset.elevation=String(story.light.elevation);canvas.dataset.sunX=String(story.sunX);canvas.dataset.sourceTime=String(time);
  };render.frameRate=30;return render;
 };
 F['sunset-sun-illustration']=(root,K,def)=>{
  root.innerHTML='<canvas class="pattern-canvas" width="640" height="360" aria-hidden="true"></canvas>';
  const canvas=root.firstElementChild,density=Math.min(4,Math.max(1,global.devicePixelRatio||1));canvas.width=640*density;canvas.height=360*density;
  const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};ctx.setTransform(density,0,0,density,0,0);sunBrush??=makeSunBrush();ctx.clearRect(0,0,640,360);ctx.save();ctx.translate(320,162);ctx.scale(2.2,2.2);drawSun(ctx,0,0,1);ctx.restore();return ()=>{};
 };
})();
})(globalThis);
