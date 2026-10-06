# 宋拓《多宝塔碑》道字

原图：颜真卿《宋拓多寶佛塔碑 冊》，国立故宫博物院，台北。具体使用第二开左页“道樹萌牙”的“道”字：自右数第三列、第五字，位于“童遊”下方、“樹”上方。

- [馆藏记录与图像开放说明](https://digitalarchive.npm.gov.tw/Collection/Detail/1947?dep=P)
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- 署名：宋拓多寶佛塔碑 冊。国立故宫博物院，台北，CC BY 4.0 @ www.npm.gov.tw
- 原页、下载地址、字框坐标和校验值见 [SOURCE.json](SOURCE.json)。所用中阶图像为 2800×2100，低于 600 万像素。

`page-02.jpg` 为未修改的官方原页。项目直接描摹其指定“道”字，处理包含灰度分层、去除细小扫描杂点、轻微平滑、等比缩放及逐步显现。描摹轮廓保留原图的 CC BY 4.0 来源与署名；本项目的生成程序及动画代码另按 AGPL-3.0-only 提供。

在项目根目录运行 `python3 scripts/build-material-glyphs.py` 重新生成；加 `--check` 核对一致性。生成需要 OpenCV、NumPy、FontTools（含 WOFF2 支持）；运行目录播放器不需要这些 Python 依赖。原页仅用于重建和核对，播放时读取已生成轮廓。
