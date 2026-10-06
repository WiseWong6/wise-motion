// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {environment, frameMarkup} from './helpers.mjs';
import {resolveEffect} from '../remotion/clock.mjs';
import contentApi from '../catalog/content.js';
const {validateContent,withContent}=contentApi;
const baseline={...JSON.parse(await readFile(new URL('./fixtures/content-defaults.json',import.meta.url),'utf8')),...JSON.parse(await readFile(new URL('./fixtures/content-phase-two-defaults.json',import.meta.url),'utf8'))};
const defaults=definition=>Object.fromEntries(definition.content_slots.map(slot=>[slot.id,slot.default]));
function fonts(env,{load=async()=>[{}],check=()=>true}={}){
  Object.defineProperty(env.w.document,'fonts',{value:{load,check},configurable:true});
  env.w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText(text){return {width:Array.from(text).length*Number(this.font.match(/([\d.]+)px/)[1])*.6};}});
}
function painter(env,id,content,variant){
  const root=env.w.document.createElement('div');env.w.document.body.append(root);
  const definition=withContent(resolveEffect(id,variant),content);
  env.w.MotionKit.prepareStage(root,definition);
  return {root,definition,draw:env.w.MotionKit.createRenderer(root,definition)};
}
for(const [key,frames] of Object.entries(baseline))test(key+'：默认及显式默认内容保持修改前的逐帧画面数据',async()=>{
  const [id,variant]=key.split('/'),env=await environment();
  try{
    const def=resolveEffect(id,variant);
    for(const content of [undefined,{},defaults(def)]){
      const {root,draw}=painter(env,id,content,variant);
      assert.equal(draw.ready,undefined,'默认内容仍走原同步绘制，不引入测量差异');
      for(const [ms,hash] of Object.entries(frames)){
        draw(Number(ms));assert.equal(createHash('sha256').update(frameMarkup(root)).digest('hex'),hash,`${key} @ ${ms}`);
      }
      draw.destroy?.();root.remove();
    }
  }finally{env.close();}
});

test('内容对象、字数、行数、色调和格式错误在绘制前报错',()=>{
  const rejects=(id,content,variant)=>assert.throws(()=>validateContent(resolveEffect(id,variant),content));
  rejects('count-up',null);rejects('count-up',{value:NaN});rejects('count-up',{value:'1M'});
  rejects('count-up',{decimals:1});rejects('count-up',{format:'custom'});rejects('count-up',{unknown:1});
  rejects('type-reveal',{text:'12345678901234'});rejects('type-reveal',{text:'a\nb'});
  rejects('word-slam',{words:[]});rejects('word-slam',{words:['']});
  rejects('terminal-code',{lines:[[['text','red']]]});rejects('terminal-code',{lines:['x']});
  rejects('terminal-code',{lines:Array(4).fill([['x','ink']])});
  rejects('terminal-code',{lines:Array(9).fill('x'.repeat(21))},'command-log');
  rejects('terminal-code',{lines:['x']},'command-log');rejects('particle-word',{text:'🐰'});
  validateContent(resolveEffect('count-up'),{value:0,from:-1,prefix:'',suffix:'',caption:'',format:'decimal',decimals:2});
});

test('输入复制到每个实例，原目录定义和调用者对象不被改写',()=>{
  const def=resolveEffect('word-slam'),content={words:['涂鸦做网站']};
  const first=withContent(def,content),second=withContent(def,content);
  first.content.words[0]='已修改';assert.equal(second.content.words[0],'涂鸦做网站');
  assert.equal(content.words[0],'涂鸦做网站');assert.equal(def.content,undefined);
});

test('复制输出携带内容配置与共用校验器，非法内容不被复制',async()=>{
  const env=await environment(true);
  try{
    const definition=resolveEffect('type-reveal'),content={text:'涂鸦做网站'};
    const code=env.w.MotionExport.remotionCode(definition,{content});
    assert.match(code,/涂鸦做网站/);assert.match(code,/catalog\/content\.js/);
    assert.throws(()=>env.w.MotionExport.remotionCode(definition,{content:null}),/content/);
    const html=env.w.MotionExport.code(definition,{content});
    assert.match(html,/涂鸦做网站/);assert.match(html,/catalog\/content\.js/);
  }finally{env.close();}
});

test('字体加载前等待，准备后重放目标帧；两个实例中文独立，文本不作为标签执行',async()=>{
  const env=await environment();let release;const gate=new Promise(resolve=>release=resolve);
  try{
    fonts(env,{load:async()=>{await gate;return [{}];}});
    const a=painter(env,'type-reveal',{text:'涂鸦做网站'}),b=painter(env,'type-reveal',{text:'<img>NO.1'});
    a.draw(1200);b.draw(1200);assert.equal(a.root.textContent,'');
    release();await Promise.all([a.draw.ready,b.draw.ready]);
    assert.equal(a.root.querySelector('.typed-text').textContent,'涂鸦做网站');
    assert.equal(b.root.querySelector('.typed-text').textContent,'<img>NO.1');assert.equal(b.root.querySelector('img'),null);
    assert.match(a.root.querySelector('.headline').style.fontFamily,/Source Han/);
    a.draw(0);assert.equal(b.root.querySelector('.typed-text').textContent,'<img>NO.1');
  }finally{release();env.close();}
});

test('字体失败明确报错；销毁后的异步准备不再绘制',async()=>{
  const env=await environment();
  try{
    fonts(env,{load:async()=>[]});const failed=painter(env,'type-reveal',{text:'中文'});
    await assert.rejects(failed.draw.ready,/字体/);
    let release;const gate=new Promise(resolve=>release=resolve);fonts(env,{load:async()=>{await gate;return [{}];}});
    const cancelled=painter(env,'word-slam',{words:['取消']});cancelled.draw(500);cancelled.draw.destroy();release();
    await cancelled.draw.ready;assert.equal(cancelled.root.textContent,'');
  }finally{env.close();}
});

test('只换终端标题时，代码和日志的字体、字宽与动作仍保持原样',async()=>{
  const env=await environment();
  try{
    fonts(env);
    for(const variant of ['default','command-log']){
      const before=painter(env,'terminal-code',undefined,variant);
      const after=painter(env,'terminal-code',{title:'自定义标题'},variant);
      await after.draw.ready;
      for(const ms of [350,700,1700,3000]){
        before.draw(ms);after.draw(ms);
        const selector=variant==='default'?'[data-terminal-code-row]':'[data-part^="row"], [data-part="cursor"]';
        const rows=root=>[...root.querySelectorAll(selector)].map(node=>node.outerHTML);
        assert.deepEqual(rows(after.root),rows(before.root),variant+' @ '+ms);
      }
    }
  }finally{env.close();}
});

test('计数支持单位、前缀、千分位、小数和倒数；紧凑单位不会过早进位',async()=>{
  const env=await environment();
  try{
    fonts(env);
    for(const [content,expected] of [
      [{value:1e6,format:'compact',suffix:' tokens'},'1M tokens'],
      [{value:500000,format:'compact'},'500K'],[{value:999999,format:'compact'},'1M'],
      [{value:1,prefix:'NO.'},'NO.1'],[{from:12000,value:-1234.5,format:'thousands',decimals:2},'-1,234.50'],
      [{value:0,from:12,format:'decimal',decimals:2},'0.00']]){
      const {root,draw}=painter(env,'count-up',content);await draw.ready;draw(1800);
      assert.equal(root.querySelector('.big-number').textContent,expected);
      const end=frameMarkup(root);draw(400);draw(1800);assert.equal(frameMarkup(root),end);
    }
  }finally{env.close();}
});

test('自定义撞字按输入词数停在末词；终端两个变体显示各自内容并支持回退定位',async()=>{
  const env=await environment();
  try{
    fonts(env);
    const word=painter(env,'word-slam',{words:['NO.1','涂鸦做网站']});await word.draw.ready;word.draw(4200);
    assert.equal(word.root.querySelector('[data-part="word"]').textContent,'涂鸦做网站');
    const code=painter(env,'terminal-code',{title:'演示终端',lines:[[['const ','muted'],['目标 = "网站";','teal']],[['输出完成','ink']]]});
    await code.draw.ready;code.draw(3000);assert.match(code.root.textContent,/目标 = "网站";/);assert.match(code.root.textContent,/输出完成/);
    const lines=['$ build',...Array.from({length:8},(_,i)=>`步骤${i+1}完成`)];
    const log=painter(env,'terminal-code',{title:'中文任务',lines},'command-log');await log.draw.ready;log.draw(3000);
    assert.match(log.root.textContent,/步骤8完成/);assert.match(log.root.textContent,/中文任务/);
    const end=frameMarkup(log.root);log.draw(100);log.draw(3000);assert.equal(frameMarkup(log.root),end);
  }finally{env.close();}
});


test('成对记录严格检查字段与数量，图表拒绝越界和非数字值',()=>{
 const reject=(id,content)=>assert.throws(()=>validateContent(resolveEffect(id),content));
 reject('title-content',{cards:[{title:'缺说明'}]});
 reject('stagger-in',{labels:['卡片']});
 const items=Array.from({length:6},()=>({label:'数据',value:50}));
 for(const value of [-1,101,NaN,'50',.5])reject('bar-growth',{items:items.map((item,i)=>i?item:{...item,value})});
 reject('bar-growth',{items:items.map(item=>({...item,extra:1}))});
 validateContent(resolveEffect('bar-growth'),{items});
});

test('第二批文字可独立替换，危险字符按文字呈现，图表数值与柱高一起变化',async()=>{
 const env=await environment();
 try{
  fonts(env);
  const a=painter(env,'title-content',{title:'网站',cards:[{title:'想法',description:'内容'},{title:'生成',description:'完成'},{title:'发布',description:'分享'}]});
  const b=painter(env,'title-content',{title:'另一镜'});
  await Promise.all([a.draw.ready,b.draw.ready]);a.draw(2700);b.draw(2700);
  assert.match(a.root.textContent,/网站/);assert.match(b.root.textContent,/另一镜/);assert.doesNotMatch(b.root.textContent,/网站/);
  const focus=painter(env,'word-focus',{words:['<b>','中文','NO.1']});await focus.draw.ready;focus.draw(1000);assert.equal(focus.root.querySelector('b'),null);assert.match(focus.root.textContent,/<b>/);
  const chart=painter(env,'bar-growth',{items:Array.from({length:6},(_,i)=>({label:'组'+i,value:i===0?0:100}))});await chart.draw.ready;chart.draw(3000);
  assert.equal(chart.root.querySelector('[data-part="b0"]').getAttribute('height'),'0');assert.equal(chart.root.querySelector('[data-part="b1"]').getAttribute('height'),'232');assert.equal(chart.root.querySelector('[data-part="v1"]').textContent,'100%');
  const button=painter(env,'interface-feedback',{states:['初始','处理中','就绪'],result:'完成'});await button.draw.ready;button.draw(0);assert.match(button.root.textContent,/初始/);button.draw(4000);assert.match(button.root.textContent,/就绪/);
  for(const item of [a,b,focus,chart,button]){item.draw(700);const middle=frameMarkup(item.root);item.draw(0);item.draw(700);assert.equal(frameMarkup(item.root),middle);item.draw.destroy?.();}
 }finally{env.close();}
});

test('粒子目标点为实例局部数据，生成顺序固定，默认目标不被换字修改',async()=>{
 const env=await environment();try{
  const f=env.w.MotionFactories['particle-word'],before=JSON.stringify(f.targets),a=f.makeTargets([[10,20],[30,40]]),b=f.makeTargets([[500,100],[520,120]]);
  assert.equal(JSON.stringify(a),JSON.stringify(f.makeTargets([[10,20],[30,40]])));
  const first=f.position(10,2.5,a);assert.notDeepEqual(first,f.position(10,2.5,b));assert.deepEqual(first,f.position(10,2.5,a));assert.equal(JSON.stringify(f.targets),before);
 }finally{env.close();}
});
