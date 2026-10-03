// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {reproductionSources} from './reproduction-sources.mjs';
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
  const recipes=[],excluded=[],merged=[];
  for(const rule of snapshot.rules){
    const review=crosswalk.rules[rule.id];
    if(!review?.merged_into)continue;
    const target=snapshot.rules.find(r=>r.id===review.merged_into),targetReview=crosswalk.rules[review.merged_into];
    assert.ok(review.status==='included'&&target&&targetReview.status==='included'&&!targetReview.merged_into,rule.id+' 合并目标无效');
    merged.push({id:rule.id,name:review.name||rule.title,target_id:target.id,target_name:targetReview.name||target.title});
  }
  const redirects=Object.fromEntries(merged.map(r=>['history-'+r.id,'history-'+r.target_id]));
  const resolve=id=>crosswalk.rules[id]?.merged_into||id;
  for(const rule of snapshot.rules){
    const review=crosswalk.rules[rule.id];
    assert.ok(review && ['included','excluded'].includes(review.status),rule.id+' 未完成审查');
    const name=review.name||rule.title;
    const summary=review.summary||rule.summary;
    if(review.status==='excluded'){excluded.push({id:rule.id,name:rule.title,reason:review.reason});continue;}
    if(review.merged_into)continue;
    for(const [id,variant] of Object.entries(review.action_variants||{})){
      assert.ok(review.patterns.includes(id),rule.id+' 的示例不属于关联动作');
      assert.ok(registry.effects.find(e=>e.id===id)?.variants?.some(v=>v.id===variant),rule.id+' 的关联示例不存在');
    }
    const sourceRules=[rule,...snapshot.rules.filter(r=>crosswalk.rules[r.id].merged_into===rule.id)];
    const entries=sourceRules.flatMap(sourceRule=>{
      const sourceReview=crosswalk.rules[sourceRule.id],sourceName=sourceReview.name||sourceRule.title;
      const cleanCase=c=>({...c,title:sourceReview.case_names?.[c.id]||(c.title===sourceRule.title?sourceName:c.title),note:(sourceReview.case_notes?.[c.id]||c.note).replace('和声音','')});
      for(const id of sourceReview.patterns)assert.ok(registry.effects.some(x=>x.id===id),sourceRule.id+' 的标准动作不存在：'+id);
      const entries=snapshot.previews.filter(p=>p.ruleId===sourceRule.id).map(entry=>{
        const preview={...(sourceReview.previews?.[entry.id]||entry.preview)};
        for(const key of ['file','source','sourceVideo','implementation'])if(preview[key])preview[key]=url(preview[key]);
        if(typeof preview.poster==='string')preview.poster=url(preview.poster);
        const cases=sourceRule.cases.filter(c=>entry.cases.includes(c.id)).map(cleanCase);
        const entryName=cases.length===1?cases[0].title:entry.title===sourceRule.title?sourceName:entry.title;
        return {id:entry.id,name:entryName,summary:sourceRules.length>1?(sourceReview.summary||entry.description):entry.description,preview,entry:{...entry,preview:entry.preview},cases,code:entry.code};
      });
      // 原图库隐藏的文字动作以及整段阅读节奏，保留原作片段，不编造独立预览。
      for(const c of sourceRule.cases)if(!entries.some(e=>e.cases.some(x=>x.id===c.id))){
        const source=snapshot.originals.sources[c.source];
        assert.ok(source,'原作不存在：'+c.source);
        const type=source.type==='video'?'source-clip':'source-link',end=Math.max(c.start+.01,c.end);
        const renamed=cleanCase(c);
        entries.push({id:sourceRule.id+'--'+c.id,name:renamed.title,summary:sourceReview.summary||sourceRule.summary,preview:{type,file:url(source.file),start:c.start,end,duration:end-c.start},entry:null,cases:[renamed],code:c.references.map(i=>sourceRule.references[i]),context_note:'这是原作片段，可能包含同时发生的其他动作；没有冒充独立抽取的效果。'});
      }
      const process=sourceReview.process||sourceRule.process;
      const definition={summary:sourceReview.summary||sourceRule.summary,purpose:sourceReview.extraction,
        retain:sourceReview.preserve.join('；'),phases:process.includes('→')?process.split('→').map(x=>x.trim()).filter(Boolean):[sourceReview.summary||sourceRule.summary],
        actions:sourceReview.patterns,source_parameters:sourceReview.knobs||sourceRule.knobs,review:{...sourceReview,label:labels[sourceReview.relation]}};
      for(const entry of entries){
        entry.source_rule_id=sourceRule.id;
        if(sourceRules.length>1){entry.definition={...definition,...sourceReview.case_definitions?.[entry.cases[0]?.id]};entry.context_note ||= entry.preview.note;}
      }
      return entries;
    });
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
    const previousNames=[...new Set(sourceRules.flatMap(r=>[r.title,crosswalk.rules[r.id].name,...(crosswalk.rules[r.id].previous_names||[])]).filter(Boolean))].filter(old=>old!==name);
    const aliases=[...new Set([rule.title,...previousNames,...sourceRules.flatMap(r=>r.cases.map(c=>c.title)),...entries.map(e=>e.name),...snapshot.previews.filter(p=>sourceRules.some(r=>r.id===p.ruleId)).map(p=>p.title),...names,...sourceRules.map(r=>r.id)])];
    recipes.push({id:'history-'+rule.id,history_id:rule.id,name,kind:'recipe',domain:rule.section,category:'history-'+rule.family,summary,purpose:review.extraction,objects:review.preserve.join('；'),phases,aliases,previous_names:previousNames,behaviors:[...new Set(review.patterns.flatMap(id=>registry.effects.find(x=>x.id===id).behaviors))],retain:review.preserve.join('；'),avoid:'不要用外观相似的标准动作替换原作中的身份、时序和因果；不导入静态资产与声音排程。',duration_ms:Math.round(entries[0].preview.duration*1000),preview_ms:Math.round(entries[0].preview.duration*650),loop:false,default_ease:'linear',parameters:{speed:{label:'播放速度',default:1,min:.5,max:2,step:.25}},source:{origin:'history',path:rule.references[0].file,license:'原作代码、素材与依赖各自保留原许可；尚未统一核实'},actions:review.patterns,...(review.action_variants?{action_variants:review.action_variants}:{}),trigger:rule.trigger,analogy:'按原作可观察的动作关系复用。',assumptions:review.previews?'历史配方保留本机原作引用，观察预览另存裁剪慢放片段；原片范围与工程时序不变，画面尚未进行本轮人工验收。':'历史配方引用本机原作，未搬入资产或音效。标准示例只解释结构；原作画面尚未进行本轮人工验收。',tempo_note:'原作曲线固定，只调整观看速度。预览时钟与工程时钟需要分别处理。',recommendation:review.extraction,review:{...review,label:labels[review.relation]},source_clock:review.reuse_contract.clock,source_parameters:review.knobs||rule.knobs,entries,related_history:[...new Set(sourceRules.flatMap(r=>crosswalk.rules[r.id].related||r.related).map(resolve).filter(id=>id!==rule.id))].map(id=>'history-'+id),original_sources:names,reproduction:review.reproduction});
  }
  const used=new Set(recipes.flatMap(r=>r.entries.flatMap(e=>e.cases.map(c=>c.source))));
  const caseIds=new Set(recipes.flatMap(r=>r.entries.flatMap(e=>e.cases.map(c=>c.id))));
  const originals={...snapshot.originals,clips:snapshot.originals.clips.filter(c=>caseIds.has(c.id)),sources:Object.fromEntries(Object.entries(snapshot.originals.sources).filter(([id])=>used.has(id)))};
  const source_files=await reproductionSources(recipes,snapshot.source_root);
  return {version:1,date:snapshot.date,source_root:sourceURL,source_files,merged,redirects,categories:snapshot.taxonomy.map(t=>({id:'history-'+t.id,name:crosswalk.category_names?.[t.id]||t.title,boundary:t.boundary})),recipes,excluded,originals,counts:{reviewed:snapshot.rules.length,recipes:recipes.length,entries:recipes.reduce((n,r)=>n+r.entries.length,0),animation:recipes.filter(r=>r.domain==='animation').length,document:recipes.filter(r=>r.domain==='document').length}};
}
export function reviewMarkdown(data,registry){
  const out=['# 历史动画与文稿逐条审查','',`审查日期：${data.date}。共 ${data.counts.reviewed} 条，纳入 ${data.counts.recipes} 条配方、${data.counts.entries} 个案例。`,'','来源文件、定位标记和本机预览存在性已自动核对；本轮没有逐帧截图或人工视觉验收。原工程保持只读；沿用本机引用，未迁移字体、绘制素材、依赖库和声音。','','标准动作解释可复用的结构；历史配方保留原作的完整参数关系、案例级源码与时钟。标为「提炼组成动作」不代表完整原效果已经通用封装。','','## 范围外记录',''];
  data.excluded.forEach(e=>out.push(`- ${e.name}：${e.reason}`));
  if(data.merged.length){out.push('','## 合并收录','');data.merged.forEach(r=>out.push(`- ${r.name}：并入「${r.target_name}」，案例、原片范围与本案例源码保留。`));}
  for(const r of data.recipes){
    const contract=r.review.reuse_contract;
    out.push('',`## ${r.name}`,'',`原条目：${r.history_id}；领域：${r.domain==='document'?'文稿':'动画'}；结论：${r.review.label}。`,'',`提炼内容：${r.review.extraction}`,`必须保留：${r.retain}`,`动作关系：${r.phases.join(' → ')}`,`主控制量：${contract.primary_control}`,`迁用输入：${contract.input}`,`稳定关系：${contract.invariant}`,`原参数：${r.source_parameters}`,`时钟约束：${r.source_clock}`,`案例边界：${contract.case_boundary}`);
    if(r.actions.length)out.push('标准参考：'+r.actions.map(id=>`[${registry.effects.find(x=>x.id===id).name}](${path.join(root,'references/effects',id+'.md')})`).join('、')+'。');
    if(r.review.dependencies.length)out.push('专用依赖：'+r.review.dependencies.join('、')+'。');
    if(r.review.correction)out.push('描述校正：'+r.review.correction);
    if(r.review.document_contract)out.push('文稿交接：'+Object.values(r.review.document_contract).join('；'));
    for(const entry of r.entries){
      const detail=entry.definition;
      if(detail)out.push('',`本案例机制：${detail.summary}`,`本案例参数：${detail.source_parameters}`,`本案例保留：${detail.retain}`);
      out.push('',`案例：${entry.name}；预览 ${entry.preview.duration.toFixed(3)} 秒；方式 ${entry.preview.type}。`);
      entry.cases.forEach(c=>out.push(`- ${c.title}：原片 ${c.start}–${c.end} 秒。${c.note}`));
      entry.code.forEach(ref=>out.push(`- [本案例源码](${ref.file})：${ref.anchors.map(a=>a.symbol+'（第 '+a.line+' 行）').join('、')}`));
    }
  }
  return out.join('\n')+'\n';
}
