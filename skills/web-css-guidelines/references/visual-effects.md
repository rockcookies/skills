# 视觉效果：渐变、滤镜、遮罩、剪裁、SVG、阴影（E 系列）

**完成：** 当前任务命中的 E-ID 已对照并落到代码；不要通读未命中章节。母题：按**数据类型**理解新属性。

目录：渐变 E-01 · 毛玻璃 E-02 · filter E-03 · 混合模式 E-04 · mask vs clip-path E-05 · 图标换色 E-06 · 渐变边框 E-07 · 多背景图形 E-08 · outline 与镂空 E-09 · 阴影 E-10 · SVG E-11 · 路径运动 E-12 · 三角形 E-13 · 文本描边 E-14 · 禁用与交互 E-15 · 选区与滚动条 E-16 · 不透明度与圆角 E-17

## E-01 渐变
- **角度**：CSS 与 Photoshop 相反——`0deg` 向上，**顺时针**为正。用 `to top|right|bottom left` 方位词可完全绕开角度换算。
  - Tailwind v4：`bg-linear-to-br from-sky-500 to-indigo-600` / `bg-linear-45` / 插值空间 `bg-linear-to-r/oklch`
- **断点回填**：后一个断点位置小于前一个时按前一个渲染——饼图可写成 `conic-gradient(gold 0 75%, #09f 0)`，免计算。`45deg ≡ 12.5%`。
  - Tailwind：`bg-[conic-gradient(gold_0_75%,#09f_0)]`；内置 `bg-conic` / `bg-radial`
- **重复渐变**须显式起止（条纹标配）：`repeating-linear-gradient(45deg, #000 0 8px, #fff 0 16px)`。
- `radial-gradient` 默认 `ellipse farthest-corner at center`；单值半径写百分比（`circle 50%`）非法，百分比必须双值。
- 渐变是 `<image>`，**不可直接过渡**：用 `@property`（V-05）或双层 + `opacity`。
- 粗边框处渐变断开：设 `background-origin: border-box`。
## E-02 毛玻璃
- `background: rgb(255 255 255 / .2); backdrop-filter: blur(8px)`。**必须给半透明底色**，否则看起来"没效果"；背后必须有内容才能看到模糊。
- Tailwind：`bg-white/80 supports-[backdrop-filter]:bg-white/20 supports-[backdrop-filter]:backdrop-blur-md`（不支持时用更不透明的底色降级；支持时才变透明并模糊）
- 大面积 blur 有性能成本；不要叠多层。`backdrop-filter` 会创建层叠上下文（S-03）。
## E-03 filter：作用于自己
- 十个函数可累加：`blur() brightness() contrast() drop-shadow() grayscale() hue-rotate() invert() opacity() saturate() sepia()`。
- `drop-shadow()` 跟随**透明轮廓**（PNG/SVG 异形阴影）；`box-shadow` 永远是矩形（或圆角矩形）。`drop-shadow` 没有内阴影、不能多层 spread。
- Tailwind：`drop-shadow-lg` / `blur-sm` / `grayscale` / `brightness-95`

## E-04 混合模式与 isolation
- 五分工：`filter`（自己）· `backdrop-filter`（身后）· `mix-blend-mode`（与下方内容）· `background-blend-mode`（自身多层背景）· `isolation:isolate`（混合边界）。
- 混合模式"失灵"或"混到意想不到的地方"：祖先的层叠上下文成了边界；用 `isolate` 显式划定范围。
- 深色模式反色适配：`mix-blend-mode:difference`。
- Tailwind：`mix-blend-difference` / `bg-blend-multiply` / `isolate`
## E-05 mask vs clip-path
| | mask | clip-path |
|---|---|---|
| 问的是 | **哪里可见**（图像/渐变的透明度或亮度） | **什么形状**（basic-shape 路径） |
| 典型 | 图标换色、渐隐边缘、挖洞/环形（`mask-composite`） | 圆形/多边形裁切、形状展开动画 |
| 可过渡 | 渐变遮罩需 `@property` | `polygon` 前后**点数必须一致**才平滑，否则只跳变 |
- 遮罩白/不透明 = 显示；**JPG 遮罩没有透明通道**，需 `mask-mode: luminance`，别按 alpha。
- `clip-path: inset(0 round 10px)` 是 clip-path 里唯一带圆角的形状；`border-radius` 管不了 `border-image`，用它修圆角。
- **被剪/被遮的区域不可交互**（既是特性也是坑）。
- 形状展开动画：`clip-path: circle(0 at 50% 50%) → circle(200px at 50% 50%)` + `transition`。
- Tailwind：
  - `[clip-path:inset(0_round_10px)]` / `[clip-path:polygon(50%_0,100%_100%,0_100%)]`
  - mask：Tailwind v4.1+ 有内置 `mask-*` 工具类 ✔复核（发布说明）；通用/更低版本写法 `[mask:url(/i.svg)_center/contain_no-repeat]`
- 前缀（`-webkit-mask-*` 等）交给构建工具按浏览器目标补，不要手写。
## E-06 图标任意变色（mask 大法）
- 多色 SVG / iconfont 无法用 `color` 控制时，用背景色 + mask 做形状：
  ```html
  <i class="inline-block size-5 bg-current [mask:url(/icon.svg)_center/contain_no-repeat] hover:bg-primary"></i>
  ```
- 图标变成**单色**（遮罩只认形状）；复杂多色图标留给 SVG。
- 内联 SVG 优先：`fill-current` 即可跟随文字色（别在 SVG 里写死 `fill` 色，会丢继承变色）。

## E-07 渐变边框（替代 border-image 的现代写法）
- 圆角 + 渐变边框，用"双背景 + 透明边框"，不需要 `border-image` 与 `clip-path` 补圆角：
  ```html
  <div class="rounded-xl border-2 border-transparent
              [background:linear-gradient(var(--card),var(--card))_padding-box,linear-gradient(135deg,#f0a,#09f)_border-box]">
  ```
- `border-image`（九宫格切片）仍可用，注意：`border` 声明必须写在 `border-image` **之前**，否则缩写会重置它。

## E-08 多背景绘制简单图形
- 加号、减号、十字、刻度线免伪元素免图片：起止同色的渐变 = 纯色条，颜色跟随 `currentColor`。
  ```html
  <i class="inline-block size-4 text-primary
            bg-[linear-gradient(currentColor,currentColor)_center/100%_2px_no-repeat,linear-gradient(currentColor,currentColor)_center/2px_100%_no-repeat]"></i>
  ```
- 复杂图形交给 SVG。现代浏览器原生支持多背景，**不再需要** IE8 的伪元素 + 负 z-index 模拟。

## E-09 outline 的布局妙用
- outline 不占空间、可四周扩散、无法指定方向：
  - **镂空遮罩**（头像裁剪）：裁剪框 `outline: 256px solid rgb(0 0 0 / .5)` + 父级 `overflow:hidden`
  - **页脚色块填满屏幕**：`outline:9999px solid` + 配合 `clip-path` 裁掉不要的方向（旧写法用 `clip:rect(...)`）
- Tailwind：`outline-[256px] outline-black/50`（父 `overflow-hidden`）
- 去除默认焦点环规则见 T-14。## E-10 阴影与环
- `box-shadow` 的 spread（扩展半径）可做"外描边/双层边框"：`ring-2 ring-primary`（Tailwind 的 ring 即 box-shadow）。内阴影 `inset-shadow-*`（v4）。
- 对 `img` 用 inset 阴影做按压反馈**无效**（替换元素内容在阴影之上）；改用 `outline` + 负的 `outline-offset`。
- 阴影 hover 过渡的性能做法见 R-11。
- 圆角：`border-radius` 水平/垂直半径之和超过边长时会按比例缩放（重叠算法）；`rounded-full` 是 `9999px`。

## E-11 SVG 的 CSS 控制
- 颜色继承：`fill-current stroke-current`；不要在 SVG 属性里写死颜色。
- **描边动画万能公式**：`stroke-dasharray = L`（L=路径长度）+ `stroke-dashoffset: L → 0`。环形进度：`dasharray` 决定"一圈多长"，两者必须配套。
  - Tailwind：`[stroke-dasharray:300] [stroke-dashoffset:300] animate-draw`（`animate-draw` 在 `@theme` 里定义）
- 外描边：`paint-order: stroke fill`（描边画在填充之下，不会侵蚀字形）。Tailwind：`[paint-order:stroke_fill]`。✔复核：`paint-order` 自 2024-03 为 Baseline Newly available，在 HTML 文本上配合 `-webkit-text-stroke` 同样有效（Chrome 123+、Firefox 60+、Safari 11+）。
- 缩放时描边宽度稳定：`vector-effect: non-scaling-stroke`。Tailwind：`[vector-effect:non-scaling-stroke]`
- `stroke-miterlimit` 默认 4。
## E-12 沿路径运动
- `offset-path: path("M…")` + `offset-distance: 0 → 100%`；`offset-rotate:auto` 让元素朝向切线。`offset` 缩写兼容参差，**分开写子属性**。
- 取代 JS 计算路径坐标的动画。## E-13 三角形与箭头
- 微小箭头：`border` 三角仍可用（`width:0; border:10px solid; border-color:#f30 transparent transparent`；`border-color` 缺省跟随 `color`，hover 改 color 即可）。
- 更灵活：`clip-path: polygon(50% 100%, 0 0, 100% 0)` 或内联 SVG。Tailwind：`size-2 bg-current [clip-path:polygon(50%_100%,0_0,100%_0)]`
- 梯形：宽度不归零的 border 法。## E-14 文字描边
- `-webkit-text-stroke` 是**居中**描边，会向内侵蚀字形、粗描边难看。做粗描边/外描边：给同一元素加 `paint-order: stroke fill`（HTML 文本也支持 ✔复核，见 E-11），或 SVG `<text>`，或双层文字（描边层在下）。
- `text-shadow` 做不出内阴影或扩展，这些是 `box-shadow` 的能力。

## E-15 交互开关：pointer-events / inert / disabled
- `pointer-events:none` 只拦鼠标/触摸，**不拦键盘**（Tab 聚焦、Enter 仍可触发）；真禁用用 `disabled` 属性，或容器 `inert`。
- 镂空遮罩可点击：蒙层 `pointer-events-none`，镂空区 `pointer-events-auto`（子元素可复活）。
- Tailwind：`pointer-events-none` / `pointer-events-auto`；`disabled:` 变体。
## E-16 选区、光标、滚动条样式
- `::selection` → `selection:bg-primary/20`；`caret-color` → `caret-primary`；`accent-color`（原生勾选/单选着色）→ `accent-primary`。
- 滚动条标准属性见 R-09。

## E-17 opacity 的边界与圆角技巧
- `opacity` 作用于**整棵子树**且创建层叠上下文；只要背景半透明用 `bg-black/50`；文字半透明用 `text-black/60`。
- `background-clip:text` 渐变文字：`bg-linear-to-r from-… to-… bg-clip-text text-transparent`；注意 `-webkit-text-fill-color` 会盖过 `color`。
