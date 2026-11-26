# 症状 → 根因 → 解法（D 系列：排查手册）

**完成：** 用症状表定位根因并落到对应 L/S/T/V/R/E 规则；不要靠 `!important`、加大 z-index、补 `w-full` 碰运气。

原则：**先假设是规则造成的，再动代码**。下表每行：症状 → 最常见根因 → 解法（CSS / Tailwind）→ 相关规则。

## 1. 排查链（按顺序问）

**margin 不生效**：内联非替换元素的垂直 margin → `table-cell/row` → 相邻 margin 合并被大值压住 → absolute 未设方位值 → 元素或容器尺寸写死。（L-16）

**z-index 压不住**：沿祖先链找层叠上下文（`z-index` 数值、`opacity<1`、`transform`、`filter`、`backdrop-filter`、`will-change`、`isolation`、`contain`、`mask`、`fixed/sticky`…）→ 它是天花板；找不到再比较层叠七阶与 DOM 顺序。（S-01~S-03）

**宽度行为怪**：先归类 width:auto 四表现（铺满 / 包裹 / min-content / max-content）→ 再看是否写死了宽度导致流动性丢失 → flex/grid 子项别忘 `min-w-0`。（L-01~L-03）

**sticky 不动**：祖先 `overflow` ≠ visible？父容器是否与它等高？多个 sticky 是否同容器？（L-10）

**transition 不生效**：属性在可过渡列表里吗（`visibility` 在、`display` 传统上不在）？起始值是 `auto` 类关键字吗（`height:auto` 不行）？渐变/未注册变量不可过渡？（S-10/S-11/V-05）

**浏览器表现不一**：先查规范——覆盖且违反 = bug；规范空白 = **未定义行为**，适配而不是"修复"（例：`display:none` 的背景图加载、`:active + preventDefault`、滚动容器 padding-bottom）。

## 2. 布局与尺寸

| 症状 | 根因 | 解法 |
|---|---|---|
| 容器高度比 `line-height` 多几像素 | 大小字号混排的基线位移 / strut | 字号设在块上；统一 `leading-*`（T-01） |
| 图片下方多约 5px | strut + line-height + baseline 三连 | `block`（Preflight 通常已设）/ `align-middle`（T-01） |
| inline-block 之间基线错位 | 空元素的基线 = margin 底边缘 | 改 flex `items-center`，或 `align-top`（T-04） |
| 改 padding 页面错位 | `width` 与 `padding` 共存 | 去掉 width（流）；替换元素才定宽（L-01） |
| `margin:auto` 居中失效 | 元素非 fill-available | `inset-0 m-auto size-fit` 或 grid（L-04） |
| `height:100%` 无效 | 父级无显式高度 | flex/grid 拉伸、`absolute inset-0`、`min-h-dvh`（L-13） |
| 页面加载时水平晃动 | 滚动条出现改变可用宽度 | `[scrollbar-gutter:stable]`（S-08） |
| 标题一换行"更多"掉到下一行 | float 的参考是**行框盒子** | 把链接放到标题文字**前面**，或用 flex `justify-between`（L-11） |
| 子项把 flex 父容器撑破 | 子项 `min-width:auto` | `min-w-0` + `truncate` / `break-words`（L-03） |
| `flex:1` 的子项不按内容宽 | basis 被补成 `0%` | 用 `flex-auto`，或显式 `basis-*`（L-07） |
| flex 末行没对齐 | flex 的死角 | 换 grid（L-08/L-09） |
| grid 列塌成最小宽 | `minmax(1fr,200px)` 写反 | `minmax(200px,1fr)`（L-09） |
| grid 卡片末行留白 / 不铺满 | 用了 `auto-fill` / `fr` 总和 < 1 | `auto-fit`；`fr` ≥ 1（L-09） |
| 父容器高度塌陷（float 子元素） | float 脱离流（标准行为） | 父级 `flow-root`，或改 flex/grid（L-11） |
| 父子 margin 穿透到父级外 | 父子 margin 合并 | 父 `flow-root` / 加 padding/border / 用 flex-grid（L-16） |
| 加 `width:100%` 后溢出 | 又加了 margin/padding | 去掉 width，靠流（L-01） |
| 滚动容器末端留白消失（尤其横向滚动的右侧） | 块轴末端 padding 现已一致；行内轴末端 padding 在引擎间仍可能不一致 | 最后一个子元素 `mb-*` / `me-*`（L-16）`[验]` |
| fixed 弹层跑偏/被裁 | 祖先有 transform/filter/contain | 用 `<dialog>`/Popover 或 portal 到 body（L-06/S-07） |
| 弹窗背景还能滚 | 滚动穿透 | `overscroll-contain` / `<dialog>`（S-08） |
| 整屏高度被移动端地址栏遮 | 用了 `100vh` | `min-h-dvh`（R-03） |

## 3. 层叠与显隐

| 症状 | 根因 | 解法 |
|---|---|---|
| 弹出层 z-index 很大仍被盖 | 父级层叠上下文封顶 | 把弹层挪出该祖先，或 `<dialog>`/Popover（S-03/S-07） |
| 子元素 z-index 无效 | 祖先创建了结界（`opacity`/`transform`/`will-change` 等） | 去掉无意的创建者，或在组件根 `isolate`（S-03） |
| `-z-10` 的伪元素消失 | 沉到了最近上下文背景之下 | 父级加 `isolate`（S-06） |
| 文字/图片盖住了浮动元素背景 | inline 层级高于 float/block | 层叠七阶：必要时给被盖元素定位 + z（S-01） |
| `display:none` 过渡不生效 | `display` 不可传统过渡 | `transition-discrete` + `starting:`，或 `visibility`/`opacity`（S-11） |
| 展开动画收起有"延迟" | `max-height` 魔法数偏大 | `grid-rows-[0fr→1fr]`（S-10） |
| hover 菜单路过就闪出 | 无延时 | hover 态加 `delay-200` + `visibility`（S-12） |
| 隐藏元素量不到尺寸（宽高为 0） | `display:none` | `invisible absolute`（S-09） |
| 隐藏后读屏/键盘还要可达 | 用了 `display:none` | `sr-only`（S-09） |
| 隐藏的 `<img>` 仍发请求 | `display:none` 不阻止 `<img>` | `loading="lazy"`、省略 `src`（S-09） |

## 4. 文本与内联

| 症状 | 根因 | 解法 |
|---|---|---|
| 标题一放大就重叠 | 行高写成 `%`/`em`，继承的是计算值 | 全局行高用数值（T-02） |
| 单行省略不生效 | 三件套缺一或在 flex 子项里无 `min-w-0` | `truncate` + `min-w-0`（T-06） |
| 长 URL/单词撑破布局 | 无断行 | `break-words`，flex 子项配 `min-w-0`（T-07） |
| 中文下划线粘字 | `text-decoration` 默认贴近文字 | `underline-offset-4 decoration-1`（T-09） |
| rem 布局整体偏大 | 改了根字号（62.5%）+ 最小字号限制 | 恢复 16px 根字号（T-11） |
| 图标与文字没对齐 | 基线体系不一致 | `inline-flex items-center gap-*`（T-04） |
| 文字光标却选不中 | `user-select:none` 没配 `cursor:default` | `select-none cursor-default`（T-15） |
| 键盘 Tab 看不到焦点 | 全局去掉了 outline | `focus-visible:outline-*`（T-14） |
| 自定义按钮丢了键盘行为 | 原生控件被 `display:none` | `peer` + `sr-only`（T-16） |

## 5. 变量与主题

| 症状 | 根因 | 解法 |
|---|---|---|
| `var(--c, red)` 没回落 | fallback 只救"一定无效" | 变量值本身要合法；或不要依赖回落（V-02） |
| `var(--n)px` 无效 | 拼出 `20 px` | `calc(var(--n)*1px)`（V-02） |
| 变量在子元素定义，父级读不到 | 作用域只向下 | 提到共同祖先（V-01） |
| 变量不能过渡/动画 | 未用 `@property` 注册 | 注册 `syntax`+`initial-value`（V-05） |
| `@property` 注册无效 | 漏写 `initial-value` | `syntax` 非 `*` 必填（V-05） |
| 渐变 hover 瞬间跳变 | 渐变不可过渡 | `@property` 或双层 + `opacity`（E-01/V-05） |
| Tailwind 里自定义 token 没有对应工具类 | 写进了 `:root` 而不是 `@theme` | 移到 `@theme`（V-01） |
| 改了 `tailwind.config.js` 没反应 | v4 默认不读 JS 配置 | 迁到 `@theme`，或 `@config` 显式引入（tailwind-v4.md） |
| 深色模式类名切换不生效 | 默认跟随系统 | `@custom-variant dark (…)`（V-06） |

## 6. 视觉效果

| 症状 | 根因 | 解法 |
|---|---|---|
| 毛玻璃"没效果" | 没有半透明底色 / 背后没内容 | `bg-white/20 backdrop-blur-md`（E-02） |
| 混合模式混到不该混的地方 | 祖先层叠上下文成边界 | `isolate` 划定范围（E-04） |
| mask 显示反了 | 白/不透明 = 显示；JPG 无 alpha | `mask-mode:luminance` 或换 PNG/SVG（E-05） |
| clip-path 动画只跳变 | 前后点数不一致 | 补齐点数（E-05） |
| 裁剪后的区域点不到 | clip/mask 隐藏区域交互一并失效 | 设计上避开，或用 `pointer-events` 重新分配（E-05） |
| 渐变角度和设计稿差 90° | 与 PS 角度方向不同 | `to 方位` 词（E-01） |
| 渐变在粗边框处断开 | `background-origin` | `background-origin:border-box`（E-01） |
| 圆角边框图片不圆 | `border-radius` 管不了 `border-image` | 改用双背景写法（E-07） |
| 文字描边侵蚀字形 | `-webkit-text-stroke` 居中描边 | `paint-order:stroke`（E-14） |
| 对 img 加 inset 阴影无效 | 替换元素内容在阴影之上 | `outline` + 负 `outline-offset`（E-10） |
| SVG 变不了色 | 写死了 `fill` | `fill-current`（E-11） |
| `env(safe-area-inset-*)` 恒为 0 | 缺 `viewport-fit=cover` | 补 meta（R-04） |
| `offset` 缩写整条失效 | 子属性兼容参差 | 分开写子属性（E-12） |

## 7. 性能与滚动

| 症状 | 根因 | 解法 |
|---|---|---|
| 加了 `will-change` 反而更卡 | 合成层爆炸 | 少量 + 用完移除（R-10） |
| 长列表首屏慢 | 渲染量大 | `content-visibility:auto` + `contain-intrinsic-size`（R-10） |
| `content-visibility` 后滚动条乱跳 | 缺 `contain-intrinsic-size` | 补估计高度（R-10） |
| hover 阴影掉帧 | 直接过渡 `box-shadow` | 双伪元素 + `opacity`（R-11） |
| 动画卡顿 | 动了 margin/top/left/width | 改 `transform`/`opacity`（R-13） |
| `transition-[transform]` 对 `translate-*` / `scale-*` 不生效 | v4 的位移/缩放/旋转是独立属性 | `transition-transform` 或 `transition-[translate,scale]`（R-12） |
| 触屏 hover"粘住" | hover 样式在触屏触发 | Tailwind v4 `hover:` 已限定 hover 设备；自写 CSS 用 `@media (hover:hover)`（R-05） |
| 锚点跳转被固定头部遮住 | 目标贴着视口顶 | `scroll-mt-*`（R-09） |
| 滚动时页面内容跳动 | 动态插入内容 / 图片无占位 | `overflow-anchor`、`aspect-*` + `width/height`（R-09/L-15） |

## 8. 与 Tailwind / 组件库相关

| 症状 | 根因 | 解法 |
|---|---|---|
| 工具类被组件库样式覆盖 | 层顺序/权重 | 声明 `@layer` 顺序，让组件库落在 `utilities` 之前（V-11/tailwind-v4.md） |
| 列表没有圆点/序号 | Preflight 清除了 `list-style` | `list-disc ps-5` / `list-decimal ps-5` |
| 边框"消失" | Preflight 把 `border` 置为 0；v4 默认 border 颜色是 `currentColor` | 显式 `border` + `border-*` 颜色 |
| 按钮光标不是手型 | v4 的 Preflight 令按钮 `cursor:default` | 需要时 `cursor-pointer`（T-15） |
| `outline-none` 后无焦点环 | v4 中它是 `outline-style:none` | 用 `outline-hidden` + `focus-visible:ring-*`（T-14） |
| 样式写在 CSS Module 里 `@apply` 报错 | 缺少主题引用 | `@reference "../app.css"`（V-12） |
