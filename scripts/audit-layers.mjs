// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 像素检查只用于已有源码审查的白名单；不能根据四角透底自动批准整个目录。
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {resolveEffect} from '../remotion/clock.mjs';
import contentApi from '../catalog/content.js';
import {layerFingerprint} from './layer-status.mjs';
import {openProbe} from './browser-probe.mjs';
import {assertRenderWrite} from './output-boundary.mjs';
const output=process.argv[2];if(!output)throw Error('请提供源码外的审计结果路径；可用 WISE_MOTION_RENDER_DIR 指定产物根');
await assertRenderWrite(path.resolve(output));
const reviewed=[['type-reveal',{text:'涂鸦做网站'}],['count-up',{value:1e6,format:'compact',suffix:' tokens',caption:'上下文容量'}],['word-focus',{words:['涂鸦','网站','发布']}]];
const report={version:1,scope:'已审查三种纯文字绘制；默认和中文内容、深浅外观、全帧透明通道。其他动效未批准。',results:[]};
const probe=await openProbe();
try{
  report.browser=await probe.page.evaluate(()=>navigator.userAgent);
  for(const [id,content] of reviewed){
    const definition=resolveEffect(id),row={id,variant:definition.variant_id||null,fingerprint:layerFingerprint(definition),status:'overlay-ok',samples:[]};
    for(const theme of ['dark','light'])for(const values of [undefined,content]){
      await probe.load(contentApi.withContent(definition,values),{transparent:true,theme});
      for(const t of [...new Set([0,150,350,700,1200,definition.preview_ms,definition.duration_ms])]){
        await probe.draw(t);const alpha=await probe.alpha(await probe.png());row.samples.push({theme,custom:!!values,time:t,...alpha});
        if(alpha.edge>0||alpha.fraction>.4||(t===definition.preview_ms&&alpha.visible<30))row.status='own-background';
      }
    }
    report.results.push(row);console.log(id+'：'+row.status);
  }
}finally{await probe.close();}
await mkdir(path.dirname(path.resolve(output)),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
if(report.results.some(row=>row.status!=='overlay-ok'))process.exitCode=1;
