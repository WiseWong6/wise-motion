// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

test('星月文字在缩略图、主预览和放大画板中保持原字宽与发送字形大小',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 const fontSize=17.82,advance=fontSize*1.025,fonts=[],recorded=new WeakSet();let outerScale=1;
 const nativeRect=w.Element.prototype.getBoundingClientRect,nativeStyle=w.getComputedStyle,nativeContext=w.HTMLCanvasElement.prototype.getContext;
 const rect=(x,y,width,height)=>({x,y,left:x,top:y,right:x+width,bottom:y+height,width,height});
 Object.defineProperties(root,{clientWidth:{value:640},clientHeight:{value:360}});
 w.getComputedStyle=function(node){const css=nativeStyle.call(w,node);if(!node.matches('.scene-letter-inner .words'))return css;
  return new Proxy(css,{get:(target,key)=>key==='fontSize'?`${fontSize}px`:key==='fontFamily'?'霞鹜文楷':Reflect.get(target,key)});
 };
 w.Element.prototype.getBoundingClientRect=function(){
  if(this===root)return rect(0,0,640*outerScale,360*outerScale);
  const stage=this.closest?.('.scene-letter-inner');if(!stage)return nativeRect.call(this);
  const scale=Number(stage.style.transform.match(/scale\(([^)]+)\)/)[1])*outerScale;
  const local=(x,y,width,height)=>rect(x*scale,y*scale,width*scale,height*scale);
  if(this===stage)return local(0,0,660,880);
  if(this.classList.contains('field'))return local(92.4,589.6,475.2,52.8);
  if(this.classList.contains('words'))return local(110.22,589.6,405,52.8);
  if(this.tagName==='SPAN'){
   const previous=[...this.parentElement.children].slice(0,[...this.parentElement.children].indexOf(this));
   const width=node=>node.style.width?parseFloat(node.style.width)*fontSize:advance;
   return local(110.22+previous.reduce((sum,n)=>sum+width(n),0),607,width(this),fontSize*1.35);
  }
  return nativeRect.call(this);
 };
 w.HTMLCanvasElement.prototype.getContext=function(...args){const c=nativeContext.apply(this,args);if(c&&!recorded.has(c)){recorded.add(c);const fill=c.fillText;c.fillText=function(...a){fonts.push(this.font);return fill.apply(this,a);};}return c;};
 let draw;
 try{for(const id of ['star-letter-journey','star-letter-blue-journey'])for(outerScale of [.25,1,2]){
  fonts.length=0;draw=w.MotionKit.createRenderer(root,data.effects.find(e=>e.id===id));await draw.ready;
  const stage=root.querySelector('.scene-letter-inner'),spans=[...stage.querySelectorAll('.words span')];
  assert.ok(Math.abs(Number(stage.style.transform.match(/scale\(([^)]+)\)/)[1])-360/880)<1e-10,'外层缩放不能再次改变内部画板比例');
  draw(650+175/2);assert.ok(Math.abs(parseFloat(spans[0].style.width)-1.025/2)<1e-10,'半个字应按原始字宽显露');
  draw(650+spans.length*175);
  for(const span of spans)assert.ok(Math.abs(parseFloat(span.style.width)-1.025)<1e-10,'完整文字不能被缩成残缺笔画');
  draw(650+spans.length*175+1050+10);
  assert.ok(fonts.length>0,'发送时实际绘制文字');
  assert.ok(fonts.every(font=>font===`400 ${fontSize}px 霞鹜文楷`),'转为水波字形后不应再次放大字体');
  draw(650+175/2);assert.ok(Math.abs(parseFloat(spans[0].style.width)-1.025/2)<1e-10,'回拖保持相同字宽');
  draw.destroy();draw=null;root.replaceChildren();
 }}finally{draw?.destroy();env.close();}
});
