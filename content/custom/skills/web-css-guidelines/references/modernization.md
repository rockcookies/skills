# 现代化替换与 IE 兼容写法丢弃清单

**完成：** 看到旧写法时归入替换 / 丢弃 / 保留 / 立场四类之一，并落到对应现代写法；不要通读未命中的表行。

对照旧时代 / 过时 CSS 写法与现代做法。本文件回答：还该不该用、换成什么、Tailwind v4 怎么写。

- 当前基线：Tailwind v4（Safari 16.4+ / Chrome 111+ / Firefox 128+）。
- 复核日期：**2026-11-05**。`✔复核` = 当日检索；`未逐项复核` = 既有知识；生产前以 MDN / caniuse 为准。`[验]` 核对过程见文末「复核记录」。
- 分类：**🔄 现代化替换**｜**🗑️ 丢弃**｜**✅ 保留**｜**⚖️ 立场调整**。

---

## A. 🔄 现代化替换

### A1 布局

| 旧写法 | 现代写法 | Tailwind v4 | 备注 |
|---|---|---|---|
| 清浮动：`.clearfix`（`:after{clear:both}`）、`overflow:hidden`、`display:table` 清除伪元素 | `display:flow-root` | `flow-root` | 创建 BFC，无裁剪副作用 |
| float 布局（两栏、多栏、"砖头式"定宽 float） | flex / grid | `flex` / `grid grid-cols-[auto_1fr]` | float 只留给文字环绕 |
| float + margin 避让做自适应两栏 | grid 或 flex | `grid grid-cols-[auto_1fr] gap-4` / `flex` + `flex-1 min-w-0` | 免手算避让宽度 |
| BFC 自适应栏：`overflow:hidden` / `display:table-cell;width:9999px` | 内容侧 `flex-1 min-w-0` | `flex-1 min-w-0` | 无裁剪与 table 副作用 |
| 等高：`table-cell`、负 margin（`-9999px/9999px`）、border 法 | flex stretch / grid 同行 | `flex items-stretch` / `grid` | 负 margin 法还会破坏锚点定位 |
| 两端对齐列表：负 margin + float；`text-align:justify` + inline-block + 占位标签 | flex wrap / grid | `flex flex-wrap justify-between gap-5` / `grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` | 末行对齐问题交给 grid |
| 弹框居中：fixed 容器 `text-align:center; font-size:0` + `:after{inline-block;height:100%;vertical-align:middle}` | grid / `<dialog>` | `grid place-items-center` / `<dialog class="m-auto">` | 旧写法自称"近似居中" |
| 定位居中：`top:50%; margin-top:-半高` / `translate(-50%,-50%)` | `inset:0; margin:auto` + `fit-content` | `absolute inset-0 m-auto size-fit` | 把 `transform` 留给动画 |
| 覆盖：`width:100%; height:100%` | 对立方位 | `absolute inset-0` | 加 margin 不溢出 |
| 居中收缩元素：`display:table` + `margin:auto` | `fit-content` + `margin:auto` | `mx-auto w-fit` | |
| 100vh 整屏 | `dvh/svh/lvh` | `min-h-dvh` | 移动端地址栏 |
| 滚动条 17px 补偿：`border-right:17px solid transparent` | `scrollbar-gutter:stable` | `[scrollbar-gutter:stable]` | 滚动条宽度不是常量 |
| 弹窗背景锁定：根元素 `overflow:hidden` + JS 补 17px | `<dialog>` modal；或 `overflow-hidden` + `scrollbar-gutter` | `<dialog>` / `overflow-hidden` | |
| 弹层滚动穿透：JS 锁 body | `overscroll-behavior:contain` | `overscroll-contain` | 老浏览器忽略即回退 |
| 吸顶：JS 监听滚动 | `position:sticky` | `sticky top-0` | 三问见 L-10 |
| 平滑滚动：JS | `scroll-behavior:smooth` | `motion-safe:scroll-smooth` | |
| 子元素尺寸：`calc(100% - 20px)` 做右下背景定位 | `background-position` 4 值语法 | `bg-[position:right_20px_bottom_20px]` | calc 性能差 |

### A2 层叠、显隐、动画

| 旧写法 | 现代写法 | Tailwind v4 | 备注 |
|---|---|---|---|
| 展开收起：`max-height:0 → 666px` | `grid-template-rows: 0fr → 1fr` | `grid grid-rows-[0fr] data-open:grid-rows-[1fr]` + 子项 `min-h-0 overflow-hidden` | 无魔法数、无收起延迟 |
| `display:none` 不能过渡 → 改 `visibility` | `transition-behavior:allow-discrete` + `@starting-style` | `transition-discrete starting:opacity-0` | ✔复核 Newly available |
| 隐藏模板：`<script type="text/html">` | `<template>` | `<template>` | |
| 键盘可达的隐藏：`clip:rect(0 0 0 0)` / `left:-999em` / `z-index:-1` + 背景 | 视觉隐藏模式 | `sr-only` / `focus:not-sr-only` | `clip` 已被弃用，Tailwind 已封装 |
| 文本隐藏：`text-indent:-9999em` | `sr-only`；定长缩进 | `sr-only` / `-indent-30 overflow-hidden whitespace-nowrap` | |
| z-index 层级计数器（JS）、数值军备竞赛 | CSS 层级变量 + top layer | `z-(--z-modal)` / `<dialog>` / Popover | 见 S-04/S-07 |
| JS 定位提示/下拉（Popper 类） | CSS Anchor Positioning | 任意属性：`[anchor-name:--a]` / `[position-area:bottom]` | ✔复核 2026-01 起 Newly available（Firefox 147） |
| IntersectionObserver 做滚动显现 / 滚动监听做进度条 | 滚动驱动动画 | `[animation-timeline:view()]` + keyframes | ✔复核 2026-10 起 Newly available（Firefox 159）；仍加 `@supports` |
| 阴影 hover 直接过渡 | 双伪元素 + `opacity` | `after:opacity-0 hover:after:opacity-100` | 性能做法仍有效，见 R-11 |
| JS 计算路径动画 | `offset-path` + `offset-distance` | `[offset-path:path("M…")]` | |
| 1×1 图片平铺遮罩 | 半透明色 | `bg-black/50` | |
| 逐按钮 `:active` 背景（垫底背景图） | `active:` 变体 | `active:brightness-95` | |

### A3 文本与内联

| 旧写法 | 现代写法 | Tailwind v4 | 备注 |
|---|---|---|---|
| 下划线：`text-decoration:none; border-bottom` 模拟 | `text-underline-offset` + `text-decoration-thickness` | `underline decoration-1 underline-offset-4` | `未逐项复核`，已广泛支持 |
| 单行/多行省略的 `-webkit-line-clamp` + `display:-webkit-box` | `line-clamp` | `truncate` / `line-clamp-3` | 框架已封装 |
| 20px 图标基线体系（全角空格伪元素 + `text-indent:-999em; letter-spacing:-1em`） | flex 对齐 + `currentColor` 的 SVG | `inline-flex items-center gap-1.5` + `size-[1em] fill-current` | |
| 图片底部空隙：`font-size:0` / `line-height:0` 等 | 图片块状化 | `block`（Preflight 已设） | |
| `ex` 单位让图标天然对齐 | 仍可用；通常 flex 更稳 | `h-[1ex]` | ✅ 保留 |
| `border-bottom` 画装饰线、border 三角形 | `clip-path: polygon()` / 内联 SVG | `[clip-path:polygon(50%_100%,0_0,100%_0)]` | 微小箭头 border 法仍可用 |
| `-webkit-text-stroke` 做粗描边 | 同元素加 `paint-order: stroke fill` | `[paint-order:stroke_fill] [-webkit-text-stroke:4px_red]` | ✔复核：HTML 文本也支持（Chrome 123+、Firefox 60+、Safari 11+），Baseline Newly available（2024-03） |
| `text-justify:inter-ideograph` | 无需 | `text-justify` | IE 私有值 |

### A4 视觉

| 旧写法 | 现代写法 | Tailwind v4 | 备注 |
|---|---|---|---|
| IE8 多背景伪元素 + 负 z-index 模拟 | 原生多背景 | `bg-[url(a.png),url(b.png)]` | |
| `border-image` 渐变边框 + `clip-path` 补圆角 | 双背景 padding-box / border-box | `border-2 border-transparent [background:linear-gradient(...)_padding-box,linear-gradient(...)_border-box]` | 支持圆角，无副作用 |
| 背景 sprite（`background-position` 拼图） | 内联 SVG / 独立 SVG + `object-fit` | `object-cover` | |
| 两层背景图 hover 切换 | `opacity` 过渡 / `cross-fade()` | `transition-opacity` | |
| Sass 变量换肤 | CSS 自定义属性 + `@theme` | `@theme` + `:root` 语义变量 | |
| 手写 `-webkit-` / `-moz-` 前缀 | 交给构建工具 | — | Tailwind v4 内置 Lightning CSS 前缀与降级 |
| `width: -webkit-fill-available; width:-moz-available; width:stretch` 三连 | 默认块级 / 容器 `w-full`；确需 stretch 时保留 `-webkit-fill-available` 作回落 | 默认 / `w-full` | ✔复核：无前缀 `stretch` 仅 Chrome/Edge 138+，Firefox 与 Safari 目前只认 `-webkit-fill-available`（MDN BCD），不是 Baseline。个别第三方页面称 Firefox 130+ / Safari 18.2+ 已支持，与 BCD 不符，不采信 |

### A5 变量与响应式

| 旧写法 | 现代写法 | Tailwind v4 | 备注 |
|---|---|---|---|
| `html{font-size:62.5%}` / 100px 根字号 | 保持 16px + `rem` + `clamp()` | `text-fluid`（`@theme`） | |
| 纯 `vw` 布局 | `clamp(MIN, … + vw, MAX)` | `text-[clamp(...)]` | |
| `-webkit-min-device-pixel-ratio` | `min-resolution: 2dppx` | `[@media(min-resolution:2dppx)]:` | |
| 按设备断点 / 全局媒体查询调组件 | 容器查询 | `@container` + `@md:` | 组件级响应 |
| 过渡 `all` / 正延时交错 | 指定属性 / 负延时 | `transition-[opacity,transform]` / `[animation-delay:-0.3s]` | |

---

## B. 🗑️ 丢弃：IE 与旧浏览器兼容写法

这些写法**只为旧浏览器存在**，在 Tailwind v4 基线下一律不写，也不要从旧代码里抄。

| 丢弃的写法 | 为什么丢 |
|---|---|
| `filter: Alpha(opacity=0)`、`-ms-filter`、`progid:DXImageTransform…`、IE 渐变滤镜与 `#AARRGGBB` 透明度换算（`Math.round(256*op).toString(16)`） | 只为 IE8-；现代 `opacity` / `rgb(… / α)` / 渐变直接可用 |
| `*zoom:1`、`_height`、`*display:inline`、`\9`、`\0` 属性 hack、`*` / `_` 前缀、`:root` hack | 现代问题是"支持与否"，不是渲染 bug；分流靠语法差异 / `@supports` |
| IE6/7 的 `hasLayout` 触发、`display:inline; zoom:1` 模拟 inline-block | IE6/7 专属 |
| 用**真实元素**代替伪元素做居中辅助（"IE7 需要把伪元素换成真实元素"） | IE7 专属 |
| `[hidden]{display:none}` 兼容补丁 | Preflight 已处理；`hidden` 属性现代浏览器原生支持 |
| IE 私有 `text-justify:inter-ideograph` | IE 私有值 |
| IE 的 `-ms-` 前缀、`@media screen and (-ms-high-contrast)` | 用 `forced-colors` 媒体特性 |
| 无 hack 区分 IE8/IE9+ 的写法：`background:url(a.png); background:url(a.svg), none;`、`background:url(a.png), linear-gradient(transparent,transparent)` | 区分对象（IE8/IE9）已不在基线内 |
| "用高版本 IE 兼容模式验证 IE8 表现" | 目标浏览器已不存在 |
| 双倍浮动 margin、IE6 "浮动与内联同行"等 float bug 的 workaround | IE6/7 专属 |
| IE10- 的 `outline` 镂空点击穿透补背景 | IE10- 专属 |
| `fit-content` 在 IE/Edge 不支持 → `translate(-50%,-50%)` 兜底 | 已全面支持，不再兜底 |
| `text-align:center + font-size:0` 一类为消除 inline-block 空白间隙的 IE 时代手法 | 用 flex/grid + `gap` |
| `display:table-cell` 当布局工具（为兼容 IE8 的 BFC/等高/居中） | 用 flex/grid |
| JS 里手写的 `javascript:` 伪协议返回顶部 | 用 `href="#"` / 按钮 |
| 对 `<li>` 做 margin/padding/list-style 重置 | 浏览器默认本就无需重置；Preflight 已统一处理 |
| 手写 `-webkit-box-*` / `-webkit-flex` / `-ms-flexbox` 旧 flex 语法 | 构建工具按 targets 处理 |

> 判断口诀：写法里出现 `IE`、`\9`、`*`/`_` 前缀、`filter:progid`、`zoom`、`-ms-` → 直接丢；出现"兼容 xx 浏览器"且该浏览器低于 Tailwind v4 基线 → 丢，并去提升基线或降级工具链。

---

## C. ✅ 保留（原理仍对）

- **三无** / 流优先；`width:auto` 四表现；双盒子体系。
- 层叠七阶图、黄金准则、"层叠上下文 = 结界"；`z-index:auto` 与 `0` 的区别；负 z-index 垫底。
- **无依赖绝对定位**、对立方位流体写法、`relative` 最小化影响；absolute 四向 0 + `margin:auto`（定宽高居中）。
- margin 合并规则与阻断；margin 不生效排查链；`margin:auto` 剩余空间分配。
- 行高用数值；strut / 基线体系；`vertical-align` 数值微调；单行省略三件套。
- 隐藏决策矩阵（语义维度）；`visibility` 继承性；需要测量尺寸时用 `visibility`。
- `@property` 与"变量要过渡必须注册类型"；`var()` fallback 语义。
- flex 缩写陷阱、`fr`/`minmax` 规则、sticky 三问、`auto-fit` 万能公式。
- 渐变角度与断点回填、毛玻璃、mask vs clip-path 分工、`isolation`、`pointer-events` 语义。
- label 代理表单控件（`peer` + `sr-only` 仍是最佳做法）。
- 动画只碰 `transform/opacity`；`will-change` 少量短命；`content-visibility` + `contain-intrinsic-size`。
- `outline` 永不全局关闭（可访问性）。

## D. ⚖️ 旧立场调整

| 旧立场 | 现代工具链下的做法 |
|---|---|
| 反对全局 `*{box-sizing:border-box}`（对内联元素无意义，解决不了水平 margin） | Tailwind Preflight 已内置，**接受它**；"块级元素不写宽度"的流优先原则不变（L-14） |
| 滚动容器 `padding-bottom` 各浏览器不一致，用子元素 `margin-bottom` | 块轴末端（底部）padding 已一致 ✔复核（Firefox 89+ 修复，2021），可直接用 `padding-bottom`；行内轴末端（右侧）仍可能不一致 `[验]` |
| `cursor:not-allowed` 的语义判断 | 团队设计系统有约定时以其为准（T-15） |
| 自行造"层级计数器"管理浮层 | 优先 `<dialog>`/Popover（top layer）；仍需 z-index 时用统一 CSS 变量（S-04/S-07） |

---

## E. ➕ 基线外补充：新能力的状态（2026-11-05）

下列能力超出本技能默认叙述，或兼容性仍在演进。用在 `references/` 的规则里时已用 `[补]` / `[验]` 标记。

| 能力 | 用途 | 状态 | 说明 |
|---|---|---|---|
| `:has()`、原生嵌套、`@layer`、`@container`（尺寸）、`subgrid`、`color-mix()`、逻辑属性、`:focus-visible`、`clamp()` | 父选择器、容器查询、层管理等 | Widely available ✔复核 | `:has()` 与嵌套于 2026-08 起 Widely |
| `text-wrap:balance`、`light-dark()`、`@scope`（2026-03）、`@starting-style` 与 `allow-discrete`（2024-08）、`field-sizing`（2026-06）、`@property`（2024-07）、`scrollbar-gutter`（2024-12）、Popover API（2025-01）、`paint-order`（2024-03）、`contrast-color()` | 文本均衡、深浅色、离散过渡、变量过渡、滚动条占位、顶层弹层 | Newly available ✔复核 | 对低版本需降级；日期来自 web-features 汇总 |
| `text-wrap:pretty` | 避免孤字 | **Limited** ✔复核（Chrome 117+、Safari 26+，Firefox 未支持） | 只作渐进增强，不支持时正常换行 |
| 容器**样式**查询 `@container style()` | 用自定义属性做变体 | Newly available（2026-05，Firefox 151）✔复核 | |
| CSS Anchor Positioning | 提示/下拉/弹层定位 | 核心（`anchor-name`、`position-anchor`、`position-area`、`anchor()`）Newly available（2026-01，Firefox 147）✔复核；整组在 web-features 仍标 Limited（`position-visibility`、`anchor-size()`、跟随 transform 等子特性） | Chrome/Edge 125、Safari 26；Firefox 暂不能过渡锚定后的 inset；`position-anchor` 初始值在 Chrome/Firefox 151、Safari 27 之前有差异，务必显式设置 |
| 滚动驱动动画 `animation-timeline` | 滚动进度、滚动显现 | Newly available（2026-10，Firefox 159）✔复核 | 仍加 `@supports` |
| `<dialog>` / `inert` | 模态、禁用子树 | Widely ✔复核（二手来源，核对日期 2026-09-10） | |
| Popover API | 非模态顶层弹层 | Newly available（2025-01）✔复核 | |
| `interpolate-size` / `calc-size()` | `height:auto` 过渡 | 仅 Chrome/Edge 129+ ✔复核 | 不可作唯一方案；用 grid `0fr → 1fr`（S-10） |
| 跨文档 View Transitions | 页面间过渡 | Limited availability ✔复核（二手来源：Chrome/Edge 126+）| 谨慎使用；同文档 View Transitions 已于 2025 年底进入 Newly（二手来源） |
| `dvh/svh/lvh`、`aspect-ratio`、`gap`（flex）、`inset`、`overscroll-behavior` | 视口、比例、间距、滚动 | 广泛可用（未逐项复核）| |

> 复核来源：web.dev 月度《New to the web platform》（2026-01、2026-10）、MDN Baseline 数据与 web-features 汇总页面（2026-06 ~ 2026-10 更新）。Baseline 状态会继续变化，**写进生产前请再查一次。**

---

## F. 复核记录（2026-11-05，对 `[验]` 条目的第二轮核对）

**有改动的（原稿有误或过于笼统）**

| 条目 | 原稿 | 核对结论 | 来源 |
|---|---|---|---|
| `text-wrap: pretty` | 与 `balance` 并列"Newly available" | `balance` 是 Newly（2024-05）；`pretty` 仍是 **Limited**，Firefox 未支持（至 153） | web-features explorer、caniuse |
| `paint-order` 用于 HTML 文本 | "仅 SVG text 可靠" | 2024-03 起 Baseline Newly，HTML 文本配 `-webkit-text-stroke` 有效 | MDN、BCD 议题记录 |
| Tailwind `transition-[opacity,transform]` | 示例写法 | v4 的位移/缩放/旋转是独立属性，应写 `transition-transform` 或 `transition-[…,translate,scale]` | 二手汇总（见下方说明） |
| `content-visibility:auto` 与页内搜索 | `[验]`，旧 patterns 称 Ctrl+F 命中视实现而定 | 规范与 MDN：`auto` 跳过的内容仍可被页内搜索、聚焦、选中；`hidden` 值才不可。Chrome 官方仍建议实测键盘可达性 | MDN、Chrome 文档、CSS-Tricks |
| 滚动容器 `padding-bottom` | "现代浏览器已趋一致 `[验]`" | 块轴末端：Chrome/Safari 一直计入，Firefox 89（2021）补齐；行内轴末端仍不一致 | Mozilla 邮件列表、Bugzilla、CSSWG 纪要 |
| Anchor Positioning | "Newly available（2026-01）" | 核心 Newly（2026-01）；整组在 web-features 仍为 Limited（子特性）；有 Firefox 过渡与 `position-anchor` 初始值差异 | web.dev 2026-01、web-features explorer、2026-09 的第三方核对 |
| `width: stretch` | 状态待验 | 无前缀仅 Chrome/Edge 138+；Firefox/Safari 仍走 `-webkit-fill-available` | MDN BCD；另有第三方页面与之冲突，不采信 |

**确认无误并去掉 `[验]` 的**

| 条目 | 结论 | 来源 |
|---|---|---|
| Preflight 让 `img/svg/video/canvas/audio/iframe/embed/object` 为 `display:block; vertical-align:middle`，且 `img, video { max-width:100%; height:auto }` | 属实 | Tailwind Preflight 源码的多处镜像 |
| `pointer-fine` / `pointer-coarse` / `any-pointer-*`、`mask-*`、`wrap-anywhere` / `wrap-break-word` | 均为 Tailwind v4.1 新增 | v4.1 发布说明与更新日志 |
| `starting:` 变体、`transition-discrete`、`open:` 含 `:popover-open`、`hover:` 仅 hover 设备、`inert:` | 属实 | v4 升级/特性汇总（二手，多处一致） |
| `interpolate-size` / `calc-size()` | 仅 Chrome/Edge 129+ | Chrome 官方文档兼容性组件、2026-09 第三方核对 |
| 滚动驱动动画 | Baseline Newly（2026-10，Firefox 159） | web.dev 2026-10-29 |
| antd `zIndexPopupBase` 默认 1000、`zIndexBase` 默认 0 | 属实 | antd 5 seed.ts、antd 6.3.6 seeds.d.ts |
| antd `StyleProvider layer`（≥5.17.0）与 Tailwind v4 的层声明 | 属实；层声明在 `@import 'tailwindcss'` 之前；子树需 `ConfigProvider`；zeroRuntime 的 `antd.css` 需放入同一层 | antd 官方"样式兼容"文档 |

**仍未能确认或仅有二手来源**

- 行内轴末端（右侧）padding 在当前各引擎中的实际表现：只有 2021 年前后的讨论，仍标 `[验]`。
- `::details-content`、`<dialog>` / `inert` Widely、同文档 View Transitions、跨文档 View Transitions 的状态，以及 `scrollbar-gutter`、Popover、`@property`、`@scope`、`field-sizing` 的具体日期：来自第三方汇总或博客，它们声称对 BCD / web-features 做过核对，我没有逐项回到 MDN 页面确认。
- Tailwind 类名：本轮只核对了上表所列；`size-fit`、`outline-hidden`、`inset-shadow-*`、`bg-linear-*` 等沿用已有知识，没有逐个对照文档。
- "`transition` 默认属性列表是否覆盖 translate/scale/rotate"没有核实，因此文中未做此断言。
