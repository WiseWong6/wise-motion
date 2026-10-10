/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export async function buildCivilization(check=false){
 const root=fileURLToPath(new URL('../',import.meta.url));
 const result=await build({absWorkingDir:root,entryPoints:['catalog/assets/civilization-growth/catalog-entry.mjs'],bundle:true,format:'iife',target:['chrome120','safari17'],write:false,legalComments:'eof',banner:{js:'/* Wise Motion · 薪火生长与文明聚字；自有程序 Apache-2.0，字形及素材许可见 catalog/assets/civilization-growth/SOURCE.json。 */'}});
 const target=new URL('../catalog/effects/civilization-growth.js',import.meta.url),content=result.outputFiles[0].text;
 if(check){if(await readFile(target,'utf8')!==content)throw new Error('文明聚字绘制与源文件不一致，请重新构建。');}
 else await writeFile(target,content);
}
