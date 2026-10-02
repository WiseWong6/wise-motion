// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {history,state} from '../scripts/history.mjs';
import {environment,data,sourceDefinition,frameMarkup} from './helpers.mjs';
const effect=data.effects.find(e=>e.id==='step-hop'),base='/Users/wisewong/Documents/Developer/wise-video/motion-tutorial/ai-motion-tutorial-portrait-remake/';
const cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const source=await readFile(base+'scenes/opening.js','utf8'),film=await readFile(base+'runtime/film.js','utf8');
const context=vm.createContext({window:{FilmScenes:[],FilmAssets:{}}});
for(const file of ['runtime/theme.js','scenes/opening.js'])vm.runInContext(await readFile(base+file,'utf8'),context);
const scene=context.window.FilmScenes.find(s=>s.id==='workflow');
const pacing=createRequire(import.meta.url)(base+'runtime/pacing.js');
const start=pacing.visualBeats.find(b=>b.sourceStart===38).programStart;
const math=vm.runInNewContext(film.match(/const clamp=[^\n]+/)[0]+film.match(/const ease=[^\n]+/)[0]+film.match(/const mix=[^\n]+/)[0]+';({ease,mix})');
const ball=vm.runInNewContext(source.match(/const cx=\[232[^\n]+/)[0]+source.match(/const ballAt=\(tt\)=>\{[\s\S]*?\n     \};/)[0]+';ballAt',{a:math});
const near=(a,b)=>assert.ok(Math.abs(Number(a)-b)<1e-8,`${a} != ${b}`);
function originalAt(ms){
  const frame={steps:[],ghosts:[],circles:[]},stack=[];let shape;
  const c={globalAlpha:1,dash:[],
    save(){stack.push({globalAlpha:this.globalAlpha,dash:this.dash});},restore(){Object.assign(this,stack.pop());},
    beginPath(){shape=null;},roundRect(x,y,width,height,rx){shape={x,y,width,height,rx};},
    arc(x,y,r){shape={x,y,r};},setLineDash(dash){this.dash=dash;},moveTo(){},lineTo(){},
    stroke(){if(shape?.width&&this.dash.length)frame.ghosts.push({...shape,alpha:this.globalAlpha,offset:this.lineDashOffset});},
    fill(){if(shape?.width)frame.steps.push({...shape,alpha:this.globalAlpha});if(shape?.r)frame.circles.push(shape);},
    createRadialGradient(){return{addColorStop(){}};}
  };
  scene.render(c,pacing.toVisualSource(start+ms/1000)-38,{
    ...math,enter:(t,at,d)=>math.ease((t-at)/d),title(){},subtitle(){},text(){},line(...args){frame.base=args.at(-1).alpha;}
  });
  return frame;
}

test('四级台阶、三段跳弧和真实历史位置尾迹保持原作几何与成片时钟，末跳完整落定',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,sourceDefinition(effect));
    const part=id=>root.querySelector(`[data-part="${id}"]`),num=(id,key)=>Number(part(id).getAttribute(key));
    for(const ms of [0,100,200,800,1400,1800,2399,2400,2800,3400,3900,4500]){
      player.seek(ms);const expected=originalAt(ms);near(num('base','opacity'),expected.base);
      for(let i=0;i<4;i++){
        const x=[232,447,662,877][i]-95;
        const step=expected.steps.find(s=>s.x===x),ghost=expected.ghosts.find(s=>s.x===x);
        near(num('step'+i,'opacity'),step?.alpha||0);near(num('ghost'+i,'opacity'),ghost?.alpha||0);
        if(ghost)near(num('ghost'+i,'stroke-dashoffset'),ghost.offset);
        const rect=part('step'+i).querySelector('rect');
        if(step)for(const key of ['x','y','width','height','rx'])near(rect.getAttribute(key),step[key]);
      }
      const ids=['trail4','trail3','trail2','trail1','glow','ball'];
      ids.forEach((id,i)=>{const circle=expected.circles[i];near(num(id,'cx'),circle.x);near(num(id,'cy'),circle.y);near(num(id,'r'),circle.r);});
    }
    // 原页切换后只继续同一 ballAt 函数，补完第三跳；尾迹延迟仍为每点 0.07 秒。
    const end=1.6+3/1.15+.28;
    for(const t of [4,4.1,1.6+3/1.15,end]){
      const ms=2400+(t-2.3)/(1.7/(32/15))*1000;player.seek(ms);
      for(const [id,delay]of [['ball',0],['glow',0],['trail1',.07],['trail2',.14],['trail3',.21],['trail4',.28]]){
        const expected=ball(t-delay);near(num(id,'cx'),expected.x);near(num(id,'cy'),expected.y);
      }
    }
    near(num('ball','cx'),877);near(num('ball','cy'),454);
    // 包含辉光的完整跳跃范围都在画板内，编号采用目录正文实际字号。
    for(let ms=0;ms<=effect.timing.source_duration_ms;ms+=25){
      player.seek(ms);const x=82+num('glow','cx')*.43,y=-126+num('glow','cy')*.43,r=70*.43;
      assert.ok(x-r>=24&&x+r<=616&&y-r>=24&&y+r<=336,'辉光不能被画板裁切');
    }
    for(const node of root.querySelectorAll('text'))near(Number(node.getAttribute('font-size'))*.43,16);
    player.seek(3400);const middle=root.innerHTML,nodes=[...root.querySelectorAll('*')];
    player.seek(10000);const final=root.innerHTML;player.seek(0);player.seek(3400);
    assert.equal(root.innerHTML,middle);assert.deepEqual([...root.querySelectorAll('*')],nodes);
    player.seek(10000);assert.equal(root.innerHTML,final);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    player.seek(10000);assert.equal(observer.takeRecords().length,0);observer.disconnect();
  }finally{env.close();}
});

test('光球跳台阶可搜索与直达，缩略图和预览一致，历史去重并保留原工程',async()=>{
  const historical=await history(data);assert.equal(effect.category,'connection');
  assert.ok(historical.excluded.some(e=>e.id==='tutorial-steps-ball'));
  assert.ok(!historical.recipes.some(e=>e.history_id==='tutorial-steps-ball'));
  for(const file of cross.rules['tutorial-steps-ball'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  const env=await environment(true,{staticPreview:true,hash:'#step-hop'});
  try{
    const {w}=env,d=w.document;env.reveal();
    assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const query of [effect.name,'台阶光球逐跳登顶'])assert.equal(w.MotionMatch.rank(data,query)[0].effect.id,effect.id);
    const thumb=d.querySelector('[data-effect="step-hop"] .thumb .motion-stage');
    const root=d.createElement('div'),player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);
    assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));
    assert.notEqual(thumb.querySelector('radialGradient').id,root.querySelector('radialGradient').id);
    player.destroy();assert.match(d.getElementById('code').textContent,/catalog\/effects\/step-hop\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
