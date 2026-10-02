// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment,data,frameMarkup} from './helpers.mjs';

const get=id=>data.effects.find(e=>e.id===id);
const ids=['striped-sun-rise','perspective-grid-flow','star-twinkle'];
const numbers=text=>(text.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} / ${expected}`);
const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/';
const source=await readFile(sourceRoot+'reel.js','utf8'),shared={window:{}};
runInNewContext(await readFile(sourceRoot+'shared.js','utf8'),shared);
const functions=source.slice(source.indexOf('const clamp ='),source.indexOf('function noise2'))+
  source.slice(source.indexOf('function pulse('),source.indexOf('function bez1('))+
  source.slice(source.indexOf('function sNeon('),source.indexOf('  // chrome logo with stacked echoes'))+'}';

// 执行原片背景绘制函数，记录坐标、渐变和描线；不创建画布或浏览器。
function original(ms){
  const rects=[],fills=[],strokes=[],clips=[],gradients=[],stack=[];let path=[];
  function gradient(kind,args){const g={kind,args,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};gradients.push(g);return g;}
  const ctx={
    createLinearGradient(...args){return gradient('linear',args);},
    createRadialGradient(...args){return gradient('radial',args);},
    save(){stack.push({fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,lineWidth:this.lineWidth});},
    restore(){Object.assign(this,stack.pop());},beginPath(){path=[];},
    rect(...args){path.push(['rect',...args]);},arc(...args){path.push(['arc',...args]);},
    moveTo(...args){path.push(['M',...args]);},lineTo(...args){path.push(['L',...args]);},
    fillRect(...args){rects.push({args,fill:this.fillStyle});},
    clip(){clips.push([...path]);},fill(){fills.push({path:[...path],fill:this.fillStyle});},
    stroke(){strokes.push({path:[...path],stroke:this.strokeStyle,width:this.lineWidth});}
  };
  const sandbox={ctx,W:1920,H:1080,VERT:false,TAU:Math.PI*2,S:shared.window.SHARED};
  runInNewContext(functions+';globalThis.draw=sNeon;',sandbox);sandbox.draw(ms/1000,10+ms/1000);
  return {rects,fills,strokes,clips,gradients};
}

test('霓虹三层逐帧对应原太阳、网格和星点的几何、配色及节拍',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),effect=get('neon-horizon');
    const player=w.MotionRuntime.create(root,effect),part=name=>root.querySelector(`[data-part="${name}"]`);
    assert.equal(effect.duration_ms,6000);assert.equal(effect.timing,undefined);
    assert.equal(root.querySelectorAll('[data-star]').length,140);
    for(const time of [0,170,499,500,730,1299,1300,2200,4600,5999,6000]){
      player.seek(time);const ref=original(time),circle=ref.fills[0].path[0];
      near(+part('sun').getAttribute('cx'),circle[1]);near(+part('sun').getAttribute('cy'),circle[2]);near(+part('sun').getAttribute('r'),circle[3]);
      const glow=ref.gradients.find(g=>g.kind==='radial');
      near(+part('glow').getAttribute('cy'),glow.args[1]);near(+part('glow').getAttribute('r'),glow.args[5]);
      near(+root.querySelector('radialGradient stop:nth-child(2)').getAttribute('offset'),glow.args[2]/glow.args[5]);
      near(+part('sun-top').getAttribute('height'),ref.clips[0][0][4]);
      const offset=numbers(part('sun-bands').getAttribute('transform'))[1];
      const bands=[...part('sun-bands').getAttribute('d').matchAll(/M0 ([\d.]+)h1920v([\d.]+)h-1920Z/g)].map(([,y,h])=>({y:+y,height:+h}));
      assert.equal(bands.length,14);
      const visibleBands=bands.filter(b=>b.y+offset<=640);
      assert.equal(visibleBands.length,ref.clips[0].length-1);
      visibleBands.forEach((b,i)=>{near(b.y+offset,ref.clips[0][i+1][2]);near(b.height,ref.clips[0][i+1][4]);});
      assert.deepEqual(ref.clips[1],[['rect',0,0,1920,640]]);
      for(const pass of ['grid-glow','grid-core']){
        const node=part(pass),r=ref.strokes[pass==='grid-glow'?0:1];
        near(+node.getAttribute('stroke-width'),r.width);near(+node.getAttribute('stroke-opacity'),numbers(r.stroke)[3]);
        assert.equal(root.querySelector('[data-layer="grid"]').getAttribute('stroke'),'#ff2bd6');
        const actual=numbers(part('grid-path').getAttribute('d')),expected=r.path.flatMap(p=>p.slice(1));
        assert.equal(actual.length,expected.length);actual.forEach((v,i)=>near(v,expected[i]));
      }
      const stars=ref.rects.filter(r=>typeof r.fill==='string'&&r.fill.startsWith('rgba(255,255,255,'));
      [...root.querySelectorAll('[data-star]')].forEach((node,i)=>{
        ['x','y','width','height'].forEach((key,j)=>near(+node.getAttribute(key),stars[i].args[j]));
        near(+node.getAttribute('opacity'),numbers(stars[i].fill)[3]);
      });
      const linear=[...root.querySelectorAll('linearGradient')];
      for(const [i,sourceIndex] of [[0,0],[1,3],[2,2]]){
        const actual=[...linear[i].children].map(stop=>[+(stop.getAttribute('offset')||0),stop.getAttribute('stop-color')]);
        assert.deepEqual(actual,ref.gradients[sourceIndex].stops);
      }
    }
    player.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('太阳条纹直接构成有效裁剪图形，圆心以下的条纹保留至地平线',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    for(const id of ['striped-sun-rise','neon-horizon']){
      const player=w.MotionRuntime.create(root,get(id));
      // clipPath 只接受直接的图形等元素，不能把分组误当成可见的裁剪内容。
      for(const clip of root.querySelectorAll('clipPath')){
        for(const node of clip.children)assert.ok(['rect','path','circle','ellipse','line','polyline','polygon','text','use'].includes(node.localName),`${id}：不支持的裁剪内容 ${node.localName}`);
      }
      const stripes=root.querySelector('[data-part="sun-bands"]'),sun=root.querySelector('[data-part="sun"]');
      assert.equal(stripes.localName,'path');assert.equal(stripes.parentNode.localName,'clipPath');
      assert.equal(sun.getAttribute('clip-path'),`url(#${stripes.parentNode.id})`);
      for(const time of [1300,2600,4600,6000]){
        player.seek(time);
        const ref=original(time),cy=+sun.getAttribute('cy'),r=+sun.getAttribute('r');
        const visible=ref.clips[0].slice(1).filter(b=>b[2]<640&&b[4]>0);
        assert.ok(visible.length>=4,'圆心以下应仍有至少四道条纹');
        assert.ok(visible.every(b=>b[2]>=cy&&b[2]<cy+r));
        assert.ok((640-(cy-r))/(2*r)>.75,'地平线以上应露出超过四分之三圆盘高度');
      }
      player.destroy();
    }
  }finally{env.close();}
});

test('独立动作与组合共用原位图层，不建立无关图形，回退定位稳定且同帧不重写',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document,root=d.createElement('div'),whole=w.MotionRuntime.create(root,get('neon-horizon'));
    const same=markup=>markup.replace(/motion-neon-\d+/g,'motion-neon-fixed');
    for(const [id,layer] of [['striped-sun-rise','sun'],['perspective-grid-flow','grid'],['star-twinkle','stars']]){
      const host=d.createElement('div'),player=w.MotionRuntime.create(host,get(id));
      assert.equal(host.querySelectorAll('[data-layer]').length,1);
      assert.equal(host.querySelector('[data-layer]').dataset.layer,layer);
      for(const time of [0,170,730,1300,2600,6000]){
        player.seek(time);whole.seek(time);
        assert.equal(same(host.querySelector('[data-layer]').outerHTML),same(root.querySelector(`[data-layer="${layer}"]`).outerHTML));
        for(const part of host.querySelectorAll('[data-part]')){
          assert.equal(same(part.outerHTML),same(root.querySelector(`[data-part="${part.dataset.part}"]`).outerHTML));
        }
      }
      const markup=host.innerHTML;player.seek(0);player.seek(6000);assert.equal(host.innerHTML,markup);
      const observer=new w.MutationObserver(()=>{});observer.observe(host,{attributes:true,childList:true,subtree:true});
      player.seek(6000);assert.equal(observer.takeRecords().length,0);observer.disconnect();player.destroy();
    }
    const host=d.createElement('div'),other=w.MotionRuntime.create(host,get('neon-horizon'));
    const allIds=[...root.querySelectorAll('[id]'),...host.querySelectorAll('[id]')].map(n=>n.id);
    assert.equal(allIds.length,new Set(allIds).size,'同时建立缩略图不能共用裁剪标识');
    other.destroy();whole.destroy();assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.close();}
});

test('霓虹组合能逐层查看，弹窗独立示例与缩略图一致且不替换主组合',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#neon-horizon'});
  try{
    const {w}=env,d=w.document;
    assert.deepEqual(get('neon-horizon').actions,ids);
    assert.equal(d.getElementById('composition-panel').hidden,false);
    assert.deepEqual([...d.querySelectorAll('[data-composition-layer]')].map(n=>n.dataset.compositionLayer),['stars','sun','grid']);
    assert.doesNotMatch(d.getElementById('composition-status').textContent,/五层|纸条/);
    d.querySelector('[data-composition-mode="solo"]').click();d.querySelector('[data-composition-layer="sun"]').click();
    assert.equal(d.querySelector('#preview [data-layer="stars"]').getAttribute('display'),'none');
    assert.equal(d.querySelector('#preview [data-layer="sun"]').getAttribute('display'),null);
    const scrub=d.getElementById('scrub');scrub.value=500;scrub.dispatchEvent(new w.Event('input'));
    assert.equal(d.querySelector('#preview [data-layer="stars"]').getAttribute('display'),'none');
    d.getElementById('composition-full').click();
    const main=d.querySelector('#preview .motion-stage'),markup=frameMarkup(main),hash=w.location.hash,time=scrub.value;
    assert.deepEqual([...d.querySelectorAll('#related [data-related]')].map(n=>n.dataset.related),get('neon-horizon').actions);
    for(const [layer,id] of [['sun','striped-sun-rise'],['grid','perspective-grid-flow'],['stars','star-twinkle']]){
      d.querySelector(`#related [data-related="${id}"]`).click();
      assert.equal(d.getElementById('related-dialog').open,true);
      assert.equal(w.MotionRuntime.runningCount,1);
      const popupScrub=d.getElementById('related-scrub');popupScrub.value=get(id).preview_ms/get(id).duration_ms*1000;popupScrub.dispatchEvent(new w.Event('input'));
      const thumb=d.createElement('div');d.body.append(thumb);w.MotionThumbs.attach(thumb,get(id));env.reveal();
      assert.equal(d.getElementById('related-title').textContent,get(id).name);
      assert.equal(frameMarkup(thumb.querySelector('.motion-stage')),frameMarkup(d.querySelector('#related-preview .motion-stage')));
      w.MotionThumbs.release(thumb);thumb.remove();
      assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(w.MotionRuntime.runningCount,0);
      assert.equal(d.getElementById('preview-title').textContent,get('neon-horizon').name);
      assert.equal(d.getElementById('composition-panel').hidden,false);
      assert.equal(w.location.hash,hash);assert.equal(d.querySelector('#preview .motion-stage'),main);
      assert.equal(frameMarkup(main),markup);assert.equal(scrub.value,time);
      d.getElementById('related-close').click();
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
    }
    env.reveal();const host=d.createElement('div'),player=w.MotionRuntime.create(host,get('neon-horizon'));player.seek(get('neon-horizon').preview_ms);
    assert.equal(frameMarkup(d.querySelector('[data-effect="neon-horizon"] .thumb .motion-stage')),frameMarkup(host.firstElementChild));player.destroy();
    const prompt=d.getElementById('prompt').textContent;
    for(const name of ['星点闪烁','条纹太阳','透视网格'])assert.ok(prompt.includes(name));
    for(const id of ids)assert.equal(w.MotionMatch.rank(data,get(id).name)[0].effect.id,id);
    w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});
