# 实景层次与连续开窗展示

本次权威输入为用户原创 MECHANICAL PULSE **v4.2**：2026-10-15 的 `MECHANICAL-PULSE-v4.2-4K.mp4`，3840×2160、30fps、540帧、18秒。输入、逐帧来源及适配摘要见 [SOURCE.json](SOURCE.json)。早期 v2 仍在独立的 mechanical-windows 目录。

收录一个新动作“菱形窗口跨镜展开”；其余六种机制作为已有动作的新示例，避免重复条目：

| 动作 | 新示例 | 时长 / 30fps |
| --- | --- | --- |
| cross-aperture-turn | continuous-diagonal / 斜十字持续扩展 | 90帧 |
| three-column-aperture | vertical-column-rise / 三列纵向错峰开窗 | 23帧 |
| rapid-cut | full-frame-blueprint / 全幅双次图纸短闪 | 100帧 |
| next-shot-preentry | paced-overlap / 十六帧圆窗预入 | 17帧，含完整接管帧 |
| fan-object-rise | aligned-silhouette / 轮廓等距同步升入 | 56帧 |
| wipe | overlap-copy-handoff / 矩窗接镜与文案交接 | 21帧，含文案落定位 |

完整组合 `spatial-mechanical-sequence` 关联上述新示例与原有机械结构动作。目录提示词从真实关键点生成，包含画幅、起止状态、缓动、重叠和几何参数。

## 导出与运行

```sh
node scripts/export.mjs spatial-mechanical-sequence --out-dir /新的空目录
node scripts/export.mjs diamond-aperture-release --out-dir /另一空目录
node scripts/export.mjs cross-aperture-turn --variant continuous-diagonal --out-dir /第三空目录
```

进入导出目录运行 `npm install`、`npm run studio`。开窗、短闪、镜头交接与完整组合共用一个1280×720、30fps静音缓存；单个动作按原片全局帧截取，保留原4K片的摄影、字体、窗口和切点。放大缓存不等于重新渲染4K。`npm run check:source` 校验随附缓存、字体或主体图。媒体单独列入 binary-assets.json，不转成base64写入文字源码。

默认组件 `WiseSpatialApertures` 显示原片对应片段，不另画机械示意；轮廓入场继续使用原尺寸1800×2400的产品WebP，RGB有损压缩、alpha无损。换自己的素材可使用下面的窗口组件、短闪和文案状态函数，原动作代码仍可编辑。几何在 `catalog/effects/spatial-apertures-data.js` 共用，包含全局窗口、贝塞尔求值、主体锚点和轮廓排版。原作者未改动的九个制作模块在 `production/`，用于追溯及逐帧回归。

## 换自己的素材

```jsx
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {SpatialWindowClip} from './catalog/remotion/spatial-apertures.jsx';

<SpatialWindowClip effectId="diamond-aperture-release">
  <Sequence from={0} durationInFrames={20}>
    <OffthreadVideo src={staticFile('macro-a.mp4')} muted />
  </Sequence>
  <Sequence from={20} durationInFrames={20}>
    <OffthreadVideo src={staticFile('macro-b.mp4')} muted />
  </Sequence>
  <Sequence from={40} durationInFrames={20}>
    <OffthreadVideo src={staticFile('macro-c.mp4')} muted />
  </Sequence>
</SpatialWindowClip>
```

视频层自行设置完整1920×1080尺寸及 `objectFit:'cover'`。窗口放在镜头Sequence之外，换镜不重启窗口。“后镜预入”将旧视频放在这个组件下面、新视频放在其内部，使用 `effectId="next-shot-preentry" variantId="paced-overlap"`。

`useSpatialState({effectId,variantId,speed})` 返回同一时钟的几何与局部帧。矩形文案交接使用 `effectId:'wipe',variantId:'overlap-copy-handoff'`，由返回的 `outgoingCopy`、`incomingCopy` 分别控制自己的旧、新文案显隐；旧主体在下层继续播放。`isDrawingFlash(ms)` 返回双次图纸显隐状态。

`AlignedSilhouetteRow` 接受 `items`：每项含 `id`、`sourceSize:[w,h]`、`width`、固定 `angle`、`anchorSource:[x,y]`、**显示缩放及旋转后相对锚点的** `alphaExtents:{minX,minY,maxX,maxY}`，以及自己的React图像内容 `content`。主体中心应剔除吊环、把手等附属件后测量；透明留白不参与间距。排版函数 `layoutSilhouettes(items,{canvasWidth,margin,centerY,offsetY})` 可脱离React复用，默认边距96、中心Y=710。共同入场48→0像素、12帧，叠加56帧0→−16像素漂移。换姿态或尺寸须重测轮廓，不只替换图片地址。

## 编辑完整镜头

```sh
node catalog/assets/mechanical-pulse/editable/import-originals.mjs --from /自己的原剪辑工程目录
npm run studio:editable
```

输入需有原工程 `public/`。导入器先核对全部摘要、已有文件和目标路径，再复制；不覆盖本地修改，不修改原工程，也不联网下载。清单仅15个最终版本使用的文件，默认14个画面素材约203MB；配乐独立选择。未打包旧alpha序列、参考片、中间成片或整套三维媒体。原建模源码仍见 [TIME IN MOTION](../time-in-motion/README.md)。

编辑版使用包中现有的OffthreadVideo、Img、Html5Audio及授权Oswald字体，无新增依赖；Oswald与原系统字体字形不同。窗口、三主体排版和v4.2帧表共用目录实现；剪辑画面和视频源时间保留，包括材质0.15秒的非整数帧trim。默认 `withAudio:false`。

## 音乐与许可

原片配乐为 The Journey — Ahjay Stelino / Mixkit。依 [音乐许可](https://mixkit.co/license/modal/musicFree/) 与 [用户条款](https://mixkit.co/terms/)，动作库不将音乐作为素材再分发；静音缓存、源码和默认工程不含配乐。

如需在自己的允许用途内复现原配乐，自行确认授权后显式导入本地文件：

```sh
node catalog/assets/mechanical-pulse/editable/import-originals.mjs --from /自己的原剪辑工程目录 --group audio
```

然后将编辑Composition的 `withAudio` 改为 `true`。自有代码Apache-2.0，Oswald遵循SIL OFL，Remotion与React遵循各自许可。
