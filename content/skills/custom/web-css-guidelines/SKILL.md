---
name: web-css-guidelines
description: >-
  CSS / Tailwind v4 写法与排障指导（已剔 IE；每条规则附 Tailwind v4 写法）。写、审、排障、
  重构 CSS 或 Tailwind 工具类时用——布局/居中/宽高、flex/grid、sticky、z-index、显隐过渡、
  行高/截断、变量与深色、响应式/clamp、毛玻璃/mask/渐变、滚动性能、样式不生效，即使没有明说。
  Not for 类名与标识符命名（→ web-code-style）。
when_to_use: >-
  css, tailwind, 布局, 垂直居中, line-height, vertical-align, 基线, 图片底部间隙,
  margin 合并, BFC, 浮动, 清除浮动, z-index, 层叠上下文, flex, grid, 绝对定位, sticky,
  隐藏元素, 渐变, 滤镜, clip-path, mask, CSS 变量, 深色模式, 响应式, clamp, 安全区,
  滚动穿透, 样式不生效, 毛玻璃
user-invocable: true
metadata:
  author: rockcookies
  version: 2.1.0
---

**范围：** CSS 布局、层叠、文本、变量主题、响应式性能与视觉效果的可执行规则；默认 Tailwind v4。仓内 `AGENTS.md`、本地约定与相邻代码优先。类名命名见 `web-code-style`。

规则标记：`[补]` = 基线外补充；`[验]` = 使用前用 MDN / caniuse 复核；`✔复核` = 已于 2026-11-05 核对（见 `references/modernization.md` 文末）。

## 1. 工作方式

1. **先判断场景，只读对应的 reference**（见第 3 节），不要一次全读。
2. **默认输出 Tailwind v4 工具类**。工具类表达不了的（keyframes、`@property`、`@supports`、`mask-composite`）写原生 CSS，放进 `@layer components` 或 `@utility`。项目若是原生 CSS，用每条规则里的 CSS 写法。
3. **排查「不生效 / 表现怪」时先读 `references/debugging.md`**，定位根因再改。不要靠 `!important`、加大 z-index、补 `w-full` 碰运气。
4. **兼容性问题不手写 hack**。基线就是 Tailwind v4 的浏览器基线；要更低，在构建期降级。详见 `references/modernization.md`。

## 2. 六个母题（遇到费解表现时先问这些）

- **流优先**：块级元素默认铺满、自适应。一旦写死宽度，流动性就没了。布局第一准则是**无宽度、无图片、无浮动**（「三无」）。
- **先找结界再谈数值**：z-index 压不住、混合模式失灵、fixed 跑偏，十有八九是某个祖先创建了层叠上下文或包含块。
- **幽灵空白节点（strut）**：行内内容周围的怪异间隙、容器高度比预期多几像素，先假设每个行框首部有个看不见的 0 宽字符。
- **按类型理解新属性**：属性值 = `<数据类型>` 的组合。支持 `<image>` 就同时支持 url、渐变、`image-set()`；学一次到处生效。
- **渐进增强，不打补丁**：新语法写在旧语法之后，用「解析失败整条忽略」分流；复杂条件用 `@supports`。
- **动画只碰合成属性**：只动 `transform` / `opacity`；不动 `margin`、`top/left`、`width`，也不直接动 `box-shadow`。

## 3. 场景 → 读哪个文件

| 你在做什么 | 读 |
|---|---|
| 宽高、居中、定位、flex/grid、sticky、清浮动、等高、margin | `references/layout-sizing.md` |
| z-index、弹层、模态、显示/隐藏、展开收起、过渡 | `references/stacking-hiding.md` |
| line-height、对齐、图标与文字、截断/换行、下划线、焦点样式 | `references/inline-text.md` |
| CSS 变量、主题、深色模式、`@theme`、`@property` | `references/variables-theming.md` |
| 响应式、clamp、视口单位、安全区、滚动、性能 | `references/responsive-performance.md` |
| 渐变、毛玻璃、mask、clip-path、滤镜、SVG、阴影 | `references/visual-effects.md` |
| 样式「不生效/怪异」的排查 | `references/debugging.md` |
| Tailwind v4 的写法约定、概念→工具类速查、与 antd 共存 | `references/tailwind-v4.md` |
| 看到旧写法想确认该不该用、该换成什么 | `references/modernization.md` |

## 4. 核心规则速查

详细解释、反例和例外在对应 reference 里，ID 可直接检索。本表是缓存；改规则先改 reference，再同步本表。

| ID | 规则 | Tailwind v4 |
|---|---|---|
| L-01 | 块级元素不写宽度，靠流铺满；要限宽用 `max-width` | 省略 `w-*`；`max-w-prose` |
| L-03 | flex/grid 子项内容溢出：补 `min-width:0` | `min-w-0` |
| L-04 | 居中：先 grid/flex；绝对定位用 `inset-0 + m-auto + fit-content`；不占用 `transform` | `grid place-items-center` / `absolute inset-0 m-auto size-fit` |
| L-05 | **无依赖绝对定位**（不写方位值，原地悬浮）；覆盖用对立方位/`inset-0`，不用 `width/height:100%`；`relative` 只挂最小容器 | `absolute -mt-1.5 ml-0.5` / `absolute inset-0` |
| L-07 | `flex:1` ≡ `1 1 0%`（basis 不是 auto）；防挤压用 `flex:none` | `flex-1` / `flex-none` / `shrink-0` |
| L-08 | 一维用 flex，二维、列数不定、末行对齐用 grid；间距用 `gap` | `flex gap-4` / `grid gap-4` |
| L-09 | 响应式卡片：`repeat(auto-fit, minmax(min,1fr))`；`fr` 只能当 `minmax` 第二参 | `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` |
| L-10 | sticky 不动，查三件事：祖先 overflow、父容器等高、是否同容器 | `sticky top-0`；祖先 `overflow-clip` |
| L-11 | 清浮动/阻断 margin 合并/自适应栏用 `flow-root`；float 只用于文字环绕 | `flow-root` |
| L-13 | 整屏高度用 `dvh/svh`，不用 `100vh`；`height:100%` 需要高度链，否则换 flex/grid | `min-h-dvh` |
| S-03 | z-index 无效先找**结界**（层叠上下文）；主动创建用 `isolation:isolate` | `isolate` |
| S-04 | 页面主体 z-index ≤ 2；浮层用统一层级变量，不搞 999 军备竞赛 | `z-(--z-modal)` / 自定义 `z-modal` |
| S-07 | 模态/浮层优先用 `<dialog>`、Popover（进 top layer，不吃 z-index） | `backdrop:bg-black/50` / `open:` |
| S-09 | 隐藏要选语义：不占位 `hidden`、占位 `invisible`、读屏可达 `sr-only`、可点 `opacity-0` | 见 stacking-hiding |
| S-10 | 展开收起：`grid-template-rows: 0fr → 1fr`，不用魔法数 `max-height` | `grid grid-rows-[0fr] data-open:grid-rows-[1fr]` |
| T-01 | 图片/图标下方多几像素 → **strut**；块状化最干净 | `block`（Preflight 已对 img/svg 等设置） |
| T-02 | 全局行高只用数值（不用 `%` / `em`） | `leading-normal` / `leading-relaxed` |
| T-06 | 单行省略三件套缺一不可；多行用 line-clamp | `truncate` / `line-clamp-3` |
| T-14 | 永不全局去掉 outline；去掉就必须补**可见的 focus 样式** | `focus-visible:outline-2 focus-visible:outline-offset-2` |
| V-01 | 要生成工具类的 token 放 `@theme`；运行时变量放 `:root` | `@theme { --color-brand: … }` |
| V-02 | `var()` 的 fallback 只救「一定无效」；不要 `var(--n)px` 拼单位 | `w-[calc(var(--n)*1px)]` |
| V-05 | 变量要过渡/动画，必须 `@property` 注册类型 | 原生 CSS；`[transition:--c_.3s]` |
| V-06 | 深色模式：变量 + `dark:` 变体，不为每个元素手写两套 | `@custom-variant dark (…)` |
| R-02 | 流式字号/宽度用 `clamp(MIN, 基准 + 斜率·vw, MAX)`；不用全站纯 vw | `text-[clamp(1rem,.8rem+1vw,1.5rem)]` |
| R-04 | 安全区：`viewport-fit=cover` + `env(safe-area-inset-*)` | `pb-[max(1rem,env(safe-area-inset-bottom))]` |
| R-09 | 弹层滚动穿透 `overscroll-behavior: contain`；锚点留白 `scroll-margin` | `overscroll-contain` / `scroll-mt-20` |
| R-10 | 长列表 `content-visibility:auto` 必配 `contain-intrinsic-size` | 自定义 `content-auto` |
| R-12 | 过渡写明属性，不写 `transition-all`；v4 的位移/缩放是独立属性，别只写 `transform`；负延时做交错 | `transition-[opacity,translate,scale]` / `transition-transform` |
| E-01 | CSS 渐变 0deg = 向上、顺时针为正；用 `to 方位` 绕开角度直觉 | `bg-linear-to-br` / `bg-linear-45` |
| E-02 | 毛玻璃 = 半透明底色 + `backdrop-filter`，缺底色看不出效果 | `bg-white/20 backdrop-blur-md` |
| E-05 | mask 决定「哪里可见」，clip-path 决定「什么形状」；被裁区域不可交互 | `[clip-path:inset(0_round_10px)]` |
| E-15 | `pointer-events:none` 不拦键盘；真禁用用 `disabled` / `inert` | `pointer-events-none` |

## 5. 永远不要写

- `*{ outline:0 }` / 不补替代样式的 `outline-none` → 去掉时必须补可见 focus（T-14）
- `z-index: 999999`、给 absolute 元素一上来就 z-index 999 → 用统一层级变量 / top layer（S-04/S-07）
- 给容器随手加 `transform` / `opacity:.99` / `will-change` → 避免无意创建**结界**
- 块级元素上 `width:100%` + padding/margin 凑宽度 → **流优先**，删死宽度（L-01）
- `transition: all`、对 `display` 指望老式 transition → 写明属性；离散过渡用 `allow-discrete`（R-12/S-11）
- 用 `100vh` 做移动端整屏高度 → `dvh` / `svh`（L-13）
- `html{font-size:62.5%}` 或 100px 根字号 → 保持 16px（T-11）
- 全局 `word-break: break-all` → 按语言选换行策略（T-07）
- `margin` / `top` / `left` 做动画 → 只碰 `transform` / `opacity`
- `-9999em` 缩进藏文字 → `sr-only`（T-05）；手写 `-webkit-` / `-moz-` / `-ms-` 前缀 → 交给构建工具
- 把重要文本放进 `content` → 放进真实 DOM（可选中、读屏可达）
- 任何 IE 时代 hack：`*zoom`、`_height`、`\9`、`filter:Alpha()`、`progid:` → 见 `references/modernization.md`

## 6. 写完自查（交付前过一遍）

1. 有没有给块级元素写死宽度？能不能删？
2. 居中/覆盖有没有占用 `transform`？
3. 每个 `z-*` 是否来自统一层级？有没有未设防的层叠上下文创建者？
4. 隐藏元素：读屏/键盘/占位/点击四个维度是否符合预期？
5. 文字：行高是数值吗？截断/换行三件套齐了吗？flex 子项文本需要 `min-w-0` 吗？
6. 交互：focus 样式可见吗？`hover:` 动效在触屏上是否无害？
7. 动画：只动 transform/opacity？是否尊重 `prefers-reduced-motion`？
8. 颜色/间距是否走 token（`@theme` 或语义变量），而不是散落的魔法值？
9. 用到 `[验]` 标记的新特性时，是否加了 `@supports` 或有无降级也可接受？
10. 有没有残留旧写法？对照 `references/modernization.md`。

## 7. 基线与兼容性

- 默认基线 = Tailwind v4：Safari 16.4+、Chrome 111+、Firefox 128+。需要更低时，**不要手写 hack**：降级工具链，或评估是否改用 Tailwind 3.4。
- 旧时代 / 过时写法的替换表与 2026-11 复核状态见 `references/modernization.md`。
- 任何 `[验]` 标记的结论，在写进生产代码前复核一次。

## 8. 边界

- 不覆盖：选择器细节、JS 动画库、具体组件库 API。
- 与组件库（如 antd）共存见 `references/tailwind-v4.md`。
