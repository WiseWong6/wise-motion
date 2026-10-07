// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {environment,data} from './helpers.mjs';

// SVG 的字号需要乘图形组的缩放，不能仅检查文字节点上的原始数值。
function pixels(node){
  let size=null,scale=1;
  for(let at=node;at&&at.localName!=='svg';at=at.parentElement){
    if(size===null&&at.hasAttribute('font-size'))size=Number(at.getAttribute('font-size'));
    for(const match of (at.getAttribute('transform')||'').matchAll(/scale\(\s*([-\d.]+)/g))scale*=Number(match[1]);
  }
  assert.notEqual(size,null,'SVG 文字应声明字号');
  return size*scale;
}
const close=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-7,`${label}：${actual}，应为 ${expected}`);

test('卡片、图表和文稿按实际画板大小统一，缩略图与明暗预览使用相同字号',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,d=w.document,root=d.createElement('div');d.body.append(root);await env.reveal();
    const cases=[
      ['bar-growth',{'[data-part^="label"]':12,'[data-part^="v"]':12}],
      ['sector-appear',{'[data-part^="label"]':16,'[data-part^="v"]':16,'[data-part="total"]':24}],
      ['trend-draw',{'[data-part^="axis-label"]':12,'[data-part^="week"]':12,'[data-part="peak"]':12}],
      ['benchmark-columns',{'[data-part^="title"]:is(text)':16,'[data-part^="task"]:is(text)':12,'[data-part^="model"]':12,'[data-part^="score"] text':16,'[data-part^="metric"]':12,'[data-part^="min"],[data-part^="max"]':10}],
      ['timeline-progress',{'text:has(tspan)':10,'text:not(:has(tspan))':16}],
      ['countdown-dial',{'[data-part="value"]':64,'[data-part="unit"]':12,'[data-part^="l"]':10}],
      ['data-pulse',{'[data-part="rate"]':24,'text:not([data-part="rate"])':10}],
      ['formula-evolve',{'text':24}],
      ['evidence-icons',{'text':16}],
      ['theme-color-cycle',{'[data-part="name"]':24,'[data-part="hex"]':12,'[data-option] text':12}],
      ['experience-progress',{'text[y="44"]':12,'text[y="132"]':16,'text[y="240"]':12}],
      ['terminal-code',{'tspan':16,'text[x="400"]':12}],
      ['progress-readout',{'[data-part="value"]':16}],
      ['live-code-readout',{'[data-code-line]':16,'[data-part="value"]':16,'text[x="100"]':12}]
    ];
    for(const [id,selectors] of cases){
      const effect=data.effects.find(e=>e.id===id),player=w.MotionRuntime.create(root,effect);player.seek(effect.duration_ms);
      const stage=root.firstElementChild,thumb=d.querySelector(`[data-effect="${id}"] .thumb .motion-stage`);
      assert.ok(thumb,id+' 的缩略图应完整绘制');
      for(const [selector,expected] of Object.entries(selectors)){
        const mainNodes=[...stage.querySelectorAll(selector)],thumbNodes=[...thumb.querySelectorAll(selector)];
        assert.ok(mainNodes.length,id+'：'+selector);assert.equal(mainNodes.length,thumbNodes.length);
        mainNodes.forEach((node,i)=>{close(pixels(node),expected,id+' 预览');close(pixels(thumbNodes[i]),expected,id+' 缩略图');});
      }
      for(const theme of ['light','dark']){
        d.documentElement.dataset.theme=theme;
        for(const [role,size] of Object.entries({micro:10,caption:12,body:16,title:24,subhead:32,heading:48,display:64})){
          for(const node of [stage,thumb])assert.equal(node.style.getPropertyValue('--type-'+role),size+'px');
        }
      }
      player.destroy();
    }
    const css=await readFile(new URL('../catalog/scenes.css',import.meta.url),'utf8');
    for(const [selector,role]of [['.tile strong','title'],['.tile small','caption'],['.mini-card strong','body'],['.headline','heading'],['.big-number','display']]){
      const rule=css.slice(css.indexOf(selector+'{')).split('}')[0];assert.ok(rule.includes('font-size:var(--type-'+role+')'),selector);
    }
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});

test('标题和标签字形完整，图表文字、降幅读数及揭示遮罩容纳真实字宽',async()=>{
  const measured=spawnSync('/usr/local/bin/python3',['-c',`
import json, sys
from fontTools.ttLib import TTFont
fonts=[TTFont(path) for path in sys.argv[1:]]
print(json.dumps([{chr(n):f['hmtx'].metrics[name][0]/f['head'].unitsPerEm for n,name in f.getBestCmap().items()} for f in fonts],ensure_ascii=False))
`,...['Oswald-Bold','SourceHanSansSC-Light','SourceHanSansSC-Bold'].map(name=>new URL('../catalog/fonts/'+name+'.woff2',import.meta.url).pathname)],{encoding:'utf8',maxBuffer:4*1024*1024});
  assert.equal(measured.status,0,measured.stderr);
  const [latin,chinese,bold]=JSON.parse(measured.stdout);
  const width=(text,size,spacing=0)=>Array.from(text).reduce((n,ch)=>n+(latin[ch]??chinese[ch])*size+spacing,0);
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    let player=w.MotionRuntime.create(root,data.effects.find(e=>e.id==='timeline-progress'));player.seek(3000);
    for(const text of root.querySelectorAll('text:has(tspan)')){
      assert.equal(text.querySelectorAll('tspan').length,2);
      for(const line of text.children)assert.ok(width(line.textContent.trim(),pixels(text),.28)<488/6-12,'时期名称不能挤入相邻节点');
    }
    player.destroy();player=w.MotionRuntime.create(root,data.effects.find(e=>e.id==='benchmark-columns'));player.seek(3000);
    const part=id=>root.querySelector(`[data-part="${id}"]`);
    for(let c=0;c<3;c++){
      for(const name of ['title','task']){
        const node=part(name+c),size=Number(node.getAttribute('font-size')),mask=part(name+c+'-mask');
        assert.ok(width(node.textContent,size)<=Number(mask.getAttribute('width'))-8,'标题揭示不能裁掉尾字');
        assert.ok(width(node.textContent,size)<585-24,'标题不能越过相邻栏');
      }
      for(let r=0;r<3;r++){
        const model=part('model'+c+'-'+r),digits=[...part('score'+c+'-'+r).querySelectorAll('text')].filter(n=>!n.dataset.part.endsWith('-b'));
        const modelEnd=Number(model.getAttribute('x'))+width(model.textContent,36,1);
        const first=digits[0],digitLeft=Number(first.getAttribute('x'))-width(first.textContent,48)/2;
        assert.ok(modelEnd+6<=digitLeft,model.textContent+' 不能与右侧读数重叠');
      }
    }
    player.destroy();player=w.MotionRuntime.create(root,data.effects.find(e=>e.id==='reduction-dimension'));player.seek(1800);
    for(const node of root.querySelectorAll('text'))if(/[\u3400-\u9fff]/.test(node.textContent)){
      assert.equal(node.getAttribute('font-weight'),'300');
      for(const ch of node.textContent)assert.ok(chinese[ch],ch+' 缺少细体字形，不能落到备用字体');
    }
    const sign=part('sign'),first=part('digit0-a'),second=part('digit1-a'),percent=part('percent');
    const size=Number(part('readout').getAttribute('font-size')),gap=size*.04;
    assert.ok(bold['−'],'负号必须有本地粗体字形');
    assert.equal(sign.getAttribute('font-family'),'Source Han Sans SC,sans-serif');
    assert.ok(Number(sign.getAttribute('x'))+bold['−']*size+gap<=Number(first.getAttribute('x')),'负号不能压住首位数字');
    const digitWidth=Math.max(...[...'0123456789'].map(ch=>latin[ch]))*size;
    for(const [left,right]of [[first,second],[second,percent]]){
      assert.ok(Number(left.getAttribute('x'))+digitWidth+gap<=Number(right.getAttribute('x')),'数字轮的所有字形都必须留有间距');
    }
    const right=Number(percent.getAttribute('x'))+latin['%']*size;
    assert.ok(-395+right*.6<=640-24,'百分号应留在画板内并保留右边距');
    player.destroy();player=w.MotionRuntime.create(root,data.effects.find(e=>e.id==='live-code-readout'));player.seek(3000);
    for(const line of root.querySelectorAll('[data-code-line]'))assert.ok(28+width(line.textContent,pixels(line))<=512,'代码行不能越过窗口右边距');
    assert.ok(28+width(part('value').textContent,pixels(part('value')))+24<=250,'读数与进度条之间保留间距');
  }finally{env.close();}
});
