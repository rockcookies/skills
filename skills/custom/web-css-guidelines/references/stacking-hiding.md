# 层叠、浮层、显示与隐藏（S 系列）

**完成：** 当前任务命中的 S-ID 已对照并落到代码；不要通读未命中章节。母题：**结界**（层叠上下文）先于数值。

目录：层叠七阶 S-01 · 黄金准则 S-02 · 层叠上下文 S-03 · z-index 管理 S-04 · absolute 与负值 S-05/S-06 · top layer S-07 · 滚动穿透与锁定 S-08 · 隐藏矩阵 S-09 · 展开收起 S-10 · 离散过渡 S-11 · 延时与测量 S-12

## S-01 层叠七阶图（同一个层叠上下文内，从底到顶）
1. 层叠上下文元素的背景/边框
2. `z-index` 负值
3. 普通 block 盒子
4. float 盒子
5. **inline / inline-block**（文字和图片在这一层，所以会盖住 float 和 block 的背景）
6. `z-index:auto` 或 `0` 的定位元素
7. `z-index` 正值

## S-02 两条黄金准则
- **谁大谁上**：比较层叠水平（上面的阶梯 + z-index 数值）。
- **后来居上**：层叠水平相同，DOM 后出现的在上。
- 比较永远发生在**同一个层叠上下文内部**；跨上下文时只比较两个上下文各自的祖先。
## S-03 z-index 无效？先找层叠上下文（"结界"）
- **核心区别**：`z-index:auto` 不创建上下文，`z-index:0`（定位元素上）创建。90% 的 z-index 诡异行为来自这一点。
- **常见的创建者**：
  - 常见触发条件：定位元素 + 非 auto 的 z-index、`opacity < 1`、`transform` ≠ none、`filter`、`will-change`（指向会创建上下文的属性）。
  - 通用补充 `[补]`：`isolation:isolate`、`backdrop-filter`、`mix-blend-mode` ≠ normal、`mask`/`clip-path`、`contain:layout|paint`、`position:fixed|sticky`（总是创建）、`container-type`、`view-transition-name`；以及独立的 `translate`/`scale`/`rotate` 属性。
- **排查**：从目标元素沿祖先链向上逐个检查上述属性；找到的第一个"结界"就是 z-index 的天花板，里面的数值再大也出不去。
- **主动创建（想把层叠隔离在组件内部）**：用 `isolation:isolate`，没有任何副作用。Tailwind：`isolate`
- **不要**：为"微调"随手给容器加 `transform: scale(1)`、`opacity:.99`、`will-change`——它们无意创建结界，封死所有子孙。
## S-04 z-index 管理（"不犯二准则"）
- 页面主体内容的 z-index **不超过 2**（`z-0`~`z-2`，够用于局部覆盖）。
- 浮层（下拉、提示、抽屉、模态）使用**统一的层级变量**，集中定义，禁止 9 → 99 → 999999 的军备竞赛。
- 定位元素 `z-index:auto` 本来就在普通流之上，不需要上来就 999。
- 示例（原生 CSS + Tailwind v4）：
  ```css
  :root { --z-sticky: 10; --z-dropdown: 20; --z-drawer: 30; --z-modal: 40; --z-toast: 50; }
  @utility z-modal { z-index: var(--z-modal); }   /* 或直接 class="z-(--z-modal)" */
  ```
- 与组件库（如 antd）共存：它的弹层 z-index 有自己的基准（antd token `zIndexPopupBase` 默认 1000、`zIndexBase` 默认 0 ✔复核：antd 5 与 6.3.6 的 seed token 定义一致）。自己的浮层必须明确决定在它之上还是之下，并用同一套变量。
## S-05 absolute 与 z-index
- absolute 一来就 `z-index:999` 是埋雷：定位元素 `auto` 已经是 0 级、天然高于普通流内容。
- 不要"relative + top/left + z-index 三件套"当作定位模板（见 layout L-05）。

## S-06 负 z-index = 垫底
- 负 z-index 元素停在**最近层叠上下文的背景之上、普通内容之下**；它藏不到页面背后。负值"隐不掉"，先找结界。
- 用法：伪元素垫底做装饰/多层背景，父级必须是层叠上下文，否则会沉到更远的祖先背景之下。Tailwind：父 `isolate`，子 `-z-10`。

## S-07 用 top layer，不和 z-index 打架 `[补]`
- `<dialog>.showModal()` 与 Popover API（`popover` 属性）把元素放进浏览器的 **top layer**，不受任何祖先 z-index / overflow / transform 影响，同时自带 Esc 关闭、焦点管理和 `::backdrop`。
- Tailwind v4：`backdrop:bg-black/50`、`open:`（同时匹配 `[open]` 与 `:popover-open`）✔复核。Popover API 于 2025-01 进入 Baseline Newly available，`<dialog>` 为 Widely ✔复核（二手来源，核对日期 2026-09-10）。
- 定位到触发元素旁（下拉、提示）：CSS Anchor Positioning。✔复核：核心部分（`anchor-name` / `position-anchor` / `position-area` / `anchor()`）自 2026-01 起 Baseline Newly available（Chrome/Edge 125、Safari 26、Firefox 147）；但 web-features 仍把整组标为 Limited，因为 `position-visibility`、`anchor-size()`、"跟随锚点 transform"等子特性尚未三家齐备。已知差异：Firefox 暂不能过渡锚定后的 inset；`position-anchor` 初始值在 Chrome/Firefox 151、Safari 27 之前不一致，务必显式设置。用法：加 `@supports (anchor-name: --a)` 并保留可用的降级定位。
- 新项目优先 `<dialog>` / Popover；仅在需要兼容既有 DOM 结构时才用 z-index 层级方案（S-04）。

## S-08 滚动穿透与背景锁定
- 弹层/抽屉内部滚动到边缘带动页面滚动 → 弹层滚动容器 `overscroll-behavior:contain`。Tailwind：`overscroll-contain`（旧浏览器忽略即回退，零风险）。
- 弹窗出现时锁背景：优先用 `<dialog>` modal（浏览器处理）；自己锁时给根元素 `overflow:hidden`，并用 `scrollbar-gutter:stable` 防止滚动条消失造成的横向抖动。`[补]`
  - Tailwind：`<html class="[scrollbar-gutter:stable]">`；锁定态 `overflow-hidden`
- 不再硬编码 `border-right:17px solid transparent` 补偿（Windows 滚动条宽度不是普适常量）。
- 页面加载时水平晃动：就是滚动条出现改变了可用宽度；同样用 `scrollbar-gutter:stable` 解决。

## S-09 隐藏是光谱，不是开关
隐藏方案的维度：渲染、占空间、可点击、键盘/读屏可达、资源加载、动画能力。按需求选：

| 需求 | 方案 | Tailwind |
|---|---|---|
| 不渲染、无请求（模板） | `<template>` | `<template>` |
| 干净隐藏：不占位、不可点、读屏不可达 | `display:none` | `hidden` |
| 保留占位、不可点、读屏不可达 | `visibility:hidden` | `invisible` |
| 视觉隐藏，但读屏 / 键盘可达 | 视觉隐藏（clip + 1px） | `sr-only`（获焦显示：`sr-only focus:not-sr-only`） |
| 视觉不可见，但仍可点击/可选 | `opacity:0` | `opacity-0` |
| 不占位 + 要淡入淡出 | `visibility` + 绝对定位，或 S-11 | `invisible absolute` |
| 需要先测量尺寸（clientWidth/getBoundingClientRect） | `position:absolute; visibility:hidden`（`display:none` 全为 0） | `invisible absolute` |
| 暂不可交互但保留 DOM | `inert` 属性 `[补]` | `<div inert>` |

- `visibility:hidden` 与 `display:none` **不只差占不占空间**：继承可逆性（子元素 `visibility:visible` 可单独复活）、计数器（hidden 仍参与计数）、transition、可测量性、读屏行为都不同。
- `display:none` 的资源加载是**未定义行为**：`<img>` 一律照常请求；背景图在不同浏览器表现不一。不要依赖它延迟加载，用 `loading="lazy"` 或 `content-visibility`。
- Preflight 已处理 `[hidden]` 属性，不需要自己补兼容。
- 隐藏文字（logo 等）：优先真实 `<img alt>` / 内联 SVG；若必须背景图，`sr-only` 藏文字或 `-indent-30 overflow-hidden whitespace-nowrap`（定长，不用 `-9999em` / `100%`）。
## S-10 展开 / 收起任意高度
- 现代做法 `[补]`：用 grid 轨道在 `0fr` ↔ `1fr` 之间过渡，不需要知道高度，也没有 `max-height` 魔法数的"收起延迟"。
  ```html
  <div class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 data-open:grid-rows-[1fr]" data-open>
    <div class="min-h-0 overflow-hidden"> …内容… </div>
  </div>
  ```
- `max-height:0 → 安全值` 是老办法：魔法数偏大时收起会有可见延迟；仅在需要兼容时保留。
- `interpolate-size:allow-keywords` / `calc-size()` 可直接过渡到 `height:auto`，但仅 Chrome/Edge 129+ 支持，Firefox 与 Safari 未支持 ✔复核（Chrome 官方文档，与 2026-09 的第三方兼容性核对一致）；不要作为唯一方案，可作渐进增强：`@supports (interpolate-size: allow-keywords) { :root { interpolate-size: allow-keywords } }`。
- 原生披露组件首选 `<details>` / `<summary>`（`::details-content` 于 2025 年底进入 Newly available ✔复核，来源为二手汇总）。

## S-11 显隐 + 过渡（`display` 参与动画）`[补]`
- `display:none` ↔ 显示用传统 transition 不生效。现代解法：`transition-behavior: allow-discrete` + `@starting-style`（入场起始态）。Baseline Newly available（2024-08 起主流浏览器均支持）。
  ```css
  .panel { transition: opacity .2s, display .2s allow-discrete; }
  .panel.hidden { opacity: 0; }
  @starting-style { .panel { opacity: 0; } }
  ```
- Tailwind v4：`transition-discrete`、`starting:` 变体、`transition-[opacity,display]`
  ```html
  <div class="transition-[opacity,display] duration-200 transition-discrete starting:opacity-0 data-closed:hidden data-closed:opacity-0">
  ```
- 兼容性 ✔复核：`@starting-style` 与 `transition-behavior: allow-discrete` 于 2024-08 进入 Baseline Newly available（Chrome 117、Safari 17.5、Firefox 129）；更低版本回退到 `visibility`/`opacity` 过渡。Tailwind v4 的 `starting:` 变体与 `transition-discrete` 已核对存在。

## S-12 hover 延时显示（防误触）与可测量隐藏
- hover 延时出现、移出立即消失：把 `transition` 写在 **hover 态**，则只影响"进入"方向。
  ```css
  .list { visibility: hidden; }
  td:hover .list { visibility: visible; transition: visibility 0s .2s; }
  ```
  Tailwind：`invisible group-hover:visible group-hover:transition-[visibility] group-hover:duration-0 group-hover:delay-200`
- 过渡 `visibility` 可行；`display` 不在传统 transition 列表里（见 S-11 例外）。
- 原理一致：显隐动画要用能过渡的属性，而非 `display`。
