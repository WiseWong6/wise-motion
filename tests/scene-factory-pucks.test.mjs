// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';
import previewApi from '../catalog/preview-size.js';

test('收藏猫脸同屏完整绘制全部十五款，五列三行且回看保持静态排列',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw;
 const original=w.WiseSceneSources.factory,portraits=[];
 w.WiseSceneSources.factory=(session,...args)=>{
  const result=original(session,...args),art=session.env.CatArt;
  session.env.CatArt={...art,draw(ctx,state,time,options){
   portraits.push({kind:state.recipe.kind,headOnly:options.headOnly,noBlink:options.noBlink});
   return art.draw(ctx,state,time,options);
  }};
  return result;
 };
 try{
  const effect=data.effects.find(e=>e.id==='factory-cat-puck-illustration');
  assert.equal(effect.variants,undefined,'整组显示，不再逐个切换');
  assert.deepEqual(previewApi.size(effect),{width:640,height:360});
  draw=w.MotionKit.createRenderer(root,{...effect,variant_id:'0'});
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
  assert.equal(canvas.width,1280);assert.equal(canvas.height,720);
  let matrix=[1,1,0,0],stack=[],images=[];
  const hooks={
   setTransform(a,b,c,d,e,f){matrix=[a,d,e,f];},
   save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},
   translate(x,y){matrix[2]+=x*matrix[0];matrix[3]+=y*matrix[1];},
   scale(x,y){matrix[0]*=x;matrix[1]*=y;},clearRect(){images=[];},
   drawImage(image,x,y,width,height){images.push({image,x:matrix[2]+x*matrix[0],y:matrix[3]+y*matrix[1],width:width*matrix[0],height:height*matrix[1]});}
  };
  for(const [name,hook]of Object.entries(hooks)){
   const native=ctx[name];ctx[name]=function(...args){hook(...args);return native.apply(this,args);};
  }
  await draw.ready;
  assert.deepEqual(portraits.map(p=>p.kind),['xiaokui','silver','silvershaded','gold','goldtabby','solid','ginger','orangewhite','bicolor','tabby','points','calico','gray','bengal','white']);
  assert.ok(portraits.every(p=>p.headOnly&&p.noBlink),'保留完整猫头和原静态五官');
  let saved;
  for(const time of [0,1650,3000,0,1650]){
   draw(time);assert.equal(images.length,15);
   assert.equal(new Set(images.map(p=>p.image)).size,15,'每款都使用自己的原猫脸');
   const centers=images.map(p=>[p.x+p.width/2,p.y+p.height/2]);
   assert.equal(new Set(centers.map(p=>p[0])).size,5);assert.equal(new Set(centers.map(p=>p[1])).size,3);
   for(const p of images)assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=1280&&p.y+p.height+9.6<=720,'猫脸及薄底边完整留在同一画板内');
   for(let i=0;i<images.length;i++)for(const b of images.slice(i+1)){
    const a=images[i];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height+9.6<=b.y||b.y+b.height+9.6<=a.y,'猫脸之间保留间隔');
   }
   const frame=images.map(({image,...bounds})=>bounds);
   if(saved)assert.deepEqual(frame,saved);else saved=frame;
  }
 }finally{draw?.destroy();env.close();}
});
