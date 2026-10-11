/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(global){
  'use strict';
  const choices=Object.freeze({
    'precision-assembly-sequence':{start:0,frames:528,poster:'整表.png'},
    'ordered-depth-assembly':{start:240,frames:192,poster:'分层.png'}
  });
  // Both entries address the same native Cycles frames. No retiming, interpolation or redraw.
  function sample(effectId,timeMs){
    const part=choices[effectId];
    if(!part)throw new Error('未知三维片段：'+effectId);
    if(!Number.isFinite(timeMs))throw new TypeError('时间必须为有限数字');
    const local=Math.max(0,Math.min(part.frames-1,Math.floor(timeMs*24/1000+1e-9)));
    return {frame:part.start+local,blenderFrame:part.start+local+1,time:(part.start+local+.5)/24};
  }
  global.WisePrecisionAssembly=Object.freeze({choices,sample,fps:24,width:1920,height:1080});
})(globalThis);
