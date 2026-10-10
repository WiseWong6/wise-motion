import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {runInNewContext} from 'node:vm';
import {transform} from 'esbuild';
import {JSDOM} from 'jsdom';
import {validateAssetDestination} from '../scripts/install-assets.mjs';
import previewApi from '../catalog/preview-size.js';
const browserSource=await readFile(new URL('../remotion/browser.jsx',import.meta.url),'utf8');
const browserCode=(await transform(browserSource,{loader:'jsx',format:'cjs'})).code;
function browserHarness(overrides={},hooks={}){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'file:///wise-motion/catalog/index.html'}),w=dom.window;
 let tree,frame=0,unmounts=0,sessionDocument;const observers=[];
 const events=new Map(),playEvents=[];
 const player={muted:true,play(event){playEvents.push(event);},pause(){},mute(){this.muted=true;},unmute(){this.muted=false;},isMuted(){return this.muted;},seekTo(value){frame=value;},getCurrentFrame(){return frame;},addEventListener(name,callback){events.set(name,callback);},removeEventListener(name){events.delete(name);}};
 const React={createRef:()=>({current:null}),createElement:(type,props)=>({type,props})};
 const reactRoot={render(value){tree=value;value.props.ref.current=player;},unmount(){unmounts++;hooks.onUnmount?.(sessionDocument);}};
 const modules={react:React,'react-dom/client':{createRoot:()=>reactRoot},'react-dom':{flushSync:fn=>fn()},'@remotion/player':{Player(){ }},'./with-audio.jsx':{WiseMotionEffect(){},getEffectMetadata:()=>({durationInFrames:Math.ceil((overrides.duration_ms??2000)*60/1000-1e-9)+1}),resolveEffect:input=>input},'../catalog/preview-size.js':previewApi};
 const exports={};const context={exports,module:{exports},require:name=>modules[name],document:w.document,URL,queueMicrotask,
 MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){}},MotionKit:{resolveVariant:input=>input},devicePixelRatio:1};
 runInNewContext(browserCode,context);
 const root=w.document.getElementById('root');root.getBoundingClientRect=()=>({width:640,height:360});
 const definition={id:'stagger-in',duration_ms:2000,default_ease:'linear',parameters:{},loop:false,...overrides};
 const controller=context.module.exports.create(root,definition);
 sessionDocument=w.document.implementation.createHTMLDocument('snapshot');
 sessionDocument.body.innerHTML='<script>window.mustNotRun=true</script><div class="motion-stage"><b>保留画面</b></div>';
 let destroys=0;const session={doc:sessionDocument,stage:sessionDocument.querySelector('.motion-stage'),destroy(preserve){destroys++;hooks.onDestroy?.(sessionDocument,preserve);}};
 tree.props.inputProps.onReady(session);
 return {controller,w,root,session,player,events,playEvents,get tree(){return tree;},get frame(){return frame;},get unmounts(){return unmounts;},get destroys(){return destroys;},observers,close(){controller.destroy();w.close();}};
}
test('原画预览填满对应比例，窗口缩放与静态保留不把竖画再次缩进横框',()=>{
 for(const [width,height,viewportWidth,viewportHeight] of [[900,1200,540,720],[1080,1920,405,720],[900,1080,600,720],[640,360,1280,720]]){
  const h=browserHarness({scene:{width,height}});
  try{
   h.root.getBoundingClientRect=()=>({width:viewportWidth,height:viewportHeight});h.controller.fit();
   const mount=h.root.firstElementChild;
   assert.equal(mount.style.width,'1280px');assert.equal(mount.style.height,'720px');
   assert.equal(h.tree.props.compositionWidth,640);assert.equal(h.tree.props.compositionHeight,360,'共用绘图坐标保持原样');
   h.controller.destroy(true);
   assert.equal(h.root.querySelector('iframe').style.transform,'scale(2)');
  }finally{h.close();}
 }
});
test('播放中定位保持帧时钟，暂停定位可保留精确末帧',()=>{
 const h=browserHarness();try{
  h.controller.play();h.controller.seek(500);
  assert.equal(h.frame,30);assert.equal(h.controller.paused,false);
  assert.equal(h.tree.props.inputProps.sampleMode,'playback');assert.equal(h.tree.props.inputProps.timeOverrideMs,undefined);assert.equal(h.tree.props.inputProps.elapsedOverrideMs,undefined);
  h.controller.pause();h.controller.seek(2000);
  assert.equal(h.tree.props.inputProps.timeOverrideMs,2000);assert.equal(h.tree.props.inputProps.sampleMode,'exact');
  h.controller.play();assert.equal(h.frame,0);assert.equal(h.tree.props.inputProps.timeOverrideMs,undefined);
 }finally{h.close();}
});
test('非整数帧时长的精确末尾定位对应实际视频最后一帧',()=>{
 const h=browserHarness({duration_ms:15054});try{
  h.controller.seek(15054);
  assert.equal(h.frame,904);assert.equal(h.controller.frame,904);
  assert.equal(h.tree.props.inputProps.timeOverrideMs,15054);
  assert.equal(h.tree.props.durationInFrames-1,h.frame);
  h.controller.seek(15053);assert.equal(h.frame,903);assert.equal(h.controller.currentTime,15050);
 }finally{h.close();}
});
test('主题切换保留文档、帧位置和拆解节点，不退到上一次定位',()=>{
 const h=browserHarness();try{
  h.controller.seek(500);h.controller.play();h.player.seekTo(90);
  const stage=h.controller.stage;
  h.w.document.documentElement.dataset.theme='light';h.observers[0].callback();
  assert.equal(h.session.doc.documentElement.dataset.theme,'light');assert.equal(h.tree.props.inputProps.theme,'light');assert.equal(h.frame,90);assert.equal(h.controller.stage,stage);
  h.tree.props.inputProps.onReady(h.session);assert.equal(h.frame,90);
 }finally{h.close();}
});
test('静态保留也卸载 React 播放器并释放绘制器，留下无脚本画面',()=>{
 const h=browserHarness();try{
  h.controller.destroy(true);
  assert.equal(h.unmounts,1);assert.equal(h.destroys,1);assert.equal(h.controller.destroyed,true);
  const staticFrame=h.root.querySelector('iframe');assert.ok(staticFrame);
  assert.equal(staticFrame.contentDocument.querySelector('script'),null);
  assert.equal(staticFrame.contentDocument.querySelector('b').textContent,'保留画面');
  h.controller.destroy(true);assert.equal(h.unmounts,1);
 }finally{h.close();}
});
test('先固化图形再复制到存活文档，原文档卸载不会清掉静态画布',()=>{
 let copiedCanvas=null,sourceCanvas=null;
 const h=browserHarness({}, {
  onDestroy(doc,preserve){assert.equal(preserve,true);sourceCanvas.dataset.frame='frozen';},
  onUnmount(doc){assert.ok(copiedCanvas);assert.notEqual(copiedCanvas.ownerDocument,doc,'静态画布不能继续属于即将卸载的 iframe');sourceCanvas.dataset.frame='cleared';}
 });
 try{
  sourceCanvas=h.session.doc.createElement('canvas');sourceCanvas.width=1600;sourceCanvas.height=900;h.session.stage.append(sourceCanvas);
  h.w.HTMLCanvasElement.prototype.getContext=function(){const target=this;return {drawImage(source){assert.equal(source.dataset.frame,'frozen');copiedCanvas=target;target.dataset.frame=source.dataset.frame;}};};
  h.controller.destroy(true);
  const canvas=h.root.querySelector('iframe').contentDocument.querySelector('canvas');
  assert.equal(canvas.dataset.frame,'frozen');assert.equal(canvas.width,1600);assert.equal(canvas.height,900);
  assert.equal(h.destroys,1);assert.equal(h.unmounts,1);
 }finally{h.close();}
});
test('素材安装只接受独立 public 子目录并拒绝内部链接',async()=>{
 const project=path.resolve(new URL('../',import.meta.url).pathname);
 assert.equal(await validateAssetDestination(),path.join(project,'public/wise-motion'));
 for(const target of [project,project+'/catalog/assets'])await assert.rejects(validateAssetDestination(target));
 const temporary=await mkdtemp(path.join(tmpdir(),'wise-motion-asset-target-'));
 try{
  const target=path.join(temporary,'public/wise-motion');await mkdir(target,{recursive:true});
  await symlink(project+'/catalog',path.join(target,'catalog'));
  await assert.rejects(validateAssetDestination(target),/符号链接/);
 }finally{await rm(temporary,{recursive:true,force:true});}
});

test('异步准备后的翻页工作台恢复页码和纸张设置，取消切换有效且交互书可访问',async()=>{
 const html=await readFile(new URL('../catalog/index.html',import.meta.url),'utf8');
 const source=await readFile(new URL('../catalog/book-controls.js',import.meta.url),'utf8');
 for(const cancel of [false,true]){
  const dom=new JSDOM(html,{runScripts:'outside-only'}),w=dom.window,root=w.document.getElementById('preview');
  let accept,lastIndex=null,lastSettings=null;const ready=new Promise(resolve=>{accept=resolve;});
  const frame=w.document.createElement('iframe');frame.setAttribute('aria-hidden','true');root.append(frame);
  const stage=frame.contentDocument.createElement('div');stage.className='motion-stage';stage.innerHTML='<div class="wm-book"></div>';frame.contentDocument.body.append(stage);
  const timer={ready,preparing:true,stage:undefined,currentTime:0,paused:true,pause(){},play(){},seek(){},setSpeed(){},setEase(){},destroy(){}};
  w.MotionRuntime={create:()=>timer};
  w.WiseDitherBook={demoAt:()=>({index:0,flip:null}),create(stage,options){const shell=w.document.createElement('div');shell.className='wm-book';stage.append(shell);return {setSettings(settings){lastSettings={...settings};},renderState(state){lastIndex=state.index;options.onUpdate({...state,busy:false,paused:false});},destroy(){}};}};
  w.eval(source);
  const workbench=w.WiseDitherWorkbench.create(root,{default_ease:'linear'},{mode:'interactive',pageIndex:4});
  try{
   const padding=w.document.getElementById('book-padding');padding.value='16';padding.dispatchEvent(new w.Event('input'));
   if(cancel)workbench.setMode('timeline');
   timer.stage=stage;timer.preparing=false;accept(true);await ready;await Promise.resolve();
   assert.equal(workbench.mode,cancel?'timeline':'interactive');
   assert.equal(lastIndex,cancel?null:4);
   if(cancel)assert.equal(stage.querySelector('.wm-book').style.getPropertyValue('--book-pad'),'16px');
   else {assert.equal(lastSettings.padding,16);assert.equal(frame.hasAttribute('aria-hidden'),false);}
  }finally{workbench.destroy();w.close();}
 }
});

test('无声目录从首次挂载即静音，避免等待没有音轨的音频设备',()=>{
 const h=browserHarness();try{
  assert.equal(h.tree.props.initiallyMuted,true);
  assert.equal(h.tree.props.numberOfSharedAudioTags,0);
  h.controller.play();h.controller.seek(500);
  assert.equal(h.tree.props.initiallyMuted,true);
 }finally{h.close();}
});

test('有原声的组合默认静音，开启后定位和变速保留声音状态，销毁释放播放器',()=>{
 const h=browserHarness({kind:'composition',audio:{tracks:[{src:'score.mp3'}]}});try{
  assert.equal(h.controller.hasAudio,true);assert.equal(h.controller.muted,true);
  assert.equal(h.tree.props.initialVolume,1);
  assert.equal(h.tree.props.inputProps.includeAudio,true);assert.equal(h.tree.props.numberOfSharedAudioTags,0);
  h.controller.setMuted(false);assert.equal(h.controller.muted,false);assert.equal(h.player.muted,false);
  h.controller.play();h.controller.seek(600);h.controller.setSpeed(2);
  assert.equal(h.frame,36);assert.equal(h.tree.props.playbackRate,2);assert.equal(h.tree.props.inputProps.speed,1);
  assert.equal(h.controller.muted,false);
  h.controller.pause();assert.equal(h.controller.paused,true);
  h.controller.setMuted(true);assert.equal(h.player.muted,true);
  const event=new h.w.MouseEvent('click');
  h.controller.play(event);assert.equal(h.playEvents.at(-1),event);
  h.controller.setMuted(false,event);assert.equal(h.playEvents.at(-1),event);
  h.player.muted=true;h.events.get('mutechange')({detail:{isMuted:true}});
  assert.equal(h.controller.muted,true,'浏览器重新静音时控制状态也要同步');
  h.controller.restart(true,event);assert.equal(h.playEvents.at(-1),event);
  h.controller.destroy();assert.equal(h.unmounts,1);
  assert.equal(h.events.has('mutechange'),false);
  h.controller.setMuted(false);assert.equal(h.player.muted,true);
 }finally{h.close();}
});
