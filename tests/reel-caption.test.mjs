// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {environment} from './helpers.mjs';

const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/reel.js','utf8');
const helpers=source.slice(source.indexOf('const clamp ='),source.indexOf('const lerp ='))+
  source.slice(source.indexOf('const F ='),source.indexOf('const CREDIT ='))+
  source.slice(source.indexOf('function setFont('),source.indexOf('function chevron('));
const sourceCaption={
  neon:source.slice(source.indexOf('  const cap = VERT ?'),source.indexOf("  ctx.fillStyle = 'rgba(0,0,0,.2)';")),
  grit:source.slice(source.indexOf('  const capY = H -'),source.indexOf('  ctx.fillStyle = `rgba(255,240,220,'))
};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} / ${expected}`);
// 字体按用户规范改为 Oswald Bold；这些 advance 由本地字体文件独立读取。
// 原 typeOn 本身仍直接执行源码，用它核对写字、行首对齐与光标条件。
const advances={" ":256,"&":570,",":238,".":244,":":278,"A":551,"C":563,"D":586,"E":447,"F":434,"G":582,"H":610,"I":301,"L":443,"M":704,"N":561,"O":586,"R":600,"S":514,"T":445,"V":526,"Y":493,"a":460,"c":468,"d":503,"e":470,"f":320,"g":502,"h":509,"i":265,"j":269,"l":274,"m":753,"n":507,"p":505,"q":504,"r":383,"s":424,"t":351,"u":504,"w":597,"y":448,"—":908};
function context(){
  const state=[],calls=[],ctx={calls,font:'500 22px Menlo',globalAlpha:1,
    save(){state.push({font:this.font,letterSpacing:this.letterSpacing,fillStyle:this.fillStyle,globalAlpha:this.globalAlpha});},
    restore(){Object.assign(this,state.pop());},
    measureText(value){
      const size=Number(this.font.match(/([\d.]+)px/)[1]);
      const width=Array.from(value).reduce((sum,ch)=>sum+size*advances[ch]/1000,0);
      return {width:width+Array.from(value).length*(parseFloat(this.letterSpacing)||0)};
    },
    fillText(text,x,y){calls.push({kind:'text',text,x,y,font:this.font,color:this.fillStyle});},
    fillRect(x,y,width,height){calls.push({kind:'caret',x,y,width,height,color:this.fillStyle});}
  };
  ctx.letterSpacing='0px';return ctx;
}
function original(which,ms){
  const ctx=context(),sandbox={ctx,W:1920,H:1080,VERT:false};
  runInNewContext(helpers+'\nfunction draw(lt){'+sourceCaption[which]+'}\nglobalThis.draw=draw;',sandbox);
  sandbox.draw(ms/1000);return ctx.calls;
}
function compare(root,reference){
  const text=root.querySelector('[data-part="caption-text"]'),caret=root.querySelector('[data-part="caption-caret"]');
  const expectedText=reference.find(c=>c.kind==='text'),expectedCaret=reference.find(c=>c.kind==='caret');
  assert.equal(text.textContent,expectedText?.text||'');
  if(expectedText){near(+text.getAttribute('x'),expectedText.x);near(+text.getAttribute('y'),expectedText.y);assert.equal(text.parentNode.getAttribute('fill'),expectedText.color);}
  assert.equal(caret.getAttribute('visibility')==='visible',!!expectedCaret);
  if(expectedCaret)for(const key of ['x','y','width','height'])near(+caret.getAttribute(key),expectedCaret[key]);
}

test('字幕逐字与光标逐帧对应两场原 typeOn，共用 Oswald 字体和同一绘制函数',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),factory=w.MotionFactories['caption-type-caret'];
    w.HTMLCanvasElement.prototype.getContext=()=>context();
    for(const which of ['neon','grit']){
      const options=factory.presets[which];
      root.innerHTML='<svg xmlns="http://www.w3.org/2000/svg">'+factory.layer(options)+'</svg>';
      const render=factory.motion(root,options),finish=options.start+Array.from(options.text).length/options.cps;
      const times=[0,options.start*1000-1,options.start*1000,...Array.from({length:125},(_,i)=>options.start*1000+i*1000/60),finish*1000+1,3599,3600,3999,4000,4399,4400,4499,4500,4799,4800,5199,5200,6000];
      for(const time of times){render(time/1000);compare(root,original(which,time));}
      const reference=root.innerHTML;
      render(0);render(6);assert.equal(root.innerHTML,reference,'向前、向后定位不能丢失末态');
    }
  }finally{env.close();}
});

test('字幕使用预先读取的本地字宽，创建与播放都不测字，重复状态不产生改写',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),factory=w.MotionFactories['caption-type-caret'];
    w.HTMLCanvasElement.prototype.getContext=()=>{throw new Error('字体不应由画布重新测量');};
    for(const name of ['getBoundingClientRect','getClientRects'])w.Element.prototype[name]=()=>{throw new Error('播放时读取布局');};
    const render=factory(root);
    const count=root.querySelectorAll('*').length;
    for(const time of [0,2200,2223,2600,3000,3400,3600,4000,4400,4500,6000,0,2223,3000]){render(time);compare(root,original('neon',time));}
    assert.equal(root.querySelectorAll('*').length,count);
    render(3010);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});
    render(3010);assert.equal(observer.takeRecords().length,0);
    // 跨过一帧仍处于同一字数和光标状态，也不应产生重复写入。
    render(3011);assert.equal(observer.takeRecords().length,0);observer.disconnect();
  }finally{env.close();}
});

test('字幕锁定本地粗体字宽，字体尚未载入和迟到通知均不移动光标',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    w.HTMLCanvasElement.prototype.getContext=()=>{throw new Error('不能临时测量回退字体');};
    const render=w.MotionFactories['caption-type-caret'](root),text=root.querySelector('[data-part="caption-text"]');
    assert.match(text.style.fontFamily,/Oswald/);assert.equal(text.style.fontWeight,'700');
    for(const time of [2200,2223,2600,3300,4000,4499,4500]){
      render(time);compare(root,original('neon',time));
      if(text.textContent){
        const width=Array.from(text.textContent).reduce((sum,ch)=>sum+22*advances[ch]/1000+5,-5);
        near(+text.getAttribute('textLength'),width);
      }
      const before=root.innerHTML;w.dispatchEvent(new w.Event('loadingdone'));render(time);assert.equal(root.innerHTML,before);
    }
  }finally{env.close();}
});

test('霓虹组合与独立字幕共用实际图层，真实拆解控制能单独显示字幕并还原',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document,whole=d.getElementById('root'),single=d.createElement('div');
    d.body.insertAdjacentHTML('beforeend','<section id="composition-panel"><div id="composition-layers"></div><p id="composition-status"></p></section>');
    w.eval(await readFile(new URL('../catalog/composition-controls.js',import.meta.url),'utf8'));
    const fullDraw=w.MotionFactories['neon-title-sequence'](whole),singleDraw=w.MotionFactories['caption-type-caret'](single);
    assert.equal(single.querySelectorAll('[data-layer]').length,1);assert.equal(single.querySelectorAll('[data-star]').length,0);
    const layer=whole.querySelector('[data-layer="caption"]'),count=whole.querySelectorAll('*').length;
    assert.equal(layer.querySelectorAll('[data-layer]').length,0,'说明文字里不能另藏一个不同名称的动作层');
    for(const time of [0,2200,2300,3000,3600,4000,4500,6000,0,3000]){
      fullDraw(time);singleDraw(time);
      const shown=single.querySelector('[data-layer="caption"]').cloneNode(true);
      assert.equal(shown.getAttribute('transform'),'translate(960 540) scale(2) translate(-960 -951.2)');
      shown.removeAttribute('transform');assert.equal(layer.outerHTML,shown.outerHTML);
      w.MotionComposition.isolate(whole,['caption']);
      for(const node of whole.querySelectorAll('[data-layer]'))assert.equal(node.getAttribute('display')==='none',node.dataset.layer!=='caption');
      assert.equal(layer.querySelector('[display="none"]'),null);
      fullDraw(6000);fullDraw(time);assert.equal(layer.getAttribute('display'),null);
      w.MotionComposition.isolate(whole,['chrome']);assert.equal(layer.getAttribute('display'),'none');
      w.MotionComposition.isolate(whole,null);assert.equal(whole.querySelector('[data-layer][display="none"]'),null);
      assert.equal(layer.querySelector('[display="none"]'),null);assert.equal(whole.querySelectorAll('*').length,count);
    }
  }finally{env.close();}
});
