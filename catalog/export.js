/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (global) {
  'use strict';
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function prompt(effect, settings, registry) {
    const description = global.MotionMatch.describe(effect, settings, registry).split('\n').filter(line => !/^(对应参考：|源码：|来源与许可：)/.test(line)).join('\n');
    return `请实现以下动效，保留动作结构、顺序与因果关系。\n\n${description}`;
  }
  function code(effect, settings = {}) {
    if(effect.kind==='recipe')return historyCode(effect,settings);
    const definition = {id:effect.id, duration_ms:effect.duration_ms, loop:effect.loop, default_ease:effect.default_ease, parameters:effect.parameters};
    const speed = Math.min(2, Math.max(.5, Number(settings.speed) || 1));
    const ease = effect.parameters.ease?.options.includes(settings.ease) ? settings.ease : effect.default_ease;
    const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
    return `<!doctype html>
<!-- Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
保存到源码包根目录的 demo.html，与 catalog、vendor 目录并列。
自有代码使用 AGPLv3；Anime.js 使用 MIT。完整版权见 NOTICE.md。 -->
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(effect.name)} · Wise Motion</title>
  <link rel="stylesheet" href="catalog/scenes.css">
  <link rel="stylesheet" href="catalog/app.css">
  <style>
    body { display:grid; place-content:center; min-height:100vh; margin:0; overflow:auto; background:var(--soft); }
    #motion { width:min(90vw,960px); aspect-ratio:16/9; border:1px solid var(--line); border-radius:2px; }
    .demo-controls { display:flex; align-items:center; gap:12px; padding:16px 0; color:var(--ink); }
    .demo-controls input { flex:1; min-width:0; }
  </style>
</head>
<body>
  <div id="motion" class="motion-viewport" aria-label="${escape(effect.name)}"></div>
  <div class="demo-controls"><button id="play" type="button">播放</button><button id="again" type="button">重播</button><input id="time" aria-label="定位时间" type="range" min="0" max="1000" value="0"><output id="readout"></output></div>
  <script src="vendor/animejs/anime.umd.min.js"></script>
  <script src="catalog/runtime.js"></script>
  <script src="${escape(effect.source.path)}"></script>
  <script>
    const effect = ${json(definition)};
    const player = MotionRuntime.create(document.getElementById('motion'), effect, {onUpdate(state) {
      document.getElementById('time').value = 1000 * state.time / state.duration;
      document.getElementById('play').textContent = state.paused ? '播放' : '暂停';
      document.getElementById('readout').textContent = (state.time / 1000).toFixed(1) + ' / ' + (state.duration / 1000).toFixed(1) + ' 秒';
    }});
    player.setSpeed(${speed});
    player.setEase(${json(ease)});
    document.getElementById('play').onclick = () => player.paused ? player.play() : player.pause();
    document.getElementById('again').onclick = () => player.restart();
    document.getElementById('time').oninput = event => { const next = Number(event.target.value) / 1000 * effect.duration_ms; player.pause(); player.seek(next); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      player.seek(${effect.preview_ms});
    } else {
      player.play();
    }
    window.MotionDemo = player;
    window.addEventListener('pagehide', () => player.destroy());
    window.addEventListener('pageshow', event => {
      if (event.persisted && player.destroyed) location.reload();
    });
  </script>
</body>
</html>`;
  }
  function historyCode(effect,settings){
    const json=v=>JSON.stringify(v).replace(/</g,'\\u003c');
    const caseId=settings.caseId||effect.selected_entry?.id||effect.entries[0].id;
    const speed=Math.min(2,Math.max(.5,Number(settings.speed)||1));
    return `<!doctype html>
<!-- 本机历史配方预览。保存到 Wise Motion 包根目录的 demo.html。
播放器代码 AGPLv3；原作代码与素材保留各自许可。本文件依赖本机历史目录，不能视为已迁出的独立效果源码。 -->
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(effect.name)}</title><link rel="stylesheet" href="catalog/scenes.css"><link rel="stylesheet" href="catalog/history.css">
<style>body{margin:0;min-height:100vh;display:grid;place-content:center;background:#171717;color:#eee;font-family:sans-serif}#motion{width:min(90vw,960px)}.controls{display:flex;gap:12px;padding:16px}input{flex:1}</style></head>
<body><div id="motion" class="motion-viewport"></div><div class="controls"><button id="play">播放</button><button id="again">重播</button><input id="time" aria-label="定位时间" type="range" min="0" max="1000" value="0"><output id="readout"></output></div>
<script src="vendor/animejs/anime.umd.min.js"></script><script src="catalog/history-data.js"></script><script src="catalog/history-runtime.js"></script>
<script>
const effect=MotionHistory.recipes.find(e=>e.id===${json(effect.id)});
const player=MotionHistoryRuntime.create(document.getElementById('motion'),effect,{caseId:${json(caseId)},onUpdate(state){
document.getElementById('time').value=1000*state.time/state.duration;
document.getElementById('play').textContent=state.paused?'播放':'暂停';
document.getElementById('readout').textContent=(state.time/1000).toFixed(1)+' / '+(state.duration/1000).toFixed(1)+' 秒';}});
player.setSpeed(${speed});
document.getElementById('play').onclick=()=>player.paused?player.play():player.pause();
document.getElementById('again').onclick=()=>player.restart();
document.getElementById('time').oninput=e=>{const next=Number(e.target.value)/1000*player.duration;player.pause();player.seek(next);};
window.MotionDemo=player;window.addEventListener('pagehide',()=>player.destroy());
window.addEventListener('pageshow',e=>{if(e.persisted&&player.destroyed)location.reload();});
</script></body></html>`;
  }
  global.MotionExport = {prompt, code};
})(globalThis);
