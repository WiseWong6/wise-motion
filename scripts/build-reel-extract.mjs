// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function buildReelExtract(checking=false){
 const result=await build({absWorkingDir:root,entryPoints:['catalog/remotion/reel-extract/catalog.jsx'],bundle:true,write:false,format:'iife',target:['chrome120','safari17'],minify:true,legalComments:'eof',define:{'process.env.NODE_ENV':'"production"'}});
 const source='/* Generated from catalog/remotion/reel-extract; AGPL-3.0-only; bundled libraries retain their notices below. */\n'+result.outputFiles[0].text;
 // CSS image masks cannot read file: URLs. Embed the lossless WebP bytes,
 // loaded only by the colour-reveal entry, so the static catalog stays portable.
 const atlas=await readFile(new URL('../catalog/assets/butterfly/wing-atlas.webp',import.meta.url));
 const mask='/* Generated from lossless butterfly/wing-atlas.webp; see its SOURCE.json. */\n'+
   'globalThis.WiseButterflyMask="data:image/webp;base64,'+atlas.toString('base64')+'";\n';
 for(const [name,content] of [['reel-extract.js',source],['butterfly-mask.js',mask]]){
  const path=new URL('../catalog/effects/'+name,import.meta.url);
  if(checking){if(await readFile(path,'utf8')!==content)throw new Error('视频收录绘制文件过期，请运行 npm run build：'+name);}
  else await writeFile(path,content);
 }
}
