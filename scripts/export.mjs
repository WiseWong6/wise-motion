// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 只写出目录复制功能生成的原工程/组件示例，不安装依赖。
import {readFile, open, mkdir, lstat, realpath, unlink, rmdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import contentApi from '../catalog/content.js';
import {resolveEffect} from '../remotion/clock.mjs';
import {selectEffect} from './show.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = await realpath(root);
const contains = (parent, child) => { const rel = path.relative(parent, child); return !rel || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel)); };
const statOrNull = file => lstat(file).catch(error => { if (error.code === 'ENOENT') return null; throw error; });

// 未创建的尾部目录也按已存在祖先解析，防止通过符号链接把产物写进源码。
async function canonicalTarget(file) {
  const info = await statOrNull(file);
  if (info) return realpath(file);
  const parent = path.dirname(file);
  if (parent === file) throw Error('无法解析目标目录：' + file);
  return path.join(await canonicalTarget(parent), path.basename(file));
}

export async function projectFor(query, {variantId} = {}) {
  const effect = selectEffect(query, variantId), sources = {};
  for (const file of effect.source.remotion?.files || []) {
    if (path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) throw Error('源码路径越界：' + file);
    sources[file] = await readFile(path.join(root, file), 'utf8');
  }
  const context = {MotionKit: {resolveVariant: resolveEffect}, MotionContent: contentApi, MotionRemotionSources: sources};
  runInNewContext(await readFile(path.join(root, 'catalog/export.js'), 'utf8'), context, {filename: 'catalog/export.js'});
  const project = context.MotionExport.projectFiles(effect, {variantId: effect.variant_id});
  return {effect, kind: project.kind, files: {...project.files}};
}

export async function exportEffect(query, {variantId, outDir} = {}) {
  if (!outDir || typeof outDir !== 'string') throw Error('需要 --out-dir <目标目录>。');
  const requested = path.resolve(outDir), info = await statOrNull(requested);
  if (info && (!info.isDirectory() || info.isSymbolicLink())) throw Error('目标必须是普通目录，不能是文件或符号链接：' + requested);
  const target = await canonicalTarget(requested);
  if (contains(sourceRoot, target) || contains(target, sourceRoot)) throw Error('产物目录不能位于技能源码内，也不能是它的上级目录：' + target);
  const project = await projectFor(query, {variantId});
  const entries = Object.entries(project.files);
  for (const [file, content] of entries) {
    if (!file || path.isAbsolute(file) || file.split(/[\\/]/).some(part => part === '..' || !part) || file.includes('\\') || typeof content !== 'string') throw Error('生成文件路径或内容无效：' + file);
  }
  // 写入前核对全部目标。目录里无关的文件可以保留，同名文件或中间链接则整批停止。
  async function checkDestinations() {
    for (const [file] of entries) {
      const parts = file.split('/'); let current = target;
      for (const [index, part] of parts.entries()) {
        current = path.join(current, part);
        const state = await statOrNull(current);
        if (!state) break;
        if (index === parts.length - 1) throw Error('目标文件已存在；未覆盖，请选择其他目录：' + current);
        if (!state.isDirectory() || state.isSymbolicLink()) throw Error('目标路径被文件或符号链接占用：' + current);
      }
    }
  }
  await checkDestinations();
  const written = [], created = [];
  async function ensureDirectory(dir) {
    const current = await statOrNull(dir);
    if (current) { if (!current.isDirectory() || current.isSymbolicLink()) throw Error('目录被文件或符号链接占用：' + dir); return; }
    await ensureDirectory(path.dirname(dir));
    await mkdir(dir); created.push(dir);
  }
  try {
    await ensureDirectory(target);
    await checkDestinations();
    for (const [file, content] of entries) {
      const dest = path.join(target, file);
      await ensureDirectory(path.dirname(dest));
      const handle = await open(dest, 'wx'); written.push(dest);
      try { await handle.writeFile(content); } finally { await handle.close(); }
    }
  } catch (error) {
    for (const file of written.reverse()) await unlink(file);
    for (const dir of created.reverse()) await rmdir(dir).catch(() => {}); // 仅移除本次创建且仍为空的目录。
    throw error;
  }
  return {effectId: project.effect.id, name: project.effect.name, variantId: project.effect.variant_id, kind: project.kind, directory: target, files: written};
}

const invokedDirectly = process.argv[1] && await realpath(process.argv[1]).then(file => file === fileURLToPath(import.meta.url), () => false);
if (invokedDirectly) {
  try {
    const words = [], args = process.argv.slice(2); let variantId, outDir;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--variant' || arg === '--out-dir') {
        const value = args[++i]; if (!value || value.startsWith('--')) throw Error(arg + ' 后需要值。');
        if (arg === '--variant') variantId = value; else outDir = value;
      } else if (arg.startsWith('--')) throw Error('未知选项：' + arg);
      else words.push(arg);
    }
    if (!words.length) throw Error('用法：node scripts/export.mjs <编号或名称> --out-dir <目标目录> [--variant <样式>]');
    const result = await exportEffect(words.join(' '), {variantId, outDir});
    console.log(`已导出：${result.name}（${result.effectId}）${result.variantId ? '；样式 ' + result.variantId : ''}\n类型：${result.kind === 'standalone' ? '独立工程' : '共享组件包接入示例'}\n${result.files.join('\n')}\n使用：按 README.md 准备依赖后播放或渲染；本命令未安装依赖。`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
