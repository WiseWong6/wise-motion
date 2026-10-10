// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';

function outsideFences(text) {
  let fence;
  return text.replace(/<!--[\s\S]*?-->/g, '').split('\n').map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (!fence && marker) { fence = marker[1]; return ''; }
    if (!fence) return line;
    if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
    return '';
  }).join('\n');
}

function headingIds(text) {
  const ids = new Set();
  for (const [, heading] of outsideFences(text).matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = heading.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '').replace(/[`*]/g, '')
      .toLowerCase().replace(/[^\p{L}\p{M}\p{N}_ -]/gu, '').replace(/ /g, '-');
    let id = base, suffix = 0;
    while (ids.has(id)) id = `${base}-${++suffix}`;
    ids.add(id);
  }
  return ids;
}

// 核对本项目使用的 Markdown 行内链接、文件路径和标题章节；代码示例不参与检查。
export async function assertMarkdownLinks(root, files) {
  const texts = new Map();
  async function read(file) {
    if (!texts.has(file)) texts.set(file, await readFile(file, 'utf8'));
    return texts.get(file);
  }
  let checked = 0;
  for (const file of files) {
    const source = path.resolve(root, file);
    const visible = outsideFences(await read(source)).replace(/(`+)[\s\S]*?\1/g, '');
    for (const [, destination] of visible.matchAll(/\]\(([^)]+)\)/g)) {
      const link = destination.trim().replace(/^<([^>]+)>$/, '$1');
      if (/^[a-z][a-z\d+.-]*:/i.test(link) || link.startsWith('//')) continue;
      const hash = link.indexOf('#');
      const relative = decodeURIComponent(hash < 0 ? link : link.slice(0, hash));
      const target = relative ? path.resolve(path.dirname(source), relative) : source;
      const exists = await stat(target).then(info => info.isFile(), error => {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
        throw error;
      });
      assert.ok(exists, `${file} 的链接缺失：${link}`);
      if (hash >= 0 && hash < link.length - 1 && /\.md$/i.test(target)) {
        const fragment = decodeURIComponent(link.slice(hash + 1));
        assert.ok(headingIds(await read(target)).has(fragment), `${file} 的链接章节不存在：${link}`);
      }
      checked++;
    }
  }
  return checked;
}
