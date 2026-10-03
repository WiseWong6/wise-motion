// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {environment,data} from './helpers.mjs';
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
test('三个目录页签在重新打开同一页面后恢复，列表与预览保持对应',async()=>{
  const memory=storage();
  for(const kind of ['composition','illustration','action']){
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

test('旧历史页签记忆自动回到动作，不加载历史数据',async()=>{
  const env=await environment(true,{staticPreview:true,lazyHistory:true,sessionStorage:{getItem:()=> 'recipe',setItem(){}}});
  try{
    const d=env.w.document;
    assert.equal(activeKind(d),'action');checkList(env.w,'action');
    assert.equal(d.querySelector('[data-kind="recipe"]'),null);
    assert.equal(d.querySelector('script[src="history-data.js"]'),null);
  }finally{env.close();}
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


test('三个页签数量在首屏、切换与刷新后始终一致',async()=>{
  const counts=Object.fromEntries(['action','composition','illustration'].map(kind=>[kind,data.effects.filter(e=>e.kind===kind).length]));
  const check=d=>{
    for(const [kind,count] of Object.entries(counts))assert.equal(d.querySelector(`[data-kind="${kind}"] .pill-count`).textContent,String(count),kind+' 数量错误');
  };
  const initial=new JSDOM(await readFile(new URL('../catalog/index.html',import.meta.url),'utf8'));
  try{check(initial.window.document);}finally{initial.window.close();}
  const memory=storage();
  const first=await environment(true,{staticPreview:true,lazyHistory:true,sessionStorage:memory});
  try{
    const {w}=first,d=w.document;check(d);assert.equal(w.MotionHistory,undefined);
    for(const kind of ['composition','illustration','action']){d.querySelector(`[data-kind="${kind}"]`).click();check(d);}
    checkList(w,'action');assert.equal(d.querySelector('[data-kind="recipe"]'),null);
  }finally{first.close();}
  const refreshed=await environment(true,{staticPreview:true,lazyHistory:true,sessionStorage:memory});
  try{
    check(refreshed.w.document);assert.equal(refreshed.w.MotionHistory,undefined);
    checkList(refreshed.w,'action');
  }finally{refreshed.close();}
});
