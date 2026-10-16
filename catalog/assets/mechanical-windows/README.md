# 持续窗口与机械细节展示

来源是用户原创《MECHANICAL WINDOWS》第二版的最终成片：2026-10-15，1920×1080、30 fps、960帧、32秒。输入摘要、原制作源码与适配记录见 [SOURCE.json](SOURCE.json)。

收录4个新动作：等臂十字旋转开窗、轴心矩窗连续伸缩、三列直窗错峰开合、后镜提前圆窗进入；复用圆孔扩张转场的“偏心表盘开窗”示例，以及节拍闪切的“同位线稿短闪”示例。结构装配、螺丝旋紧、发条、轮系和摆轮继续关联已有动作。

独立动作与完整组合共用1280×720静音缓存。单个动作按原成片的全局帧截取，保留真实手表、材质、背景、文字、窗口和换镜，不另画机械示意。原窗口函数、关键点、短闪帧表及双镜重叠关系仍独立可编辑；放大缓存不代表重新制作1080p或4K。

```sh
node scripts/export.mjs mechanical-window-sequence --out-dir /新的空目录
node scripts/export.mjs cross-aperture-turn --out-dir /另一个空目录
node scripts/export.mjs iris-open-transition --variant offset-aperture --out-dir /又一个空目录
```

进入导出目录运行 `npm install`、`npm run studio`。单个动作和完整组合都提供 `npm run check:source`；命令行导出自动复制运行视频，二进制素材按SHA256核对，不写成base64进入文字源码。

## 用在自己的素材上

默认组件 `WiseMechanicalWindows` 用于观看原片对应片段；同一工程另导出 `MechanicalWindowClip`，可用原窗口运动裁剪自己的图片或视频。剪裁层保持1920×1080设计坐标，在其他画幅中等比容纳：

```jsx
import {OffthreadVideo, staticFile} from 'remotion';
import {MechanicalWindowClip} from './catalog/remotion/mechanical-windows.jsx';

<MechanicalWindowClip effectId="cross-aperture-turn">
  <OffthreadVideo src={staticFile('my-product.mp4')} muted
    style={{width: '100%', height: '100%', objectFit: 'cover'}} />
</MechanicalWindowClip>
```

将窗口放在多个镜头的Sequence之外，镜头更换时窗口继续使用同一时钟。“后镜提前圆窗进入”把正在播放的背景放在这个组件下方，把下一镜放进组件内部。偏心圆窗使用 `effectId="iris-open-transition" variantId="offset-aperture"`。同位线稿短闪从同一模块导入 `isDrawingFlash(ms)` 读取两次短闪状态，再直接替换同构图图层。

需要编辑原镜头时，在导出的完整组合工程中执行：

```sh
node catalog/assets/mechanical-windows/editable/import-originals.mjs --from /怀表原创剪辑工程目录
npm run studio:editable
```

输入目录须包含原项目的 `public/`。程序先核对全部源文件与目标冲突，然后只复制清单中的视频、图纸与alpha序列；不覆盖本地修改，不修改原项目，不自动下载。原媒体共173项（含另行选择的配乐），大小及摘要见 `editable/original-assets.json`。npm和默认独立工程只包含轻量缓存与文字源码。

原FilmV2、窗口和帧表在 `production/` 原样归档。可运行剪辑在 `editable/`：改用当前包已有的Remotion媒体组件，系统HelveticaNeue字体改为随包SIL OFL授权的Oswald；编辑版字形与原成片不同。原窗口函数与目录共用，不另维护一套关键点。三维建模源码继续见前一版 [TIME, IN MOTION说明](https://github.com/WiseWong6/wise-motion/tree/main/catalog/assets/time-in-motion)。

## 配乐边界

原片使用 The Journey — Ahjay Stelino / Mixkit。Mixkit许可允许其列明的视听用途，用户条款对把音乐作为库存素材再分发设有限制。本动作库提供静音缓存，不分发原曲、配乐WAV或带配乐视频，也不把音乐重新声明为Apache-2.0。

- [官方音乐许可](https://mixkit.co/license/modal/musicFree/)
- [官方用户条款](https://mixkit.co/terms/)

需要在自己的允许用途内复现原配乐时，先自行确认许可，再从自己已授权的本地原工程显式准备：

```sh
node catalog/assets/mechanical-windows/editable/import-originals.mjs --from /怀表原创剪辑工程目录 --group audio
```

随后在编辑工程中将 `withAudio` 设置为 `true`；默认为 `false`。此操作只读取指定本地文件并核对摘要，不代为下载或授予配乐许可。独立动作始终无声。

自有源码Apache-2.0；Oswald遵循SIL OFL；Remotion、React等遵循自身许可。
