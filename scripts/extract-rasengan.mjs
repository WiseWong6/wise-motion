// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 从只读原工程提取几何函数与短窗轨迹；不导出成片、不改写原文件。
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
const root = fileURLToPath(new URL('../',import.meta.url));
const source = path.resolve(root,'../../../scenes/Rasengan/physics/hill-bubble-video');
const state = path.resolve(root,'../../state/wise-motion/rasengan-illustrations-20261001');
const files = new Map();
async function read(relative) { const bytes=await readFile(path.join(source,relative)); files.set(relative,bytes); return bytes; }
const text = async name => (await read('src/rasengan/'+name)).toString();
const js = value => stripTypeScriptTypes(value.replace(/^import .*;\s*$/gm,'').replace(/\bexport\s+/g,''),{mode:'transform'}).trim();
const wrap = (body,keys,prefix='') => `(()=>{${prefix}\n${js(body)}\nreturn {${keys.join(',')}};})()`;
const timing=JSON.parse(await text('preview-timing.json'));
const C=wrap(await text('choreography.ts'),['clamp','smooth','lerp','finale','lightningDensity'],`const playbackAnchors=${JSON.stringify(timing.anchors)};`);
const context=vm.createContext({});vm.runInContext(`var C=${C}`,context);
const poses=Array.from({length:91},(_,i)=>context.C.finale(18+i/30));
const light=await text('light.ts'), camera=js(light.slice(light.indexOf('export const rotate'),light.indexOf('const renderers')));
const spiral=wrap(await text('spiral.ts'),['armCount','spiralPoint','conversionAt','cycloneTurn'],'const {lerp,smooth}=C;');
const cloud=wrap(await text('mushroom.ts'),['cloudHeadPoint','cloudHeadTop','cloudOpeningBlend','mushroomStages'],'const {smooth}=C;');
const natural=await text('NaturalOrigins.tsx');
const smoke=js(natural.slice(natural.indexOf('let seed='),natural.indexOf('// Ring tracers'))).replace(/let seed=/,'let smokeSeed=').replace(/\bseed\b/g,'smokeSeed');
const effects=await text('StoryEffects.tsx');
const dots=js(effects.slice(effects.indexOf('let seed='),effects.indexOf('// Buoyant-plume')));
const electric=js(effects.slice(effects.indexOf('function electricTrace'),effects.indexOf('// Artistic overlay')));
const galaxy=wrap(await text('galaxy.ts'),['galaxyStars','galaxyDisplayPosition','galaxyPosition'],'const {smooth}=C;const {armCount,spiralPoint,conversionAt}=S;');
await text('RotationComparison.tsx');await text('visuals.tsx');await text('scenes/Combine.tsx');
// 保留原光照累计、密度补偿、蓝色线身和窄亮芯；只适配画板与分辨率。
const change=(s,from,to)=>{if(!s.includes(from))throw new Error('原绘制器结构改变：'+from);return s.replace(from,to);};
let renderer=await text('LightRenderer.ts');
renderer=change(renderer,'gl_Position=vec4(aPositionUv.x/540.0-1.0,1.0-aPositionUv.y/960.0,0.0,1.0);',
  'gl_Position=vec4((aPositionUv.x-540.0)*.001,-(aPositionUv.y-900.0)*(.32/180.0),0.0,1.0);');
renderer=change(renderer,'vec2 px=vec2(.25/1080.0,.25/1920.0);','vec2 px=vec2(.08/640.0,.08/360.0);');
renderer=change(renderer,'const pixelRatio=getRemotionEnvironment().isRendering?window.devicePixelRatio:1;',
  'const pixelRatio=Math.min(2,Math.max(1,global.devicePixelRatio||1));');
renderer=change(renderer,"canvas.style.width='1080px';canvas.style.height='1920px';","canvas.style.width='640px';canvas.style.height='360px';");
renderer=change(renderer,'Math.round(1080*pixelRatio)','Math.round(640*pixelRatio)');
renderer=change(renderer,'Math.round(1920*pixelRatio)','Math.round(360*pixelRatio)');
renderer=change(renderer,'gl.RGBA16F,2160,3840','gl.RGBA16F,1280,720');
renderer=change(renderer,'gl.viewport(0,0,2160,3840)','gl.viewport(0,0,1280,720)');
const nativeLight=wrap(renderer+'\n'+light.slice(light.indexOf('const mix=')),['LightRenderer','drawFiber','drawSpark']);
const meridians=JSON.parse(await text('meridians.json')).map(v=>({level:v.level,period:v.period,points:v.points.map(p=>p.slice(0,2).map(x=>+x.toFixed(6)))}));
const metadata=JSON.parse((await read('public/data/rasengan/metadata.json')).toString());
const minDriven=Math.min(...poses.map(p=>p.time-p.trail*1.1)),maxDriven=Math.max(...poses.map(p=>p.time+.22));
async function pack(mode,start,end) {
  const bytes=await read('public/data/rasengan/'+mode+'.bin');
  if(createHash('sha256').update(bytes).digest('hex')!==metadata.models[mode].sha256)throw new Error(mode+' 原轨迹与清单不符');
  // 原每秒六十帧位置保持不变，只把坐标量化到小于原画布百分之一像素。
  const first=Math.floor(start*metadata.hz),last=Math.ceil(end*metadata.hz),count=last-first+1;
  const packed=Buffer.alloc(count*metadata.count*3*2);
  let error=0;
  for(let frame=first;frame<=last;frame++)for(let i=0;i<metadata.count*3;i++){
    const v=bytes.readFloatLE((frame*metadata.count*3+i)*4),q=Math.round(v*32767);
    error=Math.max(error,Math.abs(v-q/32767));packed.writeInt16LE(q,((frame-first)*metadata.count*3+i)*2);
  }
  return {start:first/metadata.hz,hz:metadata.hz,count:metadata.count,steps:count,maxError:error,data:packed.toString('base64')};
}
// 蘑菇云取原片头部仍带上升气柱的三秒；球涡取原示踪局部时钟。
const fields={classic:await pack('classic',3,13.8),driven:await pack('driven',minDriven,maxDriven)};
const fieldCode=JSON.stringify(fields);
const block=`const C=${C};\nconst {clamp,smooth,lerp}=C;\n${camera}\nconst S=${spiral};\nconst Cloud=${cloud};\nconst NativeLight=${nativeLight};\nconst meridians=${JSON.stringify(meridians)};\nlet stars;const starField=()=>stars||(stars=${galaxy});\nconst smoke=(()=>{const tau=Math.PI*2;const {smooth}=C;${smoke};return smoke;})();\nconst cloudDots=(()=>{${dots};return dots;})();\n${electric}\nconst packedFields=${fieldCode};\n`;
const target=path.join(root,'catalog/effects/rasengan-illustrations.js');
const before=await readFile(target,'utf8');
await writeFile(target,before.replace(/\/\/ BEGIN SOURCE GEOMETRY[\s\S]*?\/\/ END SOURCE GEOMETRY/,'// BEGIN SOURCE GEOMETRY\n'+block+'// END SOURCE GEOMETRY'));
await mkdir(state,{recursive:true});
const report={source,sourceFiles:Object.fromEntries([...files].map(([name,b])=>[name,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}])),
  illustrations:['smoke-ring-illustration','vortex-ring-illustration','mushroom-cloud-illustration','hill-vortex-illustration','cyclone-illustration','spiral-galaxy-illustration','rasengan-illustration','lightning-orb-illustration'],
  sourceCounts:{smoke:2240,mushroom:6500,galaxy:28800,field:384,additionalDriven:192},
  adaptation:'提取原几何、固定点身份、三维投影、球涡轨迹、剖面翻卷及电弧分叉；每项独立三秒，末尾保持。去除原纸底、字幕、人物和全页标尺。星系等距按六臂分层取四分之一原点，其他粒子保留原数量；合并同材质粒子和线段以减少节点。螺旋丸与电弧使用原光效绘制器及完整线段采样，保留蓝、亮蓝、窄亮芯、遮盖密度及光晕累计；仅适配画板尺寸及光照缓冲分辨率。不支持浮点光照时使用细线兼容图。缩略图保留静态像素后释放绘制资源。',
  packedFields:Object.fromEntries(Object.entries(fields).map(([name,f])=>[name,{...f,data:undefined,bytes:Buffer.from(f.data,'base64').length}])),
  sourcePoseStart:poses[0],sourcePoseEnd:poses.at(-1)};
await writeFile(path.join(state,'extraction.json'),JSON.stringify(report,null,2)+'\n');
console.log('已提取八种插画；独立轨迹数据 '+(Buffer.byteLength(fieldCode)/1024/1024).toFixed(2)+' MiB；原工程未修改。');
