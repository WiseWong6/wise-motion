// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

test('冠毛展开保留原荷塘、中心取景和一百三十七道冠毛时序',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw,session;
 const source=w.WiseSceneSources.dandelion;
 w.WiseSceneSources.dandelion=(S,...args)=>{session=S;return source(S,...args);};
 try{
  const effect=data.effects.find(e=>e.id==='filament-unfold-turn');
  draw=w.MotionKit.createRenderer(root,effect);await draw.ready;
  const ctx=root.querySelector('canvas').getContext('2d'),calls=[];
  for(const method of ['fillRect','translate','scale','stroke','fill']){
   const original=ctx[method];ctx[method]=function(...args){calls.push([method,...args,this.fillStyle]);return original.apply(this,args);};
  }
  let floretArgs;
  const proto=session.env.DandelionJourney.prototype,floret=proto.floret;
  proto.floret=function(...args){floretArgs=args.slice(1);return floret.apply(this,args);};
  const j=w.MotionDandelion.journey(),frames=new Map();draw(1);
  for(const ms of [0,450,1200,2500,3000,1200,0]){
   calls.length=0;draw(ms);
   const time=2.35+Math.min(2.4,Math.max(0,ms/1000-.15)),pose=j.subjectPose(time,w.MotionDandelion.course),q=j.entryProgress(time);
   assert.deepEqual(calls.slice(0,3).map(c=>c.slice(0,-1)),[['translate',320,158],['scale',1.05,1.05],['translate',-pose.x,-pose.y]]);
   assert.ok(calls.some(c=>c[0]==='fillRect'&&c[1]===0&&c[2]===0&&c[3]===900&&c[4]===1200),'原荷塘铺满取景区域');
   const opacity=(.55+.45*Math.hypot(j.heroSeed.x,j.heroSeed.y)/112)*.85;
   const expected=[pose.x,pose.y,pose.radius,pose.angle,(opacity+(1-opacity)*q)*j.openingGrowth(j.heroSeed,time),j.filamentState(time).map((f,i)=>({...f,opacity:f.opacity*(i%13===0?1:q)}))];
   assert.equal(JSON.stringify(floretArgs),JSON.stringify(expected),'原冠毛轮廓、比例、转角和透明度不变');
   assert.equal(floretArgs[5].length,137);
   const frame=JSON.stringify(calls);if(frames.has(ms))assert.equal(frame,frames.get(ms));else frames.set(ms,frame);
  }
 }finally{draw?.destroy();env.close();}
});
