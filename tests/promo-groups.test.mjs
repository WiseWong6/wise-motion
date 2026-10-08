// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {history,state} from '../scripts/history.mjs';
import {environment,data,frameMarkup} from './helpers.mjs';

const historical=await history(data);
const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const snapshot=JSON.parse(await readFile(state+'/source-snapshot.json','utf8'));
const evidence=JSON.parse(await readFile(state+'/source-evidence.json','utf8'));
const {rank}=createRequire(import.meta.url)('../catalog/matching.js');
const migrations={
  'promo-impact-chain':'particle-word',
  'promo-light-bar-cut':'particle-word',
  'promo-post-chain':'particle-word',
  'promo-particle-morph':'particle-word',
  'promo-crt-collapse':'crt-collapse'
};
const sourceIds=Object.keys(migrations);
const effect=id=>data.effects.find(e=>e.id===id);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const sourceFile='/Users/wisewong/Documents/Developer/wise-video/claude/video/main.js';
const originalHash='95ea0f551d0fc406e8cd836f6428a076a760fd58690eead25a38a0e81686b0d2';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const original=await readFile(sourceFile,'utf8');
const sourceMath=original.slice(original.indexOf('const clamp ='),original.indexOf('const fi ='));
const sourceEnvelopes=original.slice(original.indexOf('const IMPACTS ='),original.indexOf('// ---------- drawing helpers'));
const sourceParticles=original.slice(original.indexOf('const NP ='),original.indexOf('let TA, TB, TC;'));
const finale=original.slice(original.indexOf('function scene8(t)'),original.indexOf('// HUD + post'));
const callback=finale.slice(finale.indexOf('    const r = p.sp'),finale.indexOf('  }, [C.white'));
// 原作函数直接执行；只替换目标字形与画板大小，避免另写相同公式充当预期。
const sourceApi=runInNewContext(`${sourceMath}\n${sourceEnvelopes}\n${sourceParticles}\n({
  particles:PART,
  position(i,dt,TC){const t=26+dt,p=PART[i];${callback}},
  flash:flashEnv,impact:impactEnv,noise:noise1
})`,{TAU:Math.PI*2,CX:960,CY:540});

// 前一次只改了分组，仍播放六段重复裁剪；这次应真正迁成两个正式动作。
test('五条旧规则和六段重复裁剪移出历史目录，只保留升级聚字与独立关机动作',()=>{
  const originals=snapshot.previews.filter(p=>sourceIds.includes(p.ruleId));
  assert.equal(originals.length,6);
  const obsoleteEntries=new Set(originals.map(p=>p.id));
  assert.ok(!historical.recipes.some(r=>sourceIds.includes(r.history_id)));
  assert.ok(!historical.recipes.some(r=>r.entries.some(e=>obsoleteEntries.has(e.id))));
  assert.ok(!historical.merged.some(r=>sourceIds.includes(r.id)||sourceIds.includes(r.target_id)));
  for(const [id,target] of Object.entries(migrations)){
    const rule=crosswalk.rules[id];
    assert.equal(rule.status,'excluded',id);
    assert.ok(!Object.hasOwn(rule,'merged_into'),id+' 仍残留旧历史合并关系');
    assert.equal(rule.migration.effect,target,id);
    assert.ok(historical.excluded.some(r=>r.id===id));
    assert.equal(data.redirects['history-'+id],target);
    assert.ok(!Object.hasOwn(historical.redirects,'history-'+id),'历史跳转不应覆盖正式动作跳转');
  }
  for(const id of ['particle-word','crt-collapse']){
    assert.equal(data.effects.filter(e=>e.id===id).length,1);
    assert.equal(effect(id).kind,'action');
    assert.equal(effect(id).loop,false);
  }
  assert.equal(effect('particle-word').name,'粒子聚散成字');
  assert.equal(effect('particle-word').source.path,'catalog/effects/promo-particles.js');
  assert.equal(data.redirects['history-particle-gather'],'particle-word','粒子汇聚旧入口应归入同一个正式动作');
  assert.ok(!data.effects.some(e=>e.id==='particle-gather'||e.id==='history-particle-gather'),'不能额外创建重复粒子汇聚项');
  assert.ok([effect('crt-collapse').name,...effect('crt-collapse').aliases,...effect('crt-collapse').previous_names].includes('关机收缩'),'目录调整名称后仍应保留原名称供检索');
  assert.equal(effect('crt-collapse').source.path,'catalog/effects/crt-collapse.js');
});

test('旧名称搜索直接找到两个正式动作，原工程及迁移证据哈希保持不变',async()=>{
  const searches=[
    ['字符汇聚成字','particle-word'],
    ['粒子汇聚','particle-word'],
    ['粒子爆散聚字与吸入','particle-word'],
    ['节拍触发白闪震屏','particle-word'],
    ['撞点白闪冲击波震屏','particle-word'],
    ['光带扩张切换','particle-word'],
    ['光带横扫硬切','particle-word'],
    ['画面辉光与胶片噪点','particle-word'],
    ['降采样辉光与噪点链','particle-word'],
    ['画面收缩关机转场','crt-collapse']
  ];
  for(const [query,id] of searches)assert.equal(rank(data,query)[0]?.effect.id,id,'旧名称没有命中正式动作：'+query);
  const hash=createHash('sha256').update(await readFile(sourceFile)).digest('hex');
  assert.equal(hash,originalHash,'原工程被改动');
  assert.equal(evidence.find(e=>e.file===sourceFile).sha256,originalHash,'原来源证据被改写');
  for(const id of sourceIds){
    const file=crosswalk.rules[id].migration.files.find(f=>f.file===sourceFile);
    assert.ok(file,id+' 缺少原工程证据');assert.equal(file.sha256,hash);
  }
});

test('两个正式动作可反向定位、重复定位和多预览，各自释放后不残留播放器',async()=>{
  const env=await environment();
  try{
    const {w}=env,d=w.document;
    for(const id of ['particle-word','crt-collapse']){
      const definition=effect(id),a=d.createElement('div'),b=d.createElement('div');
      d.body.append(a,b);
      const first=w.MotionRuntime.create(a,definition),second=w.MotionRuntime.create(b,definition);
      first.seek(definition.preview_ms);second.seek(definition.preview_ms);
      const middle=frameMarkup(a);assert.equal(middle,frameMarkup(b),id+' 多预览画面应一致');
      if(id==='particle-word'){
        const paths=[...a.querySelectorAll('[data-points]')];
        assert.equal(paths.length,3,'画布不可用时每个颜色只保留一组图形');
        assert.equal(paths.reduce((sum,n)=>sum+(n.getAttribute('d').match(/M/g)||[]).length,0),7000,'后备预览仍应使用原同批粒子');
      }
      first.seek(0);assert.notEqual(frameMarkup(a),middle,id+' 起始和中段不能只有同一张静态图');
      first.seek(definition.duration_ms);assert.notEqual(frameMarkup(a),middle,id+' 收尾应与中段不同');
      const end=frameMarkup(a);first.seek(id==='particle-word'?3850:900);
      assert.equal(frameMarkup(a),end,id+' 完成后应停在结束画面');
      first.seek(definition.preview_ms);assert.equal(frameMarkup(a),middle,id+' 反向定位不能依赖前一帧');
      first.setSpeed(2);first.seek(definition.preview_ms);assert.equal(frameMarkup(a),middle,id+' 倍速不能改变同一时刻的画面');
      const nodes=[...a.querySelectorAll('*')];
      first.seek(definition.preview_ms);assert.deepEqual([...a.querySelectorAll('*')],nodes,id+' 重复定位不应重新建节点');
      const ids=new Set([...a.querySelectorAll('[id]')].map(n=>n.id));
      assert.ok([...b.querySelectorAll('[id]')].every(n=>!ids.has(n.id)),id+' 多预览的图形标识不能相互覆盖');
      first.destroy();assert.equal(a.childElementCount,0);assert.equal(w.MotionRuntime.instanceCount,1);
      second.seek(0);assert.ok(b.childElementCount>0,'销毁一个预览不能销毁另一个');
      second.destroy();assert.equal(b.childElementCount,0);assert.equal(w.MotionRuntime.instanceCount,0);
      a.remove();b.remove();
    }
    assert.equal(env.listeners.size,0,'销毁后不能保留尺寸监听');
  }finally{env.close();}
});

test('粒子方向、速度、逐点延迟与原作同批数据一致，爆散聚字和吸入直接对照原公式',async()=>{
  const env=await environment();
  try{
    const factory=env.w.MotionFactories['particle-word'];
    assert.equal(factory.trigger_ms,150);assert.equal(factory.sourceTrigger,26);
    assert.deepEqual(JSON.parse(JSON.stringify(factory.particles)),JSON.parse(JSON.stringify(sourceApi.particles)));
    assert.equal(factory.targets.length,7000);
    const targets=Array.from(factory.targets).flatMap(point=>[point[0]*3,point[1]*3]);
    assert.ok(new Set(Array.from(factory.targets,p=>p.join(','))).size>1000,'目标必须保留字形采样点');
    for(const dt of [0,.15,.5,1,1.8,2.9,3.1,3.22,3.35,3.5]){
      for(const i of [0,1,103,2057,3999,6999]){
        const actual=factory.position(i,dt),expected=sourceApi.position(i,dt,targets);
        near(actual[0],expected[0]/3);near(actual[1],expected[1]/3);
      }
    }
    for(let i=0;i<7000;i++){
      const point=factory.position(i,3.5);near(point[0],320);near(point[1],180);
    }
    for(const dt of [0,.05,.25,.7,1]){
      const actual=factory.impact(dt),t=26+dt;
      near(actual.flash,sourceApi.flash(t));
      near(actual.shakeX,sourceApi.noise(t*37)*sourceApi.impact(t)*26/3);
      near(actual.shakeY,sourceApi.noise(t*41+9)*sourceApi.impact(t)*26/3);
      if(dt>0)assert.notEqual(actual.flash/.9,Math.exp(-4.5*dt),'白闪与震屏必须按各自速度减弱');
    }
    assert.equal(factory.impact(-.01).flash,0,'触发之前没有白闪');
    assert.equal(factory.impact(-.01).shakeX,0,'触发之前没有震屏');
  }finally{env.close();}
});

test('粒子画布分支绘制完整同批点阵、两层辉光与四张固定噪点，换主题后刷新并释放画布',async()=>{
  const env=await environment();
  try{
    const {w}=env,contexts=[],canvases=[];
    w.HTMLCanvasElement.prototype.getContext=function(){
      if(this.testContext)return this.testContext;
      const frames=[],noise=[],ctx={
        frames,noise,globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'',stack:[],
        setTransform(){},translate(){},scale(){},clearRect(){},beginPath(){},arc(){},stroke(){},
        save(){this.stack.push([this.globalAlpha,this.globalCompositeOperation,this.fillStyle]);},
        restore(){[this.globalAlpha,this.globalCompositeOperation,this.fillStyle]=this.stack.pop();},
        fill(){frames.push(['fill',this.globalAlpha]);},
        fillRect(x,y,width,height){frames.push(['rect',x,y,width,height,this.globalAlpha,this.globalCompositeOperation,typeof this.fillStyle==='string'?this.fillStyle:'material']);},
        drawImage(canvas){frames.push(['image',canvases.indexOf(canvas),this.globalAlpha,this.globalCompositeOperation]);},
        createRadialGradient(){return {addColorStop(){}};},
        createImageData(width,height){return {data:new Uint8ClampedArray(width*height*4)};},
        putImageData(image){noise.push(createHash('sha256').update(image.data).digest('hex'));},
        createPattern(canvas){return {canvas};}
      };
      this.testContext=ctx;contexts.push(ctx);canvases.push(this);return ctx;
    };
    const root=w.document.getElementById('root'),render=w.MotionFactories['particle-word'](root);
    assert.equal(canvases.length,7,'主画布、两层辉光和四张噪点必须独立');
    assert.equal(root.querySelectorAll('[data-fallback]').length,0,'有画布能力时不保留第二套后备画面');
    assert.equal(contexts.filter(c=>c.noise.length).length,4);assert.equal(new Set(contexts.flatMap(c=>c.noise)).size,4,'四张固定噪点各有自己的内容');
    const ctx=contexts[0],draw=ms=>{ctx.frames.length=0;render(ms);return createHash('sha256').update(JSON.stringify(ctx.frames)).digest('hex');};
    const middle=draw(2450),rects=ctx.frames.filter(row=>row[0]==='rect'&&row[3]<=1&&row[4]<=1);
    assert.equal(rects.length,7000,'每帧按原参数绘制所有粒子');
    assert.deepEqual(ctx.frames.filter(row=>row[0]==='image').map(row=>row[2]),[.32,.24],'两层辉光分别叠加');
    assert.ok(rects.every(row=>row[6]==='lighter'),'深色主题沿用原发光叠加');
    draw(0);assert.equal(draw(2450),middle,'画布分支反向定位仍复现原画面');
    root.style.setProperty('--ink','#222222');draw(2450);
    assert.ok(ctx.frames.filter(row=>row[0]==='rect'&&row[3]<=1&&row[4]<=1).every(row=>row[6]==='source-over'),'同一帧切浅色主题应重绘为普通叠加');
    draw(3850);ctx.frames.length=0;render(4000);assert.equal(ctx.frames.length,0,'最后尾停不再重复绘制');
    render.destroy();assert.ok(canvases.every(canvas=>canvas.width===1&&canvas.height===1),'释放绘制器后自建画布均缩小');
    ctx.frames.length=0;render(2450);assert.equal(ctx.frames.length,0,'销毁后不再绘制');
  }finally{env.close();}
});

for(const [oldId,targetId] of Object.entries(migrations)){
  test('旧入口 '+oldId+' 直接打开正式动作，复制代码携带正式绘制依赖与组件',async()=>{
    const env=await environment(true,{staticPreview:true,hash:'#history-'+oldId,lazyHistory:true});
    try{
      const {w}=env,d=w.document,definition=effect(targetId);
      await tick();
      assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,targetId);
      assert.equal(d.getElementById('preview-title').textContent,definition.name);
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionHistoryRuntime.instanceCount,0);
      assert.equal(d.querySelectorAll('script[src="history-data.js"]').length,0,'已迁移的旧入口无需加载历史裁剪数据');
      assert.ok(d.querySelector(`script[src="${definition.source.path.replace(/^catalog\//,'')}"]`),'正式页面应引用新动作源码');
      assert.equal(d.querySelectorAll('#preview video').length,0,'正式预览不能仍播放原视频');
      const code=d.getElementById('code').textContent;
      assert.ok(code.split('\n').includes(definition.source.path),'复制说明必须完整列出实际绘制源码');
      assert.ok(code.includes("import {WiseMotionEffect,getEffectMetadata} from 'wise-motion';"));
      assert.ok(code.includes('export const Effect = () => <WiseMotionEffect {...settings} />;'));
      const settingsMatch=code.match(/const settings = (\{[\s\S]*?\});/);assert.ok(settingsMatch);
      assert.equal(JSON.parse(settingsMatch[1]).effectId,targetId,'复制组件须使用当前正式动作');
      assert.ok(!code.includes('MotionHistoryRuntime'));
      assert.ok(!code.includes('extracted-media'));assert.ok(!code.includes(sourceFile));
      const duration=definition.duration_ms,time=definition.preview_ms;
      assert.equal(d.getElementById('time-current').textContent,(time/1000).toFixed(1));
      assert.equal(d.getElementById('time-total').textContent,((duration-time)/1000).toFixed(1));
      d.getElementById('next-effect').click();await tick();
      assert.equal(w.MotionRuntime.instanceCount,1,'切换后只能保留当前正式播放器');
    }finally{env.close();}
  });
}
