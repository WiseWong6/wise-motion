// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {bundle} from '@remotion/bundler';
import {ensureBrowser,renderMedia,selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {assertProjectWrite,assertRenderWrite,resolveRenderOutput} from './output-boundary.mjs';
import {resolveEffect} from '../remotion/clock.mjs';
import {assertLayerBuildCurrent} from './layer-status.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const [id='stagger-in',target,properties]=process.argv.slice(2);
const inputProps={effectId:id,...(properties?JSON.parse(properties):{})};
if(inputProps.baseline)throw new Error('正式导出不接受迁移基准参数；对照检查留在独立维护副本。');
const definition=resolveEffect(inputProps.definition||inputProps.effectId,inputProps.variantId);
assertLayerBuildCurrent();
const output=await resolveRenderOutput(target,definition.id);
await assertRenderWrite(output+'.json');await mkdir(path.dirname(output),{recursive:true});
await assertProjectWrite(path.join(root,'.render-bundle'));await assertProjectWrite(path.join(root,'public'));
const serveUrl=await bundle({entryPoint:path.join(root,'remotion/entry.jsx'),publicDir:path.join(root,'public'),outDir:path.join(root,'.render-bundle')});
// 固定使用与当前 Remotion 配套的浏览器；日常 Chrome 路径仅供诊断覆盖。
// 纯 DOM/SVG 使用默认绘制后端，避免强制 angle 的复杂混合图层截图缺失。
const browserStatus=await ensureBrowser({chromeMode:'headless-shell',browserExecutable:process.env.WISE_CHROME||undefined});
if(!('path' in browserStatus))throw new Error('Remotion 配套浏览器未准备完成');
const browserVersion=execFileSync(browserStatus.path,['--version'],{encoding:'utf8'}).trim();
const gl=[definition?.source?.path,...(definition?.source?.dependencies||[])].includes('catalog/effects/metal-impact.js')?'angle':null;
const options={serveUrl,inputProps,chromiumOptions:{gl},chromeMode:'headless-shell',browserExecutable:browserStatus.path,timeoutInMilliseconds:120000};
const composition=await selectComposition({...options,id:'WiseMotion'});
let last=-1;
await renderMedia({...options,composition,codec:'h264',crf:16,pixelFormat:'yuv420p',outputLocation:output,concurrency:2,onProgress:({progress})=>{const p=Math.floor(progress*10);if(p!==last){last=p;console.log(`渲染 ${p*10}%`);}}});
await writeFile(output+'.json',JSON.stringify({inputProps,composition,output,browser:{mode:options.chromeMode,executable:browserStatus.path,version:browserVersion,gl}},null,2));
console.log(output);
