// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {layerStatus} from './layer-status.mjs';
import {getEffectMetadata, resolveEffect} from '../remotion/clock.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const {describe} = createRequire(import.meta.url)('../catalog/matching.js');
const registry = JSON.parse(await readFile(path.join(root, 'catalog/registry.json'), 'utf8'));

export function findEffect(query, effects = registry.effects) {
  const text = String(query ?? '').trim(), lower = text.toLowerCase();
  if (!text) return {effect: null, similar: []};
  const exact = effects.find(e => e.id === text) || effects.find(e => e.name === text)
    || effects.find(e => (e.previous_names || []).includes(text));
  if (exact) return {effect: exact, similar: []};
  const similar = effects.filter(e => [e.id, e.name, ...(e.aliases || []), ...(e.previous_names || [])]
    .some(word => word && (word.toLowerCase().includes(lower) || lower.includes(word.toLowerCase())))).slice(0, 8);
  return {effect: null, similar};
}

export function selectEffect(query, variantId) {
  const {effect, similar} = findEffect(query);
  if (!effect) throw Error(`没有名为「${query}」的动效。` + (similar.length ? '\n相近的有：' + similar.map(e => `${e.id}（${e.name}）`).join('、') : '请用 match.mjs 检索动作描述。'));
  if (variantId && !effect.variants?.some(v => v.id === variantId)) throw Error(`未知动效变体：${effect.id}/${variantId}`);
  return resolveEffect(effect, variantId);
}

export async function show(effect, {variantId, details = false} = {}) {
  if (variantId && !effect.variants?.some(v => v.id === variantId)) throw Error(`未知动效变体：${effect.id}/${variantId}`);
  effect = resolveEffect(effect, variantId);
  const s = effect.source, native = s.remotion;
  const meta = getEffectMetadata(effect.id, {variantId: effect.variant_id});
  const preview = pathToFileURL(path.join(root, 'catalog/index.html')); preview.hash = effect.id;
  const lines = [
    `${effect.name}（${effect.id}）${effect.variant_id ? `；样式 ${effect.variant_id}（${effect.variant_name}）` : ''}`,
    `用途：${effect.summary}`,
    `预览：${preview.href}${effect.variant_id ? '；目录中选择上述样式' : ''}`,
    `源码：${path.join(root, native?.component || s.path)}；入口 ${native?.export_name || (native ? 'SeedBloomBrand' : s.factory)}`,
    `时长：${effect.duration_ms / 1000} 秒；${effect.loop ? '循环' : '单次'}；${native?.width || meta.width}×${native?.height || meta.height}，${native?.fps || meta.fps} 帧/秒。`,
    `透明背景：${layerStatus(effect) === 'overlay-ok' ? '当前实现支持（transparent）' : '自带背景或尚未通过透明审计'}。`,
    `依赖：${native ? Object.entries(native.packages).map(([name, version]) => name + '@' + version).join('、') : 'wise-motion 共享包；React 19.3.0、Remotion / CLI 4.0.532；运行前安装包内素材'}。`,
    `可调：speed 0.5–2${effect.variants?.length ? '；variantId：' + effect.variants.map(v => v.id).join('、') : ''}${effect.parameters?.ease ? '；ease：' + effect.parameters.ease.options.join('、') : ''}${effect.content_slots?.length ? '；content：' + effect.content_slots.map(slot => slot.id).join('、') : ''}。`,
    `导出：node "${path.join(root, 'scripts/export.mjs')}" ${effect.id}${effect.variant_id ? ' --variant ' + effect.variant_id : ''} --out-dir <目标目录>`
  ];
  if ([s.path, ...(s.dependencies || [])].includes('catalog/effects/metal-impact.js')) lines.push('渲染需要 WebGL：--gl=angle。');
  if (effect.audio?.tracks?.length) lines.push(`声音：${effect.audio.tracks.length} 条原音轨随包提供；includeAudio={false} 可关闭。`);
  if (!details) { lines.push('详细动作、依赖文件和内容限制：加 --details。'); return lines.join('\n'); }
  lines.push('', '动作说明（当前实现的默认行为，可按需求改动）：', describe(effect, {}, registry), '', '源码和素材：');
  for (const file of new Set([s.path, ...(s.dependencies || []), ...(s.assets || []), ...(native?.files || [])])) lines.push(path.join(root, file));
  if (effect.content_slots?.length) {
    lines.push('', 'content 字段（超限会报错，不会静默截字）：');
    for (const slot of effect.content_slots) lines.push(JSON.stringify(slot));
  } else lines.push('', '当前没有内容字段接口；需要改画面时由调用方修改实际绘制源码。');
  lines.push('', `来源与许可：${s.license}；${path.join(root, 'NOTICE.md')}。`, `接入说明：${path.join(root, 'REMOTION.md')}。`);
  return lines.join('\n');
}

const invokedDirectly = process.argv[1] && await realpath(process.argv[1]).then(file => file === fileURLToPath(import.meta.url), () => false);
if (invokedDirectly) {
  try {
    const args = process.argv.slice(2), words = []; let variantId, details = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--details') details = true;
      else if (args[i] === '--variant') {
        variantId = args[++i]; if (!variantId || variantId.startsWith('--')) throw Error('--variant 后需要样式编号');
      } else if (args[i].startsWith('--')) throw Error('未知选项：' + args[i]);
      else words.push(args[i]);
    }
    if (!words.length) throw Error('用法：node scripts/show.mjs <编号或名称> [--variant <样式>] [--details]');
    console.log(await show(selectEffect(words.join(' '), variantId), {details}));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
