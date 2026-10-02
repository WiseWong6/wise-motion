// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {data,environment,frameMarkup} from './helpers.mjs';

const get=id=>data.effects.find(e=>e.id===id);
const numbers=text=>(text.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} / ${b}`);
const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/';
const source=await readFile(sourceRoot+'reel.js','utf8'),shared={window:{}};
runInNewContext(await readFile(sourceRoot+'shared.js','utf8'),shared);
const sourceMath=source.slice(source.indexOf('const clamp ='),source.indexOf('function noise2'))+
  source.slice(source.indexOf('function pulse('),source.indexOf('function bez1('));
const sourceType=source.slice(source.indexOf("  const word = 'BROADCAST';"),source.indexOf('  // lens flare'))+
  source.slice(source.indexOf('  // neon year'),source.indexOf('  const cap = VERT ?'));

// 只记录原绘制命令和样式；不运行浏览器，不截图。
function original(ms){
  function context(){
    const calls=[],stack=[];
    const ctx={calls,tx:0,ty:0,sx:1,sy:1,globalAlpha:1,
      save(){stack.push(Object.fromEntries(Object.entries(this).filter(([key,value])=>key!=='calls'&&typeof value!=='function')));},
      restore(){const saved=stack.pop();for(const key of Object.keys(this))if(key!=='calls'&&typeof this[key]!=='function')delete this[key];Object.assign(this,saved);},
      translate(x,y){this.tx+=x*this.sx;this.ty+=y*this.sy;},scale(x,y){this.sx*=x;this.sy*=y;},
      createLinearGradient(...args){return {args,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};},
      clearRect(){},fillRect(){},
      fillText(text,x,y){calls.push({kind:'fill',text,x,y,tx:this.tx,ty:this.ty,sx:this.sx,sy:this.sy,font:this.font,fill:this.fillStyle});},
      strokeText(text,x,y){calls.push({kind:'stroke',text,x,y,tx:this.tx,ty:this.ty,sx:this.sx,sy:this.sy,font:this.font,alpha:this.globalAlpha,width:this.lineWidth,stroke:this.strokeStyle,blur:this.shadowBlur,shadow:this.shadowColor});},
      drawImage(image,x,y){calls.push({kind:'image',x,y,alpha:this.globalAlpha});}
    };return ctx;
  }
  const ctx=context(),octx=context(),sandbox={ctx,octx,off:{height:420},W:1920,H:1080,VERT:false,TAU:Math.PI*2,S:shared.window.SHARED};
  runInNewContext(sourceMath+'\nfunction draw(lt,t){const bSize=200,ty=500,kp=pulse(t,7);'+sourceType+'}\nglobalThis.draw=draw;',sandbox);
  sandbox.draw(ms/1000,10+ms/1000);return {main:ctx.calls,buffer:octx.calls};
}

test('金属主字与六层描边的进场时间、大小、间距和透明度逐项对应源码',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,get('chrome-outline-echo'));
    const echoes=[...root.querySelectorAll('[data-echo]')];assert.deepEqual(echoes.map(n=>+n.dataset.echo),[6,5,4,3,2,1]);
    assert.equal(root.querySelector('[data-layer="chrome"]').dataset.font,'AvenirNext-HeavyItalic');
    assert.equal(root.querySelector('[data-layer="chrome"]').getAttribute('aria-label'),'BROADCAST');
    for(const clip of root.querySelectorAll('clipPath'))for(const child of clip.children){
      assert.ok(['rect','path','circle','ellipse','polygon'].includes(child.localName),'裁剪区域必须直接包含图形，不能再嵌套分组');
    }
    for(const time of [0,300,350,375,500,900,1300,1400,1550,1600,2400]){
      player.seek(time);const ref=original(time),strokes=ref.main.filter(c=>c.text==='BROADCAST'&&c.width===2);
      const visible=echoes.filter(n=>+n.getAttribute('opacity')>0);assert.equal(visible.length,strokes.length);
      visible.forEach((node,i)=>{
        const r=strokes[i],t=numbers(node.getAttribute('transform'));
        near(t[0],r.tx);near(t[1],r.ty);near(t[2],r.sx);near(+node.getAttribute('opacity'),r.alpha);
        assert.equal(node.getAttribute('stroke'),r.stroke);near(+node.getAttribute('stroke-width'),r.width);
      });
      const fill=ref.buffer.find(c=>c.kind==='fill'),outline=root.querySelector('[data-part="chrome-outline"]');
      if(!fill){near(+outline.getAttribute('opacity'),0);continue;}
      const gradient=root.querySelector('linearGradient[id$="-chrome"]');
      assert.deepEqual([...gradient.children].map(n=>[+n.getAttribute('offset'),n.getAttribute('stop-color')]),fill.fill.stops);
      assert.deepEqual([+gradient.getAttribute('x1'),+gradient.getAttribute('y1'),+gradient.getAttribute('x2'),+gradient.getAttribute('y2')],fill.fill.args);
      for(const [index,name] of ['back','front'].entries()){
        const node=root.querySelector(`[data-part="chrome-${name}"]`),t=numbers(node.getAttribute('transform')),image=ref.main.filter(c=>c.kind==='image')[index];
        near(t[0],fill.tx);near(t[1],fill.ty);near(t[2],fill.sx);near(+node.getAttribute('opacity'),image.alpha);
        assert.deepEqual(numbers(node.parentNode.parentNode.getAttribute('transform')),[image.x,image.y]);
        const clip=root.querySelector('clipPath[id$="-chrome-buffer"] rect');near(+clip.getAttribute('width'),1920);near(+clip.getAttribute('height'),420);
      }
      const originalOutline=ref.main.find(c=>c.text==='BROADCAST'&&c.width===1.5),t=numbers(outline.getAttribute('transform'));
      near(t[0],originalOutline.tx);near(t[1],originalOutline.ty);near(t[2],originalOutline.sx);near(+outline.getAttribute('opacity'),originalOutline.alpha);
      near(+outline.getAttribute('stroke-width'),originalOutline.width);near(+outline.getAttribute('stroke-opacity'),.9);
    }
    player.seek(1600);assert.ok(echoes.every(n=>+n.getAttribute('opacity')>0),'到位后不能让拖影消失');
    assert.deepEqual(echoes.map(n=>numbers(n.getAttribute('transform'))[1]),[566,555,544,533,522,511]);
    assert.equal(root.querySelectorAll('text').length,0,'原固定字形无需等待字体加载');
    player.destroy();
  }finally{env.close();}
});

test('霓虹字启动的每一格明灭与原片相同，之后保持点亮，辉光跟随原节拍',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,get('neon-type-flicker'));
    const lamp=root.querySelector('[data-part="neon-lamp"]'),blur=root.querySelector('[data-part="neon-blur"]');let on=0,off=0;
    assert.equal(root.querySelector('[data-layer="neon"]').dataset.font,'Futura-Bold');assert.equal(lamp.getAttribute('stroke-width'),'3');
    for(const time of [0,900,...Array.from({length:24},(_,i)=>901+i*1000/60),1300,1400,1500,1750,2000,3000]){
      player.seek(time);const ref=original(time).main.find(c=>c.text==='1981'),lit=lamp.getAttribute('visibility')==='visible';
      assert.equal(lit,!!ref,String(time));
      if(time>900&&time<1300){if(lit)on++;else off++;}
      if(ref){near(+blur.getAttribute('stdDeviation')*2,ref.blur);assert.equal(lamp.firstElementChild.getAttribute('stroke'),ref.shadow);assert.equal(lamp.lastElementChild.getAttribute('stroke'),ref.stroke);}
      if(time>=1300)assert.ok(lit,'启动窗口后不再熄灭');
    }
    assert.ok(on>0&&off>0,'启动阶段必须有真正的亮灭变化');
    for(const time of [0,980,1100,1500]){
      player.seek(time);const before=root.innerHTML;player.seek(3000);player.seek(time);assert.equal(root.innerHTML,before,'隐藏状态也应能准确回退');
    }
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});player.seek(1500);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    player.destroy();
  }finally{env.close();}
});

test('片头共用六个真实动作的绘制，独立年份只居中，不改变字形和时序',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document,root=d.createElement('div'),whole=w.MotionRuntime.create(root,get('neon-title-sequence'));
    const same=s=>s.replace(/motion-neon-\d+/g,'neon-fixed');
    for(const [id,layer] of [['striped-sun-rise','sun'],['perspective-grid-flow','grid'],['star-twinkle','stars'],['chrome-outline-echo','chrome'],['neon-type-flicker','neon'],['cross-flare-travel','flare']]){
      const host=d.createElement('div'),effect=get(id),player=w.MotionRuntime.create(host,effect);
      assert.equal(host.querySelectorAll('[data-layer]').length,1);
      for(const time of [0,500,980,1100,1500,effect.duration_ms]){
        player.seek(time);whole.seek(time);
        const single=host.querySelector(`[data-layer="${layer}"]`).cloneNode(true),combined=root.querySelector(`[data-layer="${layer}"]`).cloneNode(true);
        if(layer==='neon'){single.removeAttribute('transform');combined.removeAttribute('transform');}
        assert.equal(same(single.outerHTML),same(combined.outerHTML));
        if(layer==='chrome'||layer==='neon')for(const use of host.querySelectorAll('use[href]')){
          const path=host.querySelector(use.getAttribute('href')),other=root.querySelector('[id$="'+path.id.replace(/^motion-neon-\d+/,'')+'"]');
          assert.equal(path.getAttribute('d'),other.getAttribute('d'));assert.ok(path.getAttribute('d').length>300);
        }
      }
      player.destroy();
    }
    whole.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('霓虹文字在弹窗中对照独立动作，保持主组合拆解状态并回收播放实例',async()=>{
  const env=await environment(true,{hash:'#neon-title-sequence'});
  try{
    const {w}=env,d=w.document,parts=['stars','sun','grid','chrome','neon','flare'];
    assert.equal(d.getElementById('preview-title').textContent,'霓虹文字片头');
    assert.deepEqual([...d.querySelectorAll('[data-composition-layer]')].map(n=>n.dataset.compositionLayer),parts);
    d.querySelector('[data-composition-mode="solo"]').click();d.querySelector('[data-composition-layer="chrome"]').click();
    for(const node of d.querySelectorAll('#preview [data-layer]'))assert.equal(node.getAttribute('display')==='none',node.dataset.layer!=='chrome');
    assert.doesNotMatch(d.getElementById('prompt').textContent,/完整组合另保留原边角标注/);
    const main=d.querySelector('#preview .motion-stage'),markup=frameMarkup(main),hash=w.location.hash,time=d.getElementById('scrub').value;
    for(const [layer,id] of [['chrome','chrome-outline-echo'],['neon','neon-type-flicker']]){
      d.querySelector(`#related [data-related-layer="${layer}"]`).click();
      assert.equal(d.getElementById('related-dialog').open,true);
      for(const node of d.querySelectorAll('#related-preview [data-layer]'))assert.equal(node.getAttribute('display')==='none',node.dataset.layer!==layer);
      d.querySelector(`#related-dialog [data-related-example="${id}"]`).click();
      const thumb=d.createElement('div');d.body.append(thumb);w.MotionThumbs.attach(thumb,get(id));env.reveal();
      assert.equal(d.getElementById('related-title').textContent,get(id).name);
      assert.equal(frameMarkup(thumb.querySelector('.motion-stage')),frameMarkup(d.querySelector('#related-preview .motion-stage')));
      w.MotionThumbs.release(thumb);thumb.remove();
      assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(w.MotionRuntime.runningCount,0);
      assert.equal(d.getElementById('preview-title').textContent,'霓虹文字片头');
      assert.equal(w.location.hash,hash);assert.equal(d.querySelector('#preview .motion-stage'),main);
      assert.equal(frameMarkup(main),markup);assert.equal(d.getElementById('scrub').value,time);
      assert.equal(w.MotionComposition.view.layer,'chrome');assert.equal(w.MotionComposition.view.mode,'solo');
      d.getElementById('related-close').click();
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
    }
    for(const id of ['chrome-outline-echo','neon-type-flicker','neon-title-sequence'])assert.equal(w.MotionMatch.rank(data,get(id).name)[0].effect.id,id);
    for(const id of ['reel-chrome-echo','reel-neon-flicker'])assert.ok(w.MotionHistory.excluded.some(e=>e.id===id));
    for(const id of ['reel-shine-sweep','reel-scanlines'])assert.ok(w.MotionHistory.excluded.some(e=>e.id===id),'不能恢复已剔除效果');
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='reel-lens-flare'),'已提取的十字光斑不再重复列为历史配方');
    w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});
