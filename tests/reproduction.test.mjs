// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
import {reproductionSources} from '../scripts/reproduction-sources.mjs';

async function setup(){
  const env=await environment();
  env.w.eval(await readFile(new URL('../catalog/history-data.js',import.meta.url),'utf8'));
  env.w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  return env;
}
test('全部复制提示词只含制作要求，不包含原片定位、假设、审查、来源路径或本机依赖',async()=>{
  const env=await setup();
  try{
    const historical=env.w.MotionHistory.recipes,registry={...data,effects:[...data.effects,...historical]};
    for(const effect of registry.effects){
      const entries=effect.kind==='recipe'?effect.entries:[null];
      for(const entry of entries){
        const text=env.w.MotionExport.prompt(effect,{caseId:entry?.id,speed:1},registry);
        assert.ok(text.includes(effect.name),effect.id);
        assert.match(text,/画面与对象：.+/);
        assert.match(text,/动作步骤：\n1\. \S/);
        assert.match(text,/时间：\d+\.\d{2} 秒/);
        assert.doesNotMatch(text,/原片范围|关键假设|抽象结论|来源与许可|案例边界|对应参考|对应案例|描述校正|观看速度|尚未|验收|未搬入|本机|\/Users\/|file:\/\/|固定源码和复用说明|沿用原作时间/);
        assert.doesNotMatch(text,/\d+\. \n/,'制作步骤不能因清理而为空：'+effect.id);
        if(effect.id==='prompt-chinese-type'){
          assert.match(text,/画面与对象：.*完整圆角输入框/);
          assert.match(text,/输入框及工具栏、发送按钮必须完整保留/);
          assert.match(text,/不删除输入框而只留悬空文字/);
        }
      }
    }
  }finally{env.close();}
});
test('复制提示词按当前速度给出实际制作时长，入场与循环关系保持',async()=>{
  const env=await setup();
  try{
    const fade=data.effects.find(e=>e.id==='fade-rise');
    const text=env.w.MotionExport.prompt(fade,{speed:1.5});
    assert.match(text,/0\.80 秒/);assert.match(text,/0\.10 秒开始主要动作/);assert.match(text,/0\.50 秒完成/);
    assert.match(text,/从透明|变清晰/);
    const loop=env.w.MotionExport.prompt(data.effects.find(e=>e.id==='dual-scroll'),{speed:2});
    assert.match(loop,/4\.00 秒为一个周期，首尾连续循环/);assert.match(loop,/上排向右、下排向左/);
  }finally{env.close();}
});
test('历史代码复制当前案例的实际源码及文字依赖，原文件内容逐字保留',async()=>{
  const env=await setup();
  try{
    const history=env.w.MotionHistory;
    for(const effect of history.recipes)for(const entry of effect.entries){
      const text=env.w.MotionExport.code(effect,{caseId:entry.id});
      for(const name of entry.source_packages)assert.match(name,/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i,'依赖包不能来自普通对象字段：'+name);
      for(const ref of entry.code)assert.ok(text.includes(history.source_files[ref.file].content),entry.id);
      for(const file of entry.source_files)assert.ok(text.includes(history.source_files[file].content),file);
      assert.doesNotMatch(text,/MotionHistoryRuntime\.create|保存到 Wise Motion 包根目录的 demo\.html/);
    }
    for(const [file,source]of Object.entries(history.source_files))assert.equal(source.content,await readFile(file,'utf8'));
    const recipe=history.recipes.find(e=>e.entries.some(x=>x.source_packages.length));
    const entry=recipe.entries.find(x=>x.source_packages.length);
    const text=env.w.MotionExport.code(recipe,{caseId:entry.id});
    assert.ok(text.includes('依赖包：'+entry.source_packages.join('、')));
  }finally{env.close();}
});
test('源码收集保留引用关系，重复文件只存一份，素材输入与依赖包明确记录',async()=>{
  const env=await setup();
  try{
    const history=env.w.MotionHistory,recipe=history.recipes.find(e=>e.entries[0].source_files.length>e.entries[0].code.length);
    const clone=JSON.parse(JSON.stringify(recipe));
    const files=await reproductionSources([clone],new URL(history.source_root).pathname);
    assert.equal(new Set(clone.entries[0].source_files).size,clone.entries[0].source_files.length);
    assert.deepEqual(clone.entries[0].source_packages,Array.from(recipe.entries[0].source_packages));
    assert.equal(files[clone.entries[0].code[0].file].content,history.source_files[clone.entries[0].code[0].file].content);
  }finally{env.close();}
});
