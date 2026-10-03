# 玻璃对话卡

以下动效说明由统一定义生成。示例对象和时长是可调整的假设，结构要求需要保留。

动效说明：玻璃对话卡
目的：独立复用 WISE 创作界面中的玻璃卡片。
对象：WISE 标题、圆形光点、创作请求、四行回复与两个按钮
动作阶段：
1. 直接显示完整卡片。
2. 保留固定文字、控件状态与透入卡面的紫蓝光感。
3. 保持静态画面，定位与重播不改变内容。
节奏：1.00 秒完成一次；1 倍速度；匀速。静态插画，定位、倍速与重播均保持同一画面。
触发与联动：打开即显示静态完整插画；可复制到包内独立页面。
现实类比：透光对话卡单独居中，保留紫蓝透光材质和完整控件，卡片外为透明背景。
需要保留：卡片原比例为578×414，保持圆角、透光、局部高光与控件层次；等比居中放入1066×600画板，最大宽800、高456。主对话卡标题 WISE；用户说 Bring this idea to life.；回复依次为 Start with a clear idea.、Give every move a purpose.、Let the details catch light.、Make the next frame matter.；按钮为 Build a scene 与 Explore a variation。
明确排除：不携带其他两张卡片、凸泡、完整背景、字标或转场；不以截图替代绘制，不添加外部网络依赖。
对应参考：本地目录「玻璃对话卡」
源码：catalog/effects/glass-light.js 中的 glass-dialogue-card-illustration
来源与许可：原码提取与接入，AGPLv3；Anime.js 4.5.0，MIT。
关键假设：一张完整卡片保留自身文案和控件，固定展示状态，不依赖其他图层。

## 调整方式

播放速度：0.5–2 倍。
静态插画，定位、倍速与重播均保持同一画面。

预览定位：500 毫秒。固定演示总长：1000 毫秒。

## 源码与使用

- [原码提取与接入源码](../../catalog/effects/glass-light.js)，注册名称：`glass-dialogue-card-illustration`。
- [统一播放接口](../runtime-interface.md)，可播放、暂停、重播、定位时间和释放资源。
- [Anime.js 官方文档](https://animejs.com/documentation/)；使用固定版本 4.5.0 的计时器与速度曲线。
- 与透光浮层与折射共用卡片绘制函数，独立等比居中，背景仅在卡片内部提供透光着色；不使用原片图片、视频或声音。许可为 AGPL-3.0-only。第三方 Anime.js 保留 MIT 许可。

这是一个插画单图，可作为组合片段的图形素材复用。
