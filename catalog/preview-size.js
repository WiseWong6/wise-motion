/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  // 原作在共用画板内等比居中；预览去掉画板两侧留白，保留完整原画。
  function size(definition) {
    // 独立示例已裁到自己的取景范围；导出画布可能仍是统一横幅。
    const viewport = definition.aboutlove?.viewport;
    const crop = Array.isArray(viewport) ? {width:viewport[2],height:viewport[3]} : null;
    const scene = [crop, definition.scene, definition.source?.remotion].find(candidate =>
      [candidate?.width, candidate?.height].every(value => Number.isFinite(value) && value > 0));
    if (!scene) return {width:640,height:360};
    const ratio = scene.width / scene.height;
    return {width:Math.min(640,360 * ratio),height:Math.min(360,640 / ratio)};
  }
  const api = {size};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.MotionPreview = api;
})(globalThis);
