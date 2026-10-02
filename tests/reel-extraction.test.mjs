// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

const additions={
  'paper-disc-pop':{duration_ms:6000,preview_ms:520},
  'paper-title-stagger':{duration_ms:4000,preview_ms:2300},
  'outro-credit-lift':{duration_ms:2500,preview_ms:1300}
};
const definition=(id,variantId)=>{
  const base={id,loop:false,default_ease:'linear',...(additions[id]||data.effects.find(e=>e.id===id))};
  if(!variantId)return base;
  const variant=base.variants?.find(v=>v.id===variantId);assert.ok(variant,id+' 缺少 '+variantId+' 样式');
  return {...base,...variant,id,variant_id:variantId};
};
const clean=node=>node.outerHTML.replace(/motion-(?:paper-(?:sequence|title)|prompt|outro)-\d+/g,'fixed-id').replace(/-?\d+\.\d+(?:e[-+]?\d+)?/gi,n=>String(Math.round(Number(n)*1e7)/1e7));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} / ${b}`);

test('三项独立动作使用组合的原节点和绘制，保留原时间偏移',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document;
    const pairs=[
      ['paper-disc-pop','paper-spiral-sequence','[data-layer="disc"]',0,[0,170,273,520,687,1033,1782,5510]],
      ['paper-title-stagger','paper-spiral-sequence','[data-layer="text"]',0,[0,691,1085,1437,1970,2583,3334]],
      ['outro-credit-lift','outro-recap-sequence','[data-layer="credits"]',2700,[0,247,581,923,1567,2290]]
    ];
    for(const [id,composition,selector,offset,times] of pairs){
      const host=d.createElement('div'),whole=d.createElement('div'),p=w.MotionRuntime.create(host,definition(id)),c=w.MotionRuntime.create(whole,definition(composition));
      const nodes=[...host.querySelectorAll('*')];
      for(const time of times){
        p.seek(time);c.seek(time+offset);
        const actual=[...host.querySelectorAll(selector)],expected=[...whole.querySelectorAll(selector)];
        assert.equal(actual.length,expected.length,id);
        actual.forEach((node,i)=>{
          if(id==='paper-disc-pop'){
            for(const attr of ['r','cy','visibility','fill'])assert.equal(node.getAttribute(attr),expected[i].getAttribute(attr),`${id} ${attr} @ ${time}`);
            near(+node.getAttribute('cx')+440,+expected[i].getAttribute('cx'));
          }else assert.equal(clean(node),clean(expected[i]),`${id} @ ${time}`);
        });
      }
      p.seek(definition(id).preview_ms);const frame=host.innerHTML;
      p.seek(definition(id).duration_ms);p.seek(0);p.seek(definition(id).preview_ms);
      assert.equal(host.innerHTML,frame,id+' 往返定位必须得到同一帧');
      assert.deepEqual([...host.querySelectorAll('*')],nodes,id+' 定位不新建对象');
      const observer=new w.MutationObserver(()=>{});observer.observe(host,{subtree:true,attributes:true,childList:true});
      p.seek(definition(id).preview_ms);assert.equal(observer.takeRecords().length,0,id+' 同一时刻不重复写入');observer.disconnect();
      p.destroy();c.destroy();
    }
    assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.close();}
});

test('独立动作只建必要图层，不能把整段组合建立后藏起来',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document;
    const scopes={
      'paper-disc-pop':['disc'],'paper-title-stagger':['text'],
      'prompt-border-trace':['border'],'prompt-chinese-type':['ui','border','send','letters'],'prompt-char-gather':['letters'],
      'send-press-ring':['send'],'prompt-ui-push':['ui'],'core-ring-expand':['core'],
      'outro-credit-lift':['credits'],
      'striped-sun-rise':['sun'],'perspective-grid-flow':['grid'],'star-twinkle':['stars'],
      'chrome-outline-echo':['chrome'],'neon-type-flicker':['neon'],'cross-flare-travel':['flare'],
      'panel-rise-collapse':['panels'],'ball-bounce-trails':['bounce'],'timeline-keyframe-playhead':['timeline'],
      'caption-type-caret':['caption'],'generative-frame-readout':['frame'],
      'generative-point-morph':['points'],'generative-flow-field':['field'],'code-line-sequence':['code'],
      'radial-line-burst':['burst'],'timeline-dock-down':['axis']
    };
    const cases=[...Object.entries(scopes),['title-stagger',['labels'],'material'],['title-stagger',['title'],'outline'],['title-stagger',['labels'],'handoff']];
    for(const [id,allowed,variant]of cases){
      const root=d.createElement('div'),player=w.MotionRuntime.create(root,definition(id,variant));
      assert.deepEqual([...new Set([...root.querySelectorAll('[data-layer]')].map(n=>n.dataset.layer))].sort(),allowed.slice().sort(),id);
      assert.equal(root.querySelector('[display="none"], [style*="display:none"], [style*="display: none"]'),null,id+' 不能靠隐藏组合提取');
      if(id==='paper-disc-pop')assert.equal(root.querySelectorAll('circle').length,2);
      if(['prompt-border-trace','send-press-ring','prompt-ui-push'].includes(id))assert.equal(root.querySelectorAll('[data-char]').length,0,id+' 不建立无关110字提示词');
      if(id==='send-press-ring')assert.equal(root.querySelector('[data-part="toolbar"]'),null);
      player.destroy();
    }
  }finally{env.close();}
});

test('圆盘保留十二格回弹和连续圆心节拍，剪纸与片尾标题保留真实运动',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document,root=d.createElement('div');
    let p=w.MotionRuntime.create(root,definition('paper-disc-pop'));
    p.seek(280);const r=root.querySelector('[data-part="disc"]').getAttribute('r'),center=+root.querySelector('[data-part="disc-center"]').getAttribute('r');
    p.seek(300);assert.equal(root.querySelector('[data-part="disc"]').getAttribute('r'),r);assert.ok(+root.querySelector('[data-part="disc-center"]').getAttribute('r')<center);
    p.seek(500);near(+root.querySelector('[data-part="disc-center"]').getAttribute('r'),36);assert.ok(+root.querySelector('[data-part="disc"]').getAttribute('r')>360);p.destroy();
    for(const [id,selector,a,b]of [
      ['paper-title-stagger','[data-line="year"] [data-char="0"]',1000,1500],
      ['outro-credit-lift','[data-credit="headline"] [data-letter="0"]',210,800]
    ]){
      p=w.MotionRuntime.create(root,definition(id));p.seek(a);const before=clean(root.querySelector(selector));p.seek(b);assert.notEqual(clean(root.querySelector(selector)),before,id+' 必须保留真实运动');p.destroy();
    }
  }finally{env.close();}
});

test('八个组合的运动图层都有可定位的真实动作，重复霓虹动作继续复用',async()=>{
  const env=await environment();
  try{
    const {w}=env,ids=['paper-spiral-sequence','neon-horizon','neon-title-sequence','keyframe-workbench','material-phone-sequence','generative-point-sequence','prompt-to-core-sequence','outro-recap-sequence'];
    for(const id of ids){
      const breakdown=w.MotionFactories[id].breakdown;
      for(const layer of breakdown){
        assert.ok(layer.actions.length>0||layer.reason,`${id}/${layer.id} 未关联独立动作的图层必须说明保留依据`);
        for(const action of layer.actions){assert.equal(typeof w.MotionFactories[action],'function',`${id}/${layer.id}/${action}`);assert.notEqual(action,id,'不能让组合指向自身');}
      }
    }
    assert.ok(!data.effects.some(effect=>effect.id==='prompt-label-lift'),'已剔除的标题不能重新进入目录');
    assert.equal(w.MotionFactories['prompt-label-lift'],undefined,'已剔除的标题不再注册独立动作');
    for(const effect of data.effects)assert.ok(!effect.actions.includes('prompt-label-lift'),'组合不再链接已剔除的动作');
    const horizon=w.MotionFactories['neon-horizon'].breakdown,title=w.MotionFactories['neon-title-sequence'].breakdown;
    for(const layer of horizon)assert.deepEqual(Array.from(title.find(x=>x.id===layer.id).actions),Array.from(layer.actions));
  }finally{env.close();}
});
