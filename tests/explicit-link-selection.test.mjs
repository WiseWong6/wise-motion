// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment} from './helpers.mjs';

const page='file:///wise-motion/catalog/index.html';
function storage(hash,kind,selection){
  const values=new Map([
    ['wise-motion-kind:'+page+hash,kind],
    ['wise-motion-selection:'+page+hash,JSON.stringify(selection)],
  ]);
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
}
const current=d=>d.querySelector('.effect-item[aria-current="true"]')?.dataset.effect;
const kind=d=>d.querySelector('[data-kind][aria-pressed="true"]')?.dataset.kind;

test('错峰示例移除字幕排布，原有示例切到百格时仍可播放定位',async()=>{
  let player;
  const errors=[];
  const env=await environment(true,{hash:'#stagger-in',beforeApp(w){
    w.addEventListener('error',event=>errors.push(event.error));
    const create=w.MotionRuntime.create;
    w.MotionRuntime.create=(...args)=>(player=create(...args));
  }});
  try{
    const {w}=env,d=w.document,select=d.getElementById('effect-variant');
    assert.deepEqual([...select.options].map(option=>option.value),['original','lego-kingdom-grid']);
    const choose=value=>{select.value=value;select.dispatchEvent(new w.Event('change'));};
    await player.ready;
    assert.equal(d.getElementById('ease').value,'outCubic');
    const speed=d.getElementById('speed');speed.value='1.5';speed.dispatchEvent(new w.Event('input'));
    choose('lego-kingdom-grid');await player.ready;
    assert.deepEqual(errors,[]);
    assert.equal(player.destroyed,false);
    assert.equal(player.error,null);
    assert.equal(player.paused,false);
    assert.equal(player.speed,1.5,'切换曲线不丢失播放速度');
    assert.equal(d.getElementById('ease').value,'linear');
    assert.equal(d.getElementById('ease-label').hidden,true);
    const scene=()=>d.querySelector('#preview [data-lego-mode]');
    assert.equal(scene()?.dataset.legoMode,'efficiency-grid');
    player.pause();player.seek(1600);
    assert.equal(scene().dataset.sourceFrame,'48');
    player.seek(3200);assert.equal(scene().dataset.sourceFrame,'95');
    player.restart(false);assert.equal(scene().dataset.sourceFrame,'0');
    player.play();assert.equal(player.paused,false);
    choose('original');await player.ready;
    assert.equal(d.getElementById('ease').value,'linear','新示例也支持的曲线继续保留');
    choose('lego-kingdom-grid');await player.ready;
    assert.equal(scene()?.dataset.legoMode,'efficiency-grid');
    assert.deepEqual(errors,[]);
  }finally{env.close();}
});

test('明确动作链接优先于同一地址曾保存的其他动作和页签',async()=>{
  for(const target of [
    {id:'tile-wave-transition',hash:'#lego-brick-wipe',kind:'action',mode:'brick-wipe'},
    {id:'lego-engine-flow',kind:'composition',mode:'engine-flow'},
    {id:'lego-comparison-timer',kind:'action',mode:'comparison-timer'},
  ]){
    const hash=target.hash||'#'+target.id;
    const memory=storage(hash,'action',{id:'crt-collapse',variantId:'original'});
    const env=await environment(true,{staticPreview:true,hash,sessionStorage:memory});
    try{
      const d=env.w.document;
      assert.equal(current(d),target.id);
      assert.equal(kind(d),target.kind);
      assert.equal(d.querySelector('#preview [data-lego-mode]')?.dataset.legoMode,target.mode);
      if(target.hash)assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,'lego-kingdom');
    }finally{env.close();}
  }
});

test('无动作链接刷新时保留上次选择的动作和示例',async()=>{
  const memory=storage('','action',{id:'mindmap-follow',variantId:'lego-kingdom'});
  const env=await environment(true,{staticPreview:true,hash:'',sessionStorage:memory});
  try{
    const d=env.w.document;
    assert.equal(current(d),'mindmap-follow');
    assert.equal(kind(d),'action');
    assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,'lego-kingdom');
    assert.equal(d.querySelector('#preview [data-lego-mode]').dataset.legoMode,'path-packets');
  }finally{env.close();}
});

test('引擎组合的相关动作弹窗使用指定示例，从头播放且可以独立定位',async()=>{
  const players=new Map();
  const env=await environment(true,{staticPreview:true,hash:'#lego-engine-flow',beforeApp(w){
    const create=w.MotionRuntime.create;
    w.MotionRuntime.create=(host,...args)=>{const player=create(host,...args);players.set(host,player);return player;};
  }});
  try{
    const {w}=env,d=w.document,host=d.getElementById('related-preview');
    const composition=w.MotionRegistry.effects.find(effect=>effect.id==='lego-engine-flow');
    for(const id of composition.actions){
      const variant=composition.action_variants?.[id];
      const definition=w.MotionKit.resolveVariant(w.MotionRegistry.effects.find(effect=>effect.id===id),variant);
      d.querySelector(`#related [data-related="${id}"]`).click();
      const player=players.get(host);await player.ready;
      assert.equal(player.paused,false,'点击相关动作应从头开始播放');
      assert.equal(player.currentTime,0);
      assert.equal(host.querySelector('.motion-stage').dataset.variant,variant);
      assert.equal(host.querySelector('[data-lego-mode]').dataset.legoMode,definition.lego_motion.mode);
      const scrub=d.getElementById('related-scrub');
      scrub.value='500';scrub.dispatchEvent(new w.Event('input'));
      assert.equal(player.paused,true);
      assert.equal(Number(host.querySelector('[data-lego-mode]').dataset.sourceFrame),
        Math.floor(definition.duration_ms*.5*30/1000+1e-7));
      d.getElementById('related-close').click();
      assert.equal(host.childElementCount,0);
      assert.equal(current(d),'lego-engine-flow');
      assert.equal(w.MotionRuntime.instanceCount,1);
    }
  }finally{env.close();}
});
