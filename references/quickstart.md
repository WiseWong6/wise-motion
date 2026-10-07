# 快速上手

本页用于需要新建分镜计划的字幕或多镜头视频制作。已有故事板和时间表继续沿用；参考、方案、静态画布与单个动效按 [技能正文](../SKILL.md) 选择流程。设计判断见 [导演设计方法](director-design.md)。

命令从本技能实际目录执行，输入和输出指向目标工程的绝对路径；全局调用时先解析安装入口。制作依赖与素材按 [Remotion 说明](../REMOTION.md) 准备。

## 五步

1. **切镜头。** 把字幕存成文本文件，运行
   `node scripts/plan.mjs init <字幕绝对路径> <工程目录>/plan.json`。每行或每句先成为一镜，并给出暂定秒数；按意思把短句合并、把长句拆开。有音频或锁定字幕时保留原词句和时间。
2. **逐镜写清变化。** 打开目标工程的 `plan.json`，每镜填六项：`subject` 看谁、`from` 起始状态、`to` 结束状态、`meaning` 观众理解什么、`hold` 停留多久并看清什么、`handoff` 怎样交给下一镜。变化要能说明内容，同一时刻只有一个强化主体。写不出来就先补齐设计。
3. **选动效。** 先看下面的“按镜头用途速选”，再用
   `node scripts/match.mjs "起始状态到结束状态的动作描述"` 补充候选，用
   `node scripts/show.mjs <id>` 查看细节并**打开列出的源码**。然后在该镜的 `effect` 里选一种：
   实现分类按 [导演设计方法](director-design.md) 判断，字段填写如下：
   - `reuse`：填写条目、来源及所需的 `content`、`variant`、`speed` 等配置；
   - `tweak`：另填 `effect.prompt` 与独立实现的 `effect.component`，接入方式见下文；
   - `original`：填写 `effect.prompt`、`effect.component`、`effect.nearest` 和 `effect.why`。`nearest` 为最接近的动作 id，确实无候选填 `null`；`why` 说明候选的核心动作为何不适用或检索缺口。
   动效自带示例内容；先用 `show.mjs <id> --variant <样式 id>` 查看该样式支持的内容槽。不能只读参考后完全重写，再把镜头标成复用。
   `effect.source` 填 `show.mjs` 给出的“路径#入口”，据此打开对应实现。完整复用组合时，连同组成动作一起读；新增组合按独立动作逐项实现。
4. **检查。** `node scripts/plan.mjs check <工程目录>/plan.json`。有“错误”就改到通过；“提醒”要逐条判断是否接受。
5. **装配与完成。** `node scripts/plan.mjs build <工程目录>/plan.json <工程目录>/src/index.jsx`。复用镜头按配置装配；微调和原创从 `component` 引用独立实现，未填写时渲染会明确报错；按 [阶段制作方法](pipeline-methodology.md) 逐项完成，实现一项并通过必要检查后再做下一项，最后整合并按请求导出。检查范围见 [验证矩阵](validation-matrix.md)，分别报告脚本检查、渲染与实际观看结果。

## 换成自己的内容

1. 安装素材后，把每镜的内容放在 `effect.content`；直接写组件时传入 `content`。已支持的条目和变体见下面内容覆盖表；`show.mjs` 会列出可填字段和未支持项。具体格式见 [内容参数](../REMOTION.md)。
2. 例如计数内容 `{"value":1000000,"format":"compact","suffix":" tokens"}`，末帧显示 `1M tokens`；逐字显现内容 `{"text":"涂鸦做网站"}`。同一动效的两个镜头分别传内容，互不覆盖；不必改素材源码。
3. `check` 检查字段、字数、行数和时钟限制；真实字体加载后再测实际宽度，过宽会明确报错。缩短文字或有意调整布局，不把缺字、截字或空画面当成成功。先完成一个自定义镜头的渲染，再扩展到其他镜头。
4. 目录自带的思源黑体和霞鹜文楷保留完整字符（`npm run check:fonts` 核对），常用汉字不需要补字；字体权利见 NOTICE.md。内容槽自动为常见中文和英文选择现有字体；罕见字符及表情符号仍需单独核对。
5. 没有内容槽或需要改变布局、颜色和动作时，先复制 `show.mjs` 列出的源码及依赖，在目标工程中建立独立实现，避免修改共享素材文件牵连别的镜头。粒子聚字已提供专用 `text` 槽；结尾生长字标与分层署名仍是预存轮廓，尚无内容槽，不要把替换字符串当成完成换字。
6. 素材安装会记录文件校验值；再次安装发现副本被改，会在复制前停止。先迁移或保留改动，只有明确要丢弃这些改动时才传 `--overwrite`。内容配置留在计划或项目源码中，不会被素材安装覆盖。
7. `build` 只负责装配；实现结果仍需核对文字、位置和显示时长，按验证矩阵检查，需要成片时重新导出。

[示例计划](plan-example.json)包含内容复用与待实现的微调镜头，可复制到目标工程后按需求改写。

## 独立实现与重新装配

微调和原创的组件保存在目标工程，`component.path` 相对生成的装配入口。每个镜头可以引用不同文件，也可以共用支持实例参数的组件。微调仍填写原参考的 `id`、`source` 和提示词，例如：

```json
"effect": {
  "mode": "tweak",
  "id": "word-slam",
  "source": "catalog/effects/word-slam.js#word-slam",
  "prompt": "把撞入位置移到画面左侧，保留原有撞击节奏与残影，右侧留白供下一镜交接。",
  "content": {"words": ["开始", "聚焦", "完成"]},
  "component": {"path": "./scenes/WordSlamScene.jsx", "export": "WordSlamScene"}
}
```

微调组件接收 `content`、`speed`、`variantId`、`width`、`height`；按传入配置和 Remotion 当前局部帧绘制，速度只换算一次。内容字段仍按参考条目的接口检查；超出其接口的布局和造型改动在独立组件中实现。原创组件按自身设计读取局部帧和工程参数。

执行 `build` 只更新装配入口，独立组件的文件与引用在重新装配后保留。计划阶段可以暂缺 `component`，生成结果会列为待实现并在渲染时报错；填写路径后还须核对文件存在、导出名称和实际画面。多个镜头分别改造同一参考时，各自接入独立实现，保持公共素材不变。

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

## 一镜多层

`effect` 与 `layers` 二选一。最多三层，按 `background`、`main`、`overlay` 顺序，每种最多一层，必须有 `main`；所有层使用镜头的同一起止帧。上层候选为 `type-reveal`、`count-up`、`word-focus`，仅能直接复用且必须有对当前源码有效的透明审计记录，`check` 会核对并拒绝过期记录。微调和原创实现只能单镜或作为 `background`；原参考的透明检查不能证明改写后的组件仍透明。其他条目只能单镜或放在底层；不使用滤色混合冒充透明底。

```json
"layers": [
  {"role":"background","mode":"original","nearest":"diffuse-light-drift",
   "why":"背景要呈现沿标题扩散的几何环，现有弥散光团的动作无法对应。",
   "prompt":"深蓝底上一个青色圆环缓慢扩散，标题出现后继续减速，末尾停留一秒。",
   "component":{"path":"./scenes/Background.jsx","export":"Background"}},
  {"role":"main","mode":"reuse","id":"type-reveal",
   "source":"catalog/effects/attention.js#type-reveal","content":{"text":"涂鸦做网站"},
   "box":{"x":160,"y":100,"width":1600,"height":900}}
]
```

`box` 是当前输出画幅中的像素位置和尺寸，省略时占满画幅；框内等比适配，文字实际占位需核对。示例尺寸适用于 1920×1080。原创背景放独立文件并导出指定组件；路径相对生成的入口文件。重新 `build` 只更新装配，不覆盖原创组件。缺少组件的原创仍可检查计划，但渲染会明确失败，不能交付占位片。

透明模式会关闭外层底色、暗角和颗粒，不改动效自身绘制公式。透明审计包含全帧透明通道及源码审查，记录源文件指纹；源码变化后审批失效。运行 `scripts/audit-layers.mjs <源码外结果.json>` 重新取证后，维护者复核并更新 `catalog/layer-audit.json`；此脚本不自动把未知动效批准为上层。输出边界由 `WISE_MOTION_RENDER_DIR` 指定。

跨模型测试的统一输入、检查留证和评分方式见 [模型评测协议](model-evaluation.md)。


## 按镜头用途速选

用下表找候选，再按镜头目的、动作阶段和源码核对。装配时会按镜头自动调速（0.5 至 2 倍）；示例内容优先通过内容槽替换，超出支持范围再微调代码。

| 镜头要做的事 | 首选 | 备选 |
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

没有合适的就用 `match.mjs`，仍没有就选 `original`；按 [目录索引](index.md) 的分类浏览也行。

## 好动效的底线

先沿用用户已确认的视觉和节奏。以下是未指定时的经验起点，内容需要时可以突破，在 `effect.prompt` 或 `hold` 里说明理由。

1. **读得完。** 字幕按每秒约 6 个汉字加 0.3 秒估算最短时长，`check` 会提醒不够的镜头；有配音以实测词点为准。
2. **看得清再动下一个。** 结果出现后留一小段停留，再交给下一镜；不要一个动作还没落稳就开始下一个。
3. **入场减速，离场加速。** 默认用末尾减速的曲线；匀速只用于持续滚动、旋转这类循环。
4. **错峰要有规律。** 同组对象依次出现时间隔保持一致，经验值约 0.08 至 0.15 秒；全部同时出现等于没有顺序。
5. **颜色克制。** 一镜以黑白灰为底，最多再加一个强调色；材质类条目（金属、玻璃、纸）保留各自配色，不要再叠滤镜。
6. **字号成档。** 采用 640×360 画板的目录效果常用 12、16、24、32、48、64，正文从 16 起；其他画幅按阅读需求确定。复用时保留原画板比例。
7. **同一个动效最多连用两次。** 想重复就换同类的另一个，或改变方向与节奏。
8. **转场只用在语义换段。** 同一段内部用硬切；复杂转场不要遮住上一镜的结果。
9. **改了就重新生成。** 改 `plan.json` 后重新 `build`，不要手改生成文件里的帧数。

## 提示词模板

微调和原创在改代码前填写，用可观察的动作和参数说明每一项：

```
对象与构图：<谁、在画面哪里、多大>
起始状态：<动作开始前看到什么>
推进：<先发生什么，再发生什么；方向、距离、顺序>
落点：<停在哪里，保留什么>
节奏：<总时长；哪一段快，哪一段慢；错峰间隔>
保持不变：<沿用原条目的哪些部分>
避免：<不能出现的跳变、遮挡、同时抢焦点>
```

计划检查只验证结构与已声明的约束；微调、原创和整合检查完成后，才能按实际结果交付作品。
