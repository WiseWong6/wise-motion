// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 只读取既有证据；缺少证据绝不当作通过。不调用模型、不生成图片、不改计划。
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {checkPlan,buildJsx} from './plan.mjs';
import {compareSnapshot,treeSnapshot,sourceSnapshot,digest} from './eval-evidence.mjs';
export async function evaluate(planFile,baselineFile,checks=[]){
  const raw=await readFile(planFile),plan=JSON.parse(raw),baseline=baselineFile?JSON.parse(await readFile(baselineFile,'utf8')):null;
  const result=checkPlan(plan),effects=plan.shots.flatMap(s=>s.layers||[s.effect]).filter(Boolean);
  const modes=Object.fromEntries(['reuse','tweak','original'].map(mode=>[mode,effects.filter(e=>e.mode===mode).length]));
  const evidence=await Promise.all(checks.map(async file=>JSON.parse(await readFile(file,'utf8'))));
  const verified=evidence.filter(item=>item.kind==='check'&&item.plan&&JSON.stringify(checkPlan(item.plan))===JSON.stringify(item.result));
  const assets=baseline?compareSnapshot(baseline.files,await treeSnapshot(baseline.assets)):null;
  const source=baseline?.source?compareSnapshot(baseline.source,await sourceSnapshot()):null;
  const pending=result.errors.length?null:buildJsx(plan).pending;
  const withoutContent=value=>{const copy=structuredClone(value);for(const shot of copy.shots||[])for(const effect of shot.layers||[shot.effect])if(effect)delete effect.content;return copy;};
  const contentOnly=baseline?.plan?{status:isDeepStrictEqual(withoutContent(baseline.plan),withoutContent(plan))&&!isDeepStrictEqual(baseline.plan,plan)&&assets?.length===0?'passed':'failed',scope:'仅验证计划差异限于 content 且素材未改；最终可见文字另验'}:{status:'unverified'};
  return {plan:result,modes,contentOnly,contentLayers:effects.filter(e=>e.mode!=='original'&&e.content&&Object.keys(e.content).length).length,
    assets:assets===null?{status:'unverified'}:{status:assets.length?'failed':'passed',changes:assets},pendingOriginal:pending,
    source:source===null?{status:'unverified'}:{status:source.length?'failed':'passed',changes:source},
    checks:{recorded:verified.length,invalid:evidence.length-verified.length,finalPlanRecorded:verified.some(item=>item.planSha256===digest(raw)),totalAttempts:'unverified: 未被收集器记录的调用无法从最终计划推断'},
    rendering:{status:'unverified',reason:'需实际生成组件、渲染可读时段并检查主体；计划与像素变化不能证明内容正确'},
    readability:{status:'unverified',reason:'中文、字体、遮挡、节奏与视觉统一需要实际画面或人工评分'},
    status:result.errors.length||assets?.length||source?.length||pending?.length||evidence.length!==verified.length?'failed':'needs-render-and-review'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [plan,baseline,...checks]=process.argv.slice(2);
  if(!plan)throw Error('用法：node scripts/eval-plan.mjs <计划> [初始证据] [逐轮检查证据...]');
  const report=await evaluate(plan,baseline,checks);console.log(JSON.stringify(report,null,2));if(report.status==='failed')process.exitCode=1;
}
