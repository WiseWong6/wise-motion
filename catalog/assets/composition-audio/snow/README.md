# 深圳湾雪夜

蓝色夜空、深圳湾黑色楼影、雪花点亮窗灯，单颗流星划过。配乐为 Joth 的《JRPG Piano》。3:4 与 9:16 版本均可双击直开。

## 打开与检查

双击 `index.html`，本地离线运行；点右下角喇叭开关配乐。自动检查：`node --test tests/*.test.cjs`。

## 授权与第三方

- 配乐《JRPG Piano》— Joth，[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)；出处与截图见 `assets/JRPG-PIANO-LICENSE.md`、`references/licenses/`。
- 页面使用项目专用二维绘图适配层；云气噪声沿用 p5.js 算法（可编辑源码 `assets/p5-noise.js`），LGPL 2.1 全文与分发说明见 `assets/THIRD-PARTY.json`。

## 结构

- `index.html` / `sketch.js` / `canvas-runtime.js`：页面与动画。
- `sound.js`：音轨调度；`assets/jrpg-track.js`：内嵌原曲与触发点（重建：`node scripts/build-jrpg-track.cjs`）。
- `scripts/render-demo-3x4.cjs`：确定性 3:4 高清视频导出。
- `tests/`：自动检查。

遵守上级目录的统一播放控件与项目约定。
