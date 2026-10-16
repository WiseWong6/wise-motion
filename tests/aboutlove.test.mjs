import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {installAboutloveFixture} from './aboutlove-fixture.mjs';
const files=['clock','fonts','data','entries',''];
const code=await Promise.all(files.map(n=>readFile(new URL('../catalog/effects/aboutlove'+(n?'-'+n:'')+'.js',import.meta.url),'utf8')));
function env(){const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;const resources=installAboutloveFixture(w);for(const s of code)w.eval(s);return {w,dom,...resources};}
const root=w=>{const el=w.document.createElement('div');w.document.body.append(el);return el;};
const frameState=el=>{
 const shadow=el.firstChild.shadowRoot;
 return {dom:shadow.innerHTML,canvases:[...shadow.querySelectorAll('canvas')].map(c=>c.getContext('2d').hash)};
};
const visibleFrameState=el=>[...el.firstChild.shadowRoot.querySelectorAll('.al-piece')]
 .filter(p=>p.style.visibility==='visible')
 .map(p=>({dom:p.outerHTML,canvases:[...p.querySelectorAll('canvas')].map(c=>c.getContext('2d').hash)}));
const paintFrame=(draw,el,time)=>{
 for(const c of el.firstChild.shadowRoot.querySelectorAll('canvas'))c.getContext('2d').hash=2166136261;
 draw(time);
};

test('local font files retain their original bytes and resolve from either catalog or standalone asset roots',async()=>{
 const {w,dom,faces}=env();
 try{
  for(const [hash,blob]of Object.entries(w.WiseAboutLoveFonts.blobs)){
   const raw=await readFile(new URL('../catalog/assets/aboutlove/fonts/'+blob.file,import.meta.url));
   assert.equal(createHash('sha256').update(raw).digest('hex'),hash);
  }
  assert.ok((await readFile(new URL('../catalog/effects/aboutlove-fonts.js',import.meta.url))).length<10000);
  assert.ok(!code[1].includes('base64'));
  const entry=w.WiseAboutLoveEntries['lap-outline-echo'];
  for(const base of ['file:///project/catalog/assets/aboutlove/fonts/','https://example.test/public/catalog/assets/aboutlove/fonts/']){
   const el=root(w),draw=w.WiseAboutLove.create(el,entry.aboutlove,entry.duration_ms,{fontBaseUrl:base});
   await draw.ready;assert.ok([...faces].every(face=>face.source.startsWith('url("'+base)));
   draw.destroy();el.remove();assert.equal(faces.size,0);
  }
 }finally{dom.window.close();}
});

test('approved intake covers every retained audit item and excludes both caret items',async()=>{
 const data=JSON.parse(await readFile(new URL('../catalog/assets/aboutlove/SOURCE.json',import.meta.url)));
 assert.equal(data.decisions.length,62);
 assert.deepEqual(data.decisions.filter(x=>x.decision==='excluded').map(x=>x.audit),['aboutlove-03','aboutlove-35']);
 assert.equal(data.decisions.filter(x=>x.decision==='replace').length,9);
 assert.equal(data.decisions.filter(x=>x.decision==='new').length,12);
 const {w,dom}=env();
 for(const decision of data.decisions.filter(x=>x.target)){
  const entry=w.WiseAboutLoveEntries[decision.target];assert.ok(entry,decision.audit);
  for(const variant of decision.variants||[decision.variant])assert.ok(entry.variants[variant]||entry.aboutlove?.audit===variant,decision.audit+'/'+variant);
 }
 dom.window.close();
});

test('property tracks reset on direct and backward seeks, including yoyo and fixed stagger',()=>{
 const {w,dom}=env(),clock=w.WiseAboutLoveClock.create(w.document),a={x:0},b={x:0};
 const tl=clock.timeline();tl.fromTo([a,b],{x:10},{x:30,duration:1,stagger:.25,ease:'none'},.5);tl.to(a,{x:50,duration:.5,repeat:1,yoyo:true,ease:'none'},2);
 tl.seek(2.5);assert.equal(a.x,50);tl.seek(3);assert.equal(a.x,30);
 tl.seek(.75);assert.equal(a.x,15);assert.equal(b.x,10);tl.seek(0);assert.equal(a.x,10);
 tl.seek(1);assert.equal(a.x,20);assert.equal(b.x,15);
 assert.equal(w.WiseAboutLoveClock.mix('#000000','#ffffff',.5),'rgba(127.5,127.5,127.5,1)');
 clock.destroy();dom.window.close();
});

test('prepared property tracks avoid frame sorting while preserving callback order and later additions',()=>{
 const {w,dom}=env(),clock=w.WiseAboutLoveClock.create(w.document),node=root(w),state={t:0},seen=[];
 const tl=clock.timeline();
 tl.to(state,{t:10,duration:1,ease:'none',onUpdate(){seen.push(state.t);node.style.transform='scale(2)';}},0);
 tl.fromTo(node,{x:0,opacity:0},{x:20,opacity:1,duration:1,ease:'none'},0);
 tl.seek(.5);assert.equal(seen.at(-1),5);assert.equal(node.style.opacity,'0.5');assert.match(node.style.transform,/translate\(10px,0px\)/);
 const sort=w.Array.prototype.sort;let sorts=0;
 w.Array.prototype.sort=function(...args){sorts++;return sort.apply(this,args);};
 try{
  for(let i=0;i<120;i++)tl.seek(.5);
  assert.equal(sorts,0,'已准备好的轨迹不在每帧重新排序');assert.equal(seen.length,121,'相同时间仍执行原画布回调');
  assert.match(node.style.transform,/translate\(10px,0px\)/,'回调写入样式后仍应用该帧轨迹');
  tl.to(state,{t:20,duration:1,ease:'none'},1);tl.seek(1.5);assert.equal(state.t,15);
  tl.seek(.25);assert.equal(state.t,2.5,'追加轨迹后直接回拖仍从原始状态求值');
 }finally{w.Array.prototype.sort=sort;clock.destroy();dom.window.close();}
});

test('full sequences prepare only requested scenes and release deferred scene resources',async()=>{
 const {w,dom,faces}=env(),entry=w.WiseAboutLoveEntries['aboutlove-word-world-sequence'],config=entry.aboutlove;
 const prepared=[],canvases=[],create=w.document.createElement.bind(w.document);
 w.document.createElement=(tag,...args)=>{const node=create(tag,...args);if(tag==='canvas')canvases.push(node);return node;};
 for(const [key,scene]of Object.entries(w.WiseAboutLoveData.scenes)){
  const init=scene.init;scene.init=(...args)=>{prepared.push(key);return init(...args);};
 }
 const expected=scene=>[scene,...config.overlays.map(p=>p.scene)].sort();
 try{
  for(const late of [false,true]){
   prepared.length=0;const el=root(w),draw=w.WiseAboutLove.create(el,config,entry.duration_ms);
   if(late)draw(entry.duration_ms*.96);
   await draw.ready;
   assert.equal(el.firstChild.shadowRoot.querySelectorAll('.al-piece:empty').length,config.segments.length+config.overlays.length-expected(config.segments[late?config.segments.length-1:0].scene).length,'其余场景不提前解析节点');
   assert.deepEqual([...prepared].sort(),expected(config.segments[late?config.segments.length-1:0].scene),'直接定位只准备当前场景与贯穿图层');
   const count=prepared.length;draw(entry.duration_ms*.96);assert.equal(prepared.length,count+(late?0:1));
   draw(entry.duration_ms*.95);assert.equal(prepared.length,count+(late?0:1),'同一场景不重复准备');
   draw.destroy();el.remove();assert.equal(faces.size,0);
  }
  assert.ok(canvases.length);assert.ok(canvases.every(c=>c.width===1&&c.height===1),'释放已经使用和离屏缓存的画布');
 }finally{dom.window.close();}
});

test('all 74 source examples initialize, draw finite operations and support repeated seeks',async()=>{
 const {w,dom,faces}=env();let count=0;
 try{
  for(const [id,entry]of Object.entries(w.WiseAboutLoveEntries).filter(([,e])=>!e.aboutlove?.composition))for(const [variant,def]of Object.entries(entry.variants).length?Object.entries(entry.variants):[['default',entry]]){
   const el=root(w);let draw;
   try{
    draw=w.WiseAboutLove.create(el,def.aboutlove,def.duration_ms);await draw.ready;
    paintFrame(draw,el,def.duration_ms*.63);const expected=frameState(el);
    for(const time of [0,def.duration_ms,def.duration_ms*.31,def.duration_ms*.63])paintFrame(draw,el,time);
    assert.deepEqual(frameState(el),expected,id+'/'+variant+' repeated frame');
    assert.ok(el.dataset.sourceTime,id+'/'+variant);
    for(const c of el.firstChild.shadowRoot.querySelectorAll('canvas'))assert.ok(c.getContext('2d').draws>0,id+'/'+variant+' canvas');
    count++;
   }catch(error){throw new Error(id+'/'+variant+': '+error.message,{cause:error});}
   finally{draw?.destroy();assert.equal(el.children.length,0);el.remove();assert.equal(faces.size,0,id+'/'+variant+' font release');}
  }
  assert.equal(count,74);
 }finally{dom.window.close();}
});

test('orbiting heads and short tails continue while one complete outline is retained per lap',async()=>{
 const {w,dom}=env(),def=w.WiseAboutLoveEntries['lap-outline-echo'],el=root(w);
 const draw=w.WiseAboutLove.create(el,def.aboutlove,def.duration_ms);await draw.ready;
 try{
  const ctx=el.firstChild.shadowRoot.getElementById('s7-canvas').getContext('2d');
  const original={};let paths=[],points=0,heads=[];
  for(const name of ['beginPath','moveTo','lineTo','stroke','createRadialGradient'])original[name]=ctx[name];
  ctx.beginPath=(...a)=>{points=0;original.beginPath(...a);};
  for(const name of ['moveTo','lineTo'])ctx[name]=(...a)=>{points++;original[name](...a);};
  ctx.stroke=(...a)=>{paths.push(points);original.stroke(...a);};
  ctx.createRadialGradient=(...a)=>{heads.push(a);return original.createRadialGradient(...a);};
  const capture=t=>{paths=[];heads=[];draw(t);return {outlines:paths.filter(n=>n===121).length,tails:paths.filter(n=>n===2).length,heads:heads.map(x=>[...x])};};
  const before=capture(2500);assert.equal(before.outlines,0);assert.equal(before.heads.length,2);assert.ok(before.tails>100);
  const after=capture(2600);assert.equal(after.outlines,1);assert.equal(after.heads.length,2);assert.ok(after.tails>100);
  assert.notDeepEqual(after.heads,before.heads,'光点沿轮廓继续移动');
  assert.equal(capture(4100).outlines,2);const last=capture(7740);assert.equal(last.outlines,5);assert.equal(last.heads.length,2);
  const opening=capture(0);assert.equal(opening.outlines,0);assert.equal(opening.heads.length,2);assert.equal(opening.tails,0);
  assert.deepEqual(capture(2600),after,'回拖后圈数、光点与尾迹完全恢复');
  const trail=w.WiseAboutLoveEntries['curve-path'].variants['aboutlove-15'];
  const other=root(w),short=w.WiseAboutLove.create(other,trail.aboutlove,trail.duration_ms);await short.ready;
  assert.equal(trail.aboutlove.mode,'trail','旧的纯短尾迹示例保持独立');short.destroy();other.remove();
 }finally{draw.destroy();dom.window.close();}
});

test('three approved full sequences retain all main scenes and persistent layers through seeks',async()=>{
 const {w,dom,faces}=env();
 const names=[['aboutlove-monologue-sequence',11,1,2.1],['aboutlove-motion-sequence',9,1,.95],['aboutlove-word-world-sequence',6,2,0]];
 try{
  for(const [id,count,layers,trim]of names){
   const def=w.WiseAboutLoveEntries[id],el=root(w),draw=w.WiseAboutLove.create(el,def.aboutlove,def.duration_ms);await draw.ready;
   try{
    assert.equal(def.aboutlove.segments.length,count);assert.equal(def.aboutlove.overlays.length,layers);
    const shadow=el.firstChild.shadowRoot;
    assert.equal(shadow.querySelectorAll('.al-piece').length,count+layers);
    const ordered=[...shadow.querySelectorAll('.al-piece')];
    const sourcePieces=[...def.aboutlove.segments,...def.aboutlove.overlays]
     .map(p=>w.WiseAboutLoveData.scenes[p.scene]).sort((a,b)=>a.track-b.track);
    assert.deepEqual(ordered.map(p=>p.dataset.sourceScene),sourcePieces.map(p=>p.id),'主画面、背景与字幕保持原轨道顺序');
    for(const piece of ordered)assert.ok(!piece.style.zIndex||piece.style.zIndex==='auto','片段外壳不能隔断颗粒层与主画面的混合');
    if(id==='aboutlove-word-world-sequence'){
     const film=ordered.find(p=>p.dataset.sourceScene==='film');
     assert.equal(film,ordered.at(-1),'胶片层位于主画面和字幕之上');
     assert.match(film.querySelector('style').textContent,/#film-canvas\s*\{\s*mix-blend-mode:\s*soft-light/,'保留原胶片柔光混合，不能改成不透明灰底');
    }
    for(const part of def.aboutlove.segments){
     const ms=(part.at+part.duration*.5)*1000;draw(ms);
     assert.equal(el.dataset.sourceScene,part.scene_id);
     assert.ok(Math.abs(Number(el.dataset.sourceGlobalTime)-(ms/1000+trim))<1e-8,id+' 贯穿图层不随场景重新起算');
     const visible=[...shadow.querySelectorAll('.al-piece')].filter(p=>p.style.visibility==='visible');
     assert.equal(visible.length,layers+1,id+' 主场景与贯穿图层同时可见');
     for(const overlay of def.aboutlove.overlays){
      const node=visible.find(p=>p.dataset.sourceScene===overlay.scene_id);
      assert.ok(node);assert.equal(node.dataset.sourceTime,el.dataset.sourceGlobalTime);
     }
    }
    const at=def.aboutlove.segments[Math.floor(count/2)].at*1000+100;
    paintFrame(draw,el,at);const expected=visibleFrameState(el);
    paintFrame(draw,el,def.duration_ms);paintFrame(draw,el,0);paintFrame(draw,el,at);
    assert.deepEqual(visibleFrameState(el),expected,id+' 直接定位与跨场回拖一致');
    for(const part of def.aboutlove.segments.slice(1)){
     draw(part.at*1000-.01);assert.notEqual(el.dataset.sourceScene,part.scene_id);
     draw(part.at*1000);assert.equal(el.dataset.sourceScene,part.scene_id,id+' 切换边界');
    }
   }finally{draw.destroy();el.remove();assert.equal(faces.size,0,id+' 释放字体');}
  }
  assert.equal(Object.values(w.WiseAboutLoveEntries).filter(e=>e.aboutlove?.composition).length,3,'早期版未收为完整组合');
 }finally{dom.window.close();}
});

test('approved world ending shows the complete message together, with no waiting or moving caret',async()=>{
 const {w,dom}=env(),def=w.WiseAboutLoveEntries['aboutlove-word-world-sequence'];
 const get=w.HTMLCanvasElement.prototype.getContext,tagged=new WeakSet();
 w.HTMLCanvasElement.prototype.getContext=function(...args){
  const ctx=get.apply(this,args);if(!ctx||!this.dataset.aboutlove||tagged.has(ctx))return ctx;tagged.add(ctx);
  const fill=ctx.fillText;ctx.fillText=(...a)=>{this.dataset.spriteText=String(a[0]);return fill(...a);};return ctx;
 };
 async function inspect(omit){
  const el=root(w),draw=w.WiseAboutLove.create(el,{...def.aboutlove,omit_caret:omit},def.duration_ms);await draw.ready;
  try{
   draw(def.aboutlove.segments.at(-1).at*1000);
   const ctx=el.firstChild.shadowRoot.getElementById('s6-canvas').getContext('2d'),images=[],rects=[];
   const image=ctx.drawImage,rect=ctx.fillRect;
   ctx.drawImage=(...a)=>{images.push(a[0].dataset.spriteText);return image(...a);};
   ctx.fillRect=(...a)=>{rects.push(a);return rect(...a);};
   draw(73700);const carets=rects.filter(a=>a[2]===5&&a[3]===108).length;
   images.length=0;draw(75260);
   const message=[...new Set(images.filter(text=>[...'吃饭了吗？'].includes(text)))].sort();
   return {carets,message};
  }finally{draw.destroy();el.remove();}
 }
 try{
  const approved=await inspect(true);assert.equal(approved.carets,0);assert.deepEqual(approved.message,[...'吃饭了吗？'].sort());
  const original=await inspect(false);assert.equal(original.carets,1);assert.deepEqual(original.message,['吃'],'独立示例的原实现未被全局改写');
 }finally{dom.window.close();}
});

test('pixel dispersion is available independently from the synchronized meter',async()=>{
 const {w,dom}=env();const def=w.WiseAboutLoveEntries['fragment-replace'].variants['aboutlove-14'],el=root(w),draw=w.WiseAboutLove.create(el,def.aboutlove,def.duration_ms);await draw.ready;
 const s=el.firstChild.shadowRoot,meter=s.getElementById('s6-pct'),bar=s.getElementById('s6-fill');
 draw(0);assert.equal(meter.textContent,'100%');draw(4000);const pct=Number(meter.textContent.replace('%',''));assert.ok(pct>0&&pct<100);
 assert.ok(Math.abs(Number(bar.style.transform.match(/[\d.]+/)[0])*100-pct)<=.5);
 assert.match(s.querySelector('style').textContent,/#s6-meter,#s6-text\{display:none!important\}/);
 draw(7200);assert.equal(meter.textContent,'0%');draw(0);assert.equal(meter.textContent,'100%');draw.destroy();dom.window.close();
});

test('independent instances do not share scene state; cleanup before delayed fonts cancels setup',async()=>{
 const {w,dom,faces}=env(),def=w.WiseAboutLoveEntries['heat-grid-converge'],a=root(w),b=root(w);
 const one=w.WiseAboutLove.create(a,def.aboutlove,def.duration_ms),two=w.WiseAboutLove.create(b,def.aboutlove,def.duration_ms);await Promise.all([one.ready,two.ready]);
 one(400);two(1200);assert.notEqual(a.dataset.sourceTime,b.dataset.sourceTime);one.destroy();assert.ok(faces.size>0);two.destroy();assert.equal(faces.size,0);
 let resolve;w.FontFace.prototype.load=function(){return new Promise(r=>{resolve=()=>r(this);});};
 const oldProjects=w.WiseAboutLoveFonts.projects;w.WiseAboutLoveFonts.projects={motion:[oldProjects.motion[0]]};
 const c=root(w),late=w.WiseAboutLove.create(c,{...def.aboutlove,version:'motion'},def.duration_ms);late.destroy();resolve();await late.ready;
 assert.equal(c.children.length,0);assert.equal(faces.size,0);dom.window.close();
});

test('lazy factory registration preserves older examples in either load order',()=>{
 const {w,dom}=env(),el=root(w);let called=0;
 const legacy=()=>{called++;return()=>{};};legacy.draw=()=>42;
 w.MotionFactories['type-reveal']=legacy;w.MotionFactories['type-reveal'](el,{}, {aboutlove:null});assert.equal(called,1);assert.equal(w.MotionFactories['type-reveal'].draw(),42);
 const original=w.MotionFactories['type-reveal'];w.eval(code.at(-1));w.MotionFactories['type-reveal'](el,{}, {aboutlove:null});assert.equal(called,2);assert.notEqual(w.MotionFactories['type-reveal'],original);
 assert.equal(w.MotionFactories['type-reveal'].draw(),42);
 const previous=w.MotionFactories['type-reveal'];
 w.MotionFactories['type-reveal']=Object.assign((...args)=>previous(...args),previous);
 w.MotionFactories['type-reveal'](el,{});assert.equal(called,3,'a legacy adapter can retain its previous factory without recursion');
 assert.equal(w.MotionFactories['type-reveal'].draw(),42,'legacy adapters can copy existing factory helpers');
 dom.window.close();
});

test('font preparation failure is reported and its resources are released',async()=>{
 const {w,dom,faces}=env(),el=root(w),def=w.WiseAboutLoveEntries['rain-freeze-resume'];
 w.FontFace.prototype.load=()=>Promise.reject(Error('font unavailable'));
 const draw=w.WiseAboutLove.create(el,def.aboutlove,def.duration_ms);
 await assert.rejects(draw.ready,/font unavailable/);
 draw.destroy();assert.equal(faces.size,0);assert.equal(el.children.length,0);dom.window.close();
});
