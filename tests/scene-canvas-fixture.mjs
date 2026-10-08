// 仅记录迁入原作的二维绘图调用。不是浏览器像素或视觉验收的替代品。
import assert from 'node:assert/strict';
export function installSceneCanvas(w){
 const prior=w.HTMLCanvasElement.prototype.getContext,contexts=new WeakMap();
 // jsdom 不计算容器字体单位；按下方固定的660像素星月画板提供原字号。
 const nativeStyle=w.getComputedStyle;
 w.getComputedStyle=function(node,...args){
  const css=nativeStyle.call(this,node,...args);
  if(!node.matches?.('.scene-letter-inner .words')||Number.isFinite(parseFloat(css.fontSize)))return css;
  return new Proxy(css,{get:(target,key)=>key==='fontSize'?`${Math.max(12,Math.min(20,660*.027))}px`:Reflect.get(target,key)});
 };
 const finite=args=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'原作绘图出现无效坐标');};
 w.Path2D=class {constructor(path){this.path=path;} };
 for(const k of ['moveTo','lineTo','bezierCurveTo','quadraticCurveTo','arc','ellipse','rect','roundRect','closePath','addPath'])w.Path2D.prototype[k]=function(...args){finite(args);};
 w.HTMLCanvasElement.prototype.getContext=function(type){
  if(type!=='2d'||this.dataset.sceneSource!=='original')return prior.call(this,type);
  if(contexts.has(this))return contexts.get(this);
  const canvas=this,state={canvas,draws:0,globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,fillStyle:'#000',strokeStyle:'#000',font:'10px sans-serif',stack:[]};
  const image=(width,height)=>({width,height,data:new Uint8ClampedArray(Math.round(width*height*4))});
  const methods={save(){state.stack.push({...state,stack:undefined});},restore(){const p=state.stack.pop();if(p){const stack=state.stack,draws=state.draws;Object.assign(state,p);state.stack=stack;state.draws=draws;}},measureText(text){return {width:String(text).length*18,actualBoundingBoxLeft:0,actualBoundingBoxRight:String(text).length*18,actualBoundingBoxAscent:15,actualBoundingBoxDescent:3};},getTransform(){return {a:1,b:0,c:0,d:1,e:0,f:0};},createImageData:image,getImageData(x,y,a,b){return image(a,b);},createLinearGradient(...a){finite(a);return{addColorStop(...b){finite(b);}};},createRadialGradient(...a){finite(a);return{addColorStop(...b){finite(b);}};},isPointInPath(){return false;},isPointInStroke(){return false;},createPattern(){return{};}};
  const ctx=new Proxy(state,{get(o,k){if(k in o)return o[k];if(k in methods)return methods[k];return (...args)=>{finite(args);if(['fill','stroke','fillRect','strokeRect','drawImage','putImageData','fillText'].includes(k))o.draws++;};},set(o,k,v){if(typeof v==='number'&&k!=='draws')finite([v]);o[k]=v;return true;}});
  contexts.set(this,ctx);return ctx;
 };
 Object.defineProperty(w.HTMLImageElement.prototype,'naturalHeight',{get:()=>1536,configurable:true});
 const native=w.Element.prototype.getBoundingClientRect;
 w.Element.prototype.getBoundingClientRect=function(){
  const root=this.closest?.('.scene-letter-inner');if(!root)return native.call(this);
  const rect=(x,y,width,height)=>({x,y,left:x,top:y,right:x+width,bottom:y+height,width,height});
  if(this===root)return rect(0,0,660,880);
  if(this.classList.contains('field'))return rect(92.4,589.6,475.2,52.8);
  if(this.classList.contains('words'))return rect(110.22,589.6,405,52.8);
  if(this.tagName==='SPAN')return rect(110.22+Array.from(this.parentNode.children).indexOf(this)*18,607,18,24);
  return native.call(this);
 };
}
