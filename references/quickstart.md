# 快速上手

本技能提供动作检索与源码交付，组合方式由调用方决定。命令中的 `<技能目录>` 为安装入口解析后的实际目录，目标目录可用绝对路径或相对当前工作目录的路径。

## 找到并取用

```sh
node "<技能目录>/scripts/match.mjs" "四张卡片依次出现，按顺序"
node "<技能目录>/scripts/show.mjs" stagger-in
node "<技能目录>/scripts/export.mjs" stagger-in --out-dir "/目标工程/卡片动作"
```

多段动作分别检索，候选说明对应片段和未覆盖要求。查看默认输出即可决定是否读取源码；需要详细阶段、内容字段和限制时加 `--details`。样式用 `--variant <样式编号>` 选择，查看与导出使用同一编号。

## 使用导出文件

浏览器“复制源码”和命令行共用生成逻辑。独立工程包含 `package.json`、`index.jsx` 和实际绘制文件，按生成的 README 准备依赖后播放或渲染。

普通条目包含 `src/Root.jsx`、`src/index.jsx` 和 README；它是共享组件包的接入示例。在目标工程按生成说明安装固定版本的公开包和依赖，再运行素材安装脚本。需要使用尚未发布的本地改动时，先从技能目录构建并打包，再安装生成的包文件。导出命令只写文件，不安装依赖。含图片、字体或声音的组合继续通过同一共享包取用原素材。

可导出到现有目录；先检查所有目标文件，任一文件同名冲突时整批停止，保留目录内其他文件。输出的代码与说明只使用相对工程路径；命令结果给出文件的绝对路径。不要把整个代码复制进对话。

## 内容与透明背景

通过组件的 `content` 更换支持的文字和数据；默认值、字数、项目数及宽度限制用 `show --details` 查看。超出接口的布局可由调用方修改源码。组件参数、素材安装、声音和透明背景支持见 [组件说明](../REMOTION.md)；透明支持由当前绘制源码的审计结果决定。

## 内容覆盖与边界

| 用途 | 已支持内容槽 | 填法 |
| --- | --- | --- |
| 开场与大字 | `word-slam`、`type-reveal` | `words` 或 `text` |
| 标题加卡片 | `title-content` | `title`；`cards` 固定三项，每项 `title`、`description` |
| 错峰卡片 | `stagger-in` | `labels` 固定四项 |
| 依次强调 | `word-focus` | `words` 固定三项 |
| 数字与对比 | `count-up`、`bar-growth` | 前者见组件说明；后者 `items` 固定六项，每项 `label`、`value`，百分比整数 0–100 |
| 终端 | `terminal-code` 的两个变体 | 先用 `show --variant` 查各自结构 |
| 时间轴 | `timeline-progress` | `items` 固定七项，每项 `date`、`line1`、`line2` |
| 界面操作 | `interface-feedback`、`button-press-status` | `states` 固定三个状态；前者另有 `result` |
| 粒子标题、结尾 | `particle-word` | `text` 单行短语，如 `SPACE BUNNY`、`涂鸦做网站`、`中文 NO.1` |

上表之外的速选条目尚无内容槽；不能假定同类或同一文件里的其他动效也支持。`node scripts/audit-content.mjs` 只读输出按条目、变体、共享依赖分组的检索清单，字面量线索仍需读源码确认。覆盖率以有换文案需求的变体为分母，背景、纯转场不算内容缺口。

卡片、时间轴的数量暂时固定，保留原布局和先后关系；支持常用中文，过宽会报错而非截字。粒子自定义文字先加载现有字体，再生成当前实例的点阵，默认仍用预存字形。64 字是资源保护上限，不是承诺可读字数；实际字形缩小到不足十行采样点会拒绝。采样画布和种子固定，仍以配套浏览器渲染结果为准。

## 按动作用途速选

下表提供候选，不规定制作顺序；内容、速度和组合方式按需求调整。

| 动作要做的事 | 首选 | 备选 |
| --- | --- | --- |
| 开场金句、大字 | `word-slam` 文字撞入换位 | `type-reveal` 文字逐字显现、`particle-word` 粒子聚散成字 |
| 标题加内容 | `title-content` 标题内容展开 | `title-stagger` 标题依次呈现、`fade-rise` 淡入上移 |
| 几项内容依次出现 | `stagger-in` 错峰入场 | `group-expand` 卡片逐张放大、`material-card-stagger` 错峰升入回弹 |
| 强调一个词 | `word-focus` 词语划线强调 | `dim-focus` 周围淡化聚焦、`focus-zoom` 放大聚焦 |
| 数字与对比 | `count-up` 读数递增 | `bar-growth` 柱条依次长高、`benchmark-columns` 数据分栏对比 |
| 展示代码或提示词 | `terminal-code` 代码逐行输入 | `glyph-code-fill` 字形内文字流动、`live-code-readout` 代码参数联动 |
| 零散的东西收到一起 | `motifs-gather-atlas` 缩拢收入群像 | `line-converge` 连线汇聚、`card-compress-merge` 卡片压缩合并 |
| 步骤与流程 | `staged-build` 内容逐层累积 | `experience-progress` 卡片逐项聚焦、`timeline-progress` 时间轴依次点亮 |
| 演示界面操作 | `interface-feedback` 按钮操作反馈 | `button-press-status` 按钮按压换态 |
| 切到下一段 | `wipe` 画面擦入切换 | `shared-object` 同一主体跨场、`zoom-transition` 缩放穿越转场、`page-cover` 新页推入覆盖 |
| 结尾字标 | `seed-bloom-brand-sequence` 生长化蝶与光形字标 | `outro-credit-lift` 文字分层升入、`particle-word` 粒子聚散成字 |
| 背景氛围 | `diffuse-light-drift` 弥散光团流动 | `star-twinkle` 星点错峰闪烁、`film-scratch-flicker` 胶片纹理闪动 |

没有合适的候选就说明缺口；也可按 [目录索引](index.md) 分类浏览，由调用方继续创作。
