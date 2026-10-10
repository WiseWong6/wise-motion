# Remotion 动效组件

`WiseMotionEffect` 保留原绘制代码、字体、逻辑尺寸和运动公式，以 Remotion 帧号转换到原目录毫秒时钟。
素材与绘制程序随源码包交付，不依赖原目录。目录默认用 640×360 逻辑画板，改变 width/height 仅等比缩放。

十八个已有原声的完整组合默认带上配乐和音效，暂停、定位、循环和变速使用同一帧时钟。目录默认静音，点播放条的声音开关试听；组件或导出需要静音时传入 `includeAudio={false}`。独立动作、插画和静态缩略图不增加声音。原录音、合成源码、固定排程及许可见 [组合声音来源](catalog/assets/composition-audio/SOURCE.json)。离线重建合成音轨使用 `node scripts/build-composition-audio.mjs`，需要已安装的 Remotion 浏览器与 `ffmpeg`；普通预览和视频导出直接使用随包音轨。

## 使用

```jsx
import {WiseMotionEffect,getEffectMetadata} from 'wise-motion';
const meta=getEffectMetadata('stagger-in');
const Scene=()=> <WiseMotionEffect effectId="stagger-in" />;
```

参数：effectId、variantId、speed（0.5–2）、ease、theme（dark/light）、assetBaseUrl、bookSettings、content、transparent、width、height。
默认帧率60。`sampleMode="playback"`保留原绘制的逐格取样；`exact`用于目录精确定位。末尾停留及循环累计时间保留。
`getEffectMetadata`返回时长、帧数、尺寸和循环标记。非循环帧数包含准确结尾的一帧，循环不重复结尾。
`onReady`在字体、素材及首个目标帧准备完成后触发；加载失败报错，视频导出中断。

在目标工程安装公开包并复制素材：

```sh
npm install --save-exact wise-motion@0.1.8
node node_modules/wise-motion/scripts/install-assets.mjs public/wise-motion
```

全部素材明细与校验值在 `ASSET-MANIFEST.json`。素材副本不提供目录首页；浏览请打开源码中的 `catalog/index.html`。目标工程的Remotion依赖需和包版本一致。
目录中的“复制代码”提供完整Composition例子和安装步骤。`Sequence`能控制每个组件的起点；多个组件用独立画板，互不覆盖。
翻页书在目录中保留真实交互；导出组件总是固定演示动作。

单独使用 `catalog/remotion-player.js` 时，先载入 `catalog/registry-data.js`；浏览器播放器共用页面数据以减少加载体积。目录和生成的有声演示页已包含正确顺序，`WiseMotionEffect` 独立组件不需要手动载入这两个脚本。

## 自定义内容

`content` 是当前组件实例的内容配置；同一动效的多个镜头可传不同文字。只换内容不需要改素材副本。字段、类型和长度错误在装配及组件入口报错；绘制等待本地字体加载并测量字宽，过宽时报错。省略内容、传空对象或显式传入全部默认值，均保持原默认绘制；不改变动作公式和时间表。

```jsx
<WiseMotionEffect effectId="word-slam" content={{words: ['开始', '聚焦', '完成']}} />
<WiseMotionEffect effectId="type-reveal" content={{text: '让想法动起来'}} />
<WiseMotionEffect effectId="count-up" content={{value: 1000000, format: 'compact', suffix: ' tokens'}} />
<WiseMotionEffect effectId="count-up" content={{value: 1, prefix: 'NO.'}} />
<WiseMotionEffect effectId="terminal-code" variantId="default" content={{
  title: '创作终端',
  lines: [[['const ', 'muted'], ['idea = "新画面";', 'teal']], [['render(idea);', 'ink']]],
}} />
```

| 动效 | 支持字段与限制 |
| --- | --- |
| 撞字 `word-slam` | `words`：1–8 项，每项最多 16 字；保留切词节拍，少于八词时停在末词 |
| 逐字显现 `type-reveal` | `text`：最多 13 字，保证原打字时钟内完成；自动适配字宽 |
| 计数 `count-up` | `value` 目标数、`from` 起点（均为 ±1 万亿内有限数字）、`prefix`/`suffix`（各最多 16 字）、`caption`（最多 44 字）、`decimals`（0–6）、`format` |
| 代码终端 `terminal-code/default` | `title` 最多 32 字；`lines` 1–3 行，每行最多 60 字，由 `[文字, 色调]` 对组成，色调仅 `ink`、`muted`、`teal`；实际字宽超出最小字号承载范围仍会报错 |
| 日志终端 `terminal-code/command-log` | `title` 最多 40 字；`lines` 必须九行纯文字，首行最多 20 字、其他行最多 40 字；保留原先后顺序、调试状态、成功状态和颜色 |

第二批支持标题卡片、错峰卡片、词语强调、百分比柱图、时间轴、按钮反馈和粒子聚字，字段与数量见 [内容覆盖表](references/quickstart.md#内容覆盖与边界)。默认值、记录字段和字数限制以 `show.mjs <id>` 为准。

`transparent={true}` 的候选为逐字显现、计数、词语强调，使用时还须通过对当前源码有效的透明审计；过期记录会被拒绝。此属性关闭页面外壳的底色、暗角和颗粒。单镜默认不变；多层计划、定位框与独立实现见 [一镜多层](references/quickstart.md#一镜多层)。

数字格式 `integer` 为整数（小数位须为 0），`decimal` 固定小数位，`thousands` 加英文千分位，`compact` 使用 K/M/B/T。内容对象不接受未登记字段、换行和控制字符。不支持的动效传入非空内容会报错，不会静默忽略。内容槽没有通用字体或颜色参数；中文使用包内思源黑体，纯英文/数字使用 Oswald，罕见字符另行核对。

用 `show.mjs <id> --variant <样式 id> --details` 查看当前样式的内容默认值、限制和真实绘制路径；通过组件 `content` 传入即可。`export.mjs` 写出目录复制功能提供的工程或组件示例，见 [快速上手](references/quickstart.md)。

素材安装在 `.wise-motion-assets.json` 记录已装文件。重装前检查全部文件，发现本地改动会停止，防止静默覆盖；明确需要替换这些改动时才使用 `--overwrite`。配置放在项目源码或计划里，与公共素材分开保存。

`wise-motion` 是本项目现有绘制代码与 Remotion 适配器的交付包，不是另外下载的一套动效。安装包是复用入口之一；复制源码并自行接入也可以，但要连同依赖、字体、加载逻辑和许可处理。仅全原创且未引用组件的工程无需安装它。

## 蝴蝶插画与圆形转场

版画蝴蝶（`butterfly-illustration`）与四翼错拍、触角跟随（`hinged-wing-flap`）共用图集、运动计算和绘制程序。目录保留透明插画；视频也可直接使用原生帧组件：

```jsx
import {WiseMotionButterfly, WiseMotionCircularReveal} from 'wise-motion';
// 原逻辑画幅为1080×1440；seconds为局部动作秒数，可省略以使用当前帧。
const Butterfly = () => <WiseMotionButterfly background="transparent" />;
// 将整页作为children放入遮罩，或不传children，用作纯色覆盖层。
const Paper = ({seconds, children}) => <WiseMotionCircularReveal
  seconds={seconds} variantId="paper-expand">{children}</WiseMotionCircularReveal>;
const BlackCover = ({seconds}) => <WiseMotionCircularReveal seconds={seconds} variantId="black-cover" />;
```

蝴蝶支持`atlasSrc`、`wingAtlasSrc`、`selection`、`wingSelections`、`revealFromRoot`、`motionState`、`background`、`seconds`、`speed`。默认蓝蝶图集位于`public/wise-motion/catalog/assets/butterfly/wing-atlas.png`；多彩翼图同目录的`ai-wing-atlas.png`可作为`wingAtlasSrc`，`selection`从0到1使多彩版退到蓝色版。`wingSelections`按四翼顺序单独控制进度，`revealFromRoot`使蓝色纹理从翼根向外展开，`motionState`接受同一运动计算器生成并调整后的完整姿态。图集加载并解码后才解除导出等待，缺图明确失败。原画板、翼根、六秒循环和触角延迟保留，外部换画幅时应等比容纳。

圆形转场收录为`iris-open-transition`的两个示例：`paper-expand`在0.45秒内从(540,1180)展开米白页面；`black-cover`在0.40秒内从(540,850)展开黑色覆盖层。两者终态半径均为120%，无描边。目录示例另保留动作前0.15秒和动作后0.45秒；原生组件按显式局部秒数立即开始，可保留既有视频时间。原来的`standard`示例仍保留暖白边缘轮廓。

原生帧组件与目录共用`catalog/effects/butterfly.js`、`butterfly-motion.js`及`circular-reveal.js`，源码组件在`catalog/remotion/`，图片来源与校验值在`catalog/assets/butterfly/SOURCE.json`。

已提供原生逐帧组件的生长化蝶与光形字标及其四个独立动作，复制输出保留完整工程源码、矢量字形和许可，不依赖此包或本机目录。其已确认独立工程固定 Remotion 4.0.529；通用复用包沿用 Remotion 4.0.532，二者按各自复制说明安装。原生组件保留在 `catalog/remotion/seed-bloom-brand.jsx`，绘制源码与目录逐字一致。

金属落地、水平对撞成字及扫光使用 WebGL。目录复制的这些条目会在导出命令附加 `--gl=angle`；自建视频只要包含这些金属组件（包括串联或叠放），也需使用 `npx remotion render src/index.jsx Effect output.mp4 --gl=angle`，或为渲染接口设置 `chromiumOptions: {gl: "angle"}`。其他动效保留默认图形设置。组件会在画布或图形环境不可用时明确报错，不把空画面作为成功结果。

## 本地命令

```sh
npm ci
npm run build
npm test
WISE_MOTION_RENDER_DIR="/视频工程绝对路径/renders" npm run render -- stagger-in stagger-in.mp4
```

`npm run build` 同时更新目录数据、可复用组件和本地播放器。Remotion 构建输出留在当前工程；日常构建不读取或更新源码外的历史审查记录。历史记录修改后单独运行 `npm run build:history`。视频默认保存到私有状态目录 `../../state/wise-motion/renders/`。`render` 的第二个参数是该目录中的文件名或子路径。需要放在独立视频工程时，可显式设置 `WISE_MOTION_RENDER_DIR` 指向其产物目录；禁止把视频输出到本技能源码内。第三个参数可传入 JSON 设置条目参数，例如 `'{"speed":0.5,"theme":"light"}'`。需要自己的画幅、串联或叠放时，在目标视频工程中注册组合并使用上述组件。

目录 `catalog/index.html` 本地直接打开；只有视频打包和导出使用 Remotion 的临时服务。正式入口无需维护目录中的基准、对照报告或临时历史数据。

`npm run check` 检查目录结构与字体覆盖；`npm test` 还包含原绘制与历史迁移回归，需保留私有历史档案；模拟页面测试使用原同步绘制器，实际 Remotion 页面另有浏览器和视频验收。新增或修改动效须按影响范围重新验证，不能用结构检查代替真实观看。

独立迁移副本、原版基准与回退副本保留在私有维护目录，具体位置见本次交付记录。正式替换不修改既有非 Remotion 视频项目，也不恢复已清空的历史。

薪火生长与文明聚字及六个分段提供独立的 `CivilizationGrowth` 逐帧组件，位于 `catalog/remotion/civilization-growth.jsx`。复制源码包含全部内嵌图片、真实书法轮廓、纸纹、字体、粒子公式和许可，使用 Remotion 4.0.532；原 Kimi 笔墨成形材质演变保留。
