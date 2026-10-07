// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 字幕 → 分镜计划 → 检查 → Remotion 装配。每一步都能被脚本核对，不依赖记忆。
//   node scripts/plan.mjs init 字幕.txt 计划.json
//   node scripts/plan.mjs check 计划.json
//   node scripts/plan.mjs build 计划.json src/index.jsx
import {readFile, writeFile, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {layerStatus} from './layer-status.mjs';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const require = createRequire(import.meta.url);
const {rank} = require('../catalog/matching.js');
const {getEffectMetadata, resolveEffect} = await import('../remotion/clock.mjs');
const {validateContent} = require('../catalog/content.js');
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
      .map(m => ({id: m.effect.id, name: m.effect.name, clue: m.matched.join('、'), content_slots: (m.effect.content_slots||[]).map(slot=>slot.id), variants: (m.effect.variants||[]).map(v=>({id:v.id,content_slots:(v.content_slots||m.effect.content_slots||[]).map(slot=>slot.id)}))}));
    return {
      id: 's' + String(index + 1).padStart(2, '0'), subtitle,
      seconds: Math.max(1.5, round1(chars / 5 + 0.6)),
      subject: '', from: '', to: '', meaning: '', hold: '', handoff: '',
      candidates: hints,
      effect: {mode: '', id: '', variant: '', speed: null, source: '', prompt: '', content: {}, nearest: '', why: ''}
    };
  });
  return {version: 1, title: options.title || '', fps, width, height,
    note: 'candidates 只是词语线索，不是选择；每镜先填六个设计字段，再用 show.mjs 读源码，最后填写 effect。', shots};
}

/* 返回 {errors, warnings}；errors 为空才算通过。 */
export function checkPlan(plan, {expanded = false} = {}) {
  const errors = [], warnings = [];
  const problem = (shot, message) => errors.push(`${shot.id || '?'}：${message}`);
  const caution = (shot, message) => warnings.push(`${shot.id || '?'}：${message}`);
  if (!plan || plan.version !== 1 || !Array.isArray(plan.shots) || !plan.shots.length) return {errors: ['计划缺少 version:1 或 shots'], warnings};
  if(plan.shots.some(shot=>!shot||typeof shot!=='object'||Array.isArray(shot)))return {errors:['每个镜头必须是对象'],warnings};
  for(const shot of plan.shots){
    if(typeof shot.id!=='string'||!shot.id.trim())problem(shot,'镜头编号必须是非空文字');
    if(typeof shot.subtitle!=='string')problem(shot,'字幕必须是文字');
  }
  if (!Number.isFinite(plan.fps) || plan.fps < 1 || plan.fps > 120) errors.push('fps 必须是 1 到 120 的数字');
  if (![plan.width,plan.height].every(value=>Number.isSafeInteger(value)&&value>0)) errors.push('width 和 height 必须是有限正整数');
  if(plan.shots.some(shot=>shot.layers !== undefined)) {
    const expanded=[];
    for(const shot of plan.shots){
      if(shot.layers === undefined){expanded.push(shot);continue;}
      if(shot.effect !== undefined)problem(shot,'effect 与 layers 二选一，不能同时填写');
      if(!Array.isArray(shot.layers)||shot.layers.length<1||shot.layers.length>3){problem(shot,'layers 需要 1 至 3 层');continue;}
      const roles=['background','main','overlay'],seen=new Set();let previous=-1;
      for(const layer of shot.layers){
        if(!layer||typeof layer!=='object'){problem(shot,'每层必须是对象');continue;}
        const order=roles.indexOf(layer.role);
        if(order<0||order<=previous||seen.has(layer.role))problem(shot,'层按 background、main、overlay 顺序排列，每种最多一层');
        previous=order;seen.add(layer.role);
        if(layer.role!=='background'){
          if(layer.mode!=='reuse')problem(shot,'微调和原创层只支持 background；上层使用通过透明审计且未改绘制的目录动效');
          else {try {if(layerStatus(resolveEffect(layer.id,layer.variant||undefined))!=='overlay-ok')problem(shot,'上层未通过当前源码的透明审计：'+layer.id);}catch(error){problem(shot,error.message);}}
        }
        if(layer.box!==undefined){const b=layer.box;
          if(!b||!['x','y','width','height'].every(key=>Number.isFinite(b[key]))||b.x<0||b.y<0||b.width<=0||b.height<=0||b.x+b.width>plan.width||b.y+b.height>plan.height)problem(shot,'box 的位置和尺寸必须在画板内');
        }
        const {layers,...single}=shot;expanded.push({...single,id:shot.id+'/'+layer.role,effect:layer});
      }
      if(!seen.has('main'))problem(shot,'layers 必须有 main 主体层');
      caution(shot,'叠层共用镜头时长；请核对 box 内文字的可读大小、重叠和停留，透明审计不代表构图通过');
    }
    const checked=checkPlan({...plan,shots:expanded},{expanded:true});
    return {errors:[...errors,...checked.errors],warnings:[...warnings,...checked.warnings]};
  }
  const ids = new Set(), uses = new Map(), originals = [];
  for (const shot of plan.shots) {
    if (!shot.id || ids.has(shot.id)) problem(shot, '镜头编号缺失或重复');
    ids.add(shot.id);
    if (!String(shot.subtitle || '').trim()) problem(shot, '字幕为空');
    if (!(Number.isFinite(shot.seconds)&&shot.seconds>0)) problem(shot, 'seconds 必须是有限正数');
    for (const [field, label] of DESIGN_FIELDS) if (!String(shot[field] || '').trim()) problem(shot, `没有填写「${label}」（${field}）`);
    const need = visibleChars(shot.subtitle || '') / READ_CHARS_PER_SECOND + 0.3;
    if (shot.seconds > 0 && shot.seconds < need) caution(shot, `字幕 ${visibleChars(shot.subtitle)} 字，按每秒 ${READ_CHARS_PER_SECOND} 字至少需要约 ${need.toFixed(1)} 秒，当前 ${shot.seconds} 秒；有配音时以实测词点为准`);

    const effect = shot.effect || {};
    if(!expanded&&effect.box!==undefined)problem(shot,'box 仅用于 layers 中的层');
    if (!MODES.includes(effect.mode)) { problem(shot, `effect.mode 必须是 ${MODES.join(' / ')}`); continue; }
    if (effect.component !== undefined) {
      if (effect.mode === 'reuse') problem(shot, '复用直接使用目录组件；接入独立修改的组件时应选择 tweak');
      if (!effect.component || !/^\.{1,2}\/[A-Za-z0-9_./-]+\.(jsx|tsx|js|mjs)$/.test(effect.component.path || '') || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(effect.component.export || '')) problem(shot, 'component 需要相对生成文件的源码路径 path 和导出名称 export');
    } else if (effect.mode === 'tweak') {
      caution(shot, '微调尚未填写 component；在目标工程中实现独立组件，缺少实现时渲染会报错');
    }
    if (effect.speed != null && !(Number.isFinite(effect.speed) && effect.speed >= 0.5 && effect.speed <= 2)) problem(shot, 'effect.speed 必须在 0.5 到 2 之间，或留空自动计算');
    const found = effect.id ? byId.get(effect.id) : null;
    if (effect.mode === 'original') {
      if (effect.content !== undefined && (typeof effect.content !== 'object' || effect.content === null || Array.isArray(effect.content) || Object.keys(effect.content).length)) problem(shot, '原创镜头不能填目录 content；使用目录内容槽时应选择 reuse 或 tweak');
      if (String(effect.prompt || '').trim().length < 20) problem(shot, '原创镜头必须在 effect.prompt 写出可观察的动作提示词（至少 20 字）：对象、起止状态、方向、节奏');
      const nearest = effect.nearest ? byId.get(effect.nearest) : null;
      if ((!nearest || nearest.kind === 'illustration') && effect.nearest !== null) problem(shot, '原创镜头必须在 effect.nearest 填目录里最接近的动作 id；检索后确实无候选时填 null，并在 why 写清检索内容和缺口');
      if (String(effect.why || '').trim().length < 15) problem(shot, '原创镜头必须在 effect.why 说明最接近的候选核心动作为什么不能表达这一镜（至少 15 字）');
      originals.push(shot.id);
      if (effect.id && !found) problem(shot, `effect.id「${effect.id}」不在目录里；原创镜头可留空`);
      continue;
    }
    if (!found) { problem(shot, `effect.id「${effect.id || ''}」不在目录里；用 node scripts/match.mjs 检索，再用 show.mjs 确认`); continue; }
    let selected;
    try { selected = resolveEffect(found.id, effect.variant || undefined); validateContent(selected, effect.content); }
    catch (error) { problem(shot, error.message); continue; }
    if(selected.content_slots?.length){
      const values=Object.fromEntries(selected.content_slots.map(slot=>[slot.id,effect.content?.[slot.id]??slot.default]));
      caution(shot, `人工核对画面内容与字幕是否对应（${JSON.stringify(values)}）；脚本只验证内容格式和时长，不判断语义一致`);
    }
    if (found.kind === 'illustration') problem(shot, `「${found.name}」是插画素材，不是动作；请改选动作或组合`);
    if (effect.source !== sourceTag(selected)) problem(shot, `effect.source 应为「${sourceTag(selected)}」；先运行 node scripts/show.mjs ${found.id}${effect.variant ? ' --variant '+effect.variant : ''} 并阅读源码，再原样填写`);
    if (effect.mode === 'tweak' && String(effect.prompt || '').trim().length < 20) problem(shot, '微调必须在改代码前于 effect.prompt 写清改什么（至少 20 字）');
    if (effect.variant && !(found.variants || []).some(v => v.id === effect.variant)) problem(shot, `variant「${effect.variant}」不存在；可选：${(found.variants || []).map(v => v.id).join('、') || '无'}`);
    uses.set(found.id, (uses.get(found.id) || 0) + 1);
    if (shot.seconds > 0 && plan.fps > 0) {
      const base = getEffectMetadata(found.id, {fps: plan.fps, variantId: effect.variant || undefined});
      const seconds = base.durationMs / 1000;
      if (!base.loop && Number.isFinite(effect.speed) && shot.seconds < seconds / effect.speed - 1 / plan.fps) problem(shot, '镜头短于指定速度所需时长，会被截断；延长镜头或提高 speed');
      else if (!base.loop && shot.seconds < seconds / 2 - 1e-9) problem(shot, `镜头 ${shot.seconds} 秒短于动效最快速度（2 倍）所需的 ${(seconds / 2).toFixed(2)} 秒，会被截断；加长镜头或换更短的动效`);
      else if (!base.loop && shot.seconds > seconds * 2 + 1) caution(shot, `动效最慢（0.5 倍）约 ${(seconds * 2).toFixed(1)} 秒，之后停在末帧 ${(shot.seconds - seconds * 2).toFixed(1)} 秒；确认这是有内容的阅读停留`);
    }
  }
  if (originals.length) warnings.push(`原创镜头 ${originals.join('、')}：人工核对候选与不适用原因；检查脚本不能判断动作是否合适，不设置原创比例要求。只参考节奏后重写的仍标为原创`);
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
  const pending = [], tweak = [], reuse = [], rows = [], imports = [];
  for (const shot of plan.shots) {
    const frames=Math.max(1,Math.round(shot.seconds*plan.fps));
    for(const effect of shot.layers||[shot.effect]){
      const name=shot.layers ? shot.id+'/'+effect.role : shot.id;
      const {speed, variantId}=shotTiming(plan,{...shot,effect});
      const label=`${name} ${shot.subtitle.slice(0,24)}`.replace(/\*\//g,'').replace(/[\r\n]/g,' ');
      const box=(shot.layers&&effect.box)||{width:plan.width,height:plan.height};
      const props=[variantId?`variantId="${variantId}"`:'',effect.content!==undefined?`content={${JSON.stringify(effect.content)}}`:'',shot.layers&&effect.role!=='background'?'transparent={true}':'',`speed={${speed}}`,`width={${box.width}}`,`height={${box.height}}`].filter(Boolean).join(' ');
      let node;
      if(effect.mode!=='reuse'){
        if(effect.mode==='tweak')tweak.push({id:name,effectId:effect.id,file:effect.source.split('#')[0]});
        if(effect.component){
          const alias='Scene'+imports.length;
          imports.push(`import {${effect.component.export} as ${alias}} from ${JSON.stringify(effect.component.path)};`);
          node=effect.mode==='tweak'?`<${alias} ${props} />`:`<${alias} />`;
        }else{
          pending.push(name);
          node=`<PendingImplementation name=${JSON.stringify(name)} mode="${effect.mode==='tweak'?'微调':'原创'}" />`;
        }
      }else{
        reuse.push({id:name,effectId:effect.id,file:effect.source.split('#')[0]});
        node=`<WiseMotionEffect effectId="${effect.id}" ${props} />`;
      }
      if(shot.layers){const b=effect.box||{x:0,y:0,width:plan.width,height:plan.height};node=`<div style={${JSON.stringify({position:'absolute',left:b.x,top:b.y,width:b.width,height:b.height,overflow:'hidden'})}}>${node}</div>`;}
      rows.push(`      {/* ${label}${effect.mode!=='reuse'&&!effect.component?'：'+(effect.mode==='tweak'?'微调':'原创')+'镜头，待实现':''} */}
      <Sequence from={${from}} durationInFrames={${frames}} name=${JSON.stringify(name)}>
        ${node}
      </Sequence>`);
    }
    from += frames;
  }
  const usesPackage = reuse.length > 0;
  const source = `import React from 'react';
import {AbsoluteFill, Composition, Sequence, registerRoot} from 'remotion';
${usesPackage ? "import {WiseMotionEffect} from 'wise-motion-remotion';\n" : ''}${imports.join('\n')}
${pending.length ? "const PendingImplementation = ({name, mode}) => {throw new Error(mode+'镜头尚未实现：'+name+'；请在计划中填写 component');};" : ''}
// 镜头顺序、帧数和速度来自计划；微调和原创组件保存在独立文件，重新 build 不会覆盖。
const Video = () => (
  <AbsoluteFill style={{background: '#111'}}>
${rows.join('\n')}
  </AbsoluteFill>
);
registerRoot(() => (
  <Composition id="Promo" component={Video} width={${plan.width}} height={${plan.height}} fps={${plan.fps}} durationInFrames={${from}} />
));
`;
  return {source, totalFrames: from, pending, tweak, reuse, usesPackage};
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
    const {source, totalFrames, pending, tweak, reuse, usesPackage} = buildJsx(plan);
    const written = await writeOutside(output, source);
    console.log(`已生成：${written}\n总长 ${totalFrames} 帧（${(totalFrames / plan.fps).toFixed(1)} 秒，${plan.fps} 帧每秒）。`);
    if (pending.length) console.log(`仍有镜头待实现：${pending.join('、')}（渲染时会明确报错；在计划中填 component 引用独立实现后重新 build）。`);
    if (tweak.length) console.log(`微调镜头 ${tweak.map(item => item.id).join('、')} 使用目标工程的独立组件；按传入的 content、speed、variantId、width、height 实现本镜，保留其他镜头的素材。`);
    if (reuse.length) console.log(`复用镜头 ${reuse.map(item => item.id).join('、')} 已按所填 content 装配；未填的内容沿用目录示例，不会自动变成字幕。`);
    console.log(usesPackage ? '目标工程需安装 wise-motion-remotion 并运行 scripts/install-assets.mjs，见 REMOTION.md。' : '装配入口不直接引用目录组件；独立组件所需依赖与素材按其源码准备。');
  } else {
    console.error('用法：\n  node scripts/plan.mjs init 字幕.txt [计划.json]\n  node scripts/plan.mjs check 计划.json\n  node scripts/plan.mjs build 计划.json src/index.jsx');
    process.exitCode = 1;
  }
}

const invokedDirectly = process.argv[1] && await realpath(process.argv[1]).then(file => file === fileURLToPath(import.meta.url), () => false);
if (invokedDirectly) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
