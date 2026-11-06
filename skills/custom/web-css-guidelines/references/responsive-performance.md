# 响应式、滚动与性能（R 系列）

**完成：** 当前任务命中的 R-ID 已对照并落到代码；不要通读未命中章节。母题：**渐进增强**；动画只碰合成属性。

目录：断点与容器 R-01 · 流式数值 R-02 · 视口单位 R-03 · 安全区 R-04 · 输入设备 R-05 · 用户偏好 R-06 · 媒体特性 R-07 · 图片 R-08 · 滚动体验 R-09 · 性能三件套 R-10 · 阴影动画 R-11 · transition 细则 R-12 · 动画原则 R-13 · 滚动驱动动画 R-14 · 兼容检测 R-15

## R-01 断点与容器查询
- Tailwind 是移动优先：无前缀 = 全尺寸，`sm:` 起向上叠加；向下用 `max-md:`。
- 断点按**内容**需要设，不按设备型号设。**组件**级响应优先用容器查询 `[补]`（Baseline 广泛可用）：
  ```html
  <div class="@container"><div class="grid gap-4 @md:grid-cols-2 @xl:grid-cols-4">…</div></div>
  ```
- 页面骨架级用视口断点；卡片/列表项用容器查询或 `auto-fit`（L-09），避免写一堆断点。
- `@media` 只需记三类媒体类型（`screen`/`print`/`all`）和主力特性：`width/height`、`prefers-color-scheme`、`prefers-reduced-motion`、`hover`/`pointer`、`resolution`。

## R-02 流式数值：`clamp()` 黄金公式
- 字号/间距/宽度在一个区间内随视口线性变化，两端封顶：
  `clamp(MIN, calc(基准 + 斜率 × (100vw − 设计宽) / 区间宽), MAX)`；常用写法 `clamp(1rem, 0.8rem + 1vw, 1.5rem)`。
- **不要**全站纯 `vw` 布局（大屏字大到失真）；`vw` 只作变化项，必须配 `clamp` 上下限，且带 `rem` 分量以尊重用户字号偏好。
- Tailwind：
  - 一次性：`text-[clamp(1rem,0.8rem+1vw,1.5rem)]`
  - 复用：`@theme { --text-fluid: clamp(1rem, 0.8rem + 1vw, 1.5rem); }` → `text-fluid`
- `min()` / `max()` / `calc()`：`calc(100%-2rem)` 运算符两侧必须有空格；`width: min(100% - 2rem, 70ch)` 可替代 `max-width + 外边距`。

## R-03 视口单位
- 整屏用 `dvh`/`svh`/`lvh`，不用 `100vh`。`dvh` 随移动端地址栏伸缩（可能引起重排），`svh` 稳定（最小视口），`lvh` 最大视口。
- Tailwind：`min-h-dvh` / `h-svh` / `h-lvh`
- 横向用 `%`/`fr`，少用 `vw`（滚动条会让 `100vw` 比可用宽度大，造成横向滚动）。

## R-04 安全区（刘海屏 / 底部横条）
- 页面 meta 必须包含 `viewport-fit=cover`：`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`——**缺了它 `env()` 恒为 0**。
- `env(safe-area-inset-bottom, 20px)`：名字区分大小写，第二参数为未支持设备兜底。
- Tailwind：`pb-[env(safe-area-inset-bottom)]` / `pb-[max(1rem,env(safe-area-inset-bottom))]`
## R-05 输入设备：hover 与 pointer
- 区分鼠标和触屏：`@media (hover:hover) and (pointer:fine)`。Tailwind v4 的 `hover:` 变体**默认已包在 `@media (hover:hover)` 里**，触屏上不会"粘住"；需要粗/细指针区分用 `pointer-coarse:` / `pointer-fine:`（另有 `any-pointer-*`），v4.1 起提供 ✔复核。
- 触屏消除点击延迟与双击缩放：`touch-action:manipulation`。Tailwind：`touch-manipulation`
- 关键交互目标尺寸：触屏下按钮/链接可点击区域至少约 44×44 CSS px；内联元素用垂直 padding 扩大点击区（L-16）。
- 不要依赖 `orientation` 判断横竖屏（软键盘弹出会翻转判定），关键布局用 `width` 断点。

## R-06 用户偏好：动效与对比度
- `prefers-reduced-motion`：为动画提供降级。Tailwind：`motion-safe:animate-…` / `motion-reduce:transition-none`；平滑滚动 `motion-safe:scroll-smooth`。
- `forced-colors` / `contrast-more` 变体用于高对比模式；`outline-hidden` 保留强制色模式下的焦点轮廓（见 T-14）。
- `prefers-color-scheme` 见 V-06。

## R-07 媒体特性写法
- 高分屏用标准 `resolution`：`@media (min-resolution: 2dppx)`，不再用 `-webkit-min-device-pixel-ratio`。Tailwind：`[@media(min-resolution:2dppx)]:…`
- 多倍图：`<img srcset sizes>` 优先；CSS 背景用 `image-set()` + `background-size`。
- `@supports` 复杂条件必须括号嵌套：`@supports (not (display:grid))` 而非直写 `and not`。

## R-08 图片与媒体
- 内容图：`<img srcset sizes width height loading="lazy" decoding="async">` + `max-w-full h-auto`；预留比例 `aspect-*`（L-15）。
- 裁切填充：`object-cover object-center`；`object-position` 控制焦点。
- 背景 sprite（`background-position` 拼图）已被 SVG sprite / 独立 SVG + `object-fit` 取代。
- 多张图 hover 切换用 `opacity` 过渡，而不是叠两层背景图。

## R-09 滚动体验四件套
| 目标 | 属性 | Tailwind |
|---|---|---|
| 顺 | `scroll-behavior:smooth`（配 reduced-motion 降级） | `motion-safe:scroll-smooth` |
| 稳 | `overscroll-behavior:contain` | `overscroll-contain` |
| 准 | Scroll Snap | `snap-x snap-mandatory` + 子项 `snap-start` |
| 不跳 | `overflow-anchor`（内容动态插入时稳住视口） | `[overflow-anchor:none]` / 默认 `auto` |
- 锚点跳转被固定头部遮住：`scroll-margin-top`。Tailwind：`scroll-mt-20`
- 滚动条：标准属性 `scrollbar-width` / `scrollbar-color`（Firefox 与新 Chromium），不要只写 `::-webkit-scrollbar`；防布局抖动 `scrollbar-gutter:stable`。Tailwind：`[scrollbar-width:thin] [scrollbar-color:var(--thumb)_transparent] [scrollbar-gutter:stable]`
## R-10 性能三件套
1. **`content-visibility:auto` + `contain-intrinsic-size`**（长列表/信息流首选，视口外跳过渲染）。**必须配** `contain-intrinsic-size`，否则视口外元素高度为 0，滚动条乱跳。
   ```css
   @utility content-auto { content-visibility: auto; contain-intrinsic-size: auto 500px; }
   ```
   ✔复核：`auto` 跳过渲染的内容仍留在 DOM 与无障碍树中，可被页内搜索命中、可聚焦、可选中（`hidden` 值则不可）；Chrome 官方仍建议实测键盘可达性——个别辅助技术配置下，视口外节点可能进不了 tab 序列。
2. **`contain: content`**：局部渲染隔离，局部重排频繁的组件用。Tailwind：`[contain:content]`
3. **`will-change`**：只对**即将动画的少量元素**声明，动画结束移除。**声明即生效对应属性的层叠上下文**（会影响 z-index，见 S-03）；全站撒 `will-change` 会合成层爆炸、反而更卡。Tailwind：`will-change-transform`（用完去掉）
- 渲染量大首选 content-visibility（零风险）；动画掉帧才考虑 will-change。
## R-11 阴影动画的性能做法
- 直接过渡 `box-shadow` 会触发样式重计算与大量绘制。复杂页面用**双伪元素各持一层阴影，只切换 `opacity`**：
  ```html
  <div class="relative rounded-lg shadow-sm
              after:absolute after:inset-0 after:-z-10 after:rounded-[inherit]
              after:opacity-0 after:shadow-xl after:transition-opacity
              hover:after:opacity-100"> … </div>
  ```
- `after:-z-10` 需要父级是层叠上下文（`isolate`）才不会沉到背景之下（S-06）。
## R-12 transition / animation 细则
- **写明属性**：不要 `transition-all`（`all` 是默认值，多写无益还拖累无关属性）。Tailwind 的 `transition` 工具类自带一组常用属性，够用即用；自己列属性时注意 v4 的位移/缩放/旋转是**独立属性**，要写 `transition-[opacity,translate,scale]` 或直接 `transition-transform`，只写 `transform` 过渡不到它们 ✔复核。
- **负延时做交错**：`animation-delay:-0.3s` 让每个元素直接进入动画中段；正延时的初始帧全部相同。Tailwind：`[animation-delay:-0.3s]`
- `display:none` 不能传统过渡 → S-11；`height:auto` 不能过渡 → S-10。
- 渐变不能过渡 → V-05。
- 缓动：`cubic-bezier()`、`steps()`；Tailwind 可在 `@theme` 里定义 `--ease-*` 后用 `ease-snappy`。
- 动画名与 `@keyframes` 放 `@theme { --animate-wiggle: wiggle 1s ease-in-out infinite; @keyframes wiggle { … } }`，自动生成 `animate-wiggle`。
## R-13 动画原则
- 只动 `transform`（`translate/scale/rotate`）与 `opacity`——它们不触发布局/绘制，可走合成层。
- **不要**用 `margin` / `top` / `left` / `width` / `height` 做位移或缩放动画。
- 居中不要占用 `transform`（见 L-04），把它留给动画。
- Tailwind v4 的 `translate-*`/`scale-*`/`rotate-*` 使用独立的 `translate`/`scale`/`rotate` 属性，可以与 `transform` 自定义关键帧叠加使用；但关键帧里写 `transform` 仍会覆盖基础位移，注意不要冲突。

## R-14 滚动驱动动画 `[补]`
- 进度条、滚动显现等可用 `animation-timeline: scroll()` / `view()`，替代 IntersectionObserver + 滚动监听。
- 状态：Chrome/Edge 115、Safari 26 已支持，Firefox 159 默认启用（2026-10，Baseline Newly available ✔复核：web.dev 2026-10-29）。生产使用时仍加 `@supports (animation-timeline: scroll())` 并让无动画时的内容完整可见。
- Tailwind：`[animation-timeline:view()] [animation-range:entry_0%_cover_30%]`，配 `@keyframes`。

## R-15 渐进增强与特性检测
- 五技巧（优先级）：**属性值语法差异分流**（旧声明在前、新语法在后，解析失败整条被忽略）> 伪类/伪元素区分 > `@supports` > JS `CSS.supports()`。
- 全局关键字四件套：`inherit` / `initial`（规范初始值）/ `unset`（配 `all`）/ `revert`（回到浏览器默认）。还原 `ol` 序号要 `revert`，`initial` 会丢。
- 不要再写 `\0` / `\9` / `*` 前缀 hack：现代问题是"支持与否"，不是渲染 bug。
