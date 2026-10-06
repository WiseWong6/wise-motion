// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';

async function loadStyles(env){
  for(const file of ['app.css','scenes.css']){
    const style=env.w.document.createElement('style');
    style.textContent=await readFile(new URL('../catalog/'+file,import.meta.url),'utf8');
    env.w.document.head.append(style);
  }
}
const channels=hex=>hex.replace('#','').match(/../g).map(value=>parseInt(value,16));
const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
  .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
function contrast(ink,bg,alpha=1){
  const color=channels(ink),background=channels(bg);
  const a=luminance(color.map((v,i)=>v*alpha+background[i]*(1-alpha))),b=luminance(background);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}

test('深浅主题同步用于预览和缩略图，原色插画在独立导出时仍受保护',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document,root=d.getElementById('root');
    for(const file of ['app.css','scenes.css']){
      const style=d.createElement('style');
      style.textContent=await readFile(new URL('../catalog/'+file,import.meta.url),'utf8');d.head.append(style);
    }
    const ordinary=data.effects.find(e=>e.id==='fade-rise');
    const player=w.MotionRuntime.create(root,ordinary),stage=root.firstElementChild;
    const thumb=d.createElement('div');thumb.className='motion-stage';w.MotionKit.prepareStage(thumb,ordinary);d.body.append(thumb);
    for(const [theme,bg,ink,card]of [['dark','#0a0a0b','#f4f1ea','#151517'],['light','#f7f5f0','#222226','#fdfbf7']]){
      d.documentElement.dataset.theme=theme;
      for(const node of [stage,thumb]){
        const style=w.getComputedStyle(node);
        assert.equal(style.getPropertyValue('--stage').trim(),bg);
        assert.equal(style.getPropertyValue('--card-ink').trim(),ink);
        assert.equal(style.getPropertyValue('--card').trim(),card);
        assert.equal(node.dataset.art,undefined);
      }
    }
    player.destroy();
    // 复制代码的独立定义没有分类，保护不能依赖目录分组。
    const art=data.effects.find(e=>e.id==='archive-folder-illustration');
    const exported={...art};delete exported.category;
    const paper=w.MotionRuntime.create(root,exported);
    assert.equal(root.firstElementChild.dataset.art,'original');
    const artThumb=d.createElement('div');w.MotionKit.prepareStage(artThumb,exported);
    assert.equal(artThumb.dataset.art,'original');paper.destroy();
    assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('两种主题的正文和输入提示可读，夜间细线及点阵蓝线保持对比',async()=>{
  const env=await environment();
  try{
    await loadStyles(env);
    const {w}=env,d=w.document,root=d.getElementById('root');
    const player=w.MotionRuntime.create(root,data.effects.find(e=>e.id==='dot-route-illustration'));
    player.seek(2600);
    const stage=root.firstElementChild;
    for(const theme of ['dark','light','dark']){
      d.documentElement.dataset.theme=theme;
      const sceneStyle=w.getComputedStyle(stage),uiStyle=w.getComputedStyle(d.documentElement);
      const scene=key=>sceneStyle.getPropertyValue(key).trim(),ui=key=>uiStyle.getPropertyValue(key).trim();
      for(const [ink,bg] of [['--ink','--stage'],['--muted','--stage'],['--card-ink','--card'],['--card-muted','--card'],['--panel-ink','--panel']]){
        assert.ok(contrast(scene(ink),scene(bg))>=4.5,`${theme}：${ink} / ${bg}`);
      }
      assert.ok(contrast(ui('--field-placeholder'),ui('--field'))>=4.5,theme+' 输入提示');
      const link=stage.querySelector('[data-part="link0"]');
      assert.equal(link.getAttribute('stroke'),'var(--diagram-blue)');
      assert.ok(contrast(scene('--diagram-blue'),scene('--stage'),+link.getAttribute('opacity'))>=3,theme+' 点阵连线');
      if(theme==='dark'){
        for(const bg of ['--stage','--card']){
          assert.ok(contrast(scene('--path'),scene(bg))>=3,'夜间路径细线');
          assert.ok(contrast(scene('--track'),scene(bg))>=3,'夜间进度轨道');
        }
      }else assert.equal(scene('--diagram-blue'),'#1d4e89','白天沿用原点阵蓝色');
    }
    player.destroy();
  }finally{env.close();}
});

test('切换主题保留暂停位置和静态缩略图，转场底色不固化为旧外观',async()=>{
  const env=await environment(true,{staticPreview:true});
  try{
    await loadStyles(env);
    const {w}=env,d=w.document;
    const category=d.getElementById('category-filter');
    category.value='transition';category.dispatchEvent(new w.Event('change'));env.reveal();
    const card=d.querySelector('.effect-item[data-effect="shared-object"]');card.click();
    const scrub=d.getElementById('scrub');scrub.value='500';scrub.dispatchEvent(new w.Event('input'));
    const stage=d.querySelector('#preview .motion-stage'),thumb=card.querySelector('.thumb .motion-stage');
    const time=scrub.value,preview=stage.innerHTML,poster=thumb.innerHTML;
    for(const current of [stage,thumb]){
      const panel=current.querySelector('.shared-panel');
      assert.ok(parseFloat(panel.style.getPropertyValue('--object-progress'))>0);
      assert.equal(panel.style.background,'','颜色由主题变量决定，不写死为某次外观的颜色');
    }
    const rules=[...d.styleSheets].flatMap(sheet=>[...sheet.cssRules]);
    const blend=rules.find(rule=>rule.selectorText==='.shared-panel').style.getPropertyValue('background');
    assert.match(blend,/color-mix\(in srgb,var\(--panel\),var\(--panel-alt\) var\(--object-progress,0%\)\)/);
    for(const [theme,panelColor] of [['dark','#151517'],['light','#eeeae3'],['dark','#151517']]){
      if(d.documentElement.dataset.theme!==theme)d.getElementById('theme-toggle').click();
      for(const current of [stage,thumb])assert.equal(w.getComputedStyle(current).getPropertyValue('--panel').trim(),panelColor);
      assert.equal(d.querySelector('#preview .motion-stage'),stage);
      assert.equal(card.querySelector('.thumb .motion-stage'),thumb);
      assert.equal(stage.innerHTML,preview);assert.equal(thumb.innerHTML,poster);
      assert.equal(scrub.value,time);assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
    }
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});

test('数据读数和英文标签使用粗体，中文解释保持细体',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    for(const id of ['dimension-line','ruler-ticks','leader-callout','bar-growth','sector-appear','trend-draw','benchmark-columns','timeline-progress','data-pulse']){
      const effect=data.effects.find(e=>e.id===id),player=w.MotionRuntime.create(root,effect);player.seek(effect.duration_ms);
      for(const node of root.querySelectorAll('text')){
        const value=node.textContent;
        if(!/[A-Za-z0-9]/.test(value)||/[\u3400-\u9fff]/.test(value))continue;
        const weight=node.getAttribute('font-weight')||node.closest('[font-weight]')?.getAttribute('font-weight');
        assert.equal(weight,'700',id+'：'+value);
      }
      if(id==='benchmark-columns')assert.equal(root.querySelector('[data-part="task0"]').getAttribute('font-weight'),'300');
      player.destroy();
    }
    const css=await readFile(new URL('../catalog/app.css',import.meta.url),'utf8');
    assert.match(css,/--font:"Oswald","Source Han Sans SC"/);
    const face=css.match(/@font-face\s*\{[^}]*font-family:"Oswald"[^}]*\}/)[0];
    assert.match(face,/font-weight:700/);assert.match(face,/Oswald-Bold\.woff2/);
  }finally{env.close();}
});

test('插画分类可独立浏览，删除的扫光没有残留入口',async()=>{
  const groups=new Map(data.categories.map(c=>[c.id,[]]));
  for(const effect of data.effects)groups.get(effect.category).push(effect);
  assert.ok([...groups.values()].every(effects=>effects.length>0));
  const art=data.effects.filter(e=>e.id.endsWith('-illustration'));
  assert.equal(art.length,61);
  assert.ok(art.every(e=>e.category.startsWith('illustration-')));
  assert.equal(data.effects.some(e=>e.id==='glyph-sheen'),false);
  const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
  assert.equal(cross.rules['reel-shine-sweep'].status,'excluded');
});
