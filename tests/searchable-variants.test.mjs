// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {environment} from './helpers.mjs';

const source=await readFile(new URL('../catalog/dropdown.js',import.meta.url),'utf8');
const bounds=node=>{node.getBoundingClientRect=()=>({top:100,bottom:136,left:20,right:300,width:280,height:36});};
const key=(w,node,name,extra={})=>node.dispatchEvent(new w.KeyboardEvent('keydown',{key:name,bubbles:true,cancelable:true,...extra}));
function fixture(modal=false){
  const html='<label>示例样式<select id="example"><option value="default">默认示例</option><option value="scroll">编辑器滚动</option><option value="dock">编辑器停靠</option><option value="disabled" disabled>编辑器不可选</option></select></label>';
  const dom=new JSDOM('<!doctype html><body>'+(modal?'<dialog open>'+html+'</dialog>':html)+'<button id="outside">其他操作</button></body>',{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.MotionKit={escape:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
  w.MotionIcons={'chevron-down':'<svg></svg>',check:'<svg></svg>'};
  w.eval(source);
  const select=w.document.getElementById('example'),picker=w.MotionSelect(select);
  bounds(picker.trigger);
  return {dom,w,select,picker,close:()=>w.close()};
}

test('示例选择使用统一下拉样式且没有搜索，方向键移动选项并同步原选择器',()=>{
  const {w,select,picker,close}=fixture();
  try{
    let changes=0;select.addEventListener('change',()=>changes++);
    assert.equal(select.hidden,true);
    assert.equal(picker.trigger.className,'select-trigger variant-select');
    assert.equal(picker.trigger.getAttribute('aria-haspopup'),'listbox');
    assert.equal(picker.menu.className,'select-menu scroll-area');
    assert.equal(picker.menu.getAttribute('role'),'listbox');
    assert.equal(picker.menu.querySelector('input,[role="combobox"],[role="status"]'),null);
    picker.trigger.click();
    assert.equal(picker.menu.parentElement,w.document.body);
    assert.equal(w.document.activeElement.dataset.value,'default');
    assert.equal(picker.menu.querySelectorAll('[role="option"]').length,4);
    key(w,w.document.activeElement,'ArrowDown');
    assert.equal(w.document.activeElement.dataset.value,'scroll');
    key(w,w.document.activeElement,'End');
    assert.equal(w.document.activeElement.dataset.value,'dock','跳到末项时应略过不可选示例');
    key(w,w.document.activeElement,'Home');
    assert.equal(w.document.activeElement.dataset.value,'default');
    key(w,w.document.activeElement,'End');
    w.document.activeElement.click();
    assert.equal(select.value,'dock');assert.equal(changes,1);
    assert.equal(picker.menu.hidden,true);
    assert.equal(picker.trigger.getAttribute('aria-expanded'),'false');
    assert.equal(w.document.activeElement,picker.trigger);
    assert.equal(picker.menu.querySelector('[aria-selected="true"]').dataset.value,'dock');
    assert.ok(picker.trigger.textContent.includes('编辑器停靠'));
  }finally{close();}
});

test('输入文字不筛选选项，不可选示例不会变更，退出或重开仍显示完整选项',()=>{
  const {w,select,picker,close}=fixture();
  try{
    picker.open();
    key(w,w.document.activeElement,'编');key(w,w.document.activeElement,'a');
    assert.equal(picker.menu.querySelector('input'),null);
    assert.equal(picker.menu.querySelectorAll('[role="option"]').length,4);
    picker.menu.querySelector('[data-value="disabled"]').click();
    assert.equal(select.value,'default');assert.equal(picker.menu.hidden,false);
    key(w,w.document.activeElement,'Escape');
    assert.equal(picker.menu.hidden,true);assert.equal(w.document.activeElement,picker.trigger);
    picker.open();
    assert.equal(picker.menu.querySelectorAll('[role="option"]').length,4);
    key(w,w.document.activeElement,'ArrowDown',{isComposing:true});
    assert.equal(w.document.activeElement.dataset.value,'default');
    assert.equal(select.value,'default');assert.equal(picker.menu.hidden,false);
    key(w,w.document.activeElement,'Tab');
    assert.equal(picker.menu.hidden,true);assert.equal(w.document.activeElement,picker.trigger);
  }finally{close();}
});

test('重选当前示例不派发变更，换示例只向外发出一次原选择器变更',()=>{
  const {w,select,picker,close}=fixture();
  try{
    const changes=[];w.document.addEventListener('change',event=>changes.push(event.target.id));
    picker.open();picker.menu.querySelector('[data-value="default"]').click();
    assert.equal(select.value,'default');assert.deepEqual(changes,[]);
    assert.equal(picker.menu.hidden,true);assert.equal(w.document.activeElement,picker.trigger);
    picker.open();picker.menu.querySelector('[data-value="scroll"]').click();
    assert.equal(select.value,'scroll');assert.deepEqual(changes,['example']);
  }finally{close();}
});

test('原选择器换内容、禁用状态和外部选择变化保持同步，焦点离开关闭菜单',async()=>{
  const {w,select,picker,close}=fixture();
  try{
    picker.open();
    select.innerHTML='<option value="a">新的默认示例</option><option value="b">另一种示例</option>';
    select.value='b';await Promise.resolve();
    assert.equal(picker.menu.hidden,true);
    assert.equal(picker.menu.querySelectorAll('[role="option"]').length,2);
    assert.equal(picker.trigger.value,'b');assert.ok(picker.trigger.textContent.includes('另一种示例'));
    select.value='a';select.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(picker.trigger.value,'a');
    select.disabled=true;await Promise.resolve();assert.equal(picker.trigger.disabled,true);
    select.disabled=false;await Promise.resolve();assert.equal(picker.trigger.disabled,false);
    picker.open();w.document.getElementById('outside').focus();
    assert.equal(picker.menu.hidden,true);
  }finally{close();}
});

test('弹窗内菜单留在模态层，第一次退出只关菜单并还回焦点',()=>{
  const {w,picker,close}=fixture(true);
  try{
    const dialog=w.document.querySelector('dialog');
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape')dialog.open=false;});
    picker.open();
    assert.equal(picker.menu.parentElement,dialog);
    assert.equal(w.document.activeElement.dataset.value,'default');
    key(w,w.document.activeElement,'Escape');
    assert.equal(picker.menu.hidden,true);assert.equal(dialog.open,true);
    assert.equal(w.document.activeElement,picker.trigger);
    picker.open();picker.trigger.focus();
    key(w,picker.trigger,'Escape');
    assert.equal(picker.menu.hidden,true);assert.equal(dialog.open,true);
    assert.equal(w.document.activeElement,picker.trigger);
    key(w,picker.trigger,'Escape');assert.equal(dialog.open,false);
  }finally{close();}
});

test('主面板通过普通下拉选择真实示例，切换动作后关闭菜单且替换完整选项',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#progress-readout'});
  try{
    const {w}=env,d=w.document,select=d.getElementById('effect-variant'),trigger=d.getElementById('effect-variant-trigger');
    bounds(trigger);
    const target=[...select.options].find(option=>option.value==='lego-kingdom');
    assert.ok(target);
    trigger.click();
    const menu=d.getElementById('effect-variant-options');
    assert.equal(menu.querySelector('input'),null);
    assert.equal(menu.querySelectorAll('[role="option"]').length,select.options.length);
    menu.querySelector('[data-value="lego-kingdom"]').click();
    assert.equal(select.value,'lego-kingdom');
    assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,'lego-kingdom');
    assert.equal(menu.hidden,true);assert.equal(d.activeElement,trigger);
    const stage=d.querySelector('#preview .motion-stage'),scrub=d.getElementById('scrub');
    scrub.value='530';scrub.dispatchEvent(new w.Event('input'));
    const position=scrub.value;
    trigger.click();menu.querySelector('[data-value="lego-kingdom"]').click();await Promise.resolve();
    assert.equal(d.querySelector('#preview .motion-stage'),stage,'重选当前示例应保留同一播放器');
    assert.equal(scrub.value,position,'重选当前示例应保留播放位置');
    trigger.click();
    d.querySelector('[data-effect="fade-rise"]').click();await Promise.resolve();
    assert.equal(d.getElementById('effect-variant-field').hidden,true);
    assert.equal(menu.hidden,true);
    d.querySelector('[data-effect="count-up"]').click();await Promise.resolve();
    assert.equal(d.getElementById('effect-variant-field').hidden,true);
    assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,undefined);
    d.querySelector('[data-effect="type-reveal"]').click();await Promise.resolve();
    trigger.click();assert.equal(menu.querySelector('input'),null);
    assert.equal(menu.querySelectorAll('[role="option"]').length,select.options.length);
    assert.deepEqual([...menu.querySelectorAll('[role="option"]')].map(option=>option.dataset.value),[...select.options].map(option=>option.value));
  }finally{env.close();}
});

test('相关动作弹窗复用普通下拉，换示例后继续独立播放且退出菜单不关闭弹窗',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#lego-engine-flow'});
  try{
    const {w}=env,d=w.document;
    d.querySelector('#related [data-related="stagger-drop"]').click();await Promise.resolve();
    const dialog=d.getElementById('related-dialog'),select=d.getElementById('related-variant'),trigger=d.getElementById('related-variant-trigger');
    bounds(trigger);trigger.click();
    const menu=d.getElementById('related-variant-options');
    assert.equal(menu.parentElement,dialog);
    assert.equal(menu.querySelector('input'),null);
    assert.equal(menu.querySelectorAll('[role="option"]').length,select.options.length);
    const target=[...select.options].find(option=>option.value!==select.value&&!option.disabled);
    assert.ok(target);
    menu.querySelector('[data-value="'+target.value+'"]').click();await Promise.resolve();
    assert.equal(select.value,target.value);
    assert.equal(d.querySelector('#related-preview .motion-stage').dataset.variant,target.value);
    assert.equal(dialog.open,true);assert.equal(menu.hidden,true);
    assert.equal(d.getElementById('related-play').getAttribute('aria-label'),'暂停相关动作');
    trigger.click();key(w,d.activeElement,'Escape');assert.equal(dialog.open,true);
    assert.equal(d.activeElement,trigger);assert.equal(menu.hidden,true);
    trigger.click();trigger.focus();key(w,trigger,'Escape');
    assert.equal(dialog.open,true);assert.equal(menu.hidden,true);assert.equal(d.activeElement,trigger);
    key(w,trigger,'Escape');assert.equal(dialog.open,false);
  }finally{env.close();}
});
