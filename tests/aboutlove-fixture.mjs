// Structural drawing fixture: records deterministic operations, never substitutes for pixel review.
import assert from 'node:assert/strict';
export function installAboutloveFixture(w){
 const prior=w.HTMLCanvasElement.prototype.getContext,contexts=new WeakMap();
 const faces=new Set();
 if(!w.FontFace){w.FontFace=class{constructor(family,source,options){Object.assign(this,{family,source,...options});}load(){return Promise.resolve(this);}};}
 if(!w.document.fonts)Object.defineProperty(w.document,'fonts',{configurable:true,value:{add:face=>faces.add(face),delete:face=>faces.delete(face),load:()=>Promise.resolve([{}]),check:()=>true,ready:Promise.resolve(),get size(){return faces.size;}}});
 w.ImageData=class{constructor(width,height){this.width=width;this.height=height;this.data=new Uint8ClampedArray(width*height*4);}};
 w.SVGElement.prototype.getTotalLength=function(){return 640;};
 const finite=args=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'动作绘图出现无效坐标');};
 w.HTMLCanvasElement.prototype.getContext=function(type,...args){
  if(type!=='2d'||!this.dataset.aboutlove)return prior.call(this,type,...args);
  if(contexts.has(this))return contexts.get(this);
  const canvas=this,state={canvas,draws:0,hash:2166136261,globalAlpha:1,font:'16px serif',stack:[]};
  function record(name,args){finite(args);state.draws++;const paint=/^(fill|stroke|drawImage|putImageData)/.test(name),text=/Text$/.test(name);const s=name+':'+args.map(x=>typeof x==='number'?x.toFixed(5):typeof x==='string'?x:x?.width+'x'+x?.height).join(',')+(paint?';'+state.globalAlpha+';'+(name.startsWith('stroke')?state.strokeStyle:state.fillStyle):'')+(text?';'+state.font:'');for(let i=0;i<s.length;i++)state.hash=Math.imul(state.hash^s.charCodeAt(i),16777619)>>>0;}
  const methods={
   save(){state.stack.push({...state,stack:undefined});},restore(){const p=state.stack.pop();if(p){const {draws,hash,stack}=state;Object.assign(state,p,{draws,hash,stack});}},
   clearRect(...args){record('clear',args);state.hash=2166136261;},
   measureText(text){const size=parseFloat(state.font.match(/([\d.]+)px/)?.[1]||16);return {width:[...String(text)].reduce((n,c)=>n+size*(c.codePointAt(0)>255?1:.55),0)};},
   getImageData(x,y,width,height){
    finite([x,y,width,height]);const data=new Uint8ClampedArray(width*height*4);
    // A synthetic three-part ink mask exercises glyph slots, copies and partitioning.
    for(let py=0;py<height;py++)for(let px=0;px<width;px++)if(px>width*.19&&px<width*.81&&py>height*.12&&py<height*.88&&((px/30|0)%3!==1||(py/40|0)%3!==1))data[(py*width+px)*4+3]=255;
    return {width,height,data};
   },createImageData(width,height){return new w.ImageData(width,height);},
   createLinearGradient(...a){finite(a);return{addColorStop(...v){finite(v);}};},createRadialGradient(...a){finite(a);return{addColorStop(...v){finite(v);}};}
  };
  const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:k in methods?methods[k]:(...args)=>record(k,args);},set(o,k,v){if(typeof v==='number')finite([v]);o[k]=v;return true;}});
  contexts.set(this,ctx);return ctx;
 };
 return {faces};
}
