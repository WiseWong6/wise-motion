// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {history,state} from '../scripts/history.mjs';
import {environment,data,frameMarkup} from './helpers.mjs';
const effect=data.effects.find(e=>e.id==='concept-diagram');
const base='/Users/wisewong/Documents/Developer/wise-video/motion-tutorial/ai-motion-tutorial-portrait-remake/';
const source=await readFile(base+'scenes/physics.js','utf8');
const context=vm.createContext({window:{}});
vm.runInContext(await readFile(base+'runtime/theme.js','utf8'),context);
vm.runInContext(source.slice(0,source.indexOf('  // Shared transition:'))+'window.Diagrams={definitionMotion,conceptMotion};})();',context);
const pacing=createRequire(import.meta.url)(base+'runtime/pacing.js');
const beat=pacing.visualBeats.find(b=>b.sourceStart===232);
const start=beat.programStart+(232.55-beat.sourceStart)/(beat.sourceEnd-beat.sourceStart)*(beat.programEnd-beat.programStart);
const near=(a,b)=>assert.ok(Math.abs(Number(a)-b)<1e-8,`${a} != ${b}`);
function originalAt(t,which){
  const frame={strokes:[],fills:[],labels:[]},stack=[];let ops=[];
  const c={globalAlpha:1,dash:[],transform:[],
    save(){stack.push({globalAlpha:this.globalAlpha,dash:this.dash,transform:this.transform,strokeStyle:this.strokeStyle,lineDashOffset:this.lineDashOffset});},
    restore(){Object.assign(this,stack.pop());},
    beginPath(){ops=[];},arc(...p){ops.push(['arc',...p]);},moveTo(...p){ops.push(['M',...p]);},lineTo(...p){ops.push(['L',...p]);},bezierCurveTo(...p){ops.push(['C',...p]);},
    setLineDash(dash){this.dash=dash;},translate(...p){this.transform=[...this.transform,['translate',...p]];},scale(...p){this.transform=[...this.transform,['scale',...p]];},rotate(...p){this.transform=[...this.transform,['rotate',...p]];},
    stroke(){frame.strokes.push({ops,alpha:this.globalAlpha,offset:this.lineDashOffset,transform:this.transform});},
    fill(){frame.fills.push({ops,alpha:this.globalAlpha,transform:this.transform});}
  };
  context.window.Diagrams[which](c,t,{title(){},text(text,x,y,options){frame.labels.push({text,x,y,alpha:c.globalAlpha*options.alpha});}});
  return frame;
}
const point=(x,y,r,a)=>[x+Math.cos(a)*r,y+Math.sin(a)*r];
function arcNumbers(op){const [,x,y,r,a,b]=op;return[...point(x,y,r,a),r,r,0,b-a>Math.PI?1:0,1,...point(x,y,r,b)];}
const numbers=d=>(d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[]).map(Number);
function compare(actual,expected){assert.equal(actual.length,expected.length);actual.forEach((v,i)=>near(v,expected[i]));}

test('两段图解按实际成片时钟保留原弧线、流线、球心和标签关系，回拖与终点确定',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const part=id=>root.querySelector(`[data-part="${id}"]`),num=(id,key)=>Number(part(id).getAttribute(key));
    for(const ms of [180,400,950,1400,1900,2800,3900,4800,6100,6600,7000,8300,9000,10000,10900,11700,12500]){
      player.seek(ms);
      const t=pacing.toVisualSource(start+(ms-150)/1000)-220,definition=t<19;
      const frame=originalAt(t,definition?'definitionMotion':'conceptMotion');
      const id=definition?'definition':'concept',opacity=num(id,'opacity');
      assert.equal(part(id).getAttribute('display'),'inline');assert.equal(part(definition?'concept':'definition').getAttribute('display'),'none');
      const arcs=frame.strokes.filter(p=>p.ops.length===1&&p.ops[0][0]==='arc'&&p.ops[0][5]-p.ops[0][4]<Math.PI*2);
      const spinCount=definition?6:4;
      assert.ok(arcs.length>=spinCount);
      arcs.slice(0,spinCount).forEach((p,i)=>{
        const prefix=definition?'def':'concept';compare(numbers(part(prefix+'-spin'+i).getAttribute('d')),arcNumbers(p.ops[0]));
        near(num(prefix+'-spin'+i,'opacity')*opacity,p.alpha);
        const [,x,y,r,a]=p.ops[0];compare([num(prefix+'-dot'+i,'cx'),num(prefix+'-dot'+i,'cy')],point(x,y,r,a));
      });
      for(const p of frame.strokes.filter(p=>p.ops.some(op=>op[0]==='C'))){
        const prefix=definition?'def-flow':'concept-flow',index=frame.strokes.filter(p=>p.ops.some(op=>op[0]==='C')).indexOf(p);
        compare(numbers(part(prefix+index).getAttribute('d')),p.ops.flatMap(op=>op.slice(1)));
        near(num(prefix,'opacity')*opacity,p.alpha);near(num(prefix,'stroke-dashoffset'),p.offset);
      }
      for(const label of frame.labels){
        const text=[...part(id).querySelectorAll('text')].find(n=>n.textContent===label.text);
        assert.ok(text,label.text);near(Number(text.parentElement.getAttribute('opacity'))*opacity,label.alpha);
      }
      if(definition){
        const outer=frame.strokes.find(p=>p.ops.length===1&&p.ops[0][0]==='arc'&&p.ops[0][5]===Math.PI*2);
        near(num('outer','r'),outer.ops[0][3]);near(num('outer','stroke-dashoffset'),outer.offset);
        const core=frame.fills.slice(-2);near(num('def-core','r'),core[0].ops[0][3]);near(num('def-pulse','r'),core[1].ops[0][3]);
      }else{
        const shell=frame.strokes.find(p=>p.transform.length===2),core=frame.fills.find(p=>p.transform.length===2);
        near(num('concept-shell','r'),shell.ops[0][3]);near(num('concept-core','r'),core.ops[0][3]);
        compare(numbers(part('breath').getAttribute('transform')),[540,790,shell.transform[1][1]]);
        if(arcs.length>spinCount){compare(numbers(part('rotation-arc').getAttribute('d')),arcNumbers(arcs.at(-1).ops[0]));near(num('rotation','opacity')*opacity,arcs.at(-1).alpha);}
      }
    }
    player.seek(effect.duration_ms);near(num('outward0','opacity'),.65);near(num('concept-flow','opacity'),1);near(num('concept-core','r'),76);
    const final=root.innerHTML,nodes=[...root.querySelectorAll('*')];
    player.seek(3500);const early=root.innerHTML;player.seek(10900);const late=root.innerHTML;
    player.seek(3500);assert.equal(root.innerHTML,early);player.seek(10900);assert.equal(root.innerHTML,late);
    player.seek(effect.duration_ms);assert.equal(root.innerHTML,final);assert.deepEqual([...root.querySelectorAll('*')],nodes);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    player.seek(effect.duration_ms);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    for(const node of root.querySelectorAll('text')){
      const scale=node.closest('[data-part="definition"]') ? .34 : .5;
      const title=Number(node.getAttribute('font-size'))*scale>=24;
      assert.equal(node.getAttribute('font-weight'),title||/[0-9]/.test(node.textContent)?'700':'300');
      assert.ok([12,16,24].some(s=>Math.abs(s-Number(node.getAttribute('font-size'))*scale)<1e-8));
    }
  }finally{env.close();}
});

test('概念图解的两个案例一并迁入，可搜索直达，缩略图与预览使用相同实现',async()=>{
  const historical=await history(data),cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
  assert.equal(effect.category,'data');assert.ok(!historical.recipes.some(e=>e.history_id==='tutorial-definition'));
  assert.ok(historical.excluded.some(e=>e.id==='tutorial-definition'));
  assert.deepEqual(cross.rules['tutorial-definition'].migration.cases,['tutorial-definition','tutorial-concept']);
  for(const file of cross.rules['tutorial-definition'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  const env=await environment(true,{staticPreview:true,hash:'#concept-diagram'});
  try{
    const {w}=env,d=w.document;await env.reveal('[data-effect="concept-diagram"] .thumb');assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const q of [effect.name,'三步定义图解','提问页概念图解'])assert.equal(w.MotionMatch.rank(data,q)[0].effect.id,effect.id);
    const thumb=d.querySelector('[data-effect="concept-diagram"] .thumb .motion-stage'),root=d.createElement('div');
    const player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);
    assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));player.destroy();
    assert.match(d.getElementById('code').textContent,/catalog\/effects\/concept-diagram\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
