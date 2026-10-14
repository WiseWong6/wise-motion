# TIME, IN MOTION 动作与源码

来源是 2026-10-14 最终横屏 4K MP4，3840×2160、24 fps、1056 帧、44 秒。10 个独立动作和完整组合分别提供提示词、真实绘制或帧接入源码。输入摘要、对应制作代码及修改记录见 SOURCE.json。

目录使用 1280×720 的轻量成片缓存，各三维动作定位到同一个视频的连续原生帧；原生节奏、镜头切点和构图保持。独立三维动作静音，完整组合播放最终片无损提取的 AAC 配乐。默认导出渲染的是缓存，不应把放大缓存称为重新制作的 4K。

整词与刻度是可编辑的逐帧代码，目录和独立组件共用计算。原创 KineticWord、DialRings 和共享 motion.mjs 保留在 editable/graphics。ImageShutters 未出现在最终片中，因此没有收录。

独立源码导出：

```sh
node scripts/export.mjs time-in-motion-sequence --out-dir /新的空目录
```

进入导出目录运行 `npm install`、`npm run check:source`，然后 `npm run studio` 或 `npm run render`。普通播放无需 Blender，也不需要原 Pocketwatch 工程。

需要修改原 13 场景剪辑时，在导出目录执行：

```sh
node catalog/assets/time-in-motion/editable/import-originals.mjs --from /Pocketwatch工程根目录
npm run studio:editable
npm run render:editable
```

这个准备命令只复制 original-assets.json 中逐项登记的剪辑素材，先核对全部摘要和目标冲突，再写入；不下载网络资源，不复制 node_modules、旧成片或缓存。输入应为原 Pocketwatch 工程的根目录。真实原素材的总体积较大，所以这一步由需要编辑的人主动运行。

完整建模、机械轮系、镜头、投影和几何遮罩的作者代码位于 production/project，原剪辑位于 production/Film-original.jsx。需要修改三维场景时，同一准备命令添加 `--group models`，按清单复制对应 Blender 场景。该目录保留原项目的相对结构，便于核对原建模与动画代码。三维重建和 Cycles 重渲染须另行使用 Blender；目录渲染通过不代表已经重跑这些三维制作步骤。

从最初建模程序重建时，先从作者基线场景恢复其中已打包的纹理：`blender --background --factory-startup --python catalog/assets/time-in-motion/production/extract-textures.py`。该程序只读取基线场景，保护已有纹理，不保存或修改原 Blender 文件。

三维及投影制作程序使用 Blender、NumPy、Pillow 和 FFmpeg；保留了原 Metal 渲染配置。缓存播放与默认 Remotion 导出只需要 package.json 中的固定 npm 依赖。

编辑版沿用当前包已有的 Remotion 视频与声音组件，保持现有依赖版本；用 SIL OFL 授权的 Oswald 替换原系统 HelveticaNeue。编辑版文字字形会与最终缓存不同，不分发系统字体文件。需要相同文字字形的人自行提供有分发或使用许可的字体。

npm 仅分发轻量缓存、必要原声、预览、授权字体和文字源码。原 4K 成片、Blender 场景、剪辑原媒体、PNG 序列和渲染缓存不进入 npm，也不写成 base64 进源码表。旧怀表素材已经由新条目替换；旧书签重定向到对应新动作。

自有代码 Apache-2.0；Oswald 遵循 SIL OFL。第三方运行软件各遵循其许可。没有收录外部品牌的代码、商标、音乐或影片素材。
