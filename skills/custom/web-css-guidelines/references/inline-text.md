# 内联、文本、焦点与交互样式（T 系列）

**完成：** 当前任务命中的 T-ID 已对照并落到代码；不要通读未命中章节。母题：**strut**（幽灵空白节点）。

目录：幽灵空白节点 T-01 · 行高 T-02 · 垂直居中 T-03 · 图标对齐 T-04 · 隐藏文字 T-05 · 截断 T-06 · 换行 T-07 · 对齐 T-08 · 下划线 T-09 · 字重字体 T-10 · 根字号 T-11 · 着重号与换行美化 T-12 · 外观细节 T-13 · 焦点 T-14 · cursor/选择 T-15 · label 代理 T-16

## T-01 幽灵空白节点（strut）
- **是什么**：每个行框盒子开头都有一个 0 宽的假想内联盒，继承所在块的字体和行高。图片底部空隙、容器高度比 `line-height` 多几像素、内联元素 `margin-top` 负值推不动，都源于它。内联盒模型四层：内容区域 → 内联盒子 → 行框盒子 → 包含盒子。
- **图片/图标下方多出几像素**：四选一：
  1. 块状化（首选，一锅端）。Tailwind：`block`
  2. 改对齐：`align-top` / `align-middle` / `align-bottom`
  3. 容器 `line-height:0`（或 `leading-[0]`）
  4. 容器 `font-size:0`（影响容器内其他文字，慎用）
- **Preflight 已处理**：Tailwind 的 Preflight 让 `img/svg/video/canvas/audio/iframe/embed/object` 默认 `display:block`。如果仍出现间隙，检查是不是 `inline` 的 `<a>` 包着图片、禁用了 Preflight，或被组件库 reset 覆盖。✔复核：Preflight 源码确为 `display:block; vertical-align:middle`，并另设 `img, video { max-width:100%; height:auto }`；具体以所用版本为准。
- **容器高度 > 行高几像素**：大小字号混排导致基线位移（常见：`font-size` 设在内部 span 上）。把字号设在块上，或统一 `leading-*`。
## T-02 行高：全局只用数值
- `line-height` 取**数值**（`1.5`），不用 `150%` / `1.5em`（后者继承的是计算后的长度，大标题会被压扁/重叠）。
- 中文正文建议 1.6~1.8；心算友好的 1.5 适合 UI。行高计算**向上舍入**（14px × 1.42858 才得 20px）。
- 表单控件不继承行高，需要时补 `line-height: inherit`。
- Tailwind：`leading-normal`（1.5）/ `leading-relaxed`（1.625）/ `leading-[1.75]`；`text-sm/6` 简写是**定长**。
  - 注意：`leading-6` 之类是固定尺寸，放在父级会被所有后代继承为同一长度；容器级统一行高用数值类（`leading-normal`）。
- `font` 缩写不写行高会把行高重置为 `normal`，避免用 `font:` 缩写。
## T-03 单行垂直居中
- 只需 `line-height`，**不要**再配 `height`；多行/不定行用 flex/grid。`vertical-align:middle` 只是近似居中。
- 按钮/徽章：`inline-flex items-center justify-center gap-2`；纯文字单行 `leading-10`。

## T-04 图标与文字对齐
- 最稳：用 flex 对齐。Tailwind：`inline-flex items-center gap-1.5`，图标 `size-[1em] shrink-0 fill-current`（跟随字号与文字色）。
- 内联图标与文字基线对齐：`inline-block align-middle`；`1ex` 高度的图标天然与 x-height 对齐（`h-[1ex]`）。
- 基线体系：基线 = 字母 x 的下边缘；`middle` = 基线上方 1/2 x-height；`ex` = 1 个 x-height。
- 微调内联位置：先 `vertical-align` 数值（正上负下），不行再 `relative`，**永远不要先用 margin**（strut 基线会限死内联元素）。
- **不要**给图标元素 `overflow:hidden` 藏字（会把基线改成底边缘，导致对不齐）。
## T-05 隐藏文字（logo、图标按钮的可访问文本）
- 首选：真实 `<img alt>` 或内联 SVG + 可访问名称；纯图标按钮用 `<span class="sr-only">关闭</span>`。
- 必须用背景图 + 保留 SEO 文字：`-indent-30 overflow-hidden whitespace-nowrap`（`text-indent:-120px` 定长）；次选 `text-[0]`。
- **不要**：`text-indent:-9999em`（滚屏卡顿、读屏不读）、`text-indent:100%`（依赖包含块宽度）。`text-indent` 只作用于第一行，`inline-block` 子元素需 `indent-0` 重置。
## T-06 截断
- **单行省略三件套缺一不可**：`overflow:hidden; text-overflow:ellipsis; white-space:nowrap`。Tailwind：`truncate`
- 在 flex/grid 子项里还要 `min-w-0`（见 L-03），否则父容器会被撑开。
- **多行省略**：`line-clamp`（现代浏览器已无需 `-webkit-` 前缀手写；不必再配 `overflow:hidden`）。Tailwind：`line-clamp-3`
## T-07 换行与空白
- `white-space` 三问：是否合并空白？是否保留换行？是否允许环绕？对应 `normal / nowrap / pre / pre-line / pre-wrap`。
- 代码块用 `whitespace-pre-wrap`（`pre` 会出横向滚动条，体验差）+ 需要时 `break-words`。
- 长单词/URL：`break-words`（`overflow-wrap:break-word`）；URL 内手动断点用 `<wbr>`；不要在 URL 里插软连字符（会改变语义）。
- Tailwind v4.1+ 新增 `wrap-break-word` / `wrap-anywhere` / `wrap-normal` ✔复核；flex 子项里的文本用 `wrap-anywhere`（词内断行也计入固有尺寸）比 `break-words` + `min-w-0` 更省事。
- **不要**全局 `word-break:break-all`（牺牲大多数阅读体验）；仅对动态内容的特定容器使用。
## T-08 对齐
- 中文正文两端对齐：`text-align:justify`（Tailwind：`text-justify`）；IE 私有的 `text-justify:inter-ideograph` 不再需要。
- `text-align` 对块级盒无效、只作用于其内联内容；float 之后也不用再写 `text-align` / `vertical-align`（float 已块状化）。

## T-09 下划线
- 现代做法：`text-decoration` + `text-underline-offset` + `text-decoration-thickness`。Tailwind：`underline decoration-1 underline-offset-4`
- 旧写法的 `border-bottom` 模拟下划线（避免中文下边缘粘连、可换 dashed/dotted）是旧浏览器时代的方案；在现代基线下仅在需要自定义虚线形态时使用。

## T-10 字重与字体
- `font-weight` 只认 100~900 整百（可变字体可取任意值）：`font-medium` / `font-[450]`（需字体支持）。`400 = normal`，`700 = bold`；`bolder/lighter` 按临界点跳变，别用。
- 可变字体（`wght/wdth/ital/slnt/opsz` 轴）一个文件精调字重：`font-variation-settings`，对没有多轴的普通字体无效。`font-variant-*` 与 `font-feature-settings` 依赖字体自带 OpenType 特性（中文字体尤其缺）。
- `font-synthesis:none` 可禁伪粗体/伪斜体。
## T-11 根字号
- 保持 16px，不设 `html{font-size:62.5%}`，也不用 100px 根字号方案；rem 全靠 Tailwind 间距刻度和 `text-*`。这样尊重用户字号偏好，且避免放大基线/间隙问题。
- 流式字号见 R-02（`clamp`）。

## T-12 中文排版细节
- 着重号：`text-emphasis`，中文用 `under right`。Tailwind：`[text-emphasis:filled_circle] [text-emphasis-position:under_right]`
- `text-wrap:balance`（短标题均衡换行）、`text-wrap:pretty`（避免孤字）`[补]`：`balance` 为 Newly available（2024-05：Chrome 114、Safari 17.5、Firefox 121）；`pretty` 仍是 **Limited**（Chrome 117+、Safari 26+，Firefox 未支持）✔复核，只作渐进增强，不支持时回退为正常换行。Tailwind：`text-balance` / `text-pretty`
- `tab-size`、`text-fill-color`（保护 color 不被 `-webkit-text-fill-color` 覆盖）等细节见规范。

## T-13 外观细节
- 输入框视觉大写（验证码、身份证 X）：`uppercase`，只改视觉不改值。
- `text-shadow` 不支持内阴影/扩展；`drop-shadow` 也没有内阴影，这些是 `box-shadow` 的能力。
- 单位：`ex`/`ch`/`em` 随字体变，做图标/间距联动时利用，不要和 `px` 混着手算。

## T-14 焦点样式（可访问性底线）
- **永远不要**全局 `*{outline:0}`。去掉默认 outline 必须同时提供可见的替代。
- 键盘焦点用 `:focus-visible`（鼠标点击不触发）。Tailwind v4：
  ```html
  <button class="outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-ring)">
  ```
  或直接：`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)`
- v4 注意：`outline-none` 现在是 `outline-style:none`（强制颜色模式下焦点也没了）；要"视觉上去掉但保留高对比模式"用 `outline-hidden`。
- outline 的布局妙用（镂空遮罩、四向扩散）见 visual-effects E-09。
## T-15 cursor 与文本选择
- cursor 是语义：可点击的**非原生按钮**才加 `cursor-pointer`（v4 的 Preflight 让 `button` 保持 `cursor:default`）；`user-select:none` 配 `cursor:default`，否则文字光标却选不中；可拖拽的标题栏配 `cursor-move`。
- 禁用态：常见建议用 `default` + 视觉禁用，不用 `not-allowed`（拖曳语义错位）；如团队设计系统已有约定，以其为准。
- 不要用 `wait` 光标表达"处理中"（死机感）；loading 用组件内动画；`progress` 仅用于"界面已渲染但 JS 未就绪"的窗口期，不能替代组件级 loading。
- 选区样式：`selection:bg-primary/20`；`user-select`：`select-none` / `select-all`。
## T-16 label 代理原生表单控件
- 原生 checkbox/radio/file 丑 → 控件视觉隐藏、保留可聚焦；用同级 `label` 画 UI，并补键盘焦点环。
  ```html
  <input id="a" type="checkbox" class="peer sr-only">
  <label for="a" class="rounded border px-3 py-1 peer-checked:bg-primary peer-focus-visible:outline-2">选项</label>
  ```
- 保留原生行为与可访问性；不要 `display:none` 控件（失去键盘可达性）。
