// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
const data=JSON.parse(await readFile(new URL('../catalog/registry.json',import.meta.url),'utf8'));
async function environment(){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{runScripts:'outside-only',url:'file:///wise-motion/catalog/index.html'}),w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 for(const file of ['matching.js','runtime.js','effects/motion-oasis.js','export.js'])w.eval(await readFile(new URL('../catalog/'+file,import.meta.url),'utf8'));
 w.MotionRegistry=JSON.parse(JSON.stringify(data));
 return {w,close:()=>dom.window.close()};
}
const source=await readFile(new URL('../catalog/effects/motion-oasis.js',import.meta.url),'utf8');
const scope={MotionFactories:{}};runInNewContext(source,scope);
const fresh=data.effects.filter(e=>e.source.path==='catalog/effects/motion-oasis.js');
function recorder(){
 let hash,depth=0,calls=0;const state={},stack=[];
 const record=(key,args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),key);hash?.update(key+JSON.stringify(args));calls++;};
 const methods={save(){stack.push({...state});depth++;record('save',[]);},restore(){assert.ok(depth>0);depth--;Object.assign(state,stack.pop());record('restore',[]);},measureText:s=>({width:String(s).length*28}),setLineDash(){}};
 for(const key of ['createLinearGradient','createRadialGradient'])methods[key]=(...args)=>{record(key,args);return {addColorStop:(...v)=>record('colorStop',v)};};
 const ctx=new Proxy(methods,{get:(o,k)=>k in o?o[k]:k in state?state[k]:(...args)=>record(k,args),set:(o,k,v)=>{state[k]=v;return true;}});
 return {ctx,hash(draw){hash=createHash('sha256');calls=0;draw(ctx);assert.equal(depth,0,'画布保存与恢复必须配对');const value=hash.digest('hex');hash=null;return {value,calls};}};
}
test('完整城市任意定位保持几何一致，水面厚度与图形高度连续对应',()=>{
 const e=scope.WiseMotionOasis.createEngine(data),r=recorder();
 const times=[0,.11,.32,.54,.79,.95,1.4,1.82,2.24,2.48,2.70,2.89,3.12,3.5,3.75];
 const samples=times.map(t=>r.hash(c=>e.render(c,t)).value);
 for(let i=times.length-1;i>=0;i--)assert.equal(r.hash(c=>e.render(c,times[i])).value,samples[i]);
 for(let frame=54;frame<=225;frame++){
  const t=frame/60;e.render(r.ctx,t);const info=e.inspect();assert.equal(info.waterHeights.length,26);
  for(const cell of info.waterHeights){assert.ok(Math.abs(cell.bottom+8)<1e-8);assert.equal(cell.top,e.gallery.waterHeight(t,cell.i,cell.j));}
 }
 assert.equal(e.gallery.metadata.counts.action,data.effects.filter(x=>x.kind==='action').length);
 assert.equal(e.gallery.metadata.total,data.effects.length);e.dispose();
});
test('两种波次按距离传播，交接时旧图保留，新图已在运动',()=>{
 const e=scope.WiseMotionOasis.createEngine(data),g=e.gallery;
 for(let round=1;round<7;round++){
  const state=g.stateAt(1.4+round*.66+.001),ordered=[...state.cells].sort((a,b)=>a.distance-b.distance);
  assert.equal(state.mode,round%2?'wave-grid':'group-stagger');
  for(let i=1;i<ordered.length;i++)assert.ok(ordered[i].waveAt>=ordered[i-1].waveAt);
  for(const cell of state.cells){
   const before=g.stateAt(cell.waveAt-1e-6).cells[cell.index],after=g.stateAt(cell.waveAt+1e-6).cells[cell.index];
   assert.ok(after.layers.some(l=>l.effect.id===before.effect.id&&l.opacity>.999));
   for(let j=0;j<=12;j++){
    const live=g.stateAt(cell.waveAt+j/12*cell.waveDuration).cells[cell.index];
    assert.ok(Math.abs(live.layers.reduce((n,l)=>n+l.opacity,0)-1)<1e-8);
    assert.ok(live.layers.every(l=>l.age>=.9));
   }
  }
 }
 e.dispose();
});
test('独立动作只画自身对象，拆层改变实际绘制，同一时刻恢复完整画面',async()=>{
 const env=await environment();try{
  const r=recorder();env.w.HTMLCanvasElement.prototype.getContext=()=>r.ctx;
  const roots=fresh.map(()=>env.w.document.createElement('div'));
  const renders=fresh.map((e,i)=>env.w.MotionFactories[e.id](roots[i],env.w.MotionKit,e));
  await Promise.all(renders.map(x=>x.ready));
  for(let i=0;i<fresh.length;i++){
   const e=fresh[i],draw=renders[i];draw(e.preview_ms);const stats=draw.inspect();
   assert.equal(roots[i].querySelectorAll('canvas').length,1);
   if(e.id==='terraced-rise'){assert.equal(stats.tiles,0);assert.equal(stats.waterHeights.length,0);}
   if(e.id==='water-wave-handoff'){assert.equal(stats.tiles,26);assert.equal(stats.part,'water');}
   if(e.kind==='composition'){
    const full=r.hash(()=>draw(2700)).value,markers=[...roots[i].querySelectorAll('[data-layer]')];assert.equal(markers.length,6);
    markers.filter(n=>n.dataset.layer!=='water').forEach(n=>n.setAttribute('data-composition-hidden',''));await Promise.resolve();
    assert.equal(draw.inspect().tiles,26);assert.notEqual(r.hash(()=>draw(2700)).value,full);
    markers.forEach(n=>n.removeAttribute('data-composition-hidden'));await Promise.resolve();
    assert.equal(r.hash(()=>draw(2700)).value,full);
   }
  }
  const nodes=roots.flatMap(root=>[...root.querySelectorAll('canvas')]);renders.forEach(draw=>{draw.destroy();draw.destroy();});
  assert.ok(nodes.every(c=>c.width===1&&c.height===1));assert.ok(roots.every(r=>!r.childElementCount));
 }finally{env.close();}
});
test('目录可以搜索并复制独立源码页面，复制页面不依赖私有工程或视频',async()=>{
 const env=await environment();try{
  const html=await readFile(new URL('../catalog/index.html',import.meta.url),'utf8');
  assert.ok(html.includes('effects/motion-oasis.js'));
  assert.equal(env.w.MotionMatch.rank(data,'动效绿洲')[0].effect.id,'motion-oasis-sequence');
  for(const e of fresh){
   const code=env.w.MotionExport.code(e);assert.ok(code.includes('catalog/effects/motion-oasis.js'));if(e.kind==='composition'){assert.ok(code.includes('catalog_data'));assert.ok(code.includes('\"action\": '+env.w.MotionRegistry.effects.filter(x=>x.kind==='action').length));}assert.doesNotMatch(code,/\/Users\/|<video|opus-scene/);
   const prompt=env.w.MotionExport.prompt(e,{},data);assert.match(prompt,/暖沙色/);
  }
  assert.doesNotMatch(source,/\/Users\/|requestAnimationFrame|setInterval|Math\.random/);
  assert.ok(env.w.MotionMatch.rank(data,'动效绿洲').length);
 }finally{env.close();}
});
