# 样例的统一播放接口

所有样例采用 640 × 360 的逻辑画布，也就是 16:9，在容器中等比例缩放。通过固定时间计算画面，不使用随机数、真实鼠标操作或额外计时器驱动效果，方便以后交接到视频制作流程。

## 使用方式

按 `catalog/index.html` 的脚本顺序加载：Anime.js、本地数据、匹配与播放程序、所需分类的效果脚本。页面为普通本地脚本，不使用跨文件模块，也不读取远程资源。

```js
const effect = MotionRegistry.effects.find(e => e.id === 'dual-scroll');
const player = MotionRuntime.create(container, effect, {
  autoplay: false,
  onUpdate({time, duration, paused}) { /* 更新控件，单位毫秒 */ }
});
player.play();
player.pause();
player.seek(2400);
player.setSpeed(0.75);
player.restart(false);
player.destroy();
```

| 方法 | 行为 |
|---|---|
| `play()` | 从当前时间播放。一次性效果已经结束时，从头开始。 |
| `pause()` | 保留当前画面并暂停。 |
| `restart(shouldPlay = true)` | 重置到起点；默认继续播放，可传入 `false` 保持暂停。 |
| `seek(ms)` | 定位到本周期中的毫秒数，超过区间时限制到起止点。不会改变暂停状态。 |
| `setSpeed(value)` | 同一效果调整到 0.5–2 倍速度，保持动作结构。 |
| `setEase(name)` | 调整允许的速度变化。连续滚动固定匀速，不接受改变持续性的曲线。 |
| `destroy(preserve = false)` | 取消计时器、停止尺寸监听并释放画面；传 `true` 可留下静态画面，不能再次播放。重复调用安全。 |

可读取 `currentTime`、`paused`、`speed`、`destroyed`。错误的非有限时间或速度会报错，不能进入不可复现的状态。运行状态通过 `MotionRuntime.instanceCount` 和 `runningCount` 读取；`disposeAll()` 释放当前所有实例。

## 固定演示顺序与循环

- 所有源码工厂返回 `render(time, options)`；只根据本周期时间、总长、速度曲线与实际经过时间计算当前画面。
- `options.elapsed` 为播放至今的时间，跨周期累计。双排滚动只在最初入场一次，不会每轮重新飞入；手动回到 0 毫秒会重新展示入场。
- 交互样例“界面操作反馈”按指针移到按钮、按下、处理、完成的固定顺序演示；没有隐藏的真实输入依赖。
- 窗口隐藏时暂停当前预览；再次可见时只恢复原本正在播放的效果。切换样例或离开页面会释放实例。目录收起、搜索或筛选保留当前预览。
- 目录显示名称与静态缩略图，不创建动画实例。标准参考用自己的绘制函数画一帧；历史参考使用原作图片、单帧绘制或静音视频定位。历史绘制器画完即释放，列表移除和离开页面时取消未完成的绘制并释放视频。中间常驻一个预览；系统开启“减少动态效果”时定位到定义中的可见时刻，默认暂停。
- 右侧“代码”由选中定义和当前参数生成完整本地页面，保存为源码包根目录的 `demo.html` 后加载现有普通脚本。页面、提示词与说明共用同一份定义，不另外维护效果描述。

## 扩充效果

历史配方使用 `MotionHistoryRuntime.create(root, definition, {caseId, onUpdate})`，提供相同控制方法；原作曲线保持固定。还可读取 `duration`、`entry` 和等待 `ready`，分别获得本案例的预览总长、案例数据与加载完成状态。切换案例要先销毁旧实例，异步加载迟到时也会释放绘制器。视频强制静音；原素材与绘制脚本按需引用，不纳入自有示例许可。实例计数与全部释放由 `MotionHistoryRuntime` 提供。复制历史代码需保留本机历史目录。

`MotionHistoryRuntime.poster(canvas, entry, data, {isCurrent})` 用原案例绘制器画单帧，并复制到目标画布后释放绘制器；不建立播放计时器。`isCurrent` 用于阻止被移除卡片的迟到绘制。图片缩略图直接引用原文件，原片缩略图使用暂停且静音的视频定位，不生成新的图片资产。

1. 在统一定义 `catalog/registry.json` 中记录中文名称、用途、对象、行为标签、阶段、禁项、参数、来源与许可。组合通过 `actions` 引用单个动作，不另写一套基础动作描述。
2. 在相应普通脚本里注册 `MotionFactories[id]`，返回能反复定位的画面函数。所有位置、文字、颜色、透明度应由当前时间完整确定，不能依赖之前播放到了哪一帧。
3. 保持固定演示顺序；不添加联网、随机数、页面外事件或不可取消的资源。
4. 运行 `node scripts/build.mjs` 和 `npm test`，检查定义、关系、路径、许可、定位可重复性和资源释放。

本接口是动作参考交接，不承诺视频渲染器兼容，也不在本版提供成品视频输出。
