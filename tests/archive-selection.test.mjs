// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {history,state} from '../scripts/history.mjs';
import {environment,data,motionTime,frameMarkup} from './helpers.mjs';

const effect=id=>data.effects.find(e=>e.id===id);
const node=(root,id)=>root.querySelector(`[data-part="${id}"]`);
const nums=n=>n.getAttribute('transform').match(/-?(?:\d*\.)?\d+(?:e[+-]?\d+)?/gi).map(Number);
const close=(a,b,label)=>assert.ok(Math.abs(Number(a)-Number(b))<1e-6,`${label}: ${a} / ${b}`);

test('三项剔除与四项迁移可追溯，原素材保持只读，旧名称指向独立参考',async()=>{
  const historical=await history(data),crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
  for(const id of ['recovered-card-land','tutorial-cursor','recovered-converge-links','recovered-stamp','reel-motion-compare','tutorial-scale','naive-ruler-wipe']){
    assert.ok(historical.excluded.some(e=>e.id===id));assert.ok(!historical.recipes.some(e=>e.history_id===id));
  }
  for(const id of ['recovered-stamp','reel-motion-compare','tutorial-scale','naive-ruler-wipe']){
    const migration=crosswalk.rules[id].migration;assert.ok(effect(migration.effect));
    for(const file of migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  }
  assert.equal(effect('stamp-land').category,'entrance');assert.equal(effect('motion-compare').category,'data');
  assert.equal(effect('steel-ruler-illustration').category,'illustration-object');
  assert.equal(data.effects.filter(e=>e.id==='load-balance').length,1);
  const {rank}=createRequire(import.meta.url)('../catalog/matching.js');
  for(const [name,id]of [['印章放大落印','stamp-land'],['同程匀速与缓动对照','motion-compare'],['负载变化引起倾斜','load-balance'],['钢尺','steel-ruler-illustration']])assert.equal(rank(data,name)[0].effect.id,id);
});

test('落印缩放、倾角与墨色对照原场景，同一进度落定后保持',async()=>{
  const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/kimi-k3-promo/';
  const original=vm.createContext({window:{}});vm.runInContext(await readFile(sourceRoot+'core/anim.js','utf8'),original);
  original.ANIM=original.window.ANIM;
  const html=await readFile(sourceRoot+'scenes/s1_desk.html','utf8');
  const calls={},ctx={save(){},restore(){},translate(){},scale(x){calls.scale=x;}};
  Object.assign(original,{ctx,CARD:{x:0,y:0,w:0,h:0},T:{serifCN:'serif'},PAPER:{drawStamp(c,x,y,text,opts){calls.alpha=opts.alpha;calls.angle=opts.rot;}}});
  vm.runInContext('const {seg,easeOutCubic,lerp}=ANIM;function stamp(t){'+html.slice(html.indexOf('const st = seg(t, 3.15'),html.indexOf('// ---- 铁粉'))+'}',original);
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root'),e=effect('stamp-land'),p=env.w.MotionRuntime.create(root,e);
    for(const ms of [1,40,100,180,269,270,700]){
      original.stamp(3.15+ms/1000);p.seek(motionTime(e,ms));const mark=node(root,'stamp'),values=nums(mark);
      close(values[2],calls.scale,'原缩小比例');close(values[3],calls.angle*180/Math.PI,'原倾角');close(mark.getAttribute('opacity'),calls.alpha,'墨色显现');
    }
    assert.equal(node(root,'stamp').querySelectorAll('rect').length,2);
    p.seek(e.timing.end_ms);const final=root.innerHTML;p.seek(e.duration_ms);assert.equal(root.innerHTML,final);
    p.seek(0);close(node(root,'stamp').getAttribute('opacity'),0,'开头无印记');p.destroy();
  }finally{env.close();}
});

test('双轨与曲线直接对照原绘制器，保留比例、颜色、手柄联动与完整案例时间',async()=>{
  const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/claude-showreel-2026/reel.js','utf8');
  const snapshot=JSON.parse(await readFile(state+'/source-snapshot.json','utf8'));
  const historical=snapshot.rules.find(e=>e.id==='reel-motion-compare').cases[0];
  const rectangles=[],paths=[],circles=[],texts=[];let current=[];
  const ctx={fillStyle:'',globalAlpha:1,fillRect(x,y,width,height){rectangles.push({x,y,width,height,fill:this.fillStyle});},
    setLineDash(){},strokeRect(){},beginPath(){current=[];},ellipse(){},
    moveTo(x,y){current.push(x,y);},lineTo(x,y){current.push(x,y);},
    arc(x,y,r){circles.push({x,y,r,fill:this.fillStyle,opacity:this.globalAlpha});},
    stroke(){paths.push({points:[...current],stroke:this.strokeStyle,opacity:this.globalAlpha});},fill(){}};
  const original=vm.createContext({ctx,TAU:Math.PI*2,F:{mono:'monospace'},txt(text,x,y,options){texts.push({text,x,y,...options});}});
  vm.runInContext(source.slice(source.indexOf('const clamp ='),source.indexOf('const hash ='))+
    source.slice(source.indexOf('function bez1('),source.indexOf('/* ---------- type'))+
    source.slice(source.indexOf('function easeHandles('),source.indexOf('function drawPanel('))+
    source.slice(source.indexOf('function drawComp('),source.indexOf('function drawTimeline(')),original);
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root'),e=effect('motion-compare'),p=env.w.MotionRuntime.create(root,e);
    assert.equal(e.timing.source_end_ms-e.timing.source_start_ms,(historical.end-historical.start)*1000,'不能把原案例截短');
    for(const id of ['tracks','graph'])assert.match(node(root,id).getAttribute('transform'),/translate\([^)]+\) scale\(\.4\)/,'两部分各自保持等比缩放');
    for(const ms of [0,120,600,950,1000,1350,1700,2000,2250,2800,3000,3750,4000,4250]){
      rectangles.length=0;original.drawComp({x:120,y:230,w:980,h:470},historical.start-22+ms/1000);
      const rails=rectangles.filter(r=>r.fill==='#20232a');
      const squares=rectangles.filter(r=>['#4aa3ff','#ffc93c'].includes(r.fill));
      p.seek(motionTime(e,ms));
      for(const [i,id]of ['linear','eased'].entries()){
        for(const attribute of ['x','y','width','height']){
          assert.ok(Math.abs(Number(node(root,id).getAttribute(attribute))-squares[i][attribute])<.001,id+' 原方块 '+attribute);
          close(node(root,'rail'+i).getAttribute(attribute),rails[i][attribute],'原轨道 '+attribute);
        }
        assert.equal(node(root,id).getAttribute('fill'),squares[i].fill,'保留蓝色和黄色的对应关系');
      }
      paths.length=circles.length=texts.length=0;
      original.drawGraph({x:1130,y:230,w:670,h:470},historical.start-22+ms/1000);
      const pathValues=id=>node(root,id).getAttribute('d').match(/-?(?:\d*\.)?\d+(?:e[+-]?\d+)?/gi).map(Number);
      for(const [id,color]of [['curve','#ffc93c'],['handle-lines','#8a8f99']]){
        const expected=paths.find(p=>p.stroke===color).points,actual=pathValues(id);
        assert.equal(actual.length,expected.length,'原路径采样点数量');
        expected.forEach((value,i)=>close(actual[i],value,id+' 原路径坐标'));
      }
      close(node(root,'handles').getAttribute('opacity'),paths.find(p=>p.stroke==='#8a8f99').opacity,'原手柄显现时刻');
      for(const [i,id]of ['handle0','handle1','point'].entries()){
        const expected=circles[i];
        if(!expected){assert.equal(node(root,id).getAttribute('opacity'),'0');continue;}
        for(const [attribute,key]of [['cx','x'],['cy','y'],['r','r']])assert.ok(Math.abs(Number(node(root,id).getAttribute(attribute))-expected[key])<.001,id+' 原圆点 '+attribute);
      }
      if(ms>0){
        const expected=paths.find(p=>p.stroke==='#4a4e59').points;
        assert.equal(pathValues('guides').length,expected.length);
        pathValues('guides').forEach((value,i)=>assert.ok(Math.abs(value-expected[i])<.001,'原移动点辅助线'));
        close((Number(node(root,'linear').getAttribute('x'))+13-290)/700,(Number(node(root,'point').getAttribute('cx'))-1190)/550,'匀速方块与曲线横坐标联动');
        close((Number(node(root,'eased').getAttribute('x'))+13-290)/700,(640-Number(node(root,'point').getAttribute('cy')))/310,'缓动方块与曲线纵坐标联动');
      }
      assert.equal(node(root,'coordinates').textContent,texts[0].text,'原曲线控制点读数');
      close(node(root,'coordinates').getAttribute('opacity'),texts[0].alpha,'原曲线读数显现时刻');
      const frame=root.innerHTML;p.seek(0);p.seek(motionTime(e,ms));assert.equal(root.innerHTML,frame);
    }
    p.seek(motionTime(e,2600));assert.notEqual(node(root,'linear').getAttribute('x'),node(root,'eased').getAttribute('x'));
    p.seek(e.timing.end_ms);const final=root.innerHTML;p.seek(e.duration_ms);assert.equal(root.innerHTML,final);p.destroy();
  }finally{env.close();}
});

test('SFT 天平直接对照原绘制器和成片时钟，微调块、余摆、边框及粒子保持联动',async()=>{
  const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/motion-tutorial/ai-motion-tutorial-portrait-remake/';
  const source=await readFile(sourceRoot+'scenes/language.js','utf8');
  const original=vm.createContext({window:{}});vm.runInContext(await readFile(sourceRoot+'runtime/theme.js','utf8'),original);
  const pacing=createRequire(import.meta.url)(sourceRoot+'runtime/pacing.js');
  const snapshot=JSON.parse(await readFile(state+'/source-snapshot.json','utf8'));
  const historical=snapshot.rules.find(r=>r.id==='tutorial-scale').cases.find(c=>c.id==='tutorial-scale-instruction');
  const paths=[],circles=[],rectangles=[],outlines=[],labels=[],stack=[];let points=[],circle=null;
  const ctx={globalAlpha:1,tx:0,ty:0,angle:0,
    save(){stack.push({globalAlpha:this.globalAlpha,tx:this.tx,ty:this.ty,angle:this.angle});},restore(){Object.assign(this,stack.pop());},
    translate(x,y){this.tx+=x;this.ty+=y;},rotate(a){this.angle+=a;},
    beginPath(){points=[];circle=null;},moveTo(x,y){points.push([x,y]);},lineTo(x,y){points.push([x,y]);},
    arc(x,y,r){circle={x,y,r};},
    stroke(){paths.push({points:[...points],width:this.lineWidth,tx:this.tx,ty:this.ty,angle:this.angle,opacity:this.globalAlpha});},
    fill(){if(circle)circles.push({...circle,fill:this.fillStyle,opacity:this.globalAlpha});},
    fillRect(x,y,width,height){rectangles.push({x,y,width,height,fill:this.fillStyle,opacity:this.globalAlpha});},
    strokeRect(x,y,width,height){outlines.push({x,y,width,height,stroke:this.strokeStyle,lineWidth:this.lineWidth,opacity:this.globalAlpha});}
  };
  let program=historical.start;
  const api={programElapsed:start=>Math.max(0,program-pacing.toProgram(start)),text(text,x,y,o){labels.push({text,x,y,opacity:ctx.globalAlpha,...o});}};
  Object.assign(original,{ctx,api});
  const at=source.indexOf('const lever=enter(t,9.5'),body=source.indexOf('if(lever>0){',at);
  vm.runInContext(source.slice(source.indexOf('const T=window.FilmTheme'),source.indexOf('function arrow('))+
    'function drawInstruction(t){'+source.slice(at,source.indexOf("api.title('Transformer'",at))+
    source.slice(body,source.indexOf('\n    }});',body))+'}',original);
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root'),e=effect('load-balance'),p=env.w.MotionRuntime.create(root,e);
    close(e.timing.source_end_ms-e.timing.source_start_ms,(historical.end-historical.start)*1000,'原案例完整时长');
    assert.equal(root.querySelectorAll('[data-part="flower"],[data-part="blocks"],[data-part^="pan"]').length,0,'不能再使用片尾天平');
    assert.match(root.textContent,/指令遵循.*SFT.*微调/s);assert.equal(node(root,'weight').getAttribute('fill'),'#0AE448');
    const rgbaAlpha=value=>Number(value.slice(value.lastIndexOf(',')+1,-1));
    for(const ms of [0,300,900,1500,2166.666667,2200,2600,2900,3100,3800,4400,5000,5570]){
      program=historical.start+ms/1000;paths.length=circles.length=rectangles.length=outlines.length=labels.length=0;
      original.drawInstruction(pacing.toVisualSource(program)-116);p.seek(motionTime(e,ms));
      const lever=Number(node(root,'instruction').getAttribute('opacity')),fine=Number(node(root,'fine').getAttribute('opacity'));
      if(!paths.length){close(lever,0,'原场景未入场');}
      else{
        close(lever,paths[0].opacity,'原入场透明度');const beam=nums(node(root,'beam'));
        close(beam[0],paths[0].tx,'原杠杆横轴');close(beam[1],paths[0].ty,'原杠杆纵轴');close(beam[2],paths[0].angle*180/Math.PI,'原回正与余摆');
        close(node(root,'beam').querySelector('path').getAttribute('stroke-width'),paths[0].width,'原横梁线宽');
        const pivot=paths[1].points,foot=paths[2].points;
        assert.equal(node(root,'stand').getAttribute('d'),pivot.map((v,i)=>(i?'L':'M')+v.join(' ')).join('')+'M'+foot[0].join(' ')+'H'+foot[1][0],'原三角支点与底线');
      }
      if(rectangles.length){
        const expected=rectangles[0];
        for(const key of ['x','y','width','height'])close(node(root,'weight').getAttribute(key),expected[key],'原微调块 '+key);
        close(lever*fine,expected.opacity,'原微调块显现');
        for(const [id,text]of [['sft','SFT'],['tuning','微调']]){
          const label=labels.find(l=>l.text===text);close(node(root,id).getAttribute('x'),label.x,'原标签横坐标');close(node(root,id).getAttribute('y'),label.y,'原标签纵坐标');
        }
        const outline=outlines[0];
        for(const key of ['x','y','width','height'])close(node(root,'pulse').getAttribute(key),outline[key],'原边框 '+key);
        close(node(root,'pulse').getAttribute('stroke-width'),outline.lineWidth,'原边框脉冲线宽');close(node(root,'pulse').getAttribute('stroke-opacity'),rgbaAlpha(outline.stroke),'原边框脉冲墨色');
        const particles=circles.slice(2);assert.equal(particles.length,4);
        particles.forEach((expected,i)=>{
          const actual=node(root,'particle'+i);for(const [attribute,key]of [['cx','x'],['cy','y'],['r','r']])close(actual.getAttribute(attribute),expected[key],'原输入粒子 '+attribute);
          close(lever*fine*Number(actual.getAttribute('fill-opacity')),expected.opacity*rgbaAlpha(expected.fill),'原粒子透明度');
        });
      }else close(fine,0,'原微调块未显现');
      const frame=root.innerHTML;p.seek(0);p.seek(motionTime(e,ms));assert.equal(root.innerHTML,frame);
    }
    p.seek(e.timing.end_ms);const final=root.innerHTML;p.seek(e.duration_ms);assert.equal(root.innerHTML,final);p.destroy();
  }finally{env.close();}
});

test('钢尺保留完整刻度和金属配色，沿原曲线扫过，双实例标识独立',async()=>{
  const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/Naive-NO.5-Flash/promo-atelier/src/atelier/Ruler.tsx','utf8');
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root'),other=env.w.document.createElement('div'),e=effect('steel-ruler-illustration');root.after(other);
    const p=env.w.MotionRuntime.create(root,e),q=env.w.MotionRuntime.create(other,e);
    const ticks=[...root.querySelectorAll('[data-steel-tick]')];assert.equal(ticks.length,136);assert.equal(root.querySelectorAll('[data-steel-tick] text').length,14);
    for(const [i,n]of ticks.entries())assert.equal(n.querySelector('path').getAttribute('d'),`M${30+i*8} 0v${i%10===0?34:i%5===0?22:12}`);
    for(const stop of root.querySelectorAll('linearGradient stop'))assert.ok(source.includes(stop.getAttribute('stop-color')));
    assert.ok(root.textContent.includes('STEEL · 0.5 MM · STAINLESS'));
    const frames=[];for(const ms of [0,250,433.333,600,900,1200,250]){
      p.seek(ms);const q=env.w.anime.cubicBezier(.65,0,.35,1)(Math.max(0,Math.min(1,(ms-150)/(17000/30))));
      const y=+root.querySelector('[data-part="ruler"]').getAttribute('transform').match(/translate\(62.4 ([^)]+)/)[1];
      assert.ok(Math.abs(y-(364.6-426.24*q))<1e-8);
      frames.push(frameMarkup(root));
    }assert.equal(frames[1],frames[6]);assert.ok(new Set(frames).size>3);
    const ids=[...root.querySelectorAll('[id]')].map(n=>n.id);assert.ok(![...other.querySelectorAll('[id]')].some(n=>ids.includes(n.id)));
    assert.equal(root.querySelectorAll('video,image,canvas').length,0);p.destroy();q.destroy();
  }finally{env.close();}
});
