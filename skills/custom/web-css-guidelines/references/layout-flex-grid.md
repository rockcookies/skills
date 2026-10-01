# flex / grid / columns / Shapes：现代布局

用 flex/grid 搭布局、排障弹性尺寸与轨道尺寸、或在布局方案间选型时读。文档流、float 与 BFC 结界归 [layout-flow.md](./layout-flow.md)；定位归 [positioning.md](./positioning.md)；断点与逻辑属性归 [responsive-logical.md](./responsive-logical.md)。

## 布局选型

CSS2.1 没有专门的布局属性，float 是被逼出来的布局工具；现代布局有四件正牌，按维度与内容形态选：

| 布局 | 维度 | 关键属性 | 适用 |
| --- | --- | --- | --- |
| columns | 分栏 | columns / column-gap / break-inside | 长文报纸式分栏 |
| flex | 一维 | flex 系列 + justify/align | 单行/单列弹性分配 |
| grid | 二维 | template + repeat/fr/minmax + area | 页面骨架、卡片矩阵 |
| Shapes | 环绕 | shape-outside | 文字绕图/绕形 |

还在用 float + 清浮动挤出来的多列布局，一律迁移到 flex/grid。

## 分家产模型：flex-basis / grow / shrink

flex 子项的最终尺寸分两步结算：flex-basis 先分基础家产，容器的富余或缺口再由 flex-grow / flex-shrink 按比例二次分配。

- flex-basis：基础尺寸，默认 auto（参考内容尺寸，类似 width）；与 width 并存时 basis 优先。
- flex-grow：分富余。总和 >1 按比例分完；总和 <1 只分走对应比例——`flex-grow: .5` 只拿一半富余，剩余留白。
- flex-shrink：摊缺口。总和 ≥1 恰好消化不足；总和 <1 收缩不完全，内容照样溢出容器。

```css
/* 基础 100px、不争富余、缺口时双倍分摊；另一项保底 20px、争 3 份富余、缺口时受保护 */
.zhang { flex: 0 2 100px; }
.shuai { flex: 3 0 20px; }
```

反模式：期望调小 flex-shrink 就能容纳溢出内容——shrink 总和 <1 时收缩不完全，溢出仍在。

## flex 缩写不按默认值补全

flex 是唯一省略值不取属性默认值的属性：规范按最常见的实用意图重写计算值。

| 写法 | 计算值 | 与"按默认补全"的差异 |
| --- | --- | --- |
| `flex: 1` | `1 1 0%` | basis 是 0%，不是默认的 auto |
| `flex: 100px` | `1 1 100px` | grow 是 1，不是默认的 0 |

排障任何 flex 尺寸异常，第一步先还原缩写的真实计算值——"以为 `flex: 1` 等于 `1 1 auto`"是大部分尺寸诡异行为的根源。

## 单值四件套 + initial

单值语法语义化，覆盖 95% 场景；语义拿不准时回查此表，不要凭直觉拼三值。

| 单值 | 计算值 | 行为 | 场景 |
| --- | --- | --- | --- |
| `flex: initial` | `0 1 auto` | 不增大、可收缩、内容自适应 | 按钮等小部件；一侧定宽的自适应两栏（容器只设 display:flex） |
| `flex: 0` | `0 1 0%` | basis=0，实际取最小内容宽度 | 内容主体是替换元素的项（图 + 等宽说明文字） |
| `flex: none` | `0 0 auto` | 无弹性，保持最大内容宽度 | 固定尺寸元素免设 width；列表右侧按钮防挤压 |
| `flex: 1` | `1 1 0%` | 弹性，空间不足时优先牺牲自己（类似 table-layout:fixed） | 等分列表、动态内容栏；最常用 |
| `flex: auto` | `1 1 auto` | 弹性，空间不足时优先保留内容（类似 table-layout:auto） | 内容优先的弹性栏 |

```css
.container { display: flex; }
.container > button { flex: none; }  /* 按钮按内容宽，不被挤压，免设 width */
```

## flex 容器侧速查

- flex-direction：row / row-reverse / column / column-reverse；reverse 翻转主轴起点，justify-content 的 flex-start/flex-end 语义随起点走。
- flex-wrap：nowrap 默认；wrap / wrap-reverse。flex-flow 是二者缩写。
- order：只改视觉顺序，DOM 与读屏/tab 顺序不变——无障碍场景慎用。

## flex 最后一行对齐死角

`justify-content: space-between` 把空隙全部塞进元素之间，末行缺项时最后一个元素被顶向行尾——flex 没有"占位补齐"概念，这是它的布局死角。

- 列数固定：去掉 space-between，子项均摊右侧间隙，容器负 margin 抵消最后一份。
- 列数固定且坚持 space-between：给末行补等尺寸空元素或 `::after` 占位。
- 子项宽度不固定：末尾塞一个 `margin-right: auto` 的占位元素。
- 列数不固定且 HTML 不可改：直接换 grid——grid 按轨道排布，天然左对齐，是 flex 死角的标准逃生门。

```css
/* 方案一：4 列固定，flex 内均摊间隙 */
.list {
  display: flex;
  flex-wrap: wrap;
  margin-right: -10px;                 /* 抵消末列多出的一份 */
}
.item { width: calc(25% - 10px); margin-right: 10px; }

/* 方案四：列数不固定，换 grid */
.list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}
```

配方细节见 [patterns.md](./patterns.md)。

## grid 轨道尺寸学

grid-template-columns/rows 值的个数就是轨道数；九类轨道值（长度 / 百分比 / min-content / max-content / auto / fr / repeat() / minmax() / fit-content()）的差异全在"与内容是否相关、上下限在哪"。

| 值 | 语义 | 关键差异 |
| --- | --- | --- |
| `fr` | 纯比例分配剩余空间 | 与内容无关；总和 <1 不铺满，`.25fr` 只拿 25% 可分配空间 |
| `auto` | 内容自适应 | ≈ `minmax(min-content, max-content)`；受 justify-content 影响（stretch 可拉超 max-content），下限可被 min-width 抬高 |
| `minmax(min, max)` | 尺寸区间 | fr 只能当第二参；`minmax(1fr, 200px)` 非法，整列失效 |
| `fit-content(limit)` | 随内容伸缩、封顶 limit | = `max(min-content, min(limit, max-content))`；参数只接受长度/百分比 |

fr 的分配基数随邻居变化：有固定列时先扣固定值，有 auto 列时先扣 auto 列的 fit-content 尺寸。多列 auto 不是等分，而是"以最大的 max-content 为基础同量加宽"。

```css
/* 侧栏固定 + 主区吃满剩余 */
.layout { grid-template-columns: 240px 1fr; }

/* 内容自适应、封顶 320px */
.cards { grid-template-columns: repeat(auto-fill, fit-content(320px)); }
```

网格线可命名：`[main-start] 240px [main-end]`（允许中文，中间线可双名），供 grid-column-start / grid-area 引用——页面级语义布局才值得用，小组件直接用序号与 span。

反模式：fr 总和小于 1 却期待铺满容器；把 minmax 的 fr 写在第一参导致整列失效。

## repeat(auto-fit, minmax(min, 1fr))：响应式卡片起手式

auto-fit / auto-fill 按容器宽自动算列数，`minmax(min, 1fr)` 保证每列不小于 min 且铺满容器——不写一行媒体查询的响应式网格。

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
```

- auto-fit：子项数不足时把空白轨道连同间隙折叠为 0——末行仍铺满容器。
- auto-fill：保留空白匿名轨道——末行元素停在各自列位。
- 限制：auto-fill / auto-fit 不能与 auto 关键字混用（可与固定值混用）；repeat() 轨道列表不可再嵌套 repeat()。

反模式：常规卡片列表用 auto-fill，末行右侧留一截空白轨道。

## grid 骨架属性速查

- grid-template-areas：字符串画区域图，子项用 grid-area 按名放置。
- grid-auto-columns / grid-auto-rows：隐式轨道尺寸。
- grid-auto-flow：row / column 定隐式排列方向；dense 稠密填充补洞。
- grid-column / grid-row / grid-area：区间定位，支持 `span N`、负数倒数（-1 是最后一条线）、命名线。
- gap / column-gap / row-gap：flex / grid / columns 三布局通用。
- 缩写：grid-template；`grid: rows / columns`。

## 对齐命名法：justify × align × 三作用域

对齐属性名是"坐标系 × 作用对象"的二维矩阵，记住矩阵即可推出所有属性名：

| 作用对象 | justify-（水平 / 主轴） | align-（垂直 / 交叉轴） |
| --- | --- | --- |
| 整体（所有行/列作为整体） | justify-content | align-content |
| 每项 | justify-items（仅 grid） | align-items |
| 单项 | justify-self（仅 grid） | align-self |

- 弹性布局用 flex-start / flex-end（随主轴方向），网格布局用 start / end。
- justify-content 语法初始值是 normal：flex 中表现为 flex-start，grid 中表现为 stretch——文档讲"默认值"指当前布局中的实际表现。
- 对齐属性只在 flex / grid 中生效，但语法在所有布局中合法。
- space-between 只分中间；space-around 两侧各半份；space-evenly 完全均等。
- align-items: baseline 把所有子项的文字基线拉到一条线，不是底边对齐——底边对齐用 flex-end。
- align-content 只在 wrap 出多行后生效。

```css
.row { display: flex; align-items: baseline; }  /* 子项文字基线一条线 */
```

place-items / place-content / place-self 是 align 与 justify 的二元缩写（垂直在前）。

## columns：报纸分栏

columns 让长文按列流动，适合杂志式排版；栏数由容器宽度与 column-width 协商得出。

| 属性 | 作用 |
| --- | --- |
| columns / column-width / column-count | 栏宽或栏数（宽度够就自动多栏） |
| column-gap | 栏间距 |
| column-rule | 栏间分隔线 |
| break-inside: avoid | 防卡片跨栏断裂 |

```css
.article { columns: 3; column-gap: 2em; }
.article > .card { break-inside: avoid; }
```

## CSS Shapes：文字环绕任意形状

shape-outside 只作用于浮动元素：让后续文字按形状而不是矩形边框环绕。为什么环绕布局的前置条件仍是 float，归 [layout-flow.md](./layout-flow.md)。

- 值 = `<shape-box> || <basic-shape> | <image>`；形状函数 circle() / ellipse() / inset() / polygon() / path()。
- 图片作形状源时配 shape-image-threshold：按透明度阈值划定形状范围。
- shape-margin 给形状外加一圈间距。

```css
.avatar {
  float: left;
  shape-outside: circle(50%);
  shape-margin: 10px;
}
```

反模式：给非浮动元素设 shape-outside——不生效，先确认 float。
