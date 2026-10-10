// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

test('星月来信准备与回看时，浏览器样式读取始终使用所属窗口',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 w.WiseSceneDiagnostics=true;
 try{
  const native=w.getComputedStyle;let calls=0;
  // jsdom 不校验窗口归属；补齐真实浏览器的限制，复现 Illegal invocation。
  w.getComputedStyle=function(...args){
   if(this!==w)throw new TypeError('Illegal invocation');
   calls++;return native.apply(w,args);
  };
  assert.throws(()=>w.getComputedStyle.call({},root),{name:'TypeError',message:'Illegal invocation'});
  // 每次建立场景环境时捕获此函数，覆盖正式调用路径。
  for(const effect of data.effects.filter(e=>e.scene?.family==='letter')){
   for(const variant of effect.variants||[{}]){
    const before=calls;
    const render=w.MotionKit.createRenderer(root,{...effect,variant_id:variant.id});
    try{
     await render.ready;
     assert.ok(calls>=before+2,effect.name+' 应实际读取打字与发送时的文字样式');
     for(const time of [0,effect.preview_ms,effect.duration_ms,effect.preview_ms])render(time);
     assert.equal(JSON.parse(root.dataset.pose).count,126,effect.name+' 应保留完整符号群');
    }finally{render.destroy();root.replaceChildren();}
   }
  }
  assert.ok(calls>0,'不能遗漏星月条目');
 }finally{env.close();}
});
