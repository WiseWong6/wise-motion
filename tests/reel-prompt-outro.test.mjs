// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment} from './helpers.mjs';

const code=await readFile(new URL('../catalog/effects/reel-prompt-outro.js',import.meta.url),'utf8');
const art=JSON.parse(code.match(/const artwork = (.*);\n/)[1]);
const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/';
const source=await readFile(sourceRoot+'reel.js','utf8'),shared={window:{}};
runInNewContext(await readFile(sourceRoot+'shared.js','utf8'),shared);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} / ${expected}`);
const nums=s=>(s.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
const defs={
  'prompt-border-trace':[1400,600],'prompt-chinese-type':[4800,3000],
  'prompt-char-gather':[3000,1000],'send-press-ring':[1100,240],
  'prompt-ui-push':[4800,2500],'core-ring-expand':[1500,1050],
  'prompt-to-core-sequence':[8000,3700],'radial-line-burst':[1100,160],
  'timeline-dock-down':[1600,1000],'color-segment-stagger':[1400,900],
  'outro-recap-sequence':[6000,4400]
};
const definition=id=>({id,duration_ms:defs[id][0],preview_ms:defs[id][1],loop:false,default_ease:'linear'});
async function env(){const e=await environment();e.w.eval(code);return e;}

// 调用原绘制函数，只记录几何与颜色；不打开浏览器、不截图、不建立画布。
// 普通英文改成 Oswald Bold、正文改成 Light 是有意的目录适配；动作仍对照原时钟。
function original(scene,time){
  const events=[],stack=[],gradients=[];let path=[];
  const snapshot=ctx=>({font:ctx.font,letterSpacing:ctx.letterSpacing,fillStyle:ctx.fillStyle,strokeStyle:ctx.strokeStyle,lineWidth:ctx.lineWidth,globalAlpha:ctx.globalAlpha,operations:[...ctx.operations],dash:[...ctx.dash]});
  const ctx={globalAlpha:1,operations:[],dash:[],letterSpacing:'0px',font:'400 32px sans-serif',
    save(){stack.push(snapshot(this));},restore(){Object.assign(this,stack.pop());},
    translate(...v){this.operations.push(['translate',...v]);},scale(...v){this.operations.push(['scale',...v]);},rotate(...v){this.operations.push(['rotate',...v]);},
    beginPath(){path=[];},moveTo(...v){path.push(['M',...v]);},lineTo(...v){path.push(['L',...v]);},
    roundRect(...v){path.push(['roundRect',...v]);},rect(...v){path.push(['rect',...v]);},arc(...v){path.push(['arc',...v]);},clip(){},
    fill(){events.push({kind:'fill',path:[...path],...snapshot(this)});},stroke(){events.push({kind:'stroke',path:[...path],...snapshot(this)});},
    fillRect(...v){events.push({kind:'fillRect',args:v,...snapshot(this)});},strokeRect(...v){events.push({kind:'strokeRect',args:v,...snapshot(this)});},
    fillText(text,x,y){events.push({kind:'text',text,x,y,...snapshot(this)});},setLineDash(v){this.dash=v;},
    measureText(s){
      const size=+this.font.match(/([\d.]+)px/)[1],track=parseFloat(this.letterSpacing)||0;
      if(this.font.includes('PingFang SC')&&s.length===1)return {width:art.layout.find(c=>c.ch===s).w*size/21.5};
      const r=[...art.credits,...art.promptLabels].find(r=>size===r.size&&r.text.startsWith(s));
      if(r){const width=s===r.text?r.width+(r.track||0):s.length?r.letters[s.length].x-r.x0:0;return {width};}
      return {width:s.length*(size*.6+track)};
    },
    createRadialGradient(...args){const g={args,stops:[],addColorStop(n,c){this.stops.push([n,c]);}};gradients.push(g);return g;}
  };
  const functions=source.slice(source.indexOf('const clamp ='),source.indexOf('function noise2'))+
    source.slice(source.indexOf('const F ='),source.indexOf('/* ============================================================\n   SCENE 0'))+
    source.slice(source.indexOf('let PL = null;'),source.indexOf('/* ============================================================\n   timeline, transitions'));
  const sandbox={ctx,W:1920,H:1080,VERT:false,TAU:Math.PI*2,S:shared.window.SHARED};
  runInNewContext(functions+';globalThis.draw='+scene+';',sandbox);sandbox.draw(time,scene==='sPrompt'?46+time:54+time);
  return {events,gradients};
}

test('输入框按原尺寸、描边、工具、推近与发送时刻复现，没有重画成示意卡片',async()=>{
  const e=await env();try{
    const root=e.w.document.getElementById('root'),p=e.w.MotionRuntime.create(root,definition('prompt-to-core-sequence')),part=n=>root.querySelector(`[data-part="${n}"]`);
    assert.equal(art.prompt,shared.window.SHARED.PROMPT);
    for(const n of root.querySelectorAll('text')){if(n.closest('[data-char]')){assert.match(n.getAttribute('style'),/Wise Motion Sans/);assert.match(n.getAttribute('style'),/font-weight:300/);}else{assert.match(n.getAttribute('style'),/font-family:Oswald/);assert.match(n.getAttribute('style'),/font-weight:700/);}}
    assert.deepEqual(art.credits.map(r=>r.font),['HelveticaNeue-Bold','Oswald-Bold','Oswald-Bold']);assert.equal(art.layout.length,110);assert.equal(Math.max(...art.layout.map(c=>c.line)),2);
    for(const label of ['claude new','master','This Mac','Claude Opus 5.5 1M Medium','Plan New Idea','Multitask','Motion, from a prompt.'])assert.ok(root.textContent.includes(label));
    for(const t of [0,.2,.6,.9,1.4,2.8,4.6,5,5.125,5.24,5.49,5.8]){
      p.seek(t*1000);const ref=original('sPrompt',t),box=ref.events.find(x=>x.kind==='fill'&&x.path[0]?.[0]==='roundRect'&&x.path[0][1]===45);
      const move=nums(root.querySelector('[data-pose="ui"]').getAttribute('transform'));
      near(move[0],box.operations[0][1]);near(move[1],box.operations[0][2]);near(move[2],box.operations[1][1]);
      near(+part('panel-chrome').getAttribute('opacity'),box.globalAlpha);
      const border=ref.events.find(x=>x.kind==='stroke'&&x.path[0]?.[0]==='roundRect'&&x.path[0][1]===45);
      nums(part('border').getAttribute('stroke-dasharray')).forEach((v,i)=>near(v,border.dash[i]));
      near(+part('border').getAttribute('stroke-opacity'),nums(border.strokeStyle)[3]*border.globalAlpha);
      near(+part('border').getAttribute('stroke-width'),border.lineWidth);
      const button=ref.events.find(x=>x.kind==='fill'&&x.path[0]?.[0]==='arc'&&x.path[0][1]===0&&x.path[0][3]===17);
      near(nums(part('send-button').getAttribute('transform'))[2],button.operations.at(-1)[1]);
      near(+part('send-opacity').getAttribute('opacity'),button.globalAlpha);
      const ring=ref.events.find(x=>x.kind==='stroke'&&x.path[0]?.[0]==='arc'&&x.path[0][1]===952);
      if(ring){near(+part('send-ring').getAttribute('r'),ring.path[0][3]);near(+part('send-ring').getAttribute('opacity'),nums(ring.strokeStyle)[3]);}
      else assert.equal(+part('send-ring').getAttribute('opacity'),0);
    }
    p.destroy();
  }finally{e.close();}
});

test('原提示词的逐字出生、绕行控制点、旋转缩放与七色变换均对应原绘制代码',async()=>{
  const e=await env();try{
    const root=e.w.document.getElementById('root'),p=e.w.MotionRuntime.create(root,definition('prompt-to-core-sequence'));
    for(const t of [.89,.93,1.3,2.35,4.51,5.32,5.75,6.2,6.8,7.1,7.4,7.56]){
      p.seek(t*1000);const ref=original('sPrompt',t),actual=[...root.querySelectorAll('[data-char]')].filter(n=>n.getAttribute('visibility')==='visible'),expected=ref.events.filter(x=>x.kind==='text'&&x.font.includes('PingFang SC'));
      assert.equal(actual.length,expected.length,`字符数量 ${t}`);
      actual.forEach((n,i)=>{
        const r=expected[i],a=nums(n.getAttribute('transform')),text=n.firstElementChild;
        assert.equal(text.textContent,r.text);assert.equal(text.getAttribute('fill'),r.fillStyle);near(+n.getAttribute('opacity'),r.globalAlpha);
        const size=+r.font.match(/([\d.]+)px/)[1];
        if(r.operations.length){
          near(a[0],r.operations[0][1]);near(a[1],r.operations[0][2]);near(a[2],r.operations[1][1]*180/Math.PI);near(a[3]*21.5,size*r.operations[2][1]);near(+text.getAttribute('x')*size/21.5,r.x);
        }else{near(a[0],r.x);near(a[1],r.y);near(a[2]*21.5,size);}
      });
    }
    p.destroy();
  }finally{e.close();}
});

test('光核、错相光环与七十条短线保持原几何、颜色和衰减关系',async()=>{
  const e=await env();try{
    const root=e.w.document.getElementById('root'),p=e.w.MotionRuntime.create(root,definition('core-ring-expand'));
    for(const ms of [0,120,350,770,1300,1500]){
      p.seek(ms);const ref=original('sPrompt',6.5+ms/1000),gradient=ref.gradients[1];
      if(gradient){near(+root.querySelector('[data-part="core-gradient"]').getAttribute('r'),gradient.args[5]);
        const rings=ref.events.filter(x=>x.kind==='stroke'&&x.path[0]?.[0]==='arc'&&x.path[0][1]===960);
        [...root.querySelectorAll('[data-core-ring]')].forEach((n,i)=>{near(+n.getAttribute('r'),rings[i].path[0][3]);near(+n.getAttribute('opacity'),nums(rings[i].strokeStyle)[3]);});
      }else assert.equal(root.querySelector('[data-part="core"]').getAttribute('visibility'),'hidden');
    }
    p.destroy();const b=e.w.MotionRuntime.create(root,definition('radial-line-burst'));
    for(const ms of [0,30,160,450,1050]){
      b.seek(ms);const lines=original('sOutro',ms/1000).events.filter(x=>x.kind==='stroke'&&x.path.length===2&&x.path[0][0]==='M');
      assert.equal(lines.length,70);[...root.querySelectorAll('[data-ray]')].forEach((n,i)=>{const r=lines[i];near(+n.getAttribute('x1'),r.path[0][1]);near(+n.getAttribute('y1'),r.path[0][2]);near(+n.getAttribute('x2'),r.path[1][1]);near(+n.getAttribute('y2'),r.path[1][2]);near(+n.getAttribute('stroke-width'),r.lineWidth);assert.equal(n.getAttribute('stroke'),r.strokeStyle);near(+root.querySelector('[data-part="burst"]').getAttribute('stroke-opacity'),r.globalAlpha);});
    }
    b.destroy();
  }finally{e.close();}
});

test('片尾只保留完成态时间轴的缩小下移，七色色带与落款仍按原时钟进入',async()=>{
  const e=await env();try{
    const root=e.w.document.getElementById('root'),p=e.w.MotionRuntime.create(root,definition('outro-recap-sequence'));
    assert.equal(root.querySelectorAll('[data-part="axis"] circle').length,7);
    assert.equal(root.querySelectorAll('[data-part="axis"] rect').length,1,'没有重建年代扫描轨道');
    for(const t of [0,2.5,2.8,3.2,3.6,3.93,4.4,5.5]){
      p.seek(t*1000);const ref=original('sOutro',t);
      const axis=ref.events.find(x=>x.kind==='fillRect'&&x.args[0]===260&&x.args[1]===539),actual=nums(root.querySelector('[data-part="axis"]').getAttribute('transform'));
      assert.deepEqual(actual,axis.operations.flatMap(x=>x.slice(1)).filter((_,i)=>i!==3));
      const bands=ref.events.filter(x=>x.kind==='fillRect'&&x.args[1]===476);
      [...root.querySelectorAll('[data-segment]')].forEach((n,i)=>{['x','y','width','height'].forEach((key,k)=>near(+n.getAttribute(key),bands[i].args[k]));assert.equal(n.getAttribute('fill'),bands[i].fillStyle);});
      const headline=ref.events.filter(x=>x.kind==='text'&&x.font.includes('230px'));
      const letters=[...root.querySelectorAll('[data-credit="headline"] [data-letter]')].filter(n=>n.getAttribute('visibility')==='visible');
      assert.equal(letters.length,headline.length);letters.forEach((n,i)=>{const a=nums(n.getAttribute('transform'));near(a[0],headline[i].x);near(a[1],headline[i].y);});
      near(+root.querySelector('[data-part="fade"]').getAttribute('opacity'),nums(ref.events.at(-1).fillStyle)[3]);
    }
    p.destroy();
  }finally{e.close();}
});

test('独立动作与组合共用对应图层，原速裁切可对照，任意回拖不新增节点或计时器',async()=>{
  const e=await env();try{
    const d=e.w.document,root=d.createElement('div'),combo=e.w.MotionRuntime.create(root,definition('prompt-to-core-sequence'));
    const clean=n=>n.outerHTML.replace(/motion-(prompt|outro)-\d+/g,'fixed-id').replace(/-?\d+\.\d+(?:e[-+]?\d+)?/gi,n=>String(Math.round(Number(n)*1e7)/1e7));
    const pairs=[['prompt-border-trace','[data-part="border"]',0,[100,600]],['prompt-chinese-type','[data-part="letters"]',0,[1300,3700]],['prompt-char-gather','[data-part="letters"]',5000,[330,1000,1600]],['send-press-ring','[data-part="send-button"]',4900,[100,225,500]],['prompt-ui-push','[data-layer="ui"]',0,[300,2000,4500]],['core-ring-expand','[data-part="core"]',6500,[100,700,1500]]];
    for(const [id,selector,offset,times]of pairs){const host=d.createElement('div'),p=e.w.MotionRuntime.create(host,definition(id));for(const time of times){p.seek(time);combo.seek(offset+time);assert.equal(clean(host.querySelector(selector)),clean(root.querySelector(selector)),`${id} @ ${time}`);}p.destroy();}
    combo.destroy();const out=e.w.MotionRuntime.create(root,definition('outro-recap-sequence'));
    for(const [id,selector,offset,times]of [['radial-line-burst','[data-layer="burst"]',0,[160,500]],['timeline-dock-down','[data-layer="axis"]',2300,[100,500,900]],['color-segment-stagger','[data-layer="segments"]',3200,[200,600,1000]]]){const host=d.createElement('div'),p=e.w.MotionRuntime.create(host,definition(id));for(const time of times){p.seek(time);out.seek(offset+time);assert.equal(clean(host.querySelector(selector)),clean(root.querySelector(selector)));}p.destroy();}out.destroy();
    for(const id of Object.keys(defs)){
      const p=e.w.MotionRuntime.create(root,definition(id));p.seek(defs[id][1]);const markup=root.innerHTML,nodes=[...root.querySelectorAll('*')];
      p.seek(0);p.seek(defs[id][0]);p.seek(defs[id][1]);assert.equal(root.innerHTML,markup,`${id} rewind`);assert.deepEqual([...root.querySelectorAll('*')],nodes);
      const observer=new e.w.MutationObserver(()=>{});observer.observe(root,{attributes:true,childList:true,subtree:true});p.seek(defs[id][1]);assert.equal(observer.takeRecords().length,0);observer.disconnect();
      for(const clip of root.querySelectorAll('clipPath'))for(const n of clip.children)assert.ok(['rect','path','circle','ellipse','use','text'].includes(n.localName));
      assert.ok(!/\b(?:NaN|Infinity|undefined)\b/.test(root.innerHTML),id);p.destroy();
    }
    assert.equal(e.w.MotionRuntime.instanceCount,0);assert.equal(e.w.MotionRuntime.runningCount,0);
    assert.doesNotMatch(code,/requestAnimationFrame|setInterval|setTimeout|Math\.random|getBoundingClientRect|getComputedTextLength/);
  }finally{e.close();}
});
