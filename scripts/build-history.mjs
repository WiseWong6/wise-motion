// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 历史档案单独维护，正式目录构建不读取或改写源码外的业务状态。
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {history,reviewMarkdown,state,root} from './history.mjs';

const checking=process.argv.includes('--check');
const registry=JSON.parse(await readFile(path.join(root,'catalog/registry.json'),'utf8'));
const historical=await history(registry);
if(historical.recipes.length||historical.counts.entries)throw new Error('历史页签已下线，不得恢复可播放历史条目');
const outputs=[
 [path.join(root,'catalog/history-data.js'),'/* 本机历史配方编译数据；权威审查与来源快照位于 private/state/wise-motion/history。 */\nglobalThis.MotionHistory = '+JSON.stringify(historical)+';\n'],
 [path.join(state,'review.md'),reviewMarkdown(historical,registry)]
];
for(const [file,content] of outputs){
 if(checking){
  if(await readFile(file,'utf8')!==content)throw new Error('历史记录需要重新生成：'+file+'；请运行 npm run build:history');
 }else await writeFile(file,content);
}
console.log(checking?'历史来源记录与编译数据一致。':'已更新历史编译数据及私有状态目录中的审查报告。');
