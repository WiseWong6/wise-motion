/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* Fixed-time evaluation for the author's imported property tracks. No playback timer. */
(function(global){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const eases=new Map();
  function resolveEase(name){
    if(eases.has(name))return eases.get(name);
    let fn;
    if(name==='none'||name==='linear')fn=p=>p;
    const power=/^power([1-4])\.(in|out|inOut)$/.exec(name);
    if(power){const n=Number(power[1])+1;fn=power[2]==='in'?p=>p**n:power[2]==='out'?p=>1-(1-p)**n:p=>p<.5?(2*p)**n/2:1-(2*(1-p))**n/2;}
    if(name==='sine.out')fn=p=>Math.sin(p*Math.PI/2);
    if(name==='sine.inOut')fn=p=>(1-Math.cos(p*Math.PI))/2;
    if(name==='expo.out')fn=p=>p===1?1:1-2**(-10*p);
    if(name==='circ.out')fn=p=>Math.sqrt(1-(p-1)**2);
    const back=/^back\.out\(([\d.]+)\)$/.exec(name);
    if(back){const s=Number(back[1]);fn=p=>1+(s+1)*(p-1)**3+s*(p-1)**2;}
    if(!fn)throw Error('未登记的原动作曲线：'+name);
    eases.set(name,fn);return fn;
  }
  function ease(name='power1.out',p){return resolveEase(name)(clamp(p));}
  const numbers=/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi;
  const normalize=value=>String(value).replace(/#([0-9a-f]{6})\b/gi,(_,h)=>`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4),16)},1)`).replace(/rgba?\(([^)]+)\)/g,(_,v)=>{const a=v.split(/\s*,\s*/);return `rgba(${a.slice(0,3).join(',')},${a[3]??1})`;});
  function interpolate(a,b){
    if(typeof a==='number'&&typeof b==='number')return p=>a+(b-a)*p;
    const end=normalize(b),to=end.match(numbers)||[];let start=normalize(a);
    if(start==='none'||start==='')start=end.replace(numbers,'0');
    const from=start.match(numbers)||[];
    if(from.length!==to.length)return p=>p>=1?b:a;
    const parts=end.split(numbers),initial=from.map(Number),delta=to.map((n,i)=>Number(n)-initial[i]);
    return p=>{let value=parts[0];for(let i=0;i<delta.length;i++)value+=String(initial[i]+delta[i]*p)+parts[i+1];return value;};
  }
  function mix(a,b,p){return interpolate(a,b)(p);}
  const controls=new Set(['duration','ease','stagger','repeat','repeatDelay','yoyo','immediateRender','onUpdate','delay']);
  const transforms=new Set(['x','y','rotation','scale','scaleX','scaleY']);
  function create(doc){
    const timelines=[];
    const targets=value=>typeof value==='string'?[...doc.querySelectorAll(value)]:Array.isArray(value)?value:value&&typeof value[Symbol.iterator]==='function'?[...value]:value?[value]:[];
    function timeline(){
      const tracks=[],bases=new Map(),originals=new Map(),states=new Map();let length=0,sorted=null;
      const ordered=()=>sorted||(sorted=[...tracks].sort((a,b)=>a.at-b.at||a.order-b.order));
      const getBase=(target,key)=>{
        if(!bases.has(target)){bases.set(target,new Map());states.set(target,{});}const base=bases.get(target);
        if(!base.has(key)){
          let value=target[key];
          if(target.style){
            const computed=doc.defaultView.getComputedStyle(target);
            if(!originals.has(target))originals.set(target,computed.transform==='none'?'':computed.transform||'');
            value=transforms.has(key)?(key.startsWith('scale')?1:0):target.style[key]||computed[key]||(key==='opacity'?1:0);
          }
          if(typeof value==='string'&&value.trim()!==''&&Number.isFinite(Number(value)))value=Number(value);
          base.set(key,value??0);
        }
        return base;
      };
      function progress(track,time){
        const {at,duration,repeat,repeatDelay,yoyo}=track;
        if(time<at)return null;
        if(!duration)return 1;
        const total=duration*(repeat+1)+repeatDelay*repeat;
        if(time>=at+total)return yoyo&&repeat%2?0:1;
        const passed=time-at,cycle=Math.min(repeat,Math.floor(passed/(duration+repeatDelay)));
        let p=clamp((passed-cycle*(duration+repeatDelay))/duration);
        if(yoyo&&cycle%2)p=1-p;
        return ease(track.ease,p);
      }
      function valueAt(target,key,time){
        let value=getBase(target,key).get(key);
        for(const t of ordered()){
          if(t.target!==target||!(key in t.to))continue;
          const p=progress(t,time);if(p!==null)value=t.values[key](p);
        }
        return value;
      }
      function add(value,from,to,at=length,set=false){
        if(!Number.isFinite(at))throw Error('原动作时间必须为秒数');
        const nodes=targets(value),props=Object.fromEntries(Object.entries(to).filter(([key])=>!controls.has(key)));
        nodes.forEach((target,i)=>{
          const start=at+(to.delay||0)+i*(Number(to.stagger)||0),initial={};
          for(const key of Object.keys(props)){
            const base=getBase(target,key),prior=tracks.some(t=>t.target===target&&key in t.to);
            if(from&&key in from&&!prior&&to.immediateRender!==false)base.set(key,from[key]);
            initial[key]=from&&key in from?from[key]:valueAt(target,key,start);
          }
          // fromTo may set properties absent from its destination (opacity, dasharray).
          for(const [key,val] of Object.entries(from||{}))if(!controls.has(key)&&!(key in props)){
            const base=getBase(target,key);
            if(!tracks.some(t=>t.target===target&&key in t.to)&&to.immediateRender!==false)base.set(key,val);
          }
          const duration=set?0:to.duration??.5,repeat=to.repeat||0,repeatDelay=to.repeatDelay||0;
          const keys=Object.keys(props),values=Object.fromEntries(keys.map(key=>[key,interpolate(initial[key],props[key])]));
          tracks.push({target,to:props,keys,values,at:start,duration,repeat,repeatDelay,yoyo:Boolean(to.yoyo),ease:to.ease||'power1.out',onUpdate:to.onUpdate,order:tracks.length});
          sorted=null;
          length=Math.max(length,start+duration*(repeat+1)+repeatDelay*repeat);
        });
        return api;
      }
      const api={
        fromTo:(target,from,to,at)=>add(target,from,to,at),
        to:(target,to,at)=>add(target,null,to,at),
        set:(target,to,at)=>add(target,null,to,at,true),
        seek(time){
          for(const [node,base]of bases){const state=states.get(node);for(const [key,value]of base)state[key]=value;}
          for(const track of ordered()){const p=progress(track,time);if(p===null)continue;
            const state=states.get(track.target);for(const key of track.keys)state[key]=track.values[key](p);}
          // Object clocks precede their render callbacks; DOM tracks are applied afterward.
          for(const [target,state] of states)if(!target.style)Object.assign(target,state);
          for(const track of tracks)track.onUpdate?.();
          for(const [target,state] of states)if(target.style){
            const pose={x:0,y:0,rotation:0,scale:1,scaleX:1,scaleY:1};let moved=false;
            for(const [key,val] of Object.entries(state)){
              if(transforms.has(key)){pose[key]=val;moved=true;}else if(target.style[key]!==String(val))target.style[key]=String(val);
            }
            if(moved){const transform=`${originals.get(target)||''} translate(${pose.x}px,${pose.y}px) rotate(${pose.rotation}deg) scale(${pose.scale*pose.scaleX},${pose.scale*pose.scaleY})`;if(target.style.transform!==transform)target.style.transform=transform;}
          }
          return api;
        },
        duration:()=>length,
        destroy(){tracks.length=0;sorted=null;bases.clear();originals.clear();states.clear();}
      };
      timelines.push(api);return api;
    }
    return {timeline,utils:{toArray:targets},timelines,destroy(){timelines.forEach(t=>t.destroy());timelines.length=0;}};
  }
  global.WiseAboutLoveClock={create,ease,mix};
})(globalThis);
