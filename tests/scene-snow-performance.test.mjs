// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {environment,data} from './helpers.mjs';

function observeFog(w){
 const source=w.WiseSceneSources.snow,frames=[];
 w.WiseSceneSources.snow=(S,...args)=>{
  const graphics=S.env.createGraphics;
  S.env.createGraphics=(width,height)=>{
   const layer=graphics(width,height);
   if(width===180&&height===160){
    const update=layer.updatePixels;
    layer.updatePixels=()=>{
     frames.push(createHash('sha256').update(layer.pixels).digest('hex'));
     update();
    };
   }
   return layer;
  };
  return source(S,...args);
 };
 return frames;
}

test('深圳湾雪夜每秒只更新八次云雾，雪花与窗灯继续逐帧绘制',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 const fog=observeFog(w);let render;
 try{
  const effect=data.effects.find(e=>e.id==='shenzhen-snow-journey');
  render=w.MotionKit.createRenderer(root,effect);await render.ready;
  assert.equal(fog.length,1,'首帧准备一张云雾');
  const layers=[...root.querySelectorAll('canvas')];
  const draws=layers.map(c=>c.getContext('2d').draws);
  for(let frame=1;frame<=60;frame++)render(frame*1000/60);
  assert.equal(fog.length,9,'一秒内新增八张云雾，不应每帧重算');
  assert.ok(layers.every((c,i)=>c.getContext('2d').draws>=draws[i]+60),'五个画面层仍逐帧绘制');
  assert.ok(layers.every(c=>c.dataset.sourceTime==='1'),'所有画面层共用当前时间');
  render(1000);assert.equal(fog.length,9,'暂停在相同时间不重算云雾');
 }finally{render?.destroy();env.close();}
});

for(const id of ['shenzhen-snow-journey','shenzhen-skyline-illustration','snow-arrival-window']){
 test(`${id} 的云雾保留原取样，跳转和回看不改变画面状态`,async()=>{
  const env=await environment(),{w}=env,root=w.document.getElementById('root');
  w.WiseSceneDiagnostics=true;
  const fog=observeFog(w);let render;
  try{
   const effect=data.effects.find(e=>e.id===id);
   render=w.MotionKit.createRenderer(root,effect);await render.ready;
   // 修改前记录的真实云雾像素；仅比较计算结果，不代替浏览器视觉验收。
   const expected=new Map([
    [0,'3c3bd863fe9a16188f4d60bf2e1284e17a1989d25c549c070cf0e6c2ed7fe8c9'],
    [250,'beac801b1e0a90f4e5f2d9eb29177a23113a216813aeb871f02e991c35943efd'],
    [1000,'92cdae7dd34b2723e31940b6873978224ecfb1953049155596a0505c24bed97f'],
   ]);
   const poses=new Map();
   for(const time of expected.keys()){
    render(time);assert.equal(fog.at(-1),expected.get(time));poses.set(time,root.dataset.pose);
   }
   for(const time of [250,0,1000,250]){
    render(time);assert.equal(fog.at(-1),expected.get(time));
    assert.equal(root.dataset.pose,poses.get(time),'同一时间的雪花落点和窗灯状态应一致');
   }
   render(0);const count=fog.length;
   render(1000/60);render(2*1000/60);render(1000/60);
   assert.equal(fog.length,count,'在同一云雾时间格内回拖也复用纹理');
  }finally{render?.destroy();env.close();}
 });
}
