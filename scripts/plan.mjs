// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 字幕 → 分镜计划 → 检查 → Remotion 装配。每一步都能被脚本核对，不依赖记忆。
//   node scripts/plan.mjs init 字幕.txt 计划.json
//   node scripts/plan.mjs check 计划.json
//   node scripts/plan.mjs build 计划.json src/index.jsx
import {readFile, writeFile, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const require = createRequire(import.meta.url);
const {rank} = require('../catalog/matching.js');
const {getEffectMetadata} = await import('../remotion/clock.mjs');
const registry = JSON.parse(await readFile(path.join(root, 'catalog/registry.json'), 'utf8'));
const byId = new Map(registry.effects.map(e => [e.id, e]));

export const MODES = ['reuse', 'tweak', 'original'];
const DESIGN_FIELDS = [['subject', '看谁（主体）'], ['from', '起始状态'], ['to', '结束状态'], ['meaning', '观众由此理解什么'], ['hold', '结果停留多久、让观众看清什么'], ['handoff', '怎样交给下一镜']];
const READ_CHARS_PER_SECOND = 6;

const visibleChars = text => [...String(text).replace(/[\s，。！？；：、,.!?;:「」“”"'…—-]/g, '')].length;
const round1 = value => Math.round(value * 10) / 10;
export const sourceTag = effect => `${effect.source.path}#${effect.source.factory}`;

/* 把字幕稿切成镜头：空行分段；一行过长时按句末标点再切。 */
export function splitSubtitles(text) {
  const segments = [];
  for (const raw of String(text).replace(/\r/g, '').replace(/[「」]/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.length > 36 ? line.split(/(?<=[。！？；])/).map(s => s.trim()).filter(Boolean) : [line];
    segments.push(...parts);
  }
  return segments;
}

export function createPlan(text, options = {}) {
  const fps = options.fps ?? 30, width = options.width ?? 1920, height = options.height ?? 1080;
  const shots = splitSubtitles(text).map((subtitle, index) => {
    const chars = visibleChars(subtitle);
    const hints = rank(registry, subtitle).filter(m => m.effect.kind !== 'illustration').slice(0, 3)
      .map(m => ({id: m.effect.id, name: m.effect.name, clue: m.matched.join('、')}));
    return {
      id: 's' + String(index + 1).padStart(2, '0'), subtitle,
      seconds: Math.max(1.5, round1(chars / 5 + 0.6)),
      subject: '', from: '', to: '', meaning: '', hold: '', handoff: '',
      candidates: hints,
      effect: {mode: '', id: '', variant: '', speed: null, source: '', prompt: ''}
    };
  });
  return {version: 1, title: options.title || '', fps, width, height,
    note: 'candidates 只是词语线索，不是选择；每镜先填六个设计字段，再用 show.mjs 读源码，最后填写 effect。', shots};
}

/* 返回 {errors, warnings}；errors 为空才算通过。 */
export function checkPlan(plan) {
  const errors = [], warnings = [];
  const problem = (shot, message) => errors.push(`${shot.id || '?'}：${message}`);
  const caution = (shot, message) => warnings.push(`${shot.id || '?'}：${message}`);
  if (!plan || plan.version !== 1 || !Array.isArray(plan.shots) || !plan.shots.length) return {errors: ['计划缺少 version:1 或 shots'], warnings};
  if (!Number.isFinite(plan.fps) || plan.fps < 1 || plan.fps > 120) errors.push('fps 必须是 1 到 120 的数字');
  if (!(plan.width > 0 && plan.height > 0)) errors.push('width 和 height 必须是正数');
  const ids = new Set(), uses = new Map();
  for (const shot of plan.shots) {
    if (!shot.id || ids.has(shot.id)) problem(shot, '镜头编号缺失或重复');
    ids.add(shot.id);
    if (!String(shot.subtitle || '').trim()) problem(shot, '字幕为空');
    if (!(shot.seconds > 0)) problem(shot, 'seconds 必须是正数');
    for (const [field, label] of DESIGN_FIELDS) if (!String(shot[field] || '').trim()) problem(shot, `没有填写「${label}」（${field}）`);
    const need = visibleChars(shot.subtitle || '') / READ_CHARS_PER_SECOND + 0.3;
    if (shot.seconds > 0 && shot.seconds < need) caution(shot, `字幕 ${visibleChars(shot.subtitle)} 字，按每秒 ${READ_CHARS_PER_SECOND} 字至少需要约 ${need.toFixed(1)} 秒，当前 ${shot.seconds} 秒；有配音时以实测词点为准`);

    const effect = shot.effect || {};
    if (!MODES.includes(effect.mode)) { problem(shot, `effect.mode 必须是 ${MODES.join(' / ')}`); continue; }
    if (effect.speed != null && !(effect.speed >= 0.5 && effect.speed <= 2)) problem(shot, 'effect.speed 必须在 0.5 到 2 之间，或留空自动计算');
    const found = effect.id ? byId.get(effect.id) : null;
    if (effect.mode === 'original') {
      if (String(effect.prompt || '').trim().length < 20) problem(shot, '原创镜头必须在 effect.prompt 写出可观察的动作提示词（至少 20 字）：对象、起止状态、方向、节奏');
      if (effect.id && !found) problem(shot, `effect.id「${effect.id}」不在目录里；原创镜头可留空`);
      continue;
    }
    if (!found) { problem(shot, `effect.id「${effect.id || ''}」不在目录里；用 node scripts/match.mjs 检索，再用 show.mjs 确认`); continue; }
    if (found.kind === 'illustration') problem(shot, `「${found.name}」是插画素材，不是动作；请改选动作或组合`);
    if (effect.source !== sourceTag(found)) problem(shot, `effect.source 应为「${sourceTag(found)}」；先运行 node scripts/show.mjs ${found.id} 并阅读源码，再原样填写`);
    if (effect.mode === 'tweak' && String(effect.prompt || '').trim().length < 20) problem(shot, '微调必须在改代码前于 effect.prompt 写清改什么（至少 20 字）');
    if (effect.variant && !(found.variants || []).some(v => v.id === effect.variant)) problem(shot, `variant「${effect.variant}」不存在；可选：${(found.variants || []).map(v => v.id).join('、') || '无'}`);
    uses.set(found.id, (uses.get(found.id) || 0) + 1);
    if (shot.seconds > 0 && plan.fps > 0) {
      const base = getEffectMetadata(found.id, {fps: plan.fps, variantId: effect.variant || undefined});
      const seconds = base.durationMs / 1000;
      if (!found.loop && shot.seconds < seconds / 2 - 1e-9) problem(shot, `镜头 ${shot.seconds} 秒短于动效最快速度（2 倍）所需的 ${(seconds / 2).toFixed(2)} 秒，会被截断；加长镜头或换更短的动效`);
      else if (!found.loop && shot.seconds > seconds * 2 + 1) caution(shot, `动效最慢（0.5 倍）约 ${(seconds * 2).toFixed(1)} 秒，之后停在末帧 ${(shot.seconds - seconds * 2).toFixed(1)} 秒；确认这是有内容的阅读停留`);
    }
  }
  for (const [id, count] of uses) if (count >= 3) warnings.push(`「${byId.get(id).name}」用了 ${count} 次；整片节奏会重复，考虑换成同类的其他动效`);
  return {errors, warnings};
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function shotTiming(plan, shot) {
  const frames = Math.max(1, Math.round(shot.seconds * plan.fps));
  const effect = shot.effect;
  if (!effect.id || effect.mode === 'original') return {frames, speed: 1};
  const variantId = effect.variant || undefined;
  const natural = getEffectMetadata(effect.id, {fps: plan.fps, variantId});
  const loop = natural.loop;
  const speed = effect.speed ?? (loop ? 1 : Math.round(clamp(natural.durationMs / 1000 / shot.seconds, 0.5, 2) * 100) / 100);
  return {frames, speed, variantId};
}

export function buildJsx(plan) {
  const {errors} = checkPlan(plan);
  if (errors.length) throw new Error('计划未通过检查，不能装配：\n' + errors.join('\n'));
  let from = 0;
  const pending = [], tweak = [], reuse = [], rows = [];
  for (const shot of plan.shots) {
    const {frames, speed, variantId} = shotTiming(plan, shot);
    const label = `${shot.id} ${shot.subtitle.replace(/\*\//g, '').slice(0, 24)}`;
    if (shot.effect.mode === 'original' || !shot.effect.id) {
      pending.push(shot.id);
      rows.push(`      {/* ${label}：原创镜头，待实现 */}\n      <Sequence from={${from}} durationInFrames={${frames}} name=${JSON.stringify(shot.id)}>\n        <AbsoluteFill style={{background: '#111'}} />\n      </Sequence>`);
    } else {
      (shot.effect.mode === 'tweak' ? tweak : reuse).push({id: shot.id, effectId: shot.effect.id, file: shot.effect.source.split('#')[0]});
      const props = [`effectId="${shot.effect.id}"`, variantId ? `variantId="${variantId}"` : '', `speed={${speed}}`, `width={${plan.width}}`, `height={${plan.height}}`].filter(Boolean).join(' ');
      rows.push(`      {/* ${label} */}\n      <Sequence from={${from}} durationInFrames={${frames}} name=${JSON.stringify(shot.id)}>\n        <WiseMotionEffect ${props} />\n      </Sequence>`);
    }
    from += frames;
  }
  const source = `import React from 'react';
import {AbsoluteFill, Composition, Sequence, registerRoot} from 'remotion';
import {WiseMotionEffect} from 'wise-motion-remotion';

// 由 scripts/plan.mjs build 生成：镜头顺序、帧数和速度都来自分镜计划；改计划后重新生成，不手改帧数。
const Video = () => (
  <AbsoluteFill style={{background: '#111'}}>
${rows.join('\n')}
  </AbsoluteFill>
);

registerRoot(() => (
  <Composition id="Promo" component={Video} width={${plan.width}} height={${plan.height}} fps={${plan.fps}} durationInFrames={${from}} />
));
`;
  return {source, totalFrames: from, pending, tweak, reuse};
}

function within(base, target) {
  const relative = path.relative(base, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
async function writeOutside(target, content) {
  const absolute = path.resolve(target);
  // 全局入口可能是目录链接；先解析已有父目录，连同尚未创建的路径一起检查。
  let existing = absolute;
  const missing = [];
  let resolved;
  while (!resolved) {
    try { resolved = path.join(await realpath(existing), ...missing); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      missing.unshift(path.basename(existing));
      const parent = path.dirname(existing);
      if (parent === existing) throw error;
      existing = parent;
    }
  }
  if (within(root, resolved)) throw new Error('计划和装配文件属于你的视频工程，不能写进技能源码目录：' + absolute);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, content);
  return absolute;
}

async function main(argv) {
  const [command, input, output] = argv;
  if (command === 'init' && input) {
    const plan = createPlan(await readFile(input, 'utf8'));
    if (!plan.shots.length) throw new Error('字幕文件里没有可用的文字');
    const text = JSON.stringify(plan, null, 2) + '\n';
    if (output) console.log('已生成分镜计划骨架：' + await writeOutside(output, text) + `（${plan.shots.length} 镜）\n下一步：逐镜填写六个设计字段与 effect，再运行 check。`);
    else console.log(text);
  } else if (command === 'check' && input) {
    const {errors, warnings} = checkPlan(JSON.parse(await readFile(input, 'utf8')));
    for (const message of warnings) console.log('提醒  ' + message);
    for (const message of errors) console.log('错误  ' + message);
    console.log(errors.length ? `\n未通过：${errors.length} 个错误，${warnings.length} 个提醒。` : `\n通过：${warnings.length} 个提醒。可以运行 build 装配。`);
    process.exitCode = errors.length ? 1 : 0;
  } else if (command === 'build' && input && output) {
    const plan = JSON.parse(await readFile(input, 'utf8'));
    const {source, totalFrames, pending, tweak, reuse} = buildJsx(plan);
    const written = await writeOutside(output, source);
    console.log(`已生成：${written}\n总长 ${totalFrames} 帧（${(totalFrames / plan.fps).toFixed(1)} 秒，${plan.fps} 帧每秒）。`);
    if (pending.length) console.log(`仍有原创镜头待实现：${pending.join('、')}（已留黑底占位）。`);
    const files = list => [...new Set(list.map(item => 'public/wise-motion/' + item.file))].join('、');
    if (tweak.length) console.log(`仍有微调镜头待改：${tweak.map(item => item.id).join('、')}。现在装配的是原动效，画面里的文字、数字还是示例内容；到目标工程里编辑 ${files(tweak)}，改成你的内容后重新渲染检查。`);
    if (reuse.length) console.log(`复用镜头 ${reuse.map(item => item.id).join('、')} 按原样装配：动效自带的文字和图形不会变成你的字幕；若内容与镜头不符，改选 tweak。`);
    console.log('目标工程需安装 wise-motion-remotion 并运行 scripts/install-assets.mjs，见 REMOTION.md。');
  } else {
    console.error('用法：\n  node scripts/plan.mjs init 字幕.txt [计划.json]\n  node scripts/plan.mjs check 计划.json\n  node scripts/plan.mjs build 计划.json src/index.jsx');
    process.exitCode = 1;
  }
}

const invokedDirectly = process.argv[1] && await realpath(process.argv[1]).then(file => file === fileURLToPath(import.meta.url), () => false);
if (invokedDirectly) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
