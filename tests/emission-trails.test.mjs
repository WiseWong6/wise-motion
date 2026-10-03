// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data,sourceDefinition,frameMarkup} from './helpers.mjs';
const ids=['emission-drift','advected-trail'];
const effects=ids.map(id=>data.effects.find(e=>e.id===id));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function sourceFunction(source,name){
  const value=source.match(new RegExp('function '+name+'\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}'));
  assert.ok(value,'源码函数缺失：'+name);return value[0];
}

test('粒子释出逐时刻对应源公式，继承速度，扩散后独立消散',async()=>{
  const source=await readFile('/Users/wisewong/Documents/Developer/scenes/motion-catalog/packs/completed/source/drive/scene.js','utf8');
  const env=await environment();
  try{
    const originAt=t=>({x:464+32*Math.sin(t),y:200+2*Math.sin(t*2)}),cameraAt=t=>360*t+8*t*t;
    const constants=['clamp','smooth','ease'].map(name=>source.match(new RegExp('^const '+name+'=.*$','m'))?.[0]);
    assert.ok(constants.every(Boolean));
    const original=vm.runInNewContext(constants.join('\n')+'\n'+sourceFunction(source,'exhaustPuffs')+'\nexhaustPuffs',
      {W:900,CAR_SCALE:.64,DRIVE_SPEED:360,XIAOKUI_EXHAUST_PORT:{},world:originAt,cameraTravel:cameraAt});
    const api=env.w.MotionEmission;
    for(const options of [{interval:0},{interval:Infinity},{lifetime:.1}])
      assert.throws(()=>api.puffsAt(1,originAt,cameraAt,options),/必须有限/);
    assert.throws(()=>api.puffsAt(Infinity,originAt,cameraAt),/必须有限/);
    for(let time=0;time<4;time+=.023){
      const expected=original(time),actual=api.puffsAt(time,originAt,cameraAt,{rightEdge:912});
      assert.equal(actual.length,expected.length);
      actual.forEach((puff,i)=>{for(const key of ['x','y','radius','opacity'])close(puff[key],expected[i][key]);});
    }
    const dt=1e-7,first=api.puffsAt(dt,t=>({x:50+360*t,y:180}),()=>0)[0];
    assert.ok(Math.abs((first.x-50)/dt-360)<.01,'出口处没有继承主体速度');
    const young=api.puffsAt(.1,api.puffOriginAt,api.cameraTravelAt,{end:0})[0];
    const old=api.puffsAt(.65,api.puffOriginAt,api.cameraTravelAt,{end:0})[0];
    assert.ok(old.x<young.x&&old.y<young.y&&old.radius>young.radius&&old.opacity<young.opacity);
    assert.equal(api.puffsAt(.73,api.puffOriginAt,api.cameraTravelAt,{end:0}).length,0);
    const all=new Set();let maximum=0;
    for(let time=0;time<=3.1;time+=.01){const p=api.puffsAt(time,api.puffOriginAt,api.cameraTravelAt,{end:2.3});p.forEach(x=>all.add(x.index));maximum=Math.max(maximum,p.length);}
    assert.equal(all.size,13);assert.equal(maximum,4);
  }finally{env.close();}
});

test('双尾流的历史采样、尾口、年龄漂移和线宽对应源公式，停住时不堆积',async()=>{
  const source=await readFile('/Users/wisewong/Documents/Developer/scenes/ocean-sunset/sketch.js','utf8');
  const env=await environment();
  try{
    const api=env.w.MotionEmission,poseAt=t=>({x:100+14*t,y:180+30*Math.sin(t*.3),pitch:Math.atan2(9*Math.cos(t*.3),14),unit:12});
    for(const options of [{step:0},{step:Infinity},{lifetime:0}])
      assert.throws(()=>api.segmentsAt(1,poseAt,options),/必须有限/);
    assert.throws(()=>api.segmentsAt(Infinity,poseAt),/必须有限/);
    const smooth=(a,b,t)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*(3-2*q);};
    const original=vm.runInNewContext(sourceFunction(source,'contrailSegments')+'\ncontrailSegments',
      {SCENE_DURATION:65,height:360,smoothstep:smooth,flightAt:poseAt});
    for(const time of [0,2,2.1,3,4.7,8,12.1,15,20,28,59,60,61,62.5,64,65,70]){
      const t=Math.min(65,time),expected=original(time),actual=api.segmentsAt(t,poseAt,{start:2,end:61,fade:1-smooth(59,64,t)});
      assert.equal(actual.length,expected.length);
      actual.forEach((segment,i)=>{
        for(const endpoint of ['a','b'])for(const key of ['x','y'])close(segment[endpoint][key],expected[i][endpoint][key]);
        close(segment.alpha,expected[i].alpha);close(segment.width,expected[i].width);
      });
    }
    const stationary=()=>({x:320,y:180,pitch:0,unit:12});
    assert.equal(api.segmentsAt(5,stationary).length,0);
    assert.ok(api.segmentsAt(16,api.trailPoseAt,{start:2,end:14.5}).length>0);
    assert.equal(api.segmentsAt(26.5,api.trailPoseAt,{start:2,end:14.5}).length,0);
    const first=api.segmentsAt(1,poseAt)[0],later=api.segmentsAt(2,poseAt)[0];
    assert.ok(later.width>first.width&&later.alpha<first.alpha);
    close(later.a.x-first.a.x,-.9*.6);
    close(later.a.y-first.a.y,.35*.6+Math.sin(-1)*.1*.6);
  }finally{env.close();}
});

test('标准能力反复定位保持同一节点，尾流留在历史位置，末尾仅保留主体',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),api=w.MotionEmission;
    for(const effect of effects){
      const draw=w.MotionFactories[effect.id](root,w.MotionKit,sourceDefinition(effect));
      const nodes=[...root.querySelectorAll('*')];
      draw(effect.id==='emission-drift'?900:1000);const frame=frameMarkup(root);
      draw(effect.duration_ms);draw(0);draw(effect.id==='emission-drift'?900:1000);
      assert.equal(frameMarkup(root),frame);assert.deepEqual([...root.querySelectorAll('*')],nodes);
      if(effect.id==='emission-drift'){
        const p=api.puffsAt(.75,api.puffOriginAt,api.cameraTravelAt,{end:2.9})[0],node=root.querySelector('[data-part="puffs"] ellipse');
        assert.equal(node.getAttribute('transform'),'translate('+p.x+' '+p.y+') scale('+p.radius+')');
        close(Number(node.getAttribute('rx')),1.3);close(Number(node.getAttribute('ry')),.9);close(Number(node.getAttribute('opacity')),p.opacity);
        assert.equal(root.querySelector('radialGradient').getAttribute('gradientUnits'),'userSpaceOnUse');
        draw(effect.duration_ms);assert.ok([...root.querySelectorAll('[data-part="puffs"] ellipse')].every(n=>Number(n.getAttribute('opacity'))===0));
        assert.ok(root.querySelectorAll('[data-part="emitter"] path').length>20,'完整车身应在雾团消失后保留');
      }else{
        const t=2+24.5*.85/6,segment=api.segmentsAt(t,api.trailPoseAt,{start:2,end:14.5,scale:4/3})[0],haze=root.querySelector('[data-layer="haze"]'),core=root.querySelector('[data-layer="core"]');
        for(const node of [haze,core]){close(Number(node.getAttribute('x1')),segment.a.x);close(Number(node.getAttribute('y2')),segment.b.y);}
        close(Number(haze.getAttribute('stroke-width')),segment.width*3);close(Number(core.getAttribute('stroke-opacity')),segment.alpha);
        assert.equal(root.querySelector('[data-part="emitter"]').parentElement,root.querySelector('[data-part="tail"]').parentElement,'主体和尾流必须共享取景比例');
        draw(3300);const stopped=root.querySelector('[data-part="emitter"]').getAttribute('transform');
        draw(4800);assert.equal(root.querySelector('[data-part="emitter"]').getAttribute('transform'),stopped);
        assert.ok([...root.querySelectorAll('[data-layer="core"]')].some(n=>Number(n.getAttribute('stroke-opacity'))>0));
        draw(effect.duration_ms);assert.ok([...root.querySelectorAll('line')].every(n=>Number(n.getAttribute('stroke-opacity'))===0));
        assert.equal(root.querySelectorAll('[data-part="emitter"] path').length,4);
      }
    }
  }finally{env.close();}
});

test('完整保留原车和飞机轮廓，飞机接近轨迹对应原作且主体没有越界',async()=>{
  const car=await readFile('/Users/wisewong/Documents/Developer/scenes/motion-catalog/packs/completed/source/drive/xiaokui-car.js','utf8');
  const implementation=await readFile(new URL('../catalog/effects/emission-trails.js',import.meta.url),'utf8');
  assert.ok(implementation.includes(car.trim()),'原车的曲线、车轮和手臂动作应完整保留');
  const source=await readFile('/Users/wisewong/Documents/Developer/scenes/ocean-sunset/sketch.js','utf8');
  const expected=[];let path=[];
  const context={save(){},restore(){},scale(){},beginPath(){path=[];},moveTo(...p){path.push('M',...p);},
    lineTo(...p){path.push('L',...p);},quadraticCurveTo(...p){path.push('Q',...p);},closePath(){path.push('Z');},
    fill(){expected.push({fill:this.fillStyle,path});}};
  vm.runInNewContext(sourceFunction(source,'drawAirplane')+'\ndrawAirplane(ctx,1)',{ctx:context});
  const smoothstep=(a,b,t)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*(3-2*q);};
  const originalPose=vm.runInNewContext(sourceFunction(source,'flightAt')+'\nflightAt',{
    SCENE_DURATION:65,width:900,height:1200,sunR:41.04,sunX:450,sunY:880.8,horizonY:912,pickupTime:19,
    waterContacts:[],SUN_MOTION:{emptyTilt:0,ropeSlack:0},sunDeformationAt:()=>({x:1,y:1}),
    sunlightAt:()=>({darkness:0,reflection:0}),smoothstep
  });
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),api=w.MotionEmission;
    w.MotionFactories['advected-trail'](root,w.MotionKit,effects[1]);
    const actual=[...root.querySelectorAll('[data-part="emitter"] path')].map(n=>({fill:n.getAttribute('fill'),
      path:n.getAttribute('d').match(/[MLQZ]|[-+]?(?:\d*\.\d+|\d+)/g).map(x=>/^[MLQZ]$/.test(x)?x:Number(x))}));
    assert.deepEqual(actual,expected);
    for(let t=2;t<=14.5;t+=.025){
      const original=originalPose(t),pose=api.trailPoseAt(t),view=api.trailViewAt(t);
      for(const key of ['x','y','pitch','unit'])close(pose[key],original[key]);
      for(const layer of expected){
        const points=layer.path.filter(x=>typeof x==='number');
        for(let i=0;i<points.length;i+=2){
          const x=view.x+view.scale*(pose.x+points[i]*pose.unit),y=view.y+view.scale*(pose.y+points[i+1]*pose.unit);
          assert.ok(x>=36&&x<=604&&y>=38&&y<=278,'飞机和曲线控制点须完整放入画面');
        }
      }
    }
    for(let t=0;t<3.6;t+=.01)for(const p of api.puffsAt(t,api.puffOriginAt,api.cameraTravelAt,{end:2.9})){
      assert.ok(p.x-p.radius*1.3>30&&p.y-p.radius*.9>38&&p.y+p.radius*.9<278,'雾团不得被边缘或控制栏截断');
    }
  }finally{env.close();}
});

test('旧历史书签直接进入标准能力，提示词和导出不依赖原工程',async()=>{
  for(const [index,hash]of ['#history-drive-exhaust','#history-sunset-contrail'].entries()){
    const effect=effects[index],env=await environment(true,{hash,lazyHistory:true});
    try{
      const {w}=env,d=w.document;
      assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
      assert.equal(d.querySelector('script[src="history-data.js"]'),null);
      assert.equal(w.MotionMatch.rank(data,effect.name)[0].effect.id,effect.id);
      const prompt=w.MotionExport.prompt(effect,{},data);
      assert.ok(!/本机|验收|原片范围|关键假设|来源与许可|Users\//.test(prompt));
      assert.match(prompt,effect.id==='emission-drift'?/384×0\.12/:/0\.15 动作秒/);
      const html=w.MotionExport.code(effect,{speed:1.25});
      assert.ok(!html.includes('/Users/'));assert.ok(!html.includes('history-data.js'));
      const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});
      const out=dom.window;out.ResizeObserver=class{observe(){}disconnect(){}};out.HTMLCanvasElement.prototype.getContext=()=>null;
      try{
        for(const node of out.document.querySelectorAll('[src],link[href]')){
          const resource=node.getAttribute('src')||node.getAttribute('href');
          assert.ok(!/^(https?:|file:|\/\/)/.test(resource));assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
        }
        for(const script of out.document.querySelectorAll('script'))out.eval(script.src?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
        out.MotionDemo.pause();assert.equal(out.MotionDemo.speed,1.25);
        const host=d.createElement('div'),reference=w.MotionRuntime.create(host,effect);
        try{
          for(const time of [0,150,700,1640,effect.duration_ms-450,effect.duration_ms,0,700]){
            reference.seek(time);out.MotionDemo.seek(time);assert.equal(frameMarkup(out.document.querySelector('.motion-stage')),frameMarkup(host.firstElementChild));
          }
          out.dispatchEvent(new out.Event('pagehide'));assert.equal(out.MotionRuntime.instanceCount,0);
        }finally{reference.destroy();}
      }finally{out.MotionRuntime?.disposeAll();out.anime?.engine.pause();dom.window.close();}
      const other=d.querySelector('[data-effect="fade-rise"]');other.click();assert.equal(w.MotionRuntime.instanceCount,1);
    }finally{env.close();}
  }
});
