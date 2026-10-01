# 版权与第三方记录

Copyright © 2026 Wise Wong.

本包自有技能正文、效果定义、需求方法整理、静态目录、播放程序、匹配程序、脚本和测试使用 **AGPL-3.0-only**。完整许可见 [LICENSE](LICENSE)。AGPLv3 允许商业使用；分发或提供涉及相应条款的网络服务时，应遵守对应源码提供要求。

需求方法依据用户提供的文章，保留链接，以自主整理表达；没有打包原文章。目录借鉴 Wise PPT 的分类、预览和按需选型结构，自行编写页面与效果；没有复制该项目程序或素材。

| 第三方 | 固定版本 | 文件 | 许可 | 修改 |
|---|---|---|---|---|
| Liquid Glass，Deepika Rao | 固定来源见 [记录](vendor/liquid-glass/SOURCE.json) | `vendor/liquid-glass/liquid-glass.js` | MIT，见 [原许可](vendor/liquid-glass/LICENSE) | 保留边缘位移与三色折射算法，补充浏览器能力保护和资源清理；网站材质层单独适配 |
| Anime.js，Julian Garnier | 4.5.0 | `vendor/animejs/anime.umd.min.js`、`anime.umd.js` | MIT，见目录内 `LICENSE.md` | 无 |
| Heroicons，Tailwind Labs | 2.2.0 | `vendor/heroicons/icons.js` | MIT，见 [原许可](vendor/heroicons/LICENSE) | 将所用轮廓图标合并成普通脚本，路径未修改 |
| Lucide Icons 与 Contributors；部分图标来自 Feather，Cole Bemis | 1.8.0 | `catalog/app.js` 内联界面图标 | ISC；其中 Feather 来源图标为 MIT，见 [完整原许可](vendor/lucide/LICENSE) | 改写外层尺寸、笔画与可访问属性，侧栏箭头为本地适配 |

第三方许可与版权声明保持原样。文件校验值、原包来源和完整性记录见 [SOURCE.json](vendor/animejs/SOURCE.json)。自有文件采用 AGPLv3 不会重写第三方库的 MIT 许可。

当前正式目录的 85 个标准参考为本地自有结构示例：使用原库的计时器和速度曲线；视觉通过代码绘制，没有直接复用 Jitter、GSAP、LottieFiles、Amotion 或小红书的程序及素材。每项定义记录原始来源状态与源码位置。界面参考 Amicro 与 Amotion 的通用面板组织、留白及控件层次后重新开发，侧栏结构还参考本地个人网站；这些参考不构成第三方程序或素材的许可。没有打包照片、视频或社区动画。图标按上表分别保留许可。

277 条历史动画与文稿配方引用本机原工程的 298 个案例，未复制原作视频、字体、图片、声音或依赖库。新写的结构示例与适配代码使用本项目许可；原作代码、素材与依赖保留各自许可，不因被纳入目录而统一重新授权。

目录页打包思源黑体 Light、Regular 与 Bold 的字符子集，族名改为 Wise Motion Sans，许可为 SIL OFL 1.1，见 `catalog/fonts/OFL.txt`。界面数字使用 Outfit Medium 拉丁子集，同为 SIL OFL 1.1，见 `catalog/fonts/OFL-Outfit.txt`。品牌名使用 Oswald Bold 的字母子集，同为 SIL OFL 1.1，见 `catalog/fonts/OFL-Oswald.txt`。

开发检查使用的 jsdom 及其依赖由包管理器安装，仅用于测试，不进入目录运行时。其各自许可随开发依赖保留；发布开发依赖时也应保留对应声明。
