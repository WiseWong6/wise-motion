// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment,frameMarkup} from './helpers.mjs';

const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/reel.js','utf8');
const local=await readFile(new URL('../catalog/effects/reel-grit-key.js',import.meta.url),'utf8');
const defs=[['frame-jitter-type',1900,700],['ghost-type-overprint',3000,1250],['film-scratch-flicker',3000,900],['panel-rise-collapse',6200,1700],['ball-bounce-trails',6200,1650],['timeline-keyframe-playhead',6200,1750],['keyframe-workbench',6200,2200],['shape-pop-float',5000,1600]].map(([id,duration_ms,preview_ms])=>({id,duration_ms,preview_ms,default_ease:'linear',parameters:{speed:{min:.5,max:2}},loop:false}));
const definition=id=>defs.find(d=>d.id===id);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} / ${b}`);
const nums=v=>(v.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
const math=source.slice(source.indexOf('const clamp ='),source.indexOf('function noise2'));
const bez=source.slice(source.indexOf('function bez1('),source.indexOf('/* ---------- type'));
const font=source.slice(source.indexOf('const F ='),source.indexOf('const CREDIT'));

// 只执行源绘制函数并记录绘制指令；没有浏览器、画布或截图。
function recorder(){
  const events=[],stack=[];let path=[];
  const ctx={globalAlpha:1,transforms:[],save(){stack.push({globalAlpha:this.globalAlpha,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,lineWidth:this.lineWidth,transforms:this.transforms.slice()});},restore(){Object.assign(this,stack.pop());},
    translate(...v){this.transforms.push(['translate',...v]);events.push({type:'translate',args:v});},scale(...v){this.transforms.push(['scale',...v]);},rotate(...v){this.transforms.push(['rotate',...v]);},
    beginPath(){path=[];},setLineDash(){},clip(){},moveTo(...v){path.push(['M',...v]);},lineTo(...v){path.push(['L',...v]);},bezierCurveTo(...v){path.push(['C',...v]);},
    arc(...v){path.push(['arc',...v]);},ellipse(...v){path.push(['ellipse',...v]);},roundRect(...v){path.push(['roundRect',...v]);},rect(...v){path.push(['rect',...v]);},
    strokeRect(){},fillRect(...args){events.push({type:'rect',args,fill:this.fillStyle,opacity:this.globalAlpha,transforms:this.transforms.slice()});},
    fill(){events.push({type:'fill',path:path.slice(),fill:this.fillStyle,opacity:this.globalAlpha});},stroke(){events.push({type:'stroke',path:path.slice(),stroke:this.strokeStyle,width:this.lineWidth});},
    fillText(...args){events.push({type:'text',args,fill:this.fillStyle});}
  };
  const box={ctx,W:1920,H:1080,VERT:false,TAU:Math.PI*2,txt:(s,x,y,o)=>events.push({type:'txt',s,x,y,o}),setFont(){},measure:()=>500,typeOn(){},revealChars(){}};
  runInNewContext(math+bez+font,box);
  return {ctx,box,events};
}
function originalGrit(t){const r=recorder();runInNewContext(source.slice(source.indexOf('function sGrit('),source.indexOf('function easeHandles('))+';sGrit(T,T+16);',Object.assign(r.box,{T:t}));return r.events;}
function originalComp(t){const r=recorder();runInNewContext(source.slice(source.indexOf('function easeHandles('),source.indexOf('function drawGraph('))+';drawComp({x:120,y:230,w:980,h:470},T);',Object.assign(r.box,{T:t}));return r.events;}
function originalTimeline(t){const r=recorder();runInNewContext(source.slice(source.indexOf('function easeHandles('),source.indexOf('function drawPanel('))+source.slice(source.indexOf('function drawTimeline('),source.indexOf('function sKey('))+';drawTimeline({x:120,y:730,w:1680,h:210},T);',Object.assign(r.box,{T:t}));return r.events;}
function originalShapes(t){const r=recorder(),start=source.indexOf('const PAL ='),end=source.indexOf('  const tx = VERT ? 64 : 130;',start);runInNewContext(source.slice(start,end)+'};sFlat(T,T+30);',Object.assign(r.box,{T:t}));return r.events;}
async function setup(){const e=await environment();e.w.eval(local);return e;}

test('抖动与套印按源帧号计算，两种帧率保持分离',async()=>{
  const e=await setup();try{const root=e.w.document.getElementById('root');let p=e.w.MotionRuntime.create(root,definition('frame-jitter-type'));
    for(const ms of [0,40,249,250,499,500,701,1300,1899]){p.seek(ms);const sourceTime=4.1+ms/1000,ref=originalGrit(sourceTime),g=root.querySelector('[data-layer="jitter"]');const original=ref.find(v=>v.type==='translate');nums(g.getAttribute('transform')).forEach((v,i)=>near(v,original.args[i]));
      for(const [i,n] of [...root.querySelectorAll('[data-line]')].entries()){const line=ref.find(v=>v.type==='txt'&&v.s===['THE','NERVOUS','TYPE.'][i]);assert.equal(n.getAttribute('visibility'),line?'visible':'hidden');if(line)near(+n.getAttribute('x'),line.x);}
    }p.destroy();p=e.w.MotionRuntime.create(root,definition('ghost-type-overprint'));
    for(const ms of [0,40,84,240,750,1250,1700,2999]){p.seek(ms);const words=originalGrit(ms/1000).filter(v=>v.type==='text'&&v.args[0]==='1995');[...root.querySelectorAll('[data-print]')].forEach((n,i)=>{near(+n.getAttribute('x'),words[i].args[1]);near(+n.getAttribute('y'),words[i].args[2]);near(+n.getAttribute('opacity'),[.05,.07,.09][i]);});}
    p.seek(100);const frozen=root.innerHTML;p.seek(120);assert.equal(root.innerHTML,frozen,'十二格采样窗口内不应平滑漂移');p.destroy();
  }finally{e.close();}
});

test('胶片层保留原细刮痕、二十六尘点、毛发和曝光公式',async()=>{
  const e=await setup();try{const root=e.w.document.getElementById('root'),p=e.w.MotionRuntime.create(root,definition('film-scratch-flicker'));
    for(const ms of [0,84,249,500,900,1500,2300,2999]){p.seek(ms);const ref=originalGrit(ms/1000),scratches=ref.filter(v=>v.type==='stroke'&&v.stroke==='rgba(232,226,208,.35)'),actual=[...root.querySelectorAll('[data-scratch]')].filter(n=>n.getAttribute('visibility')==='visible');assert.equal(actual.length,scratches.length);
      actual.forEach((n,i)=>{near(+n.getAttribute('stroke-width'),scratches[i].width);nums(n.getAttribute('d')).forEach((v,j)=>near(v,scratches[i].path.flatMap(p=>p.slice(1))[j]));});
      const dust=ref.filter(v=>v.type==='fill'&&v.path[0]?.[0]==='arc');assert.equal(dust.length,26);[...root.querySelectorAll('[data-dust]')].forEach((n,i)=>{for(const [j,k] of ['cx','cy','r'].entries())near(+n.getAttribute(k),dust[i].path[0][j+1]);const black=dust[i].fill.startsWith('rgba(0,');assert.equal(n.getAttribute('fill'),black?'#000':'#e8e2d0');near(+n.getAttribute('opacity'),black?.8:.6);});
      const flash=ref.at(-1);assert.equal(flash.type,'rect');near(+root.querySelector('[data-flash]').getAttribute('opacity'),nums(flash.fill)[3]);
      const hair=ref.find(v=>v.type==='stroke'&&v.stroke==='rgba(0,0,0,.7)');assert.equal(root.querySelector('[data-hair]').getAttribute('visibility'),hair?'visible':'hidden');
    }p.destroy();
  }finally{e.close();}
});

test('四段弹跳、六道残影与高度投影对应原软件窗口的真实椭圆',async()=>{
  const e=await setup();try{const root=e.w.document.getElementById('root'),p=e.w.MotionRuntime.create(root,definition('ball-bounce-trails'));
    for(const ms of [0,600,999,1000,1020,1250,1499,1500,1750,2250,2999,3000,4210,6199]){p.seek(ms);const ref=originalComp(ms/1000),balls=ref.filter(v=>v.type==='fill'&&v.fill==='#ff6b4a'),nodes=[...root.querySelectorAll('[data-ball]')].filter(n=>n.getAttribute('visibility')==='visible');assert.equal(nodes.length,balls.length);
      nodes.forEach((n,i)=>{const v=balls[i].path[0];near(+n.getAttribute('cx')-350,v[1]);for(const [k,j]of [['cy',2],['rx',3],['ry',4]])near(+n.getAttribute(k),v[j]);near(+n.getAttribute('opacity'),balls[i].opacity);});
      const shadow=ref.find(v=>v.type==='fill'&&v.fill==='rgba(0,0,0,.6)'),node=root.querySelector('[data-shadow]');near(+node.getAttribute('rx'),shadow.path[0][3]);near(+node.getAttribute('opacity'),shadow.opacity);
      const compare=ref.filter(v=>v.type==='rect'&&['#4aa3ff','#ffc93c'].includes(v.fill));[...root.querySelectorAll('[data-compare]')].forEach((n,i)=>near(+n.getAttribute('x')-350,compare[i].args[0]));
    }p.destroy();
  }finally{e.close();}
});

test('时间线二十六关键帧沿用原位置与接近阈值，游标单向循环',async()=>{
  const e=await setup();try{const root=e.w.document.getElementById('root'),p=e.w.MotionRuntime.create(root,definition('timeline-keyframe-playhead'));
    assert.equal(root.querySelectorAll('[data-key]').length,26);
    for(const ms of [0,900,1000,1100,1375,1750,1999,2250,2999,3000,4250,5000]){p.seek(ms);const ref=originalTimeline(ms/1000),keys=ref.filter(v=>v.type==='rect'&&v.args[0]===-5&&v.args[1]===-5),nodes=[...root.querySelectorAll('[data-key]')].filter(n=>n.getAttribute('visibility')==='visible');assert.equal(nodes.length,keys.length);
      nodes.forEach((n,i)=>{const ns=nums(n.getAttribute('transform')),tr=keys[i].transforms;near(ns[0],tr[0][1]);near(ns[1],tr[0][2]);near(ns[2]*Math.PI/180,tr[1][1]);near(ns[3],tr[2][1]);assert.equal(n.getAttribute('fill'),keys[i].fill);});
      const head=ref.find(v=>v.type==='rect'&&v.fill==='#4aa3ff'&&v.args[2]===2),n=root.querySelector('[data-playhead]');assert.equal(n.getAttribute('visibility'),head?'visible':'hidden');if(head)near(nums(n.getAttribute('transform'))[0],head.args[0]+1);
    }p.seek(2999);const right=nums(root.querySelector('[data-playhead]').getAttribute('transform'))[0];p.seek(3000);const left=nums(root.querySelector('[data-playhead]').getAttribute('transform'))[0];assert.ok(right>1700&&left===420);p.destroy();
  }finally{e.close();}
});

test('几何弹出保持原位置裁切、圆环线宽、错峰与同步漂浮',async()=>{
  const e=await setup();try{const root=e.w.document.getElementById('root'),p=e.w.MotionRuntime.create(root,definition('shape-pop-float'));
    for(const ms of [0,100,250,300,350,500,700,750,1000,1600,3000,5000]){p.seek(ms);const ref=originalShapes(3+ms/1000),disc=ref.find(v=>v.type==='fill'&&v.fill==='#ffc93c'&&v.path[0]?.[0]==='arc'),ring=ref.find(v=>v.type==='stroke'&&v.stroke==='#1fb5a8'),square=ref.find(v=>v.type==='rect'&&v.fill==='#ff9aa2');const d=root.querySelector('[data-shape="disc"]'),r=root.querySelector('[data-shape="ring"]'),s=root.querySelector('[data-shape="square"]');
      for(const [k,i]of [['cx',1],['cy',2],['r',3]])near(+d.getAttribute(k),disc.path[0][i]);near(+r.getAttribute('stroke-width'),ring.width);near(+r.getAttribute('cy'),ring.path[0][2]);near(+r.getAttribute('r'),ring.path[0][3]);for(const [i,k]of ['x','y','width','height'].entries())near(+s.getAttribute(k),square.args[i]);const tr=square.transforms.at(-2);near(nums(s.getAttribute('transform'))[1],tr[2]);
    }p.destroy();
  }finally{e.close();}
});

test('组合共用真实图层；所有缩略帧非空、回拖确定、节点有限且同帧零写入',async()=>{
  const e=await setup();try{const d=e.w.document,root=d.getElementById('root'),whole=e.w.MotionRuntime.create(root,definition('keyframe-workbench'));
    for(const [id,layer]of [['panel-rise-collapse','panels'],['ball-bounce-trails','bounce'],['timeline-keyframe-playhead','timeline']]){const host=d.createElement('div'),p=e.w.MotionRuntime.create(host,definition(id));for(const ms of [0,100,700,1600,2400,5400,5700,6010]){p.seek(ms);whole.seek(ms);assert.equal(frameMarkup(host.querySelector(`[data-layer="${layer}"]`)),frameMarkup(root.querySelector(`[data-layer="${layer}"]`)));}p.destroy();}whole.destroy();
    for(const def of defs){const p=e.w.MotionRuntime.create(root,def);p.seek(def.preview_ms);assert.ok(root.querySelectorAll('path,rect,circle,ellipse,text').length>3);assert.ok(root.querySelectorAll('*').length<230,def.id+' 节点应有界');assert.doesNotMatch(root.innerHTML,/NaN|Infinity/);for(const clip of root.querySelectorAll('clipPath'))for(const child of clip.children)assert.ok(['rect','path','circle','ellipse'].includes(child.localName));
      const before=root.innerHTML;p.seek(def.duration_ms);p.seek(0);p.seek(def.preview_ms);assert.equal(root.innerHTML,before,def.id+' 回拖应稳定');const observer=new e.w.MutationObserver(()=>{});observer.observe(root,{attributes:true,childList:true,subtree:true});p.seek(def.preview_ms);assert.equal(observer.takeRecords().length,0);observer.disconnect();p.destroy();
    }assert.equal(e.w.MotionRuntime.instanceCount,0);assert.doesNotMatch(local,/requestAnimationFrame|setInterval|Math\.random|setTimeout/);
  }finally{e.close();}
});
