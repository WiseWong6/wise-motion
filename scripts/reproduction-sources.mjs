// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';

// 只读取登记实现及其文字依赖；源文件保持只读，浏览器只把内容当作复制文本。
const extensions=['.js','.mjs','.cjs','.ts','.tsx','.jsx','.json','.svg','.glsl'];
export async function reproductionSources(recipes,sourceRoot){
  const base=path.dirname(sourceRoot),files={},graphs=new Map();
  async function resolve(from,name){
    const target=path.resolve(path.dirname(from),name.split('?')[0]);
    if(path.relative(base,target).startsWith('..'))return null;
    const candidates=path.extname(target)?[target]:[...extensions.map(ext=>target+ext),...extensions.map(ext=>path.join(target,'index'+ext))];
    for(const file of candidates){
      if(!extensions.includes(path.extname(file)))continue;
      try{if((await stat(file)).isFile())return file;}catch(error){if(error.code!=='ENOENT'&&error.code!=='ENOTDIR')throw error;}
    }
    return null;
  }
  async function visit(file){
    if(graphs.has(file))return;
    const content=await readFile(file,'utf8'),dependencies=[],packages=new Set(),inputs=new Set();
    graphs.set(file,{dependencies,packages,inputs});
    files[file]={name:path.relative(base,file).replaceAll(path.sep,'/'),content};
    const imports=[...content.matchAll(/(?:(?:^|[;\n])\s*(?:import(?!\s*[\('""])|export\s*(?:type\s+)?(?:\{|\*))[^;]*?\bfrom\s*|(?:^|[;\n])\s*import\s*|\b(?:require|import)\(\s*)["']([^"']+)["']/g)].map(m=>m[1]);
    for(const name of new Set(imports)){
      if(!name.startsWith('.')){packages.add(name.startsWith('@')?name.split('/').slice(0,2).join('/'):name.split('/')[0]);continue;}
      const dependency=await resolve(file,name);
      if(dependency){dependencies.push(dependency);await visit(dependency);}
      else inputs.add(path.relative(base,path.resolve(path.dirname(file),name)).replaceAll(path.sep,'/'));
    }
  }
  for(const recipe of recipes)for(const entry of recipe.entries){
    const roots=[...new Set([...entry.code.map(ref=>ref.file),...(entry.definition?.reproduction?.extra_sources||recipe.reproduction?.extra_sources||[])])];
    for(const file of roots)await visit(file);
    const seen=new Set(),packages=new Set(),inputs=new Set();
    function gather(file){
      if(seen.has(file))return;seen.add(file);
      const graph=graphs.get(file);graph.packages.forEach(x=>packages.add(x));graph.inputs.forEach(x=>inputs.add(x));graph.dependencies.forEach(gather);
    }
    roots.forEach(gather);
    entry.source_files=[...seen];entry.source_packages=[...packages].sort();entry.source_inputs=[...inputs].sort();
  }
  return files;
}
