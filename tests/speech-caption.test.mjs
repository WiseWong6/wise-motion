// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {transform, build} from 'esbuild';
import {environment, data} from './helpers.mjs';
import {resolveEffect} from '../remotion/clock.mjs';
import {exportEffect} from '../scripts/export.mjs';
import {createFrameDocument} from '../remotion/frame-document.mjs';

const record = JSON.parse(await readFile(new URL('../catalog/assets/speech-caption/SOURCE.json', import.meta.url)));
const snapshot = await readFile(new URL('../catalog/assets/speech-caption/KLine-source.txt', import.meta.url), 'utf8');
const compiled = await transform(snapshot, {loader: 'jsx', format: 'cjs'});
const definition = resolveEffect('mask-stagger-text', 'speech-lines');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} / ${b}`);

// 执行冻结的原 KLine，而非用新实现生成预期。只替换时间上下文和字体测量。
function original(seconds) {
  const module = {exports: {}}, sourceTime = record.narration.s + seconds - 0.15;
  const sandbox = {module, exports: module.exports, Object,
    React: {createElement: (type, props, ...children) => ({type, props, children: children.flat(Infinity)})},
    useT: () => sourceTime, useContext: context => context === 'clock' ? sourceTime : {5: {en:record.narration}},
    CaptionCtx: 'clock', CaptionWordsCtx: 'words', useLocale: () => 'en',
    captionInEnglish: () => ({rows: record.rows, line: record.narration, hl: {'what you want': '#3DAD80'}}),
    T: {h1:80,h2:48}, F: {heavy: '"Oswald", sans-serif'}, C: {ink:'#F2F1EC'},
    document: {createElement: () => ({getContext: () => ({measureText: () => ({width:764})})})},
    clamp: v => Math.min(1,Math.max(0,v)),
    cubicOut: x => 1 - (1-x)**3,
    expoOut: x => x >= 1 ? 1 : 1 - 2**(-10*x),
    prog: (t,a,b,ease) => ease(Math.min(1,Math.max(0,(t-a)/Math.max(1e-6,b-a))))
  };
  vm.runInNewContext(compiled.code, sandbox);
  return module.exports.KLine({li:5, rows:record.rows, y:190, size:80, growUp:true});
}

test('随讲述展开逐帧对应原英文 KLine：字位、行距、上展与重点颜色', async () => {
  const env = await environment();
  try {
    const {w} = env, root = w.document.getElementById('root');
    const draw = w.MotionKit.createRenderer(root, definition);
    assert.deepEqual(Array.from(w.WiseSpeechCaption.defaults.times), record.narration.t.map(t => t-record.narration.s));
    for (const seconds of [...Array.from({length:98},(_,i)=>i/30), 1.72, 1.719999, 2.08, 0, 3.23, 1.72]) {
      draw(seconds*1000);
      const reference = original(seconds), outer = root.querySelector('[data-part="speech-caption"]');
      assert.equal(outer.style.visibility === 'visible', !!reference);
      if (!reference) continue;
      near(parseFloat(outer.style.top), reference.props.style.top);
      near(parseFloat(outer.style.height), reference.props.style.height);
      reference.children.forEach((row,i) => {
        const shown = outer.children[i];
        near(parseFloat(shown.style.height),row.props.style.height);
        near(parseFloat(shown.style.marginBottom),row.props.style.marginBottom);
        assert.equal(shown.style.lineHeight,row.props.style.lineHeight);
        row.children.forEach((clip,j) => {
          const glyph=shown.children[j].firstElementChild, expected=clip.children[0];
          near(parseFloat(glyph.style.transform.slice(11)),parseFloat(expected.props.style.transform.slice(11)));
          assert.equal(glyph.textContent,expected.children[0]);
          assert.equal(glyph.style.color,expected.props.style.color ? 'rgb(61, 173, 128)' : '');
          assert.equal(shown.children[j].style.paddingBottom,clip.props.style.paddingBottom);
        });
      });
    }
    // 同帧重复、倒序定位与多实例不依赖上次播放状态。
    draw(1700); const before=root.innerHTML;
    const other=w.document.createElement('div'),second=w.MotionKit.createRenderer(other,definition);
    second(3230); draw(0); draw(1700); assert.equal(root.innerHTML,before);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    draw(1700);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    draw.destroy();draw(0);assert.equal(root.innerHTML,before);
  } finally {env.close();}
});

test('目录示例来源与独立帧依赖齐全，旧升入示例继续使用原绘制', async () => {
  const env=await environment();
  try {
    const {w}=env,root=w.document.getElementById('root');
    w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
    for(const variant of ['standard','poster-words','speech-lines']) {
      const e=resolveEffect('mask-stagger-text',variant);
      const doc=createFrameDocument({assetBaseUrl:'file:///wise-motion/',definition:e});
      assert.match(doc,/effects\/speech-caption\.js/);
    }
    const old=w.MotionKit.createRenderer(root,resolveEffect('mask-stagger-text','standard'));
    old(1000);assert.ok(root.querySelector('svg'));assert.equal(root.querySelector('[data-part="speech-caption"]'),null);
    w.MotionKit.createRenderer(root,definition)(1700);assert.equal(root.querySelector('svg'),null);
    assert.ok(root.querySelector('[data-part="speech-caption"]'));
    assert.equal(data.effects.filter(e=>e.id==='mask-stagger-text').length,1);
    assert.match(w.MotionExport.prompt(definition,{},data),/0\.42|0.42/);
    assert.match(w.MotionExport.code(definition),/WiseSpeechCaption/);
  }finally{env.close();}
});

test('源码导出包含真实绘制、字符时间与本地字体，独立工程可打包', async () => {
  const temporary=await mkdtemp(path.join(tmpdir(),'wise-speech-caption-'));
  try {
    const result=await exportEffect('mask-stagger-text',{variantId:'speech-lines',outDir:temporary});
    assert.equal(result.kind,'standalone');
    const font=await readFile(path.join(temporary,'public/fonts/Oswald-Bold.woff2'));
    assert.deepEqual(font,await readFile(new URL('../catalog/fonts/Oswald-Bold.woff2',import.meta.url)));
    const output=await build({entryPoints:[path.join(temporary,'index.jsx')],bundle:true,write:false,platform:'browser',format:'esm',external:['react','react-dom','remotion']});
    assert.match(output.outputFiles[0].text,/stateAt/);
    assert.doesNotMatch(output.outputFiles[0].text,/\/Users\/|wise-motion-promo\/src/);
    const renderer=await readFile(path.join(temporary,'catalog/remotion/speech-caption.jsx'),'utf8');
    assert.match(renderer,/useCurrentFrame/);assert.match(renderer,/face\.load/);assert.match(renderer,/cancelRender/);
  }finally{await rm(temporary,{recursive:true,force:true});}
});

test('字幕书签直接选中随讲述展开示例', async () => {
  const env=await environment(true,{hash:'#speech-caption',staticPreview:true});
  try {
    const doc=env.w.document;
    assert.equal(doc.querySelector('.effect-item[aria-current="true"]').dataset.effect,'mask-stagger-text');
    assert.equal(doc.getElementById('effect-variant-field').hidden,false);
    assert.equal(doc.getElementById('effect-variant').value,'speech-lines');
    assert.ok(doc.querySelector('#preview [data-part="speech-caption"]'));
  }finally{env.close();}
});

test('逐帧组件等待字体后绘制当前定位，失败和卸载正确释放等待', async () => {
  const component = await readFile(new URL('../catalog/remotion/speech-caption.jsx',import.meta.url),'utf8');
  const compiledComponent = await transform(component,{loader:'jsx',format:'cjs'});
  for(const outcome of ['success','failure','destroyed']) {
    const env=await environment();
    try {
      const {w}=env,root=w.document.getElementById('root'),effects=[],calls=[],errors=[];
      let resolveFont,rejectFont;
      const pending=new Promise((resolve,reject)=>{resolveFont=resolve;rejectFont=reject;});
      const fonts={add:()=>calls.push('add'),delete:()=>calls.push('delete')};
      Object.defineProperty(w.document,'fonts',{value:fonts,configurable:true});
      const React={createElement:(type,props,...children)=>{if(props?.ref)props.ref.current=root;return {type,props,children};}};
      const hooks={useRef:value=>({current:value}),useLayoutEffect:fn=>effects.push(fn)};
      const remotion={AbsoluteFill(){},staticFile:path=>'/'+path,useCurrentFrame:()=>51,
        useVideoConfig:()=>({fps:30,width:640,height:360}),
        useDelayRender:()=>({delayRender:()=>{calls.push('delay');return 1;},continueRender:()=>calls.push('continue'),cancelRender:error=>{calls.push('cancel');errors.push(error);}})};
      const module={exports:{}},sandbox={module,exports:module.exports,document:w.document,
        WiseSpeechCaption:w.WiseSpeechCaption,FontFace:class{load(){return pending;}},
        require:name=>name==='react'?{...React,...hooks}:name==='remotion'?remotion:{}};
      // 按模块作用域执行，避免导出组件名覆盖浏览器上的字幕绘制接口。
      vm.runInNewContext('(function(module,exports,require){'+compiledComponent.code+'\n})(module,exports,require);',sandbox);
      module.exports.WiseSpeechCaption({});
      const cleanup=effects.map(fn=>fn());
      assert.deepEqual(calls,['delay']);assert.equal(root.children.length,0);
      if(outcome==='destroyed')cleanup.forEach(fn=>fn?.());
      if(outcome==='failure')rejectFont(new Error('font unavailable'));else resolveFont();
      await pending.catch(()=>{});await Promise.resolve();await Promise.resolve();
      if(outcome==='success'){
        assert.equal(errors.length,0,errors.map(error=>error.stack).join('\n'));
        assert.ok(root.querySelector('[data-part="speech-caption"]'),JSON.stringify(calls));
        const expected=w.WiseSpeechCaption.stateAt(1.7);
        near(parseFloat(root.querySelector('[data-part="speech-caption"]').style.top),expected.top);
        assert.deepEqual(calls,['delay','add','continue']);cleanup.forEach(fn=>fn?.());
      }else if(outcome==='failure'){
        assert.ok(calls.includes('cancel'));assert.equal(root.children.length,0);cleanup.forEach(fn=>fn?.());
      }else{assert.equal(root.children.length,0);assert.equal(calls.includes('add'),false);}
      assert.equal(calls.filter(call=>call==='continue').length,1);
      assert.equal(root.children.length,0);
    }finally{env.close();}
  }
});
