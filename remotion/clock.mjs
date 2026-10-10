// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import registry from '../catalog/registry.json' with {type: 'json'};

export const DEFAULT_FPS = 60;
export const MOTION_WIDTH = 640;
export const MOTION_HEIGHT = 360;
const byId = new Map(registry.effects.map(effect => [effect.id, effect]));

export function normalizeSpeed(speed = 1) {
  if (!Number.isFinite(speed)) throw new TypeError('播放速度必须是有限数字');
  return Math.min(2, Math.max(0.5, speed));
}

export function resolveEffect(effectId, variantId) {
  const definition = typeof effectId === 'object' && effectId !== null ? effectId : byId.get(effectId);
  if (!definition || !byId.has(definition.id)) throw new Error('未知动效：' + String(effectId));
  if (!definition.variants?.length) return {...definition};
  const selected = variantId ?? definition.variant_id ?? definition.variants[0].id;
  const variant = definition.variants.find(item => item.id === selected);
  if (!variant) throw new Error('未知动效变体：' + definition.id + '/' + selected);
  const {id, label, ...details} = variant;
  return {...definition, ...details, variant_id: id, variant_name: label};
}

function validateFps(fps) {
  if (!Number.isFinite(fps) || fps <= 0) throw new TypeError('帧率必须是正数');
  return fps;
}

export function getEffectMetadata(effectId, options = {}) {
  const definition = resolveEffect(options.definition ?? effectId, options.variantId);
  const fps = validateFps(options.fps ?? DEFAULT_FPS);
  const speed = normalizeSpeed(options.speed);
  const durationMs = definition.duration_ms;
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new TypeError('动效时长必须是正数');
  // 非循环片段包含准确末帧；循环末端进入下一周期，不能再加一张重复帧。
  const frameSpan = durationMs * fps / (1000 * speed);
  // 去除整帧边界的运算尾差，防止 157.00000000000003 多算一帧。
  const durationInFrames = Math.max(1, Math.ceil(frameSpan - 1e-9) + (definition.loop ? 0 : 1));
  return {effectId: definition.id, variantId: definition.variant_id, width: MOTION_WIDTH,
    height: MOTION_HEIGHT, fps, durationMs, durationInFrames, loop: Boolean(definition.loop), speed};
}

export function sampleEffectTime(effect, frame, fps = DEFAULT_FPS, options = {}) {
  const definition = typeof effect === 'string' ? resolveEffect(effect, options.variantId) : effect;
  validateFps(fps);
  if (!Number.isInteger(frame) || frame < 0) throw new TypeError('当前帧必须是非负整数');
  if (!Number.isFinite(definition?.duration_ms) || definition.duration_ms <= 0) throw new TypeError('动效时长必须是正数');
  const sampleMode = options.sampleMode ?? 'playback';
  if (sampleMode !== 'playback' && sampleMode !== 'exact') throw new TypeError('取样方式必须为 playback 或 exact');
  // 保留足够精度；原绘制函数负责源时间映射与逐格节奏，不能在此提前取整。
  const elapsed = frame * 1000 / fps * normalizeSpeed(options.speed);
  const time = definition.loop ? elapsed % definition.duration_ms : (elapsed >= definition.duration_ms - 1e-9 ? definition.duration_ms : elapsed);
  return {frame, fps, time, elapsed: definition.loop ? elapsed : time, sampleMode, playback: sampleMode === 'playback'};
}

export const effectDefinitions = registry.effects;
