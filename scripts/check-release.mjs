// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryName = 'WiseWong6/wise-motion';
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function checkRelease({manifest, lockfile, repository, event, ref}) {
  if (repository !== repositoryName) throw new Error('只能从 WiseWong6/wise-motion 仓库发布');
  if (manifest.name !== 'wise-motion' || manifest.private || !stableVersion.test(manifest.version)) {
    throw new Error('只能发布 wise-motion 的完整稳定版本');
  }
  for (const metadata of [lockfile, lockfile.packages?.['']]) {
    if (metadata?.name !== manifest.name || metadata.version !== manifest.version) {
      throw new Error('包配置与依赖锁定文件的名称或版本不同，请先同步');
    }
  }
  if (manifest.repository?.url !== `git+https://github.com/${repositoryName}.git` ||
      manifest.publishConfig?.access !== 'public' ||
      manifest.publishConfig?.registry !== 'https://registry.npmjs.org/') {
    throw new Error('发布仓库、公开访问或 npm 官方仓库配置不匹配');
  }
  const tagRef = `refs/tags/v${manifest.version}`;
  if (event === 'push') {
    if (ref !== tagRef) throw new Error('发布标签必须为 v 加上当前包版本，且与包配置完全一致');
  } else if (event === 'workflow_dispatch') {
    if (ref !== 'refs/heads/main' && ref !== tagRef) {
      throw new Error('手动发布只能选择主分支或与包版本一致的版本标签');
    }
  } else {
    throw new Error('只接受版本标签推送或手动运行发布流程');
  }
  return `${manifest.name}@${manifest.version}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [manifest, lockfile] = await Promise.all(['package.json', 'package-lock.json']
      .map(file => readFile(new URL('../' + file, import.meta.url), 'utf8').then(JSON.parse)));
    console.log('发布前核对通过：' + checkRelease({manifest, lockfile,
      repository: process.env.GITHUB_REPOSITORY,
      event: process.env.GITHUB_EVENT_NAME,
      ref: process.env.GITHUB_REF}));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
