// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data,frameMarkup} from './helpers.mjs';

const record=JSON.parse(await readFile(new URL('../../../state/wise-motion/claude-tile-illustrations-20261002/extraction.json',import.meta.url),'utf8'));
const source=await readFile(record.source_root+'main.js','utf8');
const moduleSource=await readFile(new URL('../catalog/effects/claude-tile-illustrations.js',import.meta.url),'utf8');
const slugs=['lissajous','wireframe','flow-field','pendulum-wave','phyllotaxis','kick-rings','spectrum','warp','sine-grid','fractal-tree','glyph-rain','hex-pulse','orbits','terrain','plexus','frame-counter'];
const ids=slugs.map(s=>'claude-'+s+'-illustration');
const definitions=ids.map(id=>data.effects.find(e=>e.id===id));
const original=vm.createContext({window:{},location:{search:''},URLSearchParams});
vm.runInContext(await readFile(record.source_root+'build/audio_data.js','utf8'),original);
const tiles=source.slice(source.indexOf('const TILES = ['),source.indexOf('function scene6('));
vm.runInContext(source.slice(0,source.indexOf('const cv ='))+
  source.slice(source.indexOf('const clamp ='),source.indexOf('// ---------- global fx envelopes'))+
  source.slice(source.indexOf('const GLYPHS ='),source.indexOf('function scramble('))+
  tiles+'\nthis.tiles=TILES;',original);
const audio=JSON.parse(JSON.stringify(original.window.AUDIO));
const near=(a,b,label)=>assert.ok(Number.isFinite(Number(a))&&Math.abs(Number(a)-Number(b))<1e-8,`${label}: ${a} / ${b}`);
const number=(n,key)=>{assert.ok(n.hasAttribute(key),key+' 缺失');return Number(n.getAttribute(key));};
const numbers=d=>(d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[]).map(Number);
const compare=(a,b,label)=>{assert.equal(a.length,b.length,label);a.forEach((v,i)=>near(v,b[i],label+' '+i));};

// 从原程序收集绘图命令；不以改编模块的计算结果作为预期。
function originalFrame(index,ms){
  const commands=[];let path=[];
  const c={globalAlpha:1,lineWidth:1,textAlign:'left',textBaseline:'alphabetic',
    beginPath(){path=[];},moveTo(...p){path.push(['M',...p]);},lineTo(...p){path.push([path.length?'L':'M',...p]);},
    closePath(){path.push(['Z']);},arc(...p){path.push(['arc',...p]);},ellipse(...p){path.push(['ellipse',...p]);},
    stroke(){commands.push({tag:'path',kind:'stroke',path:[...path],color:this.strokeStyle,alpha:this.globalAlpha,width:this.lineWidth});},
    fill(){commands.push({tag:'path',kind:'fill',path:[...path],color:this.fillStyle,alpha:this.globalAlpha});},
    fillRect(x,y,width,height){commands.push({tag:'rect',kind:'fill',x,y,width,height,color:this.fillStyle,alpha:this.globalAlpha});},
    fillText(text,x,y){commands.push({tag:'text',kind:'fill',text,x,y,font:this.font,align:this.textAlign,baseline:this.textBaseline,color:this.fillStyle,alpha:this.globalAlpha});}
  };
  original.tiles[index][1](c,442.5,227.5,Math.min(ms,2600)/1000);
  return commands;
}
function comparePath(node,ops,label){
  const d=node.getAttribute('d'),commands=d.match(/[MLAZ]/g)||[];
  if(ops.length===1&&['arc','ellipse'].includes(ops[0][0])){
    const op=ops[0],circle=op[0]==='arc';
    const [,x,y,rx]=op,ry=circle?rx:op[4],rotation=circle?0:op[5],a=op[circle?4:6],b=op[circle?5:7];
    const count=b-a>=Math.PI*2?2:1,actual=numbers(d);
    assert.deepEqual(commands,['M',...Array(count).fill('A')],label+' 圆弧结构');
    const point=angle=>[x+rx*Math.cos(angle),y+ry*Math.sin(angle)];
    compare(actual.slice(0,2),point(a),label+' 起点');
    assert.equal(actual.length,2+7*count);
    for(let i=0;i<count;i++){
      const arc=actual.slice(2+i*7,9+i*7);
      compare(arc.slice(0,3),[rx,ry,rotation],label+' 半径与转角');
      assert.equal(arc[3],(b-a)/count>Math.PI?1:0,label+' 弧线弯曲范围');
      assert.equal(arc[4],1,label+' 弧线方向');
      compare(arc.slice(5),point(a+(b-a)*(i+1)/count),label+' 终点');
    }
  }else{
    assert.deepEqual(commands,ops.map(o=>o[0]),label+' 原路径命令');
    compare(numbers(d),ops.flatMap(o=>o.slice(1)),label+' 原路径坐标');
  }
}
function compareDrawing(node,expected,label){
  assert.equal(node.localName,expected.tag,label+' 图形类型');
  const rgba=/^rgba\([^,]+,[^,]+,[^,]+,([^)]*)\)$/.exec(expected.color);
  const color=rgba?'var(--ink)':({'#ecebe7':'var(--ink)','#b9b7b0':'var(--muted)','#fff':'var(--ink)','#111112':'var(--stage)'})[expected.color]||expected.color;
  assert.equal(node.getAttribute(expected.kind),color,label+' 主题色位');
  near(number(node,expected.kind+'-opacity'),expected.alpha*(rgba?Number(rgba[1]):1),label+' 透明度');
  if(expected.tag==='path'){
    comparePath(node,expected.path,label);
    if(expected.kind==='stroke'){near(number(node,'stroke-width'),expected.width,label+' 线宽');assert.equal(node.getAttribute('fill'),'none');}
  }else{
    for(const key of expected.tag==='rect'?['x','y','width','height']:['x','y'])near(number(node,key),expected[key],label+' '+key);
    if(expected.tag==='text'){
      assert.equal(node.textContent,expected.text,label+' 原字符');
      near(number(node,'font-size'),expected.font.match(/(\d+)px/)[1],label+' 原字号');
      assert.equal(node.getAttribute('font-weight'),'700','目录统一使用粗体');
      assert.match(node.getAttribute('font-family'),/^Oswald/);
      assert.equal(node.getAttribute('text-anchor'),expected.align==='center'?'middle':'start');
      assert.equal(node.getAttribute('dominant-baseline'),expected.baseline==='top'?'text-before-edge':'middle');
    }
  }
}

test('十六项算法插画来源可追溯，原绘制函数与声音取样完整保留',async()=>{
  assert.deepEqual(record.entries.map(e=>e.id),ids);
  for(const [file,expected] of Object.entries(record.source_files)){
    const bytes=await readFile(record.source_root+file);
    assert.equal(bytes.length,expected.bytes,file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256,file);
  }
  assert.equal(moduleSource.slice(moduleSource.indexOf('const TILES = ['),moduleSource.indexOf('  // END ORIGINAL TILES')).trim(),tiles.trim());
  const embedded=JSON.parse(moduleSource.match(/const A=(\{.*?\});\s*const FPS/s)[1]);
  assert.equal(embedded.fps,audio.fps);
  assert.deepEqual(embedded.kick,audio.kick.slice(0,187));
  assert.deepEqual(embedded.spec,audio.spec.slice(0,187));
  assert.equal(record.clock.source_start_seconds,0);assert.equal(record.clock.source_end_seconds,2.6);assert.equal(record.clock.hold_ms,400);
  definitions.forEach((def,i)=>{
    assert.ok(def,ids[i]);assert.equal(data.effects.filter(e=>e.id===def.id).length,1);
    assert.ok([def.name,...(def.previous_names||[])].includes(record.entries[i].name),'原提取名称在当前名称或旧名称中保留');assert.equal(def.kind,'illustration');assert.ok(def.category.startsWith('illustration-'),'原图形仍属于插画分类');
    assert.equal(def.source.path,'catalog/effects/claude-tile-illustrations.js');
    assert.equal(def.duration_ms,3000);assert.equal(def.loop,false);
    assert.equal(original.tiles[i][0],record.entries[i].original_label);
  });
});

test('全部十六项按原函数核对每条绘图命令，字形、帧数、噪声与音频柱保持',async()=>{
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root');
    for(const [index,def] of definitions.entries()){
      const p=env.w.MotionRuntime.create(root,def);
      try{
        const svg=root.querySelector('svg'),group=svg.querySelector('[data-tile]');
        assert.equal(svg.getAttribute('viewBox'),'0 0 640 360');assert.equal(group.dataset.tile,slugs[index]);
        assert.equal(group.parentElement.getAttribute('transform'),'translate(54.5 43.5) scale(1.2)');
        const clip=svg.querySelector('clipPath');assert.equal(group.getAttribute('clip-path'),`url(#${clip.id})`);
        near(number(clip.firstElementChild,'width'),442.5,'原图块宽');near(number(clip.firstElementChild,'height'),227.5,'原图块高');
        assert.equal(root.querySelectorAll('canvas,image,foreignObject,video,audio').length,0);
        for(const ms of [0,400,1375,2600]){
          p.seek(ms);const expected=originalFrame(index,ms),actual=[...group.children];
          assert.equal(actual.length,expected.length,def.name+' 原绘制数量');
          actual.forEach((node,i)=>compareDrawing(node,expected[i],def.name+' '+ms+' 毫秒第 '+i+' 笔'));
        }
        assert.equal(svg.querySelectorAll('text:not([data-part])').length,0,'不添加外围标题或算法编号');
      }finally{p.destroy();}
    }
  }finally{env.close();}
});

test('十六项可反复定位、双实例裁剪互不冲突，末尾停住且释放实例不留资源',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document,root=d.getElementById('root'),other=d.createElement('div');root.after(other);
    for(const def of definitions){
      const p=w.MotionRuntime.create(root,def),q=w.MotionRuntime.create(other,def);
      assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(env.listeners.size,2);
      for(const ms of [0,1375,400,2200,2600]){
        p.seek(ms);const picture=root.innerHTML;p.seek(0);p.seek(ms);assert.equal(root.innerHTML,picture,def.name+' 反复定位');
        q.seek(ms);assert.equal(frameMarkup(root.firstElementChild),frameMarkup(other.firstElementChild),def.name+' 双实例画面');
      }
      const clip=root.querySelector('clipPath').id;assert.notEqual(clip,other.querySelector('clipPath').id);
      p.seek(2600);const final=root.innerHTML;const observer=new w.MutationObserver(()=>{});
      observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});
      for(const ms of [2600,2800,3000]){p.seek(ms);assert.equal(root.innerHTML,final,def.name+' 末尾保持');}
      assert.equal(observer.takeRecords().length,0,def.name+' 静止时不重复写图形');observer.disconnect();
      p.seekElapsed(6000);assert.equal(p.currentTime,3000);assert.equal(root.innerHTML,final);
      p.play();assert.equal(w.MotionRuntime.runningCount,1);p.destroy();q.destroy();
      assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);assert.equal(env.listeners.size,0);
      assert.equal(root.childElementCount,0);assert.equal(other.childElementCount,0);
      p.seek(1200);p.play();p.destroy();assert.equal(w.MotionRuntime.instanceCount,0,'释放后调用不重建实例');
    }
  }finally{env.close();}
});

test('正式目录加载全部十六项，缩略图、点击预览与独立导出使用同一原插画',async()=>{
  const env=await environment(true,{staticPreview:true});
  try{
    const {w}=env,d=w.document;
    assert.equal(d.querySelectorAll('script[src="effects/claude-tile-illustrations.js"]').length,1);
    d.querySelector('[data-kind="illustration"]').click();env.reveal();
    for(const def of definitions){
      const card=d.querySelector(`[data-effect="${def.id}"]`);assert.ok(card,def.name+' 目录卡片');
      const thumb=card.querySelector('.thumb .motion-stage');assert.ok(thumb,def.name+' 缩略图');
      card.click();assert.equal(d.getElementById('preview-title').textContent,def.name);
      const main=d.querySelector('#preview .motion-stage');assert.equal(main.dataset.effect,def.id);
      assert.equal(frameMarkup(main),frameMarkup(thumb),def.name+' 缩略图与预览');
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
      const html=w.MotionExport.code(def,{speed:1.75,ease:'linear'});
      const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),exported=dom.window;
      exported.matchMedia=()=>({matches:true});exported.ResizeObserver=class{observe(){}disconnect(){}};
      try{
        assert.ok(exported.document.querySelector('script[src="catalog/effects/claude-tile-illustrations.js"]'));
        for(const script of exported.document.querySelectorAll('script')){
          const resource=script.getAttribute('src');if(resource)assert.ok(!/^(https?:|\/\/)/.test(resource));
          exported.eval(resource?await readFile(new URL('../'+resource,import.meta.url),'utf8'):script.textContent);
        }
        assert.equal(exported.MotionDemo.speed,1.75);assert.equal(exported.MotionRuntime.instanceCount,1);
        assert.ok(!exported.MotionDemo.paused,'独立算法插画默认自动播放');exported.MotionDemo.pause();
        const root=d.createElement('div'),p=w.MotionRuntime.create(root,def);
        try{
          for(const ms of [0,1375,2600,3000]){
            p.seek(ms);exported.MotionDemo.seek(ms);
            assert.equal(frameMarkup(exported.document.querySelector('.motion-stage')),frameMarkup(root.firstElementChild),def.name+' 独立导出');
          }
        }finally{p.destroy();}
        exported.dispatchEvent(new exported.Event('pagehide'));assert.equal(exported.MotionRuntime.instanceCount,0);
      }finally{exported.MotionRuntime?.disposeAll();exported.anime?.engine.pause();dom.window.close();}
    }
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
