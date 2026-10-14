// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile, realpath, lstat, stat, mkdir, copyFile} from 'node:fs/promises';
import {createReadStream, constants} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const args = process.argv.slice(2), from = args[args.indexOf('--from') + 1];
const group = args.includes('--group') ? args[args.indexOf('--group') + 1] : 'editable';
if (!args.includes('--from') || !from || from.startsWith('--') || !['editable', 'models'].includes(group)) {
  throw new Error('用法：node catalog/assets/time-in-motion/editable/import-originals.mjs --from <Pocketwatch工程根目录> [--group editable|models]');
}
const source = await realpath(from), target = await realpath(process.cwd());
const manifest = JSON.parse(await readFile(new URL('./original-assets.json', import.meta.url), 'utf8'));
const entries = manifest.filter(entry => group === 'models' ? entry.group === 'models' : entry.group !== 'models');
const within = (root, file) => {const p = path.resolve(root, file);
  if (!file || path.isAbsolute(file) || path.relative(root, p).startsWith('..')) throw new Error('素材路径越界：' + file);
  return p;};
async function hash(file) {const h = createHash('sha256'); for await (const chunk of createReadStream(file)) h.update(chunk); return h.digest('hex');}
const copy = [];
async function checkParents(file) {
  let current = file;
  while (current !== target) {
    try {if ((await lstat(current)).isSymbolicLink()) throw new Error('目标路径不能包含链接：' + current);}
    catch (error) {if (error.code !== 'ENOENT') throw error;}
    current = path.dirname(current);
  }
}
// Validate every source and destination before the first write; original files remain read-only.
for (const entry of entries) {
  const src = within(source, entry.source), dst = within(target, entry.target);
  await checkParents(dst);
  if ((await stat(src)).size !== entry.bytes || await hash(src) !== entry.sha256) throw new Error('制作素材版本不同：' + entry.source);
  let exists = false;
  try {exists = true; const s = await stat(dst);
    if (s.size !== entry.bytes || await hash(dst) !== entry.sha256) throw new Error('已有文件不同，未写入任何素材：' + entry.target);
  } catch (error) {if (error.code !== 'ENOENT') throw error; exists = false;}
  if (!exists) copy.push({src, dst});
}
for (const entry of copy) {await mkdir(path.dirname(entry.dst), {recursive: true});
  await copyFile(entry.src, entry.dst, constants.COPYFILE_EXCL);}
console.log('已按摘要准备 ' + copy.length + ' 个' + (group === 'models' ? '三维制作' : '剪辑') + '素材；原工程未修改。');
