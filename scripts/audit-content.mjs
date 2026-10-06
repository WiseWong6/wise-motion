// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 只读盘点：候选字面量是检索线索，不把样式、路径或注释误报成已确认文案。
import {readFile} from 'node:fs/promises';
import {resolveEffect} from '../remotion/clock.mjs';
const root=new URL('../',import.meta.url);
const quickstart=await readFile(new URL('references/quickstart.md',root),'utf8');
const table=quickstart.split('## 按镜头用途速选')[1].split('\n## ')[0];
const tableRows=table.split('\n').filter(line=>line.startsWith('|')).join('\n');
const ids=[...new Set([...tableRows.matchAll(/`([a-z][a-z0-9-]+)`/g)].map(m=>m[1]))];
const plain=new Set(['word-slam','type-reveal','title-content','title-stagger','fade-rise','stagger-in','word-focus','dim-focus','focus-zoom','count-up','bar-growth','benchmark-columns','terminal-code','live-code-readout','staged-build','experience-progress','timeline-progress','interface-feedback','button-press-status']);
const baked=new Set(['particle-word','seed-bloom-brand-sequence','outro-credit-lift','glyph-code-fill']);
const results=[];
for(const id of ids){
  const base=resolveEffect(id);
  for(const variant of base.variants||[{id:undefined}]){
    const definition=resolveEffect(id,variant.id);
    const files=[...new Set([definition.source.path,...(definition.source.dependencies||[]),'catalog/runtime.js'])];
    const clues=[];
    for(const file of files){
      const lines=(await readFile(new URL(file,root),'utf8')).split('\n');
      lines.forEach((line,index)=>{
        if(line.length>2000)return;
        if(/['"`][^'"`\n]*[\u3400-\u9fff][^'"`\n]*['"`]|\[[\d,.\s]{5,}\]|>[^<${}]+<|(?:label|title|words|names|eras|values|cardSet|glyph|artwork)\s*[:=(]/.test(line))clues.push({file,line:index+1,excerpt:line.trim().slice(0,280)});
      });
    }
    results.push({id,variant:definition.variant_id||null,category:plain.has(id)?'普通文字或数据':baked.has(id)?'预存字形或坐标':'图形、背景或转场（需人工核对）',slots:(definition.content_slots||[]).map(slot=>({id:slot.id,type:slot.type,fields:slot.fields})),files,clues});
  }
}
console.log(JSON.stringify({scope:'速选表及共享依赖；包含同一文件其他条目的线索，需读源码确认；不是完整语法分析',effectCount:ids.length,configurationCount:results.length,contentCandidates:results.filter(r=>r.category!=='图形、背景或转场（需人工核对）').length,supportedConfigurations:results.filter(r=>r.slots.length).length,results},null,2));
