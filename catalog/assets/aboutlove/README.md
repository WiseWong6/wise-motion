# Aboutlove 动作源码与字体

本组从 Wise Wong 提供的 Aboutlove 工程中提取独立动作与三套完整组合，保留文字、固定随机数、绘制公式与原设计画板。逐项来源、内容摘要和合并关系见 [来源记录](SOURCE.json)。原声仅用于完整组合，来源、排程和权利说明见 [声音记录](../composition-audio/aboutlove/SOURCE.json)；独立动作保持无声。

## 绘制与复用

`catalog/effects/aboutlove-data.js` 保留场景的实际绘制函数与样式；`aboutlove-clock.js` 是本项目编写的固定时间属性求值器，不包含 GSAP 程序。`aboutlove.js` 负责实例隔离、字体准备、图层选择与释放资源；目录与 `catalog/remotion/aboutlove.jsx` 共用同一绘制。

内部画板保持 1080×1440，按所选动作的范围裁切并等比放入 640×360。独立 Remotion 工程以帧号换算毫秒驱动相同函数。文字造型、笔画重排与诗句纹理保留源字体；普通拉丁界面文字使用 Oswald。多语球里的泰文、阿拉伯文、天城文及希伯来文仍使用原设计的系统字体后备，运行环境需要相应字库。

三套完整组合分别为“内心独白 · 双语叙事组合”“动态图形 · 信号到心形组合”和“文字世界 · 雨幕到心字组合”。组合保留贯穿背景、边角标注、字幕与胶片图层，独立工程输出1080×1440竖幅；主画面切换时，贯穿图层使用连续的原片时间。等候光标、三点和按拍打字移除；文字世界结语整体显现。早期完整组合不收录。

原WAV音轨以FLAC无损格式提供，已逐条核对解码后的声音样本与原件一致；原MP3短音效保持原文件。命令行导出自动复制原声；从目录复制文字源码时，先按工程说明运行素材准备程序，再运行 `npm run check:source`。原声音文件以清单摘要核验，不依赖本机来源工程。组件默认带声音，设置 `includeAudio={false}` 可关闭；目录默认静音，由声音按钮开启。

自有绘制和适配程序采用 Apache-2.0，见工程根目录 LICENSE。下表字体遵循各自许可，不能用程序许可代替。字体文件保存在 `fonts/`，`aboutlove-fonts.js` 仅登记对应关系；预览只准备当前版本的字体，字节与原内嵌数据一致。目录可直接从本地文件打开；独立工程由导出程序复制所需字体，也可按 `binary-assets.json` 准备。准备失败会报告错误，不使用未准备完成的字形绘制。

## 字体来源

| 字体 | 上游与许可 |
| --- | --- |
| 思源黑体 | [Adobe 官方源码](https://github.com/adobe-fonts/source-han-sans)，[SIL OFL 1.1](fonts/Sans.txt) |
| 思源宋体 | [Adobe 官方源码](https://github.com/adobe-fonts/source-han-serif)，[SIL OFL 1.1](fonts/Serif.txt) |
| 思源等宽 | [Adobe 官方源码](https://github.com/adobe-fonts/source-han-mono)，[SIL OFL 1.1](fonts/Mono.txt) |
| 霞鹜文楷 | [作者源码](https://github.com/lxgw/LxgwWenKai)，[SIL OFL 1.1](fonts/WenKai.txt) |
| Newsreader | [Google Fonts 字库](https://github.com/google/fonts/tree/main/ofl/newsreader)，[SIL OFL 1.1](fonts/Newsreader.txt) |
| Oswald | [Google Fonts 字库](https://github.com/google/fonts/tree/main/ofl/oswald)，[SIL OFL 1.1](fonts/Oswald.txt) |
| 阿里妈妈东方大楷 | [官方字体网站](https://www.alibabafonts.com/)，[官方法律声明原文](fonts/Alimama.txt)与[嵌入使用说明](https://www.yuque.com/alimama_ai-font/vfse9w/co47p8ge57qsanz2) |

阿里妈妈东方大楷使用官方压缩包内未经改写的完整网页字体，替代来源工程里的裁字版本。它采用专有免费使用许可，并非 SIL OFL；其法律声明继续适用，不得单独定价销售、改写字库或删除声明。字体的原文件名、下载地址与校验值记录在来源记录中。

文件与时序检查不代表视觉验收。目录中的示例可通过本地文件直接播放，最终观感由使用者确认。
