// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
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
test('透明开关默认页面不变；仅清理外壳且不重写主题色位',()=>{
 const opts={assetBaseUrl:'file:///assets/'};
 assert.equal(createFrameDocument(opts),createFrameDocument({...opts,transparent:false}));
 const html=createFrameDocument({...opts,transparent:true});assert.match(html,/color-scheme:normal/);assert.match(html,/\.motion-stage::before,\.motion-stage::after/);assert.doesNotMatch(html,/--stage:transparent/);
 assert.throws(()=>createFrameDocument({...opts,transparent:'true'}),/布尔/);
 for(const id of ['type-reveal','count-up','word-focus'])assert.equal(layerStatus(resolveEffect(id)),'overlay-ok',id+' 当前源码审计过期');
 assert.equal(layerStatus(resolveEffect('particle-word')),'own-background');
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

test('组件拒绝过期记录、未获准条目和改写后的绘制定义',async()=>{
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
