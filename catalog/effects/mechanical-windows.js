/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const F = global.MotionFactories = global.MotionFactories || {};
  const api = global.WiseMechanicalWindows;
  function poster(root, definition) {
    const image = root.ownerDocument.createElement('img');
    image.alt = ''; image.draggable = false;
    image.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
    let gone = false, resolve, reject;
    const ready = new Promise((ok, fail) => {resolve=ok;reject=fail;});
    const loaded = () => {if (!gone) resolve();};
    const failed = () => {if (!gone) reject(new Error('手表动作预览图加载失败'));};
    image.addEventListener('load', loaded); image.addEventListener('error', failed);
    image.src = definition.source.frame_cache.poster.replace(/^catalog\//, '');
    root.replaceChildren(image);
    if (image.complete && image.naturalWidth) loaded();
    const draw = ms => {if (!gone) root.dataset.nativeFrame = String(api.frameFor(definition.variant_id&&definition.variant_id!=='standard'?definition.variant_id:definition.id, ms));};
    draw.ready = ready;
    draw.destroy = preserve => {gone=true;resolve();image.removeEventListener('load',loaded);image.removeEventListener('error',failed);if(!preserve)root.replaceChildren();};
    draw(0); return draw;
  }
  function make(root, definition) {
    return poster(root, definition.source?.frame_cache ? definition : api.definitionFor(definition.id, definition.variant_id));
  }
  for(const id of ['cross-aperture-turn','rect-aperture-breathe','three-column-aperture','next-shot-preentry'])
    F[id]=(root,_kit,definition={})=>['continuous-diagonal','vertical-column-rise','paced-overlap'].includes(definition.variant_id)
      ?global.WiseSpatialApertures.make(root,{...definition,id}):make(root,{...definition,id});
  F['mechanical-window-sequence']=(root,_kit,definition)=>make(root,definition||api.sequence);
  F['mechanical-window-sequence'].requiresPreparation=true;
  F['mechanical-window-sequence'].breakdown=api.breakdown;
  api.make=make;
})(globalThis);
