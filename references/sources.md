# 来源与许可评估

核对日期：2026-10-01。本包对“可商用”与“开源且可再分发”分开判断。来源入口或动画库的许可不能自动覆盖官网界面、演示代码、页面图片、社区作品或付费素材。

| 来源 | 核实结果 | 本包处理 |
|---|---|---|
| Anime.js | 固定版本 4.5.0 的程序为 MIT，可使用、修改及再分发，并保留许可与版权声明。 | 内置未修改的普通脚本。样例自行编写，不复制远程图片与调试依赖。 |
| GSAP | 官方提供免费商业使用，但采用专用许可并带用途限制；不符合本包严格的开源筛选。 | 保留动作和技术参考入口，未打包程序或示例。 |
| Jitter | 官方帮助说明允许模板用于商业作品；未核实模板对应的程序源码为可内置的开源代码。 | 借鉴分类与行为，未打包模板、导出资源或程序。 |
| LottieFiles | 播放程序和动画文件分别有许可。社区动画的正式许可与帮助说明对独立再分发的表述有差异。 | 暂不批量内置社区动画；如需个别动画，核对具体文件来源、许可和附带素材。 |
| Amotion | 编辑器可访问；未核实公开源码与再分发许可。 | 借鉴用户指定的三栏交互结构，保留链接；程序许可状态为未知，未复制程序。 |
| Amicro | 仓库根目录为 MIT；3D Dither Lab Book 的具体组件文件另标注 Apache-2.0，不能用根目录许可覆盖。 | 翻页书只参考动作与空间关系，代码、矢量插图和纸纹重新实现；未内置其程序或素材。 |
| 小红书分享 | 当前未读到具体内容，不能判断作品或程序授权。 | 仅保留用户分享的来源，不复制素材，不推断授权。 |

## Anime.js：已经内置

- [官方仓库固定版本](https://github.com/juliangarnier/anime/tree/v4.5.0) · [固定版本许可](https://github.com/juliangarnier/anime/blob/v4.5.0/LICENSE.md) · [官方文档](https://animejs.com/documentation/)。
- npm 包固定为 `animejs@4.5.0`。下载出处、压缩包校验值和各文件校验值见 [来源记录](../vendor/animejs/SOURCE.json)。
- `anime.umd.min.js` 为目录实际使用的 118,043 字节脚本；另保留未压缩的 `anime.umd.js` 供查阅。两者均未修改。
- [原 MIT 许可及版权声明](../vendor/animejs/LICENSE.md) 随包保留。
- 官方样例存在跨文件模块、远程图片和调试面板依赖。本包不搬运整页，使用原库计时器和速度曲线，自编无素材依赖的效果。
- 每项效果在统一定义中标记 `origin: original`；不存在冒称官方样例的改编。

## 仅作为参考入口

- GSAP：[官网](https://gsap.com/) · [官方许可](https://gsap.com/community/standard-license/)。免费商用不等于使用无用途限制的开源许可。
- Jitter：[官网](https://jitter.video/) · [模板归属与许可](https://help.jitter.video/en/articles/16599058-templates-ownership-and-licensing)。可参考出现、文字、转场等行为；商用导出权不等于可分发编辑器或源模板。
- LottieFiles：[官网](https://lottiefiles.com/) · [正式素材许可](https://lottiefiles.com/page/license) · [许可帮助说明](https://help.lottiefiles.com/animation-licensing-basics-)。正式许可含同条款要求与竞争库限制；帮助说明对独立再分发有更严格措辞。当前不把它们合并成“所有文件可随意内置”的结论。
- Lottie 播放程序：[airbnb/lottie-web 的 MIT 许可](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md)。程序许可不能覆盖播放的动画、字体和图片；本版未内置此播放器。
- Amicro：[参考入口](https://amicro.vercel.app/)。仅参考浏览和复制路径，未内置第三方代码。
- 翻页书：[原版效果](https://amicro.vercel.app/3d) · [固定版本组件与文件级许可](https://github.com/Subhan-code/Amicro--Micro-transitions-/blob/43c29ce9cdd16459e3eab4992381b8d35b38776a/src/components/dither-charts/DitherBook.tsx)。本地对应“立体翻页书”，保留固定书脊、双面纸张、入场快翻与三项纸页设置；使用自绘本地图形，无远程图片或纸纹依赖。
- Amotion：[编辑器入口](https://www.amotion.app/editor)。未知许可保持未知，不据能访问、免费使用或编辑器外观推断开放源码。
- [用户分享的小红书来源](https://www.xiaohongshu.com/s/poster?bgimg=https%3A%2F%2Fsns-redskillhub-s1.xhscdn.com%2Fred_app_image%2F1040g4m83241q07jpna005qelo9nsok378rohtb8%3Fsign%3D325e417b90d2f36dd545ce4f0d4a692d%26t%3D6c66710a&deeplink=xhsdiscover%3A%2F%2FminiTool%2F6a675ed61ed11800159c9d47%3Fsource%3Dh5%26page_key%3D28%26xhsMpScreenMode%3Dfull&code=031jeZFa1xQ5xM0p4AGa18RYP04jeZFv&state=wx_oauth)。当前尚未读到具体作品；只保留来源线索。

## 页面来源标识

标准动作在右侧描述下方展示有依据的第三方来源。直接复制或改编的候选只有在具体上游代码、许可与链接齐全时，才写“AI 改编自……的代码，遵循……许可”；明确的第三方效果参考使用独立的 source.reference 记录，显示“效果参考……”。历史配方另外展示原作出处与抽象结论。所有页面均不展示本地自有内容的自行开发声明；未知许可不标成 MIT。

当前标准参考的 source.origin 为 original，表示本地自有实现，不代表全部由 AI 原创。用户已确认其中包含参考其自行开发的内容，尤其“主体与环境”；不得把这些动作归给 Anime.js 或其他第三方网站。现有 source.reference_url 为动画库文档入口，供查询播放接口使用，不是具体动作的设计或代码来源证据。历史配方使用 history 标记，与自有示例分开记录。

本地自有内容不展示“自行开发”声明，没有具体第三方来源的标准动作隐藏整个来源区；历史配方保留原作来源区。页面不再显示全局界面样式参考句或每项重复的动画库许可。项目自身的 AGPL-3.0-only、动画库的 MIT 及界面参考记录继续保留在完整许可、版权说明和本文中，没有变更任何代码的许可。

Amotion 当前只用于参考通用界面原则，没有公开源码授权证据；正式目录没有引入它的程序、图形或媒体素材。界面参考记录与动作代码来源分开保留。新增候选先核实对应文件的许可，再决定直接改编或自行实现，不能仅凭代码可访问就复制。

现有界面另使用 [Heroicons 2.2.0](https://github.com/tailwindlabs/heroicons/tree/v2.2.0) 的 MIT 图标，以及 [Lucide 1.8.0](https://github.com/lucide-icons/lucide/tree/1.8.0) 的内联图标。Lucide 原许可含 ISC 与部分 Feather 来源图标的 MIT 声明，已保留 [完整原许可](../vendor/lucide/LICENSE) 和 [来源记录](../vendor/lucide/SOURCE.json)，不能一概写成 MIT。

## 内置判断与联网负担

本版可完整内置：需求方法、79 项统一定义、自编效果源码、播放接口、Anime.js 原程序及许可、已保留许可的图标与本地字体。目录使用代码绘制的图形，没有运行时远程素材。静态页面从普通本地脚本读数据，打开时无需联网。

暂不内置：Jitter 模板、GSAP 程序、LottieFiles 社区素材、Amotion 程序及小红书资源。它们的入口用于遇到本地缺口时定向查找，不在常见需求匹配中自动访问。

扩充目录时，必须新增固定版本、文件级许可证据、修改说明和运行时依赖记录。若第三方代码已经修改，标记改编并保留上游版权；若许可没有说明再分发，则先保留参考链接。

## 本机历史配方

动画与文稿历史按逐条审查对应表编译到目录；权威快照与审查保存在私有状态目录。289 条配方保留 311 个案例的本机视频或绘制入口，3 条静态资产与声音排程记录因范围排除。自有适配代码使用 AGPLv3；历史原代码、素材与依赖不因被引用而改变许可，迁出前仍需逐项核实。没有复制原作视频、字体、图片、声音或第三方库。

## 播放条液态玻璃源码

2026-10-01 查阅实际源码和许可后，接入 [Deepika Rao 的 Liquid Glass](https://github.com/deepika-builds/liquid-glass)，使用 MIT 许可，固定来源与文件校验见 [来源记录](../vendor/liquid-glass/SOURCE.json)。本地适配仅补充能力保护、失败和销毁清理；保留其尺寸感知位移图和三色通道折射。作为普通本地脚本加载，无需框架、网络请求或服务器；未安装仓库中的技能。

同时比较了 [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) 和 [DevSam7t3/liquid-glass](https://github.com/DevSam7t3/liquid-glass)。前者围绕 React，后者源码为多个 TypeScript 文件；当前原生静态页面优先选择独立脚本方案。浏览器边界参考 [Aave 的实现说明](https://aave.com/design/building-glass-for-the-web)：通过背景 SVG 滤镜折射主要适用于 Chromium；直接过滤内容是另一种跨浏览器实现，不能简单当成相同的背景滤镜。

本次已接入的方案在 Chrome 等 Chromium 浏览器执行真实背景位移，在 Safari、Firefox 退回普通磨砂；减少透明度、增强对比、强制颜色时停用折射。只在面板改变尺寸时重建位移图，不在每帧生成。光学参数使用上游默认值（位移 −112、色散 6、内边 0.07、图模糊 12、背景模糊 3）；播放条上不再叠厚模糊或额外高光层，否则边缘透镜会被盖住。玻璃后面是预览画面本身，桌面端整条浮在画面下沿之内；网站仍是黑白灰，不会凭空出现参考照片里的彩色透光。窄屏回落到画面下方。
