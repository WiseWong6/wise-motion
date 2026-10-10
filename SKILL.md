---
name: wise-motion
description: 理解动作需求，拆解并匹配动效参考，交付现有源码与接入说明。文字动效、转场、插画与组合均可按需取用。仅在用户明确调用 Wise Motion 时使用。
license: Apache-2.0
disable-model-invocation: true
---

# Wise Motion

## 理解、匹配、交付

1. 提取主体、起止状态、动作关系和明确禁项。简单请求直接匹配；多段动作分别检索，再说明各候选对应哪一段。抽象感受可转成可观察的变化，简短标明假设；不要求设计表。
2. 指定条目时直接查看；否则用 `match.mjs` 找候选。回到原需求说明已覆盖的动作与尚未覆盖的要求；词语命中只是线索，没有合适候选就说明缺口，由调用方继续创作。
3. 用 `show.mjs` 查看用途、预览、真实源码入口、依赖和参数；需要源码时用 `export.mjs` 写入目标目录，返回绝对路径和简短接入说明。详细动作与内容限制按需读取，不把整段源码放进对话。

字幕、分镜、配色和整片组合由调用方自行设计；文字动效和转场是可选素材。使用参考不需要填写创作理由或遵循固定制作顺序。目录示例和默认参数不构成用户约束。

## 命令

先解析安装入口，以本技能实际目录作为下列 `<技能目录>`；命令可在任意工作目录调用。检索、查看、源码导出只需 Node.js，版本要求见 [包配置](package.json)；组件运行依赖见 [组件说明](REMOTION.md)，导出不自动安装依赖。

```sh
node "<技能目录>/scripts/match.mjs" "两排卡片反向持续滚动，不要轮播"
node "<技能目录>/scripts/show.mjs" <编号或名称> [--variant <样式>] [--details]
node "<技能目录>/scripts/export.mjs" <编号或名称> --out-dir <目标目录> [--variant <样式>]
```

导出复用目录“复制源码”的生成逻辑：已提供独立工程的条目写出工程文件；普通条目写出组件接入示例，运行需安装现有共享组件包及素材。写入前检查全部目标文件，同名冲突时停止；目录内其他文件保留。预览可直接打开 `catalog/index.html`，无需服务器。

## 按需读取与核对

- 入门、内容参数与速选：[快速上手](references/quickstart.md)；动作转译：[需求方法](references/method.md)；分类浏览：[动效索引](references/index.md)。
- 组件和素材接入：[组件说明](REMOTION.md)、[播放接口](references/runtime-interface.md)、[Remotion 接入](references/remotion-production.md)。保留时长、循环、透明背景支持和运行环境等技术事实。
- 检查：[验证矩阵](references/validation-matrix.md)。区分文件检查、实际渲染与人工播放；默认不截图或启动浏览器。
- 维护目录：[目录维护](references/catalog-maintenance.md)；追溯来源：[历史来源](references/history.md)、[来源与许可](references/sources.md)、[版权说明](NOTICE.md)。
