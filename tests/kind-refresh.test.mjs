// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment} from './helpers.mjs';
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
function storage(){
  const values=new Map();
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
}
const activeKind=d=>d.querySelector('[data-kind][aria-pressed="true"]').dataset.kind;
function checkList(w,kind){
  const effects=[...w.MotionRegistry.effects,...(w.MotionHistory?.recipes||[])];
  const cards=[...w.document.querySelectorAll('.effect-item')];
  assert.ok(cards.length>0,'恢复的页签应有列表');
  assert.equal(cards.length,effects.filter(e=>e.kind===kind).length);
  for(const card of cards)assert.equal(effects.find(e=>e.id===card.dataset.effect).kind,kind);
}
async function finishHistory(w){
  const script=w.document.querySelector('script[src="history-data.js"]');
  assert.ok(script,'恢复历史页签时应加载历史数据');
  w.eval(await readFile(new URL('../catalog/history-data.js',import.meta.url),'utf8'));
  script.dispatchEvent(new w.Event('load'));
  await settle();
}

test('四个目录页签在重新打开同一页面后恢复，列表与预览保持对应',async()=>{
  const memory=storage();
  for(const kind of ['composition','illustration','recipe','action']){
    const before=await environment(true,{staticPreview:true,sessionStorage:memory});
    try{before.w.document.querySelector(`[data-kind="${kind}"]`).click();assert.equal(activeKind(before.w.document),kind);}
    finally{before.close();}
    const after=await environment(true,{staticPreview:true,sessionStorage:memory});
    try{
      const {w}=after,d=w.document;
      assert.equal(activeKind(d),kind);checkList(w,kind);
      const selected=d.querySelector('.effect-item[aria-current="true"]');
      assert.ok(selected,'恢复后应有当前预览');
      assert.equal(d.getElementById('preview-title').textContent,[...w.MotionRegistry.effects,...w.MotionHistory.recipes].find(e=>e.id===selected.dataset.effect).name);
    }finally{after.close();}
  }
});

test('新动效链接打开对应页签，在该链接中切换后刷新仍保留当前页签',async()=>{
  const memory=storage();
  const base=await environment(true,{staticPreview:true,sessionStorage:memory});
  try{base.w.document.querySelector('[data-kind="composition"]').click();}finally{base.close();}
  const link=await environment(true,{staticPreview:true,sessionStorage:memory,hash:'#steel-ruler-illustration'});
  try{
    const d=link.w.document;
    assert.equal(activeKind(d),'illustration');
    assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,'steel-ruler-illustration');
    d.querySelector('[data-kind="action"]').click();
  }finally{link.close();}
  const refreshed=await environment(true,{staticPreview:true,sessionStorage:memory,hash:'#steel-ruler-illustration'});
  try{assert.equal(activeKind(refreshed.w.document),'action');checkList(refreshed.w,'action');}finally{refreshed.close();}
});

test('恢复历史页签按需加载，加载期间的手动切换与选择不会被覆盖',async()=>{
  const memory=storage();
  const before=await environment(true,{staticPreview:true,sessionStorage:memory});
  try{before.w.document.querySelector('[data-kind="recipe"]').click();}finally{before.close();}
  const after=await environment(true,{staticPreview:true,sessionStorage:memory,lazyHistory:true});
  try{
    assert.equal(activeKind(after.w.document),'recipe');
    await finishHistory(after.w);
    assert.equal(activeKind(after.w.document),'recipe');checkList(after.w,'recipe');
  }finally{after.close();}
  const race=await environment(true,{staticPreview:true,sessionStorage:memory,lazyHistory:true});
  try{
    const d=race.w.document;
    d.querySelector('[data-kind="action"]').click();
    d.querySelector('[data-effect="scale-in"]').click();
    await finishHistory(race.w);
    assert.equal(activeKind(d),'action');checkList(race.w,'action');
    assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,'scale-in');
  }finally{race.close();}
});

test('存储内容无效或浏览器拒绝存储时，默认目录和手动切换仍可用',async()=>{
  for(const memory of [{getItem:()=> 'removed-kind',setItem(){}},{getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}}]){
    const env=await environment(true,{staticPreview:true,sessionStorage:memory});
    try{
      assert.equal(activeKind(env.w.document),'action');checkList(env.w,'action');
      env.w.document.querySelector('[data-kind="composition"]').click();
      assert.equal(activeKind(env.w.document),'composition');checkList(env.w,'composition');
    }finally{env.close();}
  }
});
