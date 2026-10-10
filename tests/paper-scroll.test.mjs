// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {environment,data} from './helpers.mjs';

const source='/Users/wisewong/Documents/Developer/wise-video/Naive-NO.5-Flash/promo-atelier/';
const effect=data.effects.find(e=>e.id==='paper-scroll-illustration');
// 两个库的曲线求解器允许千分之一原图像素的数值误差。
const near=(a,b)=>assert.ok(Math.abs(Number(a)-Number(b))<1e-3,`${a} 应等于原组件 ${b}`);

async function original(){
  const require=createRequire(source+'package.json'),{transformSync}=require('esbuild'),calls=[];
  const ctx=new Proxy({getImageData(){return{data:[]};},createRadialGradient(){return{addColorStop(){}};},createLinearGradient(){return{addColorStop(){}};}},{get(target,key){return target[key]??((...args)=>calls.push([key,...args]));}});
  let refs=0;
  const canvas={getContext:()=>ctx},React={createElement(){},useLayoutEffect(fn){fn();},useRef(){return{current:refs++%2===0?canvas:{}};}};
  const load=async(file,dependencies={},extra='')=>{
    const code=transformSync(await readFile(source+'src/'+file,'utf8')+extra,{loader:file.endsWith('.tsx')?'tsx':'ts',format:'cjs',jsx:'transform'}).code,module={exports:{}};
    vm.runInNewContext('(function(require,module,exports){'+code+'\n})',{document:{createElement:()=>canvas}},{filename:file})(id=>dependencies[id]||require(id),module,module.exports);
    return module.exports;
  };
  const theme=await load('theme.ts');
  const component=await load('components/ContextScroll.tsx',{'react':React,'../theme':theme},'\nexport {buildScrollLayer};');
  return{calls,component};
}

test('纸卷对照原组件的展开、滚动、卷辊厚度和印刷行，定位不改变内容',async()=>{
  const {calls,component}=await original(),env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const node=id=>root.querySelector(`[data-part="${id}"]`);
    for(const f of [0,1,3,7,12,18,24,28,32,40]){
      calls.length=0;component.ContextScroll({f,x:0,y:0});player.seek(150+f*1000/30);
      const paper=calls.find(c=>c[0]==='drawImage'),roll=calls.find(c=>c[0]==='roundRect'),highlight=calls.find(c=>c[0]==='fillRect'&&c[1]===74);
      for(const [attr,index]of [['x',1],['y',2],['width',3],['height',4],['rx',5]])near(node('roll').getAttribute(attr),roll[index]);
      near(node('roll-highlight').getAttribute('y'),highlight[2]);
      near(Number(node('paper').getAttribute('height'))+40,roll[2]+roll[4]/2);
      if(paper){near(node('paper').getAttribute('height'),paper[5]);near(node('clip').getAttribute('height'),paper[5]);near(Number(node('content').getAttribute('transform').match(/translate\(80 ([-\d.e+]+)\)/)[1]),40-paper[3]);}
      else assert.equal(node('paper').getAttribute('visibility'),'hidden');
    }
    calls.length=0;component.buildScrollLayer();
    const expected=calls.filter(c=>c[0]==='fillText'),actual=[...node('content').querySelectorAll('text')];
    assert.equal(actual.length,expected.length);
    actual.forEach((n,i)=>{assert.equal(n.textContent,expected[i][1]);near(n.getAttribute('x'),expected[i][2]);near(n.getAttribute('y'),expected[i][3]);});
    assert.ok(actual.length>250,'应保留整张长页的密排正文、流水号和章节，不以横线代替');
    assert.equal(node('paper').getAttribute('fill'),'#F4F1E8');
    assert.deepEqual([...root.querySelectorAll('linearGradient[id$="-roll"] stop')].map(n=>n.getAttribute('stop-color')),['#f7f5ee','#e6e3da','#c9c6bc','#aaa79d']);
    player.seek(1500);const end=root.innerHTML;player.seek(3000);assert.equal(root.innerHTML,end,'动作完成后应完全静止');
    for(const t of [0,390,740,1050,3000]){player.seek(t);const frame=root.innerHTML;player.seek(0);player.seek(t);assert.equal(root.innerHTML,frame);}
    const second=w.document.createElement('div');root.after(second);const other=w.MotionRuntime.create(second,effect);
    const ids=new Set([...root.querySelectorAll('[id]')].map(n=>n.id));
    assert.ok([...second.querySelectorAll('[id]')].every(n=>!ids.has(n.id)),'两个纸卷的裁剪、渐变与纹理标识不能串用');
    other.destroy();player.destroy();
  }finally{env.close();}
});

test('纸卷仅保留标准目录入口，原作只读，复制代码与目录使用同一绘制器',async()=>{
  const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
  const review=cross.rules['naive-scroll-unroll'];assert.equal(review.status,'excluded');assert.equal(review.migration.effect,effect.id);
  for(const file of review.migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;d.querySelector('[data-kind="illustration"]').click();env.reveal();
    const card=d.querySelector(`[data-effect="${effect.id}"]`);assert.ok(card.querySelector('text'));card.click();
    assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
    assert.ok(!w.MotionHistory.recipes.some(r=>r.history_id==='naive-scroll-unroll'));
    assert.ok(!w.MotionHistory.originals.clips.some(c=>c.id==='naive-scroll-unroll'));
    const html=w.MotionExport.code(effect,{speed:1,ease:'linear'});
    assert.ok(html.includes('catalog/effects/illustrations.js'));assert.ok(html.includes('paper-scroll-illustration'));
    assert.equal(d.querySelectorAll('#preview image,#preview foreignObject,#preview canvas').length,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
