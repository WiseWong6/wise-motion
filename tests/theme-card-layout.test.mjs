// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {environment,data,themed,sourceDefinition} from './helpers.mjs';

test('主题卡对照原绘制器保留界面、错峰排版、裁剪和独立扫光，静态缩略图完整',async()=>{
  const source='/Users/wisewong/Documents/Developer/wise-video/motion-tutorial/ai-motion-tutorial-portrait-remake/';
  const original=await readFile(source+'scenes/opening.js','utf8');
  const sandbox=vm.createContext({window:{FilmScenes:[],FilmAssets:{}}});
  vm.runInContext(await readFile(source+'runtime/theme.js','utf8'),sandbox);
  assert.equal(original.split('   if(t<7){').length,2);
  // 仅开放原分支的最后一帧，用原绘制器核对完成后的卡片；不改原工程。
  vm.runInContext(original.replace('   if(t<7){','   if(t<7||a.themeCardOnly){'),sandbox);
  const scene=sandbox.window.FilmScenes.find(s=>s.id==='workflow');
  const ease=p=>{p=Math.min(1,Math.max(0,p));return p<.5?4*p**3:1-(-2*p+2)**3/2;};
  const originalAt=u=>{
    const shapes=[],fills=[],strokes=[],translations=[],stack=[];let shape=null,clip=null,dy=0;
    const c={globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:0,
      save(){stack.push({alpha:this.globalAlpha,fill:this.fillStyle,clip,dy});},
      restore(){const state=stack.pop();this.globalAlpha=state.alpha;this.fillStyle=state.fill;clip=state.clip;dy=state.dy;},
      translate(x,y){dy+=y;translations.push([x,y]);},beginPath(){shape=null;},
      roundRect(x,y,w,h,r){shape={x,y,w,h,r};},clip(){clip={...shape,dy};},
      fill(){shapes.push({...shape,paint:this.fillStyle,alpha:this.globalAlpha,clip,dy});},
      stroke(){strokes.push({...shape,paint:this.strokeStyle,width:this.lineWidth});},
      fillRect(x,y,w,h){fills.push({x,y,w,h,paint:this.fillStyle,alpha:this.globalAlpha,clip,dy});},
      createLinearGradient(...coordinates){return {coordinates,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};}
    };
    scene.render(c,4+u,{themeCardOnly:true,enter:(t,at,d)=>ease((t-at)/d),title(){}});
    return {shapes,fills,strokes,translations};
  };
  const env=await environment(true);
  try{
    const {w}=env,d=w.document,effect=sourceDefinition(data.effects.find(e=>e.id==='theme-card-layout'));env.reveal();
    assert.equal(effect.category,'layout');assert.equal(effect.loop,false);
    assert.equal(w.MotionMatch.rank(data,'主题卡自行排版')[0].effect.id,effect.id);
    const card=d.querySelector('[data-effect="theme-card-layout"]'),thumb=card.querySelector('.thumb');
    assert.equal(thumb.querySelectorAll('[data-theme-row]').length,4);
    assert.deepEqual([...thumb.querySelectorAll('[data-theme-row]')].map(n=>Number(n.getAttribute('width'))),[130,480,340,250]);
    card.click();assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect),part=id=>root.querySelector(`[data-part="${id}"]`);
    const close=(actual,expected)=>assert.ok(Math.abs(Number(actual)-expected)<1e-8,`${actual} 与原源码 ${expected} 不同`);
    assert.equal(root.querySelector('svg > g').getAttribute('transform'),'translate(98 48) scale(.6)');
    for(const ms of [0,100,200,400,500,700,1000,1200,1500,1800,2000,2200,2400,2550,2650,2900,3000,3400]){
      draw(ms);const src=originalAt(Math.min(ms,3000)/1000),frame=src.shapes.find(n=>n.w===740&&n.h===440),panel=part('theme-card'),opacity=Number(panel.getAttribute('opacity'));
      close(opacity,frame.alpha);close(panel.getAttribute('transform').match(/translate\(0 ([^)]+)/)[1],src.translations[0][1]);
      const svgFrame=panel.querySelector('rect');
      assert.equal(svgFrame.getAttribute('fill'),themed(frame.paint));assert.equal(svgFrame.getAttribute('stroke'),themed(src.strokes[0].paint));assert.equal(svgFrame.getAttribute('stroke-width'),String(src.strokes[0].width));
      for(let i=0;i<4;i++){
        const row=part('theme-row'+i),expected=src.shapes.find(n=>n.y===440+Number(row.getAttribute('y'))&&n.h===Number(row.getAttribute('height'))&&n.w!==740);
        if(!expected){assert.equal(row.getAttribute('opacity'),'0');continue;}
        close(row.getAttribute('x'),expected.x-170);close(row.getAttribute('y'),expected.y-440);close(row.getAttribute('width'),expected.w);
        close(Number(row.getAttribute('opacity'))*opacity,expected.alpha);assert.equal(row.getAttribute('fill'),themed(expected.paint));
        close(row.getAttribute('rx'),Math.min(expected.r,expected.h/2));assert.equal(expected.clip.w,740);assert.equal(expected.clip.r,16);
      }
      const underline=src.fills.find(n=>n.h===4),cursor=src.fills.find(n=>n.w===8&&n.h===46),light=src.fills.find(n=>n.w===180&&n.h===440);
      assert.equal(part('theme-underline').getAttribute('opacity'),underline?'1':'0');if(underline){close(part('theme-underline').getAttribute('width'),underline.w);assert.equal(part('theme-underline').getAttribute('fill'),themed(underline.paint));}
      assert.equal(part('theme-cursor').getAttribute('opacity'),cursor?'1':'0');if(cursor){close(part('theme-cursor').getAttribute('x'),cursor.x-170);assert.equal(part('theme-cursor').getAttribute('fill'),themed(cursor.paint));}
      close(part('theme-light').getAttribute('transform').match(/translate\(([^ ]+)/)[1],light.x+90-170);
      assert.equal(light.clip.dy,0,'环境微光使用固定卡面裁剪，独立于卡片上移');assert.equal(light.alpha,1);
      assert.equal(root.querySelector('linearGradient stop[offset=".5"]').getAttribute('stop-opacity'),'.08');assert.equal(light.paint.stops[1][1],'rgba(10,228,72,0.08)');
    }
    draw(1200);const typing=root.innerHTML;draw(3400);draw(0);draw(1200);assert.equal(root.innerHTML,typing);
    draw(3000);const final=root.innerHTML;draw(3400);draw(6000);assert.equal(root.innerHTML,final);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});draw(3400);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    const other=d.createElement('div');w.MotionFactories[effect.id](other,w.MotionKit,effect)(3200);
    assert.notEqual(other.querySelector('clipPath').id,root.querySelector('clipPath').id);
    assert.equal(root.querySelector('text,image,video,canvas,filter'),null);
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='tutorial-theme-card'));assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id==='tutorial-theme-card'));
    assert.ok(data.effects.some(e=>e.id==='stagger-in'));assert.ok(data.effects.some(e=>e.id==='local-scan'));
    const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
    for(const file of cross.rules['tutorial-theme-card'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
