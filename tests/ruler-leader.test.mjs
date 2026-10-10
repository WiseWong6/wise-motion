// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {environment,data,themed,sourceDefinition} from './helpers.mjs';

test('刻度尺和引线标注对照原组件保持逐格、三档刻度、圆点轻弹与标签接出',async()=>{
  const source='/Users/wisewong/Documents/Developer/wise-video/Naive-NO.5-Flash/promo-atelier/';
  const require=createRequire(source+'package.json'),React=require('react');
  const {transformSync}=require('esbuild'),{renderToStaticMarkup}=require('react-dom/server');
  const load=async(file,dependencies={})=>{
    const compiled=transformSync(await readFile(source+'src/'+file,'utf8'),{loader:file.endsWith('.tsx')?'tsx':'ts',format:'cjs',jsx:'transform'}).code;
    const module={exports:{}};
    vm.runInNewContext('(function(require,module,exports){'+compiled+'\n})',{}, {filename:file})(id=>dependencies[id]||require(id),module,module.exports);
    return module.exports;
  };
  const theme=await load('theme.ts'),original=await load('atelier/draw.tsx',{'../theme':theme});
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;await env.reveal('[data-effect="ruler-ticks"] .thumb,[data-effect="leader-callout"] .thumb');
    const sourceAt=(Component,props)=>{
      const host=d.createElement('div');host.innerHTML=renderToStaticMarkup(React.createElement('svg',null,React.createElement(Component,props)));return host;
    };
    const close=(actual,expected,tolerance=1e-5)=>assert.ok(Math.abs(Number(actual)-Number(expected))<tolerance,`${actual} 与原组件 ${expected} 不同`);
    const states=new Map();
    for(const id of ['ruler-ticks','leader-callout']){
      const effect=sourceDefinition(data.effects.find(e=>e.id===id)),root=d.createElement('div'),draw=w.MotionFactories[id](root,w.MotionKit,effect);
      assert.equal(effect.category,'data');assert.equal(effect.loop,false);
      assert.equal(w.MotionMatch.rank(data,effect.name)[0].effect.id,id);
      const card=d.querySelector(`[data-effect="${id}"]`),thumb=card.querySelector('.thumb');
      card.click();assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,id);
      if(id==='ruler-ticks')assert.equal(thumb.querySelectorAll('[data-ruler-tick][visibility="visible"]').length,41);
      else assert.equal(thumb.querySelector('[data-part="leader-label"]').textContent,'N = 50');
      const part=name=>root.querySelector(`[data-part="${name}"]`);
      for(const ms of [0,150,151,220,350,500,700,900,1100,1800,3000]){
        draw(ms);
        if(id==='ruler-ticks'){
          const q=theme.tween((ms-150)*30/1000,0,26,0,1,theme.inOut);
          const src=sourceAt(original.Scale,{x:100,y:174,length:440,step:11,every:10,p:q,stroke:theme.hair,opacity:.9,labels:i=>String(i*10)});
          const visible=[...root.querySelectorAll('[data-ruler-tick][visibility="visible"]')],expected=[...src.querySelectorAll('svg > g > g')];
          assert.equal(visible.length,expected.length);
          assert.equal(part('ruler').getAttribute('visibility'),q>0?'visible':'hidden');
          if(q>0){
            close(part('ruler').getAttribute('opacity'),src.querySelector('svg > g').getAttribute('opacity'));
            // 两个曲线求值器的小数精度不同，底线终点允许千分之一像素差。
            close(part('ruler-base').getAttribute('d').split('H')[1],src.querySelector('path').getAttribute('d').split('H')[1],.001);
            for(let i=0;i<visible.length;i++){
              for(const key of ['d','stroke','stroke-width'])assert.equal(visible[i].querySelector('path').getAttribute(key),(key==='stroke'?themed(expected[i].querySelector('path').getAttribute(key)):expected[i].querySelector('path').getAttribute(key)));
              assert.equal(visible[i].querySelector('text')?.textContent,expected[i].querySelector('text')?.textContent);
            }
          }
        }else{
          const q=theme.tween((ms-150)*30/1000,0,14);
          const src=sourceAt(original.Leader,{x:210,y:228,dx:90,dy:-90,run:70,size:14,p:q,label:'N = 50',stroke:theme.graphite});
          assert.equal(part('leader').getAttribute('visibility'),q>0?'visible':'hidden');
          assert.equal(part('leader-label').textContent,src.querySelector('text')?.textContent||'');
          if(q>0){
            const expected=src.querySelector('svg > g > g'),scale=node=>node.getAttribute('transform').match(/scale\(([^)]+)\)/)[1];
            close(scale(part('leader-node')),scale(expected));
            assert.equal(part('leader-node').querySelector('circle').getAttribute('fill'),themed(expected.querySelector('circle').getAttribute('fill')));
            assert.equal(part('leader-node').querySelector('circle').getAttribute('r'),expected.querySelector('circle').getAttribute('r'));
            const line=src.querySelector('path');
            for(const key of ['d','stroke','stroke-linecap','stroke-linejoin','pathLength','stroke-dasharray'])assert.equal(part('leader-line').getAttribute(key),(key==='stroke'?themed(line.getAttribute(key)):line.getAttribute(key)));
            close(part('leader-line').getAttribute('stroke-width'),line.getAttribute('stroke-width'));
            close(part('leader-line').getAttribute('stroke-dashoffset'),line.getAttribute('stroke-dashoffset'));
          }
        }
      }
      assert.ok([...root.querySelectorAll('text')].every(n=>n.getAttribute('font-weight')==='700'));
      draw(350);const middle=root.innerHTML;draw(3000);draw(0);draw(350);assert.equal(root.innerHTML,middle);
      draw(1800);const final=root.innerHTML;draw(3000);draw(6000);assert.equal(root.innerHTML,final);
      const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});draw(3000);
      assert.equal(observer.takeRecords().length,0);observer.disconnect();
      assert.equal(root.querySelector('canvas,video,image,filter'),null);states.set(id,root);
    }
    const ruler=states.get('ruler-ticks');
    assert.equal(ruler.querySelectorAll('[data-ruler-tick] text').length,5);
    assert.deepEqual([0,1,5,10].map(i=>ruler.querySelector(`[data-ruler-tick="${i}"] path`).getAttribute('d').split('v')[1]),['12','5','8','12']);
    const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
    for(const id of ['naive-scale-ticks','naive-leader-callout']){
      assert.ok(w.MotionHistory.excluded.some(e=>e.id===id));assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id===id));
      for(const file of cross.rules[id].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
    }
    assert.ok(data.effects.some(e=>e.id==='dimension-line'));assert.ok(data.effects.some(e=>e.id==='stroke-draw'));
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
