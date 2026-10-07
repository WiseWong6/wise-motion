# 署名、来源与说明

Copyright © 2026 Wise Wong. 更新日期：2026 年 10 月 6 日。

本文件统一列明 Wise Motion 的项目许可、作品署名、视觉参考、素材来源与第三方依赖。目录数量见 [目录统计](CATALOG-STATS.md)；逐项来源记录与原许可文件随包保留。

## 一、项目许可与适用范围

| 内容范围 | 许可或说明 |
| --- | --- |
| 自有技能正文、效果定义、需求方法、目录界面、绘制与播放代码、检索程序、脚本和测试 | **AGPL-3.0-only**，完整条款见 [项目许可](LICENSE)。允许商业使用；分发与相关网络服务须履行适用的源码提供义务。 |
| 第三方程序、字体、原始数据与派生材料 | 分别保留原作者、原许可和使用条件，见第三、四部分。 |
| 具体作品复刻与视觉参考 | 记录参考对象与署名；参考链接本身不构成素材复制、改编或再分发授权。 |
| AI 辅助绘制与生成图片 | 记录为项目制作成果；输出归属按生成时适用条款处理，引用的第三方内容另行保留其权利。 |

目录中的 `source.origin: original` 表示本项目的实现来源，不代替素材与字体的权利记录。对具体材料的使用，以原许可、逐项来源记录和本文件中的适用范围为准。

## 二、作品署名与视觉参考

| 适用条目 | 来源类型 | 署名与出处 |
| --- | --- | --- |
| 黄金矩形递归生长及七个直接拆分动作 | 授权复刻 | 复刻至 [@陈与小金](https://www.xiaohongshu.com/user/profile/674ae141000000001c019796?xsec_token=AB4_JtYTs33ywlUEE_Mx8jkB1aDCvusqnUmnJNp5ZZLwE%3D&xsec_source=pc_search) 老师，已取得授权。原作权利由原作者保留。 |
| 谱面光点跳跃、沿点跳跃留光 | 教程复刻 | 复刻自 [@言说心事](https://www.xiaohongshu.com/user/profile/6926ff85000000003702b1c1?xsec_token=ABiobWDdNSX_CX9Vf091D7iZ9SeSMSlAk4oyjghnynYPQ%3D&xsec_source=pc_search) 老师的教程。谱曲与编配来源另列于第三部分。 |
| KIMI K3 开源宣传片复刻及七个单段 | 宣传片视觉参考 | 参考 [Kimi K3 open weights](https://www.youtube.com/watch?v=5GlCGOXUYHg)。图形输入与生成图片见 [素材记录](catalog/assets/material-evolution/SOURCE.json)。 |
| KIMI K3 宣传片复刻 | 宣传片复刻 | 复刻自 Kimi AI 的 [Meet Kimi K3](https://www.youtube.com/watch?v=bn0atstgavo)；补充资料见 [官方博客](https://www.kimi.com/en/blog/kimi-k3)。组合内复用的公共插画保留各自来源。 |
| Siri、短信、系统设置、音乐、天气与控制中心六张空间卡及相关光照、折射、错层动作 | 界面视觉参考 | 统一参考 [Apple Vision Pro 空间界面](https://www.apple.com/newsroom/2023/06/introducing-apple-vision-pro/)，玻璃材质补充参考 [Apple 液态玻璃设计](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)。界面由本项目独立绘制，示例数据与使用范围见 [卡片来源记录](catalog/assets/glass-light/SOURCE.json)。 |
| 玻璃卡片显现折射完整组合 | 组合参考 | 六张卡片统一采用苹果空间界面；语音使用 Siri，对话使用短信。组合与独立条目共用本项目绘制代码及相同参考来源。 |

目录底部的玻璃播放条采用第三方程序，列于第四部分；其 MIT 许可适用于该程序，不覆盖上述卡片的视觉参考。

## 三、素材、数据与字体

### 3.1 外部材料

| 材料 | 作者或来源 | 使用范围与许可状态 | 详细记录 |
| --- | --- | --- | --- |
| 月貌数值（LunarNearside，北向上） | NASA / GSFC / Arizona State University | LROC 允许署名用于新闻及教育；非 PDS 归档图片的商业使用需事先许可，现有展示图取样未取得此许可。 | [原图下载](https://assets.science.nasa.gov/dynamicimage/assets/science/psd/lunar-science/internal_resources/352/LunarNearside.jpeg?w=1024&h=1024&fit=clip)、[月貌来源与处理](catalog/assets/history-nature/SOURCE.json)、[LROC 使用条款](https://lroc.im-ldi.com/about/terms) |
| 《小星星》古老旋律与独立排谱 | 法国传统旋律 Ah, vous dirai-je, maman；排谱及简单伴奏：Wise Motion | 古老旋律为公有领域；本项目重新绘制谱面与 44 个音符事件，按 AGPL-3.0-only 提供。不复制现代编配、出版谱面、音乐字体或录音。《晴天》谱面及其音符数据已替换。 | [谱面、编配与软件来源](catalog/assets/particle-scenes/notes/assets/来源.md)、[莫扎特基金会的历史旋律记录](https://kv.mozarteum.at/de/work/zwolf-variationen-in-c-uber-4057) |
| 广东 21 市分区几何轮廓 | © OpenStreetMap contributors | 市界、海岸线及派生地图数据按 ODbL 1.0 提供；使用及再分发须保留署名与许可，公开使用的派生数据库按同一许可提供。 | [开放街图许可](https://www.openstreetmap.org/copyright)、[地图来源记录](vendor/guangdong-map/SOURCE.json)、[原许可](vendor/guangdong-map/ODbL-1.0.txt) |
| 材质演变的书法笔画与片尾字形 | 颜真卿《宋拓多寶佛塔碑 冊》；国立故宫博物院，台北；动画处理：Wise Motion | “道”字直接描摹第二开左页“道樹萌牙”的原字，原页及描摹轮廓保留 CC BY 4.0 署名；灰度描边、去除细小杂点并等比缩放。一、二、三直接描摹同册第十开“一志”“春秋二時”“自三載”的完整原字，中段粒子与片尾共用这些轮廓，同样保留 CC BY 4.0 署名；英文、数字及 WISE MOTION 字标使用 Oswald Bold。 | [古帖与开放说明](https://digitalarchive.npm.gov.tw/Collection/Detail/1947?dep=P)、[原页、原字位置与处理说明](vendor/duobaota/README.md)、[生成记录](catalog/assets/material-evolution/SOURCE.json) |

NASA 月貌数值与下表中的 AI 生成月面图片是两份不同材料，分别记录来源。

### 3.2 项目生成图片

| 素材组 | 制作方式与内容 | 详细记录 |
| --- | --- | --- |
| 植物蓝晒图集 | 使用 Codex 内置图像生成工具独立生成。 | [蓝晒素材记录](catalog/assets/cyanotype/SOURCE.json) |
| 剪贴短片图集 | 手掌、机械转轮、人物四姿态、八帧跑步及六帧弹离，由 Codex 内置图像生成工具独立生成；纸纤维、撕边、碎片与支架由代码绘制。 | [剪贴素材记录](catalog/assets/collage-film/SOURCE.json) |
| 材质演变图片 | 纤维球、月面与科学版画图鉴，由 Codex 内置图像生成工具根据参考帧重建；来源按生成图片记录。 | [材质素材记录](catalog/assets/material-evolution/SOURCE.json) |
| 生长与文明群像 | 植物、花卉和文明版画由 Codex 内置图像生成工具生成，局部机关由代码控制。 | [生长与文明素材记录](catalog/assets/civilization-growth/SOURCE.json) |
| 版画蝴蝶与多彩翼图 | 用户已确认的两张透明图集由 Codex 内置图像生成工具制作；四翼、身体和触角末端按原图裁取，触角曲线由代码绘制。 | [蝴蝶素材记录](catalog/assets/butterfly/SOURCE.json) |

上述记录保留制作方式、提示词、文件尺寸和校验信息。生成图片的制作归属与参考内容的使用条件分别记录。

### 3.3 字体与字形

| 字体或字形 | 使用范围 | 许可与材料 |
| --- | --- | --- |
| 思源黑体 Light、Regular、Bold | 目录中文；保留原字体名称及完整字符，使用网页格式 | SIL OFL 1.1，见 [原许可](catalog/fonts/OFL.txt)。 |
| Outfit Medium | 界面数字与生长化蝶字标；保留原字形轮廓 | SIL OFL 1.1，见 [原许可](catalog/fonts/OFL-Outfit.txt)。 |
| Oswald Bold | 品牌文字、英文、数字、标题；包括 WISE MOTION、MOTION、CLAUDE 固定字标及材质演变片尾试样 | SIL OFL 1.1，见 [原许可](catalog/fonts/OFL-Oswald.txt)；固定字标由 [字标程序](scripts/build-brand-outlines.py) 及 [材质片字形程序](scripts/build-material-glyphs.py) 从随包字体生成。 |
| 霞鹜文楷 | 水波文字与星月来信字形；保留原字体名称，使用网页格式 | SIL OFL 1.1，见 [原许可](catalog/fonts/OFL-Letter.txt)。 |
| Liu Jian Mao Cao 草书 | 薪火生长与文明聚字的草书字形 | [SIL OFL 1.1](catalog/assets/civilization-growth/OFL-Cursive.txt)，来源见 [素材记录](catalog/assets/civilization-growth/SOURCE.json)。 |
| 文明组合的衬线字形 | 组合中的衬线字形轮廓 | [SIL OFL 1.1](catalog/assets/civilization-growth/OFL-Serif.txt)。 |
| I.顏體 / I.Ngaan | “火炎焱燚”轮廓与固定网格墨点 | **GPL-2.0-or-later**，保留王漢宗与 Ichiten Fonts Project 原版权。原字库、许可及生成程序见 [生成材料](vendor/calligraphy/README.md)。 |

I.顏體字库及派生字形保留 GPL-2.0-or-later；自有提取程序采用 AGPL-3.0-only。运行 `python3 vendor/calligraphy/prepare-calligraphy.py --check` 可用随包材料验证现有四字数据。

“字标点阵显现”使用 Oswald Bold 的 WISE MOTION 两行轮廓，保留字体许可；原 Naive 门形标志已替换，旧条目标识仅用于链接兼容。

## 四、第三方程序与图标

| 项目与作者 | 版本或来源记录 | 使用位置与修改 | 原许可 |
| --- | --- | --- | --- |
| Liquid Glass · Deepika Rao | [固定来源与文件记录](vendor/liquid-glass/SOURCE.json)、[上游仓库](https://github.com/deepika-builds/liquid-glass) | 目录底部玻璃播放条；保留折射算法，增加浏览器能力保护、失败处理与销毁清理。 | [MIT](vendor/liquid-glass/LICENSE) |
| Anime.js · Julian Garnier | 4.5.0；[来源记录](vendor/animejs/SOURCE.json) | 计时与速度曲线；随包程序未修改。 | [MIT](vendor/animejs/LICENSE.md) |
| Heroicons · Tailwind Labs | 2.2.0；[来源记录](vendor/heroicons/SOURCE.json) | 界面及卡片图标；选用路径合并为普通脚本，路径未修改。 | [MIT](vendor/heroicons/LICENSE) |
| Lucide Icons · Contributors；部分图标源自 Feather · Cole Bemis | 1.8.0；[来源记录](vendor/lucide/SOURCE.json) | 内联界面图标；调整尺寸、笔画与可访问属性，侧栏箭头为项目适配。 | [ISC 与 MIT 原声明](vendor/lucide/LICENSE) |
| Three.js | 版本与原声明随音符绘制包保留 | 谱面动作的三维绘制；许可注释保留在离线程序中。 | MIT，见 [软件来源](catalog/assets/particle-scenes/notes/assets/来源.md)。 |

Remotion、React 等视频复用依赖由目标工程安装，版本和接入方式见 [Remotion 制作说明](REMOTION.md)，许可按各依赖原条款执行。开发检查使用的 jsdom 及其依赖仅用于测试，不进入目录运行时；其许可随开发依赖保留。

第三方版权与许可文件保持原文。GSAP、Jitter、LottieFiles 等外部资源的收录边界见 [来源核对与收录规范](references/sources.md)。

## 本次迁入的自有场景

蒲公英、驾车气球、小猫加工厂、深圳湾雪夜、海面上的夕阳、花落成蝶、星月来信、小葵自拍、雨伞返场和螺旋丸家族的绘制、数据与插画，由 Wise Wong 创作并确认用于本库。原文件、迁入素材及校验记录见 [原作与迁入记录](catalog/assets/scene-sources/原作与迁入记录.json)。原工程不参与运行。十八个完整组合保留已核对的原音效和配乐，声音、合成源码与时序见 [组合声音来源](catalog/assets/composition-audio/SOURCE.json)；独立动作和插画保持无声。

第三方录音与音乐遵循各组原作说明及许可，程序的 AGPL 许可不覆盖这些媒体。包括 Joth 的 CC0《JRPG Piano》、海浪录音的 CC BY 3.0、原猫叫与机械录音、星月来信的声音素材及《雨中曲》原演唱节选；具体署名、加工与来源保留在各组目录内。演进样片及水墨微光保留原合成代码。

深圳湾雪夜保留 p5.js 1.9.4 的噪声子集及原许可全文（LGPL-2.1），见 [第三方来源与许可](catalog/assets/scene-sources/snow/THIRD-PARTY.json)；抽出为实例内函数，并将初始化随机数接入固定种子。乐曲事件用于画面变化，完整组合同步播放原曲。

星月来信使用霞鹜文楷和马善政毛笔字体，保留 [文楷原许可](catalog/assets/scene-sources/letter/fonts/OFL-LXGWWenKai.txt) 与 [毛笔原许可](catalog/assets/scene-sources/letter/fonts/OFL-MaShanZheng.txt)。银河图片的原说明见 [素材来源](catalog/assets/scene-sources/letter/素材来源.md)。自拍图集为用户提供的自有原图，按原视角、足迹和透视映射复用。
