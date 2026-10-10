// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {history,state} from '../scripts/history.mjs';
import {environment,data,sourceDefinition,motionTime,frameMarkup} from './helpers.mjs';
const effect=data.effects.find(e=>e.id==='theme-color-cycle');
const cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const sourceFile=cross.rules['theme-switch'].migration.files.find(f=>f.file.endsWith('.js')).file;
const source=await readFile(sourceFile,'utf8');
const colors=vm.runInNewContext('('+source.match(/var customColors = (\[[\s\S]*?\n  \]);/)[1]+')');

test('六色、色名与选中项对照原组件，换色边界同步且固定几何不变',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document,root=d.getElementById('root'),demo=d.createElement('div');
    demo.innerHTML='<strong class="cta-color-name"></strong><span class="cta-color-token"></span>'+colors.map(()=>'<i class="cta-custom-option"></i>').join('');
    const context=vm.createContext({demo,customColors:colors,colorState:{time:0},all:(root,selector)=>[...root.querySelectorAll(selector)]});
    vm.runInContext(source.match(/var changeStart = [^\n]+/)[0]+source.slice(source.indexOf('      function paintCustomColor()'),source.indexOf('      paintCustomColor();')),context);
    const player=w.MotionRuntime.create(root,sourceDefinition(effect));
    const geometry=()=>[...root.querySelectorAll('rect,path,text,g')].map(n=>[n.localName,...['x','y','width','height','d','transform','font-size'].map(a=>n.getAttribute(a))]);
    const first=geometry(),nodes=[...root.querySelectorAll('*')];
    const boundaries=colors.map((_,i)=>(context.changeStart+i*context.changeEvery)*1000);
    for(const ms of [0,1700,...boundaries.flatMap(t=>[t-.01,t,t+.01,t+100])]){
      player.seek(ms);context.colorState.time=ms/1000;context.paintCustomColor();
      assert.equal(root.querySelector('[data-accent]').getAttribute('fill'),demo.dataset.activeColor);
      assert.equal(root.querySelector('[data-part="name"]').textContent,demo.querySelector('.cta-color-name').textContent);
      assert.equal(root.querySelector('[data-part="hex"]').textContent,demo.querySelector('.cta-color-token').textContent);
      const options=[...root.querySelectorAll('[data-option]')];
      assert.deepEqual(options.map(n=>n.dataset.active),[...demo.querySelectorAll('.cta-custom-option')].map(n=>n.dataset.active));
      assert.equal(options.filter(n=>n.dataset.active==='true').length,1);
      options.forEach((n,i)=>{
        assert.equal(n.querySelector('[data-active-mark]').getAttribute('opacity'),n.dataset.active==='true'?'1':'0');
        assert.equal(n.querySelector('rect:not([data-active-mark])').getAttribute('fill'),colors[i].hex);
      });
      assert.deepEqual(geometry(),first);assert.deepEqual([...root.querySelectorAll('*')],nodes);
    }
    player.seek(1700);const end=root.innerHTML;player.seek(600);player.seek(1700);assert.equal(root.innerHTML,end);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    player.seek(1700);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelectorAll('image,video,canvas').length,0);
    player.destroy();
    // 目录只裁出换色段，六种颜色仍各占 0.20 秒，开头和末尾额外留停顿。
    const canonical=w.MotionRuntime.create(root,effect);
    colors.forEach((color,i)=>{canonical.seek(motionTime(effect,420+i*200));assert.equal(root.querySelector('[data-part="hex"]').textContent,color.hex);});
    canonical.seek(effect.duration_ms);assert.equal(root.querySelector('[data-part="name"]').textContent,'香槟金');
  }finally{env.close();}
});

test('换色单独归入强调与色彩，和换图、平滑变色可分别搜索，历史去重且原工程只读',async()=>{
  const historical=await history(data);assert.equal(effect.category,'attention');
  assert.ok(!historical.recipes.some(e=>e.history_id==='theme-switch'));assert.ok(historical.excluded.some(e=>e.id==='theme-switch'));
  for(const file of cross.rules['theme-switch'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  const env=await environment(true,{staticPreview:true,hash:'#theme-color-cycle'});
  try{
    const {w}=env,d=w.document;await env.reveal('[data-effect="theme-color-cycle"] .thumb');assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const [query,id] of [[effect.name,effect.id],['主题连续换色',effect.id],['快速切换闪烁','rapid-cut'],['对象平滑换色','color-evolve']])assert.equal(w.MotionMatch.rank(data,query)[0].effect.id,id);
    const thumb=d.querySelector('[data-effect="theme-color-cycle"] .thumb .motion-stage'),root=d.createElement('div');
    const player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));player.destroy();
    assert.match(d.getElementById('code').textContent,/catalog\/effects\/theme-color-cycle\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
