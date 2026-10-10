// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const contexts=[];
const paintProperties=['globalAlpha','filter','globalCompositeOperation','fillStyle','strokeStyle','font','textAlign','textBaseline','lineWidth','lineCap','shadowBlur'];
class Context{
 constructor(id){this.id=id;this.stack=[];this.commands=[];this.globalAlpha=1;this.filter='none';this.globalCompositeOperation='source-over';this.font='10px sans-serif';}
 command(name,args){for(const v of args)if(typeof v==='number')assert(Number.isFinite(v),`${name}出现非有限数值`);const row=[name,...args.map(v=>v instanceof Canvas?`canvas:${v.id}`:v)];if(['fill','stroke','fillText','fillRect'].includes(name))row.push({alpha:this.globalAlpha,color:name==='stroke'?this.strokeStyle:this.fillStyle,font:this.font,align:this.textAlign,baseline:this.textBaseline,width:this.lineWidth});this.commands.push(row);}
 save(){this.stack.push(Object.fromEntries(paintProperties.map(key=>[key,this[key]])));this.command('save',[]);}
 restore(){assert(this.stack.length,`画布${this.id}恢复次数过多`);Object.assign(this,this.stack.pop());this.command('restore',[]);}
 createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)};}
 putImageData(){this.command('putImageData',[]);}
 createLinearGradient(...a){this.command('linearGradient',a);return{addColorStop:(...a)=>this.command('colorStop',a)};}
 createRadialGradient(...a){this.command('radialGradient',a);return{addColorStop:(...a)=>this.command('colorStop',a)};}
 measureText(s){const size=Number((this.font.match(/([\d.]+)px/)||[])[1])||10;return{width:Array.from(s).reduce((w,ch)=>w+size*(/[\u3400-\u9fff\uff00-\uffef]/.test(ch)?1:.48),0)};}
}
for(const name of ['beginPath','closePath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','arc','ellipse','rect','roundRect','fill','stroke','clip','clearRect','fillRect','translate','rotate','scale','transform','setTransform','drawImage','setLineDash','fillText'])Context.prototype[name]=function(...a){if(name==='arc')assert(a[2]>=0);if(name==='ellipse')assert(a[2]>=0&&a[3]>=0);if(name==='drawImage')assert(a[0] instanceof Canvas,'动画绘图引用了外部图片');this.command(name,a);};
let canvasCount=0;
class Canvas{constructor(){this.id=canvasCount++;this.width=0;this.height=0;this.dataset={view:'artwork'};this.context=new Context(this.id);contexts.push(this.context);}getContext(){return this.context;}}

export {Context,Canvas};
export function digest(canvas){return createHash('sha256').update(JSON.stringify(canvas.context.commands).replace(/canvas:(\d+)/g,(_,i)=>'canvas:'+(Number(i)-canvas.id))).digest('hex');}
export function reset(){for(const ctx of contexts)ctx.commands=[];}
