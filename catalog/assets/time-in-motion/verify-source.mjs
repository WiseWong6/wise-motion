// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile, stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root = process.cwd(), files = JSON.parse(await readFile(path.join(root, 'binary-assets.json'), 'utf8'));
for (const entry of files) {
  const file = path.resolve(root, entry.target);
  if (path.relative(root, file).startsWith('..')) throw new Error('素材路径越界');
  const h = createHash('sha256'); for await (const chunk of createReadStream(file)) h.update(chunk);
  if ((await stat(file)).size !== entry.bytes || h.digest('hex') !== entry.sha256) throw new Error('素材摘要不同：' + entry.target);
}
console.log('独立工程运行素材摘要通过，共 ' + files.length + ' 项。');
