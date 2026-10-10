// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {environment,data,frameMarkup} from './helpers.mjs';
import {frameScriptsFor} from '../remotion/frame-document.mjs';

// 原目录插画与动作一对一复用的约定；迁入场景的分离主体和交互动作由 scenes-adoption.test.mjs 单独验证。
const illustrations=data.effects.filter(e=>e.kind==='illustration'&&!e.scene);
const animated=illustrations.filter(e=>e.actions.length);
const staticIds=['book-geometric-illustration','selfie-phone-illustration'];
const definition=id=>data.effects.find(e=>e.id===id);
const actionFor=(w,art)=>w.MotionKit.resolveVariant(definition(art.actions[0]),art.action_variants?.[art.actions[0]]);

test('既有动态插画都关联真实动作，同类示例合并且静态主体不虚构动作',()=>{
  assert.equal(animated.length,64);
  assert.deepEqual(illustrations.filter(e=>!e.actions.length).map(e=>e.id).sort(),staticIds.sort());
  for(const art of animated)for(const id of art.actions)assert.equal(definition(id)?.kind,'action',art.id);
  assert.equal(definition('drafting-tools-illustration').actions[0],definition('folio-cards-illustration').actions[0]);
  for(const [art,id] of [['claude-flow-field-illustration','generative-flow-field'],
    ['claude-spectrum-illustration','hud-spectrum-bars'],['claude-frame-counter-illustration','progress-readout'],
    ['terminal-window-illustration','terminal-code']])assert.deepEqual(definition(art).actions,[id]);
});

test('关联动作的独立绘制与插画逐时刻一致，保留配色、节奏和重复定位',async()=>{
  const env=await environment();
  try{
    const {w}=env,artRoot=w.document.getElementById('root'),actionRoot=w.document.createElement('div');
    for(const art of animated.filter(e=>e.id!=='encore-umbrella-illustration')){
      const action=actionFor(w,art),original=w.MotionRuntime.create(artRoot,art),player=w.MotionRuntime.create(actionRoot,action);
      try{
        assert.ok(action.source.factory===art.id||art.id==='osmanthus-moon-illustration');
        assert.equal(action.duration_ms,art.duration_ms);
        assert.equal(actionRoot.firstElementChild.dataset.art,artRoot.firstElementChild.dataset.art,art.id);
        const frames=[];
        for(const ratio of [0,.13,.37,.63,.91,1,.37]){
          original.seek(art.duration_ms*ratio);player.seek(action.duration_ms*ratio);
          const expected=frameMarkup(artRoot.firstElementChild);
          assert.equal(frameMarkup(actionRoot.firstElementChild),expected,art.id+' @ '+ratio);
          frames.push(expected);
        }
        assert.equal(frames[2],frames[6],art.id+' 重复定位');
        if(!artRoot.querySelector('canvas'))assert.ok(new Set(frames).size>1,art.id+' 必须仍有动作');
      }finally{original.destroy();player.destroy();}
    }
    assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('插画关联弹窗选择准确示例，关闭保持主画面；动作目录可搜索对应主体',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#stage-merge-illustration'});
  try{
    const {w}=env,d=w.document;
    for(const art of animated){
      d.querySelector(`[data-effect="${art.id}"]`).click();
      const action=actionFor(w,art),before=frameMarkup(d.getElementById('preview')),hash=w.location.hash;
      assert.match(d.getElementById('related').textContent,/插画包含的动作/);
      for(const composition of data.effects.filter(e=>e.kind==='composition'&&e.actions.includes(art.id)))
        assert.ok(d.querySelector(`#related [data-related="${composition.id}"]`),'保留插画原有的组合入口');
      d.querySelector(`#related [data-related="${action.id}"]`).click();
      assert.equal(d.getElementById('related-title').textContent,action.name);
      assert.equal(d.getElementById('related-variant').value,action.variant_id||'');
      assert.equal(d.getElementById('related-scrub').value,'0');
      d.getElementById('related-close').click();
      assert.equal(w.location.hash,hash);
      assert.equal(frameMarkup(d.getElementById('preview')),before);
      assert.equal(w.MotionRuntime.instanceCount,1);
    }
    d.querySelector('[data-kind="action"]').click();
    assert.ok(d.querySelector('[data-effect="card-compress-merge"]'));
    const actionPool=data.effects.filter(e=>e.kind==='action');
    for(const art of animated)assert.ok(w.MotionMatch.rank({...data,effects:actionPool},art.name).some(row=>art.actions.includes(row.effect.id)),art.name);
  }finally{env.close();}
});

test('既有插画动作的复制页面仅靠声明的本地源码可运行，保留所选示例',async()=>{
  const env=await environment(true,{staticPreview:true});
  try{
    for(const art of animated){
      const action=actionFor(env.w,art),html=env.w.MotionExport.previewCode(action),scripts=frameScriptsFor(action);
      assert.ok(scripts.includes(art.source.path));
      assert.ok((art.source.assets||[]).every(file=>action.source.assets?.includes(file)));
      const code=env.w.MotionExport.remotionCode(action);
      assert.ok(code.includes(action.id));assert.ok(code.includes(art.source.path));
      if(action.variant_id)assert.ok(code.includes(action.variant_id));
      const prompt=env.w.MotionExport.prompt(action,{},data);
      if(action.source.factory===art.id)assert.doesNotMatch(prompt,/视觉：近黑底/,'插画动作不得强改配色');
      const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
      w.HTMLCanvasElement.prototype.getContext=()=>null;
      w.ResizeObserver=class{observe(){}disconnect(){}};
      try{
        for(const script of w.document.querySelectorAll('script'))w.eval(script.src
          ?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
        assert.equal(w.MotionDemo.currentTime,0);w.MotionDemo.pause();
        const expected=art.id==='encore-umbrella-illustration'?action:art;
        const originalRoot=env.w.document.createElement('div'),original=env.w.MotionRuntime.create(originalRoot,expected);
        try{
          for(const ratio of [.13,.63,1]){
            original.seek(expected.duration_ms*ratio);w.MotionDemo.seek(action.duration_ms*ratio);
            assert.equal(frameMarkup(w.document.querySelector('.motion-stage')),frameMarkup(originalRoot.firstElementChild),art.id);
          }
        }finally{original.destroy();}
      }finally{w.MotionRuntime?.disposeAll();w.anime?.engine.pause();w.close();}
    }
  }finally{env.close();}
});

test('共享的三维谱面动作保留异步准备、最后定位与资源释放',async()=>{
  const env=await environment();
  try{
    const {w}=env,times=[];let disposed=0;
    w.HTMLCanvasElement.prototype.getContext=()=>({getExtension:()=>({loseContext(){}})});
    w.CompletedFactories={notes:async mode=>{
      assert.equal(mode,'hop');return {render:time=>times.push(time),dispose(){disposed++;}};
    }};
    const action=actionFor(w,definition('note-hop-illustration'));
    assert.equal(w.MotionFactories[action.source.factory].requiresPreparation,true);
    const root=w.document.getElementById('root'),draw=w.MotionKit.createRenderer(root,action);
    draw(3150);await draw.ready;assert.equal(times.at(-1),3);
    draw(0);draw(3150);assert.equal(times.at(-1),3);
    draw.destroy();assert.equal(disposed,1);assert.equal(root.firstElementChild.width,1);
  }finally{env.close();}
});
