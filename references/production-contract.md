# Wise 视频制作保护约定

本页仅用于已选择 HyperFrames 的视频工程。`wise-video.json` 模板在本技能 `assets/wise-video.json`，校验脚本在 `scripts/wise_video_contract.py`；待检查工程通过 `--project` 传绝对路径，不按技能所在目录推断。

## 1. 边界与生命周期

`wise-video.json` 是索引和保护合同，不是第二份 BRIEF、Storyboard、脚本、设计稿或时间线。

新工程顺序：HyperFrames 路由并写入 `BRIEF.md` → 创建 Storyboard/设计 truth → dry-run 初始化合同 → 按当前任务核对已确认的基线和时间权威 → `--write` → 创作与验证。

已有 `wise-video.json` 时只读取和更新当前合同，初始化命令必须拒绝覆盖。没有合同的旧工程属于 legacy：允许只读检查并明确“有限保证”，不得自动回填文件、重写构建器或迁移 renderer。

按**实际交付版本**确定合同归属。上层项目的合同若索引的是原长版，不得拿它验证子目录中的独立短版；其哈希失败只说明上层合同状态，不是短版画面故障。独立旧版没有自身合同时，在该目录执行有限检查，并分别核对该版预览、时间表、锁定配音、画面源及成片，不得因 `--legacy-ok` 通过就宣称交付通过。

命令从技能根目录执行，工程路径使用绝对路径。初始化默认只试算，核对结果后加 `--write`：

```sh
python3 scripts/wise_video_contract.py init --project "<工程绝对路径>" --timing-authority visual --baseline-ref "git:<已确认提交>"
python3 scripts/wise_video_contract.py validate --project "<工程绝对路径>" --level contract
python3 scripts/wise_video_contract.py validate --project "<工程绝对路径>" --level preview
python3 scripts/wise_video_contract.py validate --project "<工程绝对路径>" --level delivery
```

时间权威和基线参数按真实工程替换；保护级别不代替导出后的成片检查。

## 2. Schema v1

根字段固定为：

| 字段 | 作用 |
| --- | --- |
| `schemaVersion` | 必须为 `1` |
| `authorities` | 指向 HyperFrames 已有 truth 文件 |
| `timing` | 当前时间权威、锁定状态和主源 |
| `cues` | 命名时间点与字幕/动作/切点绑定 |
| `assetLocks` | 内容/风格资产分类和哈希保护 |
| `continuity` | 跨镜对象身份、模式和交接不变量 |
| `baseline` | 用户认可基线及其可验证引用 |
| `variants` | 默认/当前变体、输出和允许差异 |
| `review` | 预览状态和渲染授权 |

### authorities

- 必填：`brief`、`storyboard`、`design`、`composition`，值为项目内相对路径。
- 可空：`script`、`audioTiming`。voice 锁定时两者都必须存在。
- authority 不得使用绝对路径或 `..` 逃出项目。

### timing

- `authority`: `voice | music | visual`。
- `state`: `draft | locked`。
- `source`: 项目内主源相对路径；locked 时必填且必须存在。
- voice locked 时，语音和音频词点不可为迁就画面而静默改写；文案变化必须连带更新语音、字幕和动作。

### cues

每项包含 `id`、`scene`、`sourceRef`、`targets`：

- 音频来源使用 `<relative-json-path>#/<json-pointer>`，例如 `audio_meta.json#/cues/p15-orange-half`。
- 纯视觉手工点使用 `manual:<seconds>`。
- target 只允许 `caption:<id>`、`motion:<id>`、`cut:<id>`。
- Storyboard 使用 `wise_cue_ids: [<id>]` 引用，不复制 cue 秒数。

### assetLocks

每项包含 `path`、`class`、`locked`、`sha256`：

- `class` 为 `content` 或 `style`。
- content 必须锁定；style 可以不锁。
- locked 文件必须存在并与 SHA-256 一致。
- 清空风格资产时，先用该表证明语音、字幕、源画面等内容资产未被触碰。

### continuity

每项包含 `id`、`scenes`、`mode`、`invariants`：

- `mode`: `persistent | pixel-lock | replace | cut`。
- persistent/pixel-lock 至少跨两个 scene，且必须声明交接不变量。
- 常用不变量：`x`、`y`、`scale`、`rotation`、`pivot`、`shape`、`content`。
- Storyboard 每帧用 `wise_object_ids: [<id>]` 声明对象身份；`motion_intent` 按视觉与动作参考的导演意图规则写清唯一强化主体、当前动作与下一段接管，动量衔接记在原动作计划中，不复制一份时间表。

### baseline

- `protected` 必须为 `true`。
- git 基线写成 `git:<commit>`。
- 文件基线写成 `file:<relative-path>#sha256:<digest>`，并在 `sha256` 字段重复 digest 供校验器核对。
- 任一变体输出不得等于受保护文件基线路径。

### variants

- `default` 与 `active` 必须指向 `items` 中存在的 id。
- `allowedDiffs` 只允许 `scene:<id>`、`asset:<path>`、`cue:<id>`。
- 每个输出路径唯一且位于项目内。
- `restoreDefaultAfterBuild: true` 时，delivery 必须恢复到默认变体。

### review

- `previewStatus`: `pending | approved | skipped`。
- `renderAuthorized`: 布尔值。
- `skipped` 只能来自用户明确授权跳过预览，包括直接要求成片且未进行预览验收，并应在 `BRIEF.md` Notes 中记录原指令和依据；成片授权不等于预览已批准。
- delivery 要求 preview 已 approved/skipped 且 `renderAuthorized: true`。

## 3. 权威冲突处理

1. 用户意图冲突看 `BRIEF.md`。
2. 镜头内容冲突看 `STORYBOARD.md`。
3. 旁白原文冲突看 `SCRIPT.md`。
4. 视觉冲突看 `frame.md`。
5. 时间点冲突看 `audioTiming` 指向的元数据；composition 只能实现它。
6. 构建保护冲突看 `wise-video.json`。

发现复制值时保留拥有该事实的 authority，删除其余副本。不得引入 `timeline.json`。

## 4. 变更纪律

- 修改前先核对 baseline、locked assets 和允许差异。
- 只改声明范围；未声明的变体差异视为越权。
- 非默认变体使用独立命名输出，完成后重建默认状态。
- 语音、字幕和动作是一个时序系统；文案、倍速或剪裁改变时三者共同复核。
- 旧工程的历史实现只能作为只读回归材料，不能因新合同被自动重写。
