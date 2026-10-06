# Remotion 动效组件

`WiseMotionEffect` 保留原绘制代码、字体、逻辑尺寸和运动公式，以 Remotion 帧号转换到原目录毫秒时钟。
素材与绘制程序随源码包交付，不依赖原目录。目录默认用 640×360 逻辑画板，改变 width/height 仅等比缩放。

## 使用

```jsx
import {WiseMotionEffect,getEffectMetadata} from 'wise-motion-remotion';
const meta=getEffectMetadata('stagger-in');
const Scene=()=> <WiseMotionEffect effectId="stagger-in" />;
```

参数：effectId、variantId、speed（0.5–2）、ease、theme（dark/light）、assetBaseUrl、bookSettings、width、height。
默认帧率60。`sampleMode="playback"`保留原绘制的逐格取样；`exact`用于目录精确定位。末尾停留及循环累计时间保留。
`getEffectMetadata`返回时长、帧数、尺寸和循环标记。非循环帧数包含准确结尾的一帧，循环不重复结尾。
`onReady`在字体、素材及首个目标帧准备完成后触发；加载失败报错，视频导出中断。

执行 `npm run build:remotion && npm pack` 生成随身源码包。目标工程安装此包后执行：

```sh
node node_modules/wise-motion-remotion/scripts/install-assets.mjs public/wise-motion
```

全部素材明细与校验值在 `ASSET-MANIFEST.json`。素材副本不提供目录首页；浏览请打开源码中的 `catalog/index.html`。目标工程的Remotion依赖需和包版本一致。
目录中的“复制代码”提供完整Composition例子和安装步骤。`Sequence`能控制每个组件的起点；多个组件用独立画板，互不覆盖。
翻页书在目录中保留真实交互；导出组件总是固定演示动作。

## 蝴蝶插画与圆形转场

版画蝴蝶（`butterfly-illustration`）与四翼错拍、触角跟随（`hinged-wing-flap`）共用图集、运动计算和绘制程序。目录保留透明插画；视频也可直接使用原生帧组件：

```jsx
import {WiseMotionButterfly, WiseMotionCircularReveal} from 'wise-motion-remotion';
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
npm run render -- stagger-in stagger-in.mp4
```

`npm run build` 同时更新目录数据、可复用组件和本地播放器。Remotion 构建输出留在当前工程；日常构建不读取或更新源码外的历史审查记录。历史记录修改后单独运行 `npm run build:history`。视频默认保存到私有状态目录 `../../state/wise-motion/renders/`。`render` 的第二个参数是该目录中的文件名或子路径。需要放在独立视频工程时，可显式设置 `WISE_MOTION_RENDER_DIR` 指向其产物目录；禁止把视频输出到本技能源码内。第三个参数可传入 JSON 设置条目参数，例如 `'{"speed":0.5,"theme":"light"}'`。需要自己的画幅、串联或叠放时，在目标视频工程中注册组合并使用上述组件。

目录 `catalog/index.html` 本地直接打开；只有视频打包和导出使用 Remotion 的临时服务。正式入口无需维护目录中的基准、对照报告或临时历史数据。

`npm run check` 检查目录结构与字体覆盖；`npm test` 还包含原绘制与历史迁移回归，需保留私有历史档案；模拟页面测试使用原同步绘制器，实际 Remotion 页面另有浏览器和视频验收。新增或修改动效须按影响范围重新验证，不能用结构检查代替真实观看。

独立迁移副本、原版基准与回退副本保留在私有维护目录，具体位置见本次交付记录。正式替换不修改既有非 Remotion 视频项目，也不恢复已清空的历史。

薪火生长与文明聚字及六个分段提供独立的 `CivilizationGrowth` 逐帧组件，位于 `catalog/remotion/civilization-growth.jsx`。复制源码包含全部内嵌图片、真实书法轮廓、纸纹、字体、粒子公式和许可，使用 Remotion 4.0.532；原 Kimi 笔墨成形材质演变保留。
