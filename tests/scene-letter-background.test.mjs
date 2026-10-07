// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {environment,data} from './helpers.mjs';

// 原银河图左上角没有星点。首行首像素的滤波参考值全为零，可直接读取 RGB。
async function galaxyCorner(){
 const png=await readFile(new URL('../catalog/assets/scene-sources/letter/galaxy-sky.png',import.meta.url)),chunks=[];
 assert.equal(png.readUInt8(24),8);assert.equal(png.readUInt8(25),2);assert.equal(png.readUInt8(28),0);
 for(let at=8;at<png.length;){
  const size=png.readUInt32BE(at),type=png.toString('ascii',at+4,at+8);
  if(type==='IDAT')chunks.push(png.subarray(at+8,at+8+size));
  at+=size+12;
 }
 const row=inflateSync(Buffer.concat(chunks));assert.ok(row[0]<=4);
 return Array.from(row.subarray(1,4));
}

test('蓝色星月来信展开完整银河后仍保留蓝底，暂停和回拖不变黑',async()=>{
 const corner=await galaxyCorner(),env=await environment(),{w}=env,root=w.document.getElementById('root');
 const pixels=new WeakMap(),galaxyImages=new WeakSet(),seen=new WeakSet();
 const context=w.HTMLCanvasElement.prototype.getContext,style=w.getComputedStyle;
 // 结构环境不计算容器字号；保持原作逻辑尺寸，与文字专项检查一致。
 w.getComputedStyle=node=>{const css=style.call(w,node);return node.matches('.scene-letter-inner .words')?new Proxy(css,{get:(o,k)=>k==='fontSize'?'17.82px':Reflect.get(o,k)}):css;};
 w.HTMLCanvasElement.prototype.getContext=function(...args){
  const ctx=context.apply(this,args);if(!ctx||seen.has(ctx))return ctx;seen.add(ctx);
  const canvas=this,fill=ctx.fillRect,draw=ctx.drawImage,clear=ctx.clearRect;
  ctx.clearRect=function(...a){galaxyImages.delete(canvas);return clear.apply(this,a);};
  ctx.fillRect=function(...a){
   if(canvas.dataset.layer==='galaxy'&&a[0]===0&&a[1]===0&&a[2]===660&&a[3]===880){
    const color=this.fillStyle.match(/^#([\da-f]{6})$/i);assert.ok(color);
    pixels.set(canvas,[0,2,4].map(i=>parseInt(color[1].slice(i,i+2),16)));
   }
   return fill.apply(this,a);
  };
  ctx.drawImage=function(image,...a){
   if(image.tagName==='IMG')galaxyImages.add(canvas);
   if(canvas.dataset.layer==='galaxy'&&galaxyImages.has(image)){
    // 完整展开时，原图为不透明 RGB；按实际绘制调用合成这个暗角。
    const base=pixels.get(canvas);
    pixels.set(canvas,this.globalCompositeOperation==='screen'?base.map((v,i)=>255-(255-v)*(255-corner[i])/255):corner);
   }
   return draw.call(this,image,...a);
  };
  return ctx;
 };
 w.WiseSceneDiagnostics=true;let render;
 try{for(const id of ['star-letter-blue-journey','star-letter-journey']){
  const effect=data.effects.find(e=>e.id===id);render=w.MotionKit.createRenderer(root,effect);await render.ready;
  const layer=root.querySelector('canvas[data-layer="galaxy"]'),frames=new Map();
  for(const time of [22000,25000,22000,0,25000]){
   render(time);const actual=pixels.get(layer);
   if(time){
    assert.ok(JSON.parse(root.dataset.pose).galaxy.end<=time/1000,'取样时银河必须已完整展开');
    if(id==='star-letter-blue-journey')assert.ok(actual[0]>=22&&actual[1]>=77&&actual[2]>=242,'原图暗部不能覆盖正蓝底色：'+actual);
    else assert.deepEqual(actual,corner,'墨黑版保留既有合成画面');
   }else if(id==='star-letter-blue-journey')assert.deepEqual(actual,[22,77,242]);
   if(frames.has(time))assert.deepEqual(actual,frames.get(time),'同一时间回看保持相同底色');else frames.set(time,actual);
  }
  render.destroy();render=null;root.replaceChildren();
 }}finally{render?.destroy();env.close();}
});
