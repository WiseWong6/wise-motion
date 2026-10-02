// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {data,environment} from './helpers.mjs';
const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/reel.js','utf8');
const math=source.slice(source.indexOf('const clamp ='),source.indexOf('function noise2'));
const originalMask=source.slice(source.indexOf('function transClip'),source.indexOf('function transFx'));
const cases=[['iris-open-transition','iris',4,.8],['slat-alternate-transition','slats',10,.7],['glitch-band-transition','glitch',16,.45],['radial-flash-transition','flash',22,.5],['tile-wave-transition','tiles',30,.9],['diagonal-edge-transition','diag',38,.7],['pixel-dissolve-transition','pixel',46,.8],['iris-flash-transition','iris',54,.5]];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const nums=text=>(text.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
const get=id=>data.effects.find(e=>e.id===id);
function original(type,p,t){
  const commands=[],ctx={beginPath(){},rect(...v){commands.push(['rect',...v]);},arc(...v){commands.push(['arc',...v]);},moveTo(...v){commands.push(['move',...v]);},lineTo(...v){commands.push(['line',...v]);},closePath(){},clip(){}};
  const c={ctx,W:1920,H:1080,TAU:Math.PI*2};runInNewContext(math+originalMask+'\nglobalThis.draw=transClip;',c);c.draw(type,p,t);return commands;
}
test('八种交接逐项对应原片遮罩几何、随机次序与真实时长',async()=>{
  const env=await environment();try{
    const {w}=env,root=w.document.getElementById('root');
    for(const [id,type,at,d] of cases){
      const player=w.MotionRuntime.create(root,get(id));
      for(const p of [0,.13,.29,.5,.76,.94,1]){
        const time=500+d*1000*p;player.seek(time);
        const actualP=Math.max(0,Math.min(1,(time-500)/(d*1000))),t=at-d/2+(time-500)/1000;
        const ref=original(type,actualP,t),path=root.querySelector('[data-mask]').getAttribute('d');
        if(type==='iris'){
          const radius=ref[0][3];if(radius===0)assert.equal(path,'');else {const n=nums(path);near(n[0],960-radius);near(n[2],radius);near(n[3],radius);}
        }else if(type==='diag'){
          const n=nums(path),expected=ref.flatMap(v=>v.slice(1));assert.equal(n.length,expected.length);n.forEach((v,i)=>near(v,expected[i]));
        }else{
          const rects=path.match(/M[^M]+/g)||[];assert.equal(rects.length,ref.length,id+' '+p);
          rects.forEach((text,i)=>{const n=nums(text);ref[i].slice(1).forEach((v,j)=>near(n[j],v));near(n[4],-n[2]);});
        }
        for(const clip of root.querySelectorAll('clipPath'))assert.ok([...clip.children].every(c=>['path','rect','circle'].includes(c.localName)));
        assert.ok(!root.innerHTML.includes('NaN'));assert.ok(root.querySelectorAll('*').length<50,'格子应合并为路径，不为每格创建一棵节点树');
      }
      player.destroy();
    }
  }finally{env.close();}
});
test('闪亮在换页中点达到峰值，撕裂彩带离开有效窗口后清除，结束画面不继续写入',async()=>{
  const env=await environment();try{
    const {w}=env,root=w.document.getElementById('root');
    for(const [id,type,,d] of cases){
      const player=w.MotionRuntime.create(root,get(id));
      player.seek(500+d*500);const alpha=+root.querySelector('[data-layer="flash"]').getAttribute('opacity');
      assert.equal(alpha,type==='flash'||id==='iris-flash-transition'?1:0);
      if(type==='glitch')assert.equal(root.querySelector('[data-layer="glitch"]').getAttribute('opacity'),'1');
      for(const time of [0,540,600,800,1300]){player.seek(time);const frame=root.innerHTML;player.seek(1800);player.seek(time);assert.equal(root.innerHTML,frame);}
      player.seek(1500);const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});player.seek(1700);assert.equal(observer.takeRecords().length,0,id+' 静置时不应继续改变隐藏碎片');observer.disconnect();
      assert.equal(root.querySelector('[data-layer="flash"]').getAttribute('opacity'),'0');assert.equal(root.querySelector('[data-layer="glitch"]').getAttribute('opacity'),'0');
      player.destroy();
    }
    assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});
test('横移十字光斑的中心、线长与明暗包络对应源码，组合复用同一图层',async()=>{
  const env=await environment();try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,get('cross-flare-travel'));
    const snippet=source.slice(source.indexOf('  // lens flare'),source.indexOf('  // neon year'));
    for(const time of [0,1700,1800,2000,2100,2300,2500,3000]){
      const calls=[],ctx={createRadialGradient(...args){return {args,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};},fillRect(...args){calls.push({args,fill:this.fillStyle});}};
      const sandbox={ctx,W:1920,H:1080,TAU:Math.PI*2};runInNewContext(math+'\nfunction draw(lt){const ty=500;'+snippet+'}\nglobalThis.draw=draw;',sandbox);sandbox.draw(time/1000);
      player.seek(time);const group=root.querySelector('[data-layer="flare"]'),glow=group.querySelector('[data-part="flare-glow"]'),lines=[...group.querySelectorAll('rect')],alpha=+glow.getAttribute('opacity');
      assert.equal(group.getAttribute('opacity'),null,'泛光和十字线不能先合并再统一淡入');
      assert.ok([glow,...lines].every(node=>node.parentNode===group),'两根线也不能经过带透明度的中间组');
      if(time<=1700||time>=2500){near(alpha,0);lines.forEach(line=>near(+line.getAttribute('opacity'),0));}else{
        const [x,y]=nums(group.getAttribute('transform'));near(x,calls[0].fill.args[0]);near(y,calls[0].fill.args[1]);
        const sourceAlpha=+calls[0].fill.stops[0][1].match(/,([^,]+)\)$/)[1],lineAlphas=calls.slice(1).map(call=>+call.fill.match(/,([^,]+)\)$/)[1]);
        near(alpha,sourceAlpha);lines.forEach((line,i)=>near(+line.getAttribute('opacity'),lineAlphas[i]));
        // 比较三次独立叠加后的交点亮度，不只比较单层透明度参数。
        const combined=values=>1-values.reduce((remaining,a)=>remaining*(1-a),1);
        const actual=combined([alpha,...lines.map(line=>+line.getAttribute('opacity'))]),expected=combined([sourceAlpha,...lineAlphas]);
        near(actual,expected);
        if(time===1800){assert.ok(actual>.73&&actual<.74,'渐亮期的中心仍应由三层叠加到约 0.735');assert.ok(actual-alpha>.35,'不能退化为整组约 0.383 的透明度');}
        assert.deepEqual(calls[1].args.slice(2),[600,2]);assert.deepEqual(calls[2].args.slice(2),[2,280]);
      }
    }
    player.destroy();
  }finally{env.close();}
});
