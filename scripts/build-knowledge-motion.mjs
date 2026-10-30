// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {build}from'esbuild';import{readFile,writeFile}from'node:fs/promises';
import {assertProjectWrite}from'./output-boundary.mjs';
export async function buildKnowledgeMotion(checking=false){
 const root=new URL('../',import.meta.url),result=await build({absWorkingDir:root.pathname,entryPoints:['catalog/remotion/knowledge-video/catalog.js'],bundle:true,write:false,format:'iife',target:['chrome120','safari17'],minify:true,legalComments:'eof'});
 const content='/* Knowledge video selected drawings. Apache-2.0; see catalog/assets/knowledge-video. */\n'+result.outputFiles[0].text,target=new URL('catalog/effects/knowledge-video.js',root);
 if(checking){if(await readFile(target,'utf8')!==content)throw Error('知识库视频动作绘制文件过期，请运行 npm run build');}
 else{await assertProjectWrite(target.pathname);await writeFile(target,content);}
}
