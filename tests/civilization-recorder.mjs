import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
export const artwork={paper:{width:1920,height:1080},civilization:{width:1672,height:941},growth:{width:1254,height:1254},brandPlate:{width:1920,height:1080},brandOrigins:Array.from({length:7000},(_,i)=>[i%640,Math.floor(i/640)*29])};
export function recorder(){
 let hash,stack=[];const values={globalAlpha:1};
 const record=(op,args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),op);hash?.update(JSON.stringify([op,...args.map(a=>typeof a==='object'?(a?.width?[a.width,a.height]:'object'):a)])+'\n');};
 const context=new Proxy(values,{
  get(o,k){if(k in o)return o[k];if(k==='save')return()=>{stack.push({...o});record(k,[]);};if(k==='restore')return()=>{assert.ok(stack.length);Object.assign(o,stack.pop());record(k,[]);};if(k==='createLinearGradient')return(...args)=>{record(k,args);return{addColorStop:(...a)=>record('colorStop',a)};};return(...args)=>record(k,args);},
  set(o,k,v){if(k==='globalAlpha')assert.ok(Number.isFinite(v)&&v>=0&&v<=1);o[k]=v;record('set',[k,v]);return true;}
 });
 return {context,digest(draw){hash=createHash('sha256');draw(context);assert.equal(stack.length,0);return hash.digest('hex');}};
}
