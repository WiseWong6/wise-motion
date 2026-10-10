// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {environment,data,themed,sourceDefinition} from './helpers.mjs';

test('定位公式保留原词点、两步合行和细线，缩略图完整，重播及倒拖保持同一批文字',async()=>{
  const source='/Users/wisewong/Documents/Developer/wise-video/resume-tutorial/wise-resume-writing/';
  const original=new JSDOM(await readFile(source+'editions/compact/preview.html','utf8'));
  const cues=JSON.parse(await readFile(source+'editions/compact/timing.json','utf8')).cues;
  const point=(id,word)=>{const cue=cues.find(c=>c.id===id);return cue.start+cue.charAt[cue.text.indexOf(word)];};
  const anchor=point('s020','几年'),demo=seconds=>120+(seconds-anchor)*500;
  const clamp=p=>Math.min(1,Math.max(0,p));
  const ease=p=>{p=clamp(p);return p<.5?4*p**3:1-(-2*p+2)**3/2;};
  const smooth=p=>1-(1-clamp(p))**3;
  const pose=text=>text.match(/[-\d.]+/g).map(Number);
  const close=(actual,expected,message)=>assert.ok(Math.abs(Number(actual)-expected)<1e-8,message);
  const env=await environment(true);
  try{
    const {w}=env,d=w.document,effect=sourceDefinition(data.effects.find(e=>e.id==='formula-evolve'));await env.reveal('[data-effect="formula-evolve"] .thumb');
    assert.equal(effect.category,'writing');assert.equal(effect.loop,false);
    assert.equal(w.MotionMatch.rank(data,effect.name)[0].effect.id,effect.id);
    const card=d.querySelector('[data-effect="formula-evolve"]'),thumb=card.querySelector('.thumb');
    assert.equal(thumb.querySelectorAll('text').length,7);
    assert.ok([...thumb.querySelectorAll('[data-formula-term]')].every(n=>n.getAttribute('opacity')==='1'));
    assert.equal(thumb.querySelector('[data-part="underline-stroke"]').getAttribute('stroke-dashoffset'),'0');
    card.click();assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect);
    const part=id=>root.querySelector(`[data-part="${id}"]`);
    const terms=['years','domain','audience','experience'].map(id=>({id,node:original.window.document.querySelector(`[data-object="formula-${id}"]`)}));
    const texts=[...root.querySelectorAll('text')];
    assert.equal(root.querySelector('svg > g').getAttribute('font-weight'),'300');
    assert.equal(root.querySelector('svg > g').getAttribute('transform'),'translate(104 -68) scale(.4)');
    for(const term of terms){
      const expectedTexts=[...term.node.querySelectorAll('text')],actualTexts=[...part('term-'+term.id).querySelectorAll('text')];
      assert.equal(actualTexts.length,expectedTexts.length);
      expectedTexts.forEach((expected,i)=>{
        assert.equal(actualTexts[i].textContent,expected.textContent);
        for(const name of ['x','y','fill','text-anchor'])assert.equal(actualTexts[i].getAttribute(name),(name==='fill'?themed(expected.getAttribute(name)):expected.getAttribute(name)),'保留原公式图形并适配主题颜色');
        close(Number(actualTexts[i].getAttribute('font-size'))*.4,24,'公式统一为标题字号，图形坐标不变');
      });
    }
    // 直接用定稿的词点和每个节点的起止状态计算期望值，区分横移与合行。
    for(const ms of [0,120,175,750,800,1430,1485,1540,1714,1772.75,1949,2015.0166666666664,2142.5166666666664,2800,effect.preview_ms,3400,1000]){
      draw(ms);
      for(const {id,node} of terms){
        const enter=demo(point(node.dataset.beat,node.dataset.word));
        close(part('term-'+id).getAttribute('opacity'),smooth((ms-enter)/(Number(node.dataset.motionDuration)*500)),'显现保持原来的不等间距');
        for(const expected of node.querySelectorAll('[data-evolve]')){
          const steps=JSON.parse(expected.dataset.evolve);let position=pose(steps[0].from.attr.transform);
          for(const step of steps){
            const at=demo(point(step.cue,step.word));if(ms<at)break;
            const p=ease((ms-at)/(step.duration*500)),from=pose(step.from.attr.transform),to=pose(step.to.attr.transform);
            position=from.map((v,i)=>v+(to[i]-v)*p);
          }
          const actual=pose(part('pose-'+expected.dataset.object.replace('formula-','').replace('-value-to-top','').replace('-to-top','')).getAttribute('transform'));
          position.forEach((value,i)=>close(actual[i],value,'不能直接把竖排变成横排'));
        }
      }
      const extent=original.window.document.querySelector('[data-object="extent"]');
      const p=smooth((ms-demo(point(extent.dataset.beat,extent.dataset.word)))/(Number(extent.dataset.motionDuration)*500));
      close(part('underline').getAttribute('opacity'),p);
      close(part('underline-stroke').getAttribute('stroke-dashoffset'),1-p);
    }
    const originalLine=original.window.document.querySelector('[data-object="extent"] path');
    for(const name of ['d','stroke','stroke-width','stroke-linecap','stroke-linejoin'])assert.equal(part('underline-stroke').getAttribute(name),(name==='stroke'?themed(originalLine.getAttribute(name)):originalLine.getAttribute(name)));
    close(part('underline-stroke').getAttribute('opacity'),originalLine.getAttribute('opacity'));
    draw(1830);const halfway=root.innerHTML;draw(3400);draw(0);draw(1830);assert.equal(root.innerHTML,halfway);
    assert.ok(texts.every(n=>root.contains(n)),'不能换成另一份文字模拟合行');
    draw(effect.preview_ms);const final=root.innerHTML;draw(3400);assert.equal(root.innerHTML,final);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});
    draw(3400);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelector('rect,image,video,canvas,filter'),null,'只纳入公式，不带原场景背景与柱图');
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='resume-evolve'));
    assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id==='resume-evolve'));
    assert.ok(data.effects.some(e=>e.id==='layout-reorder'),'保留已有的布局重排');
    const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
    for(const file of cross.rules['resume-evolve'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256,'原工程保持只读');
  }finally{env.w.MotionThumbs.disposeAll();env.close();original.window.close();}
});
