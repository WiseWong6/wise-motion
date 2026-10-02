// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment,data,motionTime,frameMarkup} from './helpers.mjs';

const get=id=>data.effects.find(e=>e.id===id);
const numbers=node=>node.getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} / ${b}`);
const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/reel.js','utf8');
const sourceMath=source.slice(source.indexOf('const clamp ='),source.indexOf('const hash ='));
const original={};
runInNewContext(sourceMath+'; globalThis.reference={E,prog};',original);

// 字形路径均为绝对坐标；检查轮廓宽高，避免把原来的圆润 O 再替换为窄长字形。
function outlineSize(path){
  const points=[];let x=0,y=0;
  for(const [,command,raw] of path.matchAll(/([MLCQHVZ])([^MLCQHVZ]*)/g)){
    const values=(raw.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
    if(command==='H')for(const value of values){x=value;points.push([x,y]);}
    else if(command==='V')for(const value of values){y=value;points.push([x,y]);}
    else for(let i=0;i<values.length;i+=2){x=values[i];y=values[i+1];points.push([x,y]);}
  }
  return {width:Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])),height:Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))};
}

test('开场先展开尺度横线，再进入原字形、年份刻度与打字字幕，保留半秒配色',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),effect=get('char-color-cycle');
    const player=w.MotionRuntime.create(root,effect),letters=[...root.querySelectorAll('[data-letter]')];
    const part=name=>root.querySelector(`[data-part="${name}"]`),ruler=part('ruler'),ticks=[...root.querySelectorAll('[data-tick]')];
    assert.equal(root.querySelector('svg').getAttribute('viewBox'),'0 0 1920 1080');
    assert.equal(letters.length,6);assert.equal(ticks.length,7);
    assert.equal(part('word').dataset.font,'Helvetica Neue Bold');
    assert.deepEqual(letters.map(n=>n.firstElementChild.dataset.glyph),[...'MOTION']);
    const oSize=outlineSize(letters[1].firstElementChild.getAttribute('d'));
    assert.ok(oSize.width/oSize.height>.9&&oSize.width/oSize.height<1.05,'O 应保持原版圆润比例');
    assert.equal(letters[1].firstElementChild.getAttribute('d'),letters[4].firstElementChild.getAttribute('d'));
    const widths=[907,778,611,295,778,741];let x=358.5;
    letters.forEach((node,i)=>{close(numbers(node)[0],x);assert.deepEqual(numbers(node.firstElementChild),[.3,-.3]);x+=widths[i]*.3-6;});
    assert.equal(part('start-year').textContent,'1959');assert.equal(part('end-year').textContent,'2026');
    assert.match(part('heading').textContent,/SHOWREEL\s*·\s*2026/);
    assert.ok(part('caret'));assert.ok(part('dots'));
    assert.equal(+ruler.getAttribute('y'),661);assert.equal(+ruler.getAttribute('height'),4);
    player.seek(0);assert.ok(letters.every(n=>n.getAttribute('visibility')==='hidden'));
    player.seek(motionTime(effect,100));assert.ok(+ruler.getAttribute('width')>0);assert.ok(letters.every(n=>n.getAttribute('visibility')==='hidden'),'先有尺度线，再有文字');
    for(const time of [100,400,460,500,700,1000,1550]){
      player.seek(motionTime(effect,time));
      const width=1920*.62*original.reference.E.outExpo(original.reference.prog(time,50,700));
      close(+ruler.getAttribute('width'),width);close(+ruler.getAttribute('x'),960-width/2);
      letters.forEach((node,i)=>{
        const p=original.reference.E.outExpo(original.reference.prog(time,450+i*60,1250+i*60));
        close(numbers(node)[1],635+(1-p)*300*1.1);
        assert.equal(node.getAttribute('visibility'),p>0?'visible':'hidden');
      });
    }
    const subtitle='A 60-SECOND EVOLUTION OF MOTION DESIGN';
    for(const time of [1200,1500,1800,2000,2800]){
      player.seek(motionTime(effect,time));
      const alpha=original.reference.E.outExpo(original.reference.prog(time,1200,1800));
      close(+part('start-year').getAttribute('opacity'),alpha);close(+part('end-year').getAttribute('opacity'),alpha);
      assert.equal(part('subtitle').textContent,subtitle.slice(0,Math.max(0,Math.floor((time-1400)*40/1000))));
      ticks.forEach((node,k)=>{
        const p=original.reference.E.outBack(original.reference.prog(time,1200+k*70,1600+k*70));
        close(+node.getAttribute('height'),12*p);close(+node.getAttribute('y'),661-12*p);
      });
    }
    player.seek(motionTime(effect,1900));const positions=letters.map(n=>n.getAttribute('transform'));
    const palette=['var(--accent)','var(--cycle-pink)','var(--cycle-red)','var(--yellow)','var(--teal)','var(--blue)','var(--reel-last)'];
    for(const time of [2000,2250,2500,2850]){
      player.seek(motionTime(effect,time));
      assert.deepEqual(letters.map(n=>n.getAttribute('transform')),positions);
      assert.deepEqual(letters.map(n=>n.getAttribute('fill')),letters.map((_,i)=>palette[(i+Math.floor(time/500))%7]));
    }
    player.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('字母穿越携带尺度组共同放大，并以奶油圆边打开原版橙色纸面',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),effect=get('letter-hole-zoom');
    const player=w.MotionRuntime.create(root,effect),group=root.querySelector('[data-part="word"]'),iris=root.querySelector('[data-part="iris"]'),edge=root.querySelector('[data-part="iris-edge"]');
    const letters=[...group.querySelectorAll('[data-letter]')],focus={x:741.3,y:527};
    assert.equal(letters[1].firstElementChild.dataset.glyph,'O');assert.equal(letters[4].firstElementChild.dataset.glyph,'O');
    assert.ok(outlineSize(letters[1].firstElementChild.getAttribute('d')).width/outlineSize(letters[1].firstElementChild.getAttribute('d')).height>.9);
    for(const name of ['ruler','start-year','end-year','subtitle','caret'])assert.ok(group.querySelector(`[data-part="${name}"]`),`${name} 应随文字一起放大`);
    assert.equal(group.querySelectorAll('[data-tick]').length,7);
    assert.ok(!group.contains(root.querySelector('[data-part="dots"]')),'背景点阵不随文字放大');
    assert.ok(!group.contains(root.querySelector('[data-part="heading"]')),'顶部小标题不随文字放大');
    assert.equal(root.querySelector('[data-part="next-bg"]').getAttribute('fill'),'#e8541e');
    assert.ok(root.querySelector('[data-part="disc"]'));
    for(let i=0;i<5;i++)assert.ok(root.querySelector(`[data-part="paper${i}"]`));
    assert.equal(edge.getAttribute('stroke'),'#f1e4c8');assert.equal(+edge.getAttribute('stroke-width'),14);
    assert.equal(+iris.getAttribute('cx'),960);assert.equal(+iris.getAttribute('cy'),540);
    for(const time of [2850,3000,3400,3599,3700,3850,4000,4400]){
      player.seek(motionTime(effect,time));const transform=numbers(group);
      const center=original.reference.E.inOutCubic(original.reference.prog(time,2850,3700));
      close(transform[0],focus.x+(960-focus.x)*center);close(transform[1],focus.y+(540-focus.y)*center);
      close(transform[2],1+90*original.reference.E.inExpo(original.reference.prog(time,3000,4000)));
      close(transform[3],-focus.x);close(transform[4],-focus.y);
      const radius=Math.hypot(1920,1080)*.72*original.reference.E.inOutCubic(original.reference.prog(time,3600,4400));
      close(+iris.getAttribute('r'),radius);close(+edge.getAttribute('r'),radius);
      if(time<=3599)assert.equal(+iris.getAttribute('r'),0);
    }
    assert.ok(+iris.getAttribute('r')>Math.hypot(960,540),'终态下一页应覆盖整个画面');
    const other=w.document.createElement('div'),second=w.MotionRuntime.create(other,effect);
    assert.notEqual(other.querySelector('clipPath').id,root.querySelector('clipPath').id,'各预览的开窗不能串用');
    second.destroy();player.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('两个新效果反复定位和变速不改画面，终态没有重复属性写入',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    for(const id of ['char-color-cycle','letter-hole-zoom']){
      const effect=get(id),player=w.MotionRuntime.create(root,effect);
      player.seek(effect.preview_ms);const snapshot=root.innerHTML;
      player.seek(effect.duration_ms);player.restart(false);player.seek(effect.preview_ms);assert.equal(root.innerHTML,snapshot);
      player.setSpeed(.5);player.seek(effect.preview_ms);assert.equal(root.innerHTML,snapshot);
      player.setSpeed(2);player.seek(effect.preview_ms);assert.equal(root.innerHTML,snapshot);
      player.seek(effect.duration_ms);
      const observer=new w.MutationObserver(()=>{});observer.observe(root,{attributes:true,subtree:true});
      player.seek(effect.duration_ms);assert.equal(observer.takeRecords().length,0);observer.disconnect();player.destroy();
    }
    assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('新效果可从目录搜索及直达，缩略图与主预览一致且不增设计时器',async()=>{
  for(const id of ['char-color-cycle','letter-hole-zoom']){
    const env=await environment(true,{hash:'#'+id});
    try{
      const {w}=env,d=w.document;env.reveal();const effect=get(id);
      assert.equal(d.getElementById('preview-title').textContent,effect.name);
      const card=d.querySelector(`[data-effect="${id}"]`),thumb=card.querySelector('.thumb .motion-stage');
      const root=d.createElement('div'),player=w.MotionRuntime.create(root,effect);
      player.seek(effect.preview_ms);assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));player.destroy();
      assert.equal(w.MotionMatch.rank(data,effect.name)[0].effect.id,id);
      assert.match(d.getElementById('code').textContent,/catalog\/effects\/reel-opening\.js/);
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
    }finally{env.w.MotionThumbs.disposeAll();env.close();}
  }
});
