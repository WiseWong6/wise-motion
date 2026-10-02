import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data,sourceDefinition} from './helpers.mjs';
test('三栏数据图保留原三组九项数值、横条比例和样式，去除顶部标题',async()=>{
 const original=JSON.parse(await readFile('/Users/wisewong/Documents/Developer/wise-video/Naive-NO.5-Flash/promo-atelier/src/data/benchmarks.json','utf8'));
 const env=await environment();try{
  const {w}=env,root=w.document.getElementById('root');
  const e=sourceDefinition(data.effects.find(x=>x.id==='benchmark-columns')),player=w.MotionRuntime.create(root,e);
  const get=id=>root.querySelector(`[data-part="${id}"]`),num=(id,key)=>Number(get(id).getAttribute(key));
  assert.equal(e.category,'data');assert.equal(root.querySelectorAll('[data-chart-column]').length,3);
  assert.equal(get('columns').getAttribute('transform'),'translate(0 -17) scale(0.3333333333333333)');
  assert.doesNotMatch(root.textContent,/Agentic AI Benchmarks|PL\. 08/);
  assert.equal(root.querySelectorAll('[data-part^="bar"]').length,9);
  for(let c=0;c<3;c++){
   const chart=original.benchmarks[c];assert.equal(get('title'+c).textContent,chart.name);assert.equal(get('task'+c).textContent,chart.task);
   assert.equal(get('task'+c).getAttribute('font-weight'),'300');
   for(let r=0;r<3;r++){
    const id=c+'-'+r,m=chart.models[r];
    assert.equal(num('bar'+id,'width'),0);assert.equal(num('bar'+id,'x'),140+c*585);
    assert.equal(num('bar'+id,'y'),452+r*150);assert.equal(num('bar'+id,'height'),48);
    assert.equal(num('track'+id,'stroke-width'),.8);
    if(m.highlight)assert.equal(get('bar'+id).getAttribute('fill'),'var(--accent)');
    else assert.match(get('bar'+id).getAttribute('fill'),/^url\(#data-motion-\d+-columns-hatch\)$/);
   }
  }
  player.seek(23/30*1000);assert.ok(num('bar0-0','width')>0);assert.equal(num('bar1-0','width'),0);assert.equal(num('bar0-1','width'),0);
  player.seek(38/30*1000);assert.ok(Math.abs(num('bar0-0','width')-470*original.benchmarks[0].models[0].score/200)<1e-8);
  player.seek(3000);
  for(let c=0;c<3;c++)for(let r=0;r<3;r++){
   const id=c+'-'+r,m=original.benchmarks[c].models[r];
   assert.ok(Math.abs(num('bar'+id,'width')-470*m.score/100)<1e-8);
   assert.equal(num('edge'+id,'x1'),num('bar'+id,'x')+num('bar'+id,'width'));
   assert.equal(get('model'+id).textContent,m.name);
   const digits=[...get('score'+id).querySelectorAll('text')].filter(n=>!n.dataset.part.endsWith('-b'));
   assert.equal(digits.map(n=>n.textContent).join(''),m.score.toFixed(1));
   assert.ok(digits.every(n=>n.getAttribute('fill')===(m.highlight?'var(--red)':'var(--ink)')));
  }
  for(let c=0;c<3;c++){assert.equal(num('scale'+c,'x2'),140+c*585+470);assert.equal(num('tick'+c+'-50','opacity'),.9);}
  assert.equal(num('metric0-0','opacity'),1);assert.equal(num('metric1-0','opacity'),1);
 }finally{env.close();}
});

test('数据示例保留基线、比例、单向推进及同步终态',async()=>{
 const env=await environment();try{
 const root=env.w.document.getElementById('root');let player;
 const select=id=>{player?.destroy();player=env.w.MotionRuntime.create(root,sourceDefinition(data.effects.find(e=>e.id===id)));return player;};
 const get=id=>root.querySelector(`[data-part="${id}"]`),num=(id,key)=>+get(id).getAttribute(key);
 select('bar-growth');for(const t of [0,500,1100,2200,3000]){player.seek(t);for(let i=0;i<6;i++){assert.equal(num('b'+i,'x'),154+i*57);assert.equal(num('b'+i,'width'),34);assert.ok(Math.abs(num('b'+i,'y')+num('b'+i,'height')-285)<1e-8);}}assert.ok(Math.abs(num('b2','height')/num('b0','height')-81/92)<1e-7);
 select('sector-appear');const paths=[...root.querySelectorAll('path')].map(n=>n.getAttribute('d'));player.seek(1200);assert.deepEqual([...root.querySelectorAll('path')].map(n=>n.getAttribute('d')),paths);
 select('map-paint');assert.equal(root.querySelectorAll('path').length,21);player.seek(0);assert.equal(num('r0','fill-opacity'),0);player.seek(3000);assert.ok(num('r0','fill-opacity')>0);
 select('timeline-progress');player.seek(1500);assert.equal(get('n1').getAttribute('fill'),'#ff2bd6');assert.equal(get('n4').getAttribute('fill'),'var(--stage)');player.seek(3000);assert.equal(get('n4').getAttribute('fill'),'#1fb5a8');
 select('countdown-dial');player.seek(0);assert.equal(get('value').textContent,'60');player.seek(1500);assert.equal(get('value').textContent,'30');assert.equal(num('arc','stroke-dashoffset'),.5);player.seek(3000);assert.equal(get('value').textContent,'00');assert.ok(get('sector').getAttribute('d'));
 select('gauge-rebound');player.seek(1500);assert.equal(num('lamp','opacity'),1);player.seek(3000);assert.ok(Math.abs(+get('needle').getAttribute('transform').match(/rotate\(([^ ]+)/)[1]-399.6)<1e-8);
 select('stroke-hatch');player.seek(3000);assert.ok([...root.querySelectorAll('line')].every(n=>+n.getAttribute('stroke-dashoffset')===0));assert.ok(root.querySelector('[clip-path]'));
 assert.ok(!data.effects.some(e=>e.id==='rolling-digits'));
 }finally{env.close();}
});

test('展示片时间线保留七彩年份节点、原建立与推进时钟，倒拖和终态稳定',async()=>{
 const env=await environment();try{
  const {w}=env,root=w.document.getElementById('root'),e=sourceDefinition(data.effects.find(x=>x.id==='timeline-progress'));
  const player=w.MotionRuntime.create(root,e),get=id=>root.querySelector(`[data-part="${id}"]`),num=(id,key)=>+get(id).getAttribute(key);
  const colors=['#ff5a1f','#ff2bd6','#d7263d','#ffc93c','#1fb5a8','#7b61ff','var(--ink)'];
  assert.equal(root.querySelectorAll('circle').length,7);assert.equal(get('head'),null);
  assert.equal(root.querySelectorAll('[data-part^="tick"]').length,0);
  assert.equal(get('base').getAttribute('stroke'),'var(--path)');assert.equal(num('base','stroke-width'),.7);
  assert.equal(get('fill').getAttribute('stroke'),'var(--ink)');assert.equal(num('fill','stroke-width'),1.35);
  for(let i=0;i<7;i++){
   assert.equal(get('n'+i).getAttribute('stroke'),colors[i]);assert.equal(num('n'+i,'r'),4.2);
   const labels=[...get('group'+i).querySelectorAll('text')];
   assert.equal(labels[1].textContent,['1959','1981','1995','2003','2014','2020','2026'][i]);
   assert.ok(labels.every(n=>n.getAttribute('font-family')==='Oswald,sans-serif'&&n.getAttribute('font-weight')==='700'));
  }
  player.seek(250);assert.equal(num('base','x2'),76);assert.equal(num('group0','opacity'),0);
  player.seek(650);assert.ok(num('group0','opacity')>0);assert.equal(num('group2','opacity'),0);
  player.seek(800);assert.equal(num('fill','opacity'),0);
  player.seek(1500);assert.ok(Math.abs(num('fill','x2')-320)<1e-9);
  assert.equal(get('n3').getAttribute('fill'),colors[3]);assert.equal(get('n4').getAttribute('fill'),'var(--stage)');
  player.seek(2000);const at56=root.innerHTML;
  for(let i=0;i<6;i++)assert.equal(get('n'+i).getAttribute('fill'),colors[i]);
  assert.equal(get('n6').getAttribute('fill'),'var(--stage)');
  player.seek(2200);assert.equal(num('fill','x2'),564);
  for(let i=0;i<7;i++)assert.equal(get('n'+i).getAttribute('fill'),colors[i]);
  const complete=root.innerHTML;player.seek(3000);assert.equal(root.innerHTML,complete);
  player.seek(0);player.seek(2000);assert.equal(root.innerHTML,at56);
  const observer=new w.MutationObserver(()=>{});player.seek(3000);observer.observe(root,{subtree:true,attributes:true,characterData:true});player.seek(3000);assert.equal(observer.takeRecords().length,0);observer.disconnect();
 }finally{env.close();}
});

test('PPT 配色页三图保留六柱排线、三环读数及八点折线，按原局部顺序建立',async()=>{
 const env=await environment();try{
  const {w}=env,root=w.document.getElementById('root');let player;
  const select=id=>{player?.destroy();player=w.MotionRuntime.create(root,sourceDefinition(data.effects.find(e=>e.id===id)));};
  const get=id=>root.querySelector(`[data-part="${id}"]`),num=(id,key)=>Number(get(id).getAttribute(key));
  select('bar-growth');player.seek(180);
  assert.ok(num('b0','height')>0);assert.equal(num('b1','height'),0);
  assert.equal(num('v0','opacity'),0);
  player.seek(1500);
  assert.match(get('b0').getAttribute('fill'),/^url\(#data-motion-\d+-benchmark-hatch\)$/);
  assert.equal(get('b0').getAttribute('stroke'),'var(--blue)');
  for(let i=1;i<6;i++)assert.equal(get('b'+i).getAttribute('fill'),'none');
  assert.equal(get('v5').textContent,'61%');assert.equal(get('label2').textContent,'GSM8K');
  select('sector-appear');player.seek(180);
  assert.ok(num('s0','opacity')>0);assert.equal(num('s1','opacity'),0);
  assert.equal(num('leader0','opacity'),0);assert.equal(num('v0','opacity'),0);
  player.seek(1500);
  assert.equal(root.querySelectorAll('path').length,3);
  assert.equal(get('v0').textContent,'46%');assert.equal(get('v1').textContent,'33%');assert.equal(get('v2').textContent,'21%');
  assert.equal(get('label2').textContent,'嵌入');assert.equal(get('total').textContent,'100%');
  assert.match(get('s0').getAttribute('fill'),/call-hatch/);
  for(let i=0;i<3;i++){
   assert.equal(get('s'+i).getAttribute('stroke'),'var(--blue)');
   assert.match(get('s'+i).getAttribute('d'),/A104 104 0 0 0/,'外弧应沿标注方向逆时针绘制');
  }
  assert.equal(get('s1').getAttribute('fill'),'none');
  assert.equal(get('s2').getAttribute('fill'),'none');
  select('trend-draw');
  const positions=Array.from({length:8},(_,i)=>[num('node'+i,'cx'),num('node'+i,'cy')]);
  assert.deepEqual(positions,[[190,556.2],[296,544.8],[402,548.6],[508,529.6],[614,514.4],[720,518.2],[826,495.4],[932,476.4]]);
  assert.equal(num('trend','stroke-dashoffset'),1);assert.equal(num('node0','r'),0);
  player.seek(350);assert.ok(num('trend','stroke-dashoffset')<1);assert.ok(num('node0','r')>0);assert.equal(num('node7','r'),0);
  for(const t of [0,350,700,1200,3000]){
   player.seek(t);for(let i=0;i<8;i++)assert.deepEqual([num('node'+i,'cx'),num('node'+i,'cy')],positions[i]);
  }
  assert.equal(num('trend','stroke-dashoffset'),0);assert.equal(num('node7','r'),4.5);
  assert.equal(get('week7').textContent,'W31');assert.equal(get('peak').textContent,'PEAK 52');
  assert.match(get('trend').getAttribute('d'),/^M190 556\.2 L296 544\.8/);
 }finally{env.close();}
});

test('频谱保留镜像放射、阈值颜色、鼓点内环和同帧双层波形',async()=>{
 const env=await environment();try{
  const {w}=env,root=w.document.getElementById('root');
  const e=sourceDefinition(data.effects.find(x=>x.id==='data-pulse'));
  const player=w.MotionRuntime.create(root,e);
  const get=id=>root.querySelector(`[data-part="${id}"]`);
  const points=node=>node.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
  assert.equal(root.querySelectorAll('[data-spectrum-band]').length,64);
  assert.equal(root.querySelectorAll('audio,video').length,0);
  let firstWave;
  // 原作对应时刻的第一频段、鼓点与波形首点；允许字节量化误差。
  for(const [time,magnitude,kick,firstSample] of [[0,.736,.705,-.411],[500,.736,.706,.186],[1700,.946,.344,-.230]]){
   player.seek(time);
   for(const node of root.querySelectorAll('[data-spectrum-band]')){
    const p=points(node);assert.equal(p.length,8); // 每频段两条镜像线，共 128 条。
    const length=Math.hypot(p[2]-p[0],p[3]-p[1]);
    assert.ok(Math.abs(length-Math.hypot(p[6]-p[4],p[7]-p[5]))<.002);
    assert.ok(Math.abs(Math.hypot(p[0],p[1])-Math.hypot(p[4],p[5]))<.002);
    const v=(Number(node.getAttribute('stroke-opacity'))-.35)/.6;
    assert.equal(node.getAttribute('stroke'),v>.72?'var(--accent)':'var(--ink)');
    assert.ok(length>=14*.22-.002);
   }
   const v=(Number(get('f0').getAttribute('stroke-opacity'))-.35)/.6;
   assert.ok(Math.abs(v-magnitude)<=1/510);
   assert.ok(Math.abs(Number(get('inner').getAttribute('r'))-(175+kick*18-16)*.22)<.008);
   const wave=get('wave').getAttribute('d');
   assert.equal(get('wave-soft').getAttribute('d'),wave);
   assert.equal(points(get('wave')).length,256);
   assert.ok(Math.abs(points(get('wave'))[1]-(318+firstSample*110*.22))<.097);
   assert.equal(get('wave').getAttribute('stroke-width'),'.55');
   assert.equal(get('wave-soft').getAttribute('stroke-width'),'1.76');
   assert.equal(Array.from({length:8},(_,i)=>(get('particles'+i).getAttribute('d').match(/Z/g)||[]).length).reduce((a,b)=>a+b),220);
   if(firstWave===undefined)firstWave=wave;else assert.notEqual(wave,firstWave);
  }
  const render=w.MotionFactories[e.id](root,w.MotionKit,e);
  render(0,{elapsed:0});const start=get('f0').getAttribute('d');
  render(0,{elapsed:6000});assert.equal(get('f0').getAttribute('d'),start);
  assert.ok(Number(get('spectrum').getAttribute('transform').match(/-?\d+(?:\.\d+)?/)[0])>0);
  assert.ok(Number(get('particles').getAttribute('transform').match(/-?\d+(?:\.\d+)?/)[0])<0);
 }finally{env.close();}
});
