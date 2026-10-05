# 来源核对与收录规范

核对日期：2026 年 10 月 5 日。公开署名、素材归属与许可汇总以 [署名、来源与说明](../NOTICE.md) 为统一入口；本文规定来源记录、目录显示与外部资源收录方式。

## 一、来源记录与目录显示

| 记录对象 | 记录方式 | 目录显示 |
| --- | --- | --- |
| 本项目实现 | `source.origin: original`，保留绘制入口与项目代码许可；素材另设来源记录。 | 无具体外部来源时隐藏来源区，不重复显示自行开发声明。 |
| 第三方代码改编 | 记录具体上游程序、固定版本、原许可、许可链接及修改范围。 | 依据完整时显示“AI 改编自……的代码，遵循……许可”。未知许可不得标为 MIT。 |
| 作品或视觉参考 | 使用 `source.reference`；多个参考使用 `source.additional_references`。名称、链接与署名文字按实际出处记录。 | 显示“效果参考”“视觉参考”或明确的复刻署名；切换示例时采用该示例的实际来源。 |
| 字体、图片、谱面与原始数据 | 在对应素材目录保留 `SOURCE.json`、作者信息、原许可和文件校验记录。 | 完整材料记录汇入署名说明；项目代码许可不覆盖外部材料。 |

`source.origin` 描述实现来源，不证明所有视觉内容的原创归属。`source.reference_url` 是动画库接口文档入口，不作为具体动作设计来源。参考链接与代码许可分别记录；公开可访问、免费使用或免费商用不直接证明可以随包再分发。

作品署名以明确确认的信息为准，不从教程链接推导授权，也不将原作者作品改标为项目许可。待核实事项集中列于署名说明，未取得公开链接时保留来源名称，不生成虚构链接。

## 二、已内置的程序与图标

| 项目 | 固定版本与原许可 | 接入范围 |
| --- | --- | --- |
| Anime.js | [4.5.0 固定版本](https://github.com/juliangarnier/anime/tree/v4.5.0)、[MIT](../vendor/animejs/LICENSE.md)、[来源记录](../vendor/animejs/SOURCE.json) | 保留未修改的压缩与未压缩脚本，用于计时器与速度曲线；效果由项目绘制。 |
| Heroicons | [2.2.0](https://github.com/tailwindlabs/heroicons/tree/v2.2.0)、[MIT](../vendor/heroicons/LICENSE)、[来源记录](../vendor/heroicons/SOURCE.json) | 所用轮廓图标合并为普通脚本，保留原路径。 |
| Lucide / Feather | [Lucide 1.8.0](https://github.com/lucide-icons/lucide/tree/1.8.0)、[ISC 与部分 MIT 原声明](../vendor/lucide/LICENSE)、[来源记录](../vendor/lucide/SOURCE.json) | 界面内联图标；不得将整套图标统一标为 MIT。 |
| Liquid Glass | [Deepika Rao 上游仓库](https://github.com/deepika-builds/liquid-glass)、[MIT](../vendor/liquid-glass/LICENSE)、[固定来源记录](../vendor/liquid-glass/SOURCE.json) | 目录玻璃播放条；仅增加能力保护、失败处理与销毁清理。卡片动画采用独立绘制代码。 |

其余字体、音符绘制包和视频复用依赖见 [署名、来源与说明](../NOTICE.md)；各依赖按自身原许可记录。

## 三、外部参考入口与收录边界

| 来源 | 已核对的边界 | 本包处理与出处 |
| --- | --- | --- |
| GSAP | 免费商业使用采用专用许可并含用途限制，未按本包的开源筛选纳入。 | 保留 [技术入口](https://gsap.com/) 与 [官方许可](https://gsap.com/community/standard-license/)，未打包程序或示例。 |
| Jitter | 模板用于商业作品的条件，不等于源模板或编辑器的再分发许可。 | 参考分类与行为；未打包模板、导出资源或程序。见 [模板归属与许可](https://help.jitter.video/en/articles/16599058-templates-ownership-and-licensing)。 |
| LottieFiles | 播放程序与动画文件分别有许可；素材条款包含同条款要求、竞争库限制，帮助说明对独立再分发另有限制。 | 暂不批量内置社区动画；逐个核对 [正式素材许可](https://lottiefiles.com/page/license) 与 [许可帮助](https://help.lottiefiles.com/animation-licensing-basics-)。 |
| Lottie 播放程序 | 程序的 MIT 许可不覆盖动画、字体或图片。 | 本版未内置；原许可见 [lottie-web](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md)。 |
| Amicro | 仓库根目录为 MIT；翻页书具体组件另标 Apache-2.0，文件级许可须单独核对。 | 参考 [界面入口](https://amicro.vercel.app/) 与 [翻页书](https://amicro.vercel.app/3d)；代码、矢量插图和纸纹由项目实现。见 [固定组件与许可](https://github.com/Subhan-code/Amicro--Micro-transitions-/blob/43c29ce9cdd16459e3eab4992381b8d35b38776a/src/components/dither-charts/DitherBook.tsx)。 |
| Amotion | 未核实公开源码与再分发许可。 | 仅参考 [编辑器](https://www.amotion.app/editor) 的通用面板组织，不引入其程序或媒体。 |
| 社区教程与分享 | 按具体作品分别记录作者、来源与授权；不可从平台入口推导整个平台素材许可。 | 已确认的老师署名与作品范围见 [作品署名汇总](../NOTICE.md)。其他分享仅保留 [来源线索](https://www.xiaohongshu.com/s/poster?bgimg=https%3A%2F%2Fsns-redskillhub-s1.xhscdn.com%2Fred_app_image%2F1040g4m83241q07jpna005qelo9nsok378rohtb8%3Fsign%3D325e417b90d2f36dd545ce4f0d4a692d%26t%3D6c66710a&deeplink=xhsdiscover%3A%2F%2FminiTool%2F6a675ed61ed11800159c9d47%3Fsource%3Dh5%26page_key%3D28%26xhsMpScreenMode%3Dfull&code=031jeZFa1xQ5xM0p4AGa18RYP04jeZFv&state=wx_oauth)。 |

## 四、收录与离线使用要求

1. 新增第三方材料时保留固定版本、文件级许可、修改说明、运行时依赖与校验记录；代码和素材分别核对。
2. 修改上游代码时保留原版权并标注改编；只有参考链接时，不登记为已许可的内置程序。
3. 目录读取本地普通脚本、矢量轮廓、字体与生成图片，没有运行时远程素材；静态入口无需联网或服务器。外部参考只在本地缺口或明确需求下定向查阅。
4. 正式条目及数量以 [统一目录统计](../CATALOG-STATS.md) 为准。历史入口已下线，原作与迁移记录用于追溯，不作为新的公开素材授权依据。

## 五、播放条液态玻璃接入

玻璃程序为 Deepika Rao 的 Liquid Glass，保留上游尺寸感知位移图与三色通道折射，以普通本地脚本加载。参数沿用上游默认值：位移 −112、色散 6、内边 0.07、图模糊 12、背景模糊 3；只在尺寸变化时重建位移图。

Chromium 浏览器使用背景位移；Safari、Firefox 降级为磨砂。减少透明度、增强对比或强制颜色模式下停用折射。桌面播放条浮于预览下沿，窄屏移至画面下方；仅过滤材质层，避免额外厚模糊覆盖透镜边缘。浏览器实现边界见 [Aave 实现说明](https://aave.com/design/building-glass-for-the-web)，视觉方向见 [界面设计说明](apple-hig.md)。

## 六、作品与素材的详细记录

作品署名及公开待办集中维护在 [署名、来源与说明](../NOTICE.md)。素材记录分别位于 [材质演变](../catalog/assets/material-evolution/SOURCE.json)、[玻璃卡片](../catalog/assets/glass-light/SOURCE.json)、[谱面动作](../catalog/assets/particle-scenes/SOURCE.json)、[NASA 月貌](../catalog/assets/history-nature/SOURCE.json) 与 [书法生成材料](../vendor/calligraphy/README.md)；生成图集和字体许可入口统一由署名说明索引。
