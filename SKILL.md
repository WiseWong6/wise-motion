---
name: wise-motion
description: 将需求转译为画面变化与动作关系，检索、改良或原创动效，按请求交付参考、方案、静态画布、可播放动效或视频。字幕与多镜头制作可用分镜计划脚本，新动效默认使用 Remotion。仅在用户明确调用 Wise Motion 时使用。
license: AGPL-3.0-only
disable-model-invocation: true
---

# Wise Motion

## 先确定交付

读当前项目约定并检查已有改动。修改已有作品时，先确认用户正在看的预览、画面源、音频、时间表与成片版本，在原故事板或动作计划上继续；沿用原技术栈与时间表。

| 用户需要 | 执行路径 |
| --- | --- |
| 找参考、比较或设计方案 | 完成下面的需求转译与候选选择，交付理由、方案和源码路径 |
| 静态画布或普通网页 | 明确受众、核心内容、观看或交互路径与视觉方向，按 [阶段制作方法](references/pipeline-methodology.md) 完成对应阶段 |
| 单个可播放动效 | 选定参考或原创方向，按 [阶段制作方法](references/pipeline-methodology.md) 逐项实现；新动效读 [Remotion 制作指南](references/remotion-production.md) |
| 字幕或多镜头视频制作 | 沿用已有计划；新建计划按 [快速上手](references/quickstart.md) 执行 |
| 修改、检查或导出已有作品 | 只回到本次所需阶段，使用原工程的检查和导出命令 |

## 从需求选参考

1. **先转译。** 说明表达目的、主体起止状态、动作先后与因果、节奏与停留、用户约束。抽象感受放回内容里解释成可观察的变化；能合理推荐就推进，关键缺口才追问。构图、改良和随机组合见 [导演设计方法](references/director-design.md)，模糊感受见 [需求方法](references/method.md)。
2. **再找候选。** 用 `match.mjs` 检索转译后的动作描述与禁项，多段动作分别找；字幕、主体与转场也分别判断。用户已指定条目时直接读该项，按此次用途核对。检索只提供线索，没有候选时继续设计或原创。
3. **读源码后决定。** 用 `show.mjs` 查看用途、动作阶段与路径，再打开拟采用项的源码。按导演设计方法中的实现分类选择复用、微调或原创；内容参数、独立组件与分镜装配见 [快速上手](references/quickstart.md)。

## 制作

沿用已有故事板和时间表；新建字幕或多镜头计划时，按快速上手完成切镜、设计、选型、检查与装配。有音频或锁定字幕时保留原词句和时间，纯文本的时长标为暂定；无字幕时按同一计划格式说明每镜内容。

按 [阶段制作方法](references/pipeline-methodology.md) 逐项实现：当前动作通过必要检查后再做下一项，最后检查相邻交接。微调和原创组件放在目标工程中，缺少实现的镜头仍是待完成项。

## 素材与检查

- 具象插画、场景、材质或情绪表达，优先产出实际素材；几何图形、精确数据和已有原件使用代码或原素材。生成图片遵循宿主与用户限制；Codex 只用内置 `image_gen.imagegen`，失败时说明阻塞。
- 新动效默认使用 Remotion，用户本次明确指定其他技术时按其要求。随机数固定种子或保存结果，预览和导出复用同一画面与时间来源。
- 检查按 [验证矩阵](references/validation-matrix.md) 覆盖本次范围；默认不截图、不做耗时视觉自检。有旁白时再读 [教程复查](references/narrated-tutorial-review.md)，核对词点与落点。
- 外部事实、代码、素材和字体按 [来源与许可](references/sources.md) 查证，公开前核对 [版权说明](NOTICE.md)。

## 命令

以下命令从本技能实际目录执行，全局调用时先解析安装入口。计划与装配文件使用目标工程的绝对路径；视频输出目录按下表指定。检索、查看和分镜计划只需 Node.js；制作、构建与导出先核对 `package.json` 中的版本要求，依赖与素材按 [Remotion 说明](REMOTION.md) 准备。

| 目的 | 命令 |
| --- | --- |
| 按动作描述找候选（最多 5 个） | `node scripts/match.mjs "卡片依次上移显现，落位后保留，不要逐张切换"` |
| 查看一个动效的细节、源码与 Remotion 片段 | `node scripts/show.mjs <id 或名称>` |
| 生成、检查、装配分镜计划 | `node scripts/plan.mjs init\|check\|build ...` |
| 单个动效渲染成 MP4 | `WISE_MOTION_RENDER_DIR="<产物目录绝对路径>" npm run render -- <id> <文件名>.mp4` |
| 浏览目录（无需服务器） | 直接打开 `catalog/index.html` |

## 按任务读取

只读本次需要的，不遍历资料库。

| 当前工作 | 读取内容 |
| --- | --- |
| 分镜字段、速选表、内容替换与提示词示例 | [快速上手](references/quickstart.md) |
| 逐个开发、提示词分支、合成与交付 | [阶段制作方法](references/pipeline-methodology.md) |
| 构图、连续视频动作、排版与焦点交接 | [视觉与动作方法](references/wise-motion-dna.md)，连续运动仅适用于连续视频，用户明确的停留要求优先 |
| 有旁白教程、改词或逐句复查 | [有旁白教程复查](references/narrated-tutorial-review.md) |
| 接入目录里的可播放参考 | [播放接口](references/runtime-interface.md)、[轻量索引](references/index.md) |
| HyperFrames 工程的时间、资产、基线与变体保护 | [制作保护约定](references/production-contract.md) |
| 修改参考目录、分类、收录或复制输出 | [目录维护](references/catalog-maintenance.md)，目录主题不约束新作品 |
| 书法轮廓、材质衔接或首次播放准备 | [精修方法](references/material-refinement.md) |
| 追溯已迁入条目的原作 | [历史来源与维护](references/history.md)、[来源与许可](references/sources.md) |

## 交付

- **参考或方案：** 说明变化过程、候选理由、约束与关键假设、复用和改良部分，附参考与真实源码路径；未实现的标为方案。简单请求几句话即可。
- **实现或成片：** 提供可打开的绝对路径，分别说明脚本检查、实际渲染和人工观看的结果及未验证项。导出后源有变化就重新导出，或明确成片仍是旧版。保留验收文件，清理本次无关临时产物与进程。

有故事板或动作计划时，采用方案与关键参数记在原文件里，不另造副本。提交、发布、删除旧版本和向其他聊天发消息遵循当前授权。
