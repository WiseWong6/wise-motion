# Wise Motion

把想法、字幕或已有画面转成动效参考、设计方案和可播放作品。可以从本地目录选动作、换内容、改良组合，也可以按表达需要原创；交付范围由你的请求决定。

## 浏览动效

直接打开 [动效目录](catalog/index.html)，无需安装依赖或启动服务器。

<!-- catalog-counts:start -->
目录有 288 个单个动作、90 个插画单图、40 个组合片段，共 418 项；数量由目录定义自动生成，详见 [目录统计](CATALOG-STATS.md)。
<!-- catalog-counts:end -->

搜索或按分类选择条目，预览动作并调整节奏，再复制提示词或代码。组合可查看组成部分和相关动作；复制代码附带所需依赖、素材与运行说明。

## 使用技能

在工具的技能列表中选择 **Wise Motion**。Codex 可用 `$wise-motion`，Cursor 可用 `/wise-motion`。例如：

```text
$wise-motion 找两排卡片反向持续滚动的参考，不要停顿，说明选择理由并给出源码。

$wise-motion 为“杂乱信息逐步形成清晰观点”设计一段动效，先给方案。

$wise-motion 根据 /视频工程/字幕.txt 制作视频，保留字幕原句和时间，成片放到 /视频工程/renders。
```

只要参考时交付选择理由和源码位置；需要制作时，先明确画面变化，再逐项实现和检查。新动效默认使用 Remotion，修改已有工程时沿用原技术与时间表。

全局使用时，让安装入口直接链接到技能实际目录：共享入口为 `~/.agents/skills/wise-motion`，Codex 为 `~/.codex/skills/wise-motion`，ZCode 为 `~/.zcode/skills/wise-motion`。已有入口先核对指向；安装后刷新技能列表或新开会话。

## 环境与常用命令

以下命令从技能实际目录执行。检索、查看和分镜计划只需 Node.js；制作与导出的版本要求见 [package.json](package.json)。

```sh
node scripts/match.mjs "卡片依次上移显现，落位后保留，不要弹跳"
node scripts/show.mjs stagger-in
```

导出单个目录动效前安装项目依赖并构建：

```sh
npm ci
npm run build
npm run render -- stagger-in stagger-in.mp4
```

默认成片保存在相对技能目录的 `../../state/wise-motion/renders/`。要导出到自己的视频工程，指定产物目录：

```sh
WISE_MOTION_RENDER_DIR="/视频工程绝对路径/renders" npm run render -- stagger-in stagger-in.mp4
```

文件名或绝对路径都必须位于指定产物目录内。视频导出使用 Remotion 临时服务；本地目录仍可直接打开。

制作多镜头视频见 [分镜快速上手](references/quickstart.md)。复用组件、替换内容及安装字体图片见 [Remotion 使用说明](REMOTION.md)。

## 详细说明

| 需要做什么 | 文档 |
| --- | --- |
| 让代理执行任务 | [技能说明](SKILL.md) |
| 理解需求、选参考或设计新动作 | [导演设计方法](references/director-design.md) |
| 逐项制作、合成与交付 | [阶段制作方法](references/pipeline-methodology.md) |
| 核对实现与成片 | [验证矩阵](references/validation-matrix.md) |
| 修改目录、分类或收录条目 | [目录维护](references/catalog-maintenance.md) |

维护目录后运行 `npm run check` 并执行受影响的测试；`npm test` 包含历史迁移检查，需要本地私有历史档案。浏览器体验按 [人工验收步骤](tests/manual.md) 核对。

## 许可

自有技能与源码使用 **AGPLv3**；第三方代码、字体和素材保留各自许可与署名。使用及分发前查阅 [版权与来源说明](NOTICE.md) 和 [完整许可](LICENSE)。
