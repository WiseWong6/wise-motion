// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, realpath, rm, symlink, truncate, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:http';
import {gunzipSync} from 'node:zlib';
import {randomBytes, createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const {name, version} = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const execute = promisify(execFile);
// npm run test:publish 和 npm test 均提供当前 npm 的真实入口。
const npmCli = await realpath(process.env.npm_execpath);
const npmRequire = createRequire(npmCli);

test('真实 npm 发布请求压缩且包内容不变，查询、试运行和失败正确处理', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'wise-publish-'));
  const requests = [];
  let responseStatus = 201;
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({method: request.method, url: request.url, headers: request.headers, body: Buffer.concat(chunks)});
    response.writeHead(request.method === 'PUT' ? responseStatus : 200, {'content-type': 'application/json'});
    response.end(JSON.stringify(request.method === 'PUT'
      ? (responseStatus === 201 ? {ok: true} : {error: 'request too large'})
      : {name, versions: {'0.1.12': {name, version: '0.1.12'}}, 'dist-tags': {latest: '0.1.12'}}));
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const registry = `http://127.0.0.1:${server.address().port}/`;
    await mkdir(path.join(dir, 'package'));
    await mkdir(path.join(dir, 'bin'));
    await mkdir(path.join(dir, 'lib'));
    await symlink(path.resolve(path.dirname(npmCli), '../node_modules'), path.join(dir, 'node_modules'), 'dir');
    await writeFile(path.join(dir, 'empty-user.npmrc'), '');
    await writeFile(path.join(dir, 'empty-global.npmrc'), '');
    const testConfig = [
      '--registry=' + registry, '--userconfig=' + path.join(dir, 'empty-user.npmrc'),
      '--globalconfig=' + path.join(dir, 'empty-global.npmrc'), '--cache=' + path.join(dir, 'cache'),
      '--logs-max=0', '--proxy=false', '--https-proxy=false',
      `--//127.0.0.1:${server.address().port}/:_authToken=local-test-token`
    ];
    // 仅测试入口追加本地配置；发布命令、HTTP 客户端和压缩均使用实际安装的 npm。
    // 空认证文件和本地假令牌保证测试不会使用用户凭据或向公网发布。
    await writeFile(path.join(dir, 'bin/npm-cli.js'), '');
    await writeFile(path.join(dir, 'lib/npm.js'), `
const Npm = require(${JSON.stringify(npmRequire.resolve('../lib/npm.js'))});
module.exports = class extends Npm {
  constructor() { super({argv: ${JSON.stringify(testConfig)}}); }
};
`);
    const filename = path.join(dir, 'publish.tgz');
    const pack = async (metadata = {name, version}) => {
      await writeFile(path.join(dir, 'package/package.json'), JSON.stringify(metadata));
      await writeFile(path.join(dir, 'package/source.bin'), randomBytes(32768));
      await npmRequire('tar').c({gzip: true, cwd: dir, file: filename}, ['package']);
    };
    const invoke = flags => execute(process.execPath,
      [path.join(root, 'scripts/publish-package.mjs'), filename, ...flags],
      {cwd: root, env: {...process.env, npm_execpath: path.join(dir, 'bin/npm-cli.js')}, timeout: 20000});
    await pack();
    const tarball = await readFile(filename);
    const result = await invoke([]);
    assert.match(result.stdout, new RegExp('\\+ wise-motion@' + version.replaceAll('.', '\\.')));
    const put = requests.filter(request => request.method === 'PUT');
    assert.equal(put.length, 1);
    assert.equal(put[0].url, '/wise-motion');
    assert.equal(put[0].headers['content-encoding'], 'gzip');
    const jsonBytes = gunzipSync(put[0].body);
    assert.ok(put[0].body.length < jsonBytes.length);
    const metadata = JSON.parse(jsonBytes);
    assert.equal(metadata.name, name);
    assert.equal(metadata['dist-tags'].latest, version);
    assert.equal(metadata.access, 'public');
    const attachment = metadata._attachments[`${name}-${version}.tgz`];
    assert.equal(attachment.length, tarball.length);
    assert.deepEqual(Buffer.from(attachment.data, 'base64'), tarball);
    assert.equal(metadata.versions[version].dist.shasum, createHash('sha1').update(tarball).digest('hex'));
    const reads = requests.filter(request => request.method === 'GET');
    assert.ok(reads.length > 0, '保留官方版本查询');
    assert.ok(reads.every(request => !request.headers['content-encoding'] && request.body.length === 0));
    requests.length = 0;
    const dryRun = await invoke(['--dry-run']);
    assert.match(dryRun.stderr, /dry-run/);
    assert.ok(requests.every(request => request.method === 'GET'));
    requests.length = 0;
    responseStatus = 413;
    await assert.rejects(invoke([]), error => error.code === 1 && /E413/.test(error.stderr) && !/\+ wise-motion@/.test(error.stdout));
    assert.equal(requests.filter(request => request.method === 'PUT').length, 1, '失败不会盲目重传大包');
    requests.length = 0;
    for (const metadata of [{name: 'another-package', version}, {name, version: '0.0.0'}]) {
      await pack(metadata);
      await assert.rejects(invoke([]), error => error.code === 1 && /名称或版本/.test(error.stderr));
      assert.equal(requests.length, 0, '误包在联网发布前被拒绝');
    }
    await assert.rejects(invoke(['--registry=https://example.com/']), error => error.code === 1 && /用法/.test(error.stderr));
    assert.equal(requests.length, 0);
    await truncate(filename, 200_000_001);
    await assert.rejects(invoke([]), error => error.code === 1 && /200 MB/.test(error.stderr));
    assert.equal(requests.length, 0, '超过项目体积预算时不上传或索取网页验证');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(dir, {recursive: true, force: true});
  }
});
