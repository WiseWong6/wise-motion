// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {environment,data,sourceDefinition} from './helpers.mjs';

test('经验卡保留成片讲述时钟与卡内进度，同一主题配色，缩略图和倒拖完整',async()=>{
  const source='/Users/wisewong/Documents/Developer/wise-video/motion-tutorial/ai-motion-tutorial-portrait-remake/';
  const sandbox=vm.createContext({window:{FilmScenes:[],FilmAssets:{}}});
  for(const file of ['runtime/theme.js','scenes/opening.js'])vm.runInContext(await readFile(source+file,'utf8'),sandbox);
  const scene=sandbox.window.FilmScenes.find(s=>s.id==='opening');
  const pacing=createRequire(import.meta.url)(source+'runtime/pacing.js');
  const first=pacing.visualBeats.find(b=>b.sourceStart===22.4).programStart;
  const last=pacing.visualBeats.find(b=>b.sourceEnd===38).programEnd;
  const start=120,duration=(last-first)*250;
  const clamp=p=>Math.min(1,Math.max(0,p));
  const ease=p=>{p=clamp(p);return p<.5?4*p**3:1-(-2*p+2)**3/2;};
  // 运行原开场绘制器，仅记录卡片和其裁剪内的扫描、进度，不重写它们的运动公式。
  const originalAt=ms=>{
    const t=ms>=start+duration?38:pacing.toVisualSource(first+(ms-start)*4/1000);
    const cards=[],text=[],flow=[],stack=[];
    let shape=null,clip=null;
    const gradient=(...coordinates)=>({coordinates,stops:[],addColorStop(at,color){this.stops.push([at,color]);}});
    const c={globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:0,
      save(){stack.push({globalAlpha:this.globalAlpha,fillStyle:this.fillStyle,clip});},
      restore(){const state=stack.pop();clip=state.clip;this.globalAlpha=state.globalAlpha;this.fillStyle=state.fillStyle;},
      beginPath(){shape=null;},roundRect(x,y,w,h,r){shape={x,y,w,h,r};},
      arc(){},moveTo(){},lineTo(){},stroke(){},setLineDash(){},
      createLinearGradient:gradient,createRadialGradient:gradient,
      fill(){if(shape?.w===260&&shape.h===310&&shape.r===14)cards.push({...shape,alpha:this.globalAlpha});},
      clip(){clip=shape;},
      fillRect(x,y,w,h){if(clip?.w===260&&clip.h===310)flow.push({x,y,w,h,clip,paint:this.fillStyle});}
    };
    scene.render(c,t,{enter:(t,at,d)=>ease((t-at)/d),ease,
      title(){},titleRule(){},line(){},
      text(label,x,y,options){text.push({label,x,y,...options,alpha:c.globalAlpha});}
    });
    return {cards,text,flow};
  };
  const env=await environment(true);
  try{
    const {w}=env,d=w.document,effect=sourceDefinition(data.effects.find(e=>e.id==='experience-progress'));env.reveal();
    assert.equal(effect.category,'writing');assert.equal(effect.loop,false);
    assert.equal(w.MotionMatch.rank(data,effect.name)[0].effect.id,effect.id);
    const card=d.querySelector('[data-effect="experience-progress"]'),thumb=card.querySelector('.thumb');
    assert.equal(thumb.querySelectorAll('[data-experience-card]').length,3);
    assert.equal(thumb.querySelectorAll('text').length,9);
    assert.ok([...thumb.querySelectorAll('[data-experience-card]')].every(n=>n.getAttribute('opacity')==='1'));
    assert.equal(thumb.querySelector('[data-part="experience-flow2"]').getAttribute('opacity'),'1');
    card.click();assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect);
    const part=id=>root.querySelector(`[data-part="${id}"]`);
    const groups=[...root.querySelectorAll('[data-experience-card]')];
    const close=(actual,expected,message)=>assert.ok(Math.abs(Number(actual)-expected)<1e-8,message);
    const pose=node=>node.getAttribute('transform').match(/[-\d.]+/g).map(Number);
    assert.equal(root.querySelector('svg > g').getAttribute('transform'),'translate(-4 -309) scale(.6)');
    assert.equal(root.querySelector('svg > g').getAttribute('font-weight'),'300');
    // 原片用全片秒数相减，精确交界有浮点误差；分别核对交界前后，再单独核对交界的激活状态。
    for(const ms of [0,120,160,240,780,985.666666666667,987.666666666667,1030,1370,1800,2052.333333333334,2054.333333333334,2100,2500,2800,3054,3400]){
      draw(ms);const expected=originalAt(ms);
      groups.forEach((group,i)=>{
        const [x,y]=pose(group),alpha=Number(group.getAttribute('opacity'));
        const original=expected.cards.find(card=>Math.abs(card.x-x)<1e-8);
        if(!original){assert.equal(alpha,0);return;}
        close(alpha,original.alpha,'保留原进入时的渐变');close(y,original.y,'上浮采用原两次缓动关系');
        const [number,title,label]=group.querySelectorAll('text');
        for(const node of [number,title,label]){
          const text=expected.text.find(text=>text.label===node.textContent);
          close(x+Number(node.getAttribute('x')),text.x);close(y+Number(node.getAttribute('y')),text.y);
        }
        const flow=expected.flow.filter(item=>Math.abs(item.clip.x-x)<1e-8),active=flow.length>0;
        assert.equal(part('experience-flow'+i).getAttribute('opacity'),active?'1':'0',`讲述切换时刻 ${ms}，第 ${i+1} 张卡片`);
        assert.equal(part('experience-frame'+i).getAttribute('stroke'),active?'var(--card-ink)':'var(--card-muted)');
        if(active){
          const beam=flow.find(item=>item.w===190),progress=flow.find(item=>item.h===5);
          close(x+pose(part('experience-beam'+i))[0]-95,beam.x,'扫描沿用原速率和回绕位置');
          close(part('experience-progress'+i).getAttribute('width'),progress.w,'进度随讲述区间推进，不能改成等速三段');
          assert.deepEqual(Array.from(beam.paint.stops,stop=>stop[0]),[0,.5,1]);
        }
      });
    }
    draw(986.666666666667);
    assert.deepEqual(groups.map((_,i)=>part('experience-flow'+i).getAttribute('opacity')),['0','1','0']);
    draw(2053.3333333333335);
    assert.deepEqual(groups.map((_,i)=>part('experience-flow'+i).getAttribute('opacity')),['0','0','1']);
    const colors=new Set([...root.querySelectorAll('[fill],[stroke],[stop-color]')].flatMap(node=>['fill','stroke','stop-color'].map(name=>node.getAttribute(name))).filter(Boolean));
    assert.ok([...colors].every(value=>['var(--card)','var(--card-ink)','var(--card-muted)','none'].includes(value)||value.startsWith('url(#')),'卡片、光束和进度应只使用目录中性配色');
    const gradient=root.querySelector('linearGradient');
    assert.deepEqual([...gradient.children].map(n=>n.getAttribute('stop-opacity')),['0','.12','0']);
    assert.ok([...gradient.children].every(n=>n.getAttribute('stop-color')==='var(--card-ink)'));
    const other=d.createElement('div');w.MotionFactories[effect.id](other,w.MotionKit,effect)(2800);
    assert.notEqual(other.querySelector('linearGradient').id,gradient.id,'多个实例不能共用裁剪或扫描标识');
    draw(1800);const halfway=root.innerHTML;draw(3400);draw(0);draw(1800);assert.equal(root.innerHTML,halfway);
    assert.ok(groups.every(n=>root.contains(n)));
    draw(3400);const final=root.innerHTML;draw(6000);assert.equal(root.innerHTML,final);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});
    draw(3400);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelector('image,video,canvas,filter'),null);
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='tutorial-exp-card'));
    assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id==='tutorial-exp-card'));
    assert.ok(data.effects.some(e=>e.id==='progress-readout'),'保留独立的进度与读数同步');
    const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
    for(const file of cross.rules['tutorial-exp-card'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256,'原工程保持只读');
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
