// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {build} from 'esbuild';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {installAssets} from './install-assets.mjs';
import path from 'node:path';
import {assertProjectWrite} from './output-boundary.mjs';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of ['dist','catalog/remotion-player.js','public','ASSET-MANIFEST.json'])await assertProjectWrite(path.join(root,file));
await mkdir(path.join(root,'dist'),{recursive:true});
const common={absWorkingDir:root,bundle:true,target:['chrome120','safari17'],logLevel:'warning',legalComments:'eof',banner:{js:'/* Wise Motion Remotion 接入 · 自有代码 AGPL-3.0-only；第三方许可见 NOTICE.md。 */'}};
await build({...common,entryPoints:['remotion/index.jsx'],outfile:'dist/index.mjs',format:'esm',external:['react','react-dom','remotion']});
await build({...common,entryPoints:['remotion/browser.jsx'],outfile:'catalog/remotion-player.js',format:'iife',globalName:'WiseRemotion',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const assetFiles=[];
async function collect(directory){for(const entry of await readdir(path.join(root,directory),{withFileTypes:true})){const name=path.join(directory,entry.name);if(entry.isDirectory())await collect(name);else if(!name.endsWith('remotion-player.js')){const bytes=await readFile(path.join(root,name));assetFiles.push({path:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
await collect('catalog');await collect('vendor');
await writeFile(path.join(root,'ASSET-MANIFEST.json'),JSON.stringify({purpose:'实际绘制依赖、字体和素材，随包提供并复制到目标工程 public/wise-motion',files:assetFiles},null,2)+'\n');
await installAssets(path.join(root,'public/wise-motion'));
console.log('已生成可复用组件、本地目录播放器和 Remotion 本地素材。');
