# 布局与尺寸（L 系列）

**完成：** 当前任务命中的 L-ID 已对照并落到代码；不要通读未命中章节。母题：**流优先**、**三无**、**无依赖绝对定位**。

目录：流与宽度 L-01…L-03 · 居中 L-04 · 定位 L-05…L-06 · flex/grid L-07…L-09 · sticky L-10 · BFC/浮动 L-11 · 等高 L-12 · 高度 L-13 · box-sizing L-14 · 替换元素 L-15 · margin L-16 · 对齐列表 L-17 · 逻辑属性 L-18 · 文字环绕 L-19

> Preflight 前提：全局 `box-sizing:border-box`、清零 margin/padding、替换媒体 `display:block`。以项目实际 Preflight 为准。

## L-01 流优先：块级元素不写宽度
- **规则**：块级元素默认 `width:auto` 会铺满容器且 padding/margin/border 自动吸收。需要限宽用 `max-width`，需要定宽的是替换元素或明确的固定尺寸部件。
- **原因**：写死宽度 = 流动性终结；之后加 padding/margin 要手算，容器一变全盘重算（"砌砖头"）。`width:100%` 加 margin/padding 反而溢出（Preflight 的 border-box 只缓解 padding，不缓解 margin）。
- **CSS**：`.card{padding:1rem;margin-inline:1rem}`（不写 width）
- **Tailwind**：`p-4 mx-4`；限宽 `max-w-prose`；❌ `w-full p-4 mx-4`
## L-02 width:auto 的四种表现（判断宽度为什么"怪"）
| 表现 | 触发 | Tailwind |
|---|---|---|
| fill-available（铺满，外部尺寸） | 块级默认 | 默认 / `w-full` |
| shrink-to-fit（包裹性） | float、absolute、inline-block、flex 子项 | `w-fit` / `inline-block` / `absolute` |
| min-content（收缩到最小） | 容器宽度极小 | `w-min` |
| max-content（不换行，可能溢出） | `white-space:nowrap` | `w-max` / `whitespace-nowrap` |

判据：元素"无内容时宽度为 0"→ 内部尺寸（后三种）。

## L-03 flex / grid 子项溢出：`min-width:0`
- **规则**：flex/grid 子项含长文本、`pre`、表格或大图而撑破容器时，给该子项 `min-width:0`（或 `overflow:hidden`）。
- **原因**：子项的 `min-width` 默认是 `auto`（= 内容最小宽度），所以不会收缩到容器以内。`[补]`
- **Tailwind**：`min-w-0`；文本再配 `truncate` 或 `break-words`。纵向同理 `min-h-0`。文本子项也可用 `wrap-anywhere`（Tailwind v4.1+：在计算固有尺寸时就允许词内断行，通常能替代 `min-w-0`）✔复核。

## L-04 居中决策
| 场景 | 方案 | Tailwind |
|---|---|---|
| 块级水平居中 | 定宽/`fit-content` + `margin-inline:auto` | `mx-auto w-fit` / `max-w-3xl mx-auto` |
| 内容水平居中（内联级） | `text-align:center` | `text-center` |
| 通用水平垂直居中 | grid / flex | `grid place-items-center` / `flex items-center justify-center` |
| 绝对定位居中（尺寸不定） | `inset:0; margin:auto; width/height:fit-content` | `absolute inset-0 m-auto size-fit` |
| 绝对定位居中（定宽高） | `inset:0; margin:auto` + 宽高 | `absolute inset-0 m-auto w-50 h-25` |
| 模态弹窗 | `<dialog>` 默认居中（top layer） | `<dialog class="m-auto backdrop:bg-black/50">` `[补]` |
| 单行文字垂直居中 | 只需 `line-height`，不要再配 `height` | `leading-10` |

- **不要**：`top:50%; left:50%; translate(-50%,-50%)` 用于**会做 transform 动画**的元素（关键帧里的 `transform` 会与居中打架）。居中用 `inset+auto` 或 grid，把 transform 留给动画。
- **不要**：伪元素 + `inline-block` + `vertical-align:middle` 的老式弹框居中（见 modernization）。
- **说明**：`vertical-align:middle` 是"基线上 1/2 x-height"，只是近似居中；grid/flex 才是精确居中。
- `fit-content` 居中依赖浏览器支持；`@supports (height:fit-content)` 检测无效（Firefox 通过检测但不一定有效果），现代基线下直接用即可。

## L-05 绝对定位：无依赖 + 流体 + relative 最小化
- **无依赖定位**：`position:absolute` 不写 `top/left/right/bottom`，元素**停在原位**，只是不占流空间。角标、图标、小徽章只需 `absolute` + `margin` 微调；文字长度变化会自适应。免 relative、免 z-index。
  - Tailwind：`absolute -mt-1.5 ml-0.5`
- **流体开关**：对立方位同时设置（`left:0; right:0` / `top:0; bottom:0`）→ 元素拉伸到包含块 padding box，padding/margin/auto 全部可用。覆盖整个容器用它，**不要** `width/height:100%`（加 margin 就溢出）。
  - Tailwind：`absolute inset-0`；水平拉伸 `absolute inset-x-0`
- **relative 最小化影响**：能用无依赖定位就不用 `relative`；必须用时，把 `relative` 挂在**仅包住目标元素的最小容器**上，不要挂在整个模块容器上（会霸占所有子孙 absolute 的包含块）。
  - Tailwind：`<span class="relative inline-block">…<i class="absolute -top-1 -right-1"/></span>`
- absolute 与 float 同属"破坏流"家族（块状化、包裹性），absolute 更强势：二者共存时 float 失效；absolute 不需要再写 `display:inline-block`。
## L-06 fixed 与包含块
- `position:fixed` 的包含块默认是视口/根元素，`relative` 管不了它。
- **现代注意** `[补]`：祖先若有 `transform`/`filter`/`backdrop-filter`/`contain:layout|paint`/`will-change: transform`，`fixed` 会改以该祖先为包含块（并且该祖先也是层叠上下文）。弹层跑偏时先查祖先这几个属性；更稳的做法是把弹层放进 `<dialog>` / Popover（top layer）或 portal 到 `body`。
- 要"被限制的固定效果"：用 absolute 模拟，页面滚动交给内部 `overflow:auto` 容器。

## L-07 flex 缩写与单值
`flex` 缩写**不按默认值补全**：
| 写法 | 实际 | 用途 | Tailwind |
|---|---|---|---|
| `flex:1` | `1 1 0%` | 等分首选（忽略内容宽度） | `flex-1` |
| `flex:auto` | `1 1 auto` | 保内容宽度再分余量 | `flex-auto` |
| `flex:initial` | `0 1 auto` | 小部件，只缩不涨 | `flex-initial` |
| `flex:none` | `0 0 auto` | 固定尺寸、防挤压（免写 width） | `flex-none` |
| `flex:0` | `0 1 0%` | 收缩到最小内容宽 | `flex-[0]` |
| `flex:100px` | `1 1 100px` | 指定 basis | `flex-[1_1_100px]` / `basis-25 grow` |

心智模型：basis 分基础、grow 分富余、shrink 分不足。`flex-1` 的子项"不按内容宽"就是因为 basis 被补成 0%。

## L-08 flex 还是 grid
- **一维分配** → flex；**二维骨架、卡片网格、列数不定、末行要对齐** → grid（flex 的末行对齐是死角，别用负 margin 或占位元素硬凑）。
- 间距用 `gap`，不用负 margin / `space-*` / 子元素 margin 凑（也避免 margin 合并问题）。`[补]`
- `align-items:baseline` 是**基线**对齐，不是底边；底边对齐用 `flex-end`。
- 不要用 `order` 调整视觉顺序而指望 tab/读屏顺序也变（它们仍按 DOM）。
- Tailwind：`flex gap-4 items-center justify-between` / `grid grid-cols-12 gap-6`
## L-09 grid 轨道尺寸与响应式卡片
- 万能起手式：`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem`。`auto-fit` 折叠空轨道（子项少时铺满），`auto-fill` 保留空轨道（末行留白）；卡片列表用 `auto-fit`。
  - Tailwind：`grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4`
- `fr` 只能做 `minmax()` 的**第二个**参数（`minmax(1fr,200px)` 写反会整列失效）；`fr` 总和 < 1 时只拿对应比例，不会铺满。
- `auto` ≈ `minmax(min-content,max-content)`，受 `justify-content`/`min-width` 影响。
- 对齐命名：`justify` 水平、`align` 垂直 × `content`/`items`/`self`；`place-*` 是两者简写。
- 嵌套对齐用 subgrid `[补]`：`grid-cols-subgrid` / `grid-rows-subgrid`（Baseline 广泛可用）。
- 组件级响应式优先容器查询 `[补]`：`<div class="@container"><div class="grid @md:grid-cols-2">`。
## L-10 sticky 不生效的三问
1. 祖先有没有 `overflow` ≠ `visible`？（黏性只相对最近的滚动容器。）→ 把 `overflow-hidden` 换成 `overflow-clip`（不创建滚动容器）`[补]`，或去掉。
2. 父容器是否和 sticky 元素一样高？（黏性元素只能在父容器内活动，没空间就动不了。）
3. 多个 sticky 是否放在同一个容器？（同容器会叠在一起；**每段内容独立容器**才会依次推开，这是"层次滚动"的基础。）
- Tailwind：`sticky top-0`；有固定头部时锚点留白用 `scroll-mt-*`。
## L-11 BFC、清浮动、自适应栏
- **float 只用于文字环绕**。布局一律 flex/grid。高度塌陷是 float 的标准行为，想清除的是"影响"。
- 需要"清浮动 / 阻断父子 margin 合并 / 自适应栏避让"时，用 `display:flow-root`（创建 BFC，无副作用）`[补]`；`overflow:hidden` 会裁剪、`table-cell` 有副作用，不再作首选。
  - Tailwind：`flow-root`
- `clear:both` 只是"自身避让"，不是清除浮动；`clear:left/right` 无实用价值。
- 浮动元素的对齐参考是它所在的**行框盒子**（不是容器），"更多"链接跑到下一行就是这个原因：把它放到目标行内。
- 自适应两栏（一侧定宽）：现代写法 `grid grid-cols-[auto_1fr]` 或 `flex` + 内容侧 `flex-1 min-w-0`。
- BFC 触发条件备忘：根元素 / float / `overflow:auto|scroll|hidden` / `display:flow-root|table-cell|inline-block` / `position:absolute|fixed`。
## L-12 等高
- flex 默认 `align-items:stretch` 天然等高；grid 同一行天然等高。Tailwind：`flex items-stretch` / `grid`。
- 不再用 `table-cell` / 负 margin（`margin-bottom:-9999px;padding-bottom:9999px`，会破坏锚点定位）/ border 法。

## L-13 高度
- `height:100%` 无效 → 父级没有显式高度（解析为 auto）。出路：高度链、flex/grid 拉伸、或 `absolute inset-0`。
- 整屏高度：`min-height:100dvh`（动态视口，避开移动端地址栏）；稳定值用 `svh`，最大用 `lvh`。`[补]`
  - Tailwind：`min-h-dvh` / `h-svh`
- 不要用 `100vh` 做移动端整屏。

## L-14 box-sizing
- 旧立场：反对全局 `*{box-sizing:border-box}`（对内联元素无意义，且解决不了水平 margin 的问题），真正刚需是 `input, textarea, img, video` 等替换元素。
- **Tailwind 项目**：Preflight 已内置全局 border-box——**接受它，不要对抗**。但"流优先"原则不变：块级元素仍然不写 `w-full`，只有替换元素/固定部件才定宽。

## L-15 替换元素（img/video/iframe/canvas/input…）
- 三层尺寸：固有尺寸 < HTML 属性 < CSS；与 `display` 无关。默认回退尺寸 300×150。
- 图片自适应：`max-width:100%; height:auto`。Tailwind 的 Preflight 已对 `img, video` 默认设置这两项 ✔复核；需要覆盖时用 `max-w-none`。
- 占位防抖动：`aspect-ratio`。Tailwind：`aspect-video` / `aspect-4/3`；同时给 `width`/`height` 属性。
- 填充裁切：`object-fit`（默认 `fill` 会变形；`scale-down` = `min(none, contain)`；`none` 是原尺寸，不是缩小）。Tailwind：`object-cover` / `object-contain` / `object-scale-down`
- 占位图**省略 `src` 属性**，不要写 `src=""`（空 src 仍会发请求）。HTML
- `content` 生成的是匿名替换元素：不可选中、读屏/SEO 不可达，只做装饰，**重要文本不放 content**。
## L-16 margin
- **margin 不生效排查链**：① 内联非替换元素的垂直 margin（无效）→ ② `table-cell/row` → ③ 与相邻 margin 合并被大值压住 → ④ absolute 未设方位值 → ⑤ 元素/容器尺寸写死、没有可分配空间。
- **margin 合并**：父子/兄弟垂直 margin 合并是布局位移的头号元凶。阻断：父级 `flow-root`、或加 border/padding、或用 flex/grid（它们的子项 margin 不合并）。
- `margin:auto` = 剩余空间分配器：一侧 auto 吃光剩余空间，两侧 auto 平分；前提是元素能"充分利用可用空间"（块级水平方向、absolute 对立方位）。Tailwind：`mx-auto` / `ml-auto`（flex 中把兄弟推到另一端）
- 滚动容器的末端留白：旧结论是 `padding-bottom` 在各浏览器不一致（Firefox 曾忽略）。现状 ✔复核：块轴末端（底部）padding 在 Chrome/Safari 一直计入滚动区域，Firefox 自 89（2021）起对块容器、flex、grid 与 textarea 补齐，所以 `padding-bottom` 现在可以用；行内轴末端（右侧）padding 在引擎间仍可能不一致 `[验]`，横向滚动的尾部留白用最后一个子元素的 `margin-inline-end` 更稳。
- 内联元素的垂直 padding 影响视觉与滚动区域、不影响行高——"扩大点击区"正好利用这点：`py-2` on `inline` 元素。
## L-17 一行 N 个、两端对齐
- 现代：`flex flex-wrap justify-between gap-5`；末行不齐 / 列数不定 → grid（见 L-08/L-09）。
- 不再用"负 margin + float"或"`text-align:justify` + inline-block + 占位标签"。

## L-18 逻辑属性
- 逻辑属性 = `inline/block × start/end`，随书写方向变化。日常**高频的只有 `inset`**（`inset:0` ≡ 四向 0）；`margin-inline`、`padding-inline` 在多语言/RTL 项目里有价值。
- 对称布局（聊天左右气泡）：一侧写好逻辑属性，另一侧容器加 `direction:rtl`；这与 flex 的 `row-reverse` 无关。
- Tailwind：`ms-4 me-4 ps-4 pe-4 start-0 end-0 inset-0 text-start`；方向变体 `rtl:` / `ltr:`。
- 垂直书写 `writing-mode` 是"换轴开关"：垂直流下 margin 合并换轴、`margin:auto`/`text-align:center` 直接垂直居中。Tailwind：`[writing-mode:vertical-rl]`。

## L-19 文字环绕与分栏
- 文字环绕形状：浮动元素 + `shape-outside`。Tailwind：`float-left [shape-outside:circle(50%)]`
- 报纸分栏：`columns`。Tailwind：`columns-3 gap-8`
- `direction` 只改内联顺序，对纯中文文本不会反排；逐字反向要 `unicode-bidi:bidi-override`。
