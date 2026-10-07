import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';
const selected=data.effects.filter(e=>e.scene||['encore-full-journey','ring-construction','ring-construction-journey','energy-density-growth','energy-discharge-journey','mushroom-sphere-idealize','mushroom-sphere-journey','ring-sphere-journey'].includes(e.id));
test('十组原作的独立主体、组合及所有造型示例可以初始化、定位和回看',async()=>{
 const env=await environment();const {w}=env;w.WiseSceneDiagnostics=true;let count=0;const failures=[];
 try{for(const effect of selected)for(const variant of effect.variants||[{}]){
  const def={...effect,...variant,id:effect.id},root=w.document.createElement('div');w.document.body.append(root);let draw;
  try{
   draw=w.MotionKit.createRenderer(root,def);await draw.ready;
   for(const t of [0,def.preview_ms,def.duration_ms,def.preview_ms])draw(t);
   const pose=root.dataset.pose;draw(0);draw(def.preview_ms);assert.equal(root.dataset.pose,pose,effect.id+' 回看改变了原姿态');
   const canvases=[...root.querySelectorAll('canvas')];if(canvases.length)assert.ok(canvases.some(c=>c.getContext('2d').draws>0),effect.id+' 未调用原作绘制');
   else {assert.ok(root.querySelector('path'),effect.id+' 未绘制原矢量轮廓');assert.doesNotMatch(root.innerHTML,/NaN|Infinity/,effect.id+' 矢量坐标必须有效');}
   count++;
  }catch(error){failures.push(effect.name+' / '+(variant.label||'默认')+'：'+error.message+'\n'+error.stack);}
  finally{draw?.destroy?.();root.remove();}
 }}finally{env.close();}
 assert.equal(failures.length,0,failures.join('\n\n'));assert.ok(count>=55,'遗漏原作条目');
});
