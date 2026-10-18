// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {assertProjectWrite} from './output-boundary.mjs';
const root=new URL('../',import.meta.url);
export async function buildLegoMotion(checking=false) {
  // Only native math is used by the catalog painter. Avoid bundling Remotion's
  // unrelated media loaders while keeping the installed version's exact math.
  const require=createRequire(import.meta.url);
  const mathRoot=path.dirname(require.resolve('remotion'));
  const mathOnly={name:'remotion-frame-math',setup(build){
    build.onResolve({filter:/^remotion$/},()=>({path:'frame-math',namespace:'remotion-frame-math'}));
    build.onLoad({filter:/.*/,namespace:'remotion-frame-math'},()=>({contents:
      `export {Easing} from ${JSON.stringify(path.join(mathRoot,'easing.js'))};\nexport {interpolate} from ${JSON.stringify(path.join(mathRoot,'interpolate.js'))};`,loader:'js',resolveDir:mathRoot}));
  }};
  const result=await build({absWorkingDir:root.pathname,entryPoints:['catalog/remotion/lego-kingdom/catalog.jsx'],
    bundle:true,write:false,format:'iife',target:['chrome120','safari17'],minify:true,legalComments:'eof',
    plugins:[mathOnly],define:{'process.env.NODE_ENV':'"production"'}});
  const source='/* Generated from catalog/remotion/lego-kingdom. Apache-2.0; dependency notices below. */\n'+result.outputFiles[0].text;
  const target=new URL('catalog/effects/lego-kingdom.js',root);
  if(checking){if(await readFile(target,'utf8')!==source)throw new Error('乐高视频动作绘制文件过期，请运行 npm run build');}
  else {await assertProjectWrite(target.pathname);await writeFile(target,source);}
}
