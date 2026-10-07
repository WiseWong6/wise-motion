// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createPlan,checkPlan,buildJsx,sourceTag} from '../scripts/plan.mjs';
import {resolveEffect} from '../remotion/clock.mjs';
import {createFrameDocument} from '../remotion/frame-document.mjs';
import {layerStatus} from '../scripts/layer-status.mjs';
import {layerFingerprint,verifiedLayerFingerprints} from '../scripts/layer-status.mjs';
import {auditedLayerStatus,LAYER_AUDIT_VERSION,layerKey} from '../remotion/layer-policy.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {build as bundle} from 'esbuild';
import {evaluate} from '../scripts/eval-plan.mjs';
import {treeSnapshot,compareSnapshot} from '../scripts/eval-evidence.mjs';
const make=()=>{const plan=createPlan('涂鸦做网站');Object.assign(plan.shots[0],{seconds:3,subject:'标题',from:'未出现',to:'标题完整',meaning:'展示功能',hold:'完整保留一秒',handoff:'切到下一镜'});return plan;};
const main=()=>({role:'main',mode:'reuse',id:'type-reveal',source:sourceTag(resolveEffect('type-reveal')),content:{text:'涂鸦做网站'}});
const background=()=>({role:'background',mode:'original',nearest:'diffuse-light-drift',why:'需要随标题变化的原创图形背景，现有光团动作不对应这一变化。',prompt:'背景由深蓝逐渐过渡到青色，中央光环缓慢扩散，末尾保持一秒。',component:{path:'./scenes/Background.jsx',export:'Background'}});
test('透明开关默认页面不变；仅清理外壳且不重写主题色位',()=>{
 const opts={assetBaseUrl:'file:///assets/'};
 assert.equal(createFrameDocument(opts),createFrameDocument({...opts,transparent:false}));
 const html=createFrameDocument({...opts,transparent:true});assert.match(html,/color-scheme:normal/);assert.match(html,/\.motion-stage::before,\.motion-stage::after/);assert.doesNotMatch(html,/--stage:transparent/);
 assert.throws(()=>createFrameDocument({...opts,transparent:'true'}),/布尔/);
 for(const id of ['type-reveal','count-up','word-focus'])assert.equal(layerStatus(resolveEffect(id)),'overlay-ok',id+' 当前源码审计过期');
 assert.equal(layerStatus(resolveEffect('particle-word')),'own-background');
});
test('叠层同起止帧、独立内容与位置，原创引用在重新装配后保留',()=>{
 const p=make();delete p.shots[0].effect;p.shots[0].layers=[background(),{...main(),box:{x:80,y:70,width:480,height:270}}];
 assert.deepEqual(checkPlan(p).errors,[]);const first=buildJsx(p);assert.equal(first.totalFrames,90);assert.deepEqual(first.pending,[]);
 assert.equal([...first.source.matchAll(/<Sequence from=\{0\} durationInFrames=\{90\}/g)].length,2);assert.match(first.source,/transparent=\{true\}/);assert.match(first.source,/\.\/scenes\/Background.jsx/);assert.match(first.source,/width=\{480\}/);
 p.shots[0].layers[1].content.text='另一镜';const second=buildJsx(p);assert.match(second.source,/\.\/scenes\/Background.jsx/);assert.match(second.source,/另一镜/);
});
test('层检查拒绝不透明上层、混用、乱序、重复角色和越界',()=>{
 const p=make();delete p.shots[0].effect;p.shots[0].layers=[background(),main()];
 const wrong=change=>{const q=structuredClone(p);change(q.shots[0]);assert.ok(checkPlan(q).errors.length);};
 wrong(s=>s.effect=main());wrong(s=>s.layers.reverse());wrong(s=>s.layers.push(main()));
 wrong(s=>s.layers[1]={...main(),id:'particle-word',source:sourceTag(resolveEffect('particle-word'))});
 wrong(s=>s.layers[1].box={x:1900,y:0,width:100,height:100});
 const q=structuredClone(p);delete q.shots[0].layers[0].component;const built=buildJsx(q);assert.deepEqual(built.pending,['s01/background']);assert.match(built.source,/PendingImplementation.*mode="原创"/);
});
test('改写后的上层组件不能借用原参考的透明许可',()=>{
 const p=make();delete p.shots[0].effect;
 p.shots[0].layers=[background(),{...main(),mode:'tweak',prompt:'保留标题的逐字显现，把字形周围增加色块并保留最后一秒。',component:{path:'./scenes/Title.jsx',export:'Title'}}];
 assert.ok(checkPlan(p).errors.some(message=>message.includes('微调和原创层只支持 background')));
});

// 合成审计记录只验证检查分支，不作为画面取证，也不写回权威记录。
function auditFixture(){
 const results=['type-reveal','count-up','word-focus'].map(id=>({id,variant:null,status:'overlay-ok',fingerprint:layerFingerprint(resolveEffect(id))}));
 return {version:LAYER_AUDIT_VERSION,results};
}
async function componentWithAudit(report,fingerprints){
 const result=await bundle({entryPoints:[new URL('../remotion/index.jsx',import.meta.url).pathname],bundle:true,write:false,format:'cjs',platform:'node',external:['react','remotion'],logLevel:'silent',plugins:[{name:'audit-fixture',setup(build){
  build.onLoad({filter:/\/catalog\/layer-(audit|fingerprints)\.json$/},({path:file})=>({contents:JSON.stringify(file.endsWith('layer-audit.json')?report:fingerprints),loader:'json'}));
 }}]});
 const remotion={useCurrentFrame:()=>0,useVideoConfig:()=>({fps:30}),useDelayRender:()=>({}),useRemotionEnvironment:()=>({isRendering:false}),useBufferState:()=>({}),staticFile:file=>'/'+file};
 const exports={},context={exports,module:{exports},require(name){if(name==='react')return React;if(name==='remotion')return remotion;throw Error('意外依赖：'+name);}};
 vm.runInNewContext(result.outputFiles[0].text,context);
 return props=>renderToStaticMarkup(React.createElement(context.module.exports.WiseMotionEffect,{transparent:true,...props}));
}

test('分镜与组件都拒绝过期记录、未获准条目和改写后的绘制定义',async()=>{
 const report=auditFixture(),fingerprints=verifiedLayerFingerprints({report});
 const render=await componentWithAudit(report,fingerprints),definition=resolveEffect('type-reveal');
 assert.match(render({effectId:definition.id,content:{text:'新的文字'}}),/<iframe/);
 for(const changed of [
  {...resolveEffect('particle-word'),layer:'overlay-ok'},
  {...definition,source:{...definition.source,path:'catalog/effects/word-slam.js'}},
  {...definition,duration_ms:100},
  {...definition,content:{unsupported:'不能跳过内容检查'}},
 ]){
  assert.equal(auditedLayerStatus(changed,fingerprints.fingerprints[layerKey(changed)],report),'own-background');
  assert.throws(()=>render({definition:changed}));
 }
 for(const change of [
  r=>{r.version=1;},
  r=>{r.results[0].fingerprint='outdated';},
  r=>{r.results[0].status='own-background';},
  r=>{r.results=[];},
 ]){
  const stale=structuredClone(report);change(stale);
  assert.equal(auditedLayerStatus(definition,fingerprints.fingerprints[layerKey(definition)],stale),'own-background');
  assert.throws(()=>verifiedLayerFingerprints({report:stale}),/透明审计过期或未通过/);
  const rejected=await componentWithAudit(stale,fingerprints);
  assert.throws(()=>rejected({effectId:definition.id}),/透明叠层审计/);
 }
 const missing=await componentWithAudit(report,{version:LAYER_AUDIT_VERSION,fingerprints:{}});
 assert.throws(()=>missing({effectId:definition.id}),/透明叠层审计/);
 assert.doesNotThrow(()=>missing({effectId:definition.id,transparent:false}),'普通单镜不需要透明审批');
});

test('目录按钮与无关绘制器清单不影响审计，绘制、字体和适配器变化仍使记录失效',()=>{
 const definition=resolveEffect('type-reveal'),before=layerFingerprint(definition),read=file=>readFileSync(new URL('../'+file,import.meta.url));
 const changed=target=>layerFingerprint(definition,file=>file===target?Buffer.concat([read(file),Buffer.from('\n/* changed */')]):read(file));
 for(const file of ['catalog/app.css','remotion/frame-scripts.mjs'])assert.equal(changed(file),before,file);
 for(const file of ['catalog/frame.css','catalog/scenes.css','catalog/effects/attention.js','catalog/fonts/Oswald-Bold.woff2','remotion/frame-document.mjs','remotion/index.jsx','remotion/clock.mjs','remotion/layer-policy.mjs'])assert.notEqual(changed(file),before,file);
});
test('评测只读，不把缺失渲染、检查日志或单纯复用标签计作成功',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'wise-eval-'));
 try{
  const p=make();p.shots[0].effect=main();const file=path.join(dir,'plan.json'),raw=JSON.stringify(p);await writeFile(file,raw);
  const result=await evaluate(file);assert.equal(result.status,'needs-render-and-review');assert.equal(result.rendering.status,'unverified');assert.equal(result.assets.status,'unverified');assert.equal(result.checks.recorded,0);assert.equal(await readFile(file,'utf8'),raw);
  const before=await treeSnapshot(dir);await writeFile(path.join(dir,'added.txt'),'changed');const after=await treeSnapshot(dir);assert.deepEqual(compareSnapshot(before,after),[{file:'added.txt',change:'added'}]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
