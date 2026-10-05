// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {environment, data} from './helpers.mjs';

const source=new URL('../../../../scenes/Rasengan/physics/hill-bubble-video/',import.meta.url);
const ids=data.effects.filter(e=>e.kind==='illustration'&&e.source.path.endsWith('rasengan-illustrations.js')).map(e=>e.id);
let original;
async function oracle(){
  if(original)return original;
  const names=['choreography.ts','preview-timing.json','light.ts','spiral.ts','galaxy.ts','mushroom.ts','NaturalOrigins.tsx','StoryEffects.tsx'];
  const files=Object.fromEntries(await Promise.all(names.map(async n=>[n,await readFile(new URL('src/rasengan/'+n,source),'utf8')])));
  const js=s=>stripTypeScriptTypes(s.replace(/^import .*;\s*$/gm,'').replace(/\bexport\s+/g,''),{mode:'transform'});
  const wrap=(s,names,prefix='')=>`(()=>{${prefix}\n${js(s)}\nreturn {${names}};})()`;
  const context=vm.createContext({});
  const natural=files['NaturalOrigins.tsx'],effects=files['StoryEffects.tsx'],light=files['light.ts'];
  vm.runInContext(`
    var C=${wrap(files['choreography.ts'],'smooth,finale,lightningDensity',`const playbackAnchors=${JSON.stringify(JSON.parse(files['preview-timing.json']).anchors)};`)};
    var camera=${wrap(light.slice(light.indexOf('export const rotate'),light.indexOf('const renderers')),'project')};
    var material=${wrap(light.slice(light.indexOf('const mix=')),'drawFiber,drawSpark')};
    var S=${wrap(files['spiral.ts'],'spiralPoint,armCount,conversionAt','const {smooth}=C;const lerp=(a,b,t)=>a+(b-a)*smooth(t);')};
    var G=${wrap(files['galaxy.ts'],'galaxyStars,galaxyPosition','const {smooth}=C;const {spiralPoint,armCount,conversionAt}=S;')};
    var Cloud=${wrap(files['mushroom.ts'],'cloudHeadPoint','const {smooth}=C;')};
    var smoke=${wrap(natural.slice(natural.indexOf('let seed='),natural.indexOf('// Ring tracers')),'smoke','const tau=Math.PI*2;const {smooth}=C;')}.smoke;
    var dots=${wrap(effects.slice(effects.indexOf('let seed='),effects.indexOf('// Buoyant-plume')),'dots')}.dots;
    var electric=${wrap(effects.slice(effects.indexOf('function electricTrace'),effects.indexOf('// Artistic overlay')),'electricTrace','const {smooth}=C;')}.electricTrace;
  `,context);
  return original=context;
}
const moves=(root,prefix)=>[...root.querySelectorAll(`[data-part^="${prefix}-"]`)].flatMap(path=>
  [...path.getAttribute('d').matchAll(/M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1],+m[2]]));
const vertices=root=>[...root.querySelectorAll('path')].flatMap(path=>
  [...path.getAttribute('d').matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1],+m[2]]));
function contains(points,p,tolerance=.001){const distance=Math.min(...points.map(q=>Math.hypot(q[0]-p[0],q[1]-p[1])));assert.ok(distance<=tolerance,'未保留原图形坐标 '+p.slice(0,2).join(',')+'，偏差 '+distance);}
const def=id=>data.effects.find(e=>e.id===id);
const camera=(pitch,yaw,size,roll=0)=>({pitch,yaw,size,roll,centerY:900});
async function fields(){
  const [classic,driven,metadata]=await Promise.all(['classic.bin','driven.bin','metadata.json'].map(n=>readFile(new URL('public/data/rasengan/'+n,source))));
  const {hz,count,steps}=JSON.parse(metadata);
  return (mode,i,time,quantized=false)=>{
    const bytes=mode==='classic'?classic:driven,f=Math.max(0,Math.min(steps-1,time*hz)),lo=Math.floor(f),hi=Math.min(steps-1,lo+1),mix=f-lo;
    return [0,1,2].map(k=>{let a=bytes.readFloatLE((lo*count*3+i*3+k)*4),b=bytes.readFloatLE((hi*count*3+i*3+k)*4);if(quantized){a=Math.round(a*32767)/32767;b=Math.round(b*32767)/32767;}return a+(b-a)*mix;});
  };
}

test('烟圈、涡环和台风保留原粒子身份、剖面翻卷与六臂几何',async()=>{
  const O=await oracle(),env=await environment();
  try{
    const root=env.w.document.getElementById('root');
    let player=env.w.MotionRuntime.create(root,def('smoke-ring-illustration'));
    for(const t of [1000,2000]){
      player.seek(t);const dots=moves(root,'point');assert.equal(dots.length,2240);
      for(const i of [0,31,400,713,1501,2239]){
        const s=O.smoke[i],theta=s.theta+(4+t/1000)*(1.05+.16*(1-s.r)),cross=.115*s.r,r=.66-cross*Math.cos(theta);
        contains(dots,O.camera.project([r*Math.cos(s.phi),cross*Math.sin(theta),r*Math.sin(s.phi)],camera(.78,.12,465)));
      }
    }
    player.destroy();player=env.w.MotionRuntime.create(root,def('vortex-ring-illustration'));player.seek(1000);
    const ring=vertices(root);
    for(const phi of [0,Math.PI*7/8,Math.PI])for(const theta of [0,Math.PI*2*22/90,Math.PI]){
      const r=.66-.27*Math.cos(theta);
      contains(ring,O.camera.project([r*Math.cos(phi),.27*Math.sin(theta),r*Math.sin(phi)],camera(.78,.12,465)));
    }
    player.destroy();player=env.w.MotionRuntime.create(root,def('cyclone-illustration'));player.seek(1000);
    const spiral=vertices(root);
    for(let arm=0;arm<6;arm++)for(const u of [0,.5,1])contains(spiral,O.camera.project(O.S.spiralPoint(arm,u,8),camera(1.12,.4,432)));
    player.destroy();
  }finally{env.close();}
});

test('球涡、云头与螺旋丸沿原冻结轨迹运动，电弧保留原分叉',async()=>{
  const O=await oracle(),at=await fields(),env=await environment();
  try{
    const root=env.w.document.getElementById('root');
    let player=env.w.MotionRuntime.create(root,def('hill-vortex-illustration'));
    for(const t of [1000,2000]){
      player.seek(t);const dots=moves(root,'point');assert.equal(dots.length,64);
      for(const n of [0,1,12,63])contains(dots,O.camera.project(at('classic',n*137%384,5+t/1000*.3),camera(0,.4,432)),.025);
    }
    player.destroy();player=env.w.MotionRuntime.create(root,def('mushroom-cloud-illustration'));player.seek(1000);
    const cloud=moves(root,'point');assert.ok(cloud.length>=6500&&cloud.length<=7400);
    for(const n of [0,12,383,411,1784,6499]){
      const d=O.dots[n],time=2.4,phase=n<384?0:d.v*8;
      contains(cloud,O.camera.project(O.Cloud.cloudHeadPoint(at('classic',n*137%384,5+(time-3)*.3+phase),time,d.r),camera(.12,.4,390)),.025);
    }
    player.destroy();player=env.w.MotionRuntime.create(root,def('rasengan-illustration'));player.seek(1000);
    const pose={...O.C.finale(19),centerY:900},sphere=moves(root,'point');assert.equal(sphere.length,384);
    for(const n of [0,1,17,151,383])contains(sphere,O.camera.project(at('driven',n*137%384,pose.time),pose),.025);
    assert.equal(root.querySelector('[data-part="art"]').lastElementChild.dataset.part.split('-')[0],'core','窄亮芯必须画在线身之上');
    player.destroy();player=env.w.MotionRuntime.create(root,def('lightning-orb-illustration'));player.seek(1000);
    const arcs=moves(root,'discharge'),clock=6,n=0,index=0,length=pose.trail*.8,head=.36+.64*((clock*.43)%1),start=Math.max(0,head-.30);
    // 分支方向取相邻短线的切向；单独核对量化后的输入，避免放大坐标量化误差。
    const path=Array.from({length:65},(_,j)=>O.camera.project(at('driven',index,pose.time-length+(start+(head-start)*j/64)*length,true),pose));
    const fibers=O.electric(path,clock,n,1,O.C.lightningDensity(clock));
    assert.equal(fibers.length,6,'原主线、主弧和两组支弧及细分支');
    for(const fiber of fibers)contains(arcs,fiber.points[0]);
    player.destroy();
  }finally{env.close();}
});

test('星系按六臂分层提取原星点，轨道保持原半径对应的转速',async()=>{
  const O=await oracle(),env=await environment();
  try{
    const root=env.w.document.getElementById('root'),player=env.w.MotionRuntime.create(root,def('spiral-galaxy-illustration'));
    assert.equal(O.G.galaxyStars.length,28800);
    for(const t of [1000,2000]){
      player.seek(t);const stars=moves(root,'point');assert.ok(stars.length>7000&&stars.length<=7200);
      for(let arm=0;arm<6;arm++)for(const layer of [0,13,101]){
        const star=O.G.galaxyStars[layer*24+arm];
        contains(stars,O.camera.project(O.G.galaxyPosition(star,13.5+t/1000),camera(1.12,.4,410)));
      }
    }
    player.destroy();
  }finally{env.close();}
});

test('八项插画保持完整画板，合并粒子节点，停止后不重复更新',async()=>{
  const env=await environment();
  try{
    assert.equal(ids.length,8);const root=env.w.document.getElementById('root');
    for(const id of ids){
      const render=env.w.MotionFactories[id](root,env.w.MotionKit,def(id));
      for(const time of [300,1000,2000,2600]){
        render(time);assert.equal(root.querySelectorAll('text,image,foreignObject,rect').length,0,id);
        assert.ok(root.querySelectorAll('*').length<400,id+' 未合并同材质粒子与线段');
        for(const [x,y] of vertices(root)){
          const px=320+(x-540)*.32,py=180+(y-900)*.32;
          assert.ok(px>0&&px<640&&py>0&&py<360,id+' 图形超出画板');
        }
      }
      const observer=new env.w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
      render(2700);render(3000);assert.equal(observer.takeRecords().length,0,id+' 静止后继续修改图形');observer.disconnect();
    }
  }finally{env.close();}
});

function graphics(w){
  const contexts=[],canvases=new WeakMap();let copies=0;
  w.HTMLCanvasElement.prototype.getContext=function(type){
    if(type==='2d')return {drawImage(){copies++;}};
    if(type!=='webgl2')return null;
    if(canvases.has(this))return canvases.get(this);
    const record={shaders:[],textures:[],frames:[],deleted:[],lost:0};let constant=1;
    const gl=new Proxy({drawingBufferWidth:640,drawingBufferHeight:360,
      getExtension(name){return name==='WEBGL_lose_context'?{loseContext(){record.lost++;}}:{};},
      getShaderParameter(){return true;},getProgramParameter(){return true;},
      checkFramebufferStatus(){return gl.FRAMEBUFFER_COMPLETE;},
      shaderSource(_shader,s){record.shaders.push(s);},texImage2D(...args){record.textures.push(args);},
      bufferData(_type,data){record.frames.push(Float32Array.from(data));}
    },{get(target,key){
      if(key in target)return target[key];
      if(/^[A-Z_0-9]+$/.test(key))return target[key]=constant++;
      return target[key]=(...args)=>{if(key.startsWith('delete'))record.deleted.push(key);if(key.startsWith('create'))return {};return undefined;};
    }});
    contexts.push(record);canvases.set(this,gl);return gl;
  };
  return {contexts,get copies(){return copies;}};
}

test('螺旋丸和电弧使用原光效及完整采样，切换播放和缩略图释放绘制资源',async()=>{
  const O=await oracle(),at=await fields(),env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),G=graphics(w);
    const sourceShader=await readFile(new URL('src/rasengan/LightRenderer.ts',source),'utf8');
    const fragment=sourceShader.match(/const fragmentShader=`([\s\S]*?)`;/)[1];
    const output=sourceShader.match(/const outputFragment=`([\s\S]*?)`;/)[1].replace('vec2 px=vec2(.25/1080.0,.25/1920.0);','vec2 px=vec2(.08/640.0,.08/360.0);');
    for(const id of ['rasengan-illustration','lightning-orb-illustration']){
      const player=w.MotionRuntime.create(root,def(id));player.seek(1000);
      const record=G.contexts.at(-1),frame=record.frames.at(-1),canvas=root.querySelector('canvas');
      assert.equal(canvas.className,'pattern-canvas');assert.equal(canvas.width,640);assert.equal(canvas.height,360);
      assert.equal(canvas.style.width,'640px');assert.equal(canvas.style.height,'360px');
      assert.equal(record.shaders[1],fragment,'线身、亮芯和光晕不能改成普通蓝线');
      assert.equal(record.shaders[3],output,'原蓝色、密度和光照累计只适配画板采样尺寸');
      assert.deepEqual(record.textures[0].slice(3,5),[1280,720],'不保留原整页的大型光照缓冲');
      const p={...O.C.finale(19),centerY:900},alpha=1;
      const points=Array.from({length:101},(_,j)=>O.camera.project(at('driven',0,p.time-3.6*.8+j/100*3.6*.8,true),p));
      const expected=[];O.material.drawFiber({triangle(...vertices){for(const v of vertices)expected.push(...v);}},
        {points,opacity:alpha*.98,width:3.8,accent:true,taper:true,energy:1,reflection:1.2});
      for(let i=0;i<72;i++)assert.ok(Math.abs(frame[i]-expected[i])<.001,'原流线材质参数被改变：'+i);
      assert.ok(frame.length>384*100*72,'主流线使用完整采样，保留补充示踪线和粒子');
      const draws=record.frames.length;player.seek(1000);assert.equal(record.frames.length,draws);
      player.destroy();player.destroy();assert.equal(record.lost,1);assert.equal(record.deleted.filter(s=>s==='deleteProgram').length,2);assert.equal(root.childElementCount,0);
    }
    const poster=w.MotionFactories['rasengan-illustration'](root,w.MotionKit,def('rasengan-illustration'));
    poster(2600);const originalCanvas=root.querySelector('canvas');poster.destroy(true);
    assert.equal(G.copies,1);assert.notEqual(root.querySelector('canvas'),originalCanvas);
    assert.equal(root.querySelector('canvas').width,640);assert.equal(originalCanvas.width,1);assert.equal(G.contexts.at(-1).lost,1);
    const draws=G.contexts.at(-1).frames.length;poster.destroy(true);poster(1000);assert.equal(G.contexts.at(-1).lost,1);assert.equal(G.contexts.at(-1).frames.length,draws);
  }finally{env.close();}
});
