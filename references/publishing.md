# 通过 GitHub 自动发布到 npm

发布流程为 [publish.yml](../.github/workflows/publish.yml)。它只接受当前仓库主分支或版本标签，核对包配置与依赖锁定文件，构建组件、检查字体及公开测试，再把同一份已检查的压缩包交给 npm。版本标签必须与包版本一致，且提交已进入主分支；预发布版本会被拒绝，避免误更新稳定版入口。

## 一次性设置

在 [npm 包设置](https://www.npmjs.com/package/wise-motion/access) 中添加可信发布连接，选择 GitHub Actions：

| 字段 | 值 |
| --- | --- |
| Organization or user | `WiseWong6` |
| Repository | `wise-motion` |
| Workflow filename | `publish.yml`，只填文件名 |
| Environment name | 留空，当前流程未使用发布环境 |
| Allow npm publish | 勾选，允许直接发布 |
| Allow npm dist-tag | 不勾选，流程不单独修改版本标签 |

流程使用 GitHub 托管的运行机器和临时身份凭据（OIDC），不配置 `NPM_TOKEN` 或 `NODE_AUTH_TOKEN` 等长期发包密钥。账号继续保留双重认证。不要把设置改成只允许暂存发布，否则每次仍需人工确认才能上架。

按 [npm 官方说明](https://docs.npmjs.com/trusted-publishers/)，新建连接需要在两天内完成首次成功发布；否则须删除过期连接并重新创建。**试运行不会验证可信发布授权**，首次真实发布成功后才能确认整条链路可用。验证通过后，可在包设置中选择“要求双重认证并禁止绕过双重认证的密钥”；它不影响可信发布。不要提前撤销仍在使用的其它凭据。

## 手动试运行和发布

打开 [GitHub 发布流程](https://github.com/WiseWong6/wise-motion/actions/workflows/publish.yml)，点击 **Run workflow**，选择主分支 `main`。默认勾选 `dry_run`，只完成构建、检查、打包和发布预检，不上传 npm；取消勾选才会真实发布当前包版本。

## 推送版本标签

先更新版本、重建生成文件，并完成本地所需的检查。以下仅为准备版本的命令，实际版本由维护者决定：

```sh
npm version patch --no-git-tag-version
npm run build
npm run test:ci
```

审阅并提交版本变更、推送主分支后，为该提交创建与包版本对应的标签（例如包版本为 `1.2.3` 时使用 `v1.2.3`），再推送这个标签。标签推送会真实发包，不是试运行。流程不自动提高版本、不重复发布已有版本，也不会绕过 npm 的平台审核。

## 检查范围与失败处理

`npm run test:ci` 包括目录和字体检查、版本与来源核对程序测试、发布请求压缩测试、包安装与素材分发测试、检索与源码交付测试，以及组件接入回归。字体检查依赖 Python 的 `fonttools` 和 `brotli`；发布流程会安装与本机验证一致的固定版本。

完整 `npm test` 还要读取本机私有历史档案与原作文件，继续留在本地执行。云端检查不等同于全部历史回归、真实浏览器播放或视频渲染验收。

发包沿用现有压缩请求程序，固定使用已验证的 npm 11.17.0；包名、包版本或 200 MB 项目体积预算不符时会在上传前停止。检查与打包失败不会发布。上传失败后先看流程日志；如果 npm 页面显示版本正在审核，等待审核完成，不要通过反复换版本、打标签来重传。
