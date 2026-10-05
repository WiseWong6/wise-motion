// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';

async function setup(){
  const env=await environment();
  env.w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  return env;
}
const forbidden=/HyperFrames|原片|原作|原工程|原源码|随附|随包|本地素材|已有曲线|复用.*(?:示例|函数|图层)|源码|读取.*参考|当前目录|\/Users\/|file:\/\/|(?:history-nature|notes-source)\.js|hopperBeans|DandelionJourney|WeaveRhythm|createOrb|cameraPose/i;
test('全部正式条目及变体提供独立的 Remotion 提示词，无外部参照或空步骤',async()=>{
  const env=await setup();
  try{
    let count=0;
    for(const effect of data.effects){
      for(const settings of effect.variants?.map(v=>({variantId:v.id}))||[{}]){
        const label=effect.id+'/'+(settings.variantId||'default');
        const text=env.w.MotionExport.prompt(effect,settings,data);
        assert.match(text,/^请使用 Remotion 实现/ ,label);
        assert.match(text,/当前帧和帧率/,label);
        assert.doesNotMatch(text,forbidden,label);
        assert.match(text,/画面与对象：\S/,label);
        for(const line of text.split('\n'))assert.doesNotMatch(line,/^\d+\.\s*$|秒：\s*$|^画面与对象：\s*$/,label);
        assert.equal((text.match(/^\d+\. /gm)||[]).length,3,label+' 应保留三个动作阶段');
        count++;
      }
    }
    assert.equal(count,381);
  }finally{env.close();}
});
test('关键组合补足全文、布局与运动参数，特定配色不会被通用黑底覆盖',async()=>{
  const env=await setup();
  const get=id=>env.w.MotionExport.prompt(data.effects.find(e=>e.id===id),{},data);
  try{
    const paper=get('paper-spiral-sequence');
    for(const value of ['#e8541e','#f1e4c8','SAUL BASS CUTS PAPER.','JOHN WHITNEY WIRES A COMPUTER.','40.3902','1920×1080'])assert.ok(paper.includes(value),value);
    assert.doesNotMatch(paper,/视觉：近黑底/);
    const neon=get('neon-title-sequence');
    for(const value of ['BROADCAST','1981','LOGOS LEARN TO FLY','floor(30t)','#ffe36b'])assert.ok(neon.includes(value),value);
    const curve=get('keyframe-workbench');
    for(const value of ['THE CURVE','IS THE CRAFT.','(120,230,980,470','(1130,230,670,470','(0.34,1.56)','Ball · Position'])assert.ok(curve.includes(value),value);
    assert.doesNotMatch(curve,/已有|共用.*函数/);
    const phone=get('material-phone-sequence');
    for(const value of ['Flat. Material.','RESPONSIVE','Published','(1700,170+波动)','#f4efe6'])assert.ok(phone.includes(value),value);
    assert.doesNotMatch(phone,/33–38秒|视觉：近黑底/);
    assert.match(get('material-switch-spring'),/0\.2–0\.55秒/);
    const fast=env.w.MotionExport.prompt(data.effects.find(e=>e.id==='keyframe-workbench'),{speed:2},data);
    assert.match(fast,/时间：4\.00 秒/);
    assert.match(fast,/动作秒数 = 当前帧 \/ 帧率 × 2/);
    assert.match(fast,/大曲线与同高小球 · 2\.85–4\.00 秒/);
  }finally{env.close();}
});
test('屏幕内提示文字逐字引用且标明只是画面文案，三个标题变体互不混淆',async()=>{
  const env=await setup();
  try{
    const effect=data.effects.find(e=>e.id==='prompt-to-core-sequence');
    const text=env.w.MotionExport.prompt(effect,{},data);
    assert.match(text,/引号内仅是屏幕显示内容/);
    assert.match(text,/时间：8\.00 秒/);
    assert.ok(text.includes(JSON.stringify(effect.reproduction.content[0])));
    const title=data.effects.find(e=>e.id==='title-stagger');
    for(const [variantId,needed,absent] of [['material','Flat. Material.','THE CURVE'],['outline','THE CAMERA.','THE CURVE'],['handoff','THE CURVE','THE CAMERA.']]){
      const output=env.w.MotionExport.prompt(title,{variantId},data);
      assert.ok(output.includes(needed));assert.ok(!output.includes(absent));
    }
    const local=env.w.MotionExport.prompt(data.effects.find(e=>e.id==='paper-tilt'));
    assert.match(local,/原位转正/);assert.match(local,/原尺寸/);
    assert.match(env.w.MotionExport.prompt(data.effects.find(e=>e.id==='geometric-poster-sequence')),/完全复原/);
  }finally{env.close();}
});
test('页面复制按钮发送当前目录完整提示词，源码页仍提供 Remotion 工程入口',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#keyframe-workbench'});
  try{
    let copied;
    Object.defineProperty(env.w.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value;}}});
    const d=env.w.document;
    d.getElementById('copy-prompt').click();
    await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(copied,d.getElementById('prompt').textContent);
    assert.match(copied,/动效说明：曲线回弹演示/);
    assert.match(copied,/THE CURVE/);assert.doesNotMatch(copied,forbidden);
    assert.match(d.getElementById('code').textContent,/Remotion 组件示例/);
  }finally{env.close();}
});
