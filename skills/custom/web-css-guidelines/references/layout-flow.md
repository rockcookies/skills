# 流布局与盒模型

管普通文档流的尺寸与空间分配机理：width/height 解析、min/max 覆盖、margin/padding 行为、BFC、float、overflow、计算函数。写或排障两栏自适应、高度撑不开、margin 失效、清浮动等问题时读；弹性与网格见 layout-flex-grid.md，定位见 positioning.md，内联世界见 inline-box.md。

## 双盒子体系

每个元素由「外在盒子 + 内在盒子」两层构成，width 只作用于其中一层——这是理解一切尺寸行为的起点。

- **外在盒子**：决定元素能否与其他元素同行显示，对应 `display` 值的第一个词。
- **内在盒子（容器盒子）**：承载宽高与内容呈现。
- `display:block` 应脑补为 `block flow`——外块级、内块级；`inline-block` = 外内联、内块级，所以既与图文同行又能设宽高。
- `width` / `height` / `box-sizing` 只作用于内在盒子，与外在盒子无关。
- 判据：改 `display` 只改变内外组合，不改变内容尺寸规则；替换元素尺寸另成体系，见 [替换元素](./visibility-media.md)。

## width:auto 的四种表现

`width:auto` 不是一种行为而是四种，判断宽度问题先判断处于哪一种；内部/外部尺寸体系是它们的规范名。

| 表现 | 规范名 / 显式关键字 | 典型元素 | 尺寸归属 |
|---|---|---|---|
| 铺满可用空间 | fill-available / `stretch` | div、p | 外部尺寸（唯一一种） |
| 包裹收缩 | shrink-to-fit / `fit-content` | inline-block、float、absolute | 内部尺寸 |
| 收缩到最小 | min-content（首选最小宽度） | `table-layout:auto` 断字单元格 | 内部尺寸 |
| 超出容器限制 | max-content | nowrap、连续英文数字 | 内部尺寸 |

判据：元素没有内容时宽度为 0 → 内部尺寸；宽度由上下文给定 → 外部尺寸。

- **首选最小宽度**（min-content）：中文 = 一个汉字宽；英文 = 连续字符单元（空格、短横线、问号等处断开）；替换元素 = 内容宽。`word-break:break-all` 让英文逐字断行。
- 造物主视角：CSS 为图文而生，图文权重高于布局，所以 `width:auto` 时内容元素的宽度永远不会是 0——首选最小宽度由此存在。
- `fit-content` 把包裹性显式化，且给出**确定的尺寸值**，可参与 `margin:auto` 居中（见 [流体特性](./positioning.md)）；它还保护 display 计算值（如 `li` 设 `display:table` 会丢项目符号）。陷阱：Firefox 认 `height:fit-content` 语法但无效果，别用 `@supports (height: fit-content)` 做检测。
- `min-content` 的最终值 = 所有子元素中的最大者；它也是理解 flex/grid 尺寸不足的钥匙（见 [layout-flex-grid](./layout-flex-grid.md)）。
- `max-content` 实际都可用 `white-space:nowrap` 替代，价值在概念本身。
- `stretch`（旧名 fill-available）声明三连 `-webkit-fill-available → -moz-available → stretch`；块级与 flex/grid 子项天生如此，仅在标签受限无法宽度分离时用（如 button）。Firefox 上 table 元素的 `-moz-available` 渲染等同 100%，table 别加 `-moz-`。

包裹性处方——「文字少居中、多行居左」一层标签：

```css
.box     { text-align: center; }
.content { display: inline-block; text-align: left; }
```

文字少时 `.content` 被内容包裹而居中；文字多时撞到容器宽度上限自动换行，内层 `left` 生效。

反模式：

- 块级元素再写 `width:100%`——默认已铺满，加 margin/padding 反而溢出（流动性丢失）。
- 「砌砖头」手算宽度（容器 − padding − margin）：模块一变全盘重算，用流动或宽度分离替代。
- 以为浮动元素是内联级别——与文字同行只是恰好站在一起，实际已块状化、脱离文档流。

## 无宽度、宽度分离与 box-sizing

流动性不是「宽度 100%」，而是 margin/border/padding 与 content 自动分配水平空间的机制；设了固定宽度，流动性就死。

- 鑫三无（无宽度、无图片、无浮动）：布局总则——全站理论上只需最外层一个 width。
- 宽度分离原则：width 不与影响宽度的 padding/border 共存，width 独占一层标签，内层靠流动自适应——改 padding 无需重算宽度。
- `box-sizing:border-box` 的刚需对象是替换元素（input/textarea 的自适应），非替换元素用宽度分离更彻底。

```css
/* 宽度分离：外层定宽，内层流动 */
.father { width: 102px; }
.son    { border: 1px solid; padding: 20px; }

/* 替换元素才需要 border-box 重置 */
input, textarea, img, video, object { box-sizing: border-box; }
```

反模式：全局 `*{box-sizing:border-box}`——对内联元素和默认即 border-box 的控件是无谓消耗，解决不了含水平 margin 的场景；padding 过大时 width 依然败给首选最小宽度。

## min/max 覆盖铁律

min/max 不是软约束，而是在使用值阶段钳制 width/height 的覆盖层，优先级高于级联结果。

| 属性 | 初始值 | 覆盖关系 |
|---|---|---|
| width / height | auto | 被 max-* 覆盖（连 `style` + `!important` 的 width 也压不过） |
| max-width / max-height | none | 被 min-* 覆盖 |
| min-width / min-height | **auto**（不是 0） | 三者中最强 |

可用性顺序：`min-width > max-width > width`。

```css
/* max-height 展开收起动画：展开值取「足够安全的最小值」，过大时收起有前段延迟感 */
.element        { max-height: 0; overflow: hidden; transition: max-height .25s; }
.element.active { max-height: 666px; }
```

## height:100% 失效机理

百分比高度需要父级有可解析的显式高度，否则规范令其回退 auto。

- 父级高度非显式（auto）时，子元素的百分比高度被解析为 `auto`（auto × 100% 无法计算）——不是 bug，也不是死循环，渲染一次到位。
- 同场景下宽度是未定义行为，浏览器选择让百分比生效——所以「高度失效、宽度不失效」。
- 出路一：显式高度链，从 html/body 一路设下来。
- 出路二：绝对定位（宽高百分比基准变为包含块 padding box），见 [positioning](./positioning.md)。

```css
html, body { height: 100%; }
```

## margin 镜像法则与 auto 分配

margin 与 padding 在「能否改变元素尺寸」上互为镜像，谁能改尺寸取决于元素处于哪种尺寸状态。

- 元素处于外部尺寸（fill-available）时：margin 参与空间分配、改变元素尺寸；padding 只挤占 content、不改元素总宽。
- 元素处于内部尺寸（定宽/包裹）时：padding 撑大元素，margin 不再改变尺寸。
- 垂直方向只有绝对定位对立拉伸态的 margin 才改变尺寸（见 [流体特性](./positioning.md)）。
- `margin:auto` 是剩余空间分配器，前提是元素有自动填充能力（块级水平方向、绝对定位对立方位）：一侧定值一侧 auto → auto 拿走全部剩余；两侧 auto → 平分剩余。

```css
/* 定宽块水平居中 */
.center-block { width: 200px; margin: 0 auto; }
```

## 垂直 margin 合并

块级元素（不含浮动/绝对定位）的垂直 margin 会合并为一个：同号取绝对值大者，异号相加。

三种场景：

1. 相邻兄弟。
2. **父子**（父与第一个/最后一个子元素）——子的 margin 全数合到父上，「父没出力、子出全力」，是布局莫名位移的头号元凶。
3. 空块级元素自身合并（`margin:1em 0` 的空 div 高度就是 1em）。

阻断五法（以父子场景为例）：父元素触发 BFC / 父设 `border-top|bottom` / 父设 `padding-top|bottom` / 父子之间加内联元素 / 父设 `height|min-height|max-height`（仅 bottom 侧有效）。

```css
/* 父子合并的两种典型修法 */
.father { border-top: 1px solid transparent; }  /* 阻断一：border */
.father { overflow: hidden; }                   /* 阻断二：BFC 结界 */
```

## margin 无效排查序

margin「失效」各有原因，按此序排查：先看 display，再看合并，再看剩余空间。

| 症状 | 元凶 | 处方 |
|---|---|---|
| 内联非替换元素垂直 margin | 规范要求渲染但浏览器无踪迹 | 改垂直 padding |
| table-cell / table-row 的 margin | 结构性盒子无 margin | 移到外层；table/inline-table/table-caption 有效 |
| 合并场景改小值 | 被较大合并值掩盖 | 改更大值或负值 |
| 绝对定位非定位方位的 margin | 其实一直有效（改变外部尺寸），只是不影响兄弟 | 不是 bug，无需修 |
| 定高容器的 margin-bottom、定宽子的 margin-right | 超出无处体现，视觉假象 | 检查容器约束 |
| 滚动容器 padding-bottom 留白无效 | Firefox 忽略（见 overflow 节） | 改子元素 margin-bottom |

内联替换元素（img）垂直 margin 有效且永不合并（体系见 [替换元素](./visibility-media.md)）。

## padding 行为

padding 温和，但百分比基准与内联场景各有一个反直觉点。

- padding 百分比水平垂直都相对**宽度**——等比例矩形的实现基础。
- 内联元素的垂直 padding 视觉有效、也影响布局（父容器 `overflow:auto` 会出滚动条），只是不参与行高计算——「加 padding 扩点击区」正是利用此特性。
- 内联元素 padding 随行框盒子断行，并让 strut 显形：空 span 设 `padding:50%` 高宽不一，机理见 [strut](./inline-box.md)，修复用 `font-size:0`。

```css
.square  { padding: 50%; }          /* 正方形 */
.banner  { padding: 10% 50%; }      /* 5:1 头图 */
.hotzone { padding: 8px 12px; }     /* 内联元素扩点击区，不撑行高 */
```

## BFC 结界

BFC 是 CSS 世界的结界：内部子元素再怎么翻江倒海都不影响外部，因此它天然不 margin 合并、天然清除浮动影响。

触发清单：根元素 / `float` ≠ none / `overflow` 为 auto、scroll、hidden / `display` 为 flow-root、table-cell、table-caption、inline-block / `position` 为 absolute、fixed（即 ≠ relative|static）。现代项目清浮动与隔离布局首选 `display:flow-root`——语义最明确、无 overflow 副作用。

用途按价值排序：

1. **自适应布局**（最重要）：浮动元素旁边的 BFC 块盒自动收缩避让，且宽度不限。
2. 清除浮动影响。
3. 阻断 margin 合并。

```css
/* 一侧定宽：浮动破坏流 + 兄弟 margin 避让，保流动性 */
.father       { overflow: hidden; }    /* BFC 结界包裹 */
.father > img { float: left; }
.animal       { margin-left: 70px; }   /* 保持流动，自适应 */

/* 宽度不定的自适应栏：直接触发 BFC，无需计算避让宽度 */
.animal { display: table-cell; width: 9999px; }  /* 或 overflow:hidden 等 */
```

## float 机制

float 为文字环绕而生：高度塌陷是标准行为不是 bug，塌陷与行框限缩共同成就环绕。

四特性：

- **包裹性**：宽度收缩适配内容，上限受首选最小宽度约束。
- **块状化**：display 计算值变 block（inline-table 例外变 table）——float 后再写 `display:block`、`vertical-align` 都多余，text-align 对其无效。
- **破坏性**：脱离文档流，父元素高度塌陷。
- 无 margin 合并。

对齐机制双术语：

- **浮动参考**：float 元素对齐的是**行框盒子**，不是包含块。
- **浮动锚点**：float 在流中的一个点，表现如空的内联元素，作用是产生行框盒子，使纯块级上下文也有对齐参考。
- **行框盒子与浮动元素不可重叠**：块盒可与浮动完全重叠，但块盒内的行框盒子被限死在浮动一侧，margin 负值也推不动——这就是文字环绕的实现本质。

```css
/* 「标题 + 更多」：浮动参考决定"更多"落在哪 */
h3 .more { float: right; }
```

标题一行时「更多」在第一行右侧；标题两行时对齐**最后一行**行框盒子的右侧；标题恰好占满两行时「更多」孤零零落到第三行。要让「更多」永远在第一行，把它放在标题文字**前面**。

## clear 与清浮动处方

clear 的官方语义是「元素盒的边不能和前面的浮动元素相邻」——是自身避让，不是清除浮动。

- `clear:left/right` 无使用价值：起效时必等价于 `both`，且只对前面的浮动生效。
- `clear:both` 的局限：前面是浮动元素时自身 margin-top 负值无效；后面的元素仍会被环绕。
- 想彻底摆脱浮动影响 → 容器触发 BFC（首选，见上文）。
- 需要在流内撑开父容器高度 → `:after` 清浮动。

```css
.clear::after { content: ''; display: table; clear: both; }  /* block 或 table 皆可 */
```

反模式：见 div 就加 clearfix——多数场景容器触发 BFC 一行解决，且结界连 margin 合并、环绕影响一并隔离。

## overflow

overflow 的剪裁与滚动界线是 border box 内边缘，不是 padding 外边缘。

- 「剪裁 + 四周留白」用透明边框实现，padding 无能为力（border 图形见 [background-border](./background-border.md)）。
- overflow-x/y 组合规则：一方 visible、另一方 auto|scroll|hidden 时，visible 按 auto 解析——不存在一向滚动、一向溢出显示；`overflow-x:hidden` 后再写 `overflow-y:auto` 是冗余。
- PC 端滚动条来自 `<html>`；Windows 滚动栏精确占宽 17px，居中布局加载时晃动由此而来——预留之。
- 滚动容器底部留白：Chrome 把 padding-bottom 计入滚动尺寸，Firefox 忽略（触发滚动条的判定基准不同，未定义行为）——一律用子元素 margin-bottom。

```css
html { overflow-y: scroll; }                 /* 预留滚动条宽度，消除加载晃动 */

.scroll-area > :last-child { margin-bottom: 2rem; }  /* 底部留白唯一可靠写法 */
```

## calc() / min() / max() / clamp()

计算函数把「声明期运算」带进 CSS，是 CSS 变量的算术底座。

calc 规则：

- 单位值只能加减不能乘除（`10px * 10px` 非法）；除法右侧必须是非 0 数值。
- `+` `-` 两侧必须有空格（否则被当作正负号解析），`*` `/` 不需要。
- 变量驱动样式的底座：`width: calc(1% * var(--percent))`。

min/max/clamp（可与 calc 互相嵌套）：

| 函数 | 取值 | 实际作用 |
|---|---|---|
| `min(a, b)` | 取小 | **限制最大值** |
| `max(a, b)` | 取大 | **限制最小值** |
| `clamp(MIN, VAL, MAX)` | 区间 | ≡ `max(MIN, min(VAL, MAX))` |

```css
/* 一行替代 width + max-width 两行 */
.box { width: min(1024px, 100%); }

/* 流式根字号：旧浏览器用 16px 声明兜底 */
html { font-size: 16px;
       font-size: clamp(16px, calc(16px + 2 * (100vw - 375px) / 39), 20px); }
```

反模式：`calc(100%-2rem)` 缺空格，不合法。
