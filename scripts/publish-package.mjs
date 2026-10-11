// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile, realpath, stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

async function main() {
  const [input, ...flags] = process.argv.slice(2);
  if (!input || input.startsWith('-') || !input.endsWith('.tgz') ||
      flags.length > 1 || flags.some(flag => flag !== '--dry-run')) {
    throw new Error('用法：npm run publish:package -- /发布包/wise-motion-版本.tgz [--dry-run]');
  }
  const packageFile = path.resolve(input);
  if (!(await stat(packageFile)).isFile()) throw new Error('发布目标必须是已检查的 .tgz 文件');
  if (!process.env.npm_execpath) throw new Error('请通过 npm run publish:package 运行，以使用当前 npm 客户端');
  const npmCli = await realpath(process.env.npm_execpath);
  const npmRequire = createRequire(npmCli);
  const Npm = npmRequire('../lib/npm.js');
  // npm 没有稳定的程序接口；升级大版本后需先适配并运行请求测试。
  if (!/^11\./.test(Npm.version)) throw new Error('发布脚本使用 npm 11；其他大版本需要先适配并验证');
  const expected = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const manifest = await npmRequire('pacote').manifest(packageFile, {fullReadJson: true});
  if (manifest.name !== expected.name || manifest.version !== expected.version) {
    throw new Error('发布包名称或版本与当前项目不一致，请重新构建、打包和检查');
  }
  process.argv = [process.execPath, npmCli, 'publish', packageFile,
    '--registry=https://registry.npmjs.org/', '--access=public', '--tag=latest',
    '--ignore-scripts', '--browser=false', '--fetch-retries=0', '--fetch-timeout=900000', ...flags];
  const npm = new Npm();
  const publisher = npmRequire('libnpmpublish');
  const originalPublish = publisher.publish;
  if (typeof originalPublish !== 'function' || typeof npm.load !== 'function' ||
      typeof npm.exec !== 'function' || typeof npm.unload !== 'function') {
    throw new Error('当前 npm 发布接口不兼容，请先适配并运行请求测试');
  }
  // 只为最终发布请求启用官方 gzip 支持。查询和网页身份验证仍走原 npm 流程，
  // 避免给没有正文的 GET 请求添加压缩正文；原 .tgz 及其摘要均保持不变。
  publisher.publish = (pkg, tarball, options) =>
    originalPublish(pkg, tarball, {...options, gzip: true});
  try {
    const loaded = await npm.load();
    if (!loaded.exec || loaded.command !== 'publish') throw new Error('npm 未正确进入发布流程');
    await npm.exec(loaded.command, loaded.args);
  } finally {
    publisher.publish = originalPublish;
    await Promise.allSettled(npm.unrefPromises || []);
    npm.unload();
  }
}

main().catch(error => {
  // 不输出认证配置或整个请求对象；npm 自身负责日志脱敏和发布错误说明。
  console.error(`${error.code ? error.code + '：' : ''}${error.message}`);
  process.exitCode = 1;
});
