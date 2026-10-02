// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment,data,frameMarkup} from './helpers.mjs';

const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/reel.js','utf8');
const local=await readFile(new URL('../catalog/effects/reel-grit-key.js',import.meta.url),'utf8');
const defs=[['frame-jitter-type',1900,700],['ghost-type-overprint',3000,1250],['film-scratch-flicker',3000,900],['panel-rise-collapse',6200,1700],['ball-bounce-trails',6200,1650],['timeline-keyframe-playhead',6200,1750],['keyframe-workbench',8000,2200],['shape-pop-float',5000,1600]].map(([id,duration_ms,preview_ms])=>({id,duration_ms,preview_ms,default_ease:'linear',parameters:{speed:{min:.5,max:2}},loop:false}));
const definition=(id,variantId)=>{
  if(id!=='title-stagger')return defs.find(d=>d.id===id);
  const base=data.effects.find(e=>e.id===id),variant=base?.variants?.find(v=>v.id===variantId);
  assert.ok(variant,id+' 缺少 '+variantId+' 样式');
  return {...base,...variant,id,variant_id:variantId};
};
defs.push(definition('title-stagger','handoff'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} / ${b}`);
const nums=v=>(v.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
const math=source.slice(source.indexOf('const clamp ='),source.indexOf('function noise2'));
const bez=source.slice(source.indexOf('function bez1('),source.indexOf('/* ---------- type'));
const font=source.slice(source.indexOf('const F ='),source.indexOf('const CREDIT'));

// 只执行源绘制函数并记录绘制指令；没有浏览器、画布或截图。
function recorder(){
  const events=[],stack=[];let path=[];
  const ctx={globalAlpha:1,transforms:[],save(){stack.push({globalAlpha:this.globalAlpha,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,lineWidth:this.lineWidth,font:this.font,letterSpacing:this.letterSpacing,clipPath:this.clipPath,transforms:this.transforms.slice()});},restore(){Object.assign(this,stack.pop());},
    translate(...v){this.transforms.push(['translate',...v]);events.push({type:'translate',args:v});},scale(...v){this.transforms.push(['scale',...v]);},rotate(...v){this.transforms.push(['rotate',...v]);},
    beginPath(){path=[];},setLineDash(){},clip(){this.clipPath=path.slice();},moveTo(...v){path.push(['M',...v]);},lineTo(...v){path.push(['L',...v]);},bezierCurveTo(...v){path.push(['C',...v]);},
    arc(...v){path.push(['arc',...v]);},ellipse(...v){path.push(['ellipse',...v]);},roundRect(...v){path.push(['roundRect',...v]);},rect(...v){path.push(['rect',...v]);},
    strokeRect(...args){events.push({type:'strokeRect',args,stroke:this.strokeStyle,width:this.lineWidth});},fillRect(...args){events.push({type:'rect',args,fill:this.fillStyle,opacity:this.globalAlpha,transforms:this.transforms.slice()});},
    fill(){events.push({type:'fill',path:path.slice(),fill:this.fillStyle,opacity:this.globalAlpha});},stroke(){events.push({type:'stroke',path:path.slice(),stroke:this.strokeStyle,width:this.lineWidth});},
    measureText(s){return {width:s.length*(+(this.font||'32px').match(/([\d.]+)px/)[1])*.5+s.length*(parseFloat(this.letterSpacing)||0)};},
    fillText(...args){events.push({type:'text',args,fill:this.fillStyle,opacity:this.globalAlpha,font:this.font,clip:this.clipPath});}
  };
  const box={ctx,W:1920,H:1080,VERT:false,TAU:Math.PI*2,txt:(s,x,y,o)=>events.push({type:'txt',s,x,y,o}),setFont(){},measure:()=>500,typeOn(){},revealChars(){}};
  runInNewContext(math+bez+font,box);
  return {ctx,box,events};
}
function originalGrit(t){const r=recorder();runInNewContext(source.slice(source.indexOf('function sGrit('),source.indexOf('function easeHandles('))+';sGrit(T,T+16);',Object.assign(r.box,{T:t}));return r.events;}
function originalComp(t){const r=recorder();runInNewContext(source.slice(source.indexOf('function easeHandles('),source.indexOf('function drawGraph('))+';drawComp({x:120,y:230,w:980,h:470},T);',Object.assign(r.box,{T:t}));return r.events;}
function originalGraph(t){const r=recorder();runInNewContext(source.slice(source.indexOf('function easeHandles('),source.indexOf('function drawPanel('))+source.slice(source.indexOf('function drawGraph('),source.indexOf('function drawTimeline('))+';drawGraph({x:1130,y:230,w:670,h:470},T);',Object.assign(r.box,{T:t}));return r.events;}
function originalTimeline(t){const r=recorder();runInNewContext(source.slice(source.indexOf('function easeHandles('),source.indexOf('function drawPanel('))+source.slice(source.indexOf('function drawTimeline('),source.indexOf('function sKey('))+';drawTimeline({x:120,y:730,w:1680,h:210},T);',Object.assign(r.box,{T:t}));return r.events;}
function originalShapes(t){const r=recorder(),start=source.indexOf('const PAL ='),end=source.indexOf('  const tx = VERT ? 64 : 130;',start);runInNewContext(source.slice(start,end)+'};sFlat(T,T+30);',Object.assign(r.box,{T:t}));return r.events;}
function originalKey(t){
  const r=recorder();Object.assign(r.box,{drawPanel(){},drawComp(){},drawGraph(){},drawTimeline(){},T:t});
  runInNewContext(source.slice(source.indexOf('function setFont('),source.indexOf('function chevron('))+source.slice(source.indexOf('function sKey('),source.indexOf('/* ============================================================',source.indexOf('function sKey(')))+';sKey(T,T+22);',r.box);
  return r.events;
}
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

test('三窗组合还原原曲线和方块联动，独立曲线确实使用同一绘制函数',async()=>{
  const e=await setup();try{
    const root=e.w.document.getElementById('root'),factory=e.w.MotionFactories['bezier-editor'];
    let calls=0;const graphMotion=factory.graphMotion;
    factory.graphMotion=(...args)=>{const draw=graphMotion(...args);return(...states)=>{calls++;return draw(...states);};};
    const whole=e.w.MotionRuntime.create(root,definition('keyframe-workbench'));
    assert.ok(calls>0,'工作台应实际调用共用曲线绘制器');
    const windows=[...root.querySelector('[data-layer="panels"]').children];
    assert.deepEqual(windows.map(n=>[+n.firstChild.getAttribute('x'),+n.firstChild.getAttribute('width')]),[[120,980],[1130,670],[120,1680]]);
    for(const ms of [0,500,950,1001,1300,1600,1800,2400,2900,4000,5500,5929,5930]){
      whole.seek(ms);const ref=originalGraph(ms/1000),q=name=>root.querySelector(`[data-layer="graph"] [data-part="${name}"]`);
      const curve=ref.find(v=>v.type==='stroke'&&v.stroke==='#ffc93c');
      assert.deepEqual(nums(q('curve').getAttribute('d')).map(v=>Math.round(v*1e7)),curve.path.flatMap(p=>p.slice(1)).map(v=>Math.round(v*1e7)),'原曲线采样点');
      const handles=ref.filter(v=>v.type==='fill'&&v.fill==='#fff');
      for(let i=0;i<2;i++){near(+q('handle'+i).getAttribute('cx'),handles[i].path[0][1]);near(+q('handle'+i).getAttribute('cy'),handles[i].path[0][2]);}
      const point=ref.find(v=>v.type==='fill'&&v.fill==='#ffc93c');
      assert.equal(q('point').getAttribute('opacity'),point?'1':'0');
      if(point){for(const [k,j]of [['cx',1],['cy',2]])assert.ok(Math.abs(+q('point').getAttribute(k)-point.path[0][j])<.001);
        const [linear,eased]=root.querySelectorAll('[data-compare]');
        near((+linear.getAttribute('x')+13-290)/700,(+q('point').getAttribute('cx')-1190)/550);
        near((+eased.getAttribute('x')+13-290)/700,(640-(+q('point').getAttribute('cy')))/310);
      }
      const line=ref.find(v=>v.type==='txt');assert.equal(q('coordinates').textContent,line.s);
      const elapsed=ms/1000,index=1,cy=465,clamp=x=>Math.max(0,Math.min(1,x)),progress=clamp((elapsed-(5.4+index*.08))/.45),collapse=progress<=0?0:2**(10*progress-10);
      near(nums(windows[1].getAttribute('transform'))[3],1-collapse);
    }
    whole.destroy();
    // 独立动作保持两个原有案例；其主体函数使用与组合导出相同的 graphMotion。
    assert.match(await readFile(new URL('../catalog/effects/data-comparisons.js',import.meta.url),'utf8'),/const graph=graphMotion\(root\)/);
    const standalone=e.w.MotionRuntime.create(root,{id:'bezier-editor',duration_ms:6000,default_ease:'linear',loop:false});
    standalone.seek(1600);assert.ok(+root.querySelector('[data-part="handle0"]').getAttribute('cx')>312);
    standalone.seek(4900);assert.equal(root.querySelector('[data-part="large-companion"]').getAttribute('opacity'),'1');standalone.destroy();
  }finally{e.close();}
});

test('组合按原位置复用图层；所有缩略帧非空、回拖确定、节点有限且同帧零写入',async()=>{
  const e=await setup();try{const d=e.w.document,root=d.getElementById('root'),whole=e.w.MotionRuntime.create(root,definition('keyframe-workbench'));
    for(const [id,layer]of [['panel-rise-collapse','panels'],['ball-bounce-trails','bounce'],['timeline-keyframe-playhead','timeline']]){
      const host=d.createElement('div'),p=e.w.MotionRuntime.create(host,definition(id));
      for(const ms of [0,100,700,1600,2400,5400,5700,6010]){
        p.seek(ms);whole.seek(ms);const single=host.querySelector(`[data-layer="${layer}"]`),combined=root.querySelector(`[data-layer="${layer}"]`);
        if(layer==='panels'){
          assert.equal(single.children.length,2);assert.equal(combined.children.length,3);
          for(const n of single.children){const pair=combined.querySelector(`[data-window="${n.dataset.window}"]`);for(const attr of ['transform','opacity'])assert.equal(n.getAttribute(attr),pair.getAttribute(attr));}
        }else if(layer==='bounce'){
          const a=[...single.querySelectorAll('*')],b=[...combined.querySelectorAll('*')];assert.equal(a.length,b.length);
          a.forEach((n,i)=>{assert.equal(n.tagName,b[i].tagName);for(const attr of n.attributes){const actual=b[i].getAttribute(attr.name);if(['x','cx'].includes(attr.name))near(+attr.value-350,+actual);else assert.equal(attr.value,actual);}});
        }else assert.equal(frameMarkup(single),frameMarkup(combined));
      }p.destroy();
    }whole.destroy();
    for(const def of defs){const p=e.w.MotionRuntime.create(root,def);p.seek(def.preview_ms);assert.ok(root.querySelectorAll('path,rect,circle,ellipse,text').length>3);assert.ok(root.querySelectorAll('*').length<(def.id==='keyframe-workbench'?260:230),def.id+' 节点应有界');assert.doesNotMatch(root.innerHTML,/NaN|Infinity/);for(const clip of root.querySelectorAll('clipPath'))for(const child of clip.children)assert.ok(['rect','path','circle','ellipse'].includes(child.localName));
      const before=root.innerHTML;p.seek(def.duration_ms);p.seek(0);p.seek(def.preview_ms);assert.equal(root.innerHTML,before,def.id+' 回拖应稳定');const observer=new e.w.MutationObserver(()=>{});observer.observe(root,{attributes:true,childList:true,subtree:true});p.seek(def.preview_ms);assert.equal(observer.takeRecords().length,0);observer.disconnect();p.destroy();
    }assert.equal(e.w.MotionRuntime.instanceCount,0);assert.doesNotMatch(local,/requestAnimationFrame|setInterval|Math\.random|setTimeout/);
  }finally{e.close();}
});


test('完整软件段保留原后两秒大曲线，独立两个案例与组合共用实际大曲线函数',async()=>{
  const e=await setup();try{
    const root=e.w.document.getElementById('root'),F=e.w.MotionFactories,shared=F['bezier-editor'].largeGraphMotion;let calls=0;
    F['bezier-editor'].largeGraphMotion=(...args)=>{calls++;return shared(...args);};
    const whole=e.w.MotionRuntime.create(root,definition('keyframe-workbench'));assert.equal(calls,1);
    const group=root.querySelector('[data-layer="large-graph"]'),q=id=>group.querySelector(`[data-part="${id}"]`);
    for(const ms of [0,5700,5701,5999,6000,6200,6450,6700,6900,6901,7250,7750,7900,7999,8000]){
      whole.seek(ms);const ref=originalKey(ms/1000),curve=ref.find(v=>v.type==='stroke'&&v.stroke==='#ffc93c'&&v.width===6);
      assert.equal(group.getAttribute('opacity'),ms>5700?'1':'0');
      if(curve){
        assert.deepEqual(nums(q('curve').getAttribute('d')).map(v=>Math.round(v*1e7)),curve.path.flatMap(p=>p.slice(1)).map(v=>Math.round(v*1e7)));
        const border=ref.find(v=>v.type==='strokeRect');['x','y','width','height'].forEach((key,i)=>near(+q('large-border').getAttribute(key),border.args[i]));
      }
      const point=ref.find(v=>v.type==='fill'&&v.fill==='#fff'),ball=ref.find(v=>v.type==='fill'&&v.fill==='#ffc93c');
      assert.equal(q('point').getAttribute('opacity'),point?'1':'0');
      if(point){for(const [attr,i]of [['cx',1],['cy',2],['r',3]])near(+q('point').getAttribute(attr),point.path[0][i]);for(const [attr,i]of [['cx',1],['cy',2],['r',3]])near(+q('ball').getAttribute(attr),ball.path[0][i]);}
    }
    near(+q('point').getAttribute('cx'),1308); // 原8秒末帧已进入第二圈，不能停在右端。
    assert.equal(q('curve').getAttribute('d').split('L').length,101);
    assert.equal(q('graph-grid').getAttribute('opacity'),'0');assert.equal(q('guides').getAttribute('opacity'),'0');
    assert.match(await readFile(new URL('../catalog/effects/data-comparisons.js',import.meta.url),'utf8'),/largeGraph=largeGraphMotion\(root\)/);
    const layers=[...root.querySelectorAll('[data-layer]')];assert.equal(layers.length,6);assert.ok(layers.every(n=>!n.querySelector('[data-layer]')));
    whole.destroy();
  }finally{e.close();}
});

test('文字交接逐字位置、裁切与打字词点来自原函数，独立和组合共享八秒文字层',async()=>{
  const e=await setup();try{
    const root=e.w.document.getElementById('root'),host=e.w.document.createElement('div');
    const whole=e.w.MotionRuntime.create(root,definition('keyframe-workbench')),single=e.w.MotionRuntime.create(host,definition('title-stagger','handoff'));
    const rows=[['year',190,84],['curve-title',470,160],['craft-title',640,160]];
    for(const ms of [0,150,151,325,600,1500,5400,5525,5701,5850,6000,6200,6450,6900,7200,8000]){
      whole.seek(ms);single.seek(ms);
      assert.equal(frameMarkup(root.querySelector('[data-layer="labels"]')),frameMarkup(host.querySelector('[data-layer="labels"]')));
      const ref=originalKey(ms/1000);
      for(const [row,y,size] of rows){
        const original=ref.filter(v=>v.type==='text'&&v.clip?.[0]?.[0]==='rect'&&Math.abs(v.clip[0][2]-(y-size*1.05))<1e-6);
        const shown=[...host.querySelectorAll(`[data-label="${row}"]`)].filter(n=>n.getAttribute('visibility')==='visible');
        assert.equal(shown.length,original.length,row+' 原逐字词点');
        shown.forEach((n,i)=>{assert.equal(n.textContent,original[i].args[0]);near(+n.getAttribute('y'),original[i].args[2]);assert.equal(n.getAttribute('fill'),original[i].fill);});
      }
      const description=ref.find(v=>v.type==='text'&&v.args[1]===380&&v.args[2]===180),terms=ref.find(v=>v.type==='text'&&v.args[1]===136&&v.args[2]===730);
      assert.equal(host.querySelector('[data-label-description]').textContent,description?.args[0]||'');
      if(description)near(+host.querySelector('[data-label-description]').getAttribute('opacity'),description.opacity);
      assert.equal(host.querySelector('[data-label-terms]').textContent,terms?.args[0]||'');
    }
    const title=host.querySelector('[data-label="curve-title"]');assert.equal(+title.getAttribute('x'),130);assert.equal(+title.getAttribute('font-size'),144);
    assert.equal(host.querySelector('[data-label-terms]').getAttribute('letter-spacing'),'4');
    assert.equal(host.querySelectorAll('[data-layer]').length,1);assert.ok(!host.textContent.includes('Ball · Position'));
    whole.destroy();single.destroy();
  }finally{e.close();}
});
