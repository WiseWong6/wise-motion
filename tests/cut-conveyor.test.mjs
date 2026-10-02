// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {history,state} from '../scripts/history.mjs';
import {environment,data} from './helpers.mjs';

const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const migration=id=>crosswalk.rules[id].migration;
const source=async(id,suffix)=>readFile(migration(id).files.find(x=>x.file.endsWith(suffix)).file,'utf8');
const close=env=>{env.w.MotionThumbs?.disposeAll();env.close();};

test('快切按原录屏加速帧表换图，边界只有一张画面，最后停留且重复定位一致',async()=>{
  const frames=JSON.parse(await source('naive-capture-mount','pelican-fast-frames.json'));
  const track=JSON.parse(await source('naive-capture-mount','pelican-zoom-track.json'));
  const changes=frames.map((f,i)=>({frame:i,shot:track.frames[f].caseNumber})).filter((x,i,a)=>i===0||x.shot!==a[i-1].shot);
  assert.equal(changes.length,10);
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),effect=data.effects.find(e=>e.id==='rapid-cut');
    const render=w.MotionFactories[effect.id](root,w.MotionKit,effect);
    const active=()=>[...root.querySelectorAll('[data-shot]')].filter(n=>n.getAttribute('display')!=='none');
    const expect=(time,index)=>{render(time);assert.equal(active().length,1);assert.equal(Number(active()[0].dataset.shot),index);};
    changes.forEach((change,i)=>{const time=change.frame*1000/30;if(i)expect(time-.001,i-1);expect(time,i);expect(time+.001,i);});
    expect(3000,9);const end=root.innerHTML;
    expect(800,2);expect(3000,9);assert.equal(root.innerHTML,end);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});
    render(3000);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelectorAll('image,video,canvas,text').length,0);
    assert.equal(effect.duration_ms,3000);assert.equal(effect.loop,false);
  }finally{close(env);}
});

test('卡片传送带保持八泳道与出场节奏，滚动减半后循环接缝不重新入场',async()=>{
  const original=await source('naive-conveyor-belts','Countdown.tsx');
  assert.match(original,/W\s*=\s*232/);assert.match(original,/GAP\s*=\s*30/);
  assert.match(original,/lane\s*<\s*4\s*\?\s*1\s*:\s*-1/);assert.match(original,/rotate\(-12deg\)/);
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),effect=data.effects.find(e=>e.id==='card-conveyor');
    const render=w.MotionFactories[effect.id](root,w.MotionKit,effect),lanes=[...root.querySelectorAll('[data-lane]')];
    assert.equal(lanes.length,8);
    assert.match(root.querySelector('svg > g').getAttribute('transform'),/rotate\(-12\).*scale\(.333/);
    assert.equal(root.querySelectorAll('image,video,canvas,text').length,0);
    const position=n=>n.getAttribute('transform').match(/translate\(([-.\d]+) ([-.\d]+)\)/).slice(1).map(Number);
    const modulo=x=>((x+1572)%3144+3144)%3144-1572;
    for(const time of [0,200,500,800,1200,1700,3000]){
      render(time);
      const f=Math.max(0,time*30/1000-4),distance=f<=20?4*f*f:1600+(f-20)*160;
      const travel=distance*.5;
      assert.equal(Number(root.querySelector('[data-mask="upper"]').getAttribute('width')),Math.min(3400,distance));
      assert.equal(Number(root.querySelector('[data-mask="lower"]').getAttribute('x')),1700-Math.min(3400,distance));
      lanes.forEach((lane,i)=>{
        const [x,y]=position(lane);assert.equal(y,(i-3.5)*214);
        const copies=[...lane.querySelectorAll('use')];
        // 每张原卡片在原窗口内都恰好有一个对应副本，不因整带循环丢失或重复。
        for(let col=0;col<12;col++){
          const expected=modulo(col*262+(i%4)*70+(i<4?travel:-travel));
          const matches=copies.filter((card,j)=>j%12===col&&Math.abs(x+Number(card.getAttribute('x'))+116-expected)<1e-8);
          assert.equal(matches.length,1);
        }
      });
    }
    render(200);assert.ok(position(lanes[0])[0]>0);assert.ok(position(lanes[4])[0]<0);
    render(3000,{elapsed:3000});const seam=root.innerHTML;
    render(0,{elapsed:3000});assert.equal(root.innerHTML,seam);
    render(1200);const first=lanes.map(position);
    render(2510);lanes.forEach((lane,i)=>assert.ok(Math.abs(position(lane)[0]-first[i][0])<1e-8,'首尾副本应保持一个完整卡带周期'));
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});
    render(2510);assert.equal(observer.takeRecords().length,0);observer.disconnect();
  }finally{close(env);}
});

test('指定历史入口已清理，两个标准动作只入库一次，来源文件未被改写',async()=>{
  const historical=await history(data);
  for(const id of ['naive-plate-push','naive-node-backout','naive-prompt-dock','naive-capture-mount','naive-conveyor-belts']){
    assert.ok(historical.excluded.some(e=>e.id===id));assert.ok(!historical.recipes.some(e=>e.history_id===id));
  }
  assert.ok(historical.recipes.some(e=>e.history_id==='promo-grid-zoom'));
  for(const id of ['naive-capture-mount','naive-conveyor-belts']){
    assert.equal(data.effects.filter(e=>e.id===migration(id).effect).length,1);
    for(const item of migration(id).files)assert.equal(createHash('sha256').update(await readFile(item.file)).digest('hex'),item.sha256);
  }
});

test('新动作缩略图静止且完整，主预览与缩略图的裁切窗口互不影响',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;env.reveal();
    for(const id of ['rapid-cut','card-conveyor']){
      const card=d.querySelector(`[data-effect="${id}"]`),thumb=card.querySelector('.thumb');
      assert.ok(thumb.querySelector('.pattern-svg'));assert.equal(thumb.querySelector('.history-placeholder'),null);
      const staticFrame=thumb.innerHTML;card.click();
      // 初次载入定位在缩略图时刻，不借用缩略图里的可变裁切窗口。
      const playerMask=d.querySelector('#preview [data-mask="upper"]'),thumbMask=thumb.querySelector('[data-mask="upper"]');
      if(playerMask){assert.notEqual(playerMask.parentElement.id,thumbMask.parentElement.id);assert.ok(Number(thumbMask.getAttribute('width'))>0);}
      d.getElementById('restart').click();
      assert.equal(thumb.innerHTML,staticFrame);assert.equal(w.MotionRuntime.instanceCount,1);
    }
  }finally{close(env);}
});
