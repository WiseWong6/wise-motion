/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (global) {
  'use strict';
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // 制作提示词只包含能决定画面或动作的要求，不从内部审查说明逐行拼接。
  function concrete(text) {
    return String(text||'').split(/[；。\n]/).filter(part=>!/(?:本机|验收|尚未|已核对|标准示例只|沿用原作时间与比例|具体实现及依赖见|关联标准动作属于|不能视为|固定源码和复用说明|只解释结构|未搬入|不导入静态资产|标准动作替换|观看速度|原速播放第|对应原片|保留原片.*秒|原片局部时间)/.test(part))
      .map(part=>part.replace(/原作(?:中的|中|的)?|原工程(?:中的|中|的)?|原片(?:中的|中|的)?|本地目录|目录自己的|原有/g,'').trim()).filter(Boolean)
      .filter((part,i,parts)=>parts.indexOf(part)===i).join('；');
  }
  function prompt(effect, settings = {}, registry) {
    effect = global.MotionKit.resolveVariant(effect, settings.variantId || effect.variant_id);
    const entry=effect.kind==='recipe'?(effect.entries.find(e=>e.id===settings.caseId)||effect.selected_entry||effect.entries[0]):null;
    const detail=entry?{...effect,...entry.definition}:effect, spec=detail.reproduction||{};
    const speed=Math.min(2,Math.max(.5,Number(settings.speed)||1));
    const easing=effect.parameters.ease?(settings.ease||effect.default_ease):effect.default_ease;
    const duration=(entry?entry.preview.duration:effect.duration_ms/1000)/speed;
    const phases=(spec.phases||detail.phases).map(concrete).filter(Boolean);
    const lines=[
      '请使用 Remotion 实现以下动效，按对象、步骤、时间和参数制作。保留原绘制公式、素材和字体，由视频帧统一驱动时间。',
      '',
      '动效说明：'+effect.name,
      ...(effect.variant_name?['示例样式：'+effect.variant_name]:[]),
      '画面与对象：'+concrete(spec.objects||detail.objects),
      ...(spec.presentation?['构图与配色：'+spec.presentation]:entry?['构图：3:4 画幅，单个主体等比居中；多个对象保留相互位置，边缘留足空间。']:['构图：16:9 画幅，设计尺寸 640×360；主体清晰居中，按画幅等比缩放。']),
      '动作步骤：',...phases.map((phase,i)=>String(i+1)+'. '+concrete(phase)),
      '时间：'+duration.toFixed(2)+' 秒'+(effect.loop?'为一个周期，首尾连续循环。':'完成一次，结束后保持最终状态。')
    ];
    if(entry){
      const parameters=concrete(spec.parameters||detail.source_parameters);
      if(parameters)lines.push('实现参数：'+parameters);
      lines.push('动作时钟：动作秒数 = 实际播放秒数 × '+speed+'；触发和衰减参数按动作秒数计算。');
      lines.push('计算方式：以统一秒数驱动，每次定位到同一时刻呈现相同状态；粒子或随机分布在初始化时固定。');
      if(detail.review.document_contract)lines.push('文字与讲述：'+Object.values(detail.review.document_contract).map(concrete).filter(Boolean).join('；'));
    } else {
      lines.push('速度变化：'+(global.MotionMatch.easeLabels[easing]||easing)+'。');
      if(effect.timing)lines.push('时间安排：'+(effect.timing.start_ms/1000/speed).toFixed(2)+' 秒开始主要动作，'+(effect.timing.end_ms/1000/speed).toFixed(2)+' 秒完成；其余时间保持最终状态。');
      else {const tempo=concrete(effect.tempo_note);if(tempo)lines.push('动作节拍：'+tempo);}
      if(effect.kind!=='illustration'&&!spec.presentation)lines.push('视觉：近黑底 #0a0a0b、暖白文字 #f4f1ea，强调色 #ff5a1f、#9b86ff、#65d4ca。中文标题使用思源黑体粗体，正文使用细体；英文和数字使用 Oswald 粗体。画板字号为 10、12、16、24、32、48、64 像素，字形造型和词云保留大小变化。');
      const trigger=concrete(effect.trigger);
      if(trigger&&!/打开预览|打开后按固定|固定时间表演示|可暂停和定位|时间表用于观察/.test(trigger))lines.push('触发与联动：'+trigger);
    }
    const retain=concrete(spec.retain||detail.retain),avoid=concrete(spec.avoid||detail.avoid);
    if(retain)lines.push('需要保留：'+retain);
    if(avoid)lines.push('实现限制：'+avoid);
    if(entry)for(const note of new Set(entry.cases.map(c=>concrete(c.note)).filter(Boolean)))if(!phases.some(p=>concrete(p)===note)&&note!==retain)lines.push('动作细节：'+note);
    const paper=effect.id==='dither-lab-book'&&settings.bookSettings;
    if(paper)lines.push('纸页设置：图片留白 '+paper.padding+' 像素，图片圆角 '+paper.radius+' 像素，书脊阴影 '+paper.crease+'%。');
    const layers=effect.kind==='composition'&&global.MotionFactories?.[effect.id]?.breakdown;
    if(layers)lines.push('', '组成图层（共用秒数）：',...layers.map(layer=>concrete(layer.name)+' · '+(layer.start/1000/speed).toFixed(2)+'–'+(layer.end/1000/speed).toFixed(2)+' 秒：'+concrete(layer.detail)));
    return lines.join('\n');
  }
  function code(effect, settings = {}) {
    if(effect.kind==='recipe')return historySource(effect,settings);
    effect = global.MotionKit.resolveVariant(effect, settings.variantId || effect.variant_id);
    if(effect.source.remotion)return remotionSource(effect,settings);
    return catalogCode(effect,settings);
  }
  function remotionSource(effect,settings){
    const spec=effect.source.remotion,speed=Math.min(2,Math.max(.5,Number(settings.speed)||1));
    const files=Object.fromEntries(spec.files.map(file=>{
      const content=global.MotionRemotionSources?.[file];
      if(typeof content!=='string')throw Error('缺少已打包的绘制源码：'+file);
      return [file,content];
    }));
    const durationInFrames=Math.ceil(Math.round(effect.duration_ms/1000*spec.fps*1e6)/1e6/speed);
    files['package.json']=JSON.stringify({name:'seed-bloom-motion',private:true,type:'module',scripts:{studio:'remotion studio index.jsx',render:'remotion render index.jsx Motion out/motion.mp4'},dependencies:spec.packages},null,2)+'\n';
    files['index.jsx']=`import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {SeedBloomBrand} from './${spec.component}';
const Root=()=> <Composition id="Motion" component={SeedBloomBrand}
  width={${spec.width}} height={${spec.height}} fps={${spec.fps}} durationInFrames={${durationInFrames}}
  defaultProps={${JSON.stringify({effectId:effect.id,speed})}} />;
registerRoot(Root);
`;
    files['README.md']='# '+effect.name+'\n\n运行 npm install，再运行 npm run studio 或 npm run render。\n\n画幅 '+spec.width+'×'+spec.height+'；每秒 '+spec.fps+' 帧；'+durationInFrames+' 帧。图形、材质与 Outfit Medium 矢量轮廓已内嵌；无外部图片、声音或运行时字体。保持原逻辑画板1066×600，改画幅时等比容纳。\n\n自有程序 AGPL-3.0-only，见 LICENSE；字形 SIL OFL 1.1，见 catalog/fonts/OFL-Outfit.txt。Remotion、React 等依赖遵循各自软件包附带许可。\n';
    const lines=['# '+effect.name+' · Remotion 完整工程','','将以下文件按标题路径保存到同一空目录。'];
    for(const [file,content]of Object.entries(files)){
      const fence='`'.repeat(Math.max(3,...Array.from(content.matchAll(/`+/g),m=>m[0].length+1)));
      const language=/\.jsx?$/.test(file)?'jsx':file.endsWith('.json')?'json':'';
      lines.push('','## '+file,'',fence+language,content,fence);
    }
    return lines.join('\n');
  }
  function catalogCode(effect, settings = {}) {
    effect = global.MotionKit.resolveVariant(effect, settings.variantId || effect.variant_id);
    const definition = {id:effect.id, duration_ms:effect.duration_ms, loop:effect.loop, default_ease:effect.default_ease, parameters:effect.parameters};
    if(effect.id==='motion-oasis-sequence'&&global.WiseMotionOasis)definition.catalog_data=global.WiseMotionOasis.catalogData(global.MotionRegistry);
    if(effect.variant_id)definition.variant_id=effect.variant_id;
    if(effect.timing)definition.timing=effect.timing;
    if(effect.id==='dither-lab-book' && settings.bookSettings)definition.paper_settings=settings.bookSettings;
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
  ${[...new Set([...(effect.source.dependencies||[]),effect.source.path])].map(file=>`<script src="${escape(file)}"></script>`).join('\n  ')}
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
    player.play();
    window.MotionDemo = player;
    window.addEventListener('pagehide', () => player.destroy());
    window.addEventListener('pageshow', event => {
      if (event.persisted && player.destroyed) location.reload();
    });
  </script>
</body>
</html>`;
  }
  function historySource(effect,settings){
    const entry=effect.entries.find(e=>e.id===settings.caseId)||effect.selected_entry||effect.entries[0];
    const files=global.MotionHistory.source_files;
    const lines=['# '+effect.name+' · '+entry.name,'','将以下文件按各标题的相对路径保存。'];
    if(entry.source_packages.length)lines.push('依赖包：'+entry.source_packages.join('、')+'。');
    if(entry.source_inputs.length)lines.push('素材输入：'+entry.source_inputs.join('、')+'。');
    for(const file of entry.source_files){
      const source=files[file],ext=source.name.split('.').pop(),language={js:'javascript',mjs:'javascript',cjs:'javascript',ts:'typescript',tsx:'tsx',jsx:'jsx',json:'json',svg:'xml',glsl:'glsl'}[ext]||'';
      const tick=String.fromCharCode(96),fence=tick.repeat(Math.max(3,...Array.from(source.content.matchAll(new RegExp(tick+'+','g')),m=>m[0].length+1)));
      lines.push('','## '+source.name,'',fence+language,source.content,fence);
    }
    return lines.join('\n');
  }
  function previewCode(effect,settings={}){
    return effect.kind==='recipe'?historyCode(effect,settings):catalogCode(effect,settings);
  }
  function historyCode(effect,settings){
    const json=v=>JSON.stringify(v).replace(/</g,'\\u003c');
    const caseId=settings.caseId||effect.selected_entry?.id||effect.entries[0].id;
    const speed=Math.min(2,Math.max(.5,Number(settings.speed)||1));
    return `<!doctype html>
<!-- 本机历史配方预览。保存到 Wise Motion 包根目录的 demo.html。
播放器代码 AGPLv3；原作代码与素材保留各自许可。本文件依赖本机历史目录，不能视为已迁出的独立效果源码。 -->
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(effect.name)}</title><link rel="stylesheet" href="catalog/scenes.css"><link rel="stylesheet" href="catalog/history.css"><link rel="stylesheet" href="catalog/app.css">
<style>body{margin:0;min-height:100vh;display:grid;place-content:center;background:var(--canvas);color:var(--ink);font-family:var(--font)}#motion{width:min(90vw,960px)}.controls{display:flex;gap:12px;padding:16px}input{flex:1}</style></head>
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
player.play();
window.MotionDemo=player;window.addEventListener('pagehide',()=>player.destroy());
window.addEventListener('pageshow',e=>{if(e.persisted&&player.destroyed)location.reload();});
</script></body></html>`;
  }
  function remotionCode(effect, settings = {}) {
    if(effect.kind==='recipe')return historySource(effect,settings);
    effect=global.MotionKit.resolveVariant(effect,settings.variantId||effect.variant_id);
    if(effect.source.remotion)return remotionSource(effect,settings);
    const props={effectId:effect.id,speed:Math.min(2,Math.max(.5,Number(settings.speed)||1)),theme:document.documentElement.dataset.theme||'dark'};
    if(effect.variant_id)props.variantId=effect.variant_id;
    if(effect.parameters.ease)props.ease=settings.ease||effect.default_ease;
    if(effect.id==='dither-lab-book'&&settings.bookSettings)props.bookSettings=settings.bookSettings;
    const files=[...new Set(['vendor/animejs/anime.umd.min.js','catalog/runtime.js',...(effect.source.dependencies||[]),effect.source.path])];
    const renderFlags=effect.source.path==='catalog/effects/metal-impact.js'?' --gl=angle':'';
    return `/* ${effect.name} · Remotion 组件示例，保存为 src/Root.jsx。
自有代码 AGPL-3.0-only；第三方和素材许可见源码包 NOTICE.md。

先从 Wise Motion 工程执行 npm run build:remotion && npm pack，得到完整源码包。
在独立目标工程安装该 .tgz 文件，以及相同版本的依赖：
npm install --save-exact ./wise-motion-remotion-0.1.3.tgz react@19.3.0 react-dom@19.3.0 remotion@4.0.532 @remotion/cli@4.0.532
node node_modules/wise-motion-remotion/scripts/install-assets.mjs public/wise-motion
将 src/index.jsx 写为：import {registerRoot} from 'remotion'; import {Root} from './Root'; registerRoot(Root);
npx remotion render src/index.jsx Effect output.mp4${renderFlags}

组件内部仍使用原绘制代码；这些实际文件和全部字体、图片、材质随包携带：
${files.join('\n')}
素材明细见包内 ASSET-MANIFEST.json。安装后只访问目标工程 public/wise-motion，
不依赖原目录或本机绝对地址。视频使用固定演示动作；时钟为每秒 60 帧。
*/
import React from 'react';
import {Composition} from 'remotion';
import {WiseMotionEffect,getEffectMetadata} from 'wise-motion-remotion';
const settings = ${JSON.stringify(props,null,2)};
const meta = getEffectMetadata(settings.effectId,settings);
export const Effect = () => <WiseMotionEffect {...settings} />;
export const Root = () => <Composition id="Effect" component={Effect}
  width={meta.width} height={meta.height} fps={meta.fps}
  durationInFrames={meta.durationInFrames} />;
`;
  }
  global.MotionExport = {prompt, code, previewCode, remotionCode};
})(globalThis);
