// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 一次打印采用某个动效所需的全部事实：画面、源码位置、依赖、可调参数、权利与可粘贴的 Remotion 片段。
import {readFile, stat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {layerStatus} from './layer-status.mjs';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const require = createRequire(import.meta.url);
const {describe} = require('../catalog/matching.js');
const {getEffectMetadata, resolveEffect} = await import('../remotion/clock.mjs');
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

export async function show(effect, {variantId} = {}) {
  effect = resolveEffect(effect, variantId);
  const s = effect.source;
  const lines = [];
  lines.push(`# ${effect.name}（${effect.id}）`, `类型：${kindName[effect.kind] || effect.kind}；分类：${category(effect.category)}`, '');
  lines.push(describe(effect, {}, registry), '');
  lines.push('叠层：'+(layerStatus(effect)==='overlay-ok'?'overlay-ok；当前源码已通过透明底审计，可作为 main 或 overlay':'own-background；自带底色或未通过当前源码审计，仅作为底层或单镜')+'。', '');
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

  const meta = getEffectMetadata(effect.id, {variantId: effect.variant_id});
  const usesGl = files.includes('catalog/effects/metal-impact.js');
  lines.push('', '## 放进 Remotion 工程', '```jsx',
    `import {Sequence} from 'remotion';`,
    `import {WiseMotionEffect} from 'wise-motion-remotion';`,
    `<Sequence from={0} durationInFrames={${meta.durationInFrames}}>`,
    `  <WiseMotionEffect effectId="${effect.id}"${effect.variants?.length ? ` variantId="${effect.variant_id}"` : ''} />`,
    '</Sequence>', '```',
    `默认 ${meta.fps} 帧每秒时，一次播放占 ${meta.durationInFrames} 帧（${(meta.durationMs / 1000).toFixed(2)} 秒${meta.loop ? '，循环动作' : ''}）。`,
    `素材安装：node node_modules/wise-motion-remotion/scripts/install-assets.mjs public/wise-motion`);
  if (usesGl) lines.push('渲染这个动效需要 WebGL：`npx remotion render ... --gl=angle`。');
  lines.push('', '## 画面里的文字和数据');
  if(effect.content_slots?.length){
    lines.push('将内容写进当前组件的 content，或分镜的 effect.content；每个镜头独立，不用修改素材副本。只换内容可选 reuse。',
      '不传内容或显式传入全部默认值时保持原画面；超出字数、行数或实际宽度会报错，不会静默截字。');
    for(const slot of effect.content_slots){
      const limit=slot.type==='records'?`${slot.min_items} 至 ${slot.max_items} 项；每项字段 ${JSON.stringify(slot.fields)}`:slot.type==='number'?`${slot.min} 至 ${slot.max}${slot.integer?'，整数':''}`
        :`${slot.min_items!==undefined?`${slot.min_items} 至 ${slot.max_items} 项，每项`:''}最多 ${slot.max_chars} 字${slot.allow_empty?'，可留空':''}${slot.options?'；可选 '+slot.options.join('、'):''}`;
      lines.push(`- ${slot.label}（${slot.id}）：${limit}；默认 ${JSON.stringify(slot.default)}`);
    }
    if(effect.id==='particle-word')lines.push('自定义文字等待字体后采样；64 字是资源保护上限，实际可读长度由字形宽高检查决定，过宽会报错。默认字形仍使用预存点阵。');
    if(effect.id==='count-up')lines.push('integer 是整数；decimal 固定小数位；thousands 加千分位；compact 使用 K/M/B/T。integer 的 decimals 必须为 0。');
    if(effect.id==='terminal-code')lines.push(effect.variant_id==='command-log'
      ?'日志样式保留原来九行的先后顺序、调试与成功状态；首行最多 20 字，其他行最多 40 字。'
      :'每行由 [文字, 色调] 组成；色调为 ink、muted 或 teal。每行最多 60 字，实际过宽还会报错。');
    lines.push('其他样式的内容槽可能不同；使用 --variant <样式 id> 查看对应源码、限制与时长。');
  }else lines.push('此项尚无内容槽。若需修改示例，复制列出的绘制代码及依赖到目标工程的独立实现后微调，避免修改公共素材影响其他镜头；粒子字形等预存轮廓不能靠替换普通文字完成。');
  lines.push('', '## 三选一决定', '- 复用：引用现成动作代码；动作结构合适，直接使用或通过 content 换文字和数据。',
    '- 微调：在原动作代码上修改布局、颜色或节奏；先写清改什么，再动代码。',
    '- 原创：候选的核心动作不能表达这段变化；记录 nearest 和 why。确实无候选时 nearest 填 null 并说明检索结果。只借鉴节奏再重写仍算原创。');
  return lines.join('\n');
}

const invokedDirectly = process.argv[1] && await realpath(process.argv[1]).then(file => file === fileURLToPath(import.meta.url), () => false);
if (invokedDirectly) {
  const args = process.argv.slice(2), at=args.indexOf('--variant');
  const variantId=at<0?undefined:args[at+1];
  if(at>=0&&!variantId)throw new Error('--variant 后需要样式 id');
  if(at>=0)args.splice(at,2);
  const query = args.join(' ').trim();
  if (!query) {
    console.error('用法：node scripts/show.mjs <动效 id 或名称>\n先用 node scripts/match.mjs 找到候选，再用本命令查看细节。');
    process.exitCode = 1;
  } else {
    const {effect, similar} = findEffect(query);
    if (effect) console.log(await show(effect,{variantId}));
    else {
      console.error(`没有名为「${query}」的动效。`);
      if (similar.length) console.error('相近的有：\n' + similar.map(e => `- ${e.id}（${e.name}）`).join('\n'));
      else console.error('可用 node scripts/match.mjs "动作描述" 检索，或查看 references/index.md。');
      process.exitCode = 1;
    }
  }
}
