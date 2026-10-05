// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment,frameMarkup} from './helpers.mjs';

const original=await readFile('/Users/wisewong/Documents/Developer/wise-video/claude/video/main.js','utf8');
const source=await readFile(new URL('../catalog/effects/glyph-code-fill.js',import.meta.url),'utf8');
const definition={id:'glyph-code-fill',duration_ms:4000,preview_ms:1600,loop:true,default_ease:'linear',parameters:{}};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const load=async()=>{const env=await environment();if(!env.w.MotionFactories[definition.id])env.w.eval(source);return env;};

// 执行原作真正的代码分支，比较剪进字形前的材料，避免另写一份相同公式当预期。
function originalRows(lt){
  const rows=[];
  const codeCtx={clearRect(){},fillText(value,x,y){rows.push({value,x,y,fill:this.fillStyle});}};
  const ctx={drawImage(){},strokeText(){}};
  const declarations=original.slice(original.indexOf('const CODE_LINES ='),original.indexOf('const EQS ='));
  const start=original.indexOf('if (k.code) {'),end=original.indexOf('  } else {',start);
  runInNewContext(declarations+'\n'+original.slice(start,end)+'\n}',{
    ctx,codeCtx,codeCv:{},W:1920,H:1080,CX:960,CY:540,lt,
    k:{code:true,w:'代码'},font:'700 460px sans-serif',MONO:'monospace',WH:()=>'',
    C:{accent:'var(--accent)',white:'var(--ink)',soft:'var(--muted)'}
  });
  return rows.slice(0,-1); // 原作最后一次 fillText 是裁剪字形，不是源码行。
}

test('字形内材料与原代码段的行内容、方向、奇偶行速度和强调色一致',async()=>{
  const env=await load();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,definition);
    for(const ms of [0,16,49,50,125,250,349,350,375,499]){
      player.seek(ms);const expected=originalRows(ms/1000);
      for(const node of root.querySelectorAll('[data-code-row]')){
        const row=Number(node.dataset.sourceRow);if(row>=expected.length)continue;
        const want=expected[row];
        assert.equal(node.textContent,want.value,`原作第 ${row} 行在 ${ms} 毫秒的材料`);
        near(Number(node.getAttribute('x')),want.x/3);
        near(Number(node.getAttribute('y')),want.y/3);
        assert.equal(node.getAttribute('fill'),want.fill);
        near(Number(node.getAttribute('textLength')),want.value.length*21*.6/3);
      }
    }
    const glyph=root.querySelector('[data-glyph]'),outline=root.querySelector('[data-glyph-outline]');
    assert.equal(glyph.textContent,'代码');near(Number(glyph.getAttribute('font-size')),460/3);
    const glyphState=glyph.outerHTML,outlineState=outline.outerHTML;
    player.seekElapsed(17000);
    assert.equal(glyph.outerHTML,glyphState,'内部滚动不移动字形窗口');
    assert.equal(outline.outerHTML,outlineState,'外描边始终固定');
    assert.equal(outline.getAttribute('href'),'#'+glyph.id);
    assert.equal(root.querySelector('clipPath use').getAttribute('href'),'#'+glyph.id);
    assert.equal(root.querySelector('[data-code-texture]').getAttribute('clip-path'),'url(#'+root.querySelector('clipPath').id+')');
  }finally{env.close();}
});

test('跨轮次连续上移，长时间播放仍覆盖整个字形，回拖可复现且不创建新节点',async()=>{
  const env=await load();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,definition);
    const nodes=[...root.querySelectorAll('*')];
    player.seekElapsed(3999);const before=[...root.querySelectorAll('[data-code-row]')].map(n=>Number(n.getAttribute('y')));
    player.seekElapsed(4001);
    [...root.querySelectorAll('[data-code-row]')].forEach((node,i)=>near(Number(node.getAttribute('y')),before[i]-.04));
    for(const ms of [0,1600,4000,8000,3600000,1600]){
      player.seekElapsed(ms);
      const y=[...root.querySelectorAll('[data-code-row]')].map(n=>Number(n.getAttribute('y')));
      assert.ok(y[0]>-7&&y[0]<=0,'回收后第一行在画板顶边附近');
      assert.ok(y.at(-1)>=350,'任何累计时间都保留覆盖字形下缘的材料');
      assert.equal(root.querySelectorAll('[data-code-row]').length,52);
    }
    const middle=root.innerHTML;player.seek(4000);player.seek(0);player.seek(1600);
    assert.equal(root.innerHTML,middle);
    assert.deepEqual([...root.querySelectorAll('*')],nodes);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,characterData:true,childList:true});
    player.seek(1600);assert.equal(observer.takeRecords().length,0,'重复定位同帧不写图形');observer.disconnect();
    player.setSpeed(2);player.seek(1600);assert.equal(root.innerHTML,middle);
    player.destroy();assert.equal(root.childElementCount,0);assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('多个预览的裁剪标识互不干扰，独立导出只依赖本地脚本与本地字体',async()=>{
  const env=await load();
  try{
    const {w}=env,d=w.document,a=d.createElement('div'),b=d.createElement('div');
    const first=w.MotionKit.createRenderer(a,definition),second=w.MotionKit.createRenderer(b,definition);
    first(1600);second(1600);
    const aIds=new Set([...a.querySelectorAll('[id]')].map(n=>n.id));
    assert.ok([...b.querySelectorAll('[id]')].every(n=>!aIds.has(n.id)));
    assert.equal(frameMarkup(a),frameMarkup(b));
    assert.equal(a.querySelector('[data-glyph]').getAttribute('font-family'),'Source Han Sans SC,sans-serif');
    assert.equal(a.querySelector('[data-code-texture]').getAttribute('font-family'),'Oswald,sans-serif');
    w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
    const output=w.MotionExport.code({...definition,name:'字形内代码填充',source:{path:'catalog/effects/glyph-code-fill.js'}});
    assert.match(output,/<script src="catalog\/effects\/glyph-code-fill\.js"><\/script>/);
    assert.match(output,/<link rel="stylesheet" href="catalog\/app\.css">/);
    assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|requestAnimationFrame|setInterval)\s*\(/);
  }finally{env.close();}
});
