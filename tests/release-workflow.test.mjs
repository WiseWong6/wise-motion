// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {checkRelease} from '../scripts/check-release.mjs';

function fixture(overrides = {}) {
  const metadata = {name: 'wise-motion', version: '1.2.3'};
  return {manifest: {...metadata,
    repository: {url: 'git+https://github.com/WiseWong6/wise-motion.git'},
    publishConfig: {access: 'public', registry: 'https://registry.npmjs.org/'}},
  lockfile: {...metadata, packages: {'': {...metadata}}},
  repository: 'WiseWong6/wise-motion', event: 'push', ref: 'refs/tags/v1.2.3', ...overrides};
}

test('版本标签和主分支手动运行均可通过，标签手动重试也核对包版本', () => {
  for (const data of [fixture(), fixture({event: 'workflow_dispatch', ref: 'refs/heads/main'}),
    fixture({event: 'workflow_dispatch'})]) assert.equal(checkRelease(data), 'wise-motion@1.2.3');
});

test('误打标签、普通分支、其它仓库和非发布事件在上传前被拒绝', () => {
  for (const change of [
    {ref: 'refs/tags/v1.2.2'}, {ref: 'refs/tags/v1.2.3-rc.1'}, {ref: 'refs/heads/main'},
    {event: 'workflow_dispatch', ref: 'refs/heads/feature'},
    {event: 'workflow_dispatch', ref: 'refs/tags/v1.2.2'},
    {repository: 'someone/wise-motion'}, {event: 'pull_request'}
  ]) assert.throws(() => checkRelease(fixture(change)));
});

test('锁定文件、包身份、稳定版本和发布目标必须全部对应', () => {
  const cases = [
    data => { data.lockfile.version = '1.2.2'; },
    data => { data.lockfile.packages[''].version = '1.2.2'; },
    data => { delete data.lockfile.packages; },
    data => { data.manifest.name = 'another-package'; },
    data => { data.manifest.private = true; },
    data => { data.manifest.version = '1.2.3-rc.1'; },
    data => { data.manifest.version = '01.2.3'; },
    data => { data.manifest.publishConfig.registry = 'https://example.com/'; },
    data => { data.manifest.publishConfig.access = 'restricted'; },
    data => { data.manifest.repository.url = 'git+https://github.com/someone/wise-motion.git'; }
  ];
  for (const change of cases) {
    const data = fixture();
    change(data);
    assert.throws(() => checkRelease(data));
  }
});

test('实际命令从项目位置读取包配置，不依赖调用目录，并正确返回失败状态', async () => {
  const script = fileURLToPath(new URL('../scripts/check-release.mjs', import.meta.url));
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const env = {...process.env, GITHUB_REPOSITORY: 'WiseWong6/wise-motion',
    GITHUB_EVENT_NAME: 'push', GITHUB_REF: `refs/tags/v${manifest.version}`};
  assert.match(execFileSync(process.execPath, [script], {env, cwd: '/', encoding: 'utf8'}), /发布前核对通过/);
  assert.throws(() => execFileSync(process.execPath, [script],
    {env: {...env, GITHUB_REF: 'refs/tags/v0.0.0'}, cwd: '/', stdio: 'pipe'}),
  error => error.status === 1 && /发布标签/.test(error.stderr.toString()));
});
