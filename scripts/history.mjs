// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
export const root=fileURLToPath(new URL('../',import.meta.url));
export const state=path.resolve(root,'../../state/wise-motion/history');
const json=async name=>JSON.parse(await readFile(path.join(state,name),'utf8'));
const labels={equivalent:'动作结构等效',component:'提炼组成动作','source-only':'保留原作专用逻辑'};
export async function history(registry) {
  const snapshot=await json('source-snapshot.json'),crosswalk=await json('crosswalk.json');
  assert.equal(snapshot.rules.length,Object.keys(crosswalk.rules).length,'必须逐条审查，不能遗漏');
  const sourceURL=pathToFileURL(snapshot.source_root+'/').href;
  const url=relative=>new URL(relative,sourceURL).href;
  const recipes=[],excluded=[];
  for(const rule of snapshot.rules){
    const review=crosswalk.rules[rule.id];
    const summary=review.summary||rule.summary;
    const cleanCase=c=>({...c,note:c.note.replace('和声音','')});
    assert.ok(review && ['included','excluded'].includes(review.status),rule.id+' 未完成审查');
    if(review.status==='excluded'){excluded.push({id:rule.id,name:rule.title,reason:review.reason});continue;}
    for(const id of review.patterns)assert.ok(registry.effects.some(x=>x.id===id),rule.id+' 的标准动作不存在：'+id);
    const entries=snapshot.previews.filter(p=>p.ruleId===rule.id).map(entry=>{
      const preview={...entry.preview};
      for(const key of ['file','source','sourceVideo','implementation'])if(preview[key])preview[key]=url(preview[key]);
      if(typeof preview.poster==='string')preview.poster=url(preview.poster);
      return {id:entry.id,name:entry.title,summary:entry.description,preview,entry:{...entry,preview:entry.preview},cases:rule.cases.filter(c=>entry.cases.includes(c.id)).map(cleanCase),code:entry.code};
    });
    // 原图库隐藏的文字动作以及整段阅读节奏，保留原作片段，不编造独立预览。
    for(const c of rule.cases)if(!entries.some(e=>e.cases.some(x=>x.id===c.id))){
      const source=snapshot.originals.sources[c.source];
      assert.ok(source,'原作不存在：'+c.source);
      const type=source.type==='video'?'source-clip':'source-link',end=Math.max(c.start+.01,c.end);
      entries.push({id:rule.id+'--'+c.id,name:c.title,summary,preview:{type,file:url(source.file),start:c.start,end,duration:end-c.start},entry:null,cases:[cleanCase(c)],code:c.references.map(i=>rule.references[i]),context_note:'这是原作片段，可能包含同时发生的其他动作；没有冒充独立抽取的效果。'});
    }
    assert.ok(entries.length,rule.id+' 没有案例');
    for(const entry of entries){
      assert.ok(entry.code.length,entry.id+' 缺少本案例源码');
      assert.ok(entry.preview.duration>0,entry.id+' 没有有效时长');
      for(const ref of entry.code){assert.ok(ref.anchors.length);assert.ok((await stat(ref.file)).isFile());}
      if(entry.preview.type==='original-crop'||entry.preview.type==='source-clip')assert.ok((await stat(fileURLToPath(entry.preview.file))).isFile(),entry.id+' 预览文件丢失');
      if(typeof entry.preview.poster==='string')assert.ok((await stat(fileURLToPath(entry.preview.poster))).isFile());
    }
    const process=review.process||rule.process;
    const phases=process.includes('→')?process.split('→').map(x=>x.trim()).filter(Boolean):[summary];
    const names=[...new Set(entries.flatMap(e=>e.cases.map(c=>snapshot.originals.sources[c.source]?.title||c.source)))];
    recipes.push({id:'history-'+rule.id,history_id:rule.id,name:review.name||rule.title,kind:'recipe',domain:rule.section,category:'history-'+rule.family,summary,purpose:review.extraction,objects:review.preserve.join('；'),phases,aliases:[rule.title,...names,rule.id],behaviors:[...new Set(review.patterns.flatMap(id=>registry.effects.find(x=>x.id===id).behaviors))],retain:review.preserve.join('；'),avoid:'不要用外观相似的标准动作替换原作中的身份、时序和因果；不导入静态资产与声音排程。',duration_ms:Math.round(entries[0].preview.duration*1000),preview_ms:Math.round(entries[0].preview.duration*650),loop:false,default_ease:'linear',parameters:{speed:{label:'播放速度',default:1,min:.5,max:2,step:.25}},source:{origin:'history',path:rule.references[0].file,license:'原作代码、素材与依赖各自保留原许可；尚未统一核实'},actions:review.patterns,trigger:rule.trigger,analogy:'按原作可观察的动作关系复用。',assumptions:'历史配方引用本机原作，未搬入资产或音效。标准示例只解释结构；原作画面尚未进行本轮人工验收。',tempo_note:'原作曲线固定，只调整观看速度。预览时钟与工程时钟需要分别处理。',recommendation:review.extraction,review:{...review,label:labels[review.relation]},source_clock:review.reuse_contract.clock,source_parameters:rule.knobs,entries,related_history:rule.related.map(id=>'history-'+id),original_sources:names});
  }
  const used=new Set(recipes.flatMap(r=>r.entries.flatMap(e=>e.cases.map(c=>c.source))));
  const caseIds=new Set(recipes.flatMap(r=>r.entries.flatMap(e=>e.cases.map(c=>c.id))));
  const originals={...snapshot.originals,clips:snapshot.originals.clips.filter(c=>caseIds.has(c.id)),sources:Object.fromEntries(Object.entries(snapshot.originals.sources).filter(([id])=>used.has(id)))};
  return {version:1,date:snapshot.date,source_root:sourceURL,categories:snapshot.taxonomy.map(t=>({id:'history-'+t.id,name:t.title,boundary:t.boundary})),recipes,excluded,originals,counts:{reviewed:snapshot.rules.length,recipes:recipes.length,entries:recipes.reduce((n,r)=>n+r.entries.length,0),animation:recipes.filter(r=>r.domain==='animation').length,document:recipes.filter(r=>r.domain==='document').length}};
}
export function reviewMarkdown(data,registry){
  const out=['# 历史动画与文稿逐条审查','',`审查日期：${data.date}。共 ${data.counts.reviewed} 条，纳入 ${data.counts.recipes} 条配方、${data.counts.entries} 个案例。`,'','来源文件、定位标记和本机预览存在性已自动核对；本轮没有逐帧截图或人工视觉验收。原作保持只读，没有复制、迁移或重新授权资产和声音。','','标准动作解释可复用的结构；历史配方保留原作的完整参数关系、案例级源码与时钟。标为「提炼组成动作」不代表完整原效果已经通用封装。','','## 范围外记录',''];
  data.excluded.forEach(e=>out.push(`- ${e.name}：${e.reason}`));
  for(const r of data.recipes){
    const contract=r.review.reuse_contract;
    out.push('',`## ${r.name}`,'',`原条目：${r.history_id}；领域：${r.domain==='document'?'文稿':'动画'}；结论：${r.review.label}。`,'',`提炼内容：${r.review.extraction}`,`必须保留：${r.retain}`,`动作关系：${r.phases.join(' → ')}`,`主控制量：${contract.primary_control}`,`迁用输入：${contract.input}`,`稳定关系：${contract.invariant}`,`原参数：${r.source_parameters}`,`时钟约束：${r.source_clock}`,`案例边界：${contract.case_boundary}`);
    if(r.actions.length)out.push('标准参考：'+r.actions.map(id=>`[${registry.effects.find(x=>x.id===id).name}](${path.join(root,'references/effects',id+'.md')})`).join('、')+'。');
    if(r.review.dependencies.length)out.push('专用依赖：'+r.review.dependencies.join('、')+'。');
    if(r.review.correction)out.push('描述校正：'+r.review.correction);
    if(r.review.document_contract)out.push('文稿交接：'+Object.values(r.review.document_contract).join('；'));
    for(const entry of r.entries){
      out.push('',`案例：${entry.name}；预览 ${entry.preview.duration.toFixed(3)} 秒；方式 ${entry.preview.type}。`);
      entry.cases.forEach(c=>out.push(`- ${c.title}：原片 ${c.start}–${c.end} 秒。${c.note}`));
      entry.code.forEach(ref=>out.push(`- [本案例源码](${ref.file})：${ref.anchors.map(a=>a.symbol+'（第 '+a.line+' 行）').join('、')}`));
    }
  }
  return out.join('\n')+'\n';
}
