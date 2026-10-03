// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data,themed,sourceDefinition} from './helpers.mjs';
function render(w,root,id){const e=sourceDefinition(data.effects.find(e=>e.id===id)),draw=w.MotionFactories[id](root,w.MotionKit,e);return p=>draw(p*e.duration_ms,{duration:e.duration_ms,ease:e.default_ease});}
const part=(root,id)=>root.querySelector(`[data-part="${id}"]`);
const number=(root,id,key)=>Number(part(root,id).getAttribute(key));
test('词云保留原十三词、云形、独立漂移与实际收拢时钟，反复定位后稳定停住',async()=>{
  const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/motion-tutorial/ai-motion-tutorial-portrait-remake/';
  const sandbox=vm.createContext({window:{}});
  for(const file of ['runtime/theme.js','scenes/language.js'])vm.runInContext(await readFile(sourceRoot+file,'utf8'),sandbox);
  const source=sandbox.window.FilmScenes.find(s=>s.id==='language-cloud');
  const pacing=createRequire(import.meta.url)(sourceRoot+'runtime/pacing.js');
  const start=pacing.visualBeats.find(b=>b.sourceStart===source.start).programStart;
  const originalAt=ms=>{
    const words=[],stack=[];let outline,cloud,commands=[];
    const ctx={globalAlpha:1,
      save(){stack.push({globalAlpha:this.globalAlpha});},restore(){Object.assign(this,stack.pop());},
      translate(x,y){cloud={x,y};},scale(x,y){Object.assign(cloud,{scaleX:x,scaleY:y});},
      beginPath(){commands=[];},moveTo(x,y){commands.push('M'+x+' '+y);},
      bezierCurveTo(...values){commands.push('C'+values.join(' '));},closePath(){commands.push('Z');},
      lineTo(){},stroke(){},fill(){outline={path:commands.join(' '),fill:this.fillStyle,opacity:this.globalAlpha};}
    };
    const api={text(label,x,y,options){words.push({label,x,y,...options,opacity:ctx.globalAlpha});},image(){throw Error('只提取词云，不能进入回应图');}};
    source.render(ctx,pacing.toVisualSource(start+ms/1000)-source.start,api);
    return {words,cloud,outline};
  };
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;env.reveal();
    const effect=sourceDefinition(data.effects.find(e=>e.id==='word-cloud-lift')),card=d.querySelector('[data-effect="word-cloud-lift"]');
    assert.equal(effect.category,'writing');assert.equal(effect.loop,false);
    assert.equal(w.MotionMatch.rank(data,'词云')[0].effect.id,effect.id);
    const thumbnail=[...card.querySelectorAll('.thumb [data-cloud-word]')];
    assert.equal(thumbnail.length,13);assert.ok(thumbnail.every(n=>n.getAttribute('opacity')==='1'));
    card.click();assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect);
    const words=[...root.querySelectorAll('[data-cloud-word]')],cloud=part(root,'cloud');
    assert.equal(root.querySelector('svg > g').getAttribute('font-weight'),'300');
    assert.equal(root.querySelector('svg > g').getAttribute('transform'),'translate(158 -25) scale(.3)');
    draw(0);assert.ok(words.every(n=>n.getAttribute('opacity')==='0'));assert.equal(cloud.getAttribute('opacity'),'0');
    const close=(actual,expected,message)=>assert.ok(Math.abs(Number(actual)-expected)<1e-9,message);
    for(const ms of [350,900,2300,4300,4800,5000]){
      draw(ms);const expected=originalAt(ms);
      assert.equal(cloud.getAttribute('d'),expected.outline.path);
      assert.equal(cloud.getAttribute('fill'),themed(expected.outline.fill));assert.equal(cloud.getAttribute('stroke'),themed(sandbox.window.FilmTheme.border));
      const pose=cloud.getAttribute('transform').match(/[-\d.]+/g).map(Number);
      close(pose[0],expected.cloud.x);close(pose[1],expected.cloud.y);close(pose[2],expected.cloud.scaleX);
      close(cloud.getAttribute('opacity'),expected.outline.opacity);
      for(const word of words){
        const original=expected.words.find(item=>item.label===word.textContent);
        if(!original){assert.equal(word.getAttribute('opacity'),'0');continue;}
        const t=ms<=3600?ms/3600*3.7:3.7+(ms-3600)/1800*2.8;
        const scale=w.MotionKit.mix(1,.72,w.MotionKit.span(t,4.55,5.7,'inOutCubic'));
        const size=original.size*.78,inset=word.textContent==='有点僵硬'?56*scale:0;
        close(word.getAttribute('x'),original.x-inset,'除右侧长词内移外，保留手工编排和独立漂移');
        close(word.getAttribute('y'),original.y+(original.size-size)*.625,'字号收紧时顶部位置应同步调整');
        close(word.getAttribute('font-size'),size,'等比例收小以完整容纳文字，保留大小层次与连续缩小');
        close(word.getAttribute('opacity'),original.opacity,'按原时差淡入');
        assert.equal(word.getAttribute('fill'),themed(original.color));
      }
    }
    draw(2300);const large=number(root,'word5','font-size'),position=number(root,'word5','y'),snapshot=root.innerHTML;
    draw(5000);assert.ok(number(root,'word5','font-size')<large*.6);assert.ok(number(root,'word5','y')<position-200);
    const stopped=root.innerHTML;draw(effect.duration_ms);assert.equal(root.innerHTML,stopped);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});
    draw(effect.duration_ms);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    draw(0);draw(2300);assert.equal(root.innerHTML,snapshot);assert.ok(words.every(n=>root.contains(n)));
    assert.equal(root.querySelector('image,video,canvas,filter'),null);assert.equal(root.querySelectorAll('path').length,1);
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='tutorial-word-cloud'));
    assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id==='tutorial-word-cloud'));
    const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
    for(const file of cross.rules['tutorial-word-cloud'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256,'原工程保持只读');
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
test('词云全文在淡入、漂移和收拢全过程位于云形内，并保留词间空隙',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const effect=sourceDefinition(data.effects.find(e=>e.id==='word-cloud-lift'));
    const draw=w.MotionFactories[effect.id](root,w.MotionKit,effect),cloud=part(root,'cloud');
    // 按实际云形采样；用整字宽和一行字高包住文字，避免只检查文字中心点。
    const values=cloud.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
    const outline=[[values[0],values[1]]];let previous=outline[0];
    for(let at=2;at<values.length;at+=6){
      const [ax,ay,bx,by,x,y]=values.slice(at,at+6),[px,py]=previous;
      for(let i=1;i<=100;i++){
        const t=i/100,u=1-t;
        outline.push([u*u*u*px+3*u*u*t*ax+3*u*t*t*bx+t*t*t*x,u*u*u*py+3*u*u*t*ay+3*u*t*t*by+t*t*t*y]);
      }
      previous=[x,y];
    }
    const inside=(x,y)=>{
      let hit=false;
      for(let i=0,j=outline.length-1;i<outline.length;j=i++){
        const [ax,ay]=outline[i],[bx,by]=outline[j];
        if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;
      }
      return hit;
    };
    const words=[...root.querySelectorAll('[data-cloud-word]')];
    for(let ms=0;ms<=effect.duration_ms;ms+=25){
      draw(ms);
      const [cx,cy,scale]=cloud.getAttribute('transform').match(/[-\d.]+/g).map(Number),boxes=[];
      for(const word of words){
        if(Number(word.getAttribute('opacity'))===0)continue;
        const size=Number(word.getAttribute('font-size')),x=Number(word.getAttribute('x')),y=Number(word.getAttribute('y'));
        const half=Array.from(word.textContent).length*size/2,box={label:word.textContent,left:x-half,right:x+half,top:y,bottom:y+size};
        boxes.push(box);
        // 轮廓内额外保留六个设计单位；检查四条边，含云形凹入处。
        const left=(box.left-cx)/scale-6,right=(box.right-cx)/scale+6,top=(box.top-cy)/scale-6,bottom=(box.bottom-cy)/scale+6;
        for(let i=0;i<=12;i++){
          const x=left+(right-left)*i/12,y=top+(bottom-top)*i/12;
          assert.ok(inside(x,top)&&inside(x,bottom)&&inside(left,y)&&inside(right,y),ms+' 毫秒：'+box.label+' 全文应留在云形内');
        }
      }
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
        const a=boxes[i],b=boxes[j],gap=6*scale;
        assert.ok(a.right+gap<=b.left||b.right+gap<=a.left||a.bottom+gap<=b.top||b.bottom+gap<=a.top,ms+' 毫秒：'+a.label+' 与 '+b.label+' 应留出阅读空隙');
      }
    }
  }finally{env.close();}
});
test('论据图标保持原词点、细线与基线生长，定位和缩略图完整，旧图标入口清理',async()=>{
  const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/resume-tutorial/wise-resume-writing/';
  const original=new JSDOM(await readFile(sourceRoot+'editions/compact/preview.html','utf8'));
  const timing=JSON.parse(await readFile(sourceRoot+'editions/compact/timing.json','utf8'));
  const cue=timing.cues.find(c=>c.id==='s026'),icons=[...original.window.document.querySelectorAll('[data-icon-cue="s026"]')];
  const clock=word=>cue.start+cue.charAt[cue.text.indexOf(word)],anchor=clock('经历');
  const env=await environment(true);
  try{
    const {w}=env,d=w.document,effect=sourceDefinition(data.effects.find(e=>e.id==='evidence-icons'));env.reveal();
    const thumb=d.querySelector('[data-effect="evidence-icons"] .thumb');
    assert.equal(thumb.querySelectorAll('[data-icon-sequence]').length,4);
    assert.ok([...thumb.querySelectorAll('[data-icon-fade]')].every(n=>n.getAttribute('opacity')==='1'));
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect);
    const groups=[...root.querySelectorAll('[data-icon-sequence]')];
    assert.deepEqual(groups.map(n=>n.dataset.iconWord),['经历','方法','能力','数据']);
    assert.equal(root.querySelector('svg > g').getAttribute('transform'),'scale(.4)');
    assert.equal(root.querySelector('svg > g').getAttribute('font-weight'),'300');
    const positions=groups.map(group=>{
      const [dx,dy]=group.getAttribute('transform').match(/[-\d.]+/g).map(Number);
      const label=group.querySelector('[data-icon-fade]');
      return {x:(Number(label.getAttribute('x'))+dx)*.4,y:(Number(label.getAttribute('y'))+dy)*.4};
    });
    assert.equal(new Set(positions.map(p=>p.y)).size,1,'四个图标的标签应位于同一行');
    const spacing=positions[1].x-positions[0].x;
    assert.ok(spacing>100,'四个图标之间保留足够间距');
    assert.ok(positions.every((p,i)=>p.x>40&&p.x<600&&(i===0||Math.abs(p.x-positions[i-1].x-spacing)<1e-9)),'依次从左到右等距排布，保留两侧余量');
    for(const source of icons){
      const group=groups.find(g=>g.dataset.iconSequence===source.dataset.iconSequence);
      const start=120+Math.round((clock(source.dataset.iconWord)-anchor)*1000);
      assert.equal(Number(group.dataset.iconStart),start);

      const parts=[...group.children],originalParts=[...source.firstElementChild.children];
      assert.equal(parts.length,originalParts.length);
      for(let i=0;i<parts.length;i++){
        const actual=parts[i],expected=originalParts[i];
        assert.equal(actual.localName,expected.localName);
        for(const name of ['d','x','y','width','height','cx','cy','r','rx','stroke','stroke-width','fill'])assert.equal(actual.getAttribute(name),(['fill','stroke'].includes(name)?themed(expected.getAttribute(name)):expected.getAttribute(name)),group.dataset.iconWord+' 图形与主题色位');
        if(actual.localName==='text')assert.equal(Number(actual.getAttribute('font-size'))*.4,16,'图下注释统一为正文大小');
        const at=start+Number(expected.dataset.iconDelay||0)*1000,length=Number(expected.dataset.iconDuration)*1000;
        draw(at);assert.equal(actual.getAttribute('opacity'),'0');
        draw(at+length/4);
        if(expected.hasAttribute('data-icon-stroke'))assert.ok(Math.abs(Number(actual.getAttribute('stroke-dashoffset'))-.875)<1e-10,'逐笔描出需保留原二次缓入缓出');
        else if(expected.hasAttribute('data-icon-bar')){
          const [x,y,sx,sy]=actual.getAttribute('transform').match(/[-\d.]+/g).map(Number),bottom=Number(expected.getAttribute('y'))+Number(expected.getAttribute('height'));
          assert.equal(x,0);assert.equal(sx,1);assert.ok(Math.abs(sy-(1-.75**3))<1e-10);
          assert.ok(Math.abs(y+bottom*sy-bottom)<1e-10,'长高过程不能移动基线');
        }else{
          assert.ok(Math.abs(Number(actual.getAttribute('opacity'))-(1-.75**3))<1e-10);
          assert.ok(Math.abs(Number(actual.getAttribute('transform').match(/translate\(0 ([^)]*)/)[1])-5*.75**3)<1e-10);
        }
      }
    }
    draw(effect.preview_ms);const final=root.innerHTML;
    assert.ok([...root.querySelectorAll('[data-icon-stroke]')].every(n=>n.getAttribute('stroke-dashoffset')==='0'));
    assert.ok([...root.querySelectorAll('[data-icon-fade]')].every(n=>n.getAttribute('opacity')==='1'));
    draw(0);draw(effect.preview_ms);assert.equal(root.innerHTML,final,'回拖与重播必须恢复同一图解');
    assert.ok(groups.every(n=>root.contains(n)));draw(effect.duration_ms);assert.equal(root.innerHTML,final);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});
    draw(effect.duration_ms);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelector('image,video,canvas,filter'),null);
    for(const id of ['icon-stroke','resume-icons']){
      assert.ok(w.MotionHistory.excluded.some(e=>e.id===id));assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id===id));
    }
    assert.equal(data.effects.filter(e=>e.id==='stroke-draw').length,1,'保留已有的平滑心电图描线');
    const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
    for(const file of cross.rules['resume-icons'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256,'原工程应保持只读');
  }finally{env.w.MotionThumbs.disposeAll();env.close();original.window.close();}
});
test('成组展开保留原六卡的缩放和标签时差，缩略图完整并清理重复历史入口',async()=>{
  const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/wise-ppt-video/video/compositions/g03.html','utf8');
  const image=source.match(/fromTo\(c\.img, \{ opacity: 0, scale: ([\d.]+) \}, \{ opacity: 1, scale: 1, duration: ([\d.]+), ease: "power3.out"/);
  const label=source.match(/fromTo\(c\.label, \{ opacity: 0, y: ([\d.]+) \}, \{ opacity: 1, y: 0, duration: ([\d.]+), ease: "power2.out" \}, at \+ ([\d.]+)/);
  const interval=Number(source.match(/popIn\(c, SECOND03 \+ i \* ([\d.]+)\)/)[1])*1000;
  assert.ok(image&&label,'原卡片进入关系改变，需要重新核对');
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;env.reveal();
    const effect=sourceDefinition(data.effects.find(e=>e.id==='group-expand')),thumb=d.querySelector('[data-effect="group-expand"] .thumb');
    const visible=[...thumb.querySelectorAll('[data-card]')];
    assert.equal(visible.length,6);assert.ok(visible.every(n=>n.getAttribute('opacity')==='1'));
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect);
    const cards=[...root.querySelectorAll('[data-card]')],labels=[...root.querySelectorAll('[data-label]')];
    const pose=n=>n.getAttribute('transform').match(/[-\d.]+/g).map(Number);
    assert.equal(typeof w.anime.eases.outQuart,'function','不能回退成三次减速');
    draw(0);const centers=cards.map(n=>pose(n).slice(0,2));
    assert.equal(new Set(centers.map(p=>p[0])).size,3);assert.equal(new Set(centers.map(p=>p[1])).size,2);
    for(let i=0;i<6;i++){
      const start=120+i*interval,half=Number(image[2])*1000/2;
      draw(start);assert.equal(cards[i].getAttribute('opacity'),'0');assert.equal(pose(cards[i])[2],Number(image[1]));
      draw(start+Number(label[3])*1000);assert.equal(labels[i].getAttribute('opacity'),'0');
      draw(start+half);
      const appear=1-(1-.5)**4,progress=(half-Number(label[3])*1000)/(Number(label[2])*1000);
      assert.ok(Math.abs(pose(cards[i])[2]-(Number(image[1])+(1-Number(image[1]))*appear))<1e-10);
      assert.ok(Math.abs(Number(labels[i].getAttribute('opacity'))-(1-(1-progress)**3))<1e-10);
      assert.deepEqual(cards.map(n=>pose(n).slice(0,2)),centers,'不能把缩放换成卡片上移');
      draw(start+Number(image[2])*1000);assert.equal(pose(cards[i])[2],1);
    }
    draw(effect.duration_ms);const final=root.innerHTML;draw(300);draw(effect.duration_ms);assert.equal(root.innerHTML,final);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});
    draw(effect.duration_ms);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelectorAll('image,video,canvas,filter').length,0);
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='card-stagger'));
    assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id==='card-stagger'));
    assert.ok(data.effects.some(e=>e.id==='stagger-in'));assert.ok(data.effects.some(e=>e.id==='scale-in'));
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
test('纸层倾斜按原时刻分出三层透视后归位，内容身份保持且擦除不重复入库',async()=>{
  const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/wise-ppt-subtract/wise-ppt-subtract-paper-engine-colors-v6/assets/paper-engine.js','utf8');
  const clock=source.match(/openAt = start \+ ([\d.]+), closeAt = start \+ ([\d.]+), settleAt = start \+ ([\d.]+)/);
  const open=Number(clock[1])*1000,close=Number(clock[2])*1000,settled=Number(clock[3])*1000;
  const length=Number(source.match(/duration: ([\d.]+), ease: 'power2.inOut', immediateRender: false/)[1])*1000;
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;env.reveal();
    const effect=sourceDefinition(data.effects.find(e=>e.id==='paper-tilt')),thumb=d.querySelector('[data-effect="paper-tilt"] .thumb');
    assert.equal(thumb.querySelectorAll('[data-sheet]').length,3);
    assert.ok([...thumb.querySelectorAll('[data-sheet]')].every(n=>n.getAttribute('opacity')==='1'));
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect);
    const sheets=[...root.querySelectorAll('[data-sheet]')],marks=[...root.querySelectorAll('[data-mark]')];
    draw(0);const initial=root.innerHTML,flat=sheets[2].getAttribute('d');
    assert.ok(sheets.slice(0,2).every(n=>n.getAttribute('opacity')==='0'));
    assert.ok(sheets.every(n=>n.getAttribute('d')===flat));
    draw(open+length);const expanded=root.innerHTML;
    assert.ok(sheets.every(n=>n.getAttribute('opacity')==='1'));
    assert.equal(new Set(sheets.map(n=>n.getAttribute('d'))).size,3,'三层需要不同深度和错位');
    const corners=sheets[2].getAttribute('d').match(/[-\d.]+/g).map(Number);
    const [x0,y0,x1,y1,x2,y2,x3,y3]=corners;
    assert.ok(Math.hypot(x1-x0,y1-y0)<225,'前层在展开时缩小');
    assert.ok(Math.abs(Math.hypot(x2-x3,y2-y3)-Math.hypot(x1-x0,y1-y0))>.5,'远近边需要透视差别');
    assert.ok(marks.every(n=>root.contains(n)),'前层内容节点不因倾斜被替换');
    draw(close);assert.equal(root.innerHTML,expanded,'完整展开后保持原短暂停留');
    draw((close+settled)/2);assert.ok(sheets.slice(0,2).every(n=>Number(n.getAttribute('opacity'))>0&&Number(n.getAttribute('opacity'))<1));
    draw(settled);assert.equal(root.innerHTML,initial,'收拢转正后必须恢复同一纸面和内容');
    draw(effect.preview_ms);assert.equal(root.innerHTML,expanded);draw(effect.duration_ms);assert.equal(root.innerHTML,initial);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});
    draw(effect.duration_ms);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelectorAll('image,video,canvas,filter,clipPath').length,0);
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='paper-wipe'));
    assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id==='paper-wipe'));
    assert.equal(data.effects.filter(e=>e.id==='wipe').length,1);assert.equal(data.effects.filter(e=>e.id==='mask-reveal').length,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
test('跨页承接采用统一主题的三列配色，先上色，再让同一组九格同步下移放大',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;env.reveal();
    const card=d.querySelector('[data-effect="scene-carry"]');
    assert.ok(card.querySelector('.thumb .pattern-svg'),'正式目录缩略图接入');
    card.click();
    const root=d.querySelector('#preview .motion-stage'),definition=sourceDefinition(data.effects.find(e=>e.id==='scene-carry'));
    assert.equal(definition.category,'layout');
    assert.equal(root.querySelectorAll('text,image,foreignObject,filter').length,0,'不携带表情、文稿、图片和原背景');
    const source=await readFile('/Users/wisewong/Documents/Developer/wise-video/wise-ppt-video/video/compositions/p01.html','utf8');
    assert.deepEqual(JSON.parse(source.match(/const colColor = (\[[^;]+\]);/)[1]),['#8B5CF6','#22C55E','#111827']);
    const draw=w.MotionFactories['scene-carry'](root,w.MotionKit,definition);
    const columns=[0,1,2].map(i=>part(root,'column'+i)),grid=part(root,'grid');
    assert.deepEqual(columns.map(c=>c.getAttribute('fill')),['var(--blue)','var(--teal)','var(--accent)']);
    assert.ok(columns.every(c=>c.children.length===3));
    const cells=columns.flatMap(c=>[...c.children]);
    const geometry=cells.map(c=>['x','y','width','height'].map(k=>c.getAttribute(k)));
    const pose=()=>grid.getAttribute('transform').match(/[-\d.]+/g).map(Number);
    const seek=t=>draw(t,{ease:definition.default_ease,duration:definition.duration_ms});
    seek(0);const initial=grid.getAttribute('transform'),start=pose();
    assert.ok(columns.every(c=>+c.getAttribute('opacity')===0));
    seek(200);assert.ok(+columns[0].getAttribute('opacity')>0);assert.equal(+columns[1].getAttribute('opacity'),0);
    seek(450);assert.equal(+columns[0].getAttribute('opacity'),1);assert.ok(+columns[1].getAttribute('opacity')>0);assert.equal(+columns[2].getAttribute('opacity'),0);
    seek(800);assert.ok(columns.every(c=>+c.getAttribute('opacity')===1));assert.equal(grid.getAttribute('transform'),initial,'上色阶段留在上方');
    seek(1750);const end=pose();
    assert.equal(start[0],320);assert.equal(end[0],320);assert.ok(end[1]>start[1]);assert.ok(end[2]>start[2]*2);
    for(const t of [1000,1250,1500]){
      seek(t);const current=pose();assert.equal(current[0],320);
      const move=(current[1]-start[1])/(end[1]-start[1]),scale=(current[2]-start[2])/(end[2]-start[2]);
      assert.ok(move>0&&move<1);assert.ok(Math.abs(move-scale)<1e-10,'下移和放大同时执行');
    }
    seek(2000);const settled=root.innerHTML;seek(2400);assert.equal(root.innerHTML,settled);
    seek(0);seek(2000);assert.equal(root.innerHTML,settled,'重播与反向定位保持同一画面');
    assert.ok(cells.every(c=>c.isConnected));
    assert.deepEqual(cells.map(c=>['x','y','width','height'].map(k=>c.getAttribute(k))),geometry,'整组变换保持格子身份和比例');
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='scene-carry'));
    assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
test('三卡依次建立并上移后，三条线才同时向下汇入主卡',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),e=sourceDefinition(data.effects.find(e=>e.id==='line-converge'));
    const draw=w.MotionFactories[e.id](root,w.MotionKit,e),parts=[0,1,2];
    draw(100);assert.ok(number(root,'frame0','stroke-dashoffset')<1);
    assert.equal(number(root,'frame1','opacity'),0);assert.equal(number(root,'frame2','opacity'),0);
    draw(700);assert.equal(number(root,'frame1','opacity'),1);assert.equal(number(root,'frame2','opacity'),0);
    draw(1500);assert.ok(parts.every(i=>number(root,'frame'+i,'stroke-dashoffset')===0));
    assert.equal(part(root,'cards').getAttribute('transform'),'translate(0 84) rotate(0) scale(1)');
    const boxes=parts.map(i=>['x','y','width','height'].map(key=>number(root,'frame'+i,key)));
    draw(1750);const raised=Number(part(root,'cards').getAttribute('transform').match(/translate\(0 ([-.\d]+)/)[1]);
    assert.ok(raised>0&&raised<84);assert.ok(parts.every(i=>number(root,'connector'+i,'opacity')===0));
    draw(2050);assert.equal(part(root,'cards').getAttribute('transform'),'translate(0 0) rotate(0) scale(1)');
    assert.ok(parts.every(i=>number(root,'connector'+i,'opacity')===0));
    draw(2200);const grown=number(root,'connector0','stroke-dashoffset');assert.ok(grown>0&&grown<1);
    for(const i of parts)assert.equal(number(root,'connector'+i,'stroke-dashoffset'),grown);
    assert.equal(number(root,'end-dot','opacity'),0);
    draw(2800);assert.ok(parts.every(i=>number(root,'connector'+i,'stroke-dashoffset')===0));
    assert.equal(number(root,'end-dot','opacity'),1);assert.equal(number(root,'receiver-label','opacity'),1);
    assert.deepEqual(parts.map(i=>['x','y','width','height'].map(key=>number(root,'frame'+i,key))),boxes,'上移改变了卡片尺寸或相对布局');
    const x=number(root,'receiver-frame','x')+number(root,'receiver-frame','width')/2,y=number(root,'receiver-frame','y');
    for(const i of parts){
      assert.match(part(root,'connector'+i).getAttribute('d'),new RegExp('(?:,|L)'+x+' '+y+'$'));
      assert.equal(number(root,'start-dot'+i,'cx'),number(root,'frame'+i,'x')+number(root,'frame'+i,'width')/2);
      assert.equal(number(root,'start-dot'+i,'cy'),number(root,'frame'+i,'y')+number(root,'frame'+i,'height'));
    }
    const dots=parts.map(i=>part(root,'start-dot'+i)),end=part(root,'end-dot'),positions=[...dots,end].map(dot=>[dot.getAttribute('cx'),dot.getAttribute('cy')]);
    draw(2100);draw(2400);assert.deepEqual([...dots,end].map(dot=>[dot.getAttribute('cx'),dot.getAttribute('cy')]),positions,'连接端点不应变成移动光点');
    assert.equal(root.querySelector('image,video'),null);assert.equal(root.querySelector('svg').getAttribute('viewBox'),'0 0 640 360');
  }finally{env.close();}
});
test('滚动、刹停和轮播按不同的速度与停留关系执行',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    let draw=render(w,root,'scroll-brake');
    const x=p=>{draw(p);return Number(part(root,'belt').getAttribute('transform').match(/translate\(([-.\d]+)/)[1]);};
    const fast=Math.abs(x(.31)-x(.3)),slow=Math.abs(x(.81)-x(.8));assert.ok(slow<fast*.2);
    draw(.9);const stopped=root.innerHTML;draw(1);assert.equal(root.innerHTML,stopped);
    assert.equal(number(root,'r2','x')+65+x(1),320,'终点卡片未与标记对齐');
    draw=render(w,root,'dwell-carousel');draw(.08);const first=root.innerHTML;draw(.18);assert.equal(root.innerHTML,first);
    draw(.3);assert.notEqual(root.innerHTML,first);draw(.45);const second=root.innerHTML;draw(.6);assert.equal(root.innerHTML,second);
  }finally{env.close();}
});
test('文稿公共前缀与清墨间隔得到保留',async()=>{
  const original=await readFile('/Users/wisewong/Documents/Developer/wise-video/Naive-NO.5-Flash/promo-atelier/src/scenes/Input.tsx','utf8');
  const value=name=>original.match(new RegExp("const "+name+" = '([^']*)';"))[1];
  const draft=value('DRAFT'),prefix=value('KEEP'),final=value('FINAL_A')+value('FINAL_B')+value('FINAL_C');
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    let draw=render(w,root,'text-edit');draw(0);assert.equal(part(root,'word').textContent,'');assert.equal(part(root,'input').style.opacity,'0');
    draw(.29);assert.equal(part(root,'word').textContent,draft,'输入框草稿应使用原片文案');
    const input=part(root,'input'),word=part(root,'word'),caret=part(root,'caret'),position=input.style.transform;
    draw(.4);assert.equal(part(root,'strike').style.opacity,'1');
    for(let p=.44;p<=.82;p+=.02){draw(p);assert.ok(word.textContent.startsWith(prefix),'退格或重写清空了公共前缀');assert.equal(input.style.transform,position);assert.equal(part(root,'strike').style.opacity,'0','叉号不能跟随缩短文字滑向新内容');}
    draw(.61);assert.equal(word.textContent,prefix);draw(1);assert.equal(word.textContent,final,'重新输入应改为原片批量请求');assert.equal(part(root,'strike').style.opacity,'0');
    assert.equal(part(root,'draft').nextElementSibling,caret,'重写光标必须紧随同一草稿容器');
    // 输入框结构保持原尺寸的 1/3，文字按画板正文大小统一。
    const near=(actual,expected)=>assert.ok(Math.abs(parseFloat(actual)-expected)<1e-8);
    near(input.style.width,1520/3);near(input.style.height,296/3);near(input.style.left,200/3);near(input.style.top,392/3);
    near(root.querySelector('.edit-line').style.fontSize,16);assert.equal(root.querySelector('.edit-line').style.fontWeight,'300');
    assert.equal(root.querySelector('.edit-agent').textContent,'Agent');assert.equal(part(root,'model').textContent,'WISE MOTION');
    assert.ok(part(root,'plus'));assert.ok(part(root,'bot'));assert.ok(part(root,'chevron'));
    near(part(root,'send').style.width,76/3);near(part(root,'send').style.height,76/3);near(part(root,'arrow').style.width,32/3);
    near(part(root,'send-ring').getAttribute('cx'),(1520-98)/3);near(part(root,'send-ring').getAttribute('cy'),(296-66)/3);
    near(part(root,'send-ring').getAttribute('r'),52/3);assert.ok(part(root,'send-ring').hasAttribute('stroke-dasharray'));
    const strike=part(root,'strike'),size=16;
    const measure=text=>[...text].reduce((width,ch)=>width+size*(ch.charCodeAt(0)>0x2e7f?1:ch===' '?.3:.56),0);
    const quantityLeft=measure(draft.slice(0,draft.indexOf('一张'))),box=strike.getAttribute('viewBox').split(' ').map(Number);
    assert.equal(strike.style.top,'50%');assert.equal(strike.style.transform,'translateY(-50%)');
    assert.ok(parseFloat(strike.style.left)<=quantityLeft&&parseFloat(strike.style.left)+box[2]>=quantityLeft+size*2,'两笔叉号应覆盖单张数量');
    assert.ok(box[2]<size*3&&box[3]<size*2,'叉号不能伸出文字行盖住输入框');
    assert.ok(Number(strike.firstElementChild.getAttribute('stroke-width'))<1.5,'沿用细线风格');
    const first=part(root,'strike-a'),second=part(root,'strike-b');
    assert.ok(first.getAttribute('d').includes('Q')&&second.getAttribute('d').includes('Q'),'叉号用两笔轻弯曲线');
    draw(.31);assert.equal(first.getAttribute('opacity'),'1');assert.equal(second.getAttribute('opacity'),'0');
    draw(.35);assert.equal(first.getAttribute('stroke-dashoffset'),'0');assert.ok(number(root,'strike-b','stroke-dashoffset')>0&&number(root,'strike-b','stroke-dashoffset')<1);
    draw(1);
    assert.equal(part(root,'outline').getAttribute('stroke-dashoffset'),'0');assert.equal(part(root,'toolbar').style.opacity,'1');
    assert.ok(part(root,'ruler').getAttribute('d').startsWith('M20 '));
    draw(.61);const paused=root.innerHTML;draw(0);draw(.61);assert.equal(root.innerHTML,paused,'反复定位改变了输入框画面');
    draw=render(w,root,'stagger-crossfade');draw(.5);assert.equal(number(root,'old','opacity'),0);assert.equal(number(root,'new','opacity'),0);

  }finally{env.close();}
});
test('事件在指针到达对应位置时才触发，遮挡带闭合时覆盖完整',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');let draw=render(w,root,'event-clock');
    for(const [i,p] of [[0,.22],[1,.48],[2,.73]]){
      draw(p-1e-5);assert.ok(number(root,'c'+i,'opacity')<1);draw(p);assert.equal(number(root,'c'+i,'opacity'),1);
      assert.equal(number(root,'now','x1'),number(root,'c'+i,'cx'));
    }
    draw=render(w,root,'shutter-transition');draw(.5);
    for(let i=0;i<8;i++){assert.equal(number(root,'shade'+i,'rx'),0);assert.equal(part(root,'shade'+i).getAttribute('transform'),'translate(0 0)');}
  }finally{env.close();}
});
test('物理关系保持挂点、面积以及轮子随行程转动',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    let draw=render(w,root,'pivot-swing');const pin=part(root,'pin').outerHTML;draw(.25);draw(.7);assert.equal(part(root,'pin').outerHTML,pin);
    draw=render(w,root,'squash-bounce');for(const p of [.1,.2,.33,.6,1]){draw(p);assert.ok(Math.abs(number(root,'ball','rx')*number(root,'ball','ry')-4096)<1e-8);}
    draw=render(w,root,'rolling-distance');
    const measure=p=>{draw(p);return [Number(part(root,'car').getAttribute('transform').match(/translate\(([-.\d]+)/)[1]),Number(part(root,'wheel0').getAttribute('transform').match(/rotate\(([-.\d]+)/)[1])];};
    const [x0,a0]=measure(.2),[x1,a1]=measure(.7),r=number(root,'hub0','r');assert.ok(Math.abs((x1-x0)-(a1-a0)*Math.PI/180*r)<1e-7);
  }finally{env.close();}
});
test('固定点身份不因换形重建',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const draw=render(w,root,'point-morph'),nodes=[...root.querySelectorAll('circle')];draw(.1);draw(.7);assert.ok(nodes.every(node=>node.isConnected));assert.equal(root.querySelectorAll('circle').length,nodes.length);
  }finally{env.close();}
});
