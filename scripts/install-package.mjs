// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 在目标工程内运行；与浏览器复制、源码导出共用安装程序，不依赖已发布包中的脚本。
import {readFile,realpath} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

try {
  const root=await realpath(fileURLToPath(new URL('../',import.meta.url)));
  const target=await realpath(process.cwd());
  const relative=path.relative(root,target);
  if(!relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))
    throw Error('请在独立目标工程内运行安装命令，不能安装到 Wise Motion 源码目录内。');
  const context={require:createRequire(import.meta.url),process,console};
  runInNewContext(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'),context);
  const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  const [effectId,variantId,...extra]=process.argv.slice(2);
  if(extra.length)throw Error('用法：node scripts/install-package.mjs [动效名称] [样式名称]；请在目标工程内运行。');
  context.MotionExport.installPackage({version,effectId,variantId});
}catch(error){console.error(error.message);process.exitCode=1;}
