// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const root = fileURLToPath(new URL('../', import.meta.url));
const checking = process.argv.includes('--check');
const {buildReelExtract} = await import('./build-reel-extract.mjs');
await buildReelExtract(checking);
const {buildCivilization} = await import('./build-civilization.mjs');
await buildCivilization(checking);
const {spawnSync}=await import('node:child_process');
const sceneImages=spawnSync(process.execPath,[path.join(root,'scripts/build-scene-images.mjs'),...(checking?['--check']:[])],{encoding:'utf8'});
if(sceneImages.status!==0)throw new Error(sceneImages.stderr||sceneImages.stdout||'原图片封装生成失败');
async function output(relative, content) {
  const target = path.join(root, relative);
  if (checking) {
    if (await readFile(target, 'utf8') !== content) throw new Error('生成文件与权威定义不同：' + relative + '；请运行 node scripts/build.mjs');
  } else await writeFile(target, content);
}
function contentNotes(effect){
  if(!effect.content_slots?.length)return [];
  return ['### 可替换内容', '', '通过组件 `content` 为当前实例赋值；字段含义与字体、宽度限制见 [组件说明](../../REMOTION.md)。默认内容如下：', '', '```json',
    JSON.stringify(Object.fromEntries(effect.content_slots.map(slot=>[slot.id,slot.default])),null,2),'```','',
    ...effect.content_slots.map(slot=>`- ${slot.id}（${slot.label}）：${slot.type==='records'?`${slot.min_items}–${slot.max_items} 项，字段 ${JSON.stringify(slot.fields)}`:slot.type==='number'?`${slot.min} 至 ${slot.max}${slot.integer?'，整数':''}`:`${slot.min_items!==undefined?`${slot.min_items}–${slot.max_items} 项，每项`:''}最多 ${slot.max_chars} 字`}${slot.options?'；可选 '+slot.options.join('、'):''}。`),''];
}
const registry = JSON.parse(await readFile(path.join(root, 'catalog/registry.json'), 'utf8'));
// Freeze actual frame components and painters for offline copy; never read a private project at runtime.
const remotionFiles = {};
const sharedImagesFile = 'catalog/effects/civilization-images.js';
let sharedImagesSource;
for (const file of new Set(registry.effects.flatMap(e => e.source.remotion?.files || []))) {
  if (path.isAbsolute(file) || file.split('/').includes('..')) throw new Error('复制源码路径越界：' + file);
  const content = await readFile(path.join(root, file), 'utf8');
  if (file === sharedImagesFile) sharedImagesSource = content;
  else remotionFiles[file] = content;
}
// 图片数据只存一份；用户复制独立工程时才重新组装共享图片文件。
const sharedImageParts = sharedImagesSource?.match(/^([\s\S]*?Object\.freeze\()(\{[^\n]+\})(\);\n)$/);
if (!sharedImageParts || JSON.stringify(JSON.parse(sharedImageParts[2])) !== sharedImageParts[2]) throw new Error('共享图片文件格式不完整：' + sharedImagesFile);
const sharedImageCopy = `Object.defineProperty(globalThis.MotionRemotionSources, ${JSON.stringify(sharedImagesFile)}, {enumerable:true,get(){
  if(!globalThis.WiseCivilizationImages)throw new Error('文明聚字的共享图片尚未加载');
  return ${JSON.stringify(sharedImageParts[1])}+JSON.stringify(globalThis.WiseCivilizationImages)+${JSON.stringify(sharedImageParts[3])};
}});\n`;
await output('catalog/remotion-sources.js', '/* Generated from registered Remotion source files. AGPL-3.0-only. */\nglobalThis.MotionRemotionSources = ' + JSON.stringify(remotionFiles).replace(/</g, '\\u003c') + ';\n' + sharedImageCopy);
const {describe} = createRequire(import.meta.url)('../catalog/matching.js');
await mkdir(path.join(root, 'references/effects'), {recursive: true});
await output('catalog/registry-data.js', '/* 自动生成自 registry.json；请修改权威定义后运行 node scripts/build.mjs。AGPL-3.0-only */\nglobalThis.MotionRegistry = ' + JSON.stringify(registry) + ';\n');
// 首屏三个页签数量从正式目录生成。
const tabKinds=['action','composition','illustration'];
const tabCounts=Object.fromEntries(tabKinds.map(kind=>[kind,registry.effects.filter(effect=>effect.kind===kind).length]));
const countSummary=`目录有 ${tabCounts.action} 个单个动作、${tabCounts.illustration} 个插画单图、${tabCounts.composition} 个组合片段，共 ${registry.effects.length} 项；数量由目录定义自动生成，详见 [目录统计](CATALOG-STATS.md)。`;
const readme=await readFile(path.join(root,'README.md'),'utf8');
const countBlock=/<!-- catalog-counts:start -->[\s\S]*?<!-- catalog-counts:end -->/g;
if([...readme.matchAll(countBlock)].length!==1)throw new Error('README 目录统计位置须唯一');
await output('README.md',readme.replace(countBlock,()=>`<!-- catalog-counts:start -->\n${countSummary}\n<!-- catalog-counts:end -->`));
await output('CATALOG-STATS.md',[
  '# 目录统计', '',
  '数量的唯一来源为 [目录定义](catalog/registry.json)，本页及 README 概览由 `npm run build` 自动生成，`npm run check` 核对一致性。请勿手工维护数字。', '',
  '| 类别 | 数量 |', '| --- | ---: |',
  `| 单个动作 | ${tabCounts.action} |`, `| 插画单图 | ${tabCounts.illustration} |`,
  `| 组合片段 | ${tabCounts.composition} |`, `| 合计 | ${registry.effects.length} |`, '',
  '这里统计目录条目，不统计原创作品数量、资产权利归属或跨模型制作效果。', ''
].join('\n'));
const seenTabs=new Set();
const page=await readFile(path.join(root,'catalog/index.html'),'utf8');
const countedPage=page.replace(/(<button\b[^>]*data-kind="(action|composition|illustration)"[^>]*>[^<]*<span class="pill-count">)\d+(<\/span>)/g,(_,before,kind,after)=>{
  if(seenTabs.has(kind))throw new Error('目录页签重复：'+kind);
  seenTabs.add(kind);return before+tabCounts[kind]+after;
});
if(seenTabs.size!==tabKinds.length)throw new Error('目录页签数量节点缺失');
await output('catalog/index.html',countedPage);
const index = ['# 本地动效索引', '', '此索引和每项说明由 `catalog/registry.json` 生成。按 [需求方法](method.md) 提取主体、起止状态、动作关系与禁项；简单请求直接匹配，多段动作分别找。候选只提供线索，说明覆盖与缺口，再按 [快速上手](quickstart.md) 查看或导出源码。', '', `页面入口：\`catalog/index.html\`。${registry.effects.filter(e=>e.kind==='action').length} 个单个动作、${registry.effects.filter(e=>e.kind==='illustration').length} 个插画单图、${registry.effects.filter(e=>e.kind==='composition').length} 个组合片段。`, '', '历史页签已下线；已迁入条目从正式目录使用。出处与迁移依据见 [历史来源与维护](history.md)。'];
for (const c of registry.categories) {
  index.push('', '## ' + c.name, '', ...(c.description ? [c.description, ''] : []), '| 参考 | 用途与动作 | 行为线索 | 说明 |', '|---|---|---|---|');
  for (const e of registry.effects.filter(x => x.category === c.id)) {
    index.push(`| ${e.name} | ${e.summary} | ${e.aliases.join('、')} | [按需读取](effects/${e.id}.md) |`);
    const detail = [`# ${e.name}`, '', '以下说明描述现有实现，示例对象、时长和动作结构可按需求修改；以用户明确要求为准。', '', describe(e, {}, registry), '', '## 调整方式', '', `播放速度：${e.parameters.speed.min}–${e.parameters.speed.max} 倍。`, e.parameters.ease ? `速度变化：${e.parameters.ease.options.map(x => ({linear:'匀速',outCubic:'末尾减速',inOutCubic:'平缓加速、减速',inOutSine:'平缓往返',spring:'轻微回弹',outBounce:'回弹缓出',outElastic:'弹性缓出',outSine:'正弦缓出'}[x])).join('、')}。` : e.tempo_note, '', `预览定位：${e.preview_ms} 毫秒。固定演示总长：${e.duration_ms} 毫秒。`, '', '## 源码与使用', '', `- [${e.source.extraction ? "原码提取与接入源码" : "自编源码"}](../../${e.source.path})，${e.source.factory===e.id?"注册名称":"共享绘制入口"}：\`${e.source.factory}\`。`, '- [统一播放接口](../runtime-interface.md)，可播放、暂停、重播、定位时间和释放资源。', e.source.reference ? `- ${e.source.reference.credit_prefix || '效果参考'} ${e.source.reference.url ? `[${e.source.reference.name}](${e.source.reference.url})` : e.source.reference.name}${e.source.reference.credit_suffix ? ' ' + e.source.reference.credit_suffix : '。'}` : `- [Anime.js 官方文档](${e.source.reference_url})；使用固定版本 4.5.0 的计时器与速度曲线。`, e.source.extraction ? '- '+e.source.extraction+'许可为 AGPL-3.0-only。第三方 Anime.js 保留 MIT 许可。' : '- 自编效果未复制官方示例素材；许可为 AGPL-3.0-only。第三方 Anime.js 保留 MIT 许可。', '', e.actions.length ? '所用动作：' + e.actions.map(id => `[${registry.effects.find(x => x.id === id).name}](${id}.md)`).join('、') + '。' : e.kind === 'composition' ? '这是一个组合片段；目录的组合拆解对照原画，相关动作弹窗播放已登记的独立动作。' : e.kind === 'illustration' ? '这是一个插画单图，可作为组合片段的图形素材复用。' : '这是一个单个动作，可在组合片段中复用。', ''];
    for (const reference of e.source.additional_references||[])detail.push(`补充效果参考：[${reference.name}](${reference.url})。`, '');
    if(!e.variants?.length)detail.push(...contentNotes(e));
    for (const variant of e.variants||[]) {
      const {id,label,...fields}=variant;
      detail.push('## 示例：'+label, '', describe({...e,...fields,variant_id:id,variant_name:label},{},registry), '', `使用同一动作定义，设置 \`variant_id: "${id}"\`；目录和相关动作弹窗均可切换。`, '');
      detail.push(...contentNotes({...e,...fields}));
    }
    if(e.source.remotion)detail.push('## Remotion 复用', '', `- [逐帧画面组件](../../${e.source.remotion.component})与目录共用实际绘制源码。`, '- 目录“复制源码”提供完整独立工程、固定依赖版本、内嵌矢量与许可；“复制提示词”按 Remotion 当前帧驱动画面。', `- 输出画幅 ${e.source.remotion.width}×${e.source.remotion.height}，每秒 ${e.source.remotion.fps} 帧；等比保留逻辑画板，无外部图片、声音或字体请求。`, '');
    await output(`references/effects/${e.id}.md`, detail.join('\n'));
  }
}
await output('references/index.md', index.join('\n') + '\n');
console.log(checking ? '统一定义与所有生成文件一致。' : `已生成 ${registry.effects.length} 个效果说明、轻量索引和页面数据。`);
