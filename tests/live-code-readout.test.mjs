// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
import {history,state} from '../scripts/history.mjs';
import {environment,data,sourceDefinition} from './helpers.mjs';

const effect=data.effects.find(e=>e.id==='live-code-readout');
const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const migration=crosswalk.rules['promo-live-readout'].migration;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('代码窗口纳入数据分类、旧名称可找到新动作，原工程未改且历史入口去重',async()=>{
  const historical=await history(data),{rank}=createRequire(import.meta.url)('../catalog/matching.js');
  assert.equal(effect.category,'data');assert.equal(effect.kind,'action');
  for(const query of ['代码窗口实时读数','伪代码窗实时读数'])assert.equal(rank(data,query)[0].effect.id,effect.id);
  assert.ok(historical.excluded.some(r=>r.id==='promo-live-readout'));
  assert.ok(!historical.recipes.some(r=>r.history_id==='promo-live-readout'));
  assert.equal(migration.effect,effect.id);
  for(const source of migration.files)assert.equal(createHash('sha256').update(await readFile(source.file)).digest('hex'),source.sha256);
});

test('代码内容、逐字时序和高亮与原作一致，读数与进度条采用原作传给形变程序的同帧参数',async()=>{
  const source=await readFile(migration.files[0].file,'utf8');
  const math=source.slice(source.indexOf('const clamp ='),source.indexOf('function mulberry32'));
  const scene=source.slice(source.indexOf('const SDF_CODE ='),source.indexOf('// ===',source.indexOf('function scene4')));
  let frame;
  const ctx=new Proxy({globalAlpha:1,roundRect(){frame.opacity=this.globalAlpha;},fillRect(x,y,width){if(x===1500&&y===418)frame.bars.push(width);}},{get:(target,key)=>key in target?target[key]:()=>{}});
  const gl=new Proxy({uniform1f(key,value){if(key==='morph')frame.morph=value;}},{get:(target,key)=>key in target?target[key]:()=>{}});
  const original=runInNewContext(math+'\n'+scene+'\nscene4',{
    ctx,gl,uni:{uM:'morph'},W:1920,H:1080,S:1,TAU:Math.PI*2,LAT:'',CN:'',MONO:'',WH:()=>'',au:()=>0,
    C:{accent:'var(--accent)',white:'var(--ink)',dim:'var(--faint)'},
    text(value,x,y,font,fill){if(x>=1250)frame.text.push({value,x,y,fill});}
  });
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,sourceDefinition(effect));
    const part=id=>root.querySelector(`[data-part="${id}"]`);
    for(const time of [0,100,250,500,750,1000,1200,1650,2000,2300,2400]){
      frame={opacity:0,text:[],bars:[]};ctx.globalAlpha=1;original(12.6+Math.min(time,2300)/1000);player.seek(time);
      near(Number(part('window').getAttribute('opacity')),frame.opacity);
      near(Number(part('window').dataset.morph),frame.morph);
      near(Number(part('progress').getAttribute('width'))/250,frame.morph);
      assert.equal(part('value').textContent,'morph = '+frame.morph.toFixed(3));
      if(!frame.opacity)continue;
      for(let i=0;i<6;i++){
        const line=frame.text.find(t=>t.y===222+i*34);
        assert.equal(part('line'+i).textContent,line.value);
        assert.equal(part('line'+i).getAttribute('fill'),line.fill);
      }
      near(Number(part('progress').getAttribute('width')),frame.bars.at(-1));
    }
    player.seek(1650);const middle=root.innerHTML,nodes=[...root.querySelectorAll('*')];
    player.seek(2400);const end=root.innerHTML;
    player.seek(0);player.seek(1650);assert.equal(root.innerHTML,middle);
    assert.deepEqual([...root.querySelectorAll('*')],nodes,'倒拖保持原节点');
    player.seek(2400);assert.equal(root.innerHTML,end);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,characterData:true,childList:true});
    player.seek(2400);assert.equal(observer.takeRecords().length,0,'结束后不反复写入画面');observer.disconnect();
  }finally{env.close();}
});
