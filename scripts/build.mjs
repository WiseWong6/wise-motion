// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
import {history,reviewMarkdown,state} from './history.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const checking = process.argv.includes('--check');
async function output(relative, content) {
  const target = path.join(root, relative);
  if (checking) {
    if (await readFile(target, 'utf8') !== content) throw new Error('生成文件与权威定义不同：' + relative + '；请运行 node scripts/build.mjs');
  } else await writeFile(target, content);
}
const registry = JSON.parse(await readFile(path.join(root, 'catalog/registry.json'), 'utf8'));
const {describe} = createRequire(import.meta.url)('../catalog/matching.js');
await mkdir(path.join(root, 'references/effects'), {recursive: true});
await output('catalog/registry-data.js', '/* 自动生成自 registry.json；请修改权威定义后运行 node scripts/build.mjs。AGPL-3.0-only */\nglobalThis.MotionRegistry = ' + JSON.stringify(registry) + ';\n');
const historical=await history(registry);
await output('catalog/history-data.js','/* 本机历史配方编译数据；权威审查与来源快照位于 private/state/wise-motion/history。 */\nglobalThis.MotionHistory = '+JSON.stringify(historical)+';\n');
const review=reviewMarkdown(historical,registry);
if(checking){if(await readFile(path.join(state,'review.md'),'utf8')!==review)throw new Error('历史审查报告需要重新生成');}
else await writeFile(path.join(state,'review.md'),review);
const index = ['# 本地动效索引', '', '此索引和每项说明由 `catalog/registry.json` 生成。先按行为找候选，再读取候选说明和对应源码。明确禁项优先于视觉相似。', '', `页面入口：\`catalog/index.html\`。${registry.effects.filter(e=>e.kind==='action').length} 个单个动作、${registry.effects.filter(e=>e.kind==='composition').length} 个组合片段；另有 ${historical.recipes.length} 条历史配方。`, '', '历史条目按原库动作关系与案例级源码逐项审查，业务记录保存在私有状态目录。[历史使用方法](history.md)。'];
for (const c of registry.categories) {
  index.push('', '## ' + c.name, '', '| 参考 | 用途与动作 | 行为线索 | 说明 |', '|---|---|---|---|');
  for (const e of registry.effects.filter(x => x.category === c.id)) {
    index.push(`| ${e.name} | ${e.summary} | ${e.aliases.join('、')} | [按需读取](effects/${e.id}.md) |`);
    const detail = [`# ${e.name}`, '', '以下动效说明由统一定义生成。示例对象和时长是可调整的假设，结构要求需要保留。', '', describe(e, {}, registry), '', '## 调整方式', '', `播放速度：${e.parameters.speed.min}–${e.parameters.speed.max} 倍。`, e.parameters.ease ? `速度变化：${e.parameters.ease.options.map(x => ({linear:'匀速',outCubic:'末尾减速',inOutSine:'平缓往返',spring:'轻微回弹'}[x])).join('、')}。` : e.tempo_note, '', `预览定位：${e.preview_ms} 毫秒。固定演示总长：${e.duration_ms} 毫秒。`, '', '## 源码与使用', '', `- [自编源码](../../${e.source.path})，注册名称：\`${e.id}\`。`, '- [统一播放接口](../runtime-interface.md)，可播放、暂停、重播、定位时间和释放资源。', `- [Anime.js 官方文档](${e.source.reference_url})；使用固定版本 4.5.0 的计时器与速度曲线。`, '- 自编效果未复制官方示例素材；许可为 AGPL-3.0-only。第三方 Anime.js 保留 MIT 许可。', '', e.actions.length ? '所用动作：' + e.actions.map(id => `[${registry.effects.find(x => x.id === id).name}](${id}.md)`).join('、') + '。' : '这是一个单个动作，可在组合片段中复用。', ''];
    await output(`references/effects/${e.id}.md`, detail.join('\n'));
  }
}
await output('references/index.md', index.join('\n') + '\n');
console.log(checking ? '统一定义与所有生成文件一致。' : `已生成 ${registry.effects.length} 个效果说明、轻量索引和页面数据。`);
