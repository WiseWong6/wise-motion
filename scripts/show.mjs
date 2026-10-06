// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 一次打印采用某个动效所需的全部事实：画面、源码位置、依赖、可调参数、权利与可粘贴的 Remotion 片段。
import {readFile, stat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const require = createRequire(import.meta.url);
const {describe} = require('../catalog/matching.js');
const {getEffectMetadata} = await import('../remotion/clock.mjs');
const registry = JSON.parse(await readFile(path.join(root, 'catalog/registry.json'), 'utf8'));

export function findEffect(query, effects = registry.effects) {
  const text = String(query ?? '').trim();
  const lower = text.toLowerCase();
  if (!text) return {effect: null, similar: []};
  const exact = effects.find(e => e.id === text) || effects.find(e => e.name === text)
    || effects.find(e => (e.previous_names || []).includes(text));
  if (exact) return {effect: exact, similar: []};
  const similar = effects.filter(e => [e.id, e.name, ...(e.aliases || []), ...(e.previous_names || [])]
    .some(word => word && (word.toLowerCase().includes(lower) || lower.includes(word.toLowerCase())))).slice(0, 8);
  return {effect: null, similar};
}

const kindName = {action: '单个动作', composition: '组合片段', illustration: '插画素材'};
const category = id => registry.categories.find(c => c.id === id)?.name || id;

async function sizeOf(file) {
  try { return (await stat(path.join(root, file))).size; } catch { return null; }
}
const kb = bytes => bytes == null ? '文件缺失' : bytes > 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';

export async function show(effect) {
  const s = effect.source;
  const lines = [];
  lines.push(`# ${effect.name}（${effect.id}）`, `类型：${kindName[effect.kind] || effect.kind}；分类：${category(effect.category)}`, '');
  lines.push(describe(effect, {}, registry), '');
  if (effect.variants?.length) lines.push(`示例样式（variantId）：${effect.variants.map(v => `${v.id}（${v.label}）`).join('、')}`, '');
  if (effect.parameters?.ease) lines.push(`可选速度变化（ease）：${effect.parameters.ease.options.join('、')}；默认 ${effect.default_ease}`);
  lines.push('可调播放速度（speed）：0.5 至 2；改变速度只整体缩放时间，不改变动作先后。', '');

  lines.push('## 先读这些源码再决定复用、微调或原创');
  const files = [s.path, ...(s.dependencies || [])];
  for (const file of [...new Set(files)]) lines.push(`- ${file}（${kb(await sizeOf(file))}）${file === s.path ? `；入口 ${s.factory}` : '；依赖'}`);
  if (effect.actions?.length) {
    lines.push('', '组成动作：');
    for (const id of effect.actions) {
      const child = registry.effects.find(e => e.id === id);
      lines.push(`- ${child?.name || id}（${id}）`);
    }
  }
  lines.push('', '## 权利与来源', `来源类型：${s.origin}；许可：${s.license}${s.extraction ? '；' + s.extraction : ''}`);
  if (s.reference?.name) lines.push(`效果参考：${s.reference.name}${s.reference.url ? '（' + s.reference.url + '）' : ''}`);
  lines.push('素材、字体和原图的权利见 NOTICE.md 与对应素材目录的 SOURCE.json，公开发布前逐项核对。');

  const meta = getEffectMetadata(effect.id);
  const usesGl = files.includes('catalog/effects/metal-impact.js');
  lines.push('', '## 放进 Remotion 工程', '```jsx',
    `import {Sequence} from 'remotion';`,
    `import {WiseMotionEffect} from 'wise-motion-remotion';`,
    `<Sequence from={0} durationInFrames={${meta.durationInFrames}}>`,
    `  <WiseMotionEffect effectId="${effect.id}"${effect.variants?.length ? ` variantId="${effect.variants[0].id}"` : ''} />`,
    '</Sequence>', '```',
    `默认 ${meta.fps} 帧每秒时，一次播放占 ${meta.durationInFrames} 帧（${(meta.durationMs / 1000).toFixed(2)} 秒${meta.loop ? '，循环动作' : ''}）。`,
    `素材安装：node node_modules/wise-motion-remotion/scripts/install-assets.mjs public/wise-motion`);
  if (usesGl) lines.push('渲染这个动效需要 WebGL：`npx remotion render ... --gl=angle`。');
  lines.push('', '## 画面里的文字和数据',
    '动效自带的文字、数字、图标写在上面列出的源码里（通常是文件顶部的数组或字符串），组件不提供改文字的参数。',
    '要换成自己的内容就选「微调」：先 install-assets 装进目标工程，再直接编辑工程里 public/wise-motion/ 下的同名副本（不会改动技能源码），改完重新渲染看一帧确认。同一个文件里的其他动效、同一个动效的其他镜头会一起变，需要不同文字时分别处理。');
  lines.push('', '## 三选一决定', '- 复用：用途、动作阶段、保留项都与你的镜头一致，且画面里的文字和图形本来就合用（图形、素材、背景、转场常见），只换尺寸或速度。',
    '- 微调：动作结构对，但对象、颜色或节奏要改；先写清改什么，再动代码。',
    '- 原创：没有候选能表达这段变化；写出可观察的动作提示词，再实现。');
  return lines.join('\n');
}

const invokedDirectly = process.argv[1] && await realpath(process.argv[1]).then(file => file === fileURLToPath(import.meta.url), () => false);
if (invokedDirectly) {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.error('用法：node scripts/show.mjs <动效 id 或名称>\n先用 node scripts/match.mjs 找到候选，再用本命令查看细节。');
    process.exitCode = 1;
  } else {
    const {effect, similar} = findEffect(query);
    if (effect) console.log(await show(effect));
    else {
      console.error(`没有名为「${query}」的动效。`);
      if (similar.length) console.error('相近的有：\n' + similar.map(e => `- ${e.id}（${e.name}）`).join('\n'));
      else console.error('可用 node scripts/match.mjs "动作描述" 检索，或查看 references/index.md。');
      process.exitCode = 1;
    }
  }
}
