// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment,data} from './helpers.mjs';

const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/reel.js','utf8');
const shared={window:{}};runInNewContext(await readFile('/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/shared.js','utf8'),shared);
const implementation=await readFile(new URL('../catalog/effects/reel-flat-gen.js',import.meta.url),'utf8');
const math=source.slice(source.indexOf('const clamp ='),source.indexOf('function bez1('));
const flat=source.slice(source.indexOf('const PAL ='),source.indexOf('/* ============================================================\n   SCENE 6'));
const gen=source.slice(source.indexOf('const NP ='),source.indexOf('/* ============================================================\n   SCENE 7'));
const numbers=s=>(s.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
const near=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const defs={
 'tile-round-wave':[4000,1200],'material-phone-rise':[1600,1200],'material-card-stagger':[3500,1500],
 'material-switch-spring':[1000,650],'material-spinner-arc':[3000,1100],'material-like-pop':[1500,650],
 'material-fab-panel':[3200,2500],'material-phone-sequence':[5000,2700],
 'generative-point-morph':[8000,3650],'generative-flow-field':[8000,2200],'code-line-sequence':[3500,3000],'generative-point-sequence':[8000,3650]
};
const definition=id=>data.effects.find(e=>e.id===id)||{id,duration_ms:defs[id][0],preview_ms:defs[id][1],loop:false,default_ease:'linear',parameters:{}};
async function setup(){const env=await environment();env.w.eval(implementation);return env;}
function original(scene,t){
 const fills=[],strokes=[],rects=[],transforms=[],stack=[];let path=[];
 const ctx={globalAlpha:1,globalCompositeOperation:'source-over',save(){stack.push({fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,globalAlpha:this.globalAlpha,lineWidth:this.lineWidth,globalCompositeOperation:this.globalCompositeOperation});},restore(){Object.assign(this,stack.pop());},
  beginPath(){path=[];},roundRect(...v){path.push(['roundRect',...v]);},arc(...v){path.push(['arc',...v]);},moveTo(...v){path.push(['M',...v]);},lineTo(...v){path.push(['L',...v]);},bezierCurveTo(...v){path.push(['C',...v]);},
  fill(){fills.push({path:[...path],fill:this.fillStyle,alpha:this.globalAlpha});},stroke(){strokes.push({path:[...path],stroke:this.strokeStyle,width:this.lineWidth,alpha:this.globalAlpha});},
  fillRect(...v){rects.push({v,fill:this.fillStyle,alpha:this.globalAlpha,operation:this.globalCompositeOperation});},
  clip(){},translate(...v){transforms.push(['translate',...v]);},rotate(...v){transforms.push(['rotate',...v]);},scale(...v){transforms.push(['scale',...v]);},strokeText(){},fillText(){},setLineDash(){},rect(...v){path.push(['rect',...v]);},strokeRect(){}
 };
 const sandbox={ctx,W:1920,H:1080,VERT:false,TAU:Math.PI*2,S:shared.window.SHARED,F:{avenir:'Avenir',mono:'Menlo'},txt(){},revealChars(){},setFont(){},typeOn(){}};
 runInNewContext(math+(scene==='flat'?flat:gen)+`;globalThis.draw=${scene==='flat'?'sFlat':'sGen'};`,sandbox);
 sandbox.draw(t,(scene==='flat'?30:38)+t);return {fills,strokes,rects,transforms};
}

test('方圆阵列保留原 91 格的径向错峰、圆角、颜色和旋转',async()=>{
 const env=await setup();try{const root=env.w.document.getElementById('root'),player=env.w.MotionRuntime.create(root,definition('tile-round-wave'));
  assert.equal(root.querySelectorAll('[data-tile]').length,91);
  for(const t of [.17,.56,1.35,2.74,3.2]){
   player.seek(t*1000);const ref=original('flat',t),tiles=ref.fills.filter(f=>f.path[0]?.[0]==='roundRect'&&f.path[0][1]<0),actual=[...root.querySelectorAll('[data-tile]')].filter(n=>+n.getAttribute('width')>0);
   assert.equal(actual.length,tiles.length);
   actual.forEach((n,i)=>{const path=tiles[i].path[0];['x','y','width','height','rx'].forEach((k,j)=>near(+n.getAttribute(k),path[j+1]));assert.equal(n.getAttribute('fill'),tiles[i].fill);const tr=numbers(n.getAttribute('transform'));near(tr[0],ref.transforms[i*2][1]);near(tr[1],ref.transforms[i*2][2]);near(tr[2]*Math.PI/180,ref.transforms[i*2+1][1]);});
  }
  player.seek(4000);assert.ok([...root.querySelectorAll('[data-tile]')].every(n=>+n.getAttribute('width')===0));
 }finally{env.close();}
});

test('手机机身、卡片入场和开关心形遵循原 UI 几何与时钟',async()=>{
 const env=await setup();try{const root=env.w.document.getElementById('root'),player=env.w.MotionRuntime.create(root,definition('material-phone-sequence')),q=p=>root.querySelector(`[data-part="${p}"]`);
  for(const t of [3,3.3,3.77,3.8,3.98,4.05,4.13,4.4,4.82,4.95,5.07,5.15,5.53,5.75,6.3]){
   player.seek((t-3)*1000);const ref=original('flat',t),cards=ref.fills.filter(f=>f.path[0]?.[0]==='roundRect'&&f.path[0][3]===340&&f.path[0][4]===130);
   const actual=[...root.querySelectorAll('[data-card-frame]')].filter(n=>+n.querySelector('rect').getAttribute('fill-opacity')>0);
   assert.equal(actual.length,cards.length);
   actual.forEach((n,i)=>{const rect=n.querySelector('rect'),p=cards[i].path[0],dy=numbers(n.getAttribute('transform'))[1];near(+rect.getAttribute('x'),p[1]);near(+rect.getAttribute('y')+dy,p[2]);near(+rect.getAttribute('width'),p[3]);near(+rect.getAttribute('height'),p[4]);near(+rect.getAttribute('rx'),p[5]);near(+rect.getAttribute('fill-opacity'),cards[i].alpha);near(+rect.getAttribute('stroke-opacity'),cards[i].alpha);assert.equal(n.getAttribute('opacity'),null);assert.equal(rect.getAttribute('opacity'),null);});
   const phone=root.querySelector('[data-phone-rig]'),actualTransform=numbers(phone.getAttribute('transform'));
   const phoneIndex=ref.transforms.findIndex(v=>v[0]==='translate'&&v[1]===1340);
   if(phoneIndex>=0){const tr=ref.transforms[phoneIndex];near(actualTransform[0],tr[1]);near(actualTransform[1],tr[2]);near(actualTransform[2]*Math.PI/180,ref.transforms[phoneIndex+1][1]);}
   const track=ref.fills.find(f=>f.path[0]?.[0]==='roundRect'&&f.path[0][3]===66&&f.path[0][4]===34);
   if(track){assert.equal(q('switch-track').getAttribute('fill'),track.fill);near(+q('switch-track').getAttribute('fill-opacity'),track.alpha);const knob=ref.fills.find(f=>f.path[0]?.[0]==='arc'&&f.path[0][3]===13);near(+q('switch-knob').getAttribute('cx'),knob.path[0][1]);near(+q('switch-knob').getAttribute('fill-opacity'),knob.alpha);}
   const spinner=ref.strokes.find(s=>s.stroke==='#ffc93c'&&s.width===6);if(spinner)near(+q('spinner-arc').getAttribute('stroke-opacity'),spinner.alpha);
   const heart=ref.fills.find(f=>f.path.length===3&&f.path[0][0]==='M'&&f.path[1][0]==='C');
   if(heart){assert.equal(q('like-heart').getAttribute('fill'),heart.fill);near(+q('like-heart').getAttribute('fill-opacity'),heart.alpha);const htr=ref.transforms.findIndex(v=>v[0]==='scale');near(numbers(q('like-heart').getAttribute('transform'))[2],ref.transforms[htr][1]);}
  }
  for(const clip of root.querySelectorAll('clipPath'))assert.ok([...clip.children].every(n=>n.localName==='rect'));
 }finally{env.close();}
});

test('圆钮的同源形变、裁剪、加号退场及对勾两段描绘不丢失',async()=>{
 const env=await setup();try{const root=env.w.document.getElementById('root'),player=env.w.MotionRuntime.create(root,definition('material-fab-panel')),q=p=>root.querySelector(`[data-part="${p}"]`);
  for(const t of [5.02,5.2,5.4,5.9,6.1,6.2,6.3,6.6,6.7,6.9,7.1]){
   player.seek((t-4.8)*1000);const ref=original('flat',t),panel=ref.fills.filter(f=>f.fill==='#ff6b4a'&&f.path[0]?.[0]==='roundRect').at(-1).path[0];
   ['x','y','width','height','rx'].forEach((k,i)=>near(+q('fab-panel').getAttribute(k),panel[i+1]));
   const check=ref.strokes.find(s=>s.stroke==='#fff'&&s.width===12);
   if(check){const values=check.path.flatMap(v=>v.slice(1));numbers(q('fab-check').getAttribute('d')).forEach((v,i)=>near(v,values[i]));}
   const plus=ref.rects.filter(r=>r.fill==='#fff'&&((r.v[2]===24&&r.v[3]===4)||(r.v[2]===4&&r.v[3]===24)));
   [...q('fab-plus').children].forEach((n,i)=>near(+n.getAttribute('fill-opacity'),plus[i]?.alpha??0));
  }
  assert.equal(q('fab-panel').getAttribute('width'),'376');near(+q('fab-panel').getAttribute('y'),152+776*.4);
  assert.equal(q('fab-plus').getAttribute('opacity'),null);assert.ok([...q('fab-plus').children].every(n=>n.getAttribute('fill-opacity')==='0'));assert.equal(q('fab-label').getAttribute('opacity'),'1');assert.equal(q('fab-label').textContent,'Published');
 }finally{env.close();}
});

test('卡片内层叠填色与加号交点分别累积透明度，不被整组淡化或重复相乘',async()=>{
 const env=await setup();try{const root=env.w.document.getElementById('root'),player=env.w.MotionRuntime.create(root,definition('material-phone-sequence'));
  const rgb=hex=>(hex.length===4?hex.slice(1).split('').map(c=>c+c):hex.slice(1).match(/../g)).map(c=>parseInt(c,16));
  const over=(bg,fill,alpha)=>rgb(fill).map((c,i)=>c*alpha+bg[i]*(1-alpha));
  player.seek(770);const ref=original('flat',3.77),frame=root.querySelector('[data-card-frame="0"]'),widget=root.querySelector('[data-card-widget="0"]');
  const sourceLayers=[ref.fills.find(f=>f.path[0]?.[0]==='roundRect'&&f.path[0][3]===340&&f.path[0][4]===130),ref.fills.find(f=>f.path[0]?.[0]==='roundRect'&&f.path[0][3]===66&&f.path[0][4]===34),ref.fills.find(f=>f.path[0]?.[0]==='arc'&&f.path[0][3]===13)];
  const layers=[frame.querySelector('rect'),widget.querySelector('rect'),widget.querySelector('circle')];
  for(const group of [frame,widget]){assert.equal(group.getAttribute('opacity'),null);assert.ok(group.hasAttribute('transform'));for(const shape of group.querySelectorAll('rect,circle,path'))assert.equal(shape.getAttribute('opacity'),null);}
  layers.forEach((n,i)=>near(+n.getAttribute('fill-opacity'),sourceLayers[i].alpha));
  const expected=sourceLayers.reduce((bg,layer)=>over(bg,layer.fill,layer.alpha),rgb('#faf8f4'));
  const actual=layers.reduce((bg,n)=>over(bg,n.getAttribute('fill'),+n.getAttribute('fill-opacity')),rgb('#faf8f4'));
  actual.forEach((v,i)=>near(v,expected[i]));
  const flattened=over(over(rgb('#faf8f4'),'#fff',sourceLayers[0].alpha),'#fff',sourceLayers[1].alpha);
  assert.ok(flattened[2]-actual[2]>10,'白色圆钮应透出轨道颜色，不能先将轨道与圆钮合并再淡化');
  for(const t of [3.9,4.02,4.14]){player.seek((t-3)*1000);const frames=root.querySelectorAll('[data-card-frame]');frames.forEach(n=>{const alpha=+n.querySelector('rect').getAttribute('fill-opacity');for(const shape of n.querySelectorAll('rect,circle')){near(+shape.getAttribute('fill-opacity'),alpha);if(shape.hasAttribute('stroke'))near(+shape.getAttribute('stroke-opacity'),alpha);}});}
  player.seek(3200);const plus=root.querySelector('[data-part="fab-plus"]'),rects=[...plus.children],originalPlus=original('flat',6.2).rects.filter(r=>r.fill==='#fff'&&((r.v[2]===24&&r.v[3]===4)||(r.v[2]===4&&r.v[3]===24)));
  assert.equal(plus.getAttribute('opacity'),null);assert.equal(rects.length,2);assert.equal(originalPlus.length,2);
  rects.forEach((n,i)=>{assert.equal(n.getAttribute('opacity'),null);near(+n.getAttribute('fill-opacity'),originalPlus[i].alpha);});
  const overlap=1-rects.reduce((remaining,n)=>remaining*(1-+n.getAttribute('fill-opacity')),1),expectedOverlap=1-originalPlus.reduce((remaining,r)=>remaining*(1-r.alpha),1);
  near(overlap,expectedOverlap);assert.ok(overlap-originalPlus[0].alpha>.24,'加号交点应由两笔半透明白色叠加，比单笔更亮');
  const snapshot=root.innerHTML;player.seek(0);player.seek(3200);assert.equal(root.innerHTML,snapshot);
  const observer=new env.w.MutationObserver(()=>{});observer.observe(root,{attributes:true,subtree:true,childList:true});player.seek(3200);assert.equal(observer.takeRecords().length,0);observer.disconnect();
 }finally{env.close();}
});

test('2400 点三态投影与原片一致，保留颜色、透明度、近大远小和节拍',async()=>{
 const env=await setup();try{const root=env.w.document.getElementById('root'),player=env.w.MotionRuntime.create(root,definition('generative-point-morph'));
  assert.equal(root.querySelectorAll('[data-point]').length,2400);assert.equal(root.querySelector('canvas'),null);
  for(const t of [.3,1.5,2.5,3.4,5.1,6.7,8]){
   player.seek(t*1000);const ref=original('gen',t).rects.filter(r=>r.operation==='lighter'),nodes=root.querySelectorAll('[data-point]');assert.equal(ref.length,2400);
   for(let i=0;i<2400;i+=37){const n=nodes[i],r=ref[(i%5)*480+Math.floor(i/5)];['x','y','width','height'].forEach((key,k)=>near(+n.getAttribute(key),r.v[k]));near(+n.getAttribute('opacity'),r.alpha);assert.equal(n.getAttribute('fill'),r.fill);}
   const widths=[...nodes].map(n=>+n.getAttribute('width'));assert.ok(Math.max(...widths)>Math.min(...widths),'透视远近应改变点大小');
  }
  const snapshot=root.innerHTML;player.seek(0);player.seek(8000);assert.equal(root.innerHTML,snapshot);
  const observer=new env.w.MutationObserver(()=>{});observer.observe(root,{attributes:true,subtree:true,childList:true});player.seek(8000);assert.equal(observer.takeRecords().length,0);observer.disconnect();
 }finally{env.close();}
});

test('有画布时一次创建并按原顺序加色绘制，静态缩略图保留像素且不用 2400 个 DOM 节点',async()=>{
 const env=await setup();try{const records=[];let clear=0;const ctx={clearRect(){clear++;records.length=0;},fillRect(...v){records.push({v,fill:this.fillStyle,alpha:this.globalAlpha,operation:this.globalCompositeOperation});}};
  env.w.HTMLCanvasElement.prototype.getContext=()=>ctx;const root=env.w.document.getElementById('root'),player=env.w.MotionRuntime.create(root,definition('generative-point-morph'));player.seek(3650);
  assert.equal(root.querySelectorAll('[data-point]').length,0);assert.ok(root.querySelector('canvas'));assert.equal(records.length,2400);assert.ok(root.querySelector('[data-point-canvas]').getAttribute('style').includes('plus-lighter'));
  const ref=original('gen',3.65).rects.filter(r=>r.operation==='lighter');for(let i=0;i<2400;i+=71){records[i].v.forEach((v,k)=>near(v,ref[i].v[k]));near(records[i].alpha,ref[i].alpha);assert.equal(records[i].fill,ref[i].fill);assert.equal(records[i].operation,'lighter');}
  const calls=clear;player.seek(3650);assert.equal(clear,calls);player.destroy(true);assert.equal(root.querySelector('canvas').width,1920);assert.equal(root.querySelector('canvas').height,1080);
  const other=env.w.document.createElement('div'),next=env.w.MotionRuntime.create(other,definition('generative-point-morph')),canvas=other.querySelector('canvas');next.destroy();assert.equal(canvas.width,1);assert.equal(canvas.height,1);
  assert.equal(env.w.MotionRuntime.instanceCount,0);
 }finally{env.close();}
});

test('220 条噪声流线坐标对应原绘制，四行代码按原字速接续而不增加窗口或光标',async()=>{
 const env=await setup();try{const root=env.w.document.getElementById('root'),field=env.w.MotionRuntime.create(root,definition('generative-flow-field'));
  for(const t of [0,.7,2.2,5.2]){field.seek(t*1000);const p=root.querySelector('[data-part="field-lines"]'),actual=numbers(p.getAttribute('d')),ref=original('gen',t).strokes[0].path.flatMap(v=>v.slice(1));assert.equal((p.getAttribute('d').match(/M/g)||[]).length,220);assert.equal(actual.length,220*11*2);actual.forEach((v,i)=>near(v,ref[i]));}
  field.destroy();const code=env.w.MotionRuntime.create(root,definition('code-line-sequence')),lines=['const t = ease(time);','p = mix(sphere, torus, t);','camera.orbit(0.55 * time);',"render(points, 'additive');"];
  for(const elapsed of [0,200,350,950,1500,2400,3100]){code.seek(elapsed);const t=elapsed/1000+1.4;let start=1.6;lines.forEach((l,i)=>{const shown=l.slice(0,Math.max(0,Math.min(l.length,Math.floor((t-start)*38))));assert.equal(root.querySelector(`[data-code-line="${i}"]`).textContent,shown);start+=l.length/38+.1;});}
  assert.equal(root.querySelectorAll('text').length,8);assert.ok([...root.querySelectorAll('text')].every(n=>n.getAttribute('font-family')==='Oswald,sans-serif'&&n.getAttribute('font-weight')==='700'));
 }finally{env.close();}
});

test('组合与独立动作复用实际图形，来源时钟只平移且控件不增加计时器',async()=>{
 const env=await setup();try{const w=env.w,d=w.document,root=d.getElementById('root'),whole=w.MotionRuntime.create(root,definition('material-phone-sequence'));
  for(const [id,part,start] of [['material-switch-spring','switch-knob',4.6],['material-spinner-arc','spinner-arc',4.1],['material-like-pop','like-heart',5.3],['material-fab-panel','fab-panel',4.8]]){
   const host=d.createElement('div'),single=w.MotionRuntime.create(host,definition(id));for(const ms of [0,190,400,700]){single.seek(ms);whole.seek((start-3)*1000+ms);const standalone=host.querySelector(`[data-part="${part}"]`).cloneNode(true),combined=root.querySelector(`[data-part="${part}"]`).cloneNode(true);if(part==='spinner-arc'){assert.equal(standalone.getAttribute('stroke-opacity'),'1');standalone.removeAttribute('stroke-opacity');combined.removeAttribute('stroke-opacity');}assert.equal(standalone.outerHTML,combined.outerHTML);}single.destroy();
  }
  assert.deepEqual(Array.from(w.MotionFactories['material-phone-sequence'].breakdown,x=>x.id),['phone','cards','switch','spinner','like','fab']);whole.destroy();
  const genRoot=d.createElement('div'),genWhole=w.MotionRuntime.create(genRoot,definition('generative-point-sequence'));
  for(const [id,layer,offset] of [['generative-point-morph','points',0],['generative-flow-field','field',0],['code-line-sequence','code',1.4]]){
   const host=d.createElement('div'),single=w.MotionRuntime.create(host,definition(id));single.seek(1500);genWhole.seek(1500+offset*1000);assert.equal(host.querySelector(`[data-layer="${layer}"]`).outerHTML,genRoot.querySelector(`[data-layer="${layer}"]`).outerHTML);single.destroy();
  }
  const broken=d.createElement('div');for(const id of Object.keys(defs)){const p=w.MotionRuntime.create(broken,definition(id));p.seek(definition(id).preview_ms);assert.ok(broken.querySelector('svg'));assert.ok(!/NaN|Infinity/.test(broken.innerHTML));p.destroy();}
  genWhole.destroy();assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);assert.doesNotMatch(implementation,/requestAnimationFrame|setTimeout|setInterval|Math\.random/);
 }finally{env.close();}
});
