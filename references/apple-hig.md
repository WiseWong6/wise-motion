# 界面设计依据：苹果人机交互设计指南

核对日期：2026-09-30；液态玻璃资料与播放条样例补充于 2026-10-01。目标用户是不熟悉动效术语、需要找参考并交接源码的人。核心路径是“选动作 → 看预览 → 调整节奏 → 复制”。

本地网页借鉴指南中适用的布局、颜色、文字和交互原则。系统原生控件、Liquid Glass 材质和 Dynamic Type 原生接口依赖苹果应用框架，不能把网页样式视为这些原生能力，也不据自动检查宣称获得苹果认证或完整符合全部平台指南。

| 指南 | 页面落实 |
|---|---|
| [布局](https://developer.apple.com/design/human-interface-guidelines/layout) | 左侧分组目录、中间动效、右侧使用说明；用留白和分隔线表达关系。复制动作放在右栏上方，节奏参数按需展开。空间变小时减少列数，保留全部功能。 |
| [侧栏](https://developer.apple.com/design/human-interface-guidelines/sidebars) | 目录两层：运动行为分类与动作。选中态同时使用背景、边线和读屏状态；顶栏提供显示／隐藏按钮，默认可见。 |
| [颜色](https://developer.apple.com/design/human-interface-guidelines/color) | 背景、正文、辅助文字、边界和主要操作分别定义语义颜色。主体采用中性颜色，蓝色用于链接和主要复制动作；响应深色外观、增强对比和强制颜色设置。 |
| [材质](https://developer.apple.com/design/human-interface-guidelines/materials) | 仅播放条试用液态玻璃的网页视觉近似。接入有许可的开源边缘折射，光学用上游默认值，外观用其示例的薄渐变、上缘高光和一像素玻璃边；Chromium 使用 SVG 位移处理真实背景，Safari、Firefox 使用磨砂回退。内部控件不叠玻璃，主播放键是唯一常驻芯片，重播和全屏是更小的白色字形。面板整条浮在预览下沿之内，让折射背后是画面本身；窄屏回落到画面下方。网站采用黑白灰背景，玻璃不会出现彩色封面或壁纸透过的效果。正文、目录和右侧面板不透明。不支持背景模糊或开启增强对比、支持的降低透明度设置时保留实色；按钮保留按下的缩放反馈。 |
| [文字](https://developer.apple.com/design/human-interface-guidelines/typography) | 使用本机系统字体，不下载或打包苹果字体。桌面主要文字为 13 像素，辅助文字至少 10 像素；用字号与常规／中等／半粗字重表达层级。网页文字使用相对尺寸并支持浏览器缩放。 |
| [按钮](https://developer.apple.com/design/human-interface-guidelines/buttons) | 一个明确的主要复制按钮；帮助方法与许可保留在包内文档，页面不常驻展示；提供悬停、按下、键盘焦点及复制结果反馈。复制用重叠页面图标，重播用回转箭头，目录用侧栏图标。 |
| [滑块](https://developer.apple.com/design/human-interface-guidelines/sliders) | 保留原生滑块、数值与可读标签；时间和速度从左小到右大，调整即时作用于预览和输出。 |
| [无障碍](https://developer.apple.com/design/human-interface-guidelines/accessibility) | 主要界面文字颜色对比至少 4.5:1；读屏可识别当前动作、页签、滑块值和复制结果。可跳过目录、用键盘导航、保持选择后的焦点；触屏控件点击区域至少 44 像素。 |
| [动效](https://developer.apple.com/design/human-interface-guidelines/motion) | 主预览、相关动作弹窗和复制保存的页面默认从头自动播放；支持立即暂停，不要求等播放结束才能操作。不根据系统动效偏好降级或暂停，也不显示相关提示或开关。目录页面隐藏时暂停，返回后只恢复原本正在播放的内容；手动暂停保持有效，切换动作或离开页面释放旧实例。 |

官网配色的具体参考为 [苹果 Mac 页面](https://www.apple.com.cn/mac/) 和 [MacBook Pro 页面](https://www.apple.com.cn/macbook-pro/)。配色取向作为网页视觉参考；指南要求使用语义颜色，因此本包把颜色集中为可随系统外观变化的样式变量，没有把官网固定色值当作原生系统颜色接口。

播放条材质参考固定为 Apple 于 2025 年 6 月发布的 iOS 26 素材：[玻璃材质细节](https://www.apple.com/newsroom/videos/2025/autoplay/06/apple-introduces-a-delightful-and-elegant-new-software-design/apple-wwdc25-liquid-glass-details/posters/Apple-WWDC25-Liquid-Glass-details-250609.jpg.large_2x.jpg)与 [Apple Music 浮动导航](https://www.apple.com/newsroom/videos/2025/autoplay/06/apple-introduces-a-delightful-and-elegant-new-software-design/apple-wwdc25-liquid-glass-apple-music-dynamic-tab-bars/posters/Apple-WWDC25-Liquid-Glass-Apple-Music-dynamic-tab-bars-250609.jpg.large_2x.jpg)，动态效果见 [官方设计介绍](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)。使用原则来自 [WWDC25 液态玻璃讲解](https://developer.apple.com/videos/play/wwdc2025/219/)：常规材质用于操作层，清透材质仅用于符合可读性条件的媒体背景，避免玻璃叠加。样例中的模糊强度、透明度和高光为本网页的试用值，不是 Apple 公布的网页参数；已接入网页背景折射，但不是苹果原生材质，也没有原生自动背景识别或连续形变；代码与浏览器限制见 [源码来源](sources.md)。

用户提供的 iOS 锁屏播放器与 Apple Music 浮动导航截图作为操作层次参考：时间在进度两端，播放／暂停为主要动作，次级按钮只是玻璃上的字形；面板浮在内容之上而不是贴在下方。网站保留现有重播和全屏功能，不增加没有对应内容的上一曲／下一曲按钮。

网页的背景模糊按 [MDN 的背景滤镜说明](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)使用能力检测和实色回退；[降低透明度媒体查询](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency)仅在支持它的浏览器响应系统偏好，不能假定所有浏览器都能读取该设置。

自动检查覆盖逻辑、播放器的起止定位与时间同步、键盘焦点、默认从头播放、手动暂停与页面隐藏后的恢复、代码导出运行、样式语法以及实色界面主要文字的颜色对比。玻璃覆盖不同背景时的可读性、200% 缩放、触屏和 VoiceOver 读屏体验仍需按 [人工验收步骤](../tests/manual.md) 检查。代理已对照用户提供的参考图，并通过本地静态服务在 Chromium 上逐档截图核对深浅外观、边缘折射带、悬停芯片、增强对比回退与窄屏回落；视口 1600×1000 与 430×900 已实测，其余尺寸仍需按验收步骤复核。
