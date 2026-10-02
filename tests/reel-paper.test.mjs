// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment,data,frameMarkup} from './helpers.mjs';

const get=()=>data.effects.find(effect=>effect.id==='paper-spiral-sequence');
const values=text=>(text.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
const transform=node=>values(node.getAttribute('transform')||'');
const close=(actual,expected,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} / ${expected}`);
const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/';
const source=await readFile(sourceRoot+'reel.js','utf8');
const shared={window:{}};
runInNewContext(await readFile(sourceRoot+'shared.js','utf8'),shared);
const sourceFunctions=source.slice(source.indexOf('const clamp ='),source.indexOf('function noise2'))+
  source.slice(source.indexOf('function pulse('),source.indexOf('function bez1('))+
  source.slice(source.indexOf('function paperBar('),source.indexOf('const off ='));

// 直接执行原片绘制函数，只记录坐标与样式；不创建画布、不启动浏览器。
function original(milliseconds){
  const drawings=[],lines=[],stack=[];let path=[];
  const ctx={x:0,y:0,rotation:0,
    save(){stack.push({x:this.x,y:this.y,rotation:this.rotation,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,lineWidth:this.lineWidth});},
    restore(){Object.assign(this,stack.pop());},
    translate(x,y){this.x+=x;this.y+=y;},rotate(angle){this.rotation+=angle;},
    beginPath(){path=[];},closePath(){},
    moveTo(x,y){path.push(['M',x,y]);},lineTo(x,y){path.push(['L',x,y]);},
    arc(...args){path.push(['A',...args]);},
    fillRect(x,y,width,height){drawings.push({kind:'rect',x,y,width,height,fill:this.fillStyle});},
    fill(){drawings.push({kind:'fill',path:[...path],fill:this.fillStyle,x:this.x,y:this.y,rotation:this.rotation});},
    stroke(){drawings.push({kind:'stroke',path:[...path],stroke:this.strokeStyle,width:this.lineWidth,x:this.x,y:this.y,rotation:this.rotation});}
  };
  const sandbox={ctx,W:1920,H:1080,VERT:false,TAU:Math.PI*2,S:shared.window.SHARED,F:{futura:'Futura'},
    revealChars(text,x,y,time,options){lines.push({text,x,y,time,options});}
  };
  runInNewContext(sourceFunctions+'; globalThis.draw=sBass; globalThis.ease=E; globalThis.progress=prog;',sandbox);
  sandbox.draw(milliseconds/1000,4+milliseconds/1000);
  return {drawings,lines,ease:sandbox.ease,progress:sandbox.progress};
}
const vectorDrawings=ref=>ref.drawings.filter(drawing=>drawing.kind!=='rect');
const pathCoordinates=path=>path.flatMap(command=>command.slice(1,3));

// 坐标允许序列化到三位小数，但不允许丢掉原螺线的采样点和逐格运动。
test('剪纸场景保留原橙纸、十二格纸条、回弹圆盘及原曲线几何',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),effect=get();
    assert.equal(effect.kind,'composition');assert.equal(effect.duration_ms,6000);assert.equal(effect.timing,undefined);
    const player=w.MotionRuntime.create(root,effect),part=name=>root.querySelector(`[data-part="${name}"]`);
    assert.equal(root.querySelector('svg').getAttribute('viewBox'),'0 0 1920 1080');
    const ids=[...root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(new Set(ids).size,ids.length,'各字幕与页眉裁剪区域不能重名');
    assert.equal(part('bg').getAttribute('fill'),'#e8541e');
    assert.equal(part('disc').getAttribute('fill'),'#f1e4c8');
    assert.equal(part('spiral').getAttribute('stroke'),'#111');close(+part('spiral').getAttribute('stroke-width'),3.2);
    for(const time of [0,100,150,333,667,1000,1750,2500,4667,6000]){
      player.seek(time);
      const ref=original(time),drawings=vectorDrawings(ref);
      [108,196,872,990,262].forEach((y,index)=>{
        const node=part('paper'+index),paper=drawings.find(drawing=>drawing.fill==='#111'&&drawing.y===y&&drawing.path[0]?.[0]!=='A');
        if(!paper){assert.equal(node.getAttribute('visibility'),'hidden');return;}
        assert.notEqual(node.getAttribute('visibility'),'hidden');
        const actual=transform(node);close(actual[0],paper.x);close(actual[1],paper.y);close(actual[2],paper.rotation*180/Math.PI);
        const expected=pathCoordinates(paper.path),coords=values(node.getAttribute('d'));
        assert.equal(coords.length,expected.length);
        coords.forEach((value,i)=>close(value,expected[i],.001));
      });
      const disc=drawings.find(drawing=>drawing.fill==='#f1e4c8'),discArc=disc.path[0];
      close(+part('disc').getAttribute('cx'),discArc[1]);close(+part('disc').getAttribute('cy'),discArc[2]);close(+part('disc').getAttribute('r'),discArc[3]);
      const spiral=drawings.find(drawing=>drawing.kind==='stroke');
      if(spiral){
        const coords=values(part('spiral').getAttribute('d')),expected=pathCoordinates(spiral.path);
        assert.equal(coords.length,expected.length);
        for(const point of new Set([0,Math.floor(expected.length/4)*2,expected.length-2])){
          close(coords[point],expected[point],.001);close(coords[point+1],expected[point+1],.001);
        }
        const actual=transform(part('spiral'));close(actual[0],spiral.x);close(actual[1],spiral.y);close(actual[2],spiral.rotation*180/Math.PI);
        const center=drawings.find(drawing=>drawing.fill==='#e8541e'&&drawing.path?.[0]?.[0]==='A');
        close(+part('disc-center').getAttribute('r'),center.path[0][3]);
        close(+part('disc-center').getAttribute('cx'),1400);close(+part('disc-center').getAttribute('cy'),540);
      }
      const satellite=drawings.find(drawing=>drawing.fill==='#111'&&drawing.path[0]?.[0]==='A'),arc=satellite.path[0];
      close(+part('satellite').getAttribute('cx'),arc[1]);close(+part('satellite').getAttribute('cy'),arc[2]);close(+part('satellite').getAttribute('r'),arc[3]);
    }
    player.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('原字幕逐字进入，年份保留越过基线再回落，边角标注同步原片时钟',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,get());
    const names=['era','year','caption1','caption2'];let overshot=false;
    for(const time of [0,667,1000,1167,1250,1500,2000,2500,3000,4000,6000]){
      player.seek(time);const ref=original(time);
      ref.lines.forEach((line,index)=>{
        const node=root.querySelector(`[data-line="${names[index]}"]`),characters=[...node.querySelectorAll('[data-char]')];
        assert.equal(node.getAttribute('aria-label'),line.text);assert.ok(characters.length>0);
        const first=characters.find(char=>+char.dataset.char===0);close(transform(first)[0],line.x);
        characters.forEach(char=>{
          const i=+char.dataset.char,options=line.options;
          const start=options.start+i*options.stagger,progress=ref.progress(line.time,start,start+options.dur);
          const eased=(options.ease||ref.ease.outExpo)(progress),y=line.y+(1-eased)*options.size*1.1;
          close(transform(char)[1],y);
          if(eased<=0)assert.equal(char.getAttribute('visibility'),'hidden');
          if(index===1&&y<line.y-.1)overshot=true;
          const glyph=char.querySelector('path[data-glyph]');
          if(glyph)assert.deepEqual(transform(glyph),[options.size/1000,-options.size/1000]);
        });
      });
      const hud=root.querySelector('[data-part="hud"]');close(+hud.getAttribute('opacity'),Math.min(1,(time+100)/500));
      assert.equal(root.querySelector('[data-part="shot"]').textContent,'SHOT 01 / 08');
      assert.match(root.querySelector('[data-part="era-label"]').textContent,/1959\s+—\s+THE TITLE SEQUENCE/);
      const t=4+time/1000,stamp=`00:00:${String(Math.floor(t)).padStart(2,'0')}:${String(Math.floor(t*30)%30).padStart(2,'0')}`;
      assert.equal(root.querySelector('[data-part="timecode"]').textContent,stamp);
      close(+root.querySelector('[data-part="hud-progress"]').getAttribute('width'),1776*t/60);
    }
    assert.ok(overshot,'年份不能退化为普通减速进入');
    player.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('剪纸倒放定位可重复，同一格内不重写纸条和螺线，销毁后释放播放器',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,get());
    player.seek(2500);const frame=root.innerHTML;
    player.seek(5900);player.seek(0);player.seek(2500);assert.equal(root.innerHTML,frame);
    player.setSpeed(.5);player.seek(2500);assert.equal(root.innerHTML,frame);
    player.setSpeed(2);player.seek(2500);assert.equal(root.innerHTML,frame);
    player.seek(2010);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{attributes:true,subtree:true});
    player.seek(2020);
    const changes=observer.takeRecords();
    assert.ok(changes.every(change=>change.attributeName!=='d'),'同一格内不应重新生成或写入纸条、螺线');
    player.seek(6000);observer.takeRecords();player.seek(6000);assert.equal(observer.takeRecords().length,0);
    observer.disconnect();player.destroy();assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.close();}
});

test('剪纸组合可直接访问，缩略图使用同一帧且不增加播放计时器',async()=>{
  const env=await environment(true,{hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document,effect=get();env.reveal();
    assert.equal(d.getElementById('preview-title').textContent,effect.name);
    assert.equal(d.querySelector('[data-kind="composition"]').getAttribute('aria-pressed'),'true');
    const card=d.querySelector('[data-effect="paper-spiral-sequence"]'),thumb=card.querySelector('.thumb .motion-stage');
    const root=d.createElement('div'),player=w.MotionRuntime.create(root,effect);
    player.seek(effect.preview_ms);assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));player.destroy();
    assert.equal(w.MotionMatch.rank(data,effect.name)[0].effect.id,effect.id);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
    w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});

test('三个独立动作与组合里的实际图形逐帧对应，只对右侧图形做居中',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document,composition=d.createElement('div');
    const whole=w.MotionRuntime.create(composition,get());
    for(const id of ['paper-strip-stagger','spiral-draw-spin','planar-dot-orbit']){
      const effect=data.effects.find(e=>e.id===id),root=d.createElement('div');
      const player=w.MotionRuntime.create(root,effect);
      assert.equal(root.querySelectorAll('[data-char]').length,0,'独立动作不应偷偷建立整页文字后隐藏');
      assert.ok(root.querySelectorAll('*').length<=12,'独立预览只建立所需图形');
      for(const time of [0,100,333,750,1167,1650,effect.preview_ms,effect.duration_ms]){
        whole.seek(time);player.seek(time);
        for(const node of root.querySelectorAll('[data-layer]')){
          const original=composition.querySelector(`[data-part="${node.dataset.part}"]`);
          if(id==='paper-strip-stagger')assert.equal(node.outerHTML,original.outerHTML,'纸条坐标、毛边与倾角须一致');
          else if(id==='spiral-draw-spin'){
            assert.equal(node.getAttribute('d'),original.getAttribute('d'));
            assert.equal(node.getAttribute('visibility'),original.getAttribute('visibility'));
            const a=transform(node),b=transform(original);close(a[0]+440,b[0]);close(a[1],b[1]);close(a[2],b[2]);
            assert.equal(node.getAttribute('stroke-width'),original.getAttribute('stroke-width'));
          }else{
            close(+node.getAttribute('cx')+440,+original.getAttribute('cx'));
            close(+node.getAttribute('cy'),+original.getAttribute('cy'));
            close(+node.getAttribute('r'),+original.getAttribute('r'));
          }
        }
      }
      player.seek(1000);const frame=root.innerHTML;player.seek(0);player.seek(1000);assert.equal(root.innerHTML,frame);
      const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
      player.seek(1010);assert.equal(observer.takeRecords().length,0,'同一逐格帧不应重复写入');
      observer.disconnect();player.destroy();
    }
    whole.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('剪纸图层与独立示例在弹窗内切换，缩略图一致且不离开主组合',async()=>{
  const env=await environment(true,{hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document,ids=['paper-strip-stagger','spiral-draw-spin','planar-dot-orbit'];
    assert.deepEqual(get().actions,ids);
    const main=d.querySelector('#preview .motion-stage'),markup=frameMarkup(main),hash=w.location.hash,time=d.getElementById('scrub').value;
    assert.deepEqual([...d.querySelectorAll('#related [data-related-layer]')].map(node=>node.dataset.relatedLayer),['paper','disc','spiral','orbit','text']);
    for(const [layer,id] of [['paper',ids[0]],['spiral',ids[1]],['orbit',ids[2]]]){
      d.querySelector(`#related [data-related-layer="${layer}"]`).click();
      assert.equal(d.getElementById('related-dialog').open,true);
      assert.equal(d.querySelector('#related-preview .motion-stage').dataset.effect,get().id);
      for(const node of d.querySelectorAll('#related-preview [data-layer]'))assert.equal(node.getAttribute('display')==='none',node.dataset.layer!==layer);
      assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(w.MotionRuntime.runningCount,0);
      d.querySelector(`#related-dialog [data-related-example="${id}"]`).click();
      const effect=data.effects.find(e=>e.id===id),thumb=d.createElement('div');d.body.append(thumb);w.MotionThumbs.attach(thumb,effect);
      env.reveal();
      assert.equal(d.getElementById('related-title').textContent,effect.name);
      assert.equal(frameMarkup(thumb.querySelector('.motion-stage')),frameMarkup(d.querySelector('#related-preview .motion-stage')));
      w.MotionThumbs.release(thumb);thumb.remove();
      assert.equal(w.MotionRuntime.instanceCount,2);
      d.querySelector('#related-dialog [data-related-example=""]').click();
      assert.equal(d.querySelector('#related-preview .motion-stage').dataset.effect,get().id);
      d.getElementById('related-close').click();
      assert.equal(d.getElementById('related-dialog').open,false);
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
      assert.equal(d.getElementById('preview-title').textContent,get().name);
      assert.equal(w.location.hash,hash);assert.equal(d.querySelector('#preview .motion-stage'),main);
      assert.equal(frameMarkup(main),markup);assert.equal(d.getElementById('scrub').value,time);
    }
    const definition=await readFile(new URL('../references/effects/paper-spiral-sequence.md',import.meta.url),'utf8');
    assert.doesNotMatch(definition,/\]\((film-step|mask-stagger-text)\.md\)/);
    for(const id of ids)assert.ok(definition.includes(`](${id}.md)`));
  }finally{env.close();}
});
