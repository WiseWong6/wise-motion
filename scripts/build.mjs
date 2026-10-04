// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const root = fileURLToPath(new URL('../', import.meta.url));
const checking = process.argv.includes('--check');
async function output(relative, content) {
  const target = path.join(root, relative);
  if (checking) {
    if (await readFile(target, 'utf8') !== content) throw new Error('生成文件与权威定义不同：' + relative + '；请运行 node scripts/build.mjs');
  } else await writeFile(target, content);
}
const registry = JSON.parse(await readFile(path.join(root, 'catalog/registry.json'), 'utf8'));
// Freeze actual frame components and painters for offline copy; never read a private project at runtime.
const remotionFiles = {};
for (const file of new Set(registry.effects.flatMap(e => e.source.remotion?.files || []))) {
  if (path.isAbsolute(file) || file.split('/').includes('..')) throw new Error('复制源码路径越界：' + file);
  remotionFiles[file] = await readFile(path.join(root, file), 'utf8');
}
await output('catalog/remotion-sources.js', '/* Generated from registered Remotion source files. AGPL-3.0-only. */\nglobalThis.MotionRemotionSources = ' + JSON.stringify(remotionFiles).replace(/</g, '\\u003c') + ';\n');
const {describe} = createRequire(import.meta.url)('../catalog/matching.js');
await mkdir(path.join(root, 'references/effects'), {recursive: true});
await output('catalog/registry-data.js', '/* 自动生成自 registry.json；请修改权威定义后运行 node scripts/build.mjs。AGPL-3.0-only */\nglobalThis.MotionRegistry = ' + JSON.stringify(registry) + ';\n');
// 首屏三个页签数量从正式目录生成。
const tabKinds=['action','composition','illustration'];
const tabCounts=Object.fromEntries(tabKinds.map(kind=>[kind,registry.effects.filter(effect=>effect.kind===kind).length]));
const seenTabs=new Set();
const page=await readFile(path.join(root,'catalog/index.html'),'utf8');
const countedPage=page.replace(/(<button\b[^>]*data-kind="(action|composition|illustration)"[^>]*>[^<]*<span class="pill-count">)\d+(<\/span>)/g,(_,before,kind,after)=>{
  if(seenTabs.has(kind))throw new Error('目录页签重复：'+kind);
  seenTabs.add(kind);return before+tabCounts[kind]+after;
});
if(seenTabs.size!==tabKinds.length)throw new Error('目录页签数量节点缺失');
await output('catalog/index.html',countedPage);
const index = ['# 本地动效索引', '', '此索引和每项说明由 `catalog/registry.json` 生成。先按行为找候选，再读取候选说明和对应源码。明确禁项优先于视觉相似。', '', `页面入口：\`catalog/index.html\`。${registry.effects.filter(e=>e.kind==='action').length} 个单个动作、${registry.effects.filter(e=>e.kind==='illustration').length} 个插画单图、${registry.effects.filter(e=>e.kind==='composition').length} 个组合片段。`, '', '历史页签已下线；已迁入条目从正式目录使用。出处与迁移依据见 [历史来源与维护](history.md)。'];
for (const c of registry.categories) {
  index.push('', '## ' + c.name, '', ...(c.description ? [c.description, ''] : []), '| 参考 | 用途与动作 | 行为线索 | 说明 |', '|---|---|---|---|');
  for (const e of registry.effects.filter(x => x.category === c.id)) {
    index.push(`| ${e.name} | ${e.summary} | ${e.aliases.join('、')} | [按需读取](effects/${e.id}.md) |`);
    const detail = [`# ${e.name}`, '', '以下动效说明由统一定义生成。示例对象和时长是可调整的假设，结构要求需要保留。', '', describe(e, {}, registry), '', '## 调整方式', '', `播放速度：${e.parameters.speed.min}–${e.parameters.speed.max} 倍。`, e.parameters.ease ? `速度变化：${e.parameters.ease.options.map(x => ({linear:'匀速',outCubic:'末尾减速',inOutCubic:'平缓加速、减速',inOutSine:'平缓往返',spring:'轻微回弹',outBounce:'回弹缓出',outElastic:'弹性缓出',outSine:'正弦缓出'}[x])).join('、')}。` : e.tempo_note, '', `预览定位：${e.preview_ms} 毫秒。固定演示总长：${e.duration_ms} 毫秒。`, '', '## 源码与使用', '', `- [${e.source.extraction ? "原码提取与接入源码" : "自编源码"}](../../${e.source.path})，注册名称：\`${e.id}\`。`, '- [统一播放接口](../runtime-interface.md)，可播放、暂停、重播、定位时间和释放资源。', e.source.reference ? `- [效果参考：${e.source.reference.name}](${e.source.reference.url})；使用固定版本 Anime.js 4.5.0 的计时器。` : `- [Anime.js 官方文档](${e.source.reference_url})；使用固定版本 4.5.0 的计时器与速度曲线。`, e.source.extraction ? '- '+e.source.extraction+'许可为 AGPL-3.0-only。第三方 Anime.js 保留 MIT 许可。' : '- 自编效果未复制官方示例素材；许可为 AGPL-3.0-only。第三方 Anime.js 保留 MIT 许可。', '', e.actions.length ? '所用动作：' + e.actions.map(id => `[${registry.effects.find(x => x.id === id).name}](${id}.md)`).join('、') + '。' : e.kind === 'composition' ? '这是一个组合片段；目录的组合拆解对照原画，相关动作弹窗播放已登记的独立动作。' : e.kind === 'illustration' ? '这是一个插画单图，可作为组合片段的图形素材复用。' : '这是一个单个动作，可在组合片段中复用。', ''];
    for (const variant of e.variants||[]) {
      const {id,label,...fields}=variant;
      detail.push('## 示例：'+label, '', describe({...e,...fields,variant_id:id,variant_name:label},{},registry), '', `使用同一动作定义，设置 \`variant_id: "${id}"\`；目录和相关动作弹窗均可切换。`, '');
    }
    if(e.source.remotion)detail.push('## Remotion 复用', '', `- [逐帧画面组件](../../${e.source.remotion.component})与目录共用实际绘制源码。`, '- 目录“复制源码”提供完整独立工程、固定依赖版本、内嵌矢量与许可；“复制提示词”按 Remotion 当前帧驱动画面。', `- 输出画幅 ${e.source.remotion.width}×${e.source.remotion.height}，每秒 ${e.source.remotion.fps} 帧；等比保留逻辑画板，无外部图片、声音或字体请求。`, '');
    await output(`references/effects/${e.id}.md`, detail.join('\n'));
  }
}
await output('references/index.md', index.join('\n') + '\n');
console.log(checking ? '统一定义与所有生成文件一致。' : `已生成 ${registry.effects.length} 个效果说明、轻量索引和页面数据。`);
