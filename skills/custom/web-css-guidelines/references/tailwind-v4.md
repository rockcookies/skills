# Tailwind v4 写法约定与速查

**完成：** 入口模板 / Preflight / 任意值 / 概念→工具类 / antd 共存中命中的节已对照；类名以项目实际 Tailwind 版本为准。

> 工具类名按 Tailwind v4（含 v4.1+）整理；`✔复核` = 已对照 4.1 发布说明或官方文档（2026-11-05）；`[验]` 需自行确认。

目录：基线 · CSS 入口模板 · Preflight 要点 · 任意值写法 · 概念 → 工具类速查 · v3→v4 与本技能相关的差异 · 何时写原生 CSS · 与 antd 共存

## 1. 基线与版本判断
- Tailwind v4 面向现代浏览器：**Safari 16.4+、Chrome 111+、Firefox 128+**（依赖 `@property`、`color-mix()`、cascade layers、`oklch()`）。低于此基线的环境渲染会不正确。
- 需要更低基线时：不要手写 hack。选项：① 提高最低浏览器要求；② 构建期降级（构建目标 / legacy 兼容方案）；③ 退回 Tailwind 3.4。**不要静默上线 v4。**

## 2. CSS 入口模板
```css
/* 使用 antd 时：层声明必须写在 import 之前（见第 8 节）
@layer theme, base, antd, components, utilities; */
@import "tailwindcss";

/* 手动切换深色（类名策略）；只跟随系统则省略 */
@custom-variant dark (&:where(.dark, .dark *));

/* 设计 token：会生成工具类 */
@theme {
  --color-brand-500: oklch(0.62 0.19 260);
  --font-display: "Inter", ui-sans-serif, sans-serif;
  --text-fluid: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --animate-wiggle: wiggle 1s ease-in-out infinite;
  @keyframes wiggle { 0%,100% { rotate: -3deg } 50% { rotate: 3deg } }
}

/* 运行时变量：不需要工具类 */
:root {
  --z-sticky: 10; --z-dropdown: 20; --z-drawer: 30; --z-modal: 40; --z-toast: 50;
  --background: oklch(1 0 0);  --foreground: oklch(0.2 0 0);  --primary: var(--color-brand-500);
}
.dark { --background: oklch(0.15 0 0); --foreground: oklch(0.98 0 0); }

/* 语义 token 暴露为工具类：bg-background text-foreground bg-primary … */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
}

/* 自定义工具类 */
@utility content-auto { content-visibility: auto; contain-intrinsic-size: auto 500px; }
@utility z-modal { z-index: var(--z-modal); }

@layer base { html { scrollbar-gutter: stable; } }
```
- 原则（V-01/V-07）：一个 token 一处定义；组件读语义变量，不读色阶。

## 3. Preflight 要点（影响 CSS 判断，以所用版本为准）
- 全局 `box-sizing:border-box`；`margin/padding` 清零；`border` 默认 `0 solid`，默认边框颜色为 `currentColor`（v4）。
- `img, svg, video, canvas, audio, iframe, embed, object` 为 `display:block`（所以图片底部 strut 间隙通常不出现，T-01）。
- 标题、列表、`button` 的外观被重置：列表要自己加 `list-disc` / `list-decimal` + `ps-*`；`button` 为 `cursor:default`（v4）。
- `[hidden]` 属性被处理为 `display:none`。
- 与组件库 reset 并存时先理顺层顺序（第 8 节）。

## 4. 任意值与任意属性
- 空格用 `_`；逗号保留：`grid-cols-[repeat(auto-fit,minmax(220px,1fr))]`、`bg-[linear-gradient(red,blue)_center/cover]`。
- 变量：`w-(--w)`、`bg-(--c)`、`z-(--z-modal)`（圆括号语法，替代 v3 的 `bg-[--c]`）。
- 任意属性：`[mask:url(/i.svg)_center/contain_no-repeat]`、`[clip-path:inset(0_round_10px)]`、`[scrollbar-gutter:stable]`。
- 带变体：`hover:[--c:#f30]`、`md:[writing-mode:vertical-rl]`。
- 重要性：后缀 `!`（`bg-red-500!`），不是 v3 的前缀。
- 同一属性的冲突：由**生成样式表中的顺序**决定，不是 class 属性里的先后。需要合并/覆盖用 `tailwind-merge` 类工具。

## 5. 概念 → 工具类速查

| 概念 / 需求 | 原生 CSS | Tailwind v4 |
|---|---|---|
| 块级铺满（默认） | `width:auto` | 默认；❌ `w-full` |
| 包裹性 / 最小 / 最大内容宽 | `fit-content` / `min-content` / `max-content` | `w-fit` / `w-min` / `w-max` |
| 外部尺寸"撑满可用空间" | `width:stretch`（无前缀仅 Chrome/Edge 138+ ✔复核） | 一般用默认块级或 `w-full`；不要依赖 `w-[stretch]` |
| 正方形/定比 | `aspect-ratio` | `size-10` / `aspect-video` / `aspect-4/3` |
| 水平居中块 | `margin-inline:auto` | `mx-auto` |
| 通用居中 | grid `place-items:center` | `grid place-items-center` |
| flex 居中 | `align-items;justify-content` | `flex items-center justify-center` |
| 绝对定位居中 | `inset:0; margin:auto; fit-content` | `absolute inset-0 m-auto size-fit` |
| 覆盖整个容器 | `inset:0` | `absolute inset-0` |
| 水平/垂直拉伸 | `inset-inline:0` / `inset-block:0` | `inset-x-0` / `inset-y-0` |
| 无依赖绝对定位 | `position:absolute`（无方位值） | `absolute` + `-mt-1 ml-1` |
| 黏性定位 | `position:sticky; top:0` | `sticky top-0` |
| 清浮动 / 新 BFC | `display:flow-root` | `flow-root` |
| 浮动环绕 | `float` + `shape-outside` | `float-left [shape-outside:circle(50%)]` |
| 一维布局 | flex | `flex flex-wrap gap-4 items-center justify-between` |
| flex 缩写 | `flex:1 / auto / initial / none` | `flex-1 / flex-auto / flex-initial / flex-none` |
| 防挤压 | `flex-shrink:0` | `shrink-0` |
| 可缩小文本子项 | `min-width:0` | `min-w-0` |
| 把兄弟推到另一端 | `margin-left:auto` | `ml-auto` |
| 二维布局 | grid | `grid grid-cols-12 gap-6` |
| 响应式卡片 | `repeat(auto-fit,minmax())` | `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` |
| 子网格对齐 | subgrid | `grid-cols-subgrid` / `grid-rows-subgrid` |
| 容器查询 | `@container` | `@container` + `@md:` `@max-md:` |
| 整屏高度 | `100dvh` | `min-h-dvh` / `h-svh` / `h-lvh` |
| 层叠上下文 | `isolation:isolate` | `isolate` |
| z-index | `z-index` | `z-10` / `-z-10` / `z-(--z-modal)` / `z-modal` |
| 显示/隐藏 | `display:none` / `visibility` | `hidden` / `invisible` / `visible` |
| 视觉隐藏（读屏可达） | clip + 1px | `sr-only` / `focus:not-sr-only` |
| 透明但可点 | `opacity:0` | `opacity-0` |
| 顶层弹层 | `<dialog>` / `popover` | `backdrop:bg-black/50` / `open:` |
| 离散过渡 | `allow-discrete` + `@starting-style` | `transition-discrete` + `starting:opacity-0` |
| 行高 | `line-height:1.5` | `leading-normal`（数值）/ `text-sm/6`（定长）|
| 垂直对齐 | `vertical-align` | `align-middle` / `align-top` / `align-[-0.125em]` |
| 单行省略 / 多行省略 | `text-overflow` / `line-clamp` | `truncate` / `line-clamp-3` |
| 换行 | `overflow-wrap` / `white-space` | `break-words` / `whitespace-pre-wrap` / `whitespace-nowrap` |
| 文本均衡 | `text-wrap:balance` | `text-balance` / `text-pretty` |
| 下划线 | `text-decoration` + `text-underline-offset` | `underline decoration-1 underline-offset-4` |
| 焦点环 | `:focus-visible` | `focus-visible:outline-2 focus-visible:outline-offset-2` / `outline-hidden` |
| 渐变 | `linear-gradient` | `bg-linear-to-br from-… to-…` / `bg-linear-45` / `bg-radial` / `bg-conic` |
| 毛玻璃 | `backdrop-filter` | `bg-white/20 backdrop-blur-md` |
| 滤镜 | `filter` | `blur-sm drop-shadow-lg grayscale brightness-95` |
| 混合 | `mix-blend-mode` | `mix-blend-difference` |
| 遮罩 / 裁剪 | `mask` / `clip-path` | `mask-*`（v4.1+ ✔复核）/ 任意属性 `[clip-path:…]` |
| 图片填充 | `object-fit` | `object-cover` / `object-contain` / `object-scale-down` |
| 滚动穿透 | `overscroll-behavior` | `overscroll-contain` |
| 平滑滚动 | `scroll-behavior` | `motion-safe:scroll-smooth` |
| Scroll Snap | `scroll-snap-*` | `snap-x snap-mandatory` / `snap-start` |
| 锚点留白 | `scroll-margin-top` | `scroll-mt-20` |
| 触屏点击 | `touch-action` | `touch-manipulation` |
| 性能提示 | `will-change` | `will-change-transform`（短命使用） |
| 逻辑属性 | `margin-inline-start` 等 | `ms-4 me-4 ps-4 pe-4 start-0 end-0 text-start` |
| RTL | `[dir=rtl]` | `rtl:` / `ltr:` |
| 子元素/状态 | `:has() / :checked / :focus-visible` | `has-[:checked]:` / `peer-checked:` / `focus-visible:` / `group-hover:` |
| 动效偏好 | `prefers-reduced-motion` | `motion-safe:` / `motion-reduce:` |
| 数据状态 | `[data-open]` | `data-open:` / `data-[state=open]:` |

## 6. v3 → v4 与本技能相关的差异
- 入口：`@tailwind base/components/utilities` → `@import "tailwindcss"`；配置：`tailwind.config.js` → CSS 里的 `@theme`（需要时用 `@config` 引入旧配置）；自定义工具类：`@layer utilities` → `@utility`。
- 重命名：`bg-gradient-to-*` → `bg-linear-to-*`；`outline-none` → `outline-hidden`（旧"透明轮廓"语义）；`flex-shrink-*` / `flex-grow-*` → `shrink-*` / `grow-*`；`bg-opacity-*` 等已移除，用 `bg-black/50`；`shadow-sm` → `shadow-xs`、`shadow` → `shadow-sm`；`ring` 默认宽度 3px → 1px。
- 行为：`hover:` 仅在支持 hover 的设备生效；默认边框颜色 `currentColor`；`button` 光标 `default`；叠加变体顺序为**从左到右**；`!` 重要性改为后缀；任意变量用圆括号语法。
- 位移/缩放/旋转使用独立 CSS 属性（`translate` / `scale` / `rotate`）：自己写 `transition-[…]` 要列 `translate`、`scale`，或用 `transition-transform`；用 `scale-none` / `rotate-none` / `translate-none` 重置 ✔复核（二手来源，建议在项目里实测一次）。
- v4 新变体：`starting:`、`not-*`、`in-*`、`nth-*`、`inert:`，`open:` 同时匹配 `:popover-open` ✔复核。
- v4.1+ 新增：`mask-*`、`text-shadow-*`、`wrap-break-word` / `wrap-anywhere` / `wrap-normal`、`pointer-fine` / `pointer-coarse`（及 `any-pointer-*`）、`user-valid` / `user-invalid` ✔复核（发布说明）。
- 迁移：`npx @tailwindcss/upgrade`（需要较新的 Node 版本，按官方文档）。

## 7. 何时写原生 CSS（而不是堆工具类）
- 写 `@keyframes`、`@property`、`@supports`、`@starting-style`、`mask-composite`、复杂多层渐变/背景：放 `@layer components` 或 `@utility`，给语义化类名。
- 需要在多处复用的**组合行为**（如 `content-auto`）：`@utility`。
- 重复的一整段工具类：先抽**组件**，再考虑 `@apply`。
- CSS Module / 独立样式文件里要用主题：`@reference "<入口 css>"`。

## 8. 与 antd 等组件库共存 ✔复核（antd 官方"样式兼容"文档，antd 5.x）
- 冲突来源：Preflight（重置）与组件库自己的 reset、CSS-in-JS 样式的优先级竞争；以及 z-index 基准（S-04）。
- 做法：用 `@layer` 明确顺序（V-11）——
  ```css
  @layer theme, base, antd, components, utilities;
  ```
  - **层声明放在 `@import 'tailwindcss'` 之前**（antd 官方给 Tailwind v4 的写法）。
  - antd 侧：`StyleProvider layer` 自 5.17.0 起支持；开启后子树必须包一层 `ConfigProvider`，否则图标样式不更新。
    ```tsx
    <StyleProvider layer><ConfigProvider><App /></ConfigProvider></StyleProvider>
    ```
  - 若启用 `zeroRuntime`（预构建的 `antd.css`），要把它放进同一层：`@import url(antd.css) layer(antd);`，否则权重反而高于动态注入的样式，降权失效。
  - `@layer` 需要较新的浏览器（antd 文档标注 Chrome 99+）；antd 5.x 面向最近两个版本的现代浏览器。
  - 使用 antd-x 时还要把 `antdx` 层排进去：`@layer theme, base, antd, antdx, components, utilities;`。
  - 以上依据 antd 5.x 文档；你实际用的版本（如 antd 6）以其"样式兼容"页为准。
- 工具类应能覆盖组件库样式：保证 `utilities` 层在组件库层之后；确实需要时再用 `!` 后缀，而不是提高选择器权重。
- 主题对齐：把组件库的主色/圆角 token 与 `@theme` 的语义变量指向同一个来源（V-07），避免两套换肤。
