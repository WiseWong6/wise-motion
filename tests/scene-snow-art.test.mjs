// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

for(const [id,name] of [['shenzhen-skyline-illustration','深圳湾楼影'],['snow-arrival-window','雪花抵达并融入窗灯']]){
test(`${name}在楼群前绘制原蓝色天空与云雾，最后覆盖纸纹`,async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 let render;
 try{
  const effect=data.effects.find(e=>e.id===id);
  render=w.MotionKit.createRenderer(root,effect);await render.ready;
  const ctx=root.querySelector('canvas').getContext('2d'),calls=[];
  const gradient=ctx.createLinearGradient;
  ctx.createLinearGradient=function(...args){
   const value=gradient.apply(this,args),stops=[];
   const add=value.addColorStop;
   value.addColorStop=(...stop)=>{stops.push(stop);add.apply(value,stop);};
   value.recordedStops=stops;return value;
  };
  for(const method of ['fillRect','fill','drawImage']){
   const original=ctx[method];
   ctx[method]=function(...args){
    calls.push({method,args,style:this.fillStyle,alpha:this.globalAlpha});
    return original.apply(this,args);
   };
  }
  for(const time of [effect.preview_ms,effect.duration_ms,0,effect.preview_ms]){
   calls.length=0;render(time);
   const sky=calls[0];
   assert.equal(sky.method,'fillRect','夜空应先铺满画板');
   assert.deepEqual(sky.args,[0,0,900,1080]);
   assert.deepEqual(sky.style.recordedStops,[[0,'#2149F2'],[0.3,'#173BCB'],[0.62,'#0D206C'],[0.82,'#080B1D'],[1,'#08090F']]);
   const fog=calls.findIndex(c=>c.method==='drawImage'&&c.args[0].width===180&&c.args[0].height===160);
   const city=calls.findIndex(c=>c.method==='fill'&&c.style==='#0B0B0E');
   assert.ok(fog>0&&city>fog,'云雾应位于蓝色天空之后、楼群之前');
   const grain=calls.at(-1);
   assert.equal(grain.method,'drawImage','纸纹应覆盖整幅夜景');
   assert.equal(grain.args[0].width,900);assert.equal(grain.args[0].height,1080);
   assert.deepEqual(grain.args.slice(1),[0,0,900,1080]);
   assert.equal(grain.alpha,88/255,'保留原作纸纹透明度');
  }
 }finally{render?.destroy();env.close();}
});
}
